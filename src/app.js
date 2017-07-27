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

const app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(helmet())
app.use(timeout('5s'))
app.use(function(req, res, next) {
  if (!req.timedout) next()
});
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

const applyRoutes = require('./routes/routes')
applyRoutes(app)

const applyMiddlewares = require('./middlewares/middlewares')
applyMiddlewares(app)
// const madge = require('madge')

// madge('./src/app.js').then((res) => {
//   console.log(res.obj());
// });

app.use(express.static(config.root));
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  console.log('final error', err)
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
