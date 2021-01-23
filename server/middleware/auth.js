const { User } = require('../models/User');

let auth = (req, res, next) => {
  let token = req.cookies.w_auth;

  User.findByToken(token, (err, user) => {
    if (err) throw err;
    if (!user)
      return res.json({
        isAuth: false,
        error: true
      });

    req.token = token;
    req.user = user;
    next();
  });
};

const admin = (req, res, next)=>{
  if(req.user.role !== 1){
    return res.json({ error: 'Access Denied!' });
  }
  next();
}

module.exports = { auth, admin };
