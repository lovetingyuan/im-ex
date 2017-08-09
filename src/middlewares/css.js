const sass = require('sass.js/dist/sass.node')
const less = require('less')
const stylus = require('stylus');
const { readFile, sendScript: send } = require('../services/utils')

const sendScript = (res, css) => {
  send(res, `${config._browserNameSpace}.setStyle(\`${css}\`);`)
}
module.exports = function css(req, res, next) {
  const ext = req.locals.ext
  if (ext === 'scss' || ext === 'sass') {
    sass(req.locals.filePath, ({ status, text }) => {
      if (status) return next(new Error(`sass compile error: ${req.path} with status: ${status}`))
      sendScript(res, text)
    });
  } else if (ext === 'less') {
    less.render(readFile(req.locals.filePath), (e, output) => {
      if (e) return next(e);
      sendScript(res, output.css)
    });
  } else if (ext === 'styl') {
    stylus.render(readFile(req.locals.filePath), (err, css) => {
      if (err) return next(err)
      sendScript(res, css)
    });
  } else {
    sendScript(res, readFile(req.locals.filePath))
  }
}