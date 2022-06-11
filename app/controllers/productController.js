"use strict";

const express = require("express");
const HttpError = require("../util/httpError");
const checkAuth = require("../middlewares/check-auth");
const { check, validationResult } = require("express-validator");
const addParameters = require("../util/addParameters");
const log = require("../services/logService");
const sharp = require('sharp');
const path = require('path');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
var storage = multer.memoryStorage();
var upload = multer({ storage: storage, limits: { files: 3 } });
const googleCloud = new Storage({
  keyFilename: path.join(
    __dirname,
    `../../storage.json`
  ),
  projectId: "civic-badge-262911",
});
const photosBucket = googleCloud.bucket(
  "farmtofork"
);

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

  productRouter.get("/measurementUnits", checkAuth, async (req, res, next) => {
    try {
      let parameters = addParameters(req.query, [], "");
      let users = await productService.getMeasurementUnits(parameters);
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
      check("measurementUnitId", "measurementUnitId obligatoriu").exists(),
      check("price", "price obligatoriu").exists()
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
          measurementUnitId: req.body.measurementUnitId,
          price: req.body.price,
          currency: req.body.currency
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

  productRouter.post(
    '/image/:id',
    upload.any('inputFile'),
    checkAuth,
    async (req, res, next) => {
      try {
        if (req.files[0].size > 734003200) {
          throw new HttpError(403, 'Dimensiunea fisierului este prea mare!');
        }
        if (!req.params.id) {
          throw new HttpError(403, 'Please provide product id!');
        }

        const product = await productService.getProducts(
          req.params.id,
          req.userData.userId
        );

        if (!product) {
          throw new HttpError('403', 'You thief! This product is not yours');
        }

        const blob = photosBucket.file(req.params.id);
        const blobStream = blob.createWriteStream({
          metadata: {
            contentType: req.files[0].mimetype,
            cacheControl: 'no-cache, max-age=0',
          },
        });

        blobStream.on('error', (err) => {
          return next(err);
        });

        blobStream.on('finish', async () => {

          res.setHeader('Status', 200);
          res.send("Imagine introdusa cu succes!");
        });

        sharp(req.files[0].buffer, { failOnError: false })
          .rotate()
          .resize(500)
          .toBuffer()
          .then((data) => {
            blobStream.end(data);
          })
          .catch((err) => {
            throw new HttpError(500, `Compression failed with error: ${err}`);
          });
      } catch (err) {
        log.error(JSON.stringify(err));
        return next(err);
      }
    }
  );

  return productRouter;
};

module.exports = router;
