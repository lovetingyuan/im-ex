const slash = require('slash')
const fs = require('fs')
const path = require('path')

module.exports = function watchChange(dirs, callback) {
  const changedFile = {
    timer: null,
    list: {}
  }
  const watchCallback = (dir, eventType, filename) => {
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
  dirs.forEach(dir => {
    fs.watch(dir, {
      recursive: true,
    }, function(...args) {
      watchCallback(dir, ...args)
    })
  })

}
