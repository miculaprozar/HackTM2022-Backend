'use strict';
const mysqlManager = require('mysql');

const log = require('./logService');


function DbService(config) {
  
  this._poolManager = mysqlManager.createPool({
    connectionLimit: config.pool.connectionLimit,
    connectTimeout: config.pool.connectTimeout,
    acquireTimeout: config.pool.acquireTimeout,
    host: process.env.dbHost ? process.env.dbHost : config.storage.host,
    port: config.storage.port,
    user: process.env.dbUser ? process.env.dbUser : config.storage.user,
    password: process.env.dbPassword ? process.env.dbPassword : config.storage.password,
    database: process.env.dbDatabase ? process.env.dbDatabase : config.storage.database,
    dateStrings : config.storage.dateStrings
  });

  this._queryTimeout = config.pool.queryTimeout;

  this._poolManager.on('acquire', function(connection) {
    log.debug('Connection %d acquired', connection.threadId);
  });

  this._poolManager.on('release', function(connection) {
    log.debug('Connection %d released', connection.threadId);
  });

  this._poolManager.on('enqueue', function() {
    log.debug('Waiting for available connection slot.');
  });
}

DbService.prototype.closeConnections = function() {
  return new Promise((resolve, reject) => {
    this._poolManager.end(function(err) {
      if (err) {
        log.error('Log error || dbService || closeConenctions || reject :' + JSON.stringify(err));
        return reject();
      } else {
        return resolve();
      }
    });
  });
};

DbService.prototype._getConnection = function() {
  return new Promise((resolve, reject) => {
    this._poolManager.getConnection(function(err, connection) {
      if (err) {
        log.error(`Db connection issues ${JSON.stringify(err)}`);
        return reject(err);
      } else {
        if (connection) {
          return resolve(connection);
        } else {
          log.error(`Db connection issues ${JSON.stringify(err)}`);
          return reject(err);
        }
      }
    });
  });
};

DbService.prototype.query = function(query, params) {
  return new Promise(async (resolve, reject) => {
    const connection = await this._getConnection();
    const queryTimeout = this._queryTimeout;

    try {
      connection.query({
        sql: query,
        timeout: queryTimeout,
      }, params, (err, results) => {
        
        connection.release();

        if (err) {
          log.error(`Db query issues ${JSON.stringify(err)}`);
          return reject(err);
        }

        if (results.length <= 0) {
          return resolve([]);
        }

        return resolve(results);
      });
    } catch (err) {
      
      log.error(`Db query issues issues ${JSON.stringify(err)}`);
      connection.release();

      return reject(err);
    }
  });
};

module.exports = DbService;
