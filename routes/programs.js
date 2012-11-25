var Q = require('q'),
  fs = require('fs'),
  _ = require('underscore'),
  program = require('../lib/program'),
  helper = require('../lib/helper');

exports.register = function(app) {
  app.post('/programs/:id/files', exports.filesUploadAction);
  app.get('/programs/:id/play/cache.appcache', exports.playAppCacheAction);
  app.get('/programs/:id/play/:file', exports.playFetchFileAction);
  app.get('/programs/:id/play', exports.playAction);
  app.get('/programs/:id/edit', exports.editAction);
  app.get('/programs/new', exports.newAction);
  app.put('/programs/:id', exports.updateAction);
  app.get('/programs/:id', exports.readAction);
  app.post('/programs', exports.createAction);
  app.get('/programs', exports.indexAction);
};

exports.playFetchFileAction = function(req, res) {
  program.find(req.params.id)
  .then(function(p) {
    return [p, program.buildIfRequired(p)];
  })
  .spread(function(p) {
    res.sendfile(helper.program.programFilePath(p.id, req.params.file));
  });
};

exports.playAppCacheAction = function(req, res) {
  program.find(req.params.id)
  .then(function(p) {
    return [p, program.buildIfRequired(p)];
  })
  .spread(function(p) {
    return [p, helper.program.builtFilePaths(p.id), program.lastBuildTime(p.id)];
  })
  .spread(function(p, files, lastBuildTime) {
    res.setHeader('Content-Type', 'text/cache-manifest');
    cacheFiles = _.union(
      [css('program-play'), helper.program.playPath(p.id)],
      js('program-play'),
      files
    );
    res.render('programs/play/cache.appcache.mustache', {
      lastBuildTime: lastBuildTime.utc().format(),
      cacheFiles: cacheFiles.sort().join("\n")
    });
  })
  .fail(helper.error(req, res));
};

exports.playAction = function(req, res) {
  program.find(req.params.id)
  .then(function (p) {
    res.render('programs/play', {
      program: p,
      entryPath: helper.program.entryPath(p)
    });
  })
  .fail(helper.error(req, res));
};

exports.readAction = function(req, res) {
  helper.program.readViewData(req.params.id)
  .then(function(readViewData) {
    res.render('programs/read', readViewData);
  })
  .fail(helper.error(req, res));
};

exports.indexAction = function(req, res) {
  helper.program.indexViewData()
  .then(function(indexViewData) {
    res.render('programs/index', indexViewData);
  })
  .fail(helper.error(req, res));
};

exports.editAction = function(req, res) {
  helper.program.editViewData(req.params.id)
  .then(function(editViewData) {
    res.render('programs/edit', editViewData);
  })
  .fail(helper.error(req, res));
};

exports.newAction = function(req, res) {
  helper.program.newViewData()
  .then(function(newViewData) {
    res.render('programs/new', newViewData);
  })
  .fail(helper.error(req, res));
};

exports.createAction = function(req, res) {
  program.insert(req.body.program)
  .then(function(p) {
    res.redirect(helper.program.readPath(p.id));
  })
  .fail(helper.error(req, res));
};

exports.filesUploadAction = function(req, res) {
  program.saveFile(fs.createReadStream(req.files.file.path), req.body.name,
    req.params.id)
  .then(function() {
    res.redirect(helper.program.readPath(req.params.id));
  })
  .fail(helper.error(req, res));
};

exports.updateAction = function(req, res) {
  p = req.body.program;
  p[program.idFieldName()] = req.params.id;
  program.update(p)
  .then(function() {
    res.redirect(helper.program.readPath(req.params.id));
  })
  .fail(helper.error(req, res));
};
