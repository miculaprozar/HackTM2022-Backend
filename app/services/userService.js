"use strict";
const log = require("./logService");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const moment = require("moment");
const config = require("../../config.js");
const HttpError = require("../util/httpError");
const addQueryConditions = require("../util/addQueryConditions");
const addUpdateQueryConditions = require("../util/addUpdateQueryConditions");
const { param } = require("express-validator");

function UserService(configuration, dbService) {
  this._dbService = dbService;
  this._config = configuration;
}

UserService.prototype.getUsers = async function (parameters) {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = `SELECT users.id, users.email, user.details, users.firstName, users.lastName, users.roleId, users.companyName, 
      users.companyVAT, users.companyRegNumber, users.companyIBAN, users.details, roles.name as roleName
      FROM (users, roles)
      WHERE roles.id = users.roleId`;

      if (
        parameters &&
        typeof parameters === "object" &&
        Object.keys(parameters).length > 0
      ) {
        sql = addQueryConditions(sql, parameters, false, "users.");
      }
      let result = await this._dbService.query(sql);

      result = await Promise.all(result.map(async user => {
        let locations = await this._dbService.query(`SELECT * from locations where locations.userId=?`, [user.id]);

        if (locations && locations.length > 0) {
          user.locations = locations;
        }
        else {
          user.locations = [];
        }
        return user;
      }))

      return resolve(result);
    } catch (err) {
      return reject(err);
    }
  });
};

UserService.prototype.updateUser = async function (
  idObject,
  parameters
) {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = `UPDATE users SET `;
      if (
        !(
          parameters &&
          typeof parameters === "object" &&
          Object.keys(parameters).length > 0
        ) &&
        !(
          idObject &&
          typeof idObject === "object" &&
          Object.keys(idObject).length > 0
        )
      ) {
        throw new HttpError(
          403,
          "Datele ce trebuiesc modificate nu au fost transmise corect!"
        );
      }
      sql = addUpdateQueryConditions(sql, idObject, parameters);

      await this._dbService.query(sql).catch((err) => {
        log.error(err);
        throw new HttpError(500, "Nu s-au putut face modificarile!");
      });
      const result = await this.getUsers(idObject).catch((err) => {
        log.error(err);
        throw new HttpError(500, "Ceva nu a mers bine!");
      });

      return resolve(result);
    } catch (err) {
      return reject(err);
    }
  });
};

UserService.prototype.logIn = async function (parameters) {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = `SELECT u.id, u.password, u.roleId from users u
       WHERE u.email = '${parameters.email}'`;

      const user = await this._dbService.query(sql);

      if (user && user.length === 0) {
        throw new HttpError(401, "Unauthorised!");
      }

      bcrypt.compare(parameters.password, user[0].password, (err, result) => {
        if (err) {
          log.error(err);
          return reject("Ceva nu a mers bine!");
        }
        if (result) {
          const token = jwt.sign(
            {
              UserId: user[0].id
            },
            config.jwtSecret,
            {
              expiresIn: "30d",
            }
          );
          return resolve(token);
        } else {
          return reject("Authentication failed");
        }
      });
    } catch (err) {
      return reject("Authentication failed");
    }
  });
};

UserService.prototype.changePassword = async function (parameters, userId) {
  return new Promise(async (resolve, reject) => {
    try {

      let sql = `SELECT u.id, u.password from users u
       WHERE u.id = '${parameters.id}'`;

      const user = await this._dbService.query(sql);

      if (user && user.length === 0) {
        throw new HttpError(401, "Userul nu poate fi gasit!");
      }

      bcrypt.compare(
        parameters.password,
        user[0].password,
        async (err, result) => {
          if (err) {
            console.log(err);
            throw new HttpError(401, "Authentication failed");
          }
          if (result) {
            try {
              const salt = await bcrypt.genSalt(10);
              await bcrypt.hash(
                parameters.newPassword,
                salt,
                async (err, hash) => {
                  if (err) {
                    return reject(err);
                  } else {
                    await this._dbService
                      .query(
                        `UPDATE users set password = '${hash}'
                WHERE id = '${user[0].id}'`
                      )
                      .catch((err) => {
                        log.error(err);
                        return reject("Ceva nu a mers bine!");
                      });
                  }
                }
              );
            } catch (err) {
              log.error(err);
              return reject("Ceva nu a mers bine!");
            }

            const token = jwt.sign(
              {
                UserId: user[0].id,
              },
              config.jwtSecret,
              {
                expiresIn: "30d",
              }
            );
            return resolve(token);
          } else {
            return reject("Authentication failed");
          }
        }
      );
    } catch (err) {
      return reject(err);
    }
  });
};

UserService.prototype.signUp = async function (parameters, userId) {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = `SELECT u.id from users u
      WHERE u.email = '${parameters.email}'`;

      let user = await this._dbService.query(sql);
      if (user && user.length > 0) {
        throw new HttpError(401, "User already exists!");
      }

      let role = await this._dbService.query(
        `SELECT id from roles where id = '${parameters.roleId}'`
      );
      if (!(role && role.length > 0)) {
        throw new HttpError(401, "This role does not exists!");
      }

      const salt = await bcrypt.genSalt(10);
      await bcrypt.hash(parameters.password, salt, async (err, hash) => {
        if (err) {
          log.error(err);
          return reject("Ceva nu a mers bine la inregistrarea parolei!");
        } else {
          sql = `INSERT INTO users(email, firstName, lastName, password, roleId, companyName, companyVAT, companyRegNumber, companyIBAN, details) 
          VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          await this._dbService
            .query(sql, [
              parameters.email,
              parameters.firstName,
              parameters.lastName,
              hash,
              parameters.roleId,
              parameters.companyName,
              parameters.companyVAT,
              parameters.companyRegNumber,
              parameters.companyIBAN,
              parameters.details,
            ])
            .catch((err) => {
              log.error(err);
              return reject(err);
            });
          user = await this._dbService
            .query(
              `SELECT u.id from users u
          WHERE u.email = '${parameters.email}'`
            )
            .catch((err) => {
              return reject(err);
            });

          return resolve("user created successfully!");
        }
      });
    } catch (err) {
      return reject(err);
    }
  });
};

module.exports = UserService;
