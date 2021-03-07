const express = require('express');
const router = express.Router();
const { Chat } = require("../models/Chat");
const { Room } = require("../models/Room");
const { User } = require("../models/User");
const { Story } = require("../models/Story");
const request = require("request");
const config = require("../config/key");
const { auth } = require("../middleware/auth");
const multer = require("multer");
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'student-dev',
  api_key: config.CLOUDINARY_KEY,
  api_secret: config.CLOUDINARY_SECRET
});
const storage = multer.diskStorage({
  // destination: function (req, file, cb) {
  //   cb(null, '../uploads/');
  // },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`)
  }
})
const fileFilter = (req, file, cb) => {
  if (file.mimetype !== '.jpeg' && file.mimetype !== '.jpg' && file.mimetype !== '.png' && file.mimetype !== '.mp4') {
    cb(null, true);
  } else {
    cb(null, false);
  }
  cb(null, true)
}
const upload = multer({ storage: storage, fileFilter: fileFilter, limits: '10000000' });

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

router.get("/getContacts", auth, async (req, res) => {
  try {
    const userContacts = await User.findById(req.user._id).populate('myContacts', '_id name image email');
    res.status(200).send(userContacts.myContacts);
  } catch (err) {
    return res.status(400).send(err);
  }
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

router.post("/addMyContacts", auth, async (req, res) => {
  try {
    const member = req.body.member;
    const newContact = await User.findOne({ email: member });
    if (!newContact) {
      return res.status(400).send({ error: 'Sorry! this person is not using this app.' });
    }
    req.user.myContacts.push(newContact._id);
    await req.user.save();
    return res.send({ name: newContact.name, image: newContact.image, _id: newContact._id, email: newContact.email });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({ error: error.message });
  }
})

router.post('/addStory', auth, upload.array('stories', 6), async (req, res) => {
  try {
    // console.log(req.files);
    req.files.forEach(async (file) => {
      try {
        let category = 'image';
        if (file.originalname.split('.')[1] === 'mp4') {
          category = 'video';
        }
        let result = await cloudinary.uploader.upload(file.path, {
          folder: "stories", resource_type: category
        });
        // console.log(result);
        let newStory = new Story({
          caption: req.body.caption,
          url: result.secure_url,
          publicId: result.public_id,
          user: req.user._id,
          category: category
        })
        await newStory.save();
      } catch (err) {
        console.log(err.message);
        return res.json({ error: err.message });
      }
    })
    req.user.status = Date.now();
    await req.user.save();
    return res.json({ success: true });
  } catch (err) {
    console.log(err.message);
    return res.json({ error: err.message });
  }
})

router.get("/myContactsStories", auth, async (req, res) => {
  try {
    const contactUsers = [];
    let cu, stories = [];
    req.user.myContacts.forEach(c => {
      contactUsers.push(User.findById(c));
    })
    cu = await Promise.all(contactUsers);
    cu.forEach(u => {
      if (u.status && u.status > Date.now() - 24 * 60 * 60 * 1000) {
        stories.push({ id: u._id, name: u.name, image: u.image, time: u.status });
      }
    })
    // console.log(stories);
    return res.send(stories);
  } catch (err) {
    console.log(err.message);
    return res.json({ error: err.message });
  }
})

router.get("/userStory/:id", auth, async (req, res) => {
  try {
    const ismyContact = req.user.myContacts.findIndex(u => u.toString() === req.params.id);
    if (ismyContact >= 0 || req.params.id === req.user._id.toString()) {
      const myStories = await Story.find({ user: req.params.id, createdAt: { $gt: Date.now() - 24 * 60 * 60 * 1000 } });
      if (myStories && myStories.length > 0) {
        return res.send({ stories: myStories });
      }
      return res.send({ stories: [] });
    } else {
      return res.json({ error: 'Access Denied!' });
    }
  } catch (err) {
    console.log(err.message);
    return res.json({ error: err.message });
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