"use strict";
const log = require("./logService");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const moment = require("moment");
const config = require("../../config.js");
const HttpError = require("../util/httpError");
const addQueryConditions = require("../util/addQueryConditions");
const addUpdateQueryConditions = require("../util/addUpdateQueryConditions");
const { param } = require("express-validator");

function LocationService(configuration, dbService) {
  this._dbService = dbService;
  this._config = configuration;
}

LocationService.prototype.getLocations = async function (parameters) {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = `SELECT l.id, l.longitude, l.latitude, l.details, u.id as userId, u.firstName, u.lastName, u.companyName 
      FROM locations l, users u 
      WHERE l.userId = u.id`;
      if (
        parameters &&
        typeof parameters === "object" &&
        Object.keys(parameters).length > 0
      ) {
        sql = addQueryConditions(sql, parameters, false, "l.");
      }
      let result = await this._dbService.query(sql);

      result = await Promise.all(result.map(async user => {
        let locations = await this._dbService.query(`SELECT * from locations where locations.userId=?`, [user.id]);

        if (locations && locations.length > 0) {
          user.locations = locations;
        }
        else {
          user.locations = [];
        }
        return user;
      }))

      return resolve(result);
    } catch (err) {
      return reject(err);
    }
  });
};

LocationService.prototype.updateLocation = async function (
  idObject,
  parameters
) {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = `UPDATE locations SET `;
      if (
        !(
          parameters &&
          typeof parameters === "object" &&
          Object.keys(parameters).length > 0
        ) &&
        !(
          idObject &&
          typeof idObject === "object" &&
          Object.keys(idObject).length > 0
        )
      ) {
        throw new HttpError(
          403,
          "Datele ce trebuiesc modificate nu au fost transmise corect!"
        );
      }
      sql = addUpdateQueryConditions(sql, idObject, parameters);

      await this._dbService.query(sql).catch((err) => {
        log.error(err);
        throw new HttpError(500, "Nu s-au putut face modificarile!");
      });
      const result = await this.getLocations(idObject).catch((err) => {
        log.error(err);
        throw new HttpError(500, "Ceva nu a mers bine!");
      });

      return resolve(result);
    } catch (err) {
      return reject(err);
    }
  });
};

LocationService.prototype.createLocation = async function (parameters) {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = `INSERT INTO locations(userId, longitude, latitude, details) 
      VALUES(?, ?, ?, ?)`;

      await this._dbService.query(sql, [parameters.userId, parameters.longitude, parameters.latitude, parameters.details]).catch((err) => {
        log.error(err);
        throw new HttpError(500, "Nu s-a putut face adaugarea!");
      });

      return resolve("Location created!");
    } catch (err) {
      return reject(err);
    }
  });
};

module.exports = LocationService;
