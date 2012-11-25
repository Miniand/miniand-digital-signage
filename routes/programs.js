var Q = require('q'),
  fs = require('fs'),
  program = require('../lib/program'),
  programHelper = require('../lib/helper/program'),
  errorHelper = require('../lib/helper/error');

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
    res.sendfile(programHelper.programFilePath(p.id, req.params.file));
  });
};

exports.playAppCacheAction = function(req, res) {
  program.find(req.params.id)
  .then(function(p) {
    return [p, program.buildIfRequired(p)];
  })
  .spread(function(p) {
    return [p, programHelper.builtFilePaths(p.id), program.lastBuildTime(p.id)];
  })
  .spread(function(p, files, lastBuildTime) {
    res.setHeader('Content-Type', 'text/cache-manifest');
    res.render('programs/play/cache.appcache.mustache', {
      lastBuildTime: lastBuildTime.utc().format(),
      css: css('program_play'),
      js: js('program_play').join("\n"),
      playPath: programHelper.playPath(p.id),
      files: files.join("\n")
    });
  })
  .fail(errorHelper(req, res));
};

exports.playAction = function(req, res) {
  program.find(req.params.id)
  .then(function (p) {
    res.render('programs/play', {
      program: p,
      entryPath: programHelper.entryPath(p)
    });
  })
  .fail(errorHelper(req, res));
};

exports.readAction = function(req, res) {
  programHelper.readViewData(req.params.id)
  .then(function(readViewData) {
    res.render('programs/read', readViewData);
  })
  .fail(errorHelper(req, res));
};

exports.indexAction = function(req, res) {
  programHelper.indexViewData()
  .then(function(indexViewData) {
    res.render('programs/index', indexViewData);
  })
  .fail(errorHelper(req, res));
};

exports.editAction = function(req, res) {
  programHelper.editViewData(req.params.id)
  .then(function(editViewData) {
    res.render('programs/edit', editViewData);
  })
  .fail(errorHelper(req, res));
};

exports.newAction = function(req, res) {
  programHelper.newViewData()
  .then(function(newViewData) {
    res.render('programs/new', newViewData);
  })
  .fail(errorHelper(req, res));
};

exports.createAction = function(req, res) {
  program.insert(req.body.program)
  .then(function(p) {
    res.redirect(programHelper.readPath(p.id));
  })
  .fail(errorHelper(req, res));
};

exports.filesUploadAction = function(req, res) {
  program.saveFile(fs.createReadStream(req.files.file.path), req.body.name,
    req.params.id)
  .then(function() {
    res.redirect(programHelper.readPath(req.params.id));
  })
  .fail(errorHelper(req, res));
};

exports.updateAction = function(req, res) {
  p = req.body.program;
  p[program.idFieldName()] = req.params.id;
  program.update(p)
  .then(function() {
    res.redirect(programHelper.readPath(req.params.id));
  })
  .fail(errorHelper(req, res));
};
