import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { FileText, Calendar, Tag, User, Heart, Bookmark } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  getBookmarkedNoteIds,
  removeNoteBookmark,
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

const SavedNotes = () => {
  const navigate = useNavigate();
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);

  
  useEffect(() => {
    loadSavedNotes();
    
    
    const handleStorageChange = () => {
      loadSavedNotes();
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("bookmarksUpdated", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("bookmarksUpdated", handleStorageChange);
    };
  }, []);

  const loadSavedNotes = () => {
    const bookmarkedIds = getBookmarkedNoteIds();
    const savedNotesData = localStorage.getItem("userNotes");

    let allNotes: Note[] = [];

    if (savedNotesData) {
      try {
        const parsed = JSON.parse(savedNotesData);
        allNotes = parsed.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
          isBookmarked: bookmarkedIds.includes(note.id),
        }));
      } catch {
        allNotes = [];
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
    
    
    mockNotes.forEach((mockNote) => {
      if (!allNotes.find((n) => n.id === mockNote.id)) {
        allNotes.push(mockNote);
      }
    });
    
    
    const bookmarked = allNotes
      .filter((note) => bookmarkedIds.includes(note.id))
      .map((note) => ({
        ...note,
        isBookmarked: true,
      }));

    setSavedNotes(bookmarked);
  };

  const handleBookmark = (noteId: string) => {
    removeNoteBookmark(noteId);
    setSavedNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
    toast.success("Note removed from saved notes");
  };

  const handleLike = (noteId: string) => {
    setSavedNotes((prevNotes) =>
      prevNotes.map((note) => {
        if (note.id === noteId) {
          return {
            ...note,
            isLiked: !note.isLiked,
            likes: note.isLiked ? note.likes - 1 : note.likes + 1,
          };
        }
        return note;
      })
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Saved Notes</h1>
          <p className="text-muted-foreground">
            Notes you've bookmarked for quick access
          </p>
        </div>

        {savedNotes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bookmark className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium mb-2">No saved notes yet</p>
              <p className="text-muted-foreground mb-4">
                Start bookmarking notes to save them for later
              </p>
              <Button onClick={() => navigate("/notes")} variant="outline">
                Browse Notes
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedNotes.map((note) => (
              <Card
                key={note.id}
                className="cursor-pointer hover:shadow-lg transition-shadow flex flex-col h-full"
                onClick={() => navigate(`/notes/${note.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-xl line-clamp-2 flex-1">
                      {note.title}
                    </CardTitle>
                  </div>
                  <CardDescription className="line-clamp-3">
                    {note.content}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {note.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {note.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{note.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={note.author.avatar} alt={note.author.name} />
                        <AvatarFallback className="text-xs">
                          {note.author.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span>{note.author.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(note.updatedAt, "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t mt-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 ${note.isLiked ? "text-red-500" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(note.id);
                      }}
                    >
                      <Heart
                        className={`h-4 w-4 mr-1 ${note.isLiked ? "fill-current" : ""}`}
                      />
                      {note.likes}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookmark(note.id);
                      }}
                    >
                      <Bookmark className="h-4 w-4 mr-1 fill-current" />
                      Saved
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SavedNotes;

