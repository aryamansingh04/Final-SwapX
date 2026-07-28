import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Tag, Heart, Bookmark, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  isNoteBookmarked,
  toggleNoteBookmark,
} from "@/lib/note-bookmarks";


const mockNotes = [
  {
    id: "1",
    title: "React Hooks Best Practices",
    content: "Remember to always use useEffect with proper dependencies. Avoid creating functions inside render. Use useCallback for memoization when needed. Always clean up subscriptions and timers in useEffect cleanup functions.\n\nHere are some key points:\n\n1. **useEffect Dependencies**: Always include all dependencies in the dependency array. Use ESLint plugin to catch missing dependencies.\n\n2. **Cleanup Functions**: Always return a cleanup function if your effect creates subscriptions, timers, or event listeners.\n\n3. **useCallback and useMemo**: Use these hooks to memoize expensive computations and prevent unnecessary re-renders.\n\n4. **Custom Hooks**: Extract reusable logic into custom hooks for better code organization.",
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
    isBookmarked: false,
  },
  {
    id: "2",
    title: "Python Data Structures",
    content: "Lists vs Tuples: Lists are mutable, tuples are immutable. Use lists when you need to modify the collection. Use tuples for fixed data. Sets are great for unique values and fast membership testing.\n\n**Lists**:\n- Mutable (can be changed)\n- Use square brackets []\n- Good for dynamic collections\n- Example: `fruits = ['apple', 'banana']`\n\n**Tuples**:\n- Immutable (cannot be changed)\n- Use parentheses ()\n- Good for fixed data\n- Example: `coordinates = (10, 20)`\n\n**Sets**:\n- Unique values only\n- Use curly braces {}\n- Fast membership testing\n- Example: `unique_numbers = {1, 2, 3}`",
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
    isBookmarked: true,
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
    isBookmarked: false,
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
    isBookmarked: false,
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
    isBookmarked: true,
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
    isBookmarked: false,
  },
];

const NoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  
  const allNotes = (() => {
    const savedNotes = localStorage.getItem("userNotes");
    let userNotes: typeof mockNotes = [];
    if (savedNotes) {
      try {
        const parsed = JSON.parse(savedNotes);
        userNotes = parsed.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        }));
      } catch {
        userNotes = [];
      }
    }
    
    const merged = [...userNotes];
    mockNotes.forEach((mockNote) => {
      if (!merged.find((n) => n.id === mockNote.id)) {
        merged.push(mockNote);
      }
    });
    return merged;
  })();
  
  const note = allNotes.find((n) => n.id === id);
  
  
  const [isLiked, setIsLiked] = useState(note?.isLiked || false);
  const [isBookmarked, setIsBookmarked] = useState(
    note?.id ? isNoteBookmarked(note.id) : false
  );
  const [likes, setLikes] = useState(note?.likes || 0);

  useEffect(() => {
    const syncBookmarkState = () => {
      if (note?.id) {
        setIsBookmarked(isNoteBookmarked(note.id));
      }
    };

    window.addEventListener("bookmarksUpdated", syncBookmarkState);
    return () => window.removeEventListener("bookmarksUpdated", syncBookmarkState);
  }, [note?.id]);

  if (!note) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Note not found</p>
              <Button onClick={() => navigate("/notes")} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Notes
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const handleLike = () => {
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikes(newIsLiked ? likes + 1 : likes - 1);
  };

  const handleBookmark = () => {
    if (!note?.id) return;

    const newIsBookmarked = toggleNoteBookmark(note.id);
    setIsBookmarked(newIsBookmarked);
    toast.success(newIsBookmarked ? "Note saved!" : "Note removed from saved");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/notes")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Notes
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl mb-4">{note.title}</CardTitle>
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={note.author.avatar} alt={note.author.name} />
                <AvatarFallback>{note.author.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{note.author.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{format(note.updatedAt, "MMM d, yyyy")}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
              <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                {note.content}
              </p>
            </div>
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                className={`${isLiked ? "text-red-500" : ""}`}
                onClick={handleLike}
              >
                <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                {likes} {likes === 1 ? "like" : "likes"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`${isBookmarked ? "text-primary" : ""}`}
                onClick={handleBookmark}
              >
                <Bookmark className={`h-4 w-4 mr-2 ${isBookmarked ? "fill-current" : ""}`} />
                {isBookmarked ? "Saved" : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default NoteDetail;

