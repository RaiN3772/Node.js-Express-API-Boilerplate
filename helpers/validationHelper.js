const ApiError = require('../helpers/ApiError');
const httpStatus = require('http-status');

/**
 * Validates if the keys in the provided data are all allowed.
 * 
 * @param {Object} data The data to validate.
 * @param {Array} allowedFields An array of strings representing the allowed fields.
 * 
 * @returns {Object} An object containing the validation result and any invalid fields.
 */

function validateFields(data, allowedFields) {
    const updates = Object.keys(data);
    const isValidOperation = updates.every(update => allowedFields.includes(update));
    const invalidFields = isValidOperation ? [] : updates.filter(update => !allowedFields.includes(update));

    if (!isValidOperation) throw new ApiError(httpStatus.BAD_REQUEST, i18n.__('error.invalid_operation'), isValidOperation, `Invalid Fields: ${invalidFields}`);
}

/*
function validateFields(data, allowedFields, res) {
  const updates = Object.keys(data);
  const isValidOperation = updates.every(update => allowedFields.includes(update));
  const invalidFields = isValidOperation ? [] : updates.filter(update => !allowedFields.includes(update));

  if (!isValidOperation) {
      return res.status(400).send({
          error: true,
          message: 'Oops! It seems like our data elves are having trouble with your magic spell. Please make sure your data is as genuine as a unicorn\'s horn, and try again!',
          
      });
  }
}*/

module.exports = {
    validateFields
};
