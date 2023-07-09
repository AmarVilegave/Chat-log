const mongoose = require("mongoose");
const moment = require("moment");
const Joi = require("joi");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  msg: {
    type: String,
    required: true,
  },
  time: {
    type: Date,
  },
});

const User = mongoose.model("User", userSchema);

function validateUser(user) {
  const schema = {
    name: Joi.string().required(),
    msg: Joi.string().required(),
    time: Joi.date(),
  };
}

exports.userSchema = userSchema;
exports.User = User;
