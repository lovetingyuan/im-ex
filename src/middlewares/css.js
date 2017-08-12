// const sass = require('sass.js/dist/sass.node')
const sass = require('node-sass')
const less = require('less')
const stylus = require('stylus');
const { readFile, sendScript: send } = require('../services/utils')

const sendScript = (res, css, filePath) => {
  send(res, `${config._browserNameSpace}.setStyle(\`${css}\`, "${filePath}");`)
}
module.exports = function css(req, res, next) {
  if (!req.query.__imex__) return next()
  const ext = req.locals.ext
  const reqPath = req.locals.reqPath
  const filePath = req.locals.filePath
  if (ext === 'scss' || ext === 'sass') {
    sass.render({
      file: filePath,
      sourceMapEmbed: true
    }, (err, result) => {
      if (err) return next(err)
      sendScript(res, result.css, reqPath)
    });
  } else if (ext === 'less') {
    less.render(readFile(filePath), {sourceMap: {sourceMapFileInline: true}}, (e, output) => {
      if (e) return next(e);
      sendScript(res, output.css, reqPath)
    });
  } else if (ext === 'styl') {
    stylus.render(readFile(filePath), {
      sourcemap: { inline: true, },
      filename: 'constructor' // just a hack
    }, (err, css) => {
      if (err) return next(err)
      sendScript(res, css, reqPath)
    });
  } else {
    sendScript(res, readFile(filePath), reqPath)
  }
}