const cheerio = require('cheerio')
const path = require('path')
const readFile = require('../services/readFile')
const indexHtmlContent = readFile(path.join(config._root, config.server.index))

const $ = cheerio.load(indexHtmlContent)
// set html title
$('title').html(config.head.title)
const scripts = scripts => {
  return scripts.map(script => `<script src="${script.url}"></script>`).join('\n')
}
const styles = styles => {
  return styles.map(style => `<link rel="stylesheet" href="${style.url}">`).join('\n')
}
// add global variables
$('head').append(`<script>${Object.keys(config.global).map(varName => {
  const value = config.global[varName]
  return `var ${varName} = ${JSON.stringify(value)};`
}).join('\n')}</script>`)
// add favicon
$('head').append(`<link rel="shortcut icon" type="image/ico" href="${config.head.favicon}"/>`)
// add some util script
const prependScriptContent = require('../page')()
$('head').prepend(`<script>${prependScriptContent}</script>`)

// set user resource
$('head')
  .append(styles(config.head.styles))
  .append(scripts(config.head.scripts))

// add application entry script
$('head').append(`<script type="module" data-type="entry" src="${config.entry}?type=entry"></script>`)
let indexContent = ''

module.exports = function() {
  if (!indexContent) {
    indexContent = $.html()
  }
  return indexContent
}

