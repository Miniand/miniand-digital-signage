var program = require('../../lib/program');

describe('A program', function() {
  it('should be invalid for an empty object', function(done) {
    program.isValid({})
    .then(function(isValid) {
      expect(isValid).toBe(false);
      done();
    }, function(error) {
      expect(error.stack).not.toBeDefined();
      done();
    });
  });

  it('should be invalid for an integer', function(done) {
    program.isValid(5)
    .then(function(isValid) {
      expect(isValid).toBe(false);
      done();
    }, function(error) {
      expect(error.stack).not.toBeDefined();
      done();
    });
  });

  it('should be valid with a name set', function(done) {
    program.isValid({
      name: 'Testicle',
      type: 'html',
      entry: 'index.html'
    })
    .then(function(isValid) {
      expect(isValid).toBe(true);
      done();
    }, function(error) {
      expect(error.stack).not.toBeDefined();
      done();
    });
  });

  it('should be able to insert a valid program', function(done) {
    program.insert({
      name: 'Test project',
      type: 'html',
      entry: 'index.html'
    })
    .then(function(project) {
      expect(project).toBeDefined();
      done();
    }, function(error) {
      expect(error.stack).not.toBeDefined();
      done();
    });
  });

  it('should error when trying to insert an invalid program', function(done) {
    program.insert({})
    .then(function() {
      expect(false).toBe(true);
      done();
    }, function(error) {
      done();
    });
  });

  it('should return a list of files', function(done) {
    program.filesWithStats('f231926d-f002-4596-9447-0b6bfd15cd49')
    .then(function(files) {
      done();
    }, function(error) {
      expect(false).toBe(true);
      done();
    });
  });
});
