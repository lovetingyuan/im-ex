const readFile = require('../services/readFile')

module.exports = function raw(req, res, next) {
  try {
    const fileContent = readFile(req.locals.filePath)
    res.status(200)
      .type('application/javascript')
      .send(`export default \`${fileContent}\`;`)
  } catch(e) {
    next(e)
  }
}