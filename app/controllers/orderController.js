"use strict";

const express = require("express");
const HttpError = require("../util/httpError");
const checkAuth = require("../middlewares/check-auth");
const { check, validationResult } = require("express-validator");
const addParameters = require("../util/addParameters");
const log = require("../services/logService");

let orderRouter = express.Router();

let router = function (orderService, webConstants) {
  orderRouter.use((req, res, next) => {
    var contentType = req.headers["content-type"] || "",
      mime = contentType.split(";")[0];

    console.log(
      `GenericController Incoming request contentType=${contentType} mime=${mime}`
    );

    return next();
  });

  orderRouter.get("/", checkAuth, async (req, res, next) => {
    try {
      let parameters = addParameters(req.query, [], "");
      let users = await orderService.getOrders(parameters);
      res.setHeader("Status", 200);
      res.send(users);
    } catch (error) {
      log.error(error.message || error);
      return next(new HttpError(500, error.message || error));
    }
  });

  orderRouter.get("/status", checkAuth, async (req, res, next) => {
    try {
      let parameters = addParameters(req.query, [], "");
      let users = await orderService.getStatus(parameters);
      res.setHeader("Status", 200);
      res.send(users);
    } catch (error) {
      log.error(error.message || error);
      return next(new HttpError(500, error.message || error));
    }
  });

  orderRouter.get("/products", checkAuth, async (req, res, next) => {
    try {
      let parameters = addParameters(req.query, [], "");
      let users = await orderService.getOrderProducts(parameters);
      res.setHeader("Status", 200);
      res.send(users);
    } catch (error) {
      log.error(error.message || error);
      return next(new HttpError(500, error.message || error));
    }
  });

  orderRouter.put("/:id", checkAuth, async (req, res, next) => {
    try {
      let parameters = addParameters(req.body, ["id", "customerId", "sellerId", "locationId"], "");
      const result = await orderService.updateOrder(
        { id: req.params.id },
        parameters
      );

      res.status(200).send(result);
    } catch (error) {
      log.error(error.message || error);
      return next(new HttpError(500, error.message || error));
    }
  });

  orderRouter.put("/AI/:id", checkAuth, async (req, res, next) => {
    try {
      let parameters = addParameters(req.body, ["id", "orderId", "productId", "productName", "productDescription", "quantity",
        "measurementUnit", "price", "currency"], "");
      const result = await orderService.updateOrderProduct(
        { id: req.params.id },
        parameters
      );

      res.status(200).send(result);
    } catch (error) {
      log.error(error.message || error);
      return next(new HttpError(500, error.message || error));
    }
  });

  orderRouter.post(
    "/", checkAuth,
    [
      check("sellerId", "sellerId obligatoriu").exists(),
      check("locationId", "locationId obligatoriu").exists(),
      check("products", "products obligatoriu").exists()
    ],
    async (req, res, next) => {
      const validatorError = validationResult(req);
      if (!validatorError.isEmpty()) {
        return res.status(400).json({ errors: validatorError.array() });
      }
      try {
        let order = {
          customerId: req.userData.UserId,
          sellerId: req.body.sellerId,
          details: req.body.details ? req.body.details : '',
          locationId: req.body.locationId,
          products: req.body.products,
          deliveryDate: req.body.deliveryDate ? req.body.deliveryDate : null
        };
        let result = await orderService.createOrder(order);

        res.setHeader("Status", 200);
        res.send(result);
      } catch (error) {
        log.error(error.message || error);
        return next(new HttpError(500, error.message || error));
      }
    }
  );

  return orderRouter;
};

module.exports = router;
