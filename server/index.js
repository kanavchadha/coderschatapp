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


const { addUser, removeUser, getUser, getUsersInRoom, updateUser, getUserByEmail, getUsersNotInRoom } = require("./helpers/users");
const { queueMsg, removeQueuedMsg, getUserQueuedMsgs } = require("./helpers/messages");
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
  // console.log("New Connection... ", socket.handshake.query);
  // io.to(cu.id).emit('Unread Messages', getUserQueuedMsgs(u));
  socket.on('join-room', ({ name, room, email }, callback) => {
    console.log(name + room + " Joined the room");
    const { error, user } = addUser({ id: socket.id, username: email, room });

    if (error) {
      return callback(error);
    }
    socket.join(user.room); // joining the room
    io.to(user.room).emit('online-users in Room', getUsersInRoom(user.room));
    removeQueuedMsg(user.room, email);
    socket.emit('Unread Messages', getUserQueuedMsgs(user.username));
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

          Chat.findOne({ "_id": doc._id }).populate("sender", 'email image name _id')
            .exec((err, doc) => {
              if (err) { return ack(err.message); }
              io.to(user.room).emit("Output Chat Message", doc);
            })

          const userNotConnRoom = getUsersNotInRoom(msg.room._id, msg.room.members);
          userNotConnRoom.forEach(u => {
            queueMsg(msg.room._id, u, doc._id.toString());
            let cu = getUserByEmail(u);
            if (cu) {
              io.to(cu.id).emit('Unread Messages', getUserQueuedMsgs(u));
            }
          })
        })
      } catch (error) {
        console.log(error);
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

  socket.on("Update Room", async ({ nroom, senderId }, ack) => {
    try {
      const room = await Room.findById(nroom._id).populate('members.member', '_id email');
      if (!room) {
        return ack({ error: 'Room Not Found!' });
      }
      const adminUser = room.members.find(m => m.member._id.toString() === senderId);
      if (adminUser.role !== 1) {
        return ack({ error: 'Access Denied!' });
      }
      if (!nroom.logo || !nroom.logo || !nroom.description) {
        return ack({ error: 'All field are required!' });
      }
      room.name = nroom.name;
      room.logo = nroom.logo;
      room.description = nroom.description;
      await room.save();
      // const eroom = room._id.toString();
      // io.to(eroom).emit('After Updating Room', { _id: room._id, name: room.name, logo: room.logo, description: room.description });
      room.members.forEach(rm => {
        let cu = getUserByEmail(rm.member.email);
        if (cu) {
          io.to(cu.id).emit('After Updating Room', { _id: room._id, name: room.name, logo: room.logo, description: room.description });
        }
      })

    } catch (error) {
      console.log(error.message);
      return ack(error.message);
    }
  });

  socket.on("Delete Room", async ({ proom, senderId }, ack) => {
    try {
      const room = await Room.findById(proom).populate('members.member', '_id email');
      if (!room) {
        return ack({ error: 'Room Not Found!' });
      }
      const adminUser = room.members.find(m => m.member._id.toString() === senderId);
      if (adminUser.role !== 1) {
        return ack({ error: 'Access Denied!' });
      }
      await room.remove();
      // const eroom = room._id.toString();
      // io.to(eroom).emit('After Deleting Room', { _id: room._id });
      room.members.forEach(rm => {
        let cu = getUserByEmail(rm.member.email);
        if (cu) {
          io.to(cu.id).emit('After Deleting Room', { _id: room._id });
        }
      })
    } catch (error) {
      console.log(error.message);
      return ack(error.message);
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
      await user.save();
      const roomDoc = await Room.findById(room._id);
      roomDoc.members.push({ member: user._id, role: 0, joinDate: Date.now() });
      await roomDoc.save();

      let chat = new Chat({ message: `${senderName} added ${user.name} in room`, sender: senderId, type: 'info', room: room._id })
      chat.save((err, doc) => {
        if (err) {
          console.log(err.message);
          return ack(error.message);
        }
        io.to(room._id).emit("Output Chat Message", doc);
      });

      io.to(room._id).emit('After Adding Member', { _id: room._id, email: user.email, name: user.name, image: user.image, userId: user._id, role: 0 });
      const addedUser = getUserByEmail(member);
      if (addedUser) {
        io.to(cu.id).emit('Synchronize Rooms', {});
      }
      const userNotConnRoom = getUsersNotInRoom(room._id, room.members);
      userNotConnRoom.forEach(rmnj => {
        let cu = getUserByEmail(rmnj);
        if (cu) {
          io.to(cu.id).emit('Synchronize Rooms', {});
        }
      })
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
        for (let i = 0; i < room.members.length; i += 1) {
          if (room.members[i].role === 0) {
            room.members[i].role = 1;
            break;
          }
        }
        await room.save();
      }
      Room.findByIdAndUpdate(currRoom._id, { $pull: { "members": { "member": currUserId } } }, { new: true }, (err, doc) => {
        if (err) {
          return ack({ error: err.message });
        }

        socket.emit('Room Leaved', {});
        socket.leave(currRoom._id);
        removeUser(socket.id);

        let chat = new Chat({ message: `${currUserName} leaved this room`, sender: currUserId, type: 'info', room: doc._id })
        chat.save((err, msg) => {
          if (err) {
            console.log(err.message);
            return ack(error.message);
          }
          io.to(currRoom._id).emit("Output Chat Message", msg);
        });
        doc.populate({ path: 'members.member', select: 'email _id name image' }, (err, upRoom) => {
          if (err) {
            return ack({ error: err.message });
          }
          io.to(currRoom._id).emit('After Leaving Room', { room: upRoom, userId: currUserId, onlineUsers: getUsersInRoom(currRoom._id) });
          const userNotConnRoom = getUsersNotInRoom(upRoom._id, upRoom.members);
          userNotConnRoom.forEach(rmnj => {
            let cu = getUserByEmail(rmnj);
            if (cu) {
              io.to(cu.id).emit('Synchronize Rooms', {});
            }
          })
        })
      });
    } catch (error) {
      console.log(error.message);
      return ack({ error: error.message });
    }
  })

  // single chats
  socket.on('Create OTO Room', async (rd, ack) => {
    try {
      const isPresent = await Room.findOne({ category: 'oto', 'members.member': { $all: [rd.fuid, rd.suid] } });
      // console.log(isPresent);
      if (isPresent) {
        return ack({ present: true, room: isPresent });
      }
      const rmembers = [{ member: rd.fuid, role: 0 }, { member: rd.suid, role: 0 }];
      const otoRoom = new Room({
        name: rd.fuser + '#' + rd.suser,
        logo: rd.logo1 + '#' + rd.logo2,
        category: 'oto',
        description: '',
        members: rmembers
      });
      await otoRoom.save();
      const user1 = await User.findById(rd.fuid);
      user1.myRooms.push(otoRoom._id);
      await user1.save();
      const user2 = await User.findById(rd.suid);
      user2.myRooms.push(otoRoom._id);
      await user2.save();
      otoRoom.populate({
        path: 'members.member',
        select: '_id name email image'
      }, (err, room) => {
        if (err) {
          return ack({ error: err.message });
        }
        ack({ room });
        const addedUser = getUserByEmail(user2.email);
        if (addedUser) {
          io.to(addedUser.id).emit('Added In Room', {})
        }
      });
    } catch (err) {
      return ack({ error: err.message });
    }
  });

  socket.on('Block User', async ({ room, user }, ack) => {
    const broom = await Room.findById(room._id);
    if (broom.category !== 'oto') {
      return ack({ error: 'not possible!' });
    }
    broom.blocked = user;
    await broom.save();
    // io.to(room._id).emit('After Blocking Room', { room: broom._id, user: user });
    socket.emit('After Blocking Room', { room: broom._id, user: user });
    let user2 = '';
    if (room.members[0].member._id === user) {
      user2 = room.members[1].member.email;
    } else {
      user2 = room.members[0].member.email;
    }
    const blockedUser = getUserByEmail(user2);
    if (blockedUser) {
      io.to(blockedUser.id).emit('Added In Room', {})
    }
  })

  socket.on('UnBlock User', async ({ room, user }, ack) => {
    const broom = await Room.findById(room._id);
    if (broom.category !== 'oto') {
      return ack({ error: 'not possible!' });
    }
    if (broom.blocked !== user) {
      return ack({ error: 'Access Denied!' });
    }
    broom.blocked = null;
    await broom.save();
    // io.to(room._id).emit('After UnBlocking Room', { room: broom._id });
    socket.emit('After UnBlocking Room', { room: broom._id });
    let user2 = '';
    if (room.members[0].member._id === user) {
      user2 = room.members[1].member.email;
    } else {
      user2 = room.members[0].member.email;
    }
    const blockedUser = getUserByEmail(user2);
    if (blockedUser) {
      io.to(blockedUser.id).emit('After UnBlocking Room', { room: broom._id });
    }
  })

  socket.on('New Story Added', async ({ user }) => {
    try {
      const curruser = await User.findById(user).populate('myContacts', 'email');
      curruser.myContacts.forEach(u => {
        let cu = getUserByEmail(u.email);
        if (cu) {
          io.to(cu.id).emit('Show New Story');
        }
      });
    } catch (err) {
      console.log(err.message);
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