"use strict";

const express = require("express");
const HttpError = require("../util/httpError");
const checkAuth = require("../middlewares/check-auth");
const { check, validationResult } = require("express-validator");
const addParameters = require("../util/addParameters");
const log = require("../services/logService");

let contractRouter = express.Router();

let router = function (contractService, userService, webConstants) {
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
        let customer = await userService.getUsers(parametersCustomer);
        if (!customer[0]) {
          log.error("No such Customer!");
          return next(new HttpError(404, "No such Customer!"));
        }
        let parametersSeller = addParameters({ id: req.body.sellerId }, [], "");
        let seller = await userService.getUsers(parametersSeller);
        if (!seller[0]) {
          log.error("No such Seller!");
          return next(new HttpError(404, "No such Seller!"));
        }

        let contract = {
          customerId: req.body.customerId,
          sellerId: req.body.sellerId,
          customerCompanyName: req.body.customerCompanyName ? req.body.customerCompanyName : customer[0].companyName ? customer[0].companyName : "",
          customerVAT: req.body.customerVAT ? req.body.customerVAT : customer[0].companyVAT ? customer[0].companyVAT : "",
          customerRegNumber: req.body.customerRegNumber ? req.body.customerRegNumber : customer[0].companyRegNumber ? customer[0].companyRegNumber : "",
          customerIBAN: req.body.customerIBAN ? req.body.customerIBAN : customer[0].companyIBAN ? customer[0].companyIBAN : "",
          sellerCompanyName: req.body.sellerCompanyName ? req.body.sellerCompanyName : seller[0].companyName ? seller[0].companyName : "",
          sellerVAT: req.body.sellerVAT ? req.body.sellerVAT : seller[0].companyVAT ? seller[0].companyVat : "",
          sellerRegNumber: req.body.sellerRegNumber ? req.body.sellerRegNumber : seller[0].companyRegNumber ? seller[0].companyRegNumber : "",
          sellerIBAN: req.body.sellerIBAN ? req.body.sellerIBAN : seller[0].companyIBAN ? seller[0].companyIBAN : ""
        };
        let result = await contractService.createContract(contract);

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
