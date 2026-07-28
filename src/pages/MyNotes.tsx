import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { FileText, Calendar, Tag, Heart, Bookmark, Plus, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  getBookmarkedNoteIds,
  toggleNoteBookmark,
} from "@/lib/note-bookmarks";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  likes: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

const MyNotes = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteTag, setNewNoteTag] = useState("");
  const [newNoteTags, setNewNoteTags] = useState<string[]>([]);

  
  const [notes, setNotes] = useState<Note[]>(() => {
    const savedNotes = localStorage.getItem("userNotes");
    if (savedNotes) {
      try {
        const parsed = JSON.parse(savedNotes);
        
        return parsed.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
          isBookmarked: getBookmarkedNoteIds().includes(note.id),
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  
  const myNotes = notes.filter((note) => note.author.id === user?.id);

  
  useEffect(() => {
    localStorage.setItem("userNotes", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    const handleBookmarkUpdate = () => {
      const bookmarkedIds = getBookmarkedNoteIds();
      setNotes((prevNotes) =>
        prevNotes.map((note) => ({
          ...note,
          isBookmarked: bookmarkedIds.includes(note.id),
        }))
      );
    };

    window.addEventListener("bookmarksUpdated", handleBookmarkUpdate);
    return () => window.removeEventListener("bookmarksUpdated", handleBookmarkUpdate);
  }, []);

  const handleAddTag = () => {
    if (newNoteTag.trim() && !newNoteTags.includes(newNoteTag.trim())) {
      setNewNoteTags([...newNoteTags, newNoteTag.trim()]);
      setNewNoteTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewNoteTags(newNoteTags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmitNote = () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      toast.error("Please fill in both title and content");
      return;
    }

    if (!user) {
      toast.error("Please log in to create notes");
      return;
    }

    const newNote: Note = {
      id: Date.now().toString(),
      title: newNoteTitle.trim(),
      content: newNoteContent.trim(),
      tags: newNoteTags,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        id: user.id,
        name: user.name,
        avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
      },
      likes: 0,
      isLiked: false,
      isBookmarked: false,
    };

    setNotes([newNote, ...notes]);
    toast.success("Note created successfully!");
    
    
    setNewNoteTitle("");
    setNewNoteContent("");
    setNewNoteTags([]);
    setNewNoteTag("");
    setIsDialogOpen(false);
  };

  const handleLike = (noteId: string) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) => {
        if (note.id === noteId) {
          const newIsLiked = !note.isLiked;
          return {
            ...note,
            isLiked: newIsLiked,
            likes: newIsLiked ? note.likes + 1 : note.likes - 1,
          };
        }
        return note;
      })
    );
  };

  const handleBookmark = (noteId: string) => {
    const isBookmarked = toggleNoteBookmark(noteId);

    setNotes((prevNotes) =>
      prevNotes.map((note) => {
        if (note.id === noteId) {
          return {
            ...note,
            isBookmarked,
          };
        }
        return note;
      })
    );

    toast.success(isBookmarked ? "Note saved!" : "Note removed from saved");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Notes</h1>
            <p className="text-muted-foreground">Manage and organize your personal notes</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>

        {myNotes.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Your Notes
              </CardTitle>
              <CardDescription>
                You haven't created any notes yet. Create your first note to get started!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No notes yet. Create your first note to get started!</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Note
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myNotes.map((note) => (
              <Card
                key={note.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/notes/${note.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <CardTitle className="text-lg line-clamp-2 flex-1">{note.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{format(note.updatedAt, "MMM d, yyyy")}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-4 mb-3">{note.content}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {note.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="h-2.5 w-2.5 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 ${note.isLiked ? "text-red-500" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(note.id);
                      }}
                    >
                      <Heart className={`h-4 w-4 mr-1.5 ${note.isLiked ? "fill-current" : ""}`} />
                      {note.likes}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 ${note.isBookmarked ? "text-primary" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookmark(note.id);
                      }}
                    >
                      <Bookmark className={`h-4 w-4 ${note.isBookmarked ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
              <DialogDescription>
                Create a new personal note. You can share it with the community later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter note title..."
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Write your note content here..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Add a tag and press Enter..."
                    value={newNoteTag}
                    onChange={(e) => setNewNoteTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {newNoteTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newNoteTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-sm">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitNote}>
                <Plus className="h-4 w-4 mr-2" />
                Create Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default MyNotes;

