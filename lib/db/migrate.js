var db = require('../db'),
  Q = require('q'),
  fs = require('fs'),
  _ = require('underscore'),
  config = require('../config');

exports.dbList = function() {
  return db()
  .then(function(r) {
    return db.qcollect(r.dbList().run());
  });
};

exports.databaseExists = function() {
  return exports.dbList()
  .then(function(dbList) {
    for (var i in dbList) {
      if (dbList[i] == config.db.database) return true;
    }
    return false;
  });
};

exports.createDatabase = function() {
  return db()
  .then(function(r) {
    return db.qcollect(r.dbCreate(config.db.database).run());
  });
};

exports.tableList = function() {
  return db()
  .then(function(r) {
    return db.qcollect(r.db(config.db.database).tableList().run());
  });
};

exports.schemaMigrationsTableExists = function() {
  return exports.tableList()
  .then(function(tableList) {
    for (var i in tableList) {
      if (tableList[i] == 'schema_migrations') return true;
    }
    return false;
  });
};

exports.createSchemaMigrationsTable = function() {
  return db()
  .then(function(r) {
    return db.qcollect(r.db(config.db.database).tableCreate({
      tableName: 'schema_migrations',
      primaryKey: 'version'
    }).run());
  });
};

exports.migrationFiles = function() {
  return Q.ncall(fs.readdir, fs, __dirname + '/migrate')
  .then(function(files) {
    return _.filter(files, function(file) {
      return file.match(/\.js$/);
    });
  });
};

exports.pastMigrations = function() {
  return db()
  .then(function(r) {
    return db.qcollect(r.table('schema_migrations').run());
  })
  .then(function(result) {
    return _.map(result, function(row) {
      return row.version;
    });
  });
};

exports.missingMigrations = function() {
  return Q.spread([exports.migrationFiles(), exports.pastMigrations()],
    function(migrationFiles, pastMigrations) {
      return _.filter(migrationFiles, function(file) {
        return pastMigrations.indexOf(file) == -1;
      });
    });
};

exports.up = function(file) {
  return db()
  .then(function(r) {
    return db.qcollect(r.table('schema_migrations').get(file, 'version').run());
  })
  .then(function(result) {
    row = result[0];
    if (row !== null) return false;
    return require(__dirname + '/migrate/' + file).up()
    .then(db)
    .then(function(r) {
      return db.qcollect(r.table('schema_migrations').insert({
        version: file
      }).run());
    });
  });
};

exports.migrate = function() {
  return exports.databaseExists()
  .then(function(exists) {
    if (!exists) return exports.createDatabase();
  })
  .then(exports.schemaMigrationsTableExists)
  .then(function(exists) {
    if (!exists) return exports.createSchemaMigrationsTable();
  })
  .then(exports.missingMigrations)
  .then(function(missingMigrations) {
    result = Q.resolve();
    function getMigrationUpCallback(file) {
      return function() {
        console.log('Running migration ' + file);
        return exports.up(file);
      };
    }
    for (var i in missingMigrations) {
      var migration = missingMigrations[i];
      result = result.then(getMigrationUpCallback(migration));
    }
    return result;
  });
};
