const slash = require('slash')
const fs = require('fs')
const path = require('path')

module.exports = function watchChange(dirs, callback) {
  const changedFile = {
    timer: null,
    list: {}
  }
  if (!Array.isArray(dirs)) dirs = [dirs]
  dirs.forEach(dir => {
    fs.watch(dir, {
      recursive: true,
    }, (eventType, filename) => {
      if (eventType === 'change' && filename) {
        changedFile.list[filename] = true
      }
      clearTimeout(changedFile.timer)
      changedFile.timer = setTimeout(() => {
        clearTimeout(changedFile.timer)
        const changedList = Object.keys(changedFile.list)
          .map(v => {
            return v[0] === '.' ? null : slash(path.join(dir, v))
          }).filter(v => v)
        changedFile.list = {}
        callback(changedList)
      }, 1000)
    })
  })

}
