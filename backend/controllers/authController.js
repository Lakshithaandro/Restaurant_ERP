import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { nameError, phoneError, emailError, normalizePhone } from "../utils/validators.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const sendUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
});

// POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;
  console.log(`AuthController: login request for email=${email} ip=${req.ip}`);
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  if (!user.active) {
    return res.status(403).json({ message: "Account is inactive" });
  }
  res.json({ token: signToken(user._id), user: sendUser(user) });
};

// POST /api/auth/register  (admin only - used to add new staff with login)
export const register = async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email and password are required." });
  }

  const nameMsg = nameError(name, "Name");
  if (nameMsg) return res.status(400).json({ message: nameMsg });

  const emailMsg = emailError(email);
  if (emailMsg) return res.status(400).json({ message: emailMsg });

  if (String(password).length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters." });
  }

  const phoneMsg = phoneError(phone, { required: false });
  if (phoneMsg) return res.status(400).json({ message: phoneMsg });

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    return res.status(400).json({ message: "Email already in use." });
  }
  const user = await User.create({
    name: name.trim(),
    email,
    password,
    role,
    phone: normalizePhone(phone),
  });
  res.status(201).json({ user: sendUser(user) });
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({ user: sendUser(req.user) });
};
