'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = init;

var _database = require('./database');

var _database2 = _interopRequireDefault(_database);

var _collection = require('./collection');

var _collection2 = _interopRequireDefault(_collection);

var _user = require('./user');

var _user2 = _interopRequireDefault(_user);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('feathers-mongodb-management');

function init() {
  debug('Initializing feathers-mongodb-management');
}

init.database = _database2.default;
init.collection = _collection2.default;
init.user = _user2.default;
module.exports = exports['default'];