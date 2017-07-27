const fs = require('fs')
const path = require('path')

module.exports = function(filePath) {
  return fs.readFileSync(filePath, { encoding: 'utf8' })
}