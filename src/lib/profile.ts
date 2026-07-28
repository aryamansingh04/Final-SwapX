import { apiFetch } from "./api";
import { Profile } from "@/types/db";

export type { Profile };

export interface CreateProfileData {
  username: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  skills?: string[];
  skills_to_learn?: string[];
  desired_skills?: string[];
}

export interface UpdateProfileData {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  skills?: string[];
  skills_to_learn?: string[];
  desired_skills?: string[];
}

export async function getProfiles(): Promise<Profile[]> {
  return apiFetch<Profile[]>("/api/profiles");
}

export async function getAllProfiles(): Promise<Profile[]> {
  return getProfiles();
}

export async function createMyProfile(profileData: CreateProfileData): Promise<Profile> {
  return apiFetch<Profile>("/api/profiles", {
    method: "POST",
    body: JSON.stringify(profileData),
  });
}

export async function getMyProfile(): Promise<Profile | null> {
  return apiFetch<Profile | null>("/api/profiles/me");
}

export async function updateMyProfile(patch: UpdateProfileData): Promise<Profile> {
  return apiFetch<Profile>("/api/profiles/me", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function getProfileById(id: string): Promise<Profile | null> {
  try {
    return await apiFetch<Profile>(`/api/profiles/${id}`);
  } catch {
    return null;
  }
}

export async function updateDesiredSkills(skills: string[]): Promise<Profile> {
  return updateMyProfile({ desired_skills: skills, skills_to_learn: skills });
}
