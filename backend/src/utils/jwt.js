import jwt from "jsonwebtoken";

export const generateToken = (userId, role, name = "") => {
  return jwt.sign(
    { id: userId, role, ...(name ? { name } : {}) },
    process.env.JWT_SECRET || "leadgen_pro_jwt_secret_key_change_me",
    {
      expiresIn: "7d",
    }
  );
};
