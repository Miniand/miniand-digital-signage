var db = require('../db'),
  Q = require('q'),
  fs = require('fs'),
  _ = require('underscore');

exports.dbList = function() {
  return db()
  .then(function(r) {
    var deferred = Q.defer();
    r.dbList().run().collect(function(results) {
      deferred.resolve(results);
    });
    return deferred.promise;
  });
};

exports.databaseExists = function() {
  return exports.dbList()
  .then(function(dbList) {
    for (var i in dbList) {
      if (dbList[i] == db.config.database) return true;
    }
    return false;
  });
};

exports.createDatabase = function() {
  return db()
  .then(function(r) {
    var deferred = Q.defer();
    r.dbCreate(db.config.database).run(function(result) {
      deferred.resolve(result);
    });
    return deferred.promise;
  });
};

exports.tableList = function() {
  return db()
  .then(function(r) {
    var deferred = Q.defer();
    r.db(db.config.database).tableList().run().collect(function(results) {
      deferred.resolve(results);
    });
    return deferred.promise;
  });
};

exports.schemaMigrationsTableExists = function() {
  return exports.tableList()
  .then(function(tableList) {
    for (var i in tableList) {
      if (tableList[i] == 'schema_migrations') return true;
    }
    console.log('err');
    return false;
  });
};

exports.createSchemaMigrationsTable = function() {
  return db()
  .then(function(r) {
    var deferred = Q.defer();
    r.db(db.config.database).tableCreate('schema_migrations')
    .run(function(result) {
      deferred.resolve(result);
    });
    return deferred.promise;
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
    var deferred = Q.defer();
    r.table('schema_migrations').run().collect(function(result) {
      deferred.resolve(_.map(result, function(row) {
        return row.version;
      }));
    });
    return deferred.promise;
  });
};

exports.missingMigrations = function() {
  return Q.spread([exports.migrationFiles(), exports.pastMigrations()],
    function(migrationFiles, pastMigrations) {
      return _.filter(migrationFiles, function(file) {
        return pastMigrations.indexOf(migrationFiles) == -1;
      });
    });
};

exports.up = function(version) {

};

exports.migrate = function() {
  exports.databaseExists()
  .then(function(exists) {
    if (!exists) return exports.createDatabase();
  })
  .then(exports.schemaMigrationsTableExists)
  .then(function(exists) {
    if (!exists) return exports.createSchemaMigrationsTable();
  })
  .then(exports.missingMigrations)
  .then(function(missingMigrations) {
    for (var i in missingMigrations) {
      var migration = missingMigrations[i];
      console.log('Running migration ' + migration);
    }
  })
  .then(function(result) {
    console.log('Migrations successful');
  }, function(error) {
    console.log('Error running migrations: ', error);
  });
};
