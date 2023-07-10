const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const mongoose = require("mongoose");
const User = require("./model/userModel");
const { Room } = require("./model/roomModel");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");
const moment = require("moment");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "Chat Log Bot";

mongoose
  .connect("mongodb://127.0.0.1:27017/chat-log")
  .then(() => console.log("connected to mongodb"))
  .catch(() => console.error("could not connect"));

//Run when client connect
io.on("connection", (socket) => {
  console.log('new connection');
  socket.on("joinRoom", async ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    const roomExist = await Room.find({ room: user.room, timeOut: null });
    if (!roomExist.length) {
      let room = new Room({
        room: user.room,
        time: new Date(),
        convo: [],
        timeOut: null,
      });
      room = await room.save();
    } else {
      console.log("failed");
    }

    //Welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to Chat Log!!"));

    //Broadcast when user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  //Listen for chat message
  socket.on("chatMessage", async (msg) => {
    let user = getCurrentUser(socket.id);
    console.log("User:",user);
    io.to(user.room).emit("message", formatMessage(user.username, msg));

    let chatRoom = await Room.find({ room: user.room, timeOut: null });
    console.log("ChatROom: ",chatRoom) 

    if (chatRoom) {
      let chatRoom = await Room.updateOne(
        { room: user.room, timeOut: null },
        {
          $push: {
            convo: {
              userName: user.username,
              textMessage: msg,
              timeStamp: Date.now(),
            },
          },
        },
      ).then((res) => {
        console.log("Success",res);
      }).catch((err) => {
        console.log("Error",err);
      });
    }
  });


  //Runs when client disconnects
  socket.on("disconnect", async () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      const temp = getRoomUsers(user.room);
      if (temp.length) {
        // send users and room info
        io.to(user.room).emit("roomUsers", {
          room: user.room,
          users: getRoomUsers(user.room),
        });
      } else {
        let room = await Room.findOneAndUpdate(
          { room: user.room, timeOut: null },
          { $set: { timeOut: Date.now() } }
        );
      }
    }
  });
});

const PORT = 3330 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on ${PORT}`));
