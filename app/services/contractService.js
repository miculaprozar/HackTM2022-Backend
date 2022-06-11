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

function ContractService(configuration, dbService) {
  this._dbService = dbService;
  this._config = configuration;
}

ContractService.prototype.getContracts = async function (parameters) {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = `SELECT * from contract `;
      if (
        parameters &&
        typeof parameters === "object" &&
        Object.keys(parameters).length > 0
      ) {
        sql = addQueryConditions(sql, parameters, true, "");
      }
      let result = await this._dbService.query(sql);

      return resolve(result);
    } catch (err) {
      return reject(err);
    }
  });
};

ContractService.prototype.updateContract = async function (
  idObject,
  parameters
) {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = `UPDATE contract SET `;
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
      const result = await this.getContracts(idObject).catch((err) => {
        log.error(err);
        throw new HttpError(500, "Ceva nu a mers bine!");
      });

      return resolve(result);
    } catch (err) {
      return reject(err);
    }
  });
};

ContractService.prototype.createContract = async function (parameters) {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = `INSERT INTO contract(customerId, sellerId, customerCompanyName, customerVAT, customerRegNumber, 
        customerIBAN, sellerCompanyName, sellerVAT, sellerRegNumber, sellerIBAN, date) 
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      await this._dbService.query(sql, [parameters.customerId, parameters.sellerId, parameters.customerCompanyName, parameters.customerVAT,
      parameters.customerRegNumber, parameters.customerIBAN, parameters.sellerCompanyName,
      parameters.sellerVAT, parameters.sellerRegNumber, parameters.sellerIBAN, new Date()]).catch((err) => {
        log.error(err);
        throw new HttpError(500, "Nu s-a putut face adaugarea!");
      });

      return resolve("Contract created!");
    } catch (err) {
      return reject(err);
    }
  });
};

module.exports = ContractService;
