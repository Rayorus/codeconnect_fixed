export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  leetcode_username: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeetCodeStats {
  id: string;
  user_id: string;
  leetcode_username: string;
  total_solved: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  total_easy: number;
  total_medium: number;
  total_hard: number;
  acceptance_rate: number;
  ranking: number;
  contribution_points: number;
  last_fetched: string;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  sender?: User;
  receiver?: User;
}

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  friend?: User;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  problem_url: string | null;
  problem_title: string | null;
  tags: string[];
  likes: number;
  created_at: string;
  updated_at: string;
  author?: User;
  comments?: Comment[];
  comment_count?: number;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: User;
}

export interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  other_user?: User;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string; // encrypted
  status: "sent" | "delivered" | "read";
  created_at: string;
  sender?: User;
}

export interface LeetCodeAPIResponse {
  data: {
    matchedUser: {
      username: string;
      profile: {
        ranking: number;
        userAvatar: string;
        realName: string;
        aboutMe: string;
        school: string;
        websites: string[];
        countryName: string;
        company: string;
        jobTitle: string;
        skillTags: string[];
        postViewCount: number;
        reputation: number;
        solutionCount: number;
      };
      submitStats: {
        acSubmissionNum: Array<{
          difficulty: string;
          count: number;
          submissions: number;
        }>;
        totalSubmissionNum: Array<{
          difficulty: string;
          count: number;
          submissions: number;
        }>;
      };
      contributions: {
        points: number;
      };
    };
    allQuestionsCount: Array<{
      difficulty: string;
      count: number;
    }>;
  };
}
