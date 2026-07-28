import { generateUserIdFromEmail } from "@/lib/auth";
import type { UserProfile } from "@/stores/useProfileStore";

export interface DemoAccount {
  email: string;
  password: string;
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  location: string;
  occupation: string;
  skillsKnown: string[];
  skillsToLearn: string[];
  github?: string;
  linkedin?: string;
  trustScore: number;
  totalSessions: number;
}

export const DEMO_ACCOUNT_1_EMAIL = "demo@swapx.com";
export const DEMO_ACCOUNT_1_PASSWORD = "Demo@123";

export const DEMO_ACCOUNT_2_EMAIL = "demo2@swapx.com";
export const DEMO_ACCOUNT_2_PASSWORD = "Demo2@456";

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: DEMO_ACCOUNT_1_EMAIL,
    password: DEMO_ACCOUNT_1_PASSWORD,
    id: generateUserIdFromEmail(DEMO_ACCOUNT_1_EMAIL),
    name: "Alex Demo",
    username: "alexdemo",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AlexDemo",
    bio: "Frontend developer exploring skill swaps. I teach React and TypeScript.",
    location: "San Francisco, CA",
    occupation: "Frontend Developer",
    skillsKnown: ["React", "TypeScript", "UI Design"],
    skillsToLearn: ["Python", "Data Science"],
    github: "https://github.com/alexdemo",
    linkedin: "https://linkedin.com/in/alexdemo",
    trustScore: 4.8,
    totalSessions: 12,
  },
  {
    email: DEMO_ACCOUNT_2_EMAIL,
    password: DEMO_ACCOUNT_2_PASSWORD,
    id: generateUserIdFromEmail(DEMO_ACCOUNT_2_EMAIL),
    name: "Jordan Demo",
    username: "jordandemo",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=JordanDemo",
    bio: "Backend engineer ready to swap Python skills for frontend tips.",
    location: "Austin, TX",
    occupation: "Backend Engineer",
    skillsKnown: ["Python", "Django", "PostgreSQL"],
    skillsToLearn: ["React", "UI Design"],
    github: "https://github.com/jordandemo",
    linkedin: "https://linkedin.com/in/jordandemo",
    trustScore: 4.7,
    totalSessions: 10,
  },
];

export function isDemoUserId(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return DEMO_ACCOUNTS.some((account) => account.id === userId);
}

export function isDemoEmail(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  return DEMO_ACCOUNTS.some((account) => account.email === normalized);
}

export function getDemoAccountByEmail(email: string): DemoAccount | null {
  const normalized = email.toLowerCase().trim();
  return DEMO_ACCOUNTS.find((account) => account.email === normalized) ?? null;
}

export function getDemoAccountById(userId: string): DemoAccount | null {
  return DEMO_ACCOUNTS.find((account) => account.id === userId) ?? null;
}

export function getOtherDemoAccounts(currentUserId: string): DemoAccount[] {
  return DEMO_ACCOUNTS.filter((account) => account.id !== currentUserId);
}

export function demoAccountToProfile(account: DemoAccount): UserProfile {
  const now = new Date().toISOString();
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    avatar: account.avatar,
    occupation: account.occupation,
    skills: account.skillsKnown,
    skillsToLearn: account.skillsToLearn,
    bio: account.bio,
    location: account.location,
    github: account.github,
    linkedin: account.linkedin,
    createdAt: now,
    updatedAt: now,
  };
}

export function demoAccountToExploreUser(account: DemoAccount) {
  return {
    id: account.id,
    name: account.name,
    avatar: account.avatar,
    bio: account.bio,
    location: account.location,
    skillsKnown: account.skillsKnown,
    skillsToLearn: account.skillsToLearn,
    trustScore: account.trustScore,
    totalSessions: account.totalSessions,
    github: account.github,
    linkedin: account.linkedin,
    proofs: [],
  };
}

export function ensureDemoProfiles(
  setProfile: (profile: UserProfile) => void
): void {
  DEMO_ACCOUNTS.forEach((account) => {
    setProfile(demoAccountToProfile(account));
  });
}
