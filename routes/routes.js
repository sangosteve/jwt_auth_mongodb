const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

router.post("/register", async (req, res) => {
  //console.log(req.body);
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
  });

  const result = await user.save();
  const { password, ...data } = await result.toJSON();
  res.status(200).send(data);
});

router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) return res.status(404).send({ message: "user not found" });

  if (!(await bcrypt.compare(req.body.password, user.password)))
    return res.status(404).send({ message: "Invalid username or password" });

  const accessToken = jwt.sign({ _id: user._id }, "ACCESS_SECRET", {
    expiresIn: "30s",
  });

  const refreshToken = jwt.sign({ _id: user._id }, "REFRESH_SECRET", {
    expiresIn: "1w",
  });

  //store inside hhtp only cookies
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, //1 day,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    maxAge: 7 * 60 * 60 * 1000, //1 day,
  });
  res.send({ message: "Login success" });
});

router.post("/logout", (req, res) => {
  //set jwt cookie value to empty then reset the age
  res.cookie("accessToken", "", { maxAge: 0 });
  res.cookie("refreshToken", "", { maxAge: 0 });
  res.send({ message: "logout success" });
});

router.post("/refresh", (req, res) => {
  try {
    const refreshToken = req.cookies["refreshToken"];
    const payload = jwt.verify(refreshToken, "REFRESH_SECRET");
    if (!payload) return res.status(401).send({ message: "UNAUTHORIZED" });
    const accessToken = jwt.sign({ _id: payload._id }, "ACCESS_SECRET", {
      expiresIn: "30s",
    });
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, //1 day,
    });
    res.send({ message: "success" });
  } catch (e) {
    return res.status(401).send({ message: "unauthenticated" });
  }
});

router.get("/user", async (req, res) => {
  // console.log(req.cookies["jwt"]);
  try {
    const accessToken = req.cookies["accessToken"];
    const payload = jwt.verify(accessToken, "ACCESS_SECRET");
    if (!payload) return res.status(401).send({ message: "UNAUTHORIZED" });

    const user = await User.findOne({ _id: payload._id });
    if (!user) return res.status(401).send({ message: "UNAUTHORIZED" });
    const { password, ...data } = user.toJSON();
    res.send(data);
  } catch (e) {
    return res.status(401).send({ message: "unauthenticated" });
  }
});

module.exports = router;
