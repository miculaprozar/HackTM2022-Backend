'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

//=============================CONTROLLERS=================================
const UserController = require('./userController');
const ProductController = require('./productController');
const LocationController = require('./locationController');
const ContractController = require('./contractController');
const OrderController = require('./orderController');

//=============================SERVICES=================================
const UserService = require('../services/userService');
const ProductService = require('../services/productService');
const LocationService = require('../services/locationService');
const ContractService = require('../services/contractService');
const OrderService = require('../services/orderService');

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
  var productService = new ProductService(config, dbService);
  var contractService = new ContractService(config, dbService);
  var orderService = new OrderService(config, dbService);
  app.use(config.endpoints.userContext, new UserController(userService, config.webConstants));
  app.use(config.endpoints.locationContext, new LocationController(locationService, config.webConstants));
  app.use(config.endpoints.productContext, new ProductController(productService, config.webConstants));
  app.use(config.endpoints.contractContext, new ContractController(contractService, userService, config.webConstants));
  app.use(config.endpoints.orderContext, new OrderController(orderService, config.webConstants));

  // middlewares
  // =============================================================================
  app.use(require('./../middlewares/errorLogging')());
  app.use(require('./../middlewares/errorJsonResponse')());

  return app;
};
