import type { LeetCodeStats } from "@/types";

const LEETCODE_API = process.env.NEXT_PUBLIC_LEETCODE_API_URL || "https://leetcode.com/graphql";

const STATS_QUERY = `
  query getUserProfile($username: String!) {
    allQuestionsCount {
      difficulty
      count
    }
    matchedUser(username: $username) {
      username
      profile {
        ranking
        userAvatar
        realName
        reputation
      }
      submitStats {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
        totalSubmissionNum {
          difficulty
          count
          submissions
        }
      }
      contributions {
        points
      }
    }
  }
`;

export interface FetchedLeetCodeStats {
  username: string;
  avatar: string;
  ranking: number;
  reputation: number;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalEasy: number;
  totalMedium: number;
  totalHard: number;
  acceptanceRate: number;
  contributionPoints: number;
}

export async function fetchLeetCodeStats(
  username: string
): Promise<FetchedLeetCodeStats | null> {
  try {
    const res = await fetch("/api/leetcode-stats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const user = json?.data?.matchedUser;
    const allQ = json?.data?.allQuestionsCount;

    if (!user) return null;

    const acStats = user.submitStats?.acSubmissionNum || [];
    const totalStats = user.submitStats?.totalSubmissionNum || [];

    const getCount = (arr: Array<{ difficulty: string; count: number }>, difficulty: string) =>
      arr.find((s) => s.difficulty === difficulty)?.count || 0;

    const totalSolved = getCount(acStats, "All");
    const easySolved = getCount(acStats, "Easy");
    const mediumSolved = getCount(acStats, "Medium");
    const hardSolved = getCount(acStats, "Hard");

    const totalSubmissions = getCount(totalStats, "All");
    const acceptanceRate =
      totalSubmissions > 0 ? (totalSolved / totalSubmissions) * 100 : 0;

    const totalEasy = allQ?.find((q: { difficulty: string; count: number }) => q.difficulty === "Easy")?.count || 0;
    const totalMedium = allQ?.find((q: { difficulty: string; count: number }) => q.difficulty === "Medium")?.count || 0;
    const totalHard = allQ?.find((q: { difficulty: string; count: number }) => q.difficulty === "Hard")?.count || 0;

    return {
      username,
      avatar: user.profile?.userAvatar || "",
      ranking: user.profile?.ranking || 0,
      reputation: user.profile?.reputation || 0,
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      totalEasy,
      totalMedium,
      totalHard,
      acceptanceRate: parseFloat(acceptanceRate.toFixed(1)),
      contributionPoints: user.contributions?.points || 0,
    };
  } catch (error) {
    console.error("LeetCode API error:", error);
    return null;
  }
}

export function formatLeetCodeStatsForDB(
  userId: string,
  stats: FetchedLeetCodeStats
): Omit<LeetCodeStats, "id"> {
  return {
    user_id: userId,
    leetcode_username: stats.username,
    total_solved: stats.totalSolved,
    easy_solved: stats.easySolved,
    medium_solved: stats.mediumSolved,
    hard_solved: stats.hardSolved,
    total_easy: stats.totalEasy,
    total_medium: stats.totalMedium,
    total_hard: stats.totalHard,
    acceptance_rate: stats.acceptanceRate,
    ranking: stats.ranking,
    contribution_points: stats.contributionPoints,
    last_fetched: new Date().toISOString(),
  };
}
