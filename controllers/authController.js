import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@(gmail|outlook|hotmail|yahoo|icloud)\.com$/;
    if (!emailRegex.test(email.toLowerCase())) {
      return res.status(400).json({
        message:
          "Please use a valid email address (Gmail, Outlook, Yahoo, etc.)",
      });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      authProvider: "local",
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        themePreference: user.themePreference,
        companyDetails: user.companyDetails,
        bankDetails: user.bankDetails,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server Error during signup", error: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.authProvider === "google") {
      return res.status(400).json({
        message:
          "This email is registered via Google. Please use Google Login.",
      });
    }

    if (await bcrypt.compare(password, user.password)) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        themePreference: user.themePreference,
        companyDetails: user.companyDetails,
        bankDetails: user.bankDetails,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server Error during login", error: error.message });
  }
};

export const googleAuthHandler = async (req, res) => {
  const { name, email, googleId } = req.body;

  try {
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      if (user.authProvider !== "google") {
        return res.status(400).json({
          message:
            "Email already registered without Google. Please login with password.",
        });
      }
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        googleId,
        authProvider: "google",
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      themePreference: user.themePreference,
      companyDetails: user.companyDetails,
      bankDetails: user.bankDetails,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error during Google authentication",
      error: error.message,
    });
  }
};
