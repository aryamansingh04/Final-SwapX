import { getBookmarkedNoteIds } from "@/lib/note-bookmarks";
import { getAllProfiles, getMyProfile } from "@/lib/profile";
import { getMyProofs } from "@/lib/proofs";
import { myConnections } from "@/lib/connections";
import { mockUsers } from "@/data/mockUsers";
import { Profile } from "@/types/db";

export type BadgeCategory =
  | "sessions"
  | "teaching"
  | "learning"
  | "community"
  | "content";

export interface CommunityMetrics {
  completedSessions: number;
  scheduledSessions: number;
  connections: number;
  proofsUploaded: number;
  skillsTaught: number;
  skillsToLearn: number;
  notesCreated: number;
  notesBookmarked: number;
  blogsWritten: number;
  groupsJoined: number;
  messagesSent: number;
  profileComplete: boolean;
  rating: number;
  hasAvatar: boolean;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: BadgeCategory;
  requirement: string;
  points: number;
  check: (metrics: CommunityMetrics) => boolean;
  progress: (metrics: CommunityMetrics) => { current: number; target: number };
}

export interface EvaluatedBadge extends BadgeDefinition {
  earned: boolean;
  progressCurrent: number;
  progressTarget: number;
  progressPercent: number;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function countMessagesSent(): number {
  const chats = readJson<any[]>("chats", []);
  return chats.reduce((total, chat) => {
    const ownMessages = (chat.messages || []).filter((msg: any) => msg.isOwn);
    return total + ownMessages.length;
  }, 0);
}

function countScheduledSessions(): number {
  const meetings = readJson<any[]>("scheduledMeetings", []);
  return meetings.length;
}

function countLocalConnections(): number {
  return readJson<string[]>("connections", []).length;
}

function countGroups(): number {
  const groups = readJson<any[]>("groups", []);
  return groups.length;
}

function countNotes(): number {
  return readJson<any[]>("userNotes", []).length;
}

function countBlogs(): number {
  return readJson<any[]>("userBlogs", []).length;
}

function isProfileComplete(profile: {
  name?: string;
  bio?: string;
  skills?: string[];
  avatar?: string;
  occupation?: string;
} | null): boolean {
  if (!profile) return false;
  return !!(
    profile.name?.trim() &&
    (profile.bio?.trim() || profile.occupation?.trim()) &&
    profile.skills &&
    profile.skills.length > 0 &&
    profile.avatar
  );
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first-session",
    name: "First Session",
    description: "Schedule or complete your first learning session.",
    emoji: "🎉",
    category: "sessions",
    requirement: "Schedule 1 session",
    points: 10,
    check: (m) => m.scheduledSessions >= 1 || m.completedSessions >= 1,
    progress: (m) => ({
      current: Math.min(Math.max(m.scheduledSessions, m.completedSessions), 1),
      target: 1,
    }),
  },
  {
    id: "session-veteran",
    name: "10 Sessions",
    description: "Stay consistent with ten scheduled sessions.",
    emoji: "🔥",
    category: "sessions",
    requirement: "Schedule 10 sessions",
    points: 50,
    check: (m) => m.scheduledSessions >= 10,
    progress: (m) => ({
      current: Math.min(m.scheduledSessions, 10),
      target: 10,
    }),
  },
  {
    id: "meeting-maker",
    name: "Meeting Maker",
    description: "Plan multiple sessions with your learning partners.",
    emoji: "📅",
    category: "sessions",
    requirement: "Schedule 3 sessions",
    points: 20,
    check: (m) => m.scheduledSessions >= 3,
    progress: (m) => ({
      current: Math.min(m.scheduledSessions, 3),
      target: 3,
    }),
  },
  {
    id: "great-teacher",
    name: "Great Teacher",
    description: "Earn a strong rating and verify at least one skill.",
    emoji: "⭐",
    category: "teaching",
    requirement: "4.5+ rating and 1 proof",
    points: 40,
    check: (m) => m.rating >= 4.5 && m.proofsUploaded >= 1,
    progress: (m) => ({
      current:
        (m.rating >= 4.5 ? 1 : 0) + (m.proofsUploaded >= 1 ? 1 : 0),
      target: 2,
    }),
  },
  {
    id: "highly-rated",
    name: "Highly Rated",
    description: "Maintain an excellent community rating.",
    emoji: "🌟",
    category: "teaching",
    requirement: "Reach 4.8 rating",
    points: 60,
    check: (m) => m.rating >= 4.8,
    progress: (m) => ({
      current: Math.min(Math.round(m.rating * 10), 48),
      target: 48,
    }),
  },
  {
    id: "skill-verified",
    name: "Skill Verified",
    description: "Upload proof of expertise for a skill you teach.",
    emoji: "✅",
    category: "teaching",
    requirement: "Upload 1 skill proof",
    points: 25,
    check: (m) => m.proofsUploaded >= 1,
    progress: (m) => ({
      current: Math.min(m.proofsUploaded, 1),
      target: 1,
    }),
  },
  {
    id: "fast-learner",
    name: "Fast Learner",
    description: "Set learning goals and save notes from the community.",
    emoji: "🚀",
    category: "learning",
    requirement: "2 skills to learn + 1 saved note",
    points: 30,
    check: (m) => m.skillsToLearn >= 2 && m.notesBookmarked >= 1,
    progress: (m) => ({
      current:
        Math.min(m.skillsToLearn, 2) + Math.min(m.notesBookmarked, 1),
      target: 3,
    }),
  },
  {
    id: "profile-pioneer",
    name: "Profile Pioneer",
    description: "Complete your profile with skills, bio, and avatar.",
    emoji: "🧑‍💼",
    category: "learning",
    requirement: "Complete your profile",
    points: 15,
    check: (m) => m.profileComplete,
    progress: (m) => ({
      current: m.profileComplete ? 1 : 0,
      target: 1,
    }),
  },
  {
    id: "community-hero",
    name: "Community Hero",
    description: "Build a strong network of learning connections.",
    emoji: "💪",
    category: "community",
    requirement: "5 accepted connections",
    points: 45,
    check: (m) => m.connections >= 5,
    progress: (m) => ({
      current: Math.min(m.connections, 5),
      target: 5,
    }),
  },
  {
    id: "connector",
    name: "Connector",
    description: "Make your first connection on SwapX.",
    emoji: "🤝",
    category: "community",
    requirement: "1 accepted connection",
    points: 10,
    check: (m) => m.connections >= 1,
    progress: (m) => ({
      current: Math.min(m.connections, 1),
      target: 1,
    }),
  },
  {
    id: "chat-champion",
    name: "Chat Champion",
    description: "Stay engaged with your learning partners in chat.",
    emoji: "💬",
    category: "community",
    requirement: "Send 10 messages",
    points: 20,
    check: (m) => m.messagesSent >= 10,
    progress: (m) => ({
      current: Math.min(m.messagesSent, 10),
      target: 10,
    }),
  },
  {
    id: "group-member",
    name: "Group Member",
    description: "Join or participate in a group discussion.",
    emoji: "👥",
    category: "community",
    requirement: "Join 1 group",
    points: 15,
    check: (m) => m.groupsJoined >= 1,
    progress: (m) => ({
      current: Math.min(m.groupsJoined, 1),
      target: 1,
    }),
  },
  {
    id: "note-sharer",
    name: "Note Sharer",
    description: "Share knowledge by creating a community note.",
    emoji: "📝",
    category: "content",
    requirement: "Create 1 note",
    points: 15,
    check: (m) => m.notesCreated >= 1,
    progress: (m) => ({
      current: Math.min(m.notesCreated, 1),
      target: 1,
    }),
  },
  {
    id: "curator",
    name: "Curator",
    description: "Bookmark helpful notes from other learners.",
    emoji: "🔖",
    category: "content",
    requirement: "Save 3 notes",
    points: 20,
    check: (m) => m.notesBookmarked >= 3,
    progress: (m) => ({
      current: Math.min(m.notesBookmarked, 3),
      target: 3,
    }),
  },
  {
    id: "blogger",
    name: "Blogger",
    description: "Publish your first news or blog post.",
    emoji: "📰",
    category: "content",
    requirement: "Publish 1 blog",
    points: 25,
    check: (m) => m.blogsWritten >= 1,
    progress: (m) => ({
      current: Math.min(m.blogsWritten, 1),
      target: 1,
    }),
  },
];

export function evaluateBadges(metrics: CommunityMetrics): EvaluatedBadge[] {
  return BADGE_DEFINITIONS.map((badge) => {
    const { current, target } = badge.progress(metrics);
    const progressPercent =
      target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

    return {
      ...badge,
      earned: badge.check(metrics),
      progressCurrent: current,
      progressTarget: target,
      progressPercent,
    };
  });
}

export function getLeaderTitle(earnedCount: number, totalPoints: number): string {
  if (totalPoints >= 200 || earnedCount >= 12) return "Legendary Mentor";
  if (totalPoints >= 120 || earnedCount >= 8) return "Community Champion";
  if (totalPoints >= 60 || earnedCount >= 5) return "Rising Leader";
  if (earnedCount >= 2) return "Active Member";
  return "New Explorer";
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  title: string;
  points: number;
  badgesEarned: number;
  rating: number;
  sessions: number;
  connections: number;
  isCurrentUser: boolean;
  rank: number;
}

export function metricsFromMockUser(user: {
  trustScore: number;
  totalSessions: number;
  proofs: { skill: string }[];
  skillsKnown: string[];
  skillsToLearn: string[];
}): CommunityMetrics {
  return {
    completedSessions: user.totalSessions,
    scheduledSessions: user.totalSessions,
    connections: Math.max(1, Math.floor(user.totalSessions / 4)),
    proofsUploaded: user.proofs.length,
    skillsTaught: user.skillsKnown.length,
    skillsToLearn: user.skillsToLearn.length,
    notesCreated: user.totalSessions >= 20 ? 2 : user.totalSessions >= 10 ? 1 : 0,
    notesBookmarked: user.totalSessions >= 15 ? 3 : 0,
    blogsWritten: user.totalSessions >= 25 ? 1 : 0,
    groupsJoined: user.totalSessions >= 12 ? 1 : 0,
    messagesSent: user.totalSessions * 2,
    profileComplete: true,
    rating: user.trustScore,
    hasAvatar: true,
  };
}

export function metricsFromSupabaseProfile(profile: Profile): CommunityMetrics {
  const skillCount = profile.skills?.length ?? 0;
  const rating = profile.rating ?? 0;

  return {
    completedSessions: Math.round(rating * 5),
    scheduledSessions: Math.round(rating * 5),
    connections: Math.max(skillCount, 1),
    proofsUploaded: 0,
    skillsTaught: skillCount,
    skillsToLearn:
      profile.skills_to_learn?.length ?? profile.desired_skills?.length ?? 0,
    notesCreated: rating >= 4 ? 1 : 0,
    notesBookmarked: 0,
    blogsWritten: 0,
    groupsJoined: skillCount >= 3 ? 1 : 0,
    messagesSent: skillCount * 3,
    profileComplete: !!(profile.full_name && skillCount > 0),
    rating,
    hasAvatar: !!profile.avatar_url,
  };
}

export function buildLeaderboardEntry(
  id: string,
  name: string,
  avatar: string,
  metrics: CommunityMetrics,
  isCurrentUser: boolean
): Omit<LeaderboardEntry, "rank"> {
  const badges = evaluateBadges(metrics);
  const earned = badges.filter((badge) => badge.earned);
  const points = earned.reduce((sum, badge) => sum + badge.points, 0);

  return {
    id,
    name,
    avatar,
    title: getLeaderTitle(earned.length, points),
    points,
    badgesEarned: earned.length,
    rating: metrics.rating,
    sessions: Math.max(metrics.scheduledSessions, metrics.completedSessions),
    connections: metrics.connections,
    isCurrentUser,
  };
}

export async function fetchLeaderboard(
  currentUser?: { id: string; name: string; avatar?: string },
  localProfile?: {
    name?: string;
    bio?: string;
    occupation?: string;
    skills?: string[];
    skillsToLearn?: string[];
    avatar?: string;
  } | null
): Promise<LeaderboardEntry[]> {
  const entriesMap = new Map<string, Omit<LeaderboardEntry, "rank">>();

  mockUsers.forEach((user) => {
    entriesMap.set(
      user.id,
      buildLeaderboardEntry(
        user.id,
        user.name,
        user.avatar,
        metricsFromMockUser(user),
        currentUser?.id === user.id
      )
    );
  });

  try {
    const profiles = await getAllProfiles();
    profiles.forEach((profile) => {
      entriesMap.set(
        profile.id,
        buildLeaderboardEntry(
          profile.id,
          profile.full_name || profile.username || "User",
          profile.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username || profile.id}`,
          metricsFromSupabaseProfile(profile),
          currentUser?.id === profile.id
        )
      );
    });
  } catch {
    // Fall back to mock leaderboard when Supabase is unavailable.
  }

  if (currentUser) {
    const metrics = await collectCommunityMetrics(currentUser.id, {
      name: localProfile?.name ?? currentUser.name,
      avatar: localProfile?.avatar ?? currentUser.avatar,
      skills: localProfile?.skills,
      skillsToLearn: localProfile?.skillsToLearn,
      bio: localProfile?.bio,
      occupation: localProfile?.occupation,
    });

    entriesMap.set(
      currentUser.id,
      buildLeaderboardEntry(
        currentUser.id,
        localProfile?.name ?? currentUser.name,
        localProfile?.avatar ??
          currentUser.avatar ??
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`,
        metrics,
        true
      )
    );
  }

  return Array.from(entriesMap.values())
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.badgesEarned !== a.badgesEarned) return b.badgesEarned - a.badgesEarned;
      return b.rating - a.rating;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function collectCommunityMetrics(
  userId?: string,
  localProfile?: {
    name?: string;
    bio?: string;
    occupation?: string;
    skills?: string[];
    skillsToLearn?: string[];
    avatar?: string;
  } | null
): Promise<CommunityMetrics> {
  let connections = countLocalConnections();
  let proofsUploaded = 0;
  let skillsTaught = localProfile?.skills?.length ?? 0;
  let skillsToLearn = localProfile?.skillsToLearn?.length ?? 0;
  let rating = 0;
  let hasAvatar = !!localProfile?.avatar;
  let profileComplete = isProfileComplete({
    name: localProfile?.name,
    bio: localProfile?.bio ?? localProfile?.occupation,
    skills: localProfile?.skills,
    avatar: localProfile?.avatar,
    occupation: localProfile?.occupation,
  });

  try {
    const supabaseConnections = await myConnections();
    const accepted = supabaseConnections.filter((c) => c.status === "accepted").length;
    connections = Math.max(connections, accepted);
  } catch {
    // Use local connection data when Supabase is unavailable.
  }

  try {
    const proofs = await getMyProofs();
    proofsUploaded = proofs.length;
    skillsTaught = Math.max(skillsTaught, new Set(proofs.map((p) => p.skill)).size);
  } catch {
    // Ignore proof fetch errors for demo/local users.
  }

  try {
    const profile = await getMyProfile();
    if (profile) {
      rating = profile.rating ?? 0;
      skillsTaught = Math.max(skillsTaught, profile.skills?.length ?? 0);
      skillsToLearn = Math.max(
        skillsToLearn,
        profile.skills_to_learn?.length ?? profile.desired_skills?.length ?? 0
      );
      hasAvatar = hasAvatar || !!profile.avatar_url;
      profileComplete =
        profileComplete ||
        isProfileComplete({
          name: profile.full_name || profile.username,
          bio: profile.bio ?? undefined,
          skills: profile.skills,
          avatar: profile.avatar_url ?? undefined,
        });
    }
  } catch {
    // Fall back to local profile metrics.
  }

  return {
    completedSessions: 0,
    scheduledSessions: countScheduledSessions(),
    connections,
    proofsUploaded,
    skillsTaught,
    skillsToLearn,
    notesCreated: countNotes(),
    notesBookmarked: getBookmarkedNoteIds().length,
    blogsWritten: countBlogs(),
    groupsJoined: countGroups(),
    messagesSent: countMessagesSent(),
    profileComplete,
    rating,
    hasAvatar,
  };
}

export const BADGE_SYNC_EVENTS = [
  "storage",
  "bookmarksUpdated",
  "connectionRequestsUpdated",
  "chatsUpdated",
  "notificationsUpdated",
] as const;
