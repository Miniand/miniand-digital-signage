var program = require('../program'),
  _ = require('underscore'),
  Q = require('q'),
  db = require('../db');

exports.files = function(programId) {
  var filesPath = program.filesPath(programId);
  return program.filesWithStats(programId)
  .then(function(filesWithStats) {
    return _.map(_.filter(filesWithStats, function(fileWithStats) {
      return !fileWithStats.stats.isDirectory();
    }), function(fileWithStats) {
      return fileWithStats.file.replace(filesPath + '/', '');
    });
  });
};

exports.builtFilePaths = function(programId) {
  var buildPath = program.buildPath(programId);
  return program.builtFilesWithStats(programId)
  .then(function(filesWithStats) {
    return _.map(_.filter(filesWithStats, function(fileWithStats) {
      return !fileWithStats.stats.isDirectory();
    }), function(fileWithStats) {
      return '/programs/' + programId + '/play/' +
        fileWithStats.file.replace(buildPath + '/', '');
    });
  });
};

exports.indexViewData = function() {
  return db()
  .then(function(r) {
    return db.qcollect(r.table(program.tableName()).run());
  })
  .then(function(result) {
    return {
      programs: _.map(result, function(row) {
        return {
          id: row.id,
          name: row.name,
          type: row.type,
          entry: row.entry
        };
      }),
      helper: exports
    };
  });
};

exports.newViewData = function() {
  return Q.fcall(function() {
    return {
      helper: exports
    };
  });
};

exports.editViewData = function(programId) {
  return Q.all([
    db()
    .then(function(r) {
      return db.qcollect(r.table(program.tableName()).get(programId).run());
    }),
    exports.files(programId)
  ])
  .spread(function(result, files) {
    var row = result[0];
    if (row === undefined) throw new Error('Unable to find program');
    return {
      program: {
        id: row.id,
        name: row.name,
        type: row.type,
        entry: row.entry,
        files: files
      },
      helper: exports
    };
  });
};

exports.readViewData = function(programId) {
  return Q.all([
    db()
    .then(function(r) {
      return db.qcollect(r.table(program.tableName()).get(programId).run());
    }),
    exports.files(programId)
  ])
  .spread(function(result, files) {
    var row = result[0];
    if (row === undefined) throw new Error('Unable to find program');
    return {
      program: {
        id: row.id,
        name: row.name,
        type: row.type,
        entry: row.entry,
        files: files
      },
      helper: exports
    };
  });
};

exports.path = function() {
  return '/programs';
};

exports.newPath = function() {
  return exports.path() + '/new';
};

exports.readPath = function(productId) {
  return exports.path() + '/' + productId;
};

exports.editPath = function(productId) {
  return exports.readPath(productId) + '/edit';
};

exports.filesPath = function(productId) {
  return exports.readPath(productId) + '/files';
};
