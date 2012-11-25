var Q = require('q'),
  _ = require('underscore'),
  db = require('../db');

/**
 * Runs a validator for each item in a set in parallel, and errors on invalid.
 * @param  {Array}    data      Set of data to be validated.
 * @param  {Function} validator Function to validate, returning array of errors.
 * @return {Q(Array)}           Data set is returned on success.
 */
exports.validateManyHard = function(data, validator) {
  return Q.fcall(function() {
    return [data, Q.all(_.map(data, function(element) {
      return validator(element);
    }))];
  })
  .spread(function(data, validations) {
    // Check the validations
    var errors = _.map(_.filter(validations, function(validation) {
      return validation.length > 0;
    }), function(validation, index) {
      return "Validation errors for element at offset " + index + "\n" +
        validation.join("\n");
    });
    if (errors.length > 0) throw new Error(errors.join("\n"));
    return data;
  });  
};

/**
 * Runs a preparer function for each item in a set in parallel.
 * @param  {Array}    data     Set of data to be validated.
 * @param  {Function} preparer Function to prepare data.
 * @return {Q(Array)}          The prepared data set.
 */
exports.prepareMany = function(data, preparer) {
  return Q.all(_.map(data, function(element) {
    return preparer(element);
  }));
};

/**
 * Insert a number of rows, given a validator, a preparer, and table / id.
 * @param  {Array}    data      Data set to be inserted.
 * @param  {Function} validator Validator function to run over data set.
 * Validator must return an array of errors.
 * @param  {Function} preparer  Preparer function to prepare data.
 * @param  {String}   tableName The table name to insert into.
 * @param  {String}   idField   The id field which will have generated values.
 * @return {Q(Array)}           The prepared and saved data with ids.
 */
exports.insertMany = function(data, validator, preparer, tableName, idField) {
  return exports.validateManyHard(data, validator)
  .then(function(validatedData) {
    return Q.all([db(), exports.prepareMany(validatedData, preparer)]);
  })
  .spread(function(r, preparedElements) {
    return [preparedElements,
      db.qcollect(r.table(tableName).insert(preparedElements).run())];
  })
  .spread(function(preparedElements, result) {
    if (result[0].errors > 0) throw new Error(result[0].errors +
      ' errors inserting');
    _.each(result[0].generated_keys, function(generatedKey, index) {
      preparedElements[index][idField] = generatedKey;
    });
    return preparedElements;
  });
};

/**
 * Update a number of rows, given a validator, a preparer, and table / id.
 * @param  {Array}    data      Data set to be updateed.
 * @param  {Function} validator Validator function to run over data set.
 * Validator must return an array of errors.
 * @param  {Function} preparer  Preparer function to prepare data.
 * @param  {String}   tableName The table name to update into.
 * @param  {String}   idField   The id field which will have generated values.
 * @return {Q(Array)}           The prepared and saved data with ids.
 */
exports.updateMany = function(data, validator, preparer, tableName, idField) {
  return exports.validateManyHard(data, validator)
  .then(function(validatedData) {
    return Q.all([db(), exports.prepareMany(validatedData, preparer)]);
  })
  .spread(function(r, preparedElements) {
    return [preparedElements, Q.all(_.map(preparedElements, function(e) {
      return db.qcollect(r.table(tableName)
        .get(e[idField]).update(e).run());
    }))];
  })
  .spread(function(preparedElements, result) {
    if (result[0].errors > 0) throw new Error(result[0].errors +
      ' errors updating');
    return preparedElements;
  });
};

/**
 * Finds a row, given an id field name and a table name.
 * @param  {String} id
 * @param  {String} tableName
 * @param  {String} idField
 * @return {Q(Array)}
 */
exports.find = function(id, tableName, idField) {
  return db()
  .then(function(r) {
    return db.qcollect(r.table(tableName).get(id, idField).run());
  })
  .then(function(result) {
    return result[0];
  });
};
