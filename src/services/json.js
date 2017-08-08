module.exports = function json(req) {
  return new Promise((resolve, reject) => {
    const ret = require(req.locals.filePath)
    resolve(`export default ${JSON.stringify(ret)};`)
  })
}
