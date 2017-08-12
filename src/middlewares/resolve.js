const sendScript = require('../services/utils').sendScript
const path = require('path')

const warningModule = {}

const { convertImportByAst, umdToModule } = require('../services/resolveImport')

module.exports = function (req, res, next) {
  if (!req.query.__imex__) return next()
  const fileContent = res.body
  const {
    moduleType,
    importType,
    importStr,
    importer,
    // filePath
  } = req.query
  let ret = ''
  if (moduleType === 'entryModule') {
    ret = convertImportByAst(fileContent, path.resolve(config._server.root, req.locals.reqPath))
  } else if (moduleType === 'aliasModule' || moduleType === 'module') {
    ret = convertImportByAst(fileContent, req.locals.filePath)
  } else if (moduleType === 'thirdModule') {
    ret = umdToModule(fileContent, importStr, JSON.parse(importType))
  } else if (moduleType === 'aliasThirdModule') {
    ret = res.body
  }
  sendScript(res, ret)
}