'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _errors = require('@feathersjs/errors');

var _errors2 = _interopRequireDefault(_errors);

var _adapterCommons = require('@feathersjs/adapter-commons');

var _commons = require('@feathersjs/commons');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

console.log('log: _.isObject', _commons._.isObject);
var _isObject = _commons._.isObject;
console.log('log: _isObject', _isObject);

var specialFilters = {
  $in: function $in(key, ins) {
    return function (current) {
      return ins.indexOf(current[key]) !== -1;
    };
  },
  $nin: function $nin(key, nins) {
    return function (current) {
      return nins.indexOf(current[key]) === -1;
    };
  },
  $lt: function $lt(key, value) {
    return function (current) {
      return current[key] < value;
    };
  },
  $lte: function $lte(key, value) {
    return function (current) {
      return current[key] <= value;
    };
  },
  $gt: function $gt(key, value) {
    return function (current) {
      return current[key] > value;
    };
  },
  $gte: function $gte(key, value) {
    return function (current) {
      return current[key] >= value;
    };
  },
  $ne: function $ne(key, value) {
    return function (current) {
      return current[key] !== value;
    };
  }
};
function matcher(originalQuery) {
  var query = _commons._.omit(originalQuery, '$limit', '$skip', '$sort', '$select');

  return function (item) {
    if (query.$or && _commons._.some(query.$or, function (or) {
      return matcher(or)(item);
    })) {
      return true;
    }

    return _commons._.every(query, function (value, key) {
      if (value !== null && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
        return _commons._.every(value, function (target, filterType) {
          if (specialFilters[filterType]) {
            var filter = specialFilters[filterType](key, target);
            return filter(item);
          }

          return false;
        });
      } else if (typeof item[key] !== 'undefined') {
        return item[key] === query[key];
      }

      return false;
    });
  };
}

// Create the base service.

var Service = function () {
  function Service(options) {
    _classCallCheck(this, Service);

    this.paginate = options.paginate || {};
    this._matcher = options.matcher || matcher;
    this._sorter = options.sorter || _adapterCommons.sort;
  }

  // Find without hooks and mixins that can be used internally and always returns
  // a pagination object


  _createClass(Service, [{
    key: '_find',
    value: function _find(params) {
      var _this = this;

      var getFilter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _adapterCommons.filterQuery;

      var _getFilter = getFilter(params.query || {}),
          query = _getFilter.query,
          filters = _getFilter.filters;

      var adminDb = params.adminDb;
      // first get all items
      return this.listImplementation(adminDb).then(function (items) {
        var infosPromises = items.map(function (item) {
          // Then get stats/infos for all items if possible
          if (typeof item.stats === 'function') {
            return item.stats();
          } else {
            return Promise.resolve(item);
          }
        });
        return Promise.all(infosPromises);
      }).then(function (infos) {
        _commons._.each(infos, _this.processObjectInfos);

        var values = _commons._.values(infos).filter(_this._matcher(query));

        var total = values.length;

        if (filters.$sort) {
          values.sort(_this._sorter(filters.$sort));
        }

        if (filters.$skip) {
          values = values.slice(filters.$skip);
        }

        if (typeof filters.$limit !== 'undefined') {
          values = values.slice(0, filters.$limit);
        }

        if (filters.$select) {
          values = values.map(function (value) {
            return _commons._.pick.apply(_commons._, [value].concat(_toConsumableArray(filters.$select)));
          });
        }

        return {
          total: total,
          limit: filters.$limit,
          skip: filters.$skip || 0,
          data: values
        };
      });
    }
  }, {
    key: 'find',
    value: function find(params) {
      var paginate = typeof params.paginate !== 'undefined' ? params.paginate : this.paginate;
      // Call the internal find with query parameter that include pagination
      var result = this._find(params, function (query) {
        return (0, _adapterCommons.filterQuery)(query, paginate);
      });

      if (!(paginate && paginate.default)) {
        return result.then(function (page) {
          return page.data;
        });
      }

      return result;
    }

    // Create without hooks and mixins that can be used internally

  }, {
    key: '_create',
    value: function _create(data, params) {
      var name = data.name;
      if (!name) {
        return Promise.reject(new _errors2.default.BadRequest('Missing required name to create a collection'));
      }

      // The driver complies about valid options
      delete data.name;
      return Promise.resolve(this.createImplementation(name, data)).then((0, _adapterCommons.select)(params));
    }
  }, {
    key: 'create',
    value: function create(data, params) {
      var _this2 = this;

      if (Array.isArray(data)) {
        return Promise.all(data.map(function (current) {
          return _this2._create(current);
        }));
      }

      return this._create(data, params);
    }

    // Remove without hooks and mixins that can be used internally

  }, {
    key: '_remove',
    value: function _remove(idOrInfos, params) {
      var _this3 = this;

      var itemPromise = void 0;
      if (_isObject(idOrInfos)) {
        itemPromise = this.getImplementation(idOrInfos.name);
      } else {
        itemPromise = this.getImplementation(idOrInfos);
      }
      return itemPromise.then(function (item) {
        if (item) {
          return _this3.removeImplementation(item).then(function (_) {
            if (_isObject(idOrInfos)) {
              return idOrInfos;
            } else {
              return { name: idOrInfos };
            }
          });
        }

        if (_isObject(idOrInfos)) {
          return Promise.reject(new _errors2.default.NotFound('No record found for id \'' + idOrInfos.name + '\''));
        } else {
          return Promise.reject(new _errors2.default.NotFound('No record found for id \'' + idOrInfos + '\''));
        }
      });
    }
  }, {
    key: 'remove',
    value: function remove(id, params) {
      var _this4 = this;

      if (id === null) {
        return this._find(params).then(function (page) {
          return Promise.all(page.data.map(function (current) {
            return _this4._remove(current, params).then((0, _adapterCommons.select)(params));
          }));
        });
      }

      return this._remove(id, params);
    }

    /* NOT IMPLEMENTED
    patch (id, data, params) {
      }
      update (id, data, params) {
      }
    */

  }]);

  return Service;
}();

exports.default = Service;
module.exports = exports['default'];