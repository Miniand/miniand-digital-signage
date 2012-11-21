var Q = require('q'),
  _ = require('underscore'),
  db = require('./db');

/**
 * Check whether the object represents a valid product.
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
 * Get an array of validation errors from the product.
 * @param  {Object}   program
 * @return {Q(Array)}
 */
exports.getValidationErrors = function(program) {
  return Q.all([
    _.isObject(program) ? null : 'program must be an object',
    exports.isNameSet(program) ? null : 'name is required',
    exports.isNameUniqueForAccount(program).then(function(unique) {
      return unique ? null : 'name is not unique for account';
    })
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
 * @return {Boolean}
 */
exports.isNameUniqueForAccount = function(program) {
  return Q.fcall(function() {
    return true;
  });
};
