const sass = require('sass.js/dist/sass.node')
const path = require('path')
const isSass = ext => ['sass', 'scss'].includes(ext)
// const url = require('url')
module.exports = function () {
  return function (req, res, next) {
    let ext = path.extname(req.path).substr(1)
    if (!isSass(ext)) return next()
    sass(req.locals.filePath, ({text}) => {
      res.body = text
      next()
    });
  }
}