const isReqCss = (ext) => {
  return [
    'css',
    'sass',
    'scss',
    'less'
  ].includes(ext)
}

const readFile = require('../services/readFile')
const resolveRes = require('../services/sendRes')

module.exports = function () {
  return function (req, res, next) {
    if (!isReqCss(req.locals.ext)) return next()
    if (req.locals.ext === 'css') {
      try {
        const cssContent = readFile(req.locals.filePath)
        resolveRes(res, `__TY__.setStyle(\`${cssContent}\`)`)
      } catch (e) {
        next(e)
      }
    } else {
      resolveRes(res, `__TY__.setStyle(\`${res.body}\`)`)
    }
  }
}