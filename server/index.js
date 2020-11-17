const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");
const request = require("request");

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


const { Chat } = require("./models/Chat");
const { auth } = require("./middleware/auth");

app.use('/api/users', require('./routes/users'));
app.use('/api/chat', require('./routes/chat'));

const multer = require("multer");
const fs = require("fs");


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
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

var upload = multer({ storage: storage }).single("file")

app.post("/api/chat/uploadfiles", auth, (req, res) => {
  upload(req, res, err => {
    if (err) {
      return res.json({ success: false, err })
    }
    const filePath = res.req.file.path.replace('\\', '/');
    return res.json({ success: true, url: filePath });
  })
});

io.on("connection", socket => {

  socket.on("Input Chat Message", msg => {
    connect.then(db => {
      try {
        let chat = new Chat({ message: msg.chatMessage, sender: msg.userId, type: msg.type })

        chat.save((err, doc) => {
          // console.log(doc)
          if (err) return res.json({ success: false, err })

          Chat.find({ "_id": doc._id })
            .populate("sender")
            .exec((err, doc) => {
              return io.emit("Output Chat Message", doc);
            })
        })
      } catch (error) {
        console.error(error);
      }
    })
  });

  socket.on("Delete Chat Message", ({ msgId, senderId }) => {
    try {
      Chat.findOneAndDelete({sender: senderId, _id: msgId, createdAt: { $gt: new Date() - 600000 } }, (err, doc) => {
        if (!doc) {
          return io.emit("Error", "Not Allowed! You Can Only Delete this Message After 10 minutes of it's sending.");
        } else {
          return io.emit("After Delete Chat Message", doc._id);
        }
      })
    } catch (error) {
      console.error(error);
    }
  });

  socket.on("Execute Code", ({ code, language }) => {
    const program = {
      script : code,
      language: language,
      versionIndex: "0",
      clientId: config.JDoodle_ClientID,
      clientSecret: config.JDoodle_ClientSecret
    };
    request({
        url: 'https://api.jdoodle.com/v1/execute',
        method: "POST",
        json: program
    }, (error, response, body) => {
        if(error){
          console.log(error);
          return io.emit("Error", error.toString());
        } else{
          return io.emit("After Executing Code", body);
        }
    });
  });
  
  socket.on("Execute Chat Code", ({ code, language }) => {
    const program = {
      script : code,
      language: language,
      versionIndex: "0",
      clientId: config.JDoodle_ClientID,
      clientSecret: config.JDoodle_ClientSecret
    };
    request({
        url: 'https://api.jdoodle.com/v1/execute',
        method: "POST",
        json: program
    }, (error, response, body) => {
        if(error){
          console.log(error);
          return io.emit("Error", error.toString());
        } else{
          return io.emit("After Executing Chat Code", body);
        }
    });
  });

})

//use this to show the image you have in node js server to client (react js)
//https://stackoverflow.com/questions/48914987/send-image-path-from-node-js-express-server-to-react-client
app.use('/uploads', express.static('uploads'));

// Serve static assets if in production
// if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
  app.get("*", (req, res) => {   // index.html for all page routes
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
  });
// }

const port = process.env.PORT || 5000

server.listen(port, () => {
  console.log(`Server Running at ${port}`)
});