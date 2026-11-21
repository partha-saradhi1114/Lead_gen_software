import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { getDbStatus } from "../config/db.js";
import { leadStore } from "../models/store.js";

// Verify JWT token from Authorization header (Bearer <token>)
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No authorization token provided.",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "leadgen_pro_jwt_secret_key_change_me"
    );

    let user = null;

    if (getDbStatus() && mongoose.Types.ObjectId.isValid(decoded.id)) {
      try {
        user = await User.findById(decoded.id).select("-password");
      } catch (e) {
        // Fall back below
      }
    }

    if (!user) {
      const team = leadStore.getTeam();
      const match =
        team.find((m) => m.id === decoded.id || m.email?.toLowerCase() === decoded.id?.toLowerCase()) ||
        team.find((m) => m.role?.toLowerCase() === decoded.role?.toLowerCase());

      if (match) {
        user = {
          _id: match.id || match.email,
          id: match.id || match.email,
          name: match.name,
          email: match.email,
          role: decoded.role || match.role,
          active: true,
        };
      }
    }

    if (!user) {
      // In demo mode, decode user directly from token if signed
      user = {
        _id: decoded.id,
        id: decoded.id,
        role: decoded.role || "admin",
        name: decoded.role === "admin" ? "Sriram" : decoded.role === "ra" ? "Priya M" : "Ravi Kumar",
        email: decoded.id?.includes("@") ? decoded.id : "admin@arahinfotech.com",
        active: true,
      };
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authorization token.",
      error: error.message,
    });
  }
};

// Restrict access to specific roles (e.g. authorize("admin"), authorize("admin", "ra"))
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};
