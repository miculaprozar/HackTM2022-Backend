"use strict";

const express = require("express");
const HttpError = require("../util/httpError");
const checkAuth = require("../middlewares/check-auth");
const { check, validationResult } = require("express-validator");
const addParameters = require("../util/addParameters");
const log = require("../services/logService");

let locationRouter = express.Router();

let router = function (locationService, webConstants) {
  locationRouter.use((req, res, next) => {
    var contentType = req.headers["content-type"] || "",
      mime = contentType.split(";")[0];

    console.log(
      `GenericController Incoming request contentType=${contentType} mime=${mime}`
    );

    return next();
  });

  locationRouter.get("/", checkAuth, async (req, res, next) => {
    try {
      let parameters = addParameters(req.query, [], "");
      let users = await locationService.getLocations(parameters);
      res.setHeader("Status", 200);
      res.send(users);
    } catch (error) {
      log.error(error.message || error);
      return next(new HttpError(500, error.message || error));
    }
  });

  locationRouter.put("/:id", checkAuth, async (req, res, next) => {
    try {
      let parameters = addParameters(req.body, ["id", "longitude", "latitude"], "");
      const result = await locationService.updateLocation(
        { id: req.params.id, userId: req.userData.UserId },
        parameters
      );

      res.status(200).send(result);
    } catch (error) {
      log.error(error.message || error);
      return next(new HttpError(500, error.message || error));
    }
  });

  locationRouter.post(
    "/", checkAuth,
    [
      check("longitude", "Longitudine obligatoriu").exists(),
      check("latitude", "Latitudine obligatorie").exists()
    ],
    async (req, res, next) => {
      const validatorError = validationResult(req);
      if (!validatorError.isEmpty()) {
        return res.status(400).json({ errors: validatorError.array() });
      }
      try {
        let location = {
          userId: req.userData.UserId,
          longitude: req.body.longitude,
          latitude: req.body.latitude,
          details: req.body.details ? req.body.details : ''
        };
        let result = await locationService.createLocation(location);

        res.setHeader("Status", 200);
        res.send(result);
      } catch (error) {
        log.error(error.message || error);
        return next(new HttpError(500, error.message || error));
      }
    }
  );

  return locationRouter;
};

module.exports = router;
