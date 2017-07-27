const isFile = ext => {
  return [
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'
  ].includes(ext)
}
const response = require('../services/sendRes')
const path = require('path')

module.exports = function () {
  return function (req, res, next) {
    if (req.locals.ext !== 'json') return next()
    if (!req.query.type) return next()
    try {
      const ret = require(req.locals.filePath)
      response(res, `export default ${JSON.stringify(ret)};`)
    } catch(e) {next(e)}
  }
}
