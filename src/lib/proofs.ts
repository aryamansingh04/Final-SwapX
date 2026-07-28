import { useAuthStore } from "@/stores/useAuthStore";

const PROOFS_KEY = "swapx_proofs";

export interface Proof {
  id: number;
  user_id: string;
  skill: string;
  file_url: string;
  file_type: string;
  created_at?: string;
}

export interface ProofWithSkill {
  id: number;
  skill: string;
  url: string;
  type: string;
}

function readProofs(): Proof[] {
  try {
    return JSON.parse(localStorage.getItem(PROOFS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeProofs(proofs: Proof[]) {
  localStorage.setItem(PROOFS_KEY, JSON.stringify(proofs));
}

function getCurrentUserId(): string {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) throw new Error("User is not authenticated. Please sign in first.");
  return userId;
}

function toProofWithSkill(proof: Proof): ProofWithSkill {
  return {
    id: proof.id,
    skill: proof.skill,
    url: proof.file_url,
    type: proof.file_type,
  };
}

export async function getUserProofs(userId: string): Promise<ProofWithSkill[]> {
  return readProofs()
    .filter((proof) => proof.user_id === userId)
    .map(toProofWithSkill);
}

export async function getMyProofs(): Promise<ProofWithSkill[]> {
  return getUserProofs(getCurrentUserId());
}

export async function saveProof(
  skill: string,
  fileUrl: string,
  fileType: string
): Promise<ProofWithSkill> {
  const userId = getCurrentUserId();
  const proof: Proof = {
    id: Date.now(),
    user_id: userId,
    skill,
    file_url: fileUrl,
    file_type: fileType,
    created_at: new Date().toISOString(),
  };

  const proofs = readProofs();
  proofs.unshift(proof);
  writeProofs(proofs);
  return toProofWithSkill(proof);
}

export async function uploadProof(skill: string, file: File): Promise<Proof> {
  const fileUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

  return saveProof(skill, fileUrl, file.type || "application/octet-stream").then((saved) => ({
    id: saved.id,
    user_id: getCurrentUserId(),
    skill: saved.skill,
    file_url: saved.url,
    file_type: saved.type,
    created_at: new Date().toISOString(),
  }));
}

export async function deleteProof(id: number): Promise<void> {
  const userId = getCurrentUserId();
  writeProofs(readProofs().filter((proof) => !(proof.id === id && proof.user_id === userId)));
}

export async function verifyProof(id: number): Promise<Proof> {
  const proof = readProofs().find((item) => item.id === id);
  if (!proof) throw new Error("Proof not found");
  return proof;
}
