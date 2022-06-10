"use strict";

module.exports = (sql, parameters, withWhere, prefix) => {
  Object.keys(parameters).map((key, index) => {
    if (!(prefix === "clockings." && key === "teamId")) {
      if (index === 0 && withWhere) {
        if (!parameters[key]) {
          sql += `
              WHERE ${prefix + key} is null`;
        } else {
          if (key === "startDate") {
            sql += `
              WHERE ${prefix + "start"} >= '${parameters[key]}' AND ${
              prefix + "stop"
            } >= '${parameters[key]}'`;
          } else if (key === "endDate") {
            sql += `
            WHERE ${prefix + "start"} <= '${parameters[key]}' AND ${
              prefix + "stop"
            } <= '${parameters[key]}'`;
          } else {
            sql += `
            WHERE ${prefix + key} = '${parameters[key]}'`;
          }
        }
      } else {
        if (!parameters[key]) {
          sql += `
            AND ${prefix + key} is null`;
        } else {
          if (key === "startDate") {
            sql += `
              AND ${prefix + "start"} >= '${parameters[key]}' AND ${
              prefix + "stop"
            } >= '${parameters[key]}'`;
          } else if (key === "endDate") {
            sql += `
              AND ${prefix + "start"} <= '${parameters[key]}' AND ${
              prefix + "stop"
            } <= '${parameters[key]}'`;
          } else {
            sql += `
              AND ${prefix + key} = '${parameters[key]}'`;
          }
        }
      }
    }
  });
  return sql;
};
