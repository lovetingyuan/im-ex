const path = require('path')
const babylon = require('babylon')
const traverse = require('babel-traverse').default;
const generate = require('babel-generator').default
const fs = require('fs')
const { join, resolve, extname, relative } = require('path').posix

const response = require('../services/sendRes')
const readFile = require('../services/readFile')
const chalk = require('chalk')
const sass = require('sass.js/dist/sass.node')
const less = require('less')
const babel = require('babel-core')

const isImportNode = path => {
  return (path.type === 'StringLiteral' &&
    path.container.type === 'ImportDeclaration' &&
    path.node.type === 'StringLiteral')
}
// 'react', 'lodash/map', './list.js'
const isNodeModuleStyle = value => {
  return (value[0] !== '/' && value[0] !== '.' && !/^http(s)?:\/\//.test(value))
}

const nodeModulesPath = value => {
  const list = value.split('/')
  if (list.length === 1) {
    const moduleName = list[0]
    const modulePkg = join(config.root, 'node_modules', moduleName, 'package.json')
    const pkg = require(modulePkg)
    let esModule = pkg.module || pkg['jsnext:main']
    const esModuleFallback = pkg.browser || pkg['umd:main'] || pkg.main
    if (!esModule) {
      esModule = esModuleFallback
      console.warn(chalk.bold.red(`Warning: ${moduleName} has no es6 module package`));
    }
    if (!extname(esModule)) esModule += '.js'
    return join('/node_modules', moduleName, esModule) + '?type=thirdModule'
  } else {
    if (!extname(value)) value += '.js'
    return '/node_modules/' + value + '?type=thirdModule'
  }
}

function resolveImportModule(path) {
  const moduleName = path.node.value
  if (isNodeModuleStyle(moduleName)) {
    if (moduleName in config.resolve.import) {
      let resPath = config.resolve.import[moduleName].path
      if (!/^\/node_modules\//.test(resPath)) {
        resPath = join('/node_modules', moduleName, resPath)
      }
      path.node.value = resPath + '?type=thirdModule&import=' + moduleName
    } else {
      path.node.value = nodeModulesPath(moduleName)
    }
  } else {
    if (!extname(moduleName)) {
      path.node.value = moduleName + '.js?type=module&_t=' + Date.now()
    } else {
      path.node.value = moduleName + '?type=module&_t=' + Date.now()
    }
    // path.node.value += ('?_t=' + Date.now())
  }
}

function resolveImport(code) {
  const ast = babylon.parse(code, {
    sourceType: 'module',
    allowImportExportEverywhere: false
  })
  traverse(ast, {
    enter(path) {
      if (isImportNode(path)) {
        resolveImportModule(path)
      }
    }
  })
  return generate(ast, {}, code).code
}

const jsx = req => {
  return new Promise((resolve, reject) => {
    babel.transformFile(req.locals.filePath, {
      plugins: [['transform-react-jsx', { useBuiltIns: true }]]
    }, (err, result) => err ? reject(err) : resolve(result.code))
  })
}

const css = req => {
  const ext = req.locals.ext
  const resolveCss = code => `__TY__.setStyle(\`${code}\`);`
  return new Promise((resolve, reject) => {
    if (ext === 'scss' || ext === 'sass') {
      sass(req.locals.filePath, ({ status, text }) => {
        if (status) reject(new Error('sass compile error: ' + req.path))
        else resolve(resolveCss(text))
      });
    } else if (ext === 'less') {
      less.render(readFile(req.locals.filePath), (e, output) => {
        e ? reject(e) : resolve(resolveCss(output.css))
      });
    } else {
      resolve(resolveCss(readFile(req.locals.filePath)))
    }
  })
}

const umdToModule = (code, importName) => {
  const importResolve = config.resolve.import[importName]
  let newFileContent = code, exportConf = importResolve.export
  if (typeof exportConf === 'function') {
    newFileContent = exportConf(code)
  } else if (typeof exportConf === 'string') {
    newFileContent = `${code}; export default ${exportConf};`
  } else if (typeof exportConf === 'object' && exportConf) {
    const nameSpace = exportConf.default;
    newFileContent = `(function(){${code}}).call(window);\n` +
      exportConf.inner
        .map(func => `const ${func} = ${nameSpace}.${func};`)
        .concat([
          `export {${exportConf.inner.join(', ')}};`,
          `export default ${nameSpace};`
        ]).join('\n')
  }
  return newFileContent
}

const script = req => {
  return new Promise((resolve, reject) => {
    const ext = req.locals.ext
    if (ext === 'jsx') {
      resolve(jsx(req).then(code => resolveImport(code)))
    } else {
      const fileContent = readFile(req.locals.filePath)
      const type = req.query.type
      if (type === 'module') {
        resolve(resolveImport(fileContent))
      } else if (type === 'thirdModule') {
        const importName = req.query.import
        if (!importName) { // has no resolve config
          resolve(resolveImport(fileContent))
        } else {
          resolve(resolveImport(umdToModule(fileContent, importName)))
        }
      } else {
        resolve(resolveImport(fileContent))
      }
    }
  })
}
const json = req => {
  return new Promise((resolve, reject) => {
    const ret = require(req.locals.filePath)
    resolve(`export default ${JSON.stringify(ret)};`)
  })
}

module.exports = function () {
  return function (req, res, next) {
    if (!req.query.type) return next()
    const ext = req.locals.ext
    let ret
    if (['js', 'jsx'].includes(ext)) {
      ret = script(req)
    } else if (['css', 'scss', 'sass', 'less'].includes(ext)) {
      ret = css(req)
    } else if (ext === 'json') {
      ret = json(req)
    } else if (['jpg', 'jpeg', 'webp', 'png', 'gif', 'bmp', 'svg'].includes(ext)) {
      if (req.query.type === 'file') {
        next()
      } else {
        const relativePath = relative(config.server.root, req.path)
        response(res, `export default "${relativePath}?type=file";`)
      }
    } else {
      next()
    }
    if (ret) {
      ret.then(code => response(res, code)).catch(next)
    }
  }
}
