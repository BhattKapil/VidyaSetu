import express from "express";
import User from "../models/User.js";
import QuizResult from "../models/QuizResult.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/leaderboard", async (req, res) => {
  try {
    const users = await User.find({ role: "student" })
      .select("name xp level avatar")
      .sort({ xp: -1 })
      .limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalTeachers = await User.countDocuments({ role: "teacher" });
    const today = new Date().toISOString().split("T")[0];
    const activeToday = await User.countDocuments({ lastLogin: today });
    res.json({ totalUsers, totalStudents, totalTeachers, activeToday });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/xp", authMiddleware, async (req, res) => {
  try {
    const { xp, level } = req.body;
    await User.findByIdAndUpdate(req.user.id, { xp, level });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/sync", authMiddleware, async (req, res) => {
  try {
    const { xp, level, badges } = req.body;
    await User.findByIdAndUpdate(req.user.id, { xp, level, badges });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
