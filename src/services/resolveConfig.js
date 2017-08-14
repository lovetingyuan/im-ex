// TODO check config format, provide a default config
const path = require('path')
const fs = require('fs')
const Ajv = require('ajv')
const { handleError, toAbsolutePath } = require('./utils')
const configSchema = {
  type: 'object',
  required: ['server', 'entry'],
  additionalProperties: false,
  properties: {
    server: {
      type: 'object',
      required: ['root'],
      additionalProperties: false,
      properties: {
        root: {
          type: 'string',
        }, // relative to this config file
        host: {
          type: 'string',
          default: '127.0.0.1',
          oneOf: [{
            const: 'localhost'
          }, {
            format: 'ipv4'
          }]
        },
        port: {
          type: 'integer',
          default: 8080,
          oneOf: [{
            enum: [80, 443]
          }, {
            maximum: 2e16 - 1,
            minimum: 1024
          }]
        },
        https: {
          type: 'boolean',
          default: false
        },
        index: {
          type: 'string',
          default: path.resolve(__dirname, '../public/index.html')
        }, // default ./index.}html
        reload: {
          enum: [true, false, 'hot'],
          default: 'hot'
        }, // true, false, 'hot', default: 'hot'
        headers: {
          type: 'object',
          patternProperties: {
            '.+': { type: 'string' }
          }
        }, // √
        historyFallback: {
          type: 'boolean',
          default: false
        }, // serve index.html to in place of 404
        open: {
          type: 'boolean',
          default: true
        }, // open browser, default: true   √
        // log: '', // 'page', 'console', where to show server error, default is 'console'
        // setup(app) {
        //   // app.get()  √
        // },
      }
    },
    entry: {
      type: 'string', format: 'abPath'
    },
    resolve: {
      type: 'object',
      additionalProperties: false,
      default: {},
      properties: {
        import: {
          type: 'object',
          default: {},
          additionalProperties: true,
          propertyNames: {
            format: 'validPackageName',
          },
          patternProperties: {
            '.+': {
              oneOf: [{
                type: 'string',
                format: 'abPath',
              }, {
                type: 'object',
                additionalProperties: false,
                required: ['path', 'export'],
                properties: {
                  path: { type: 'string', format: 'abPath', },
                  export: {
                    oneOf: [{
                      type: 'string', minLength: 1
                    },
                    { type: 'null' }
                    ]
                  },
                }
              }]
            }
          }
        },
        exts: {
          type: 'array',
          items: { type: 'string' },
          default: ['js']
        },
        res: {
          type: 'object',
          default: {},
          propertyNames: { enum: ['script', 'style', 'file', 'raw', 'json'] },
          additionalProperties: false,
          patternProperties: {
            '.+': {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      }
    },
    global: {
      type: 'object',
      additionalProperties: true,
      default: {}
    },
    head: {
      type: 'object',
      additionalProperties: false,
      default: {},
      properties: {
        title: { type: 'string', default: 'imex' },
        meta: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: {
              type: 'array',
              items: { type: 'string' }
            },
            httpEquiv: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        favicon: { type: 'string', format: 'abPath' },
        scripts: { type: 'array', items: { type: 'string' }, default: [] },
        styles: { type: 'array', items: { type: 'string' }, default: [] }
      }
    }
  }
}

function checkConfig(userConfig) {
  const ajv = new Ajv({
    formats: {
      validPackageName(val) {
        if (val[0] === '.' || val[0] === '/') return false
        return /^[@\-\/\.\w]+$/.test(val)
      },
      abPath(val) { // ./sdf, /sdfs, sdfsd
        let noDS = char => char !== '/' && char !== '.'
        if (val.indexOf('./') === 0 && noDS(val[2])) return true
        if (val[0] === '/' && noDS(val[1])) return true
        if (noDS(val[0])) return true
        return false
      }
    },
    removeAdditional: true,
    useDefaults: true
  })
  const valid = ajv.validate(configSchema, userConfig)
  if (!valid) {
    handleError(ajv.errors.map(error => {
      return `at config${error.dataPath}, ${error.message}`
    }).join('\n'))
  }
  return userConfig
}

function getFinalConfig(cp) {
  // config中的所有路径配置都必须对于server.root的相对路径
  // server.root则需要配置相对于config文件的路径
  const configPath = path.resolve(process.cwd(), cp)
  try {
    var _config = require(configPath)
  } catch (e) {
    handleError('the config does not exist' + e)
  }
  if (typeof _config === 'function') {
    _config = config()
  }
  let noop = function () { }
  let setup = noop
  if (_config.server && typeof _config.server === 'object') {
    setup = _config.server.setup || noop
  }
  const importExportFuncs = {}
  if (_config.resolve && _config.resolve.import) {
    Object.keys(_config.resolve.import).forEach(importer => {
      let resolved = _config.resolve.import[importer]
      if (typeof resolved === 'object' && resolved && typeof resolved.export === 'function') {
        importExportFuncs[importer] = resolved.export
        resolved.export = null
      }
    })
  }
  const userConfig = checkConfig(_config)
  userConfig.server.setup = setup
  if (userConfig.resolve && userConfig.resolve.import) {
    Object.keys(userConfig.resolve.import).forEach(importer => {
      let resolved = userConfig.resolve.import[importer]
      if (importer in importExportFuncs) {
        resolved.export = importExportFuncs[importer]
      }
    })
  }

  userConfig._browserNameSpace = '__IMEX__'
  userConfig._sse = '__sse__'
  userConfig._server = {
    root: path.resolve(path.dirname(configPath), userConfig.server.root)
  }
  userConfig._entry = toAbsolutePath(userConfig.entry)
  userConfig._head = {
    favicon: toAbsolutePath(userConfig.head.favicon)
  }

  Object.keys(userConfig.resolve.import).forEach(moduleName => {
    const resolve = userConfig.resolve.import[moduleName]
    if (typeof resolve === 'string') {
      userConfig.resolve.import[moduleName] = toAbsolutePath(resolve)
    } else {
      userConfig.resolve.import[moduleName].path = toAbsolutePath(resolve.path)
    }
  })

  return userConfig
}

config = getFinalConfig('./config.js') // export config to global scope