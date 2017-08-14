const express = require('express');
const path = require('path');
const fs = require('fs')
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const notifier = require('node-notifier');
const helmet = require('helmet')
const timeout = require('connect-timeout')

const getIndex = require('./routes/index').getIndex

const app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(helmet())
app.use(timeout('5s'))
app.use(function (req, res, next) {
  if (!req.timedout) next()
});
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

config.server.setup(app)

app.use(function (req, res, next) {
  res.set(config.server.headers);
  next()
})

app.use(['/', '/index.html'], require('./routes/index').default)
app.use('/' + config._sse, require('./routes/sse'))
// after routers

app.get('*', function (req, res, next) {
  const reqPath = req.path[0] === '/' ? req.path.substr(1) : req.path
  req.locals = req.locals || {}
  req.query = req.query || {}
  req.locals.reqPath = reqPath
  req.locals.filePath = path.resolve(config._server.root, reqPath)
  req.locals.ext = path.extname(reqPath).substr(1).toLowerCase()
  req.locals.third = /node_modules\//.test(reqPath)
  next()
});

const applyMiddlewares = config => {
  const getReg = fileTypes => {
    if (!Array.isArray(fileTypes)) fileTypes = [fileTypes]
    return new RegExp('^\\/.+?\\.(' + fileTypes.join('|') + ')$')
  }
  config.forEach(({ exts, names }) => {
    app.use(
      getReg(exts),
      names.map(name => require('./middlewares/' + name))
    )
  })
}
applyMiddlewares([{
  exts: ['js', 'jsx', 'coffee'],
  names: ['script', 'resolve']
}, {
  exts: ['css', 'scss', 'sass', 'less', 'styl'],
  names: ['css']
}, {
  exts: ['json', 'json5'],
  names: ['json']
}, {
  exts: ['txt'],
  names: ['raw']
}, {
  exts: ['jpg', 'jpeg', 'ico', 'png', 'gif', 'svg', 'webp', 'mp3', 'mp4'],
  names: ['file']
}])

app.use(express.static(config._server.root));
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  if (config.server.historyFallback) {
    res.status(200)
      .type('html')
      .send(getIndex())
  } else {
    const err = new Error('Not Found: ' + req.path);
    err.status = 404;
    next(err);
  }
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  console.log('server error', err)
  // String
  notifier.notify({
    'title': 'Error in Backend',
    'message': err.message
  });
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500)
    .set('Content-Type', 'text/html')
    .send('<b>error</b>');
});

module.exports = app;
