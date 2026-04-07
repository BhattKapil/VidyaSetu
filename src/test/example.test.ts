import { describe, it, expect } from "vitest";
import { getLevelFromXP, getXPProgress, BADGES } from "@/lib/mockData";
import { getAllQuizzes, getLeaderboard } from "@/lib/store";

describe("XP and Level calculations", () => {
  it("should return level 1 for 0 XP", () => {
    expect(getLevelFromXP(0)).toBe(1);
  });

  it("should return level 2 for 200 XP", () => {
    expect(getLevelFromXP(200)).toBe(2);
  });

  it("should return level 7 for 1250 XP", () => {
    expect(getLevelFromXP(1250)).toBe(7);
  });

  it("should return correct XP progress percentage", () => {
    expect(getXPProgress(0)).toBe(0);
    expect(getXPProgress(100)).toBe(50);
    expect(getXPProgress(200)).toBe(0);
  });
});

describe("Quiz store", () => {
  it("should return at least the mock quizzes", () => {
    const quizzes = getAllQuizzes();
    expect(quizzes.length).toBeGreaterThan(0);
  });

  it("should return quizzes with required fields", () => {
    const quizzes = getAllQuizzes();
    quizzes.forEach(q => {
      expect(q).toHaveProperty("id");
      expect(q).toHaveProperty("title");
      expect(q).toHaveProperty("questions");
    });
  });
});

describe("Leaderboard", () => {
  it("should return an array", () => {
    const leaderboard = getLeaderboard();
    expect(Array.isArray(leaderboard)).toBe(true);
  });

  it("should be sorted by XP descending", () => {
    const leaderboard = getLeaderboard();
    for (let i = 0; i < leaderboard.length - 1; i++) {
      expect(leaderboard[i].xp).toBeGreaterThanOrEqual(leaderboard[i + 1].xp);
    }
  });
});

describe("Badge logic", () => {
  it("should have 8 badges defined", () => {
    expect(BADGES.length).toBe(8);
  });

  it("all badges should have required fields", () => {
    BADGES.forEach((b) => {
      expect(b).toHaveProperty("id");
      expect(b).toHaveProperty("name");
      expect(b).toHaveProperty("icon");
    });
  });
});