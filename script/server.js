/**
 * Module dependencies.
 */

var express = require('express'),
  app = express(),
  server = require('http').createServer(app),
  routes = require('../routes'),
  http = require('http'),
  path = require('path'),
  cons = require('consolidate');

app.configure(function() {
  app.engine('mustache', cons.mustache);
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/../views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express['static'](path.join(__dirname, '../public')));
  app.use(require('connect-assets')({
    pathsOnly: true
  }));
});

app.configure('development', function() {
  app.use(express.errorHandler());
});

routes.register(app);

server.listen(app.get('port'), function() {
  console.log("Express server listening @ http://0.0.0.0:" + app.get('port'));
});
