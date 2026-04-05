import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: [{ type: String }],
  correctIndex: { type: Number, required: true },
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  questions: [questionSchema],
  timeLimit: { type: Number, default: 10 },
  xpReward: { type: Number, default: 50 },
}, { timestamps: true });

export default mongoose.model("Quiz", quizSchema);
