"use strict";

const express = require("express");
const HttpError = require("../util/httpError");
const checkAuth = require("../middlewares/check-auth");
const { check, validationResult } = require("express-validator");
const addParameters = require("../util/addParameters");
const log = require("../services/logService");

let productRouter = express.Router();

let router = function (productService, webConstants) {
  productRouter.use((req, res, next) => {
    var contentType = req.headers["content-type"] || "",
      mime = contentType.split(";")[0];

    console.log(
      `GenericController Incoming request contentType=${contentType} mime=${mime}`
    );

    return next();
  });

  productRouter.get("/", checkAuth, async (req, res, next) => {
    try {
      let parameters = addParameters(req.query, [], "");
      let users = await productService.getProducts(parameters);
      res.setHeader("Status", 200);
      res.send(users);
    } catch (error) {
      log.error(error.message || error);
      return next(new HttpError(500, error.message || error));
    }
  });

  productRouter.put("/:id", checkAuth, async (req, res, next) => {
    try {
      let parameters = addParameters(req.body, ["id", "userId"], "");
      const result = await productService.updateProduct(
        { id: req.params.id, userId: req.userData.UserId },
        parameters
      );

      res.status(200).send(result);
    } catch (error) {
      log.error(error.message || error);
      return next(new HttpError(500, error.message || error));
    }
  });

  productRouter.post(
    "/", checkAuth,
    [
      check("name", "Nume obligatoriu").exists(),
      check("quantity", "Cantitate obligatorie").exists(),
      check("measurementUnitId", "measurementUnitId obligatoriu").exists()
    ],
    async (req, res, next) => {
      const validatorError = validationResult(req);
      if (!validatorError.isEmpty()) {
        return res.status(400).json({ errors: validatorError.array() });
      }
      try {
        let product = {
          userId: req.userData.UserId,
          name: req.body.name,
          description: req.body.description ? req.body.description : '',
          quantity: req.body.quantity,
          measurementUnitId: req.body.measurementUnitId
        };
        let result = await productService.createProduct(product);

        res.setHeader("Status", 200);
        res.send(result);
      } catch (error) {
        log.error(error.message || error);
        return next(new HttpError(500, error.message || error));
      }
    }
  );

  return productRouter;
};

module.exports = router;
