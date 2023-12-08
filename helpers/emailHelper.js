const ejs = require('ejs');
const path = require('path');

const renderEmailTemplate = async (templateName, data) => {
  return new Promise((resolve, reject) => {
    ejs.renderFile(path.join(__dirname, `../emailTemplates/${templateName}.ejs`), data, {}, (err, str) => {
      if (err) reject(err);
      resolve(str);
    });
  });
};

module.exports = { renderEmailTemplate };
