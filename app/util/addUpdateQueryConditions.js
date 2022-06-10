"use strict";

module.exports = (sql, idObject, parameters) => {
  Object.keys(parameters).map((key, index) => {
    if (index < Object.keys(parameters).length - 1) {
      sql += `
      ${key} = ${
        typeof parameters[key] === "string"
          ? `'${parameters[key]}'`
          : `${parameters[key]}`
      }, `;
    } else {
      sql += `
      ${key} = ${
        typeof parameters[key] === "string"
          ? `'${parameters[key]}'`
          : `${parameters[key]}`
      } 
      WHERE ${Object.keys(idObject)[0]} = '${
        idObject[Object.keys(idObject)[0]]
      }'`;
      if (Object.keys(idObject).length > 1) {
        Object.keys(idObject).map((x, index) => {
          if (index >= 1) {
            sql += `AND ${Object.keys(idObject)[index]} = '${
              idObject[Object.keys(idObject)[index]]
            }'
            `;
          }
        });
      }
    }
  });
  return sql;
};
