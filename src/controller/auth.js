const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const shortid = require("shortid");

const generateJwtToken = (_id, role) => {
  return jwt.sign({ _id, role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

exports.signup = (req, res) => {
  const characters =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let activationCode = "";
  for (let i = 0; i < 25; i++) {
    activationCode += characters[Math.floor(Math.random() * characters.length)];
  }

  User.findOne({ email: req.body.email }).exec(async (error, user) => {
    if (user)
      return res.status(400).json({
        error: "User already registered",
      });

    const { fullName, email, password, activationCode } = req.body;
    const hash_password = await bcrypt.hash(password, 10);
    const _user = new User({
      fullName,
      email,
      hash_password,
      username: shortid.generate(),
      activationCode,
    });

    _user.save((error, user) => {
      if (error) {
        return res.status(400).json({
          message: "Something went wrong!!",
        });
      }

      if (user) {
        const token = generateJwtToken(user._id, user.role);

        const { _id, firstName, lastName, email, role, fullName } = user;
        return res.status(201).json({
          token,
          user: { _id, firstName, lastName, email, role, fullName },
        });
      }
    });
  });
};

exports.signin = (req, res) => {
  User.findOne({ email: req.body.email }).exec(async (error, user) => {
    if (error) return res.status(400).json({ error });
    if (user) {
      if (user.authenticate(req.body.password) && user.role === "user") {
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });
        const { _id, fullName, email, role } = user;
        res.status(200).json({
          token,
          user: { _id, fullName, email, role },
        });
        res.send({
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          message: "connecté",
        });
      } else {
        return res.status(400).json({
          message: "Somthing went wrong !!",
        });
      }
    } else {
      return res.status(400).json({ message: "something wrong !!" });
    }
  });
};
exports.signout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({
    message: "Signout successfully...!",
  });
};
