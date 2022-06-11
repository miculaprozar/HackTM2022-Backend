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

function OrderService(configuration, dbService) {
  this._dbService = dbService;
  this._config = configuration;
}

OrderService.prototype.getStatus = async function (parameters) {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = `SELECT * from status`;
      if (
        parameters &&
        typeof parameters === "object" &&
        Object.keys(parameters).length > 0
      ) {
        sql = addQueryConditions(sql, parameters, true, "status.");
      }
      let result = await this._dbService.query(sql);

      return resolve(result);
    } catch (err) {
      return reject(err);
    }
  });
};

OrderService.prototype.getOrders = async function (parameters) {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = `SELECT orders.id, orders.customerId, orders.sellerId, orders.details, orders.locationId, orders.statusId, orders.deliveryDate,
      u1.email as customerEmail, u1.firstName as customerFirstName, u1.lastName as customerLastName, u1.companyName as customerCompanyName,
      u1.companyVAT as customerVAT, u1.companyRegNumber as customerRegNumber, u1.companyIBAN as customerIBAN, 
      u2.email as customerEmail, u2.firstName as sellerFirstName, u2.lastName as sellerLastName, u2.companyName as sellerCompanyName,
      u2.companyVAT as sellerVAT, u2.companyRegNumber as sellerRegNumber, u2.companyIBAN as sellerIBAN, 
      l.longitude, l.latitude, l.details as locationDetails,
      s.name as status
      from orders 
      LEFT JOIN users u1 
      ON orders.customerId = u1.id 
      LEFT JOIN users u2 
      ON orders.sellerId = u2.id 
      LEFT JOIN locations l 
      ON orders.locationId = l.id 
      LEFT JOIN status s 
      ON orders.statusId = s.id`;
      if (
        parameters &&
        typeof parameters === "object" &&
        Object.keys(parameters).length > 0
      ) {
        sql = addQueryConditions(sql, parameters, true, "o.");
      }
      let result = await this._dbService.query(sql);

      result = await Promise.all(result.map(async order => {
        let productDBData = await this._dbService.query(`SELECT productId, productName, productDescription, quantity, measurementUnit, price, currency, AIScore, AIDetails 
        FROM orderproduct where orderId=?`, [order.id]);

        if (productDBData && productDBData.length > 0) {
          order.products = productDBData;
        }

        return order;
      }))

      return resolve(result);
    } catch (err) {
      return reject(err);
    }
  });
};

OrderService.prototype.getOrderProducts = async function (parameters) {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = `SELECT * from orderproduct`;
      if (
        parameters &&
        typeof parameters === "object" &&
        Object.keys(parameters).length > 0
      ) {
        sql = addQueryConditions(sql, parameters, true, "orderproduct.");
      }
      let result = await this._dbService.query(sql);

      return resolve(result);
    } catch (err) {
      return reject(err);
    }
  });
};

OrderService.prototype.updateOrder = async function (
  idObject,
  parameters
) {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = `UPDATE orders SET `;
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
      const result = await this.getOrders(idObject).catch((err) => {
        log.error(err);
        throw new HttpError(500, "Ceva nu a mers bine!");
      });

      return resolve(result);
    } catch (err) {
      return reject(err);
    }
  });
};

OrderService.prototype.updateOrderProduct = async function (
  idObject,
  parameters
) {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = `UPDATE orderproduct SET `;
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
      const result = await this.getOrderProducts(idObject).catch((err) => {
        log.error(err);
        throw new HttpError(500, "Ceva nu a mers bine!");
      });

      return resolve(result);
    } catch (err) {
      return reject(err);
    }
  });
};

OrderService.prototype.createOrder = async function (parameters) {
  return new Promise(async (resolve, reject) => {
    try {

      parameters.products = await Promise.all(parameters.products.map(async product => {
        let productDBData = await this._dbService.query(`SELECT p.name, p.description, p.price, p.currency, mu.name as measurementUnit from products p, measurementunit mu where p.id=? AND 
        p.measurementUnitId = mu.id`, [product.id]);

        if (productDBData && productDBData.length > 0) {
          product.name = productDBData[0].name;
          product.description = productDBData[0].description;
          product.price = productDBData[0].price;
          product.currency = productDBData[0].currency;
          product.measurementUnit = productDBData[0].measurementUnit;
        }

        return product;
      }))

      let sql = `INSERT INTO orders(customerId, sellerId, details, locationId, deliveryDate) 
      VALUES(?, ?, ?, ?, ?)`;

      let responseInsertOrder = await this._dbService.query(sql, [parameters.customerId, parameters.sellerId, parameters.details, parameters.locationId, parameters.deliveryDate]).catch((err) => {
        log.error(err);
        throw new HttpError(500, "Nu s-a putut face adaugarea comenzii!");
      });

      parameters.products = await Promise.all(parameters.products.map(async product => {
        let productDBData = await this._dbService.query(`INSERT INTO orderproduct(orderId, productId, productName, productDescription, 
          quantity, measurementUnit, price, currency) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
          [responseInsertOrder.insertId, product.id, product.name, product.description, product.quantity, product.measurementUnit,
          product.price, product.currency]);

        return product;
      }))

      return resolve("Order created!");
    } catch (err) {
      return reject(err);
    }
  });
};

module.exports = OrderService;
