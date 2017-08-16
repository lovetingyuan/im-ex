const SSE = require('express-sse');
const sse = new SSE();
const madge = require('madge')
const path = require('path')

const express = require('express');
const router = express.Router();
const watch = require('../services/watch')
let watchList = config.server.watch
if (!Array.isArray(watchList)) {
  watchList = [watchList]
}
watchList = watchList.map(watchPath => {
  return path.resolve(config._server.root, watchPath)
})
const callback = function(changeList) {
  if (!changeList.length) return
  sse.send({
    type: config.server.reload === 'hot' ? 'hotreload' : 'reload',
    list: changeList
  })
}
/* server sent event */
router.get('/', function (req, res, next) {
  if (config.server.reload && !callback.watched) {
    watch(watchList, callback)
    callback.watched = true
  }
  return sse.init.call(this, req, res, next)
});

module.exports = router;
