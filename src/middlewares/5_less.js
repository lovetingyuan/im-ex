const less = require('less')
const readFile = require('../services/readFile')

// const url = require('url')
module.exports = function () {
  return function (req, res, next) {
    if (req.locals.ext !== 'less') return next()
    less.render(readFile(req.locals.filePath), function (e, output) {
      if (e) next(e) 
      else {
        res.body = output.css
        next()
      }
    });
  }
}