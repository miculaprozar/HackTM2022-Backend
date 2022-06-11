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

function ProductService(configuration, dbService) {
  this._dbService = dbService;
  this._config = configuration;
}

ProductService.prototype.getProducts = async function (parameters) {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = `SELECT p.id, p.name, p.description, p.quantity, p.measurementUnitId, p.price, p.currency, mu.name, u.id as userId, u.firstName, u.lastName, u.companyName 
      FROM products p, users u, measurementunit mu 
      WHERE mu.id = p.measurementUnitId 
      AND p.userId = u.id`;
      if (
        parameters &&
        typeof parameters === "object" &&
        Object.keys(parameters).length > 0
      ) {
        sql = addQueryConditions(sql, parameters, false, "p.");
      }
      let result = await this._dbService.query(sql);

      return resolve(result);
    } catch (err) {
      return reject(err);
    }
  });
};

ProductService.prototype.updateProduct = async function (
  idObject,
  parameters
) {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = `UPDATE products SET `;
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
      const result = await this.getProducts(idObject).catch((err) => {
        log.error(err);
        throw new HttpError(500, "Ceva nu a mers bine!");
      });

      return resolve(result);
    } catch (err) {
      return reject(err);
    }
  });
};

ProductService.prototype.createProduct = async function (parameters) {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = `INSERT INTO products(name, description, quantity, measurementUnitId, userId, price, currency) 
      VALUES(?, ?, ?, ?, ?, ?, ?)`;

      await this._dbService.query(sql, [parameters.name, parameters.description, parameters.quantity, parameters.measurementUnitId, parameters.userId, parameters.price, parameters.currency]).catch((err) => {
        log.error(err);
        throw new HttpError(500, "Nu s-a putut face adaugarea!");
      });

      return resolve("Product created!");
    } catch (err) {
      return reject(err);
    }
  });
};

module.exports = ProductService;
