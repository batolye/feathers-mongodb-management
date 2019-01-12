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
var UserService = function (_Service) {
  _inherits(UserService, _Service);

  function UserService(options) {
    _classCallCheck(this, UserService);

    var _this = _possibleConstructorReturn(this, (UserService.__proto__ || Object.getPrototypeOf(UserService)).call(this, options));

    if (!options || !options.db) {
      throw new Error('MongoDB DB option has to be provided');
    }
    _this.db = options.db;
    // Only available for Mongo > 2.4, if set to false will fallback to Mongo system users collection
    _this.hasUserInfosCommand = options.hasUserInfosCommand || true;
    return _this;
  }

  // Helper function to process user infos object


  _createClass(UserService, [{
    key: 'processObjectInfos',
    value: function processObjectInfos(infos) {
      // In Mongo the user name key is user, change to the more intuitive name just as in create
      infos.name = infos.user;
      delete infos.user;
      return infos;
    }
  }, {
    key: 'createImplementation',
    value: function createImplementation(id, options) {
      if (!options.password) {
        throw new Error('Password option has to be provided');
      }
      return this.db.addUser(id, options.password, options);
    }
  }, {
    key: 'getImplementation',
    value: function getImplementation(id) {
      if (this.hasUserInfosCommand) {
        return this.db.command({ usersInfo: id }).then(function (data) {
          return data.users[0];
        });
      } else {
        return this.db.collection('system.users').find({ user: id }).toArray().then(function (users) {
          return users[0];
        });
      }
    }
  }, {
    key: 'listImplementation',
    value: function listImplementation() {
      if (this.hasUserInfosCommand) {
        return this.db.command({ usersInfo: 1 }).then(function (data) {
          return data.users;
        });
      } else {
        return this.db.collection('system.users').find().toArray().then(function (users) {
          return users;
        });
      }
    }
  }, {
    key: 'removeImplementation',
    value: function removeImplementation(item) {
      return this.db.removeUser(item.user);
    }
  }]);

  return UserService;
}(_service2.default);

function init(options) {
  return new UserService(options);
}

init.Service = UserService;
module.exports = exports['default'];