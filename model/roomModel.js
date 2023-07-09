const mongoose = require("mongoose");
const Joi = require("joi");
const { userSchema } = require("./userModel");
const { date } = require("joi");

const roomSchema = new mongoose.Schema({
  room: {
    type: String,
    required: true,
  },
  convo: [],
  time: {
    type: Date,
    default: new Date("6/1/2023"),
  },
  timeOut: {
    type: Date,
    default: null,
  },
});

const Room = mongoose.model("Room", roomSchema);

exports.roomSchema = roomSchema;
exports.Room = Room;
