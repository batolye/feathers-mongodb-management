'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = init;

var _service = require('./service');

var _service2 = _interopRequireDefault(_service);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// Create the service.
var DatabaseService = function (_Service) {
  _inherits(DatabaseService, _Service);

  function DatabaseService(options) {
    _classCallCheck(this, DatabaseService);

    var _this = _possibleConstructorReturn(this, (DatabaseService.__proto__ || Object.getPrototypeOf(DatabaseService)).call(this, options));

    if (!options || !options.client) {
      throw new Error('MongoDB DB options have to be provided');
    }

    _this.client = options.client;
    return _this;
  }

  // Helper function to process stats object


  _createClass(DatabaseService, [{
    key: 'processObjectInfos',
    value: function processObjectInfos(infos) {
      // In Mongo the db name key is db, change to the more intuitive name just as in create
      infos.name = infos.db;
      delete infos.db;
      return infos;
    }
  }, {
    key: 'createImplementation',
    value: function createImplementation(id, options) {
      var _this2 = this;

      return this.client.db(id, options).stats().then(function (infos) {
        return _this2.processObjectInfos(infos);
      });
    }
  }, {
    key: 'getImplementation',
    value: function getImplementation(id) {
      return Promise.resolve(this.client.db(id));
    }
  }, {
    key: 'listImplementation',
    value: function listImplementation(adminDb) {
      var _this3 = this;

      return adminDb.listDatabases().then(function (data) {
        // Get DB objects from names
        return data.databases.map(function (databaseInfo) {
          return _this3.client.db(databaseInfo.name);
        });
      });
    }
  }, {
    key: 'removeImplementation',
    value: function removeImplementation(item) {
      return item.dropDatabase();
    }
  }]);

  return DatabaseService;
}(_service2.default);

function init(options) {
  return new DatabaseService(options);
}

init.Service = DatabaseService;
module.exports = exports['default'];