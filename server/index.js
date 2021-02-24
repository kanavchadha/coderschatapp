const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");
// const fs = require("fs");
const multer = require("multer");

const server = require("http").createServer(app);
const io = require("socket.io")(server);
const config = require("./config/key");

const mongoose = require("mongoose");
const connect = mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());


const { addUser, removeUser, getUser, getUsersInRoom, updateUser, getUserByEmail } = require("./helpers/users");
const { Chat } = require("./models/Chat");
const { auth } = require("./middleware/auth");
const { Room } = require("./models/Room");
const { User } = require("./models/User");

app.use('/api/users', require('./routes/users'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/blog', require('./routes/blogs'));


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '../uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`)
  },
  // fileFilter: (req, file, cb) => {
  //   const ext = path.extname(file.originalname)
  //   if (ext !== '.jpg' && ext !== '.png' && ext !== '.mp4') {
  //     return cb(res.status(400).end('only jpg, png, mp4 is allowed'), false);
  //   }
  //   cb(null, true)
  // }
})

var upload = multer({ storage: storage, limits: '10000000' }).single("file")

app.post("/api/chat/uploadfiles", auth, (req, res) => {
  upload(req, res, err => {
    if (err) {
      return res.json({ success: false, error: err.message });
    }
    let filePath = res.req.file.path.replace(/\\/g, '/');
    filePath = filePath.replace('../', '');
    return res.json({ success: true, url: filePath });
  })
});

io.on("connection", socket => {
  console.log("New Connection... ", socket.id);

  socket.on('join-room', ({ name, room, email }, callback) => {
    console.log(name + room + " Joined the room");
    const { error, user } = addUser({ id: socket.id, username: email, room });

    if (error) {
      return callback(error);
    }
    socket.join(user.room); // joining the room
    io.to(user.room).emit('online-users in Room', getUsersInRoom(user.room));
  })

  socket.on('disjoin-room', ({ name, room, newRoom }) => {
    console.log(name + room + " Disjoined the room");
    socket.leave(room); // leaving the room
    updateUser(socket.id, newRoom);
    io.to(room).emit('online-users in Room', getUsersInRoom(room));
  })

  socket.on("Input Chat Message", msg => {
    connect.then(db => {
      const user = getUser(socket.id);
      try {
        if (!user) {
          throw new Error('User is not connected!');
        }
        let chat = new Chat({ message: msg.chatMessage, sender: msg.userId, type: msg.type, room: msg.room._id })

        chat.save((err, doc) => {
          // console.log(doc)
          if (err) {
            console.log(err.message);
            return ack(error.message);
          }

          Chat.findOne({ "_id": doc._id })
            .populate("sender", 'email image name _id')
            .exec((err, doc) => {
              if (err) { return ack(err.message); }
              io.to(user.room).emit("Output Chat Message", doc);
            })
        })
      } catch (error) {
        console.error(error);
        return ack(error.message);
      }
    })
  });

  socket.on("Delete Chat Message", ({ msgId, senderId, room }, ack) => {
    const user = getUser(socket.id);
    try {
      Chat.findOneAndDelete({ sender: senderId, _id: msgId, createdAt: { $gt: new Date() - 600000 } }, (err, doc) => {
        if (!doc) {
          return ack("Not Allowed! You Can Only Delete this Message After 10 minutes of it's sending time.");
        } else {
          return io.to(user.room).emit("After Delete Chat Message", doc._id);
        }
      })
    } catch (error) {
      console.error(error);
      ack(error.message);
    }
  });

  socket.on("Add Member", async ({ room, member, senderId, senderName }, ack) => {
    try {
      const user = await User.findOne({ email: member });
      if (!user) {
        return ack('Sorry! this person is not using this app.');
      }
      const inRoom = user.myRooms.findIndex(r => r.toString() === room._id.toString());
      if (inRoom >= 0) {
        return ack('This User is Already in this Room.');
      }
      user.myRooms.push(room._id);
      user.save();
      const roomDoc = await Room.findById(room._id);
      roomDoc.members.push({ member: user._id, role: 0 });
      await roomDoc.save();

      let chat = new Chat({ message: `${senderName} added ${user.name} in room`, sender: senderId, type: 'info', room: room._id })
      chat.save((err, doc) => {
        if (err) {
          console.log(err.message);
          return ack(error.message);
        }
        io.to(room.name).emit("Output Chat Message", doc);
      });

      io.to(room.name).emit('After Adding Member', { _id: room._id, email: user.email, name: user.name, image: user.image, userId: user._id, role: 0 });
      const addedUser = getUserByEmail(member);
      if (addedUser) {
        io.to(addedUser.id).emit('Added In Room', {})
      }
    } catch (error) {
      console.log(error.message);
      return ack(error.message);
    }
  });

  socket.on('Leave Room', async ({ currRoom, currUserId, currUserName }, ack) => {
    try {
      const dbUser = await User.findById(currUserId);
      dbUser.myRooms.pull(currRoom._id);
      await dbUser.save();
      const isAdmin = currRoom.members.find(rm => rm.member._id === currUserId);
      if (isAdmin.role === 1) {
        const room = await Room.findById(currRoom._id);
        if (room.members.length >= 2) {
          room.members[1].role = 1;
          await roomm.save();
        }
      }
      Room.findByIdAndUpdate(currRoom._id, { $pull: { "members": { "member": currUserId } } }, { new: true }, (err, doc) => {
        if (err) {
          return res.status(500).send(err.message);
        }
        
        socket.emit('Room Leaved', {});
        socket.leave(currRoom.name);
        removeUser(socket.id);

        let chat = new Chat({ message: `${currUserName} leaved this room`, sender: currUserId, type: 'info', room: doc._id })
        chat.save((err, msg) => {
          if (err) {
            console.log(err.message);
            return ack(error.message);
          }
          io.to(currRoom.name).emit("Output Chat Message", msg);
        });

        io.to(currRoom.name).emit('After Leaving Room', { room: doc, userId: currUserId, onlineUsers: getUsersInRoom(currRoom.name) });
        // socket.broadcast.to(currRoom.name).emit()
      });
    } catch (error) {
      console.log(error.message);
      return ack(error.message);
    }
  })

  socket.on('disconnect', () => {
    console.log('disconnected', socket.id);
    const user = removeUser(socket.id);
    if (user) {
      // io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left the room!` });
      io.to(user.room).emit('online-users in Room', getUsersInRoom(user.room));
    }
  })

})

app.use('/uploads', express.static(path.join(__dirname, "..", 'uploads')));

// Serve static assets if in production
// if (process.env.NODE_ENV === "production") {
app.use(express.static("client/build"));
app.get("*", (req, res) => {   // index.html for all page routes
  // console.log(__dirname);
  res.sendFile(path.join(__dirname, "..", "client", "build", "index.html"));
});
// }

const port = process.env.PORT || 5000

server.listen(port, () => {
  console.log(`Server Running at ${port}`)
});