exports.register = function(app) {
  app.get('/signs/:id/play/cache.appcache', exports.playCacheManifest);
  app.get('/signs/:id/play', exports.play);
  app.get('/signs/:id', exports.read);
};

exports.playCacheManifest = function(req, res) {
  res.setHeader('Content-Type', 'text/cache-manifest');
  res.render('signs/play/cache.appcache.mustache', {
    css: css('sign_play'),
    js: js('sign_play').join("\n")
  });
};

exports.play = function(req, res) {
  res.render('signs/play', {
    id: req.params.id
  });
};

exports.read = function(req, res) {
  res.render('signs/read', {
    title: req.params.id
  });
};