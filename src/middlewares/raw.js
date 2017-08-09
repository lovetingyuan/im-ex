const {readFile, sendScript} = require('../services/utils')

module.exports = function raw(req, res, next) {
  try {
    const fileContent = readFile(req.locals.filePath)
    sendScript(res, `export default \`${fileContent}\`;`)
  } catch(e) {
    next(e)
  }
}