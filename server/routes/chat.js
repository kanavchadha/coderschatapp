const express = require('express');
const router = express.Router();
const { Chat } = require("../models/Chat");
const request = require("request");
const config = require("../config/key");

router.get("/getChats",async (req, res) => {
    await Chat.find()
        .populate("sender")
        .exec((err, chats) => {
            // console.log(chats)
            if(err) return res.status(400).send(err);
            res.status(200).send(chats)
        })
});

router.post("/executeCode",(req,res)=>{
    const program = {
      script : req.body.code,
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
        if(error){
          return res.status(400).send(error);
        } else{
          return res.send(body);
        }
    });
})

module.exports = router;