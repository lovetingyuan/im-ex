const path = require('path')
const babylon = require('babylon')
const traverse = require('babel-traverse').default;
const generate = require('babel-generator').default
const fs = require('fs')
const slash = require('slash')
const { join, resolve, extname, relative } = require('path').posix

const response = require('../services/sendRes')
const readFile = require('../services/readFile')
const chalk = require('chalk')
const sass = require('sass.js/dist/sass.node')
const less = require('less')
const babel = require('babel-core')

const warningModule = {} 

const isImportNode = path => {
  return (path.type === 'StringLiteral' &&
    path.container.type === 'ImportDeclaration' &&
    path.node.type === 'StringLiteral')
}
// 'react', 'lodash/map', './list.js'
const isThirdModule = value => {
  return (value[0] !== '/' && value[0] !== '.' && !/^http(s)?:\/\//.test(value))
}

const nodeModulesPath = value => {
  const list = value.split('/')
  if (list.length === 1) {
    const moduleName = list[0]
    const modulePkg = slash(join(config.root, 'node_modules', moduleName, 'package.json'))
    const pkg = require(modulePkg)
    let mainField = pkg.module || pkg['jsnext:main'], moduleType = 'es6'
    if (!mainField) {
      mainField = pkg['umd:main']
      moduleType = 'umd'
    }
    if (!mainField) {
      mainField = pkg.browser || pkg.main
      moduleType = 'commonjs'
    }
    if (!extname(mainField)) mainField += '.js'
    return join('/node_modules', moduleName, mainField) + '?type=thirdModule&moduleType=' + moduleType + '&moduleName=' + moduleName
  } else {
    if (!extname(value)) value += '.js'
    return '/node_modules/' + value + '?type=thirdModule&moduleType=spec'
  }
}

function resolveImportModule(path) {
  let moduleName = path.node.value
  if (isThirdModule(moduleName)) {
    if (moduleName in config.resolve.import) {
      let resPath = config.resolve.import[moduleName].path
      if (!/^\/node_modules\//.test(resPath)) {
        resPath = join('/node_modules', moduleName, resPath)
      }
      // request with import query word means it has been resolve by config
      path.node.value = resPath + '?type=thirdModule&moduleType=resolvedUmd&moduleName=' + moduleName
    } else {
      if (!warningModule[moduleName]) {
        warningModule[moduleName] = moduleName
        console.warn(chalk.redBright(`Warning: there is no resolve config for "${moduleName}"`))
      }
      path.node.value = nodeModulesPath(moduleName)
    }
  } else {
    if (!extname(moduleName)) {
      moduleName += '.js'
    }
    path.node.value = moduleName + '?type=module'
    // path.node.value += ('?_t=' + Date.now())
  }
}

function resolveImport(code) {
  const ast = babylon.parse(code, {
    sourceType: 'module',
    allowImportExportEverywhere: false,
    plugins: ["jsx"]
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
        if (status) reject(new Error(`sass compile error: ${req.path} with status: ${status}`))
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
    const { ext } = req.locals
    if (ext === 'jsx') {
      resolve(jsx(req).then(code => resolveImport(code)))
    } else {
      const fileContent = readFile(req.locals.filePath)
      const type = req.query.type
      if (type === 'module') {
        resolve(resolveImport(fileContent))
      } else if (type === 'thirdModule') {
        const moduleType = req.query.moduleType
        if (moduleType === 'es6') {
          resolve(resolveImport(fileContent))
        } else if (moduleType === 'umd') {
          resolve(`(function(){${fileContent}}).call(window);`)
        } else if (moduleType === 'resolvedUmd') {
          const moduleName = req.query.moduleName
          resolve(umdToModule(fileContent, moduleName))
        } else if (moduleType === 'commonjs') {
          resolve(`
            const module = {}, exports = {};
            module.exports = exports;
            ${fileContent};
            export default module.exports;
          `)
        } else {
          resolve(resolveImport(fileContent))
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
