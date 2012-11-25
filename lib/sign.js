var Q = require('q'),
  _ = require('underscore'),
  moment = require('moment'),
  db = require('./db'),
  model = require('./db/model');

/**
 * Check whether the object represents a valid sign.
 * @param  {Object}     sign
 * @return {Q(Boolean)}
 */
exports.isValid = function(sign) {
  return exports.getValidationErrors(sign)
  .then(function(errors) {
    return errors.length === 0;
  });
};

/**
 * Get an array of validation errors from the sign.
 * @param  {Object}   sign
 * @return {Q(Array)}
 */
exports.getValidationErrors = function(sign) {
  return Q.all([
    _.isObject(sign) ? null : 'sign must be an object',
    exports.isNameSet(sign) ? null : 'name is required',
    exports.isNameUniqueForAccount(sign).then(function(unique) {
      return unique ? null : 'name is not unique for account';
    })]).then(function(results) {
    return _.filter(results, function(result) {
      return result !== null;
    });
  });
};

/**
 * Checks whether the name is set.
 * @param  {Object}  sign
 * @return {Boolean}
 */
exports.isNameSet = function(sign) {
  if (!_.isString(sign.name)) return false;
  return sign.name.trim().length > 0;
};

/**
 * Checks whether the name is unique given the account
 * @param  {Object}  sign
 * @return {Q(Boolean)}
 */
exports.isNameUniqueForAccount = function(sign) {
  return Q.fcall(function() {
    return true;
  });
};

/**
 * Inserts a single sign, erroring on failure.
 * @param  {Object} sign
 * @return {Q(Object)} Saved sign, including the new id and generated values.
 */
exports.insert = function(sign) {
  return exports.insertMany([sign])
  .then(function(insertedSigns) {
    return insertedSigns[0];
  });
};

/**
 * Insert many signs at once.
 * @param  {Array(Object)} signs
 * @return {Q(Array(Object))} Saved signs, including the new ids and
 * generated values.
 */
exports.insertMany = function(signs) {
  return model.insertMany(signs, exports.isValid, exports.prepareForUpdate,
    exports.tableName(), exports.idFieldName());
};

/**
 * Adds any required information to a sign required for insert.
 * @param  {Object} sign
 * @return {Q(Object)}
 */
exports.prepareForInsert = function(sign) {
  return exports.prepareForSave(sign)
  .then(function() {
    sign.createdAt = moment().utc().format();
    return sign;
  });
};

/**
 * Adds any required information to a sign required for update.
 * @param  {Object} sign
 * @return {Q(Object)}
 */
exports.prepareForUpdate = function(sign) {
  return exports.prepareForSave(sign);
};

/**
 * Adds any required information to a sign required for saving.
 * @param  {Object} sign
 * @return {Q(Object)}
 */
exports.prepareForSave = function(sign) {
  return Q.fcall(function() {
    sign.updatedAt = moment().utc().format();
    return sign;
  });
};

/**
 * Gets the table name where signs are stored.
 * @return {String}
 */
exports.tableName = function() {
  return 'signs';
};

/**
 * Gets the name of the id field in the signs table.
 * @return {String}
 */
exports.idFieldName = function() {
  return 'id';
};

/**
 * Updates a single sign, erroring on failure.
 * @param  {Object} sign The sign to update, including the current id.
 * @return {Q(Object)} Saved sign, including generated values.
 */
exports.update = function(sign) {
  return exports.updateMany([sign])
  .then(function(updatedSigns) {
    return updatedSigns[0];
  });
};

/**
 * Update many signs at once.
 * @param  {Array(Object)} signs The signs to update, including the
 * current id.
 * @return {Q(Array(Object))} Saved signs, including generated values.
 */
exports.updateMany = function(signs) {
  return model.updateMany(signs, exports.isValid, exports.prepareForUpdate,
    exports.tableName(), exports.idFieldName());
};

/**
 * Finds a sign by id.
 * @param  {String}   signId
 * @return {Q(Array)}
 */
exports.find = function(signId) {
  return model.find(signId, exports.tableName(), exports.idFieldName());
};
