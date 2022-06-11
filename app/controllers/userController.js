"use strict";

const express = require("express");
const HttpError = require("../util/httpError");
const checkAuth = require("../middlewares/check-auth");
const { check, validationResult } = require("express-validator");
const addParameters = require("../util/addParameters");
const log = require("../services/logService");

let userRouter = express.Router();

let router = function (userService, webConstants) {
  userRouter.use((req, res, next) => {
    var contentType = req.headers["content-type"] || "",
      mime = contentType.split(";")[0];

    console.log(
      `GenericController Incoming request contentType=${contentType} mime=${mime}`
    );

    return next();
  });

  userRouter.get("/me", checkAuth, async (req, res, next) => {
    try {
      let parameters = addParameters({ id: req.userData.UserId }, [], "");
      let users = await userService.getUsers(parameters);
      res.setHeader("Status", 200);
      res.send(users);
    } catch (error) {
      log.error(error.message || error);
      return next(new HttpError(500, error.message || error));
    }
  });

  userRouter.get("/", async (req, res, next) => {
    try {
      let parameters = addParameters(req.query, [], "");
      let users = await userService.getUsers(parameters);
      res.setHeader("Status", 200);
      res.send(users);
    } catch (error) {
      log.error(error.message || error);
      return next(new HttpError(500, error.message || error));
    }
  });

  userRouter.put(
    "/changePassword",
    checkAuth,
    [
      check("id", "Este nevoie de un id").exists(),
      check("password", "Parola trebuie sa fie de minim 6 caractere").isLength({
        min: 6,
      }),
      check(
        "newPassword",
        "Parola noua trebuie sa fie de minim 6 caractere"
      ).isLength({ min: 6 }),
    ],
    async (req, res, next) => {
      const validatorError = validationResult(req);
      if (!validatorError.isEmpty()) {
        return res.status(400).json({ errors: validatorError.array() });
      }
      try {
        let user = {
          id: req.body.id,
          password: req.body.password,
          newPassword: req.body.newPassword,
        };
        const token = await userService.changePassword(
          user,
          req.userData.UserId
        );

        res.status(200).send(token);
      } catch (error) {
        log.error(error.message || error);
        return next(new HttpError(500, error.message || error));
      }
    }
  );

  userRouter.put("/:id", checkAuth, async (req, res, next) => {
    try {
      let parameters = addParameters(req.body, ["id", "email"], "");
      const result = await userService.updateUser(
        { id: req.params.id },
        parameters,
        req.userData.UserId
      );

      res.status(200).send(result);
    } catch (error) {
      log.error(error.message || error);
      return next(new HttpError(500, error.message || error));
    }
  });

  userRouter.post(
    "/logIn",
    [
      check("email", "Este nevoie de un email").exists(),
      check("password", "Parola trebuie sa fie de minim 6 caractere").isLength({
        min: 6,
      }),
    ],
    async (req, res, next) => {
      const validatorError = validationResult(req);
      if (!validatorError.isEmpty()) {
        return res.status(400).json({ errors: validatorError.array() });
      }
      try {
        let user = {
          email: req.body.email,
          password: req.body.password,
        };
        const token = await userService.logIn(user);

        res.status(200).send(token);
      } catch (error) {
        log.error(error.message || error);
        return next(new HttpError(500, error.message || error));
      }
    }
  );

  userRouter.post(
    "/signUp",
    [
      check("email", "email obligatoriu").exists(),
      check("password", "Parola de minim 6 caractere").isLength({ min: 6 }),
      check("firstName", "Prenume Obligatoriu").exists(),
      check("lastName", "Nume Obligatoriu").exists(),
      check("roleId", "Rol Obligatoriu").exists()
    ],
    async (req, res, next) => {
      const validatorError = validationResult(req);
      if (!validatorError.isEmpty()) {
        return res.status(400).json({ errors: validatorError.array() });
      }
      try {
        let user = {
          email: req.body.email,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          password: req.body.password,
          roleId: req.body.roleId,
          companyName: req.body.companyName ? req.body.companyName : '',
          companyVAT: req.body.companyVAT ? req.body.companyVAT : '',
          companyRegNumber: req.body.companyRegNumber ? req.body.companyRegNumber : '',
          companyIBAN: req.body.companyIBAN ? req.body.companyIBAN : '',
          details: req.body.details ? req.body.details : ''
        };
        let result = await userService.signUp(user);

        res.setHeader("Status", 200);
        res.send(result);
      } catch (error) {
        log.error(error.message || error);
        return next(new HttpError(500, error.message || error));
      }
    }
  );

  return userRouter;
};

module.exports = router;
