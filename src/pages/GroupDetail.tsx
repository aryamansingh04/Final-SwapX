import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Send,
  Paperclip,
  ArrowLeft,
  MoreVertical,
  Users,
  Smile,
  Check,
  CheckCheck,
  Copy,
  Forward,
  Reply,
  Star,
  Trash2,
  Search,
  X,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Layout from "@/components/Layout";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAuthUser } from "@/hooks/useAuthUser";
import { toast } from "sonner";
import { User, UserX } from "lucide-react";

interface GroupMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
  isStarred?: boolean;
  attachment?: {
    type: "image" | "video" | "file";
    name: string;
    size: string;
    url?: string; 
  };
}

interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  role: "admin" | "member";
}

interface Group {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  members: GroupMember[];
  messages: GroupMessage[];
  tags: string[];
  createdAt: Date;
}

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: authStoreUser } = useAuthStore();
  const { user: apiUser } = useAuthUser();
  
  const user = apiUser || authStoreUser;
  const [group, setGroup] = useState<Group | null>(null);
  const [messageText, setMessageText] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<GroupMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAnonymousDialog, setShowAnonymousDialog] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string>("");
  const [pendingFile, setPendingFile] = useState<{
    file: File;
    fileMessage: string;
    fileUrl?: string;
    attachment: {
      type: "image" | "video" | "file";
      name: string;
      size: string;
      url?: string;
    };
  } | null>(null);
  const [sendAsAnonymous, setSendAsAnonymous] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  
  const emojis = ["😀", "😂", "😍", "🥰", "😎", "🤔", "👍", "❤️", "🔥", "✨", "🎉", "💯"];

  useEffect(() => {
    loadGroup();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [group?.messages]);

  const loadGroup = () => {
    const groups = JSON.parse(localStorage.getItem("groups") || "[]");
    const foundGroup = groups.find((g: Group) => g.id === id);

    if (foundGroup) {
      
      const groupWithDates: Group = {
        ...foundGroup,
        messages: foundGroup.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
        createdAt: new Date(foundGroup.createdAt),
      };
      setGroup(groupWithDates);
    } else {
      
      const defaultGroups = createDefaultGroups();
      const defaultGroup = defaultGroups.find((g) => g.id === id);
      if (defaultGroup) {
        saveGroups(defaultGroups);
        setGroup(defaultGroup);
      } else {
        toast.error("Group not found");
        navigate("/groups");
      }
    }
  };

  const createDefaultGroups = (): Group[] => {
    const now = new Date();
    return [
      {
        id: "1",
        name: "React Developers",
        description: "Share knowledge and discuss React best practices",
        members: [
          { id: user?.id || "1", name: user?.name || "You", role: "member" },
          { id: "2", name: "Alex Johnson", role: "admin" },
          { id: "3", name: "Sarah Chen", role: "member" },
          { id: "4", name: "Mike Davis", role: "member" },
        ],
        messages: [
          {
            id: "m1",
            senderId: "2",
            senderName: "Alex Johnson",
            text: "Welcome to React Developers! Feel free to share your projects and ask questions.",
            timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
            isOwn: false,
          },
          {
            id: "m2",
            senderId: "3",
            senderName: "Sarah Chen",
            text: "Has anyone tried React 19 yet? The new features look amazing!",
            timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
            isOwn: false,
          },
        ],
        tags: ["React", "JavaScript", "Frontend"],
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: "2",
        name: "Python Learning",
        description: "Learn Python together and solve coding challenges",
        members: [
          { id: user?.id || "1", name: user?.name || "You", role: "member" },
          { id: "5", name: "David Lee", role: "admin" },
          { id: "6", name: "Emma Wilson", role: "member" },
        ],
        messages: [
          {
            id: "m3",
            senderId: "5",
            senderName: "David Lee",
            text: "Great tutorial on data structures! Check it out: https://example.com",
            timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000),
            isOwn: false,
          },
        ],
        tags: ["Python", "Programming"],
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: "3",
        name: "UI/UX Designers",
        description: "Discuss design trends and share portfolio feedback",
        members: [
          { id: user?.id || "1", name: user?.name || "You", role: "member" },
          { id: "7", name: "Lisa Park", role: "admin" },
          { id: "8", name: "Tom Brown", role: "member" },
        ],
        messages: [
          {
            id: "m4",
            senderId: "7",
            senderName: "Lisa Park",
            text: "New design system looks amazing! Who's working on it?",
            timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000),
            isOwn: false,
          },
        ],
        tags: ["Design", "UI/UX"],
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        id: "4",
        name: "Machine Learning",
        description: "Deep dive into ML algorithms and projects",
        members: [
          { id: user?.id || "1", name: user?.name || "You", role: "member" },
          { id: "9", name: "Ryan Kim", role: "admin" },
          { id: "10", name: "Sophia Martinez", role: "member" },
        ],
        messages: [
          {
            id: "m5",
            senderId: "9",
            senderName: "Ryan Kim",
            text: "Check out this new transformer model - it's groundbreaking!",
            timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
            isOwn: false,
          },
        ],
        tags: ["ML", "AI", "Data Science"],
        createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      },
      {
        id: "5",
        name: "Web Development",
        description: "General web development discussions",
        members: [
          { id: user?.id || "1", name: user?.name || "You", role: "member" },
          { id: "11", name: "Chris Taylor", role: "admin" },
          { id: "12", name: "Anna White", role: "member" },
        ],
        messages: [
          {
            id: "m6",
            senderId: "11",
            senderName: "Chris Taylor",
            text: "Best practices for API design - let's discuss!",
            timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
            isOwn: false,
          },
        ],
        tags: ["Web Dev", "Backend", "Frontend"],
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        id: "6",
        name: "Startup Founders",
        description: "Connect with fellow entrepreneurs",
        members: [
          { id: user?.id || "1", name: user?.name || "You", role: "member" },
          { id: "13", name: "Jordan Smith", role: "admin" },
          { id: "14", name: "Casey Jones", role: "member" },
        ],
        messages: [
          {
            id: "m7",
            senderId: "13",
            senderName: "Jordan Smith",
            text: "Looking for a co-founder with technical background. Anyone interested?",
            timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
            isOwn: false,
          },
        ],
        tags: ["Entrepreneurship", "Startup"],
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      },
    ];
  };

  const saveGroups = (groups: Group[]) => {
    localStorage.setItem("groups", JSON.stringify(groups));
    
    window.dispatchEvent(new Event("groupsUpdated"));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (isAnonymous: boolean) => {
    if (!group) {
      toast.error("Group not found");
      setShowAnonymousDialog(false);
      setPendingMessage("");
      setPendingFile(null);
      return;
    }
    
    
    if (!apiUser && !authStoreUser) {
      toast.error("Please log in to send messages");
      setShowAnonymousDialog(false);
      setPendingMessage("");
      setPendingFile(null);
      return;
    }

    
    if (pendingFile) {
      const senderName = isAnonymous 
        ? "Anonymous" 
        : (user?.user_metadata?.full_name || user?.email?.split("@")[0] || authStoreUser?.name || "You");
      const senderAvatar = isAnonymous ? undefined : (user?.user_metadata?.avatar_url || authStoreUser?.avatar);
      
      const newMessage: GroupMessage = {
        id: `msg-${Date.now()}`,
        senderId: user?.id || authStoreUser?.id || "1",
        senderName: senderName,
        senderAvatar: senderAvatar,
        text: pendingFile.fileMessage,
        timestamp: new Date(),
        isOwn: true,
        attachment: pendingFile.attachment,
      };

      const updatedGroup: Group = {
        ...group,
        messages: [...group.messages, newMessage],
      };

      const groups = JSON.parse(localStorage.getItem("groups") || "[]");
      const groupIndex = groups.findIndex((g: any) => g.id === group.id);
      if (groupIndex !== -1) {
        groups[groupIndex] = {
          ...updatedGroup,
          messages: updatedGroup.messages.map((msg) => ({
            ...msg,
            timestamp: msg.timestamp.toISOString(),
            attachment: msg.attachment ? {
              ...msg.attachment,
              url: undefined, 
            } : undefined,
          })),
          createdAt: updatedGroup.createdAt.toISOString(),
        };
        saveGroups(groups);
        window.dispatchEvent(new Event("groupsUpdated"));
      }
      setGroup(updatedGroup);
      setPendingFile(null);
      setShowAnonymousDialog(false);
      setSendAsAnonymous(null); 
      toast.success("File attachment sent");
      
      
      setTimeout(() => {
        scrollToBottom();
      }, 100);
      return;
    }

    
    if (!pendingMessage.trim()) return;

    const senderName = isAnonymous 
      ? "Anonymous" 
      : (user?.user_metadata?.full_name || user?.email?.split("@")[0] || authStoreUser?.name || "You");
    const senderAvatar = isAnonymous ? undefined : (user?.user_metadata?.avatar_url || authStoreUser?.avatar);

    const newMessage: GroupMessage = {
      id: `msg-${Date.now()}`,
      senderId: user?.id || authStoreUser?.id || "1",
      senderName: senderName,
      senderAvatar: senderAvatar,
      text: pendingMessage.trim(),
      timestamp: new Date(),
      isOwn: true,
    };

    const updatedGroup: Group = {
      ...group,
      messages: [...group.messages, newMessage],
    };

    const groups = JSON.parse(localStorage.getItem("groups") || "[]");
    const groupIndex = groups.findIndex((g: any) => g.id === group.id);
    if (groupIndex !== -1) {
      
      groups[groupIndex] = {
        ...updatedGroup,
        messages: updatedGroup.messages.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        })),
        createdAt: updatedGroup.createdAt.toISOString(),
      };
    } else {
      groups.push({
        ...updatedGroup,
        messages: updatedGroup.messages.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        })),
        createdAt: updatedGroup.createdAt.toISOString(),
      });
    }
    saveGroups(groups);
    setGroup(updatedGroup);
    setMessageText("");
    setPendingMessage("");
    setShowEmojiPicker(false);
    setShowAnonymousDialog(false);
    setSendAsAnonymous(null); 
    
    
    window.dispatchEvent(new Event("groupsUpdated"));
    
    
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  const handleSendClick = () => {
    if (!messageText.trim()) {
      toast.error("Please enter a message");
      return;
    }
    
    if (!group) {
      toast.error("Group not found");
      return;
    }
    
    
    if (!apiUser && !authStoreUser) {
      toast.error("Please log in to send messages");
      return;
    }
    
    
    setPendingMessage(messageText);
    setShowAnonymousDialog(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (messageText.trim() && group && (apiUser || authStoreUser)) {
        handleSendClick();
      }
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setMessageText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!group || (!apiUser && !authStoreUser)) {
      toast.error("Unable to send file. Please log in first.");
      e.target.value = "";
      return;
    }

    const file = files[0];
    const maxSize = 10 * 1024 * 1024; 

    if (file.size > maxSize) {
      toast.error("File size should be less than 10MB");
      e.target.value = "";
      return;
    }

    
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    
    
    const fileType = isImage ? "📷 Image" : 
                     isVideo ? "🎥 Video" :
                     file.type.includes("pdf") ? "📄 PDF" :
                     file.type.includes("doc") || file.type.includes("word") ? "📝 Document" :
                     file.type.includes("sheet") || file.type.includes("excel") ? "📊 Spreadsheet" :
                     file.type.includes("zip") || file.type.includes("rar") ? "📦 Archive" :
                     "📎 File";
    
    const fileSize = file.size < 1024 
      ? `${file.size} B` 
      : file.size < 1024 * 1024 
        ? `${(file.size / 1024).toFixed(2)} KB` 
        : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    
    
    let fileUrl: string | undefined;
    if (isImage || isVideo) {
      fileUrl = URL.createObjectURL(file);
    }
    
    const fileMessage = `${fileType}: ${file.name} (${fileSize})`;
    
    
    setPendingFile({
      file,
      fileMessage,
      fileUrl,
      attachment: {
        type: isImage ? "image" : isVideo ? "video" : "file",
        name: file.name,
        size: fileSize,
        url: fileUrl,
      },
    });
    setShowAnonymousDialog(true);
    
    
    e.target.value = "";
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Message copied to clipboard");
    setSelectedMessage(null);
  };

  const handleStarMessage = (messageId: string) => {
    if (!group) return;

    const updatedGroup: Group = {
      ...group,
      messages: group.messages.map((msg) =>
        msg.id === messageId ? { ...msg, isStarred: !msg.isStarred } : msg
      ),
    };

    const groups = JSON.parse(localStorage.getItem("groups") || "[]");
    const groupIndex = groups.findIndex((g: any) => g.id === group.id);
    if (groupIndex !== -1) {
      groups[groupIndex] = {
        ...updatedGroup,
        messages: updatedGroup.messages.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        })),
        createdAt: updatedGroup.createdAt.toISOString(),
      };
      saveGroups(groups);
    }
    setGroup(updatedGroup);
    setSelectedMessage(null);
    toast.success(updatedGroup.messages.find((m) => m.id === messageId)?.isStarred ? "Message starred" : "Message unstarred");
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!group) return;

    const updatedGroup: Group = {
      ...group,
      messages: group.messages.filter((msg) => msg.id !== messageId),
    };

    const groups = JSON.parse(localStorage.getItem("groups") || "[]");
    const groupIndex = groups.findIndex((g: any) => g.id === group.id);
    if (groupIndex !== -1) {
      groups[groupIndex] = {
        ...updatedGroup,
        messages: updatedGroup.messages.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        })),
        createdAt: updatedGroup.createdAt.toISOString(),
      };
      saveGroups(groups);
      window.dispatchEvent(new Event("groupsUpdated"));
    }
    setGroup(updatedGroup);
    setSelectedMessage(null);
    toast.success("Message deleted");
  };

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };

  const formatDateSeparator = (date: Date) => {
    if (isToday(date)) {
      return "Today";
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMMM d, yyyy");
    }
  };

  const getGroupedMessages = () => {
    if (!group) return [];

    const grouped: { date: Date; messages: GroupMessage[] }[] = [];
    let currentDate: Date | null = null;
    let currentGroup: GroupMessage[] = [];

    group.messages.forEach((msg) => {
      const msgDate = new Date(msg.timestamp);
      msgDate.setHours(0, 0, 0, 0);

      if (!currentDate || currentDate.getTime() !== msgDate.getTime()) {
        if (currentGroup.length > 0) {
          grouped.push({ date: currentDate!, messages: currentGroup });
        }
        currentDate = msgDate;
        currentGroup = [msg];
      } else {
        currentGroup.push(msg);
      }
    });

    if (currentGroup.length > 0 && currentDate) {
      grouped.push({ date: currentDate, messages: currentGroup });
    }

    return grouped;
  };

  if (!group) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-muted-foreground">Loading group...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const groupedMessages = getGroupedMessages();
  const isAdmin = group.members.find((m) => m.id === user?.id)?.role === "admin";

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        {}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center px-4 gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/groups")}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {group.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">{group.name}</h2>
              <p className="text-xs text-muted-foreground truncate">
                {group.members.length} members
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Group Options</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate(`/groups/${id}/members`)}>
                  <Users className="h-4 w-4 mr-2" />
                  View Members
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex}>
                <div className="flex items-center justify-center my-4">
                  <div className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                    {formatDateSeparator(group.date)}
                  </div>
                </div>
                {group.messages.map((message, index) => {
                  const showAvatar =
                    index === 0 ||
                    group.messages[index - 1].senderId !== message.senderId ||
                    new Date(message.timestamp).getTime() -
                      new Date(group.messages[index - 1].timestamp).getTime() >
                      5 * 60 * 1000; 

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-2 mb-1 group ${
                        message.isOwn ? "flex-row-reverse" : "flex-row"
                      }`}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setSelectedMessage(message);
                      }}
                    >
                      {!message.isOwn && (
                        <div className="w-8 flex-shrink-0">
                          {showAvatar ? (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {message.senderName[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-8" />
                          )}
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] flex flex-col ${
                          message.isOwn ? "items-end" : "items-start"
                        }`}
                      >
                        {!message.isOwn && showAvatar && (
                          <span className="text-xs text-muted-foreground mb-1 px-1">
                            {message.senderName}
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            message.isOwn
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-muted rounded-tl-sm"
                          }`}
                        >
                          {}
                          {message.attachment?.type === "image" && message.attachment.url && (
                            <div className="mb-2 rounded-lg overflow-hidden max-w-sm">
                              <img
                                src={message.attachment.url}
                                alt={message.attachment.name}
                                className="w-full h-auto object-contain max-h-64"
                              />
                            </div>
                          )}
                          {message.attachment?.type === "video" && message.attachment.url && (
                            <div className="mb-2 rounded-lg overflow-hidden max-w-sm">
                              <video
                                src={message.attachment.url}
                                controls
                                className="w-full h-auto max-h-64"
                              >
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.text}
                          </p>
                        </div>
                        <div
                          className={`flex items-center gap-1 mt-1 px-1 ${
                            message.isOwn ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <span className="text-xs text-muted-foreground">
                            {formatMessageTime(message.timestamp)}
                          </span>
                          {message.isOwn && (
                            <CheckCheck className="h-3 w-3 text-muted-foreground" />
                          )}
                          {message.isStarred && (
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {}
        <div className="border-t bg-background p-3">
          {}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,video/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.zip,.rar"
          />
          <div className="flex items-end gap-2">
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <Smile className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="grid grid-cols-6 gap-1">
                  {emojis.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEmojiClick(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button 
              variant="ghost" 
              size="icon" 
              className="flex-shrink-0"
              onClick={handleFileAttach}
              type="button"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button
              onClick={handleSendClick}
              disabled={!messageText.trim()}
              size="icon"
              className="flex-shrink-0"
              type="button"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>

      {}
      <AlertDialog 
        open={showAnonymousDialog} 
        onOpenChange={(open) => {
          if (!open) {
            
            setPendingMessage("");
            setPendingFile(null);
          }
          setShowAnonymousDialog(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Message</AlertDialogTitle>
            <AlertDialogDescription>
              How would you like to send this {pendingFile ? "file" : "message"}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-4">
            <Button
              variant="outline"
              className="w-full justify-start hover:bg-primary hover:text-primary-foreground"
              onClick={() => {
                handleSendMessage(false);
              }}
            >
              <User className="h-4 w-4 mr-2" />
              Send with my name ({user?.user_metadata?.full_name || user?.email?.split("@")[0] || authStoreUser?.name || "You"})
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start hover:bg-primary hover:text-primary-foreground"
              onClick={() => {
                handleSendMessage(true);
              }}
            >
              <UserX className="h-4 w-4 mr-2" />
              Send as Anonymous
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowAnonymousDialog(false);
                setPendingMessage("");
                setPendingFile(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {}
      {selectedMessage && (
          <div className="fixed inset-0 z-50" onClick={() => setSelectedMessage(null)}>
            <div
              className="fixed bg-background border rounded-lg shadow-lg p-1 min-w-[200px]"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleCopyMessage(selectedMessage.text)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleStarMessage(selectedMessage.id)}
              >
                <Star
                  className={`h-4 w-4 mr-2 ${
                    selectedMessage.isStarred ? "fill-yellow-500 text-yellow-500" : ""
                  }`}
                />
                {selectedMessage.isStarred ? "Unstar" : "Star"}
              </Button>
              {selectedMessage.isOwn && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive"
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GroupDetail;

