import { User } from "../models/User.js";
import { getDbStatus } from "../config/db.js";
import { leadStore } from "../models/store.js";
import { generateToken } from "../utils/jwt.js";

const DEMO_ACCOUNTS = [
  {
    name: "Sriram",
    email: "sriram@leadgen.pro",
    role: "admin",
    credits: 0,
    creditsUsed: 0,
  },
  {
    name: "Priya M",
    email: "priya.m@leadgen.pro",
    role: "ra",
    credits: 0,
    creditsUsed: 0,
  },
  {
    name: "Arjun K",
    email: "arjun.k@leadgen.pro",
    role: "ra",
    credits: 0,
    creditsUsed: 0,
  },
  {
    name: "Neha R",
    email: "neha.r@leadgen.pro",
    role: "ra",
    credits: 0,
    creditsUsed: 0,
  },
  {
    name: "Ravi Kumar",
    email: "ravi.kumar@leadgen.pro",
    role: "bde",
    credits: 500,
    creditsUsed: 420,
  },
  {
    name: "Anitha Reddy",
    email: "anitha.reddy@leadgen.pro",
    role: "bde",
    credits: 400,
    creditsUsed: 280,
  },
  {
    name: "Kiran Varma",
    email: "kiran.varma@leadgen.pro",
    role: "bde",
    credits: 300,
    creditsUsed: 210,
  },
  {
    name: "Megha S",
    email: "megha.s@leadgen.pro",
    role: "bde",
    credits: 300,
    creditsUsed: 200,
  },
];

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email and password",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const aliasEmail = cleanEmail.endsWith("@leadgen.pro")
      ? cleanEmail.replace("@leadgen.pro", "@arahinfotech.com")
      : cleanEmail.endsWith("@arahinfotech.com")
      ? cleanEmail.replace("@arahinfotech.com", "@leadgen.pro")
      : cleanEmail;

    // 1. Try Mongo if connected
    if (getDbStatus()) {
      try {
        const user = await User.findOne({
          $or: [
            { email: cleanEmail },
            { email: aliasEmail },
            { name: new RegExp(`^${cleanEmail}$`, "i") },
          ],
        });
        if (user) {
          const isMatch = await user.matchPassword(password);
          if (isMatch) {
            if (!user.active) {
              return res.status(403).json({
                success: false,
                message: "Account deactivated. Please contact your administrator.",
              });
            }

            const token = generateToken(user._id.toString(), user.role, user.name);
            return res.json({
              success: true,
              token,
              user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email || cleanEmail,
                phone: user.phone || "",
                role: user.role,
                credits: user.credits,
                creditsUsed: user.creditsUsed,
              },
            });
          }
        }
      } catch (err) {
        console.warn("[Auth] Mongo user lookup failed, falling back to local accounts:", err.message);
      }
    }

    // 2. Fallback to Store & Demo accounts
    const team = leadStore.getTeam();
    const candidate =
      team.find(
        (m) =>
          m.email?.toLowerCase() === cleanEmail ||
          m.email?.toLowerCase() === aliasEmail ||
          m.name?.toLowerCase() === cleanEmail
      ) ||
      DEMO_ACCOUNTS.find(
        (u) =>
          u.email.toLowerCase() === cleanEmail ||
          u.email.toLowerCase() === aliasEmail ||
          u.name.toLowerCase() === cleanEmail
      );

    if (candidate) {
      // Validate password in demo / fallback mode — defaults to "Password@123" for seeded/demo accounts
      const validPassword = candidate.password || "Password@123";
      if (password !== validPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const roleSlug =
        candidate.role === "Master Admin" || candidate.role === "admin"
          ? "admin"
          : candidate.role === "Research Analyst" || candidate.role === "ra"
          ? "ra"
          : "bde";

      const bdeInfo = leadStore.getBdes().find((b) => b.name === candidate.name);
      const credits = bdeInfo ? Math.max(0, bdeInfo.allocated - bdeInfo.used) : (candidate.credits ?? 500);
      const creditsUsed = bdeInfo ? bdeInfo.used : (candidate.creditsUsed ?? 0);

      const userId = candidate.id || candidate.email;
      const token = generateToken(userId, roleSlug, candidate.name);

      return res.json({
        success: true,
        token,
        user: {
          id: userId,
          name: candidate.name,
          email: candidate.email || cleanEmail,
          phone: candidate.phone || "",
          role: roleSlug,
          credits,
          creditsUsed,
        },
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private (Protected by JWT)
export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    res.json({
      success: true,
      user: {
        id: req.user._id ? req.user._id.toString() : req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        credits: req.user.credits,
        creditsUsed: req.user.creditsUsed,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get all users (for Admin Team Management)
// @route   GET /api/auth/users
// @access  Private (Admin only)
export const getUsers = async (req, res) => {
  try {
    if (getDbStatus()) {
      const users = await User.find().select("-password").sort({ createdAt: -1 });
      return res.json({
        success: true,
        count: users.length,
        users,
      });
    }

    const team = leadStore.getTeam();
    res.json({
      success: true,
      count: team.length,
      users: team,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching users",
      error: error.message,
    });
  }
};
