const slash = require('slash')
const fs = require('fs')
const path = require('path')

module.exports = function watchChange(dir, callback) {
  const changedFile = {
    timer: null,
    list: {}
  }
  if (typeof dir === 'string') dir = [dir]
  const watchCallback = (eventType, filename) => {
    if (eventType === 'change' && filename) {
      changedFile.list[filename] = true
    }
    clearTimeout(changedFile.timer)
    changedFile.timer = setTimeout(() => {
      const changedList = Object.keys(changedFile.list)
        .map(v => slash(path.join(dir, v)))
      changedFile.list = {}
      callback(changedList)
    }, 1000)
  }
  ['./'].forEach(d => {
    fs.watch(d, {
      recursive: true,
    }, watchCallback)
  })

}
