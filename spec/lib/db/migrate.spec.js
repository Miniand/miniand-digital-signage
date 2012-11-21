var migrate = require('../../../lib/db/migrate');

describe('Database migrations', function() {
  it('should fetch a list of databases', function(done) {
    migrate.dbList()
    .then(function(dbList) {
      expect(typeof dbList).toEqual('object');
      done();
    }, function(err) {
      expect(false).toBe(true);
      done();
    });
  });

  it('should check if the database exists', function(done) {
    migrate.databaseExists()
    .then(function(exists) {
      expect(typeof exists).toEqual('boolean');
      done();
    }, function(err) {
      expect(false).toBe(true);
      done();
    });
  });

  it('should fetch a list of tables', function(done) {
    migrate.tableList()
    .then(function(tableList) {
      expect(typeof tableList).toEqual('object');
      done();
    }, function(err) {
      expect(false).toBe(true);
      done();
    });
  });

  it('should check if the schema migrations table exists', function(done) {
    migrate.schemaMigrationsTableExists()
    .then(function(exists) {
      expect(typeof exists).toEqual('boolean');
      done();
    }, function(err) {
      expect(false).toBe(true);
      done();
    });
  });
});
