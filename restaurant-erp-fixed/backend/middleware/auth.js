import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verifies the JWT from the Authorization header and attaches the user
export const protect = async (req, res, next) => {
  try {
    let token;
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      token = header.split(" ")[1];
    }
    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.active) {
      return res.status(401).json({ message: "User not found or inactive" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// Restricts a route to specific roles, e.g. authorize("admin", "manager")
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: `Role '${req.user.role}' is not allowed here` });
    }
    next();
  };
};
