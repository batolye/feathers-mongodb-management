import errors from '@feathersjs/errors';
import { filterQuery, select, sort } from '@feathersjs/adapter-commons';
import { _ } from '@feathersjs/commons';

console.log('log: _.isObject', _.isObject);
const _isObject = _.isObject;
console.log('log: _isObject', _isObject);

const specialFilters = {
  $in (key, ins) {
    return current => ins.indexOf(current[key]) !== -1;
  },

  $nin (key, nins) {
    return current => nins.indexOf(current[key]) === -1;
  },

  $lt (key, value) {
    return current => current[key] < value;
  },

  $lte (key, value) {
    return current => current[key] <= value;
  },

  $gt (key, value) {
    return current => current[key] > value;
  },

  $gte (key, value) {
    return current => current[key] >= value;
  },

  $ne (key, value) {
    return current => current[key] !== value;
  }
};
function matcher (originalQuery) {
  const query = _.omit(originalQuery, '$limit', '$skip', '$sort', '$select');

  return function (item) {
    if (query.$or && _.some(query.$or, or => matcher(or)(item))) {
      return true;
    }

    return _.every(query, (value, key) => {
      if (value !== null && typeof value === 'object') {
        return _.every(value, (target, filterType) => {
          if (specialFilters[filterType]) {
            const filter = specialFilters[filterType](key, target);
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
class Service {
  constructor (options) {
    this.paginate = options.paginate || {};
    this._matcher = options.matcher || matcher;
    this._sorter = options.sorter || sort;
  }

  // Find without hooks and mixins that can be used internally and always returns
  // a pagination object
  _find (params, getFilter = filterQuery) {
    const { query, filters } = getFilter(params.query || {});
    const adminDb = params.adminDb;
    // first get all items
    return this.listImplementation(adminDb)
      .then(items => {
        let infosPromises = items.map(item => {
          // Then get stats/infos for all items if possible
          if (typeof item.stats === 'function') {
            return item.stats();
          } else {
            return Promise.resolve(item);
          }
        });
        return Promise.all(infosPromises);
      })
      .then(infos => {
        _.each(infos, this.processObjectInfos);

        let values = _.values(infos).filter(this._matcher(query));

        const total = values.length;

        if (filters.$sort) {
          values.sort(this._sorter(filters.$sort));
        }

        if (filters.$skip) {
          values = values.slice(filters.$skip);
        }

        if (typeof filters.$limit !== 'undefined') {
          values = values.slice(0, filters.$limit);
        }

        if (filters.$select) {
          values = values.map(value => _.pick(value, ...filters.$select));
        }

        return {
          total,
          limit: filters.$limit,
          skip: filters.$skip || 0,
          data: values
        };
      });
  }

  find (params) {
    const paginate =
      typeof params.paginate !== 'undefined' ? params.paginate : this.paginate;
    // Call the internal find with query parameter that include pagination
    const result = this._find(params, query => filterQuery(query, paginate));

    if (!(paginate && paginate.default)) {
      return result.then(page => page.data);
    }

    return result;
  }

  // Create without hooks and mixins that can be used internally
  _create (data, params) {
    let name = data.name;
    if (!name) {
      return Promise.reject(
        new errors.BadRequest('Missing required name to create a collection')
      );
    }

    // The driver complies about valid options
    delete data.name;
    return Promise.resolve(this.createImplementation(name, data)).then(
      select(params)
    );
  }

  create (data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this._create(current)));
    }

    return this._create(data, params);
  }

  // Remove without hooks and mixins that can be used internally
  _remove (idOrInfos, params) {
    let itemPromise;
    if (_isObject(idOrInfos)) {
      itemPromise = this.getImplementation(idOrInfos.name);
    } else {
      itemPromise = this.getImplementation(idOrInfos);
    }
    return itemPromise.then(item => {
      if (item) {
        return this.removeImplementation(item).then(_ => {
          if (_isObject(idOrInfos)) {
            return idOrInfos;
          } else {
            return { name: idOrInfos };
          }
        });
      }

      if (_isObject(idOrInfos)) {
        return Promise.reject(
          new errors.NotFound(`No record found for id '${idOrInfos.name}'`)
        );
      } else {
        return Promise.reject(
          new errors.NotFound(`No record found for id '${idOrInfos}'`)
        );
      }
    });
  }

  remove (id, params) {
    if (id === null) {
      return this._find(params).then(page =>
        Promise.all(
          page.data.map(current =>
            this._remove(current, params).then(select(params))
          )
        )
      );
    }

    return this._remove(id, params);
  }

  /* NOT IMPLEMENTED
  patch (id, data, params) {

  }

  update (id, data, params) {

  }
  */
}

export default Service;
