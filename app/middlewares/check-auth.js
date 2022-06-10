const jwt = require('jsonwebtoken');
const config = require('../../config.js');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, config.jwtSecret);

    req.userData = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Authentication failed',
    });
  }
};
