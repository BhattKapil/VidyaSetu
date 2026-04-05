import mongoose from "mongoose";

const quizResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  quizId: { type: String, required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  xpEarned: { type: Number, default: 0 },
  date: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("QuizResult", quizResultSchema);
