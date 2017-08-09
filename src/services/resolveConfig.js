// TODO check config format, provide a default config
const path = require('path')
const fs = require('fs')
const { handleError, toAbsolutePath } = require('./utils')

function checkConfig(userConfig) {
  return true // TODO
}

function applyDefaultOptions(userConfig) {
  return Object.assign({}, userConfig)
}

function getFinalConfig(cp) {
  // config中的所有路径配置都必须对于server.root的相对路径
  // server.root则需要配置相对于config文件的路径
  const configPath = path.resolve(process.cwd(), cp)
  try {
    var _config = require(configPath)
  } catch(e) {
    handleError('the config does not exist' + e)
  }
  if (typeof _config === 'function') {
    _config = config()
  }
  if (!checkConfig(_config)) handleError('the config is not valid')

  const userConfig = applyDefaultOptions(_config)

  userConfig._browserNameSpace = '__IMEX__'
  userConfig._sse = '__sse__'
  userConfig._server = {
    root: path.resolve(path.dirname(configPath), userConfig.server.root)
  }
  userConfig._entry = toAbsolutePath(userConfig.entry)
  userConfig._head = {
    favicon: toAbsolutePath(userConfig.head.favicon)
  }

  return userConfig
}

config = getFinalConfig('./config.js') // export config to global scope
console.log('343')