import { NextResponse } from "next/server";

const LEETCODE_API =
  process.env.NEXT_PUBLIC_LEETCODE_API_URL || "https://leetcode.com/graphql";

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

export async function POST(req: Request) {
  try {
    const { username } = await req.json();

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const res = await fetch(LEETCODE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com",
      },
      body: JSON.stringify({ query: STATS_QUERY, variables: { username } }),
      // Short server-side cache to avoid stale data for long periods
      next: { revalidate: 60 },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("LeetCode proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from LeetCode" },
      { status: 500 }
    );
  }
}

