const i18n = require('i18n');
const path = require('path');

i18n.configure({
  // setup some locales - other locales default to en silently
  locales: ['en', 'ar'],

  // you may alter a site wide default locale
  defaultLocale: 'en',

  // will return translation from defaultLocale in case current locale doesn't provide it
  retryInDefaultLocale: true,

  // sets a custom cookie name to parse locale settings from - defaults to NULL
  cookie: 'locale',

  // sets a custom header name to read the language preference from - accept-language header by default
  header: 'accept-language',

  // where to store json files - defaults to './locales' relative to modules directory
  directory: path.join(__dirname, 'locales'),

  // watch for changes in JSON files to reload locale on updates - defaults to false
  autoReload: true,

  // whether to write new locale information to disk - defaults to true
  updateFiles: true,

  // sync locale information across all files - defaults to false
  syncFiles: true,

  // setting extension of json files - defaults to '.json' (you might want to set this to '.js' according to webtranslateit)
  extension: '.json',

  // enable object notation
  objectNotation: true,

  // object or [obj1, obj2] to bind the i18n api and current locale to - defaults to null
  register: global,

  // Parser can be any object that responds to .parse & .stringify
  parser: JSON
})

module.exports = i18n;
