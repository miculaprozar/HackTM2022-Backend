'use strict';

const e = require("express");

module.exports = (body, notAllowedParameters, prefix) => {
  let parameters = {};
  Object.keys(body).forEach(param => {
    if(notAllowedParameters.length > 0){
      if (!notAllowedParameters.includes(param)) {
        parameters[prefix+param] = body[param];
      }
    }
    else{
      parameters[prefix+param] = body[param];
    }
  })
  return parameters;
}