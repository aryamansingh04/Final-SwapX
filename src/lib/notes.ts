import { useAuthStore } from "@/stores/useAuthStore";

const NOTES_KEY = "swapx_notes";

export interface Note {
  id: number;
  author: string;
  title: string;
  body: string;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateNoteData {
  title: string;
  body: string;
  is_public: boolean;
}

export interface UpdateNoteData {
  title?: string;
  body?: string;
  is_public?: boolean;
}

function readNotes(): Note[] {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeNotes(notes: Note[]) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

function getCurrentUserId(): string {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) throw new Error("User is not authenticated. Please sign in first.");
  return userId;
}

export async function listPublicNotes(): Promise<Note[]> {
  return readNotes()
    .filter((note) => note.is_public)
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

export async function myNotes(): Promise<Note[]> {
  const userId = getCurrentUserId();
  return readNotes()
    .filter((note) => note.author === userId)
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

export async function createNote(data: CreateNoteData): Promise<Note> {
  const userId = getCurrentUserId();
  const notes = readNotes();
  const note: Note = {
    id: Date.now(),
    author: userId,
    title: data.title,
    body: data.body,
    is_public: data.is_public,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  notes.unshift(note);
  writeNotes(notes);
  return note;
}

export async function updateNote(id: number, data: UpdateNoteData): Promise<Note> {
  const userId = getCurrentUserId();
  const notes = readNotes();
  const index = notes.findIndex((note) => note.id === id && note.author === userId);
  if (index === -1) throw new Error("Note not found");

  notes[index] = {
    ...notes[index],
    ...data,
    updated_at: new Date().toISOString(),
  };
  writeNotes(notes);
  return notes[index];
}

export async function deleteNote(id: number): Promise<void> {
  const userId = getCurrentUserId();
  writeNotes(readNotes().filter((note) => !(note.id === id && note.author === userId)));
}

export async function getNoteById(id: number): Promise<Note | null> {
  return readNotes().find((note) => note.id === id) ?? null;
}
