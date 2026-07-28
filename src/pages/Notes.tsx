import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { FileText, Calendar, Tag, User, Heart, Bookmark, Plus, X } from "lucide-react";
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

const Notes = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteTag, setNewNoteTag] = useState("");
  const [newNoteTags, setNewNoteTags] = useState<string[]>([]);

  
  const [notes, setNotes] = useState<Note[]>(() => {
    
    const bookmarkedIds = getBookmarkedNoteIds();
    
    
    const savedNotes = localStorage.getItem("userNotes");
    let userNotes: Note[] = [];
    if (savedNotes) {
      try {
        const parsed = JSON.parse(savedNotes);
        userNotes = parsed.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
          isBookmarked: bookmarkedIds.includes(note.id),
        }));
      } catch {
        userNotes = [];
      }
    }

    
    const mockNotes: Note[] = [
    {
      id: "1",
      title: "React Hooks Best Practices",
      content: "Remember to always use useEffect with proper dependencies. Avoid creating functions inside render. Use useCallback for memoization when needed. Always clean up subscriptions and timers in useEffect cleanup functions.",
      tags: ["React", "JavaScript", "Frontend"],
      createdAt: new Date(2024, 0, 15),
      updatedAt: new Date(2024, 0, 15),
      author: {
        id: "user1",
        name: "Sarah Johnson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      },
      likes: 24,
      isLiked: false,
      isBookmarked: bookmarkedIds.includes("1"),
    },
    {
      id: "2",
      title: "Python Data Structures",
      content: "Lists vs Tuples: Lists are mutable, tuples are immutable. Use lists when you need to modify the collection. Use tuples for fixed data. Sets are great for unique values and fast membership testing.",
      tags: ["Python", "Data Structures"],
      createdAt: new Date(2024, 0, 18),
      updatedAt: new Date(2024, 0, 20),
      author: {
        id: "user2",
        name: "Alex Chen",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      },
      likes: 18,
      isLiked: true,
      isBookmarked: bookmarkedIds.includes("2"),
    },
    {
      id: "3",
      title: "TypeScript Type Guards",
      content: "Type guards help narrow down types. Use 'typeof', 'instanceof', or custom type predicate functions. Example: function isString(value: unknown): value is string { return typeof value === 'string'; }",
      tags: ["TypeScript", "Programming"],
      createdAt: new Date(2024, 0, 22),
      updatedAt: new Date(2024, 0, 22),
      author: {
        id: "user3",
        name: "Maya Patel",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya",
      },
      likes: 31,
      isLiked: false,
      isBookmarked: bookmarkedIds.includes("3"),
    },
    {
      id: "4",
      title: "API Design Principles",
      content: "RESTful APIs should use proper HTTP methods. GET for retrieval, POST for creation, PUT for updates, DELETE for removal. Always include proper error handling and status codes. Version your APIs properly.",
      tags: ["API", "Backend", "Web Development"],
      createdAt: new Date(2024, 0, 25),
      updatedAt: new Date(2024, 0, 25),
      author: {
        id: "user4",
        name: "David Kim",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
      },
      likes: 42,
      isLiked: true,
      isBookmarked: bookmarkedIds.includes("4"),
    },
    {
      id: "5",
      title: "CSS Grid Layout Tips",
      content: "Use grid-template-areas for complex layouts. fr units are great for flexible sizing. Use gap instead of margins for spacing between grid items. Combine with flexbox for more control.",
      tags: ["CSS", "Frontend", "Design"],
      createdAt: new Date(2024, 0, 28),
      updatedAt: new Date(2024, 0, 28),
      author: {
        id: "user5",
        name: "Emma Wilson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
      },
      likes: 15,
      isLiked: false,
      isBookmarked: bookmarkedIds.includes("5"),
    },
    {
      id: "6",
      title: "Database Indexing",
      content: "Indexes improve query performance but slow down writes. Index columns used in WHERE, JOIN, and ORDER BY clauses. Avoid over-indexing as it increases storage. Monitor index usage regularly.",
      tags: ["Database", "Backend", "Performance"],
      createdAt: new Date(2024, 1, 1),
      updatedAt: new Date(2024, 1, 2),
      author: {
        id: "user6",
        name: "James Brown",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
      },
      likes: 28,
      isLiked: false,
      isBookmarked: bookmarkedIds.includes("6"),
    },
    ];

    
    const allNotes = [...userNotes];
    mockNotes.forEach((mockNote) => {
      if (!allNotes.find((n) => n.id === mockNote.id)) {
        allNotes.push(mockNote);
      }
    });
    return allNotes;
  });

  
  useEffect(() => {
    const userCreatedNotes = notes.filter(note => note.author.id === user?.id);
    if (userCreatedNotes.length > 0) {
      localStorage.setItem("userNotes", JSON.stringify(userCreatedNotes));
    }
  }, [notes, user?.id]);

  
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
    return () => {
      window.removeEventListener("bookmarksUpdated", handleBookmarkUpdate);
    };
  }, []);

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
      toast.error("Please log in to share notes");
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
    toast.success("Note shared successfully!");
    
    
    setNewNoteTitle("");
    setNewNoteContent("");
    setNewNoteTags([]);
    setNewNoteTag("");
    setIsDialogOpen(false);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Community Notes</h1>
            <p className="text-muted-foreground">Discover notes shared by the community</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Share Note
          </Button>
        </div>

        {notes.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Community Notes
              </CardTitle>
              <CardDescription>
                Notes shared by other members of the community will appear here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No community notes yet. Be the first to share your notes!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <Card
                key={note.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/notes/${note.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <CardTitle className="text-lg line-clamp-2 flex-1">{note.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={note.author.avatar} alt={note.author.name} />
                      <AvatarFallback className="text-xs">{note.author.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{note.author.name}</span>
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
              <DialogTitle>Share Your Note</DialogTitle>
              <DialogDescription>
                Share your knowledge with the community. Fill in the details below.
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
                Share Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Notes;

