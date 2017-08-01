const babylon = require('babylon')
const traverse = require('babel-traverse').default;
const generate = require('babel-generator').default

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

module.exports = function resolveImport(code, callback) {
  const ast = babylon.parse(code, {
    sourceType: 'module',
    allowImportExportEverywhere: false
  })
  traverse(ast, {
    enter(path) {
      if (isImportNode(path)) {
        const moduleName = path.node.value
        callback(moduleName)
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
    }
  })
  return generate(ast, {}, code).code
}
