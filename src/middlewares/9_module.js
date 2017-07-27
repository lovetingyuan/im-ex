const path = require('path')
const fs = require('fs')

const response = require('../services/sendRes')
const readFile = require('../services/readFile')

// const url = require('url')
module.exports = function () {
  return function (req, res, next) {
    if (!/^js(x)?$/.test(req.locals.ext)) return next()
    if (res.body) {
      response(res, res.body)
    } else {
      const fileContent = readFile(req.locals.filePath)
      if (req.query.action === 'resolve') {
        const importResolve = config.resolve.import[req.query.import]
        let newFileContent = fileContent, exportConf = importResolve.export
        if (typeof exportConf === 'function') {
          newFileContent = exportConf(fileContent)
        } else if (typeof exportConf === 'string') {
          newFileContent = `
            ${fileContent}; export default ${exportConf};
          `
        } else if (typeof exportConf === 'object' && exportConf) {
          const nameSpace = exportConf.default;
          newFileContent = `(function(){${fileContent}}).call(window);\n` +
            exportConf.inner
              .map(func => `const ${func} = ${nameSpace}.${func};`)
              .concat([
                `export {${exportConf.inner.join(', ')}};`,
                `export default ${nameSpace};`
              ]).join('\n')
        }
        response(res, newFileContent)
      } else {
        response(res, fileContent)
      }
    }
  }
}