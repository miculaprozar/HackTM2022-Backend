"use strict";

const express = require("express");
const HttpError = require("../util/httpError");
const checkAuth = require("../middlewares/check-auth");
const { check, validationResult } = require("express-validator");
const addParameters = require("../util/addParameters");
const log = require("../services/logService");

let contractRouter = express.Router();

let router = function (contractService, webConstants) {
  contractRouter.use((req, res, next) => {
    var contentType = req.headers["content-type"] || "",
      mime = contentType.split(";")[0];

    console.log(
      `GenericController Incoming request contentType=${contentType} mime=${mime}`
    );

    return next();
  });

  contractRouter.get("/", checkAuth, async (req, res, next) => {
    try {
      let parameters = addParameters(req.query, [], "");
      let users = await contractService.getContracts(parameters);
      res.setHeader("Status", 200);
      res.send(users);
    } catch (error) {
      log.error(error.message || error);
      return next(new HttpError(500, error.message || error));
    }
  });

  contractRouter.put("/:id", checkAuth, async (req, res, next) => {
    try {
      let parameters = addParameters(req.body, ["id", "customerId", "sellerId"], "");
      const result = await contractService.updateContract(
        { id: req.params.id },
        parameters
      );

      res.status(200).send(result);
    } catch (error) {
      log.error(error.message || error);
      return next(new HttpError(500, error.message || error));
    }
  });

  contractRouter.post(
    "/", checkAuth,
    [
      check("customerId", "customerId obligatoriu").exists(),
      check("sellerId", "sellerId obligatoriu").exists()
    ],
    async (req, res, next) => {
      const validatorError = validationResult(req);
      if (!validatorError.isEmpty()) {
        return res.status(400).json({ errors: validatorError.array() });
      }
      try {
        let parametersCustomer = addParameters({ id: req.body.customerId }, [], "");
        let customer = await userService.getUsers(parameters);
        let parametersSeller = addParameters({ id: req.body.sellerId }, [], "");
        let seller = await userService.getUsers(parameters);

        let product = {
          customerId: req.body.customerId,
          sellerId: req.body.sellerId,
          name: req.body.name,
          description: req.body.description ? req.body.description : '',
          quantity: req.body.quantity,
          measurementUnitId: req.body.measurementUnitId
        };
        let result = await contractService.createProduct(product);

        res.setHeader("Status", 200);
        res.send(result);
      } catch (error) {
        log.error(error.message || error);
        return next(new HttpError(500, error.message || error));
      }
    }
  );

  return contractRouter;
};

module.exports = router;
