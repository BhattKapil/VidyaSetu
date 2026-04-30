import express from "express";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.js";
import { notifyStudentsNewNote, notifyStudentsNewVideo } from "../services/email.js";

const router = express.Router();

router.post("/notify-notes", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Teachers only" });
    }
    const { noteTitle, subject, teacherName } = req.body;
    const students = await User.find({ role: "student" }).select("email");
    const emails = students.map(s => s.email);
    await notifyStudentsNewNote(noteTitle, subject, teacherName, emails);
    res.json({ success: true, notified: emails.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/notify-video", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Teachers only" });
    }
    const { videoTitle, subject, teacherName } = req.body;
    const students = await User.find({ role: "student" }).select("email");
    const emails = students.map(s => s.email);
    await notifyStudentsNewVideo(videoTitle, subject, teacherName, emails);
    res.json({ success: true, notified: emails.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;