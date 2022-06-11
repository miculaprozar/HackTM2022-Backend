'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

//=============================CONTROLLERS=================================
const UserController = require('./userController');
const LocationController = require('./locationController');

//=============================SERVICES=================================
const UserService = require('../services/userService');
const LocationService = require('../services/locationService');

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
  var locationService = new LocationService(config, dbService);
  app.use(config.endpoints.userContext, new UserController(userService, config.webConstants));
  app.use(config.endpoints.locationContext, new LocationController(locationService, config.webConstants));

  // middlewares
  // =============================================================================
  app.use(require('./../middlewares/errorLogging')());
  app.use(require('./../middlewares/errorJsonResponse')());

  return app;
};
