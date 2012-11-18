exports.register = function(app) {
  require('./users').register(app);
  require('./signs').register(app);
  require('./programs').register(app);
  app.get(/^\/partials\/(.*)\.html$/, exports.partials);
  app.get('/', exports.index);
};

exports.index = function(req, res) {
  res.render('index');
};

exports.partials = function(req, res) {
  res.render('partials/' + req.params[0]);
};