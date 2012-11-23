var Q = require('q'),
  _ = require('underscore'),
  moment = require('moment'),
  fs = require('fs'),
  path = require('path'),
  glob = require('glob'),
  wrench = require('wrench'),
  util = require('util'),
  db = require('./db'),
  config = require('./config'),
  file = require('./file');

/**
 * Check whether the object represents a valid program.
 * @param  {Object}     program
 * @return {Q(Boolean)}
 */
exports.isValid = function(program) {
  return exports.getValidationErrors(program)
  .then(function(errors) {
    return errors.length === 0;
  });
};

/**
 * Get an array of validation errors from the program.
 * @param  {Object}   program
 * @return {Q(Array)}
 */
exports.getValidationErrors = function(program) {
  return Q.all([
    _.isObject(program) ? null : 'program must be an object',
    exports.isNameSet(program) ? null : 'name is required',
    exports.isNameUniqueForAccount(program).then(function(unique) {
      return unique ? null : 'name is not unique for account';
    }),
    exports.isTypeSet(program) ? null :
      'type is not set, it should be html|image|video|flash',
    exports.isEntrySet(program) ? null :
      'entry must be set to the entry file of the program'
  ]).then(function(results) {
    return _.filter(results, function(result) {
      return result !== null;
    });
  });
};

/**
 * Checks whether the name is set.
 * @param  {Object}  program
 * @return {Boolean}
 */
exports.isNameSet = function(program) {
  if (!_.isString(program.name)) return false;
  return program.name.trim().length > 0;
};

/**
 * Checks whether the name is unique given the account
 * @param  {Object}  program
 * @return {Q(Boolean)}
 */
exports.isNameUniqueForAccount = function(program) {
  return Q.fcall(function() {
    return true;
  });
};

/**
 * Checks whether the type is set.
 * @param  {Object}  program
 * @return {Boolean}
 */
exports.isTypeSet = function(program) {
  if (!_.isString(program.type)) return false;
  return program.type.trim().length > 0;
};

/**
 * Checks whether the entry is set.
 * @param  {Object}  program
 * @return {Boolean}
 */
exports.isEntrySet = function(program) {
  if (!_.isString(program.entry)) return false;
  return program.entry.trim().length > 0;
};

/**
 * Inserts a single program, erroring on failure.
 * @param  {Object} program
 * @return {Q(Object)} Saved program, including the new id and generated values.
 */
exports.insert = function(program) {
  return exports.insertMany([program])
  .then(function(insertedPrograms) {
    return insertedPrograms[0];
  });
};

/**
 * Insert many programs at once.
 * @param  {Array(Object)} programs
 * @return {Q(Array(Object))} Saved programs, including the new ids and
 * generated values.
 */
exports.insertMany = function(programs) {
  return Q.fcall(function() {
    return [programs, Q.all(_.map(programs, function(program) {
      return exports.getValidationErrors(program);
    }))];
  })
  .spread(function(programs, validations) {
    // Check the validations
    var errors = _.map(_.filter(validations, function(validation) {
      return validation.length > 0;
    }), function(validation, index) {
      return "Validation errors for program at offset " + index + "\n" +
        validation.join("\n");
    });
    if (errors.length > 0) throw new Error(errors.join("\n"));
    // Prepare all the programs
    return [db(), Q.all(_.map(programs, function(program) {
      return exports.prepareForInsert(program);
    }))];
  })
  .spread(function(r, preparedPrograms) {
    return [preparedPrograms,
      db.qcollect(r.table(exports.tableName()).insert(preparedPrograms).run())];
  })
  .spread(function(preparedPrograms, result) {
    if (result.errors > 0) throw new Error(result.errors + ' errors inserting');
    _.each(result.generated_keys, function(generatedKey, index) {
      preparedPrograms[index][exports.idFieldName()] = generatedKey;
    });
    return preparedPrograms;
  });
};

/**
 * Adds any required information to a program required for insert.
 * @param  {Object} program
 * @return {Q(Object)}
 */
exports.prepareForInsert = function(program) {
  return Q.fcall(function() {
    if (program.files === undefined) program.files = {};
    program.createdAt = program.updatedAt = moment().utc().format();
    return program;
  });
};

/**
 * Gets the table name where programs are stored.
 * @return {String}
 */
exports.tableName = function() {
  return 'programs';
};

/**
 * Gets the name of the id field in the programs table.
 * @return {String}
 */
exports.idFieldName = function() {
  return 'id';
};

exports.storagePath = function(programId) {
  return config.uploads.dir + '/programs/' + programId;
};

/**
 * Gets the absolute path to a files directory for a program.
 * @param  {String} programId
 * @return {String}
 */
exports.filesPath = function(programId) {
  return exports.storagePath(programId) + '/files';
};

exports.buildPath = function(programId) {
  return exports.storagePath(programId) + '/build';
};

/**
 * Checks whether the files dir exists for a particular programId
 * @param  {String} programId
 * @return {Q(Boolean)}
 */
exports.filesDirExists = function(programId) {
  return file.exists(exports.filesPath(programId));
};

exports.buildDirExists = function(programId) {
  return file.exists(exports.buildPath(programId));
};

/**
 * Gets the full list of files for a particular programId
 * @param  {String} programId
 * @return {Q(Array)}
 */
exports.files = function(programId) {
  return exports.filesDirExists(programId)
  .then(function(exists) {
    if (!exists) return [];
    return Q.ncall(glob, glob, exports.filesPath(programId) + '/**/*');
  });
};

/**
 * Return the stored files for the given program along with stats.
 * @param  {String} programId
 * @return {Q(Array)} Files are returnes as objects, with file being the
 * absolute path to the file, and stats being the stats of the file
 */
exports.filesWithStats = function(programId) {
  return exports.files(programId)
  .then(function(files) {
    return Q.all(_.map(files, function(file) {
      return Q.ncall(fs.stat, fs, file)
      .then(function(stats) {
        return {
          file: file,
          stats: stats
        };
      });
    }));
  });
};

/**
 * Finds the oldest file, useful for knowing whether a rebuild is required.
 * @param  {String} programId
 * @return {Q(Object|false)} File is returnes as objects, with file being the
 * absolute path to the file, and stats being the stats of the file.  False is
 * returned if no files are present.
 */
exports.oldestFile = function(programId) {
  return exports.filesWithStats(programId)
  .then(function(filesWithStats) {
    if (filesWithStats.length === 0) return false;
    return _.max(filesWithStats, function(file) {
      return moment(file.stats.mtime).valueOf();
    });
  });
};

exports.checkRequiresBuild = function(program) {
  return exports.buildDirExists(program.id)
  .then(function(exists) {
    if (!exists) return true;
    return Q.all([
      Q.ncall(fs.stat, fs, exports.buildPath(program.id)),
      exports.oldestFile(program.id)
    ])
    .spread(function(buildDirStats, oldestFile) {
      var buildDirMtime = moment(buildDirStats.mtime);
      return buildDirMtime < moment(program.updatedAt) ||
        (oldestFile !== false &&
          buildDirMtime < moment(oldestFile.stats.mtime));
    });
  });
};

exports.cleanBuildDir = function(programId) {
  return exports.buildDirExists(programId)
  .then(function(exists) {
    if (exists)
      wrench.rmdirSyncRecursive(exports.buildPath(programId));
  });
};

exports.createBuildDir = function(programId) {
  return Q.fcall(function() {
    wrench.mkdirSyncRecursive(exports.buildPath(programId));
  });
};

exports.build = function(program) {
  return exports.filesDirExists(program.id)
  .then(function(exists) {
    if (!exists) throw new Error('Cannot build, files dir doesn\'t exist for ' +
      program.id);
  })
  .then(function() {
    return exports.cleanBuildDir(program.id);
  })
  .then(function() {
    return exports.createBuildDir(program.id);
  })
  .then(function() {
    return exports.filesWithStats(program.id);
  })
  .then(function(filesWithStats) {
    var filesPath = exports.filesPath(program.id);
    var buildPath = exports.buildPath(program.id);
    var builder = function(fileWithStats) { // Use a builder here to retain scope in the loop
      return Q.fcall(function() {
        if (fileWithStats.stats.isDirectory()) return;
        var relativePath = fileWithStats.file.replace(filesPath + '/', '');
        var renderer = 'link';
        switch (renderer) {
          case 'link':
          var targetFile = buildPath + '/' + relativePath;
          wrench.mkdirSyncRecursive(path.dirname(targetFile));
          fs.symlinkSync(fileWithStats.file, targetFile, 'file');
          break;
          case 'mustache':
          break;
          default:
          throw new Error("Unknown renderer: " + renderer);
        }
      });
    };
    return Q.all(_.map(filesWithStats, function(fileWithStats) {
      return builder(fileWithStats);
    }));
  });
};
