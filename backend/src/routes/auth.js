import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const SECRET = process.env.JWT_SECRET || "vidyasetu-secret";
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already registered" });
    const hashed = await bcrypt.hash(password, 10);
    const avatar = role === "student" ? "🧑‍🎓" : role === "teacher" ? "👩‍🏫" : "👨‍💼";
    const user = await User.create({ name, email, password: hashed, role, avatar });
    const token = jwt.sign({ id: user._id, role: user.role }, SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name, email, role, xp: 0, level: 1, streak: 0, badges: [], avatar } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const SECRET = process.env.JWT_SECRET || "vidyasetu-secret";
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid email or password" });

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let newStreak = user.streak;
    if (user.lastLogin === yesterdayStr) newStreak += 1;
    else if (user.lastLogin !== today) newStreak = 1;

    await User.findByIdAndUpdate(user._id, { lastLogin: today, streak: newStreak });

    const token = jwt.sign({ id: user._id, role: user.role }, SECRET, { expiresIn: "7d" });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        xp: user.xp,
        level: user.level,
        streak: newStreak,
        badges: user.badges,
        avatar: user.avatar,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;