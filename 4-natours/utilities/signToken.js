const jwt = require("jsonwebtoken");
exports.Signature = function (id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};
