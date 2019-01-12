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
var CollectionService = function (_Service) {
  _inherits(CollectionService, _Service);

  function CollectionService(options) {
    _classCallCheck(this, CollectionService);

    var _this = _possibleConstructorReturn(this, (CollectionService.__proto__ || Object.getPrototypeOf(CollectionService)).call(this, options));

    if (!options || !options.db) {
      throw new Error('MongoDB DB options have to be provided');
    }
    _this.db = options.db;
    return _this;
  }

  // Helper function to process stats object


  _createClass(CollectionService, [{
    key: 'processObjectInfos',
    value: function processObjectInfos(infos) {
      // In Mongo the collection name key is ns and prefixed by the db name, change to the more intuitive name just as in create
      var namespace = infos.ns.split('.');
      if (namespace.length > 1) {
        infos.name = namespace[1];
      }
      delete infos.ns;
      return infos;
    }
  }, {
    key: 'createImplementation',
    value: function createImplementation(id, options) {
      var _this2 = this;

      return this.db.createCollection(id, options).then(function (collection) {
        return collection.stats();
      }).then(function (infos) {
        return _this2.processObjectInfos(infos);
      });
    }
  }, {
    key: 'getImplementation',
    value: function getImplementation(id) {
      return Promise.resolve(this.db.collection(id));
    }
  }, {
    key: 'listImplementation',
    value: function listImplementation() {
      return this.db.collections();
    }
  }, {
    key: 'removeImplementation',
    value: function removeImplementation(item) {
      return item.drop();
    }
  }]);

  return CollectionService;
}(_service2.default);

function init(options) {
  return new CollectionService(options);
}

init.Service = CollectionService;
module.exports = exports['default'];