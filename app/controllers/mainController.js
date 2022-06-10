'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

//=============================CONTROLLERS=================================
const UserController = require('./userController');

//=============================SERVICES=================================
const UserService = require('../services/userService');

module.exports = function (dbService, config) {
  const app = express();

  app.use(bodyParser.json());
  app.use(
    bodyParser.urlencoded({
      extended: false,
    }),
  );

  app.use(cors(config.webServer.CorsAllowed));

  // register context
  // =============================================================================

  var userService = new UserService(config, dbService);
  app.use(config.endpoints.userContext, new UserController(userService, config.webConstants));

  // middlewares
  // =============================================================================
  app.use(require('./../middlewares/errorLogging')());
  app.use(require('./../middlewares/errorJsonResponse')());

  return app;
};
