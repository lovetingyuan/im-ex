var express = require('express');
var path = require('path');
const fs = require('fs')
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

const notifier = require('node-notifier');
const helmet = require('helmet')
const timeout = require('connect-timeout')

const indexContent = require('./services/getIndex')
const addExt = require('./services/addExt')
const readFile = require('./services/readFile')

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

const applyRoutes = require('./routes/routes')
applyRoutes(app)
// after routers

app.get('*', function (req, res, next) {
  const reqPath = req.path[0] === '/' ? req.path.substr(1) : req.path
  req.locals = req.locals || {}
  const ext = path.extname(reqPath).substr(1).toLowerCase()
  req.locals.ext = ext
  req.locals.filePath = path.resolve(config._root, reqPath)
  req.locals.isThirdModule = /node_modules\//.test(reqPath)
  next()
});

const getReg = fileTypes => {
  return new RegExp('\\/.+?\\.(' + fileTypes.join('|') +')$')
}

app.use(getReg([
  'js', 'jsx', 'coffee'
]), [
  require('./middlewares/script'),
  require('./middlewares/resolve')
])

app.use(getReg([
  'css', 'scss', 'sass', 'less', 'styl'
]), [
  require('./middlewares/css')
])

app.use(getReg([
  'json', 'json5'
]), [
  require('./middlewares/json')
])

app.use(getReg([
  'txt'
]), [
  require('./middlewares/raw')
])

app.use(getReg([
  'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'mp3', 'mp4'
]), [
  require('./middlewares/file')
])


// const applyMiddlewares = require('./middlewares')
// applyMiddlewares(app)
// const madge = require('madge')

// madge('./src/app.js').then((res) => {
//   console.log(res.obj());
// });


app.use(express.static(config._root));
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  if (config.server.historyFallback) {
    res.status(200)
      .type('html')
      .send(indexContent())
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
