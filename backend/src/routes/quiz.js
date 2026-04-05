import express from "express";
import Quiz from "../models/Quiz.js";
import QuizResult from "../models/QuizResult.js";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, subject, questions, timeLimit, xpReward } = req.body;
    const quiz = await Quiz.create({
      title, subject, questions, timeLimit, xpReward,
      teacherId: req.user.id,
    });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/result", authMiddleware, async (req, res) => {
  try {
    const { quizId, score, total, xpEarned } = req.body;
    const date = new Date().toISOString().split("T")[0];
    await QuizResult.create({ userId: req.user.id, quizId, score, total, xpEarned, date });

    const user = await User.findById(req.user.id);
    const newXP = user.xp + xpEarned;
    const newLevel = Math.floor(newXP / 200) + 1;

    const newBadges = [...(user.badges || [])];

    // Badge 1: First Steps — complete any quiz
    if (!newBadges.includes("1")) newBadges.push("1");

    // Badge 2: Quiz Master — 5 perfect scores
    if (score === total) {
      const perfectCount = await QuizResult.countDocuments({
        userId: req.user.id,
        $expr: { $eq: ["$score", "$total"] }
      });
      if (perfectCount >= 5 && !newBadges.includes("2")) newBadges.push("2");
    }

    // Badge 4: Brain Power — 50 correct answers total
    const totalCorrect = await QuizResult.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: null, total: { $sum: "$score" } } }
    ]);
    if ((totalCorrect[0]?.total || 0) >= 50 && !newBadges.includes("4")) newBadges.push("4");

    // Badge 5: Speed Demon — handled on frontend only
    // Badge 7: Night Owl — study after 10 PM
    const hour = new Date().getHours();
    if (hour >= 22 && !newBadges.includes("7")) newBadges.push("7");

    await User.findByIdAndUpdate(user._id, { xp: newXP, level: newLevel, badges: newBadges });
    res.json({ success: true, xp: newXP, level: newLevel, badges: newBadges });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
