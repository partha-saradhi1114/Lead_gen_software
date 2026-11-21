import jwt from "jsonwebtoken";

export const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || "leadgen_pro_jwt_secret_key_change_me",
    {
      expiresIn: "7d",
    }
  );
};
