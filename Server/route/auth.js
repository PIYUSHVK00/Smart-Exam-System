const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const Authenticate = require("../middleware/authenticate");
const AuthenticateAdmin = require("../middleware/adminAuth");

require("../db/conn");
const User = require("../model/userSchema");
const Admin = require("../model/adminSchema");

router.get("/", (req, res) => {
  res.send("This is Home page by router");
});

//Student Registor API

router.post("/register", async (req, res) => {
  const { name, email, number, password, cpassword } = req.body;

  if (!name | !email | !number | !password | !cpassword) {
    return res.status(422).json({ error: "Plase Fill the all Fillde" });
  }

  try {
    const userExist = await User.findOne({ email: email });

    if (userExist) {
      return res.status(422).json({ error: "Email Already Exist" });
    } else if (password != cpassword) {
      return res.status(422).json({ error: "Password not match" });
    } else {
      const user = new User({ name, email, number, password, cpassword });

      await user.save();

      res.status(201).json({ message: "User Registered Successfuly" });
    }
  } catch (err) {
    console.log(err);
  }
});

//Student Login API

router.post("/signin", async (req, res) => {
  try {
    let tokan;
    const { email, password } = req.body;

    if (!email | !password) {
      return res.status(400).json({ error: "Plase Fill the all Fillde" });
    }

    const userLogin = await User.findOne({ email: email });

    if (userLogin) {
      const userPassword = await bcrypt.compare(password, userLogin.password);

      // JWT tokan
      tokan = await userLogin.generateAuthToken();
      console.log(tokan);

      // store tokan in cookies
      res.cookie("jwtokan", tokan, {
        expires: new Date(Date.now() + 25892000000),
        httpOnly: true,
      });

      if (!userPassword) {
        res.status(400).json({ error: "inviald Credentials" });
      } else {
        res.json({ error: "User Signin Successfuly" });
      }
    } else {
      res.status(400).json({ error: "inviald Credentials" });
    }
  } catch (err) {
    console.log(err);
  }
});

// Admin Signup API
router.post("/admin-signup", async (req, res) => {
  const { name, email, number, password, cpassword } = req.body;

  if (!name || !email || !number || !password || !cpassword) {
    return res.status(422).json({ error: "Please fill all fields" });
  }

  try {
    const adminExist = await Admin.findOne({ email: email });

    if (adminExist) {
      return res.status(422).json({ error: "Email Already Exists" });
    } else if (password !== cpassword) {
      return res.status(422).json({ error: "Passwords do not match" });
    } else {
      const admin = new Admin({ name, email, number, password });

      // Hash the password before saving
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(password, salt);

      await admin.save();

      res.status(201).json({ message: "Admin Registered Successfully" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server Error" });
  }
});

// Admin Login API
router.post("/admin-signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Please fill all fields" });
    }

    const adminLogin = await Admin.findOne({ email: email });

    if (adminLogin) {
      const adminPassword = await bcrypt.compare(password, adminLogin.password);

      if (!adminPassword) {
        return res.status(400).json({ error: "Invalid Credentials" });
      } else {
        // Generate JWT token
        const token = jwt.sign({ _id: adminLogin._id }, process.env.SECRET_KEY);

        // Set token in cookies
        res.cookie("adminToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production", // Use secure cookies in production
        });

        return res.json({ message: "Admin Signin Successful" });
      }
    } else {
      return res.status(400).json({ error: "Invalid Credentials" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Server Error" });
  }
});

router.get("/student-dashbord", Authenticate, (req, res) => {
  res.send(req.rootUser);
});

router.get("/student-data", Authenticate, (req, res) => {
  res.send(req.rootUser);
});

router.get("/admin-dashbord", AuthenticateAdmin, (req, res) => {
  res.send(req.rootUser);
});

//logout
router.get("/logout", (req, res) => {
  console.log("Hello my logout Page");
  res.clearCookie("jwtokan", { path: "/" });
  res.status(200).send("User Logout");
});

module.exports = router;
