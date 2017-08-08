const fs = require('fs')
const path = require('path')

module.exports = function (filePath, importer) {
  for (let i = 0; i < config.resolve.exts.length; i++) {
    let ext = config.resolve.exts[i]
    if (fs.existsSync(path.resolve(path.dirname(filePath), importer + '.' + ext))) {
      return ext
    }
  }
}