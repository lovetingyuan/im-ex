const glob = require('glob')

function getFileList(patterns) {
  if (!Array.isArray(patterns)) {
    patterns = [patterns]
  }
  return Promise.all(patterns.map(pattern => {
    return new Promise((resolve, reject) => {
      glob(pattern, {}, (er, files) => er ? reject(er) : resolve(files))
    })
  })).then(list => list.reduce((a, b) => a.concat(b)))
}

module.exports = getFileList;