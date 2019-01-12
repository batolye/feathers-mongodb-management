import Service from './service';

// Create the service.
class DatabaseService extends Service {
  constructor (options) {
    super(options);
    if (!options || !options.client) {
      throw new Error('MongoDB DB options have to be provided');
    }

    this.client = options.client;
  }

  // Helper function to process stats object
  processObjectInfos (infos) {
    // In Mongo the db name key is db, change to the more intuitive name just as in create
    infos.name = infos.db;
    delete infos.db;
    return infos;
  }

  createImplementation (id, options) {
    return this.client
      .db(id, options)
      .stats()
      .then(infos => this.processObjectInfos(infos));
  }

  getImplementation (id) {
    return Promise.resolve(this.client.db(id));
  }

  listImplementation (adminDb) {
    return adminDb.listDatabases().then(data => {
      // Get DB objects from names
      return data.databases.map(databaseInfo =>
        this.client.db(databaseInfo.name)
      );
    });
  }

  removeImplementation (item) {
    return item.dropDatabase();
  }
}

export default function init (options) {
  return new DatabaseService(options);
}

init.Service = DatabaseService;
