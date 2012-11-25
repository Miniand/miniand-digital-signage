var Q = require('q'),
  _ = require('underscore'),
  moment = require('moment'),
  fs = require('fs'),
  path = require('path'),
  wrench = require('wrench'),
  util = require('util'),
  db = require('./db'),
  model = require('./db/model'),
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
  return model.insertMany(programs, exports.isValid, exports.prepareForUpdate,
    exports.tableName(), exports.idFieldName());
};

/**
 * Adds any required information to a program required for insert.
 * @param  {Object} program
 * @return {Q(Object)}
 */
exports.prepareForInsert = function(program) {
  return exports.prepareForSave(program)
  .then(function() {
    program.createdAt = moment().utc().format();
    return program;
  });
};

/**
 * Adds any required information to a program required for update.
 * @param  {Object} program
 * @return {Q(Object)}
 */
exports.prepareForUpdate = function(program) {
  return exports.prepareForSave(program);
};

/**
 * Adds any required information to a program required for saving.
 * @param  {Object} program
 * @return {Q(Object)}
 */
exports.prepareForSave = function(program) {
  return Q.fcall(function() {
    if (program.files === undefined) program.files = {};
    program.updatedAt = moment().utc().format();
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
  return file.recursiveLs(exports.filesPath(programId));
};

/**
 * Gets the full list of built for a particular programId
 * @param  {String} programId
 * @return {Q(Array)}
 */
exports.builtFiles = function(programId) {
  return file.recursiveLs(exports.buildPath(programId));
};

/**
 * Return the stored files for the given program along with stats.
 * @param  {String} programId
 * @return {Q(Array)} Files are returnes as objects, with file being the
 * absolute path to the file, and stats being the stats of the file
 */
exports.filesWithStats = function(programId) {
  return file.recursiveLsWithStats(exports.filesPath(programId));
};

/**
 * Return the stored built files for the given program along with stats.
 * @param  {String} programId
 * @return {Q(Array)} Files are returnes as objects, with file being the
 * absolute path to the file, and stats being the stats of the file
 */
exports.builtFilesWithStats = function(programId) {
  return file.recursiveLsWithStats(exports.buildPath(programId));
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

/**
 * Gets the build time of the last build.
 * @param  {String} programId
 * @return {Moment} Moment time object
 */
exports.lastBuildTime = function(programId) {
  return Q.ncall(fs.stat, fs, exports.buildPath(programId))
  .then(function(buildDirStats) {
    return moment(buildDirStats.mtime);
  });
};

/**
 * Checks whether the build directory is missing, or our of date taking into
 * account the source files and the last updated date of the resource.
 * @param  {Object} program
 * @return {Q(Boolean)}
 */
exports.checkRequiresBuild = function(program) {
  return exports.buildDirExists(program.id)
  .then(function(exists) {
    if (!exists) return true;
    return Q.all([
      exports.lastBuildTime(program.id),
      exports.oldestFile(program.id)
    ])
    .spread(function(buildDirMtime, oldestFile) {
      return buildDirMtime < moment(program.updatedAt) ||
        (oldestFile !== false &&
          buildDirMtime < moment(oldestFile.stats.mtime));
    });
  });
};

/**
 * Deletes the build directory for this product.
 * @param  {String} programId
 * @return {Q}
 */
exports.cleanBuildDir = function(programId) {
  return exports.buildDirExists(programId)
  .then(function(exists) {
    if (exists)
      wrench.rmdirSyncRecursive(exports.buildPath(programId));
  });
};

/**
 * Creates the build directory for this product.
 * @param  {String} programId
 * @return {Q}
 */
exports.createBuildDir = function(programId) {
  return Q.fcall(function() {
    wrench.mkdirSyncRecursive(exports.buildPath(programId));
  });
};

/**
 * Builds the source files.
 * @param  {Object} program
 * @return {Q}
 */
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

/**
 * Builds a program but only if required.
 * @param  {Object} program
 * @return {Q}
 */
exports.buildIfRequired = function(program) {
  return exports.checkRequiresBuild(program)
  .then(function(requiresBuild) {
    if (requiresBuild) return exports.build(program);
  });
};

/**
 * Saves a file under the program files storage.
 * @param  {Stream} stream    File stream to save.
 * @param  {String} name      The name of the resulting file.
 * @param  {String} programId The program to save under.
 * @return {Q}                A promise to save.
 */
exports.saveFile = function(stream, name, programId) {
  return Q.fcall(function() {
    var deferred = Q.defer();
    var targetFile = exports.filesPath(programId) + '/' + name;
    wrench.mkdirSyncRecursive(path.dirname(targetFile));
    stream.pipe(fs.createWriteStream(targetFile));
    stream.on('end', function() {
      deferred.resolve();
    });
    stream.on('error', function(error) {
      deferred.reject(error);
    });
    return deferred.promise;
  });
};

/**
 * Updates a single program, erroring on failure.
 * @param  {Object} program The program to update, including the current id.
 * @return {Q(Object)} Saved program, including generated values.
 */
exports.update = function(program) {
  return exports.updateMany([program])
  .then(function(updatedPrograms) {
    return updatedPrograms[0];
  });
};

/**
 * Update many programs at once.
 * @param  {Array(Object)} programs The programs to update, including the
 * current id.
 * @return {Q(Array(Object))} Saved programs, including generated values.
 */
exports.updateMany = function(programs) {
  return model.updateMany(programs, exports.isValid, exports.prepareForUpdate,
    exports.tableName(), exports.idFieldName());
};

/**
 * Finds a program by id.
 * @param  {String}   programId
 * @return {Q(Array)}
 */
exports.find = function(programId) {
  return model.find(programId, exports.tableName(), exports.idFieldName());
};
