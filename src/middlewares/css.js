// const sass = require('sass.js/dist/sass.node')
const sass = require('node-sass')
const less = require('less')
const stylus = require('stylus');
const { readFile, sendScript: send } = require('../services/utils')
const cssModules = require('postcss-modules')
const postcss = require('postcss')

const sendScript = (req, res, css, filePath) => {
  const importType = JSON.parse(req.query.importType)
  let body = (css) => `${config._browserNameSpace}.setStyle(\`${css}\`, "${filePath}");
    export const css = \`${css}\`;
  `
  if (importType.length) {
    let cssModuleJSON = {}
    postcss([
      cssModules({
        generateScopedName: '[local]__[hash:8]',
        getJSON: function (cssFileName, json) {
          cssModuleJSON = json
        }
      })
    ])
      .process(css, {})
      .then(function (ret) {
        send(res, `${body(ret.css)}; export default ${JSON.stringify(cssModuleJSON, null, 2)};`)
      })
  } else {
    send(res, body(css))
  }
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
      sendScript(req, res, result.css, reqPath)
    });
  } else if (ext === 'less') {
    less.render(readFile(filePath), { sourceMap: { sourceMapFileInline: true } }, (e, output) => {
      if (e) return next(e);
      sendScript(req, res, output.css, reqPath)
    });
  } else if (ext === 'styl') {
    stylus.render(readFile(filePath), {
      sourcemap: { inline: true, },
      filename: 'constructor' // just a hack
    }, (err, css) => {
      if (err) return next(err)
      sendScript(req, res, css, reqPath)
    });
  } else {
    sendScript(req, res, readFile(filePath), reqPath)
  }
}