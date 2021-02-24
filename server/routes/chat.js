const express = require('express');
const router = express.Router();
const { Chat } = require("../models/Chat");
const { Room } = require("../models/Room");
const { User } = require("../models/User");
const request = require("request");
const config = require("../config/key");
const { auth } = require("../middleware/auth");

router.get("/getRooms", auth, (req, res) => {
  User.findById(req.user._id).populate('myRooms').exec((err, user) => {
    if (err) {
      console.log(err);
      return res.status(400).send(err);
    }
    user.populate({
      path: 'myRooms.members.member',
      select: 'name email image'
    },
      (err, urms) => {
        if (err) {
          console.log(err);
          return res.status(400).send(err);
        }
        // console.log(urms.myRooms);
        res.status(200).send(urms.myRooms);
      }
    );
  })
});

router.get("/getChats", async (req, res) => {
  await Chat.find({ room: req.query.room })
    .populate("sender")
    .exec((err, chats) => {
      // console.log(chats)
      if (err) return res.status(400).send(err);
      res.status(200).send(chats)
    })
});

router.post("/createRoom", auth, async (req, res) => {
  try {
    const newRoom = new Room({
      name: req.body.name,
      logo: req.body.logo,
      description: req.body.description
    })
    newRoom.members.push({ member: req.user._id, role: 1 });
    await newRoom.save();
    req.user.myRooms.push(newRoom._id);
    await req.user.save();
    res.status(200).send({
      _id: newRoom._id,
      name: newRoom.name,
      logo: newRoom.logo,
      description: newRoom.description
    });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

router.post("/updateRoom", auth, async (req, res) => {
  try {
    const room = await Room.findById(req.body._id);
    if (!room) {
      return res.status(400).send({ error: 'Room Not Found!' });
    }
    const adminUser = room.members.find(m => m.member.toString() === req.user._id.toString())
    if (adminUser.role !== 1) {
      return res.status(400).send({ error: 'Access Denied!' });
    }
    if (!req.body.name || !req.body.logo || !req.body.description) {
      return res.status(400).send({ error: 'All field are required!' });
    }
    room.name = req.body.name;
    room.logo = req.body.logo;
    room.description = req.body.description;
    await room.save();
    res.status(200).send({
      _id: room._id,
      name: room.name,
      logo: room.logo,
      description: room.description
    });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

router.post("/deleteRoom", auth, async (req, res) => {
  try {
    const room = await Room.findById(req.body.id);
    if (!room) {
      return res.status(400).send({ error: 'Room Not Found!' });
    }
    const roomId = room._id;
    const adminUser = room.members.find(m => m.member.toString() === req.user._id.toString())
    if (adminUser.role !== 1) {
      return res.status(400).send({ error: 'Access Denied!' });
    }
    await room.remove();
    res.send({ message: 'Room Deleted Successfully!', _id: roomId });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
})

router.post("/executeCode", (req, res) => {
  const program = {
    script: req.body.code,
    language: req.body.language,
    versionIndex: "0",
    clientId: config.JDoodle_ClientID,
    clientSecret: config.JDoodle_ClientSecret
  };
  request({
    url: 'https://api.jdoodle.com/v1/execute',
    method: "POST",
    json: program
  }, (error, response, body) => {
    if (error) {
      return res.status(400).send(error);
    } else {
      return res.send(body);
    }
  });
})

router.post("/removeMember", async (req, res) => {
  try {
    const dbUser = await User.findById(req.body.userId);
    dbUser.myRooms.pull(req.body.roomId);
    await dbUser.save();
    Room.findByIdAndUpdate(req.body.roomId, { $pull: { "members": { "member": req.body.userId } } }, { new: true }, (err, doc) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      return res.send(doc);
    });
  } catch (err) {
    res.status(500).send(err);
  }
})

module.exports = router;