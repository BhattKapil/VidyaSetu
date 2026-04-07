import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config({ path: "../.env" });

const demoUsers = [
  {
    name: "Admin User",
    email: "admin@vidyasetu.com",
    password: "Admin@123",
    role: "admin",
    avatar: "👨‍💼",
    xp: 0,
    level: 1,
    streak: 0,
    badges: [],
  },
  {
    name: "Ms. Sharma",
    email: "teacher@vidyasetu.com",
    password: "Teacher@123",
    role: "teacher",
    avatar: "👩‍🏫",
    xp: 0,
    level: 1,
    streak: 0,
    badges: [],
  },
  {
    name: "Aarav S.",
    email: "student@vidyasetu.com",
    password: "Student@123",
    role: "student",
    avatar: "🧑‍🎓",
    xp: 1250,
    level: 7,
    streak: 5,
    badges: ["1", "2", "4", "7"],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    for (const u of demoUsers) {
      const exists = await User.findOne({ email: u.email });
      if (exists) {
        console.log(`Already exists: ${u.email}`);
        continue;
      }
      const hashed = await bcrypt.hash(u.password, 10);
      await User.create({ ...u, password: hashed });
      console.log(`Created: ${u.email}`);
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seed();