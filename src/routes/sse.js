const SSE = require('express-sse');
const sse = new SSE();
const madge = require('madge')
const { relative } = require('path').posix

const express = require('express');
const router = express.Router();
const watch = require('../services/watch')
let watchList = config._server.root


/* GET home page. */
router.get('/', function (req, res, next) {
  if (config.server.reload) {
    watch(watchList, changeList => {
      // console.log('changelist', changeList)
      // madge(config.entry).then((res) => {
      //   const depMap = res.obj()
      //   const result = {}
      //   changeList.forEach(change => {
      //     const changedFilePath = relative(path.posix.dirname(config.entry), change)
      //     foo(depMap, Object.keys(depMap), change, result)
      //   })
      // });
      sse.send({
        type: config.server.reload === 'hot' ? 'hotreload' : 'reload',
        list: changeList
      })
    })
  }

  return sse.init.call(this, req, res, next)
});

module.exports = router;
