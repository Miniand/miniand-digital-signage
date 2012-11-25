var program = require('../program'),
  _ = require('underscore'),
  Q = require('q'),
  db = require('../db'),
  config = require('../config');

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

exports.programFilePath = function(programId, file) {
  return config.uploads.dir + '/programs/' + programId + '/build/' + file;
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
      })
    };
  });
};

exports.newViewData = function() {
  return Q.fcall(function() {
    return {
    };
  });
};

exports.editViewData = function(programId) {
  return Q.all([
    program.find(programId),
    exports.files(programId)
  ])
  .spread(function(row, files) {
    if (row === undefined) throw new Error('Unable to find program');
    return {
      program: {
        id: row.id,
        name: row.name,
        type: row.type,
        entry: row.entry,
        files: files
      }
    };
  });
};

exports.readViewData = function(programId) {
  return Q.all([
    program.find(programId),
    exports.files(programId)
  ])
  .spread(function(row, files) {
    if (row === undefined) throw new Error('Unable to find program');
    return {
      program: {
        id: row.id,
        name: row.name,
        type: row.type,
        entry: row.entry,
        files: files
      }
    };
  });
};

exports.path = function() {
  return '/programs';
};

exports.newPath = function() {
  return exports.path() + '/new';
};

exports.readPath = function(programId) {
  return exports.path() + '/' + programId;
};

exports.editPath = function(programId) {
  return exports.readPath(programId) + '/edit';
};

exports.filesPath = function(programId) {
  return exports.readPath(programId) + '/files';
};

exports.playPath = function(programId) {
  return exports.readPath(programId) + '/play';
};

exports.entryPath = function(program) {
  return exports.readPath(program.id) + '/play/' + program.entry;
};
