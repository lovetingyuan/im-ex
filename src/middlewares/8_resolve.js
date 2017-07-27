const path = require('path')
const babylon = require('babylon')
const traverse = require('babel-traverse').default;
const generate = require('babel-generator').default
const fs = require('fs')
const { join, resolve, extname } = require('path').posix

const response = require('../services/sendRes')
const readFile = require('../services/readFile')
const chalk = require('chalk')

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
    if (!path.extname(esModule)) esModule += '.js'
    return join('/node_modules', moduleName, esModule) + '?type=module'
  } else {
    if (!path.extname(value)) value += '.js'
    return '/node_modules/' + value + '?type=module'
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
      path.node.value = resPath + '?type=thirdModule&action=resolve&import=' + moduleName
    } else {
      path.node.value = nodeModulesPath(moduleName)
    }
  } else {
    if (!extname(moduleName)) {
      path.node.value = moduleName + '.js?type=module'
    } else {
      path.node.value = moduleName + '?type=module'
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
// const url = require('url')
module.exports = function () {
  return function (req, res, next) {
    if (!/^js(x)?$/.test(req.locals.ext)) return next()
    if (req.query.action === 'resolve') {
      next()
    } else {
      res.body = resolveImport(res.body || readFile(req.locals.filePath))
      next()
    }
  }
}