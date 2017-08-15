const {readFile, sendScript} = require('../services/utils')

module.exports = function raw(req, res, next) {
  if (!req.query.__imex__) return next()
  try {
    const fileContent = JSON.stringify(readFile(req.locals.filePath))
    sendScript(res, `export default ${fileContent};`)
  } catch(e) {
    next(e)
  }
}