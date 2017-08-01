const SSE = require('express-sse');
const sse = new SSE();
const madge = require('madge')
const { relative } = require('path').posix

const express = require('express');
const router = express.Router();
const watch = require('../services/watch')
let watchList = config.server.watch.concat(config.server.index)
watch(watchList, changeList => {
  console.log('changelist', changeList)
  madge(config.entry).then((res) => {
    const depMap = res.obj()
    const result = {}
    changeList.forEach(change => {
      const changedFilePath = relative(path.posix.dirname(config.entry), change)
      console.log(22, changedFilePath)
      foo(depMap, Object.keys(depMap), change, result)
    })
    console.log(44, Object.keys(result))
  });
  sse.send({
    type: 'reload:script',
    list: changeList
  })
})

/* GET home page. */
router.get('/', sse.init);

module.exports = router;
