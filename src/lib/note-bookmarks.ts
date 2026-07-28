const BOOKMARKS_STORAGE_KEY = "bookmarkedNotes";

export function getBookmarkedNoteIds(): string[] {
  try {
    const stored = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function isNoteBookmarked(noteId: string): boolean {
  return getBookmarkedNoteIds().includes(noteId);
}

export function setBookmarkedNoteIds(noteIds: string[]): void {
  localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(noteIds));
}

export function toggleNoteBookmark(noteId: string): boolean {
  const bookmarkedIds = getBookmarkedNoteIds();
  const isCurrentlyBookmarked = bookmarkedIds.includes(noteId);
  const updatedBookmarks = isCurrentlyBookmarked
    ? bookmarkedIds.filter((id) => id !== noteId)
    : [...bookmarkedIds, noteId];

  setBookmarkedNoteIds(updatedBookmarks);
  window.dispatchEvent(new Event("bookmarksUpdated"));
  return !isCurrentlyBookmarked;
}

export function removeNoteBookmark(noteId: string): void {
  const updatedBookmarks = getBookmarkedNoteIds().filter((id) => id !== noteId);
  setBookmarkedNoteIds(updatedBookmarks);
  window.dispatchEvent(new Event("bookmarksUpdated"));
}
