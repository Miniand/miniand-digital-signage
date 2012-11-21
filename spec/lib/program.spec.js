var program = require('../../lib/program');

describe('A program', function() {
  it('should be invalid for an empty object', function(done) {
    program.isValid({})
    .then(function(isValid) {
      expect(isValid).toBe(false);
      done();
    }, function(err) {
      expect(err).not.toBeDefined();
      done();
    });
  });

  it('should be invalid for an integer', function(done) {
    program.isValid(5)
    .then(function(isValid) {
      expect(isValid).toBe(false);
      done();
    }, function(err) {
      expect(err).not.toBeDefined();
      done();
    });
  });

  it('should be valid with a name set', function(done) {
    program.isValid({
      name: 'Testicle'
    })
    .then(function(isValid) {
      expect(isValid).toBe(true);
      done();
    }, function(err) {
      expect(err).not.toBeDefined();
      done();
    });
  });
});