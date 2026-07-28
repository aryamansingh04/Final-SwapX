import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Send, 
  Paperclip, 
  Search, 
  MoreVertical,
  MessageCircle,
  Phone,
  Plus,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  Archive,
  ArchiveRestore,
  Bell,
  BellOff,
  Trash2,
  Check,
  CheckCheck,
  Copy,
  Forward,
  Reply,
  Star,
  Smile,
  Clock,
  UserPlus,
  UserCheck,
  UserX,
  Video,
  Play,
  FileText,
  BookOpen,
  Calendar,
  Clock as ClockIcon
} from "lucide-react";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Layout from "@/components/Layout";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAuthUser } from "@/hooks/useAuthUser";
import { getMessages, Message, sendMessage } from "@/lib/chat";
import {
  mergeChatLists,
  parseStoredChats,
  serializeChatsForStorage,
  sortChatsByRecent,
} from "@/lib/chat-storage";
import { myConnections } from "@/lib/connections";
import { getProfileById } from "@/lib/profile";
import { toast } from "sonner";
import { getToken } from "@/lib/api";
import { getDemoAccountById, getOtherDemoAccounts, isDemoUserId } from "@/lib/demo-accounts";
import {
  acceptDemoConnectionRequest,
  getConnectionRequestsReceived,
  getDemoConnectionStatus,
  getDemoMessages,
  initiateDemoCall,
  rejectDemoConnectionRequest,
  sendDemoChatMessage,
  sendDemoConnectionRequest,
} from "@/lib/demo-sync";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  timestamp: Date;
  isOwn: boolean;
  status?: "sending" | "sent" | "delivered" | "read";
  isStarred?: boolean;
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  lastSeen?: string;
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  isTyping?: boolean;
  connectionStatus?: "connected" | "pending-sent" | "pending-received" | "not-connected";
  connectionId?: number;
  messages: ChatMessage[];
}

interface CallHistory {
  id: string;
  chatId: string;
  name: string;
  avatar: string;
  type: "incoming" | "outgoing" | "missed";
  date: string;
  time: string;
  duration: string;
  recordedLecture?: string; 
  notes?: string; 
  subject?: string; 
  topics?: string[]; 
}

const mockChats: Chat[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    lastMessage: "Hi! Ready for our React session?",
    lastMessageTime: "10:30",
    lastSeen: "Just now",
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isTyping: false,
    connectionStatus: "connected",
    messages: [
      { 
        id: "1", 
        sender: "Sarah Johnson", 
        text: "Hi! Ready for our React session?", 
        time: "10:30", 
        timestamp: new Date(Date.now() - 300000),
        isOwn: false 
      },
      { 
        id: "2", 
        sender: "You", 
        text: "Yes! Looking forward to it", 
        time: "10:32", 
        timestamp: new Date(Date.now() - 180000),
        isOwn: true,
        status: "read"
      },
      { 
        id: "3", 
        sender: "Sarah Johnson", 
        text: "Great! I'll share my screen in 5 mins", 
        time: "10:33", 
        timestamp: new Date(Date.now() - 120000),
        isOwn: false 
      },
    ]
  },
  {
    id: "2",
    name: "Alex Chen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    lastMessage: "Thanks for the Python help!",
    lastMessageTime: "09:15",
    lastSeen: "2 minutes ago",
    unreadCount: 2,
    isPinned: false,
    isMuted: false,
    isTyping: false,
    connectionStatus: "connected",
    messages: [
      { 
        id: "1", 
        sender: "Alex Chen", 
        text: "Hey, can you help me with Python?", 
        time: "09:00", 
        timestamp: new Date(Date.now() - 3600000),
        isOwn: false 
      },
      { 
        id: "2", 
        sender: "You", 
        text: "Of course! What do you need?", 
        time: "09:05", 
        timestamp: new Date(Date.now() - 3300000),
        isOwn: true,
        status: "delivered"
      },
      { 
        id: "3", 
        sender: "Alex Chen", 
        text: "Thanks for the Python help!", 
        time: "09:15", 
        timestamp: new Date(Date.now() - 2700000),
        isOwn: false 
      },
    ]
  },
  {
    id: "3",
    name: "Maya Patel",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya",
    lastMessage: "Let's schedule a session",
    lastMessageTime: "Yesterday",
    lastSeen: "Yesterday at 8:30 PM",
    unreadCount: 0,
    isPinned: true,
    isMuted: false,
    isTyping: false,
    connectionStatus: "pending-received",
    messages: [
      { 
        id: "1", 
        sender: "Maya Patel", 
        text: "Hi! I'd love to learn Data Science", 
        time: "Yesterday", 
        timestamp: new Date(Date.now() - 86400000),
        isOwn: false 
      },
      { 
        id: "2", 
        sender: "You", 
        text: "Great! Let's schedule a session", 
        time: "Yesterday", 
        timestamp: new Date(Date.now() - 86000000),
        isOwn: true,
        status: "read"
      },
    ]
  },
  {
    id: "4",
    name: "Jordan Taylor",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan",
    lastMessage: "Thanks for the mobile dev tips!",
    lastMessageTime: "2 days ago",
    lastSeen: "2 days ago",
    unreadCount: 0,
    isPinned: false,
    isMuted: true,
    isArchived: false,
    isTyping: false,
    connectionStatus: "connected",
    messages: [
      { 
        id: "1", 
        sender: "Jordan Taylor", 
        text: "Can you teach me React Native?", 
        time: "2 days ago", 
        timestamp: new Date(Date.now() - 172800000),
        isOwn: false 
      },
      { 
        id: "2", 
        sender: "You", 
        text: "Absolutely! Here are some tips...", 
        time: "2 days ago", 
        timestamp: new Date(Date.now() - 172700000),
        isOwn: true,
        status: "read"
      },
      { 
        id: "3", 
        sender: "Jordan Taylor", 
        text: "Thanks for the mobile dev tips!", 
        time: "2 days ago", 
        timestamp: new Date(Date.now() - 172600000),
        isOwn: false 
      },
    ]
  },
  {
    id: "5",
    name: "Emily Rodriguez",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    lastMessage: "The design system looks great!",
    lastMessageTime: "3 hours ago",
    lastSeen: "30 minutes ago",
    unreadCount: 1,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    isTyping: false,
    connectionStatus: "connected",
    messages: [
      { 
        id: "1", 
        sender: "Emily Rodriguez", 
        text: "Hi! Can you review my UI design?", 
        time: "4 hours ago", 
        timestamp: new Date(Date.now() - 14400000),
        isOwn: false 
      },
      { 
        id: "2", 
        sender: "You", 
        text: "Sure! Send me the link", 
        time: "4 hours ago", 
        timestamp: new Date(Date.now() - 14300000),
        isOwn: true,
        status: "read"
      },
      { 
        id: "3", 
        sender: "Emily Rodriguez", 
        text: "The design system looks great!", 
        time: "3 hours ago", 
        timestamp: new Date(Date.now() - 10800000),
        isOwn: false 
      },
    ]
  },
  {
    id: "6",
    name: "David Kim",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    lastMessage: "When can we start the backend session?",
    lastMessageTime: "1 hour ago",
    lastSeen: "5 minutes ago",
    unreadCount: 0,
    isPinned: true,
    isMuted: false,
    isArchived: false,
    isTyping: false,
    connectionStatus: "connected",
    messages: [
      { 
        id: "1", 
        sender: "David Kim", 
        text: "I need help with Node.js backend", 
        time: "2 hours ago", 
        timestamp: new Date(Date.now() - 7200000),
        isOwn: false 
      },
      { 
        id: "2", 
        sender: "You", 
        text: "I can help! What specifically?", 
        time: "2 hours ago", 
        timestamp: new Date(Date.now() - 7100000),
        isOwn: true,
        status: "read"
      },
      { 
        id: "3", 
        sender: "David Kim", 
        text: "When can we start the backend session?", 
        time: "1 hour ago", 
        timestamp: new Date(Date.now() - 3600000),
        isOwn: false 
      },
    ]
  },
  {
    id: "7",
    name: "Sophia Williams",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia",
    lastMessage: "The algorithm explanation was perfect!",
    lastMessageTime: "5 hours ago",
    lastSeen: "1 hour ago",
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    isTyping: false,
    connectionStatus: "connected",
    messages: [
      { 
        id: "1", 
        sender: "Sophia Williams", 
        text: "Can you explain dynamic programming?", 
        time: "6 hours ago", 
        timestamp: new Date(Date.now() - 21600000),
        isOwn: false 
      },
      { 
        id: "2", 
        sender: "You", 
        text: "Sure! Let me explain with examples", 
        time: "6 hours ago", 
        timestamp: new Date(Date.now() - 21500000),
        isOwn: true,
        status: "read"
      },
      { 
        id: "3", 
        sender: "Sophia Williams", 
        text: "The algorithm explanation was perfect!", 
        time: "5 hours ago", 
        timestamp: new Date(Date.now() - 18000000),
        isOwn: false 
      },
    ]
  },
  {
    id: "8",
    name: "Michael Brown",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    lastMessage: "Thanks for the database help!",
    lastMessageTime: "Yesterday",
    lastSeen: "Yesterday at 6:00 PM",
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    isTyping: false,
    connectionStatus: "connected",
    messages: [
      { 
        id: "1", 
        sender: "Michael Brown", 
        text: "I'm struggling with PostgreSQL queries", 
        time: "Yesterday", 
        timestamp: new Date(Date.now() - 86400000),
        isOwn: false 
      },
      { 
        id: "2", 
        sender: "You", 
        text: "I can help! What's the issue?", 
        time: "Yesterday", 
        timestamp: new Date(Date.now() - 86000000),
        isOwn: true,
        status: "read"
      },
      { 
        id: "3", 
        sender: "Michael Brown", 
        text: "Thanks for the database help!", 
        time: "Yesterday", 
        timestamp: new Date(Date.now() - 85600000),
        isOwn: false 
      },
    ]
  },
  {
    id: "9",
    name: "Olivia Martinez",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia",
    lastMessage: "The API design is looking good!",
    lastMessageTime: "12 hours ago",
    lastSeen: "8 hours ago",
    unreadCount: 2,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    isTyping: false,
    connectionStatus: "pending-sent",
    messages: [
      { 
        id: "1", 
        sender: "Olivia Martinez", 
        text: "Can you help me with REST API design?", 
        time: "12 hours ago", 
        timestamp: new Date(Date.now() - 43200000),
        isOwn: false 
      },
      { 
        id: "2", 
        sender: "You", 
        text: "Absolutely! Here's a good structure...", 
        time: "12 hours ago", 
        timestamp: new Date(Date.now() - 43100000),
        isOwn: true,
        status: "sent"
      },
    ]
  },
  {
    id: "10",
    name: "James Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
    lastMessage: "The Docker setup works perfectly!",
    lastMessageTime: "6 hours ago",
    lastSeen: "3 hours ago",
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    isTyping: false,
    connectionStatus: "connected",
    messages: [
      { 
        id: "1", 
        sender: "James Wilson", 
        text: "Need help with Docker containers", 
        time: "7 hours ago", 
        timestamp: new Date(Date.now() - 25200000),
        isOwn: false 
      },
      { 
        id: "2", 
        sender: "You", 
        text: "Sure! Let me guide you through it", 
        time: "7 hours ago", 
        timestamp: new Date(Date.now() - 25100000),
        isOwn: true,
        status: "read"
      },
      { 
        id: "3", 
        sender: "James Wilson", 
        text: "The Docker setup works perfectly!", 
        time: "6 hours ago", 
        timestamp: new Date(Date.now() - 21600000),
        isOwn: false 
      },
    ]
  },
];

const Chat = () => {
  const { connectionId } = useParams<{ connectionId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { user: apiUser } = useAuthUser();
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(connectionId || null);
  const [chats, setChats] = useState<Chat[]>(mockChats); 
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallHistory | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [newChatAvatar, setNewChatAvatar] = useState("");

  
  useEffect(() => {
    const loadChats = async () => {
      const savedChats = parseStoredChats(localStorage.getItem("chats"));
      let allChats = mergeChatLists(mockChats, savedChats);

      if (user && isDemoUserId(user.id) && !getToken()) {
        const demoPartners = getOtherDemoAccounts(user.id);
        const demoChatMap = new Map(allChats.map((chat) => [chat.id, chat]));

        for (const partner of demoPartners) {
          const connectionStatus = getDemoConnectionStatus(user.id, partner.id);
          const demoMessages = getDemoMessages(user.id, partner.id).map((msg) => ({
            id: msg.id,
            sender: msg.fromUserId === user.id ? "You" : msg.senderName,
            text: msg.text,
            time: format(new Date(msg.timestamp), "h:mm a"),
            timestamp: new Date(msg.timestamp),
            isOwn: msg.fromUserId === user.id,
            status: msg.fromUserId === user.id ? ("sent" as const) : undefined,
          }));

          const lastMessage = demoMessages[demoMessages.length - 1];
          const demoChat: Chat = {
            id: partner.id,
            name: partner.name,
            avatar: partner.avatar,
            lastMessage: lastMessage?.text ?? "Start a conversation",
            lastMessageTime: lastMessage ? format(new Date(lastMessage.timestamp), "h:mm a") : "Now",
            unreadCount: 0,
            isPinned: true,
            isMuted: false,
            isArchived: false,
            isTyping: false,
            connectionStatus,
            messages: demoMessages,
          };

          demoChatMap.set(partner.id, demoChat);
        }

        allChats = sortChatsByRecent(Array.from(demoChatMap.values()));
        setChats(allChats);
        return;
      }

      const connectionRequestsSent = JSON.parse(
        localStorage.getItem("connectionRequestsSent") || "[]"
      );
      const connectionRequestsReceived = JSON.parse(
        localStorage.getItem("connectionRequestsReceived") || "[]"
      );
      const connections = JSON.parse(
        localStorage.getItem("connections") || "[]"
      );

      allChats = allChats.map((chat) => {
        const isConnected = connections.includes(chat.id);
        const sentRequest = connectionRequestsSent.find((r: any) => r.userId === chat.id);
        const receivedRequest = connectionRequestsReceived.find(
          (r: any) => (r.userId || r.id) === chat.id
        );

        let connectionStatus = chat.connectionStatus || "not-connected";
        if (isConnected) {
          connectionStatus = "connected";
        } else if (sentRequest) {
          connectionStatus =
            sentRequest.status === "rejected" ? "not-connected" : "pending-sent";
        } else if (receivedRequest) {
          connectionStatus = "pending-received";
        }

        return {
          ...chat,
          connectionStatus,
        };
      });

      if (apiUser) {
        try {
          const supabaseConnections = await myConnections();
          const chatMap = new Map(allChats.map((chat) => [chat.id, chat]));

          for (const connection of supabaseConnections) {
            const partnerId =
              connection.user_id === apiUser.id
                ? connection.partner_id
                : connection.user_id;

            const existingChat = chatMap.get(partnerId);

            if (existingChat) {
              if (connection.status === "accepted") {
                existingChat.connectionStatus = "connected";
                existingChat.connectionId = connection.id;

                try {
                  const supabaseMessages = await getMessages(connection.id);
                  const chatMessages: ChatMessage[] = supabaseMessages.map((msg) => ({
                    id: msg.id.toString(),
                    sender: msg.sender === apiUser.id ? "You" : existingChat.name,
                    text: msg.content,
                    time: msg.created_at ? format(new Date(msg.created_at), "h:mm a") : "",
                    timestamp: msg.created_at ? new Date(msg.created_at) : new Date(),
                    isOwn: msg.sender === apiUser.id,
                    status: msg.sender === apiUser.id ? "sent" : undefined,
                  }));

                  if (chatMessages.length > 0) {
                    const merged = mergeChatLists([existingChat], [
                      {
                        ...existingChat,
                        messages: chatMessages,
                        lastMessage: chatMessages[chatMessages.length - 1].text,
                        lastMessageTime: chatMessages[chatMessages.length - 1].time,
                      },
                    ]);
                    chatMap.set(partnerId, merged[0]);
                  }
                } catch (error) {
                  console.error(`Error loading messages for connection ${connection.id}:`, error);
                }
              } else if (connection.status === "pending") {
                existingChat.connectionStatus =
                  connection.user_id === apiUser.id
                    ? "pending-sent"
                    : "pending-received";
              }
              continue;
            }

            try {
              const partnerProfile = await getProfileById(partnerId);
              if (!partnerProfile) continue;

              let allMessages: Message[] = [];
              try {
                allMessages = await getMessages(connection.id);
              } catch {
                // Fall back to local-only chat data when Supabase is unavailable.
              }

              const chatMessages: ChatMessage[] = allMessages.map((msg) => ({
                id: msg.id.toString(),
                sender:
                  msg.sender === apiUser.id
                    ? "You"
                    : partnerProfile.full_name || partnerProfile.username || "User",
                text: msg.content,
                time: msg.created_at ? format(new Date(msg.created_at), "h:mm a") : "",
                timestamp: msg.created_at ? new Date(msg.created_at) : new Date(),
                isOwn: msg.sender === apiUser.id,
                status: msg.sender === apiUser.id ? "sent" : undefined,
              }));

              let connectionStatus:
                | "connected"
                | "pending-sent"
                | "pending-received"
                | "not-connected" = "not-connected";
              if (connection.status === "accepted") {
                connectionStatus = "connected";
              } else if (connection.status === "pending") {
                connectionStatus =
                  connection.user_id === apiUser.id ? "pending-sent" : "pending-received";
              }

              const lastMessage = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null;
              let lastMessageTime = "Now";
              if (lastMessage) {
                const msgDate = lastMessage.timestamp;
                if (isToday(msgDate)) {
                  lastMessageTime = format(msgDate, "h:mm a");
                } else if (isYesterday(msgDate)) {
                  lastMessageTime = "Yesterday";
                } else {
                  lastMessageTime = format(msgDate, "MMM d");
                }
              }

              const supabaseChat: Chat = {
                id: partnerId,
                connectionId: connection.id,
                name: partnerProfile.full_name || partnerProfile.username || "User",
                avatar:
                  partnerProfile.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerProfile.username || "User"}`,
                lastMessage: lastMessage ? lastMessage.text : "Start a conversation",
                lastMessageTime,
                unreadCount: 0,
                isPinned: false,
                isMuted: false,
                isArchived: false,
                isTyping: false,
                connectionStatus,
                messages: chatMessages,
              };

              chatMap.set(partnerId, supabaseChat);
            } catch (error) {
              console.error(`Error loading profile for ${partnerId}:`, error);
            }
          }

          allChats = Array.from(chatMap.values());
        } catch (error) {
          console.error("Error loading Supabase connections:", error);
        }
      }

      setChats(sortChatsByRecent(allChats));
    };

    loadChats();

    const handleConnectionUpdate = () => {
      loadChats();
    };
    window.addEventListener("connectionRequestsUpdated", handleConnectionUpdate);
    window.addEventListener("demoSyncUpdated", handleConnectionUpdate);
    window.addEventListener("chatsUpdated", handleConnectionUpdate);

    return () => {
      window.removeEventListener("connectionRequestsUpdated", handleConnectionUpdate);
      window.removeEventListener("demoSyncUpdated", handleConnectionUpdate);
      window.removeEventListener("chatsUpdated", handleConnectionUpdate);
    };
  }, [apiUser, user]);
  
  
  const [callHistory] = useState<CallHistory[]>([
    {
      id: "1",
      chatId: "1",
      name: "Sarah Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      type: "outgoing",
      date: "2024-01-15",
      time: "14:30",
      duration: "15:32",
      recordedLecture: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
      notes: "Discussed React hooks and state management. Sarah had questions about useEffect dependencies and custom hooks. Recommended using React Query for data fetching.",
      subject: "React Development",
      topics: ["React Hooks", "State Management", "useEffect", "Custom Hooks", "React Query"]
    },
    {
      id: "2",
      chatId: "2",
      name: "Alex Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      type: "incoming",
      date: "2024-01-14",
      time: "10:15",
      duration: "08:45",
      recordedLecture: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_2mb.mp4",
      notes: "Python debugging session. Helped Alex with list comprehensions and error handling. Covered try-except blocks and logging best practices.",
      subject: "Python Programming",
      topics: ["List Comprehensions", "Error Handling", "Try-Except Blocks", "Logging", "Debugging"]
    },
    {
      id: "3",
      chatId: "3",
      name: "Maya Patel",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya",
      type: "missed",
      date: "2024-01-13",
      time: "16:20",
      duration: "—"
    },
    {
      id: "4",
      chatId: "1",
      name: "Sarah Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      type: "incoming",
      date: "2024-01-12",
      time: "09:00",
      duration: "22:10",
      recordedLecture: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
      notes: "Long session on React performance optimization. Covered memoization with useMemo and useCallback, code splitting, and lazy loading components. Discussed React DevTools profiling.",
      subject: "React Performance",
      topics: ["Performance Optimization", "Memoization", "useMemo", "useCallback", "Code Splitting", "Lazy Loading", "React DevTools"]
    },
    {
      id: "5",
      chatId: "2",
      name: "Alex Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      type: "outgoing",
      date: "2024-01-11",
      time: "11:30",
      duration: "05:20",
      recordedLecture: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_2mb.mp4",
      notes: "Quick Python review session. Covered dictionary operations and lambda functions.",
      subject: "Python Basics",
      topics: ["Dictionaries", "Lambda Functions", "Python Syntax"]
    },
    {
      id: "6",
      chatId: "6",
      name: "David Kim",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
      type: "outgoing",
      date: "2024-01-10",
      time: "15:45",
      duration: "12:30",
      recordedLecture: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
      notes: "Node.js backend architecture discussion. Covered Express.js routing, middleware, and database connections. Discussed RESTful API design principles.",
      subject: "Node.js Backend",
      topics: ["Express.js", "Routing", "Middleware", "Database Connections", "RESTful API", "API Design"]
    },
    {
      id: "7",
      chatId: "7",
      name: "Sophia Williams",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia",
      type: "incoming",
      date: "2024-01-09",
      time: "13:20",
      duration: "18:15",
      recordedLecture: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_2mb.mp4",
      notes: "Algorithm deep dive: Dynamic programming. Covered Fibonacci sequence, knapsack problem, and longest common subsequence. Provided coding examples and practice problems.",
      subject: "Algorithms & Data Structures",
      topics: ["Dynamic Programming", "Fibonacci", "Knapsack Problem", "Longest Common Subsequence", "Algorithm Optimization"]
    },
  ]);

  
  useEffect(() => {
    if (connectionId) {
      setSelectedChatId(connectionId);

      setChats((prevChats) => {
        const updatedChats = prevChats.map((chat) =>
          chat.id === connectionId ? { ...chat, unreadCount: 0 } : chat
        );
        saveChatsToStorage(updatedChats);

        const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
        const updatedNotifications = notifications.map((n: any) =>
          n.type === "message" && n.chatId === connectionId ? { ...n, isRead: true } : n
        );
        localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
        window.dispatchEvent(new Event("notificationsUpdated"));

        return updatedChats;
      });
    } else {
      setSelectedChatId(null);
    }
  }, [connectionId]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const selectedChat = chats.find(chat => chat.id === selectedChatId);
  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchiveFilter = showArchived ? chat.isArchived : !chat.isArchived;
    return matchesSearch && matchesArchiveFilter;
  });

  
  const totalUnreadCount = chats
    .filter(chat => !chat.isArchived)
    .reduce((total, chat) => total + chat.unreadCount, 0);

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedChat?.messages]);

  
  const formatDateSeparator = (date: Date) => {
    if (isToday(date)) {
      return "Today";
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMMM d, yyyy");
    }
  };

  
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "sending":
        return <Clock className="h-3 w-3" />;
      case "sent":
        return <Check className="h-3 w-3" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return <CheckCheck className="h-3 w-3" />;
    }
  };

  
  const formatMessageTime = (timestamp: Date) => {
    return format(timestamp, "h:mm a");
  };

  
  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { date: Date; messages: ChatMessage[] }[] = [];
    let currentDate: Date | null = null;
    let currentGroup: ChatMessage[] = [];

    messages.forEach((msg) => {
      const msgDate = new Date(msg.timestamp);
      msgDate.setHours(0, 0, 0, 0);
      
      if (!currentDate || msgDate.getTime() !== currentDate.getTime()) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate!, messages: currentGroup });
        }
        currentDate = msgDate;
        currentGroup = [msg];
      } else {
        currentGroup.push(msg);
      }
    });

    if (currentGroup.length > 0 && currentDate) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  };

  
  const saveChatsToStorage = (chatsToSave: Chat[]) => {
    try {
      localStorage.setItem("chats", serializeChatsForStorage(chatsToSave));
      window.dispatchEvent(new Event("chatsUpdated"));
      return true;
    } catch (error) {
      console.error("Error saving chats to localStorage:", error);
      return false;
    }
  };

  const updateChatMessages = (
    chatId: string,
    updater: (chat: Chat) => Chat
  ) => {
    setChats((prevChats) => {
      const updatedChats = sortChatsByRecent(
        prevChats.map((chat) => (chat.id === chatId ? updater(chat) : chat))
      );
      saveChatsToStorage(updatedChats);
      return updatedChats;
    });
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!selectedChatId) {
      toast.error("Please select a chat");
      return;
    }

    const currentChat = chats.find((chat) => chat.id === selectedChatId);
    if (!currentChat) {
      toast.error("Chat not found");
      return;
    }

    if (currentChat.connectionStatus !== "connected") {
      toast.error("You need to be connected to send messages");
      return;
    }

    const messageText = message.trim();
    const now = new Date();
    setMessage("");

    const appendLocalMessage = (
      chatMessage: ChatMessage,
      options?: { replaceTemp?: boolean }
    ) => {
      updateChatMessages(selectedChatId, (chat) => {
        const messages = options?.replaceTemp
          ? chat.messages.filter((msg) => !msg.id.startsWith("temp-"))
          : chat.messages;

        return {
          ...chat,
          messages: [...messages, chatMessage],
          lastMessage: chatMessage.text,
          lastMessageTime: chatMessage.time,
        };
      });
    };

    if (user && isDemoUserId(user.id) && isDemoUserId(selectedChatId)) {
      sendDemoChatMessage(user.id, selectedChatId, messageText);
      appendLocalMessage({
        id: Date.now().toString(),
        sender: "You",
        text: messageText,
        time: format(now, "h:mm a"),
        timestamp: now,
        isOwn: true,
        status: "sent",
      });
      return;
    }

    if (currentChat.connectionId && apiUser) {
      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        sender: "You",
        text: messageText,
        time: format(now, "h:mm a"),
        timestamp: now,
        isOwn: true,
        status: "sending",
      };

      updateChatMessages(selectedChatId, (chat) => ({
        ...chat,
        messages: [...chat.messages, optimisticMessage],
        lastMessage: messageText,
        lastMessageTime: optimisticMessage.time,
      }));

      try {
        await sendMessage(currentChat.connectionId, messageText);
        const allSupabaseMessages = await getMessages(currentChat.connectionId);

        const allChatMessages: ChatMessage[] = allSupabaseMessages.map((msg) => ({
          id: msg.id.toString(),
          sender: msg.sender === apiUser.id ? "You" : currentChat.name,
          text: msg.content,
          time: msg.created_at ? format(new Date(msg.created_at), "h:mm a") : format(now, "h:mm a"),
          timestamp: msg.created_at ? new Date(msg.created_at) : now,
          isOwn: msg.sender === apiUser.id,
          status: msg.sender === apiUser.id ? "sent" : undefined,
        }));

        updateChatMessages(selectedChatId, (chat) => ({
          ...chat,
          messages: allChatMessages,
          lastMessage:
            allChatMessages.length > 0
              ? allChatMessages[allChatMessages.length - 1].text
              : messageText,
          lastMessageTime:
            allChatMessages.length > 0
              ? allChatMessages[allChatMessages.length - 1].time
              : format(now, "h:mm a"),
        }));
      } catch (error) {
        console.error("Error sending message via Supabase, saving locally:", error);
        appendLocalMessage(
          {
            id: Date.now().toString(),
            sender: "You",
            text: messageText,
            time: format(now, "h:mm a"),
            timestamp: now,
            isOwn: true,
            status: "sent",
          },
          { replaceTemp: true }
        );
      }
      return;
    }

    appendLocalMessage({
      id: Date.now().toString(),
      sender: "You",
      text: messageText,
      time: format(now, "h:mm a"),
      timestamp: now,
      isOwn: true,
      status: "sent",
    });
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Message copied");
    setSelectedMessageId(null);
  };

  const handleReplyMessage = (message: ChatMessage) => {
    
    toast.success("Reply feature coming soon");
    setSelectedMessageId(null);
  };

  const handleForwardMessage = (message: ChatMessage) => {
    toast.success("Forward feature coming soon");
    setSelectedMessageId(null);
  };

  const handleStarMessage = (messageId: string) => {
    if (!selectedChatId) return;
    const updatedChats = chats.map(chat => {
      if (chat.id === selectedChatId) {
        return {
          ...chat,
          messages: chat.messages.map(msg =>
            msg.id === messageId
              ? { ...msg, isStarred: !msg.isStarred }
              : msg
          ),
        };
      }
      return chat;
    });
    setChats(updatedChats);
    localStorage.setItem("chats", JSON.stringify(updatedChats));
    window.dispatchEvent(new Event("chatsUpdated"));
    setSelectedMessageId(null);
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!selectedChatId) return;
    const updatedChats = chats.map(chat => {
      if (chat.id === selectedChatId) {
        return {
          ...chat,
          messages: chat.messages.filter(msg => msg.id !== messageId),
        };
      }
      return chat;
    });
    setChats(updatedChats);
    localStorage.setItem("chats", JSON.stringify(updatedChats));
    window.dispatchEvent(new Event("chatsUpdated"));
    toast.success("Message deleted");
    setSelectedMessageId(null);
  };

  
  const commonEmojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
    "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
    "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
    "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
    "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
    "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
    "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯",
    "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐",
    "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈",
    "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾",
    "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿",
    "👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘",
    "👌", "🤌", "🤏", "👈", "👉", "👆", "👇", "☝️", "👋", "🤚",
    "🖐️", "✋", "🖖", "👏", "🙌", "🤲", "🤝", "🙏", "✍️", "💪",
    "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "❤️", "🧡", "💛",
    "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞",
    "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️",
    "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉",
    "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓",
    "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳", "🈶", "🈚", "🈸",
    "🈺", "🈷️", "✴️", "🆚", "💮", "🉐", "㊙️", "㊗️", "🈴", "🈵",
    "🈹", "🈲", "🅰️", "🅱️", "🆎", "🆑", "🅾️", "🆘", "❌", "⭕",
    "🛑", "⛔", "📛", "🚫", "💯", "💢", "♨️", "🚷", "🚯", "🚳",
    "🚱", "🔞", "📵", "🚭", "❗", "❕", "❓", "❔", "‼️", "⁉️",
    "🔅", "🔆", "〽️", "⚠️", "🚸", "🔱", "⚜️", "🔰", "♻️", "✅",
    "🈯", "💹", "❇️", "✳️", "❎", "🌐", "💠", "Ⓜ️", "🌀", "💤",
    "🏧", "🚾", "♿", "🅿️", "🈳", "🈂️", "🛂", "🛃", "🛄", "🛅",
    "🚹", "🚺", "🚼", "🚻", "🚮", "🎦", "📶", "🈁", "🔣", "ℹ️",
    "🔤", "🔡", "🔠", "🔢", "🔟", "🔯", "🔮", "🕎", "💯", "🔞",
  ];

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setEmojiPickerOpen(false);
  };

  
  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    
    if (!selectedChatId) return;
    const currentChat = chats.find(chat => chat.id === selectedChatId);
    if (currentChat?.connectionStatus !== "connected") {
      toast.error("You need to be connected to send files");
      e.target.value = "";
      return;
    }

    const file = files[0];
    const maxSize = 10 * 1024 * 1024; 

    if (file.size > maxSize) {
      toast.error("File size should be less than 10MB");
      return;
    }

    
    
    const fileType = file.type.startsWith("image/") ? "📷 Image" : 
                     file.type.startsWith("video/") ? "🎥 Video" :
                     file.type.includes("pdf") ? "📄 PDF" :
                     "📎 File";
    
    const fileMessage = `${fileType}: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    
    
    if (!selectedChatId) return;
    
    const now = new Date();
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "You",
      text: fileMessage,
      time: format(now, "h:mm a"),
      timestamp: now,
      isOwn: true,
      status: "sending",
    };

    const updatedChats = chats.map(chat => {
      if (chat.id === selectedChatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMessage: fileMessage,
          lastMessageTime: newMessage.time,
        };
      }
      return chat;
    });
    setChats(updatedChats);
    localStorage.setItem("chats", JSON.stringify(updatedChats));
    window.dispatchEvent(new Event("chatsUpdated"));

    
    setTimeout(() => {
      const currentChats = JSON.parse(localStorage.getItem("chats") || JSON.stringify(updatedChats));
      const updated = currentChats.map((chat: Chat) => {
        if (chat.id === selectedChatId) {
          return {
            ...chat,
            messages: chat.messages.map((msg: ChatMessage) =>
              msg.id === newMessage.id
                ? { ...msg, status: "sent" as const }
                : msg
            ),
          };
        }
        return chat;
      });
      setChats(updated);
      localStorage.setItem("chats", JSON.stringify(updated));
      window.dispatchEvent(new Event("chatsUpdated"));
    }, 500);

    setTimeout(() => {
      const currentChats = JSON.parse(localStorage.getItem("chats") || "[]");
      const updated = currentChats.map((chat: Chat) => {
        if (chat.id === selectedChatId) {
          return {
            ...chat,
            messages: chat.messages.map((msg: ChatMessage) =>
              msg.id === newMessage.id
                ? { ...msg, status: "delivered" as const }
                : msg
            ),
          };
        }
        return chat;
      });
      setChats(updated);
      localStorage.setItem("chats", JSON.stringify(updated));
      window.dispatchEvent(new Event("chatsUpdated"));
    }, 1000);

    toast.success(`${fileType} attached: ${file.name}`);
    
    
    e.target.value = "";
  };

  const handleChatSelect = (chatId: string) => {
    
    const updatedChats = chats.map(chat =>
      chat.id === chatId
        ? { ...chat, unreadCount: 0 }
        : chat
    );
    setChats(updatedChats);
    saveChatsToStorage(updatedChats);
    
    
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    const updatedNotifications = notifications.map((n: any) =>
      n.type === "message" && n.chatId === chatId
        ? { ...n, isRead: true }
        : n
    );
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
    window.dispatchEvent(new Event("notificationsUpdated"));
    
    setSelectedChatId(chatId);
    setSelectedCall(null); 
    setShowCallHistory(false); 
    navigate(`/chat/${chatId}`);
  };

  
  const handleSendConnectionRequest = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);

    if (user && isDemoUserId(user.id) && isDemoUserId(chatId) && chat) {
      try {
        sendDemoConnectionRequest(user.id, chatId, {
          message: `Hi ${chat.name}, let's connect on SwapX!`,
          skill: "Skill Swap",
        });
        setChats((prevChats) =>
          prevChats.map((c) =>
            c.id === chatId ? { ...c, connectionStatus: "pending-sent" as const } : c
          )
        );
        toast.success("Connection request sent!");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to send request");
      }
      return;
    }

    const connectionRequestsSent = JSON.parse(
      localStorage.getItem("connectionRequestsSent") || "[]"
    );
    
    if (chat && !connectionRequestsSent.some((r: any) => r.userId === chatId)) {
      
      const newRequest = {
        id: Date.now().toString(),
        userId: chatId,
        name: chat.name,
        avatar: chat.avatar,
        sentAt: new Date().toISOString(),
        status: "pending",
      };

      connectionRequestsSent.push(newRequest);
      localStorage.setItem("connectionRequestsSent", JSON.stringify(connectionRequestsSent));

      
      setChats((prevChats) =>
        prevChats.map((c) =>
          c.id === chatId ? { ...c, connectionStatus: "pending-sent" as const } : c
        )
      );

      
      const updatedChats = chats.map((c) =>
        c.id === chatId ? { ...c, connectionStatus: "pending-sent" as const } : c
      );
      localStorage.setItem("chats", JSON.stringify(updatedChats));

      
      window.dispatchEvent(new Event("connectionRequestsUpdated"));
      window.dispatchEvent(new Event("chatsUpdated"));

      toast.success("Connection request sent!");
    }
  };

  const handleAcceptConnection = (chatId: string) => {
    if (user && isDemoUserId(user.id)) {
      const received = getConnectionRequestsReceived(user.id).find(
        (request) => request.userId === chatId
      );

      if (received) {
        acceptDemoConnectionRequest(received.id, user.id);
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === chatId
              ? { ...chat, connectionStatus: "connected" as const, lastMessage: "Start a conversation" }
              : chat
          )
        );
        window.dispatchEvent(new Event("demoSyncUpdated"));
        toast.success("Connection accepted! You can now chat.");
      }
      return;
    }

    const connectionRequestsReceived = JSON.parse(
      localStorage.getItem("connectionRequestsReceived") || "[]"
    );
    const connections = JSON.parse(localStorage.getItem("connections") || "[]");

    
    const updatedReceived = connectionRequestsReceived.filter(
      (r: any) => (r.userId || r.id) !== chatId
    );
    localStorage.setItem("connectionRequestsReceived", JSON.stringify(updatedReceived));

    
    if (!connections.includes(chatId)) {
      connections.push(chatId);
      localStorage.setItem("connections", JSON.stringify(connections));
    }

    
    const connectionRequestsSent = JSON.parse(
      localStorage.getItem("connectionRequestsSent") || "[]"
    );
    const updatedSent = connectionRequestsSent.map((r: any) =>
      r.userId === chatId ? { ...r, status: "accepted" } : r
    );
    localStorage.setItem("connectionRequestsSent", JSON.stringify(updatedSent));

    
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId
          ? { ...chat, connectionStatus: "connected" as const, lastMessage: "Start a conversation" }
          : chat
      )
    );

    
    const updatedChats = chats.map((chat) =>
      chat.id === chatId
        ? { ...chat, connectionStatus: "connected" as const, lastMessage: "Start a conversation" }
        : chat
    );
    localStorage.setItem("chats", JSON.stringify(updatedChats));

    
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      const newNotification = {
        id: Date.now().toString(),
        title: "Connection Accepted",
        message: `You are now connected with ${chat.name}`,
        type: "connection",
        isRead: false,
        timestamp: new Date().toISOString(),
        link: `/chat/${chatId}`,
        userId: chatId,
      };
      
      
      const updatedNotifications = notifications.map((n: any) =>
        n.type === "connection" && (n.userId === chatId || n.message?.includes(chat.name))
          ? { ...n, isRead: true }
          : n
      );
      updatedNotifications.unshift(newNotification);
      const limitedNotifications = updatedNotifications.slice(0, 50);
      localStorage.setItem("notifications", JSON.stringify(limitedNotifications));
    }

    
    window.dispatchEvent(new Event("connectionRequestsUpdated"));
    window.dispatchEvent(new Event("chatsUpdated"));
    window.dispatchEvent(new Event("notificationsUpdated"));

    toast.success("Connection accepted! You can now chat.");
  };

  const handleRejectConnection = (chatId: string) => {
    if (user && isDemoUserId(user.id)) {
      const received = getConnectionRequestsReceived(user.id).find(
        (request) => request.userId === chatId
      );

      if (received) {
        rejectDemoConnectionRequest(received.id, user.id);
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === chatId ? { ...chat, connectionStatus: "not-connected" as const } : chat
          )
        );
        window.dispatchEvent(new Event("demoSyncUpdated"));
        toast.success("Connection request rejected");
      }
      return;
    }

    const connectionRequestsReceived = JSON.parse(
      localStorage.getItem("connectionRequestsReceived") || "[]"
    );

    
    const updatedReceived = connectionRequestsReceived.filter(
      (r: any) => (r.userId || r.id) !== chatId
    );
    localStorage.setItem("connectionRequestsReceived", JSON.stringify(updatedReceived));

    
    const connectionRequestsSent = JSON.parse(
      localStorage.getItem("connectionRequestsSent") || "[]"
    );
    const updatedSent = connectionRequestsSent.map((r: any) =>
      r.userId === chatId ? { ...r, status: "rejected" } : r
    );
    localStorage.setItem("connectionRequestsSent", JSON.stringify(updatedSent));

    
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, connectionStatus: "not-connected" as const } : chat
      )
    );

    
    const updatedChats = chats.map((chat) =>
      chat.id === chatId ? { ...chat, connectionStatus: "not-connected" as const } : chat
    );
    localStorage.setItem("chats", JSON.stringify(updatedChats));

    
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      const updatedNotifications = notifications.map((n: any) =>
        n.type === "connection" && (n.userId === chatId || n.message?.includes(chat.name))
          ? { ...n, isRead: true }
          : n
      );
      localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
    }

    
    window.dispatchEvent(new Event("connectionRequestsUpdated"));
    window.dispatchEvent(new Event("chatsUpdated"));
    window.dispatchEvent(new Event("notificationsUpdated"));

    toast.success("Connection request rejected");
  };

  const handleCall = (chatId?: string) => {
    if (chatId && user && isDemoUserId(user.id) && isDemoUserId(chatId)) {
      const partner = getDemoAccountById(chatId);
      const jitsiLink = `https://meet.jit.si/swapx-${Date.now()}`;
      initiateDemoCall({
        fromUserId: user.id,
        toUserId: chatId,
        link: jitsiLink,
        type: "video",
      });
      window.open(jitsiLink, "_blank");
      toast.success(`Calling ${partner?.name ?? "user"}...`);
      return;
    }

    if (chatId) {
      
      navigate(`/meeting/${chatId}`);
    } else {
      
      setShowCallHistory(!showCallHistory);
    }
  };

  const getCallIcon = (type: CallHistory["type"]) => {
    switch (type) {
      case "incoming":
        return <PhoneIncoming className="h-4 w-4 text-green-500" />;
      case "outgoing":
        return <PhoneOutgoing className="h-4 w-4 text-blue-500" />;
      case "missed":
        return <PhoneMissed className="h-4 w-4 text-red-500" />;
      default:
        return <Phone className="h-4 w-4" />;
    }
  };

  const getCallBadgeVariant = (type: CallHistory["type"]) => {
    switch (type) {
      case "incoming":
        return "default";
      case "outgoing":
        return "secondary";
      case "missed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleCallHistoryItemClick = (call: CallHistory) => {
    setSelectedCall(call);
    setSelectedChatId(null); 
  };

  const handleNewChat = () => {
    if (!newChatName.trim()) {
      toast.error("Please enter a name");
      return;
    }
    
    const newChat: Chat = {
      id: Date.now().toString(),
      name: newChatName,
      avatar: newChatAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${newChatName}`,
      lastMessage: "Not connected",
      lastMessageTime: "Now",
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      connectionStatus: "not-connected",
      messages: []
    };
    
    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    localStorage.setItem("chats", JSON.stringify(updatedChats));
    window.dispatchEvent(new Event("chatsUpdated"));
    setNewChatOpen(false);
    setNewChatName("");
    setNewChatAvatar("");
    navigate(`/chat/${newChat.id}`);
    toast.success("New chat created! Send a connection request to start chatting.");
  };

  const handleArchiveChat = () => {
    let updatedChats: Chat[];
    if (selectedChatId) {
      updatedChats = chats.map(chat =>
        chat.id === selectedChatId
          ? { ...chat, isArchived: true }
          : chat
      );
      navigate("/chat");
      toast.success("Chat archived");
    } else {
      
      updatedChats = chats.map(chat => ({ ...chat, isArchived: true }));
      toast.success("All chats archived");
    }
    setChats(updatedChats);
    localStorage.setItem("chats", JSON.stringify(updatedChats));
    window.dispatchEvent(new Event("chatsUpdated"));
  };

  const handleUnarchiveChat = (chatId?: string) => {
    let updatedChats: Chat[];
    if (chatId) {
      
      updatedChats = chats.map(chat =>
        chat.id === chatId
          ? { ...chat, isArchived: false }
          : chat
      );
      toast.success("Chat unarchived");
    } else {
      
      updatedChats = chats.map(chat => ({ ...chat, isArchived: false }));
      setShowArchived(false);
      toast.success("All chats unarchived");
    }
    setChats(updatedChats);
    localStorage.setItem("chats", JSON.stringify(updatedChats));
    window.dispatchEvent(new Event("chatsUpdated"));
  };

  const handleMuteChat = () => {
    let updatedChats: Chat[];
    if (selectedChatId) {
      const chat = chats.find(c => c.id === selectedChatId);
      const newMuteStatus = !chat?.isMuted;
      updatedChats = chats.map(c =>
        c.id === selectedChatId
          ? { ...c, isMuted: newMuteStatus }
          : c
      );
      toast.success(newMuteStatus ? "Chat muted" : "Chat unmuted");
    } else {
      
      const allMuted = chats.every(chat => chat.isMuted);
      updatedChats = chats.map(chat => ({ ...chat, isMuted: !allMuted }));
      toast.success(!allMuted ? "All chats muted" : "All chats unmuted");
    }
    setChats(updatedChats);
    localStorage.setItem("chats", JSON.stringify(updatedChats));
    window.dispatchEvent(new Event("chatsUpdated"));
  };

  const handleDeleteChat = () => {
    let updatedChats: Chat[];
    if (selectedChatId) {
      updatedChats = chats.filter(chat => chat.id !== selectedChatId);
      navigate("/chat");
      toast.success("Chat deleted");
    } else {
      
      updatedChats = [];
      navigate("/chat");
      toast.success("All chats deleted");
    }
    setChats(updatedChats);
    localStorage.setItem("chats", JSON.stringify(updatedChats));
    window.dispatchEvent(new Event("chatsUpdated"));
  };


  return (
    <Layout>
      <div className="fixed inset-0 top-16 flex bg-background h-[calc(100vh-4rem)]">
      {}
      <div className="w-[30%] min-w-[300px] border-r bg-muted/30 flex flex-col">
        {}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || "User"}`}
                  alt={user?.name || "User"}
                />
                <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <h1 className="text-xl font-semibold">
                {showCallHistory ? "Call History" : showArchived ? "Archived Chats" : "Chats"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setNewChatOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Chat Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      setShowCallHistory(false);
                      setShowArchived(false);
                    }}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    View Chats
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      setShowCallHistory(true);
                      setShowArchived(false);
                    }}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    View Call History
                  </DropdownMenuItem>
                  {showArchived ? (
                    <>
                      {selectedChatId && chats.find(c => c.id === selectedChatId)?.isArchived ? (
                        <DropdownMenuItem onClick={() => handleUnarchiveChat(selectedChatId)}>
                          <ArchiveRestore className="mr-2 h-4 w-4" />
                          Unarchive This Chat
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleUnarchiveChat()}>
                          <ArchiveRestore className="mr-2 h-4 w-4" />
                          Unarchive All
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => {
                        setShowArchived(false);
                        setShowCallHistory(false);
                      }}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Back to Chats
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={() => setShowArchived(true)}>
                      <Archive className="mr-2 h-4 w-4" />
                      View Archived
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {!showArchived && (
                    <DropdownMenuItem onClick={handleArchiveChat}>
                      <Archive className="mr-2 h-4 w-4" />
                      {selectedChatId ? "Archive This Chat" : "Archive All Chats"}
                    </DropdownMenuItem>
                  )}
                  {showArchived && selectedChatId && (
                    <DropdownMenuItem onClick={handleArchiveChat}>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive This Chat
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleMuteChat}>
                    {selectedChatId && chats.find(c => c.id === selectedChatId)?.isMuted ? (
                      <>
                        <Bell className="mr-2 h-4 w-4" />
                        Unmute {selectedChatId ? "This Chat" : "All Chats"}
                      </>
                    ) : (
                      <>
                        <BellOff className="mr-2 h-4 w-4" />
                        Mute {selectedChatId ? "This Chat" : "All Chats"}
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleDeleteChat}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {selectedChatId ? "Delete This Chat" : "Delete All Chats"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search or start new chat"
              className="pl-10 bg-muted/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {}
        <div className="flex items-center justify-center gap-2 px-2 py-2 border-b">
          <Button 
            variant={showCallHistory || showArchived ? "outline" : "default"}
            size="icon" 
            className="h-10 w-10 relative"
            onClick={() => {
              setShowCallHistory(false);
              setShowArchived(false);
              setSelectedCall(null);
              setSelectedChatId(null);
              navigate("/chat");
            }}
          >
            <MessageCircle className="h-5 w-5" />
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">
                {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
              </span>
            )}
          </Button>
          <Button 
            variant={showCallHistory ? "default" : "ghost"}
            size="icon" 
            className="h-10 w-10"
            onClick={() => {
              setShowCallHistory(!showCallHistory);
              setShowArchived(false);
              setSelectedCall(null);
              setSelectedChatId(null);
            }}
          >
            <Phone className="h-5 w-5" />
          </Button>
        </div>

        {}
        <ScrollArea className="flex-1">
          {showCallHistory ? (
            <div className="divide-y">
              {callHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground px-4">
                  <PhoneOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No call history yet</p>
                </div>
              ) : (
                callHistory.map((call) => (
                  <button
                    key={call.id}
                    onClick={() => handleCallHistoryItemClick(call)}
                    className={`w-full p-3 hover:bg-muted/50 transition-colors text-left ${
                      selectedCall?.id === call.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-transparent">
                        <AvatarImage src={call.avatar} alt={call.name} />
                        <AvatarFallback>{call.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm truncate">{call.name}</span>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            {getCallIcon(call.type)}
                            <Badge variant={getCallBadgeVariant(call.type)} className="text-xs">
                              {call.type}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{call.date} at {call.time}</span>
                          <span className="font-medium">{call.duration}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground px-4">
              {showArchived ? (
                <>
                  <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No archived chats</p>
                </>
              ) : (
                <>
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No chats yet</p>
                  <p className="text-xs mt-2">Click the + button to start a new chat</p>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`w-full p-3 hover:bg-muted/50 transition-colors ${
                    selectedChatId === chat.id ? 'bg-muted' : ''
                  }`}
                >
                <button
                  onClick={() => handleChatSelect(chat.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-transparent">
                      <AvatarImage src={chat.avatar} alt={chat.name} />
                      <AvatarFallback>{chat.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{chat.name}</span>
                          {chat.connectionStatus === "pending-sent" && (
                            <Clock className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                          )}
                          {chat.connectionStatus === "pending-received" && (
                            <UserPlus className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          )}
                          {chat.connectionStatus === "not-connected" && (
                            <UserX className="h-3 w-3 text-gray-500" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">{chat.lastMessageTime}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground truncate flex-1">
                          {chat.connectionStatus === "connected" 
                            ? chat.lastMessage 
                            : chat.connectionStatus === "pending-sent" 
                            ? "Connection request sent"
                            : chat.connectionStatus === "pending-received"
                            ? "Connection request received"
                            : "Not connected"}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {chat.isPinned && (
                            <span className="text-muted-foreground" title="Pinned">
                              📌
                            </span>
                          )}
                          {chat.isMuted && (
                            <span className="text-muted-foreground" title="Muted">
                              🔕
                            </span>
                          )}
                          {chat.connectionStatus === "connected" && chat.unreadCount > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
                {showArchived && (
                  <div className="mt-2 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUnarchiveChat(chat.id)}>
                          <ArchiveRestore className="mr-2 h-4 w-4" />
                          Unarchive
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            const updatedChats = chats.filter(c => c.id !== chat.id);
                            setChats(updatedChats);
                            localStorage.setItem("chats", JSON.stringify(updatedChats));
                            window.dispatchEvent(new Event("chatsUpdated"));
                            toast.success("Chat deleted");
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {}
      <div className="flex-1 flex flex-col">
        {selectedCall ? (
          <>
            {}
            <div className="p-4 border-b bg-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedCall.avatar} alt={selectedCall.name} />
                    <AvatarFallback>{selectedCall.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold">{selectedCall.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(`${selectedCall.date} ${selectedCall.time}`), "PPP 'at' p")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const chat = chats.find(c => c.id === selectedCall.chatId);
                      if (chat) {
                        setSelectedChatId(selectedCall.chatId);
                        setSelectedCall(null);
                        setShowCallHistory(false);
                        navigate(`/chat/${selectedCall.chatId}`);
                      }
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Open Chat
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedCall(null);
                    }}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {}
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {}
                <div className="flex flex-col items-center justify-center py-8">
                  <div className={`p-6 rounded-full mb-4 ${
                    selectedCall.type === "incoming" 
                      ? "bg-green-100 dark:bg-green-900/30" 
                      : selectedCall.type === "outgoing"
                      ? "bg-blue-100 dark:bg-blue-900/30"
                      : "bg-red-100 dark:bg-red-900/30"
                  }`}>
                    {selectedCall.type === "incoming" ? (
                      <PhoneIncoming className="h-12 w-12 text-green-600 dark:text-green-400" />
                    ) : selectedCall.type === "outgoing" ? (
                      <PhoneOutgoing className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <PhoneMissed className="h-12 w-12 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <Badge variant={getCallBadgeVariant(selectedCall.type)} className="text-sm px-3 py-1">
                    {selectedCall.type.charAt(0).toUpperCase() + selectedCall.type.slice(1)} Call
                  </Badge>
                </div>

                {}
                <div className="bg-card border rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date & Time</p>
                        <p className="font-medium">
                          {format(new Date(`${selectedCall.date} ${selectedCall.time}`), "PPP 'at' p")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ClockIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-medium">{selectedCall.duration}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedCall.avatar} alt={selectedCall.name} />
                      <AvatarFallback>{selectedCall.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Contact</p>
                      <Button
                        variant="link"
                        className="p-0 h-auto font-medium"
                        onClick={() => {
                          const chat = chats.find(c => c.id === selectedCall.chatId);
                          if (chat) {
                            setSelectedChatId(selectedCall.chatId);
                            setSelectedCall(null);
                            setShowCallHistory(false);
                            navigate(`/chat/${selectedCall.chatId}`);
                          }
                        }}
                      >
                        {selectedCall.name}
                      </Button>
                    </div>
                  </div>
                </div>

                {}
                {selectedCall.subject && (
                  <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">Subject</h3>
                    </div>
                    <p className="text-muted-foreground">{selectedCall.subject}</p>
                  </div>
                )}

                {}
                {selectedCall.topics && selectedCall.topics.length > 0 && (
                  <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">Topics Discussed</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedCall.topics.map((topic, idx) => (
                        <Badge key={idx} variant="secondary" className="text-sm">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {}
                {selectedCall.recordedLecture && (
                  <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Video className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">Recorded Lecture</h3>
                    </div>
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        controls
                        className="w-full h-full"
                        src={selectedCall.recordedLecture}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <Button
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() => window.open(selectedCall.recordedLecture, '_blank')}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </Button>
                  </div>
                )}

                {}
                {selectedCall.notes && (
                  <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">Relevant Notes</h3>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-muted-foreground whitespace-pre-wrap">{selectedCall.notes}</p>
                    </div>
                  </div>
                )}

                {}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      const chat = chats.find(c => c.id === selectedCall.chatId);
                      if (chat) {
                        setSelectedChatId(selectedCall.chatId);
                        setSelectedCall(null);
                        setShowCallHistory(false);
                        navigate(`/chat/${selectedCall.chatId}`);
                      }
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      const chat = chats.find(c => c.id === selectedCall.chatId);
                      if (chat) {
                        handleCall(selectedCall.chatId);
                      }
                    }}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Again
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </>
        ) : selectedChat ? (
          <>
            {}
            {selectedChat.connectionStatus !== "connected" && (
              <div className="border-b bg-yellow-500/10 dark:bg-yellow-900/20 border-yellow-500/20 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    {selectedChat.connectionStatus === "pending-sent" && (
                      <>
                        <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-yellow-700 dark:text-yellow-300">
                          Connection request pending. Waiting for {selectedChat.name} to accept.
                        </span>
                      </>
                    )}
                    {selectedChat.connectionStatus === "pending-received" && (
                      <>
                        <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-blue-700 dark:text-blue-300">
                          {selectedChat.name} sent you a connection request.
                        </span>
                      </>
                    )}
                    {selectedChat.connectionStatus === "not-connected" && (
                      <>
                        <UserX className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">
                          You need to send a connection request to start chatting.
                        </span>
                      </>
                    )}
                  </div>
                  {selectedChat.connectionStatus === "pending-received" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectConnection(selectedChat.id)}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptConnection(selectedChat.id)}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  )}
                  {selectedChat.connectionStatus === "not-connected" && (
                    <Button
                      size="sm"
                      onClick={() => handleSendConnectionRequest(selectedChat.id)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Send Request
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            {}
            <div className="p-4 border-b bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedChat.avatar} alt={selectedChat.name} />
                  <AvatarFallback>{selectedChat.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
                  <h2 className="font-semibold">{selectedChat.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedChat.isTyping ? (
                      <span className="text-primary">typing...</span>
                    ) : selectedChat.lastSeen ? (
                      selectedChat.lastSeen
                    ) : (
                      "Online"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleCall(selectedChat.id)}
                >
                  <Phone className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Chat Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {selectedChat.isArchived ? (
                      <DropdownMenuItem onClick={() => handleUnarchiveChat(selectedChatId)}>
                        <ArchiveRestore className="mr-2 h-4 w-4" />
                        Unarchive Chat
                      </DropdownMenuItem>
                    ) : (
                    <DropdownMenuItem onClick={() => {
                      handleArchiveChat();
                    }}>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive Chat
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => {
                      handleMuteChat();
                    }}>
                      {selectedChat.isMuted ? (
                        <>
                          <Bell className="mr-2 h-4 w-4" />
                          Unmute Chat
                        </>
                      ) : (
                        <>
                          <BellOff className="mr-2 h-4 w-4" />
                          Mute Chat
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => {
                        handleDeleteChat();
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </div>

            {}
            <ScrollArea className="flex-1 p-4" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
              {selectedChat.connectionStatus !== "connected" ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  {selectedChat.connectionStatus === "pending-sent" && (
                    <>
                      <div className="mb-4 p-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                        <Clock className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Connection Request Pending</h3>
                      <p className="text-muted-foreground mb-4 max-w-md">
                        You've sent a connection request to <strong>{selectedChat.name}</strong>. 
                        You can start chatting once they accept your request.
                      </p>
                    </>
                  )}
                  {selectedChat.connectionStatus === "pending-received" && (
                    <>
                      <div className="mb-4 p-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <UserPlus className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Connection Request Received</h3>
                      <p className="text-muted-foreground mb-4 max-w-md">
                        <strong>{selectedChat.name}</strong> wants to connect with you. 
                        Accept the request to start chatting.
                      </p>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => handleRejectConnection(selectedChat.id)}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                        <Button
                          onClick={() => handleAcceptConnection(selectedChat.id)}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Accept & Start Chatting
                        </Button>
                      </div>
                    </>
                  )}
                  {selectedChat.connectionStatus === "not-connected" && (
                    <>
                      <div className="mb-4 p-4 rounded-full bg-gray-100 dark:bg-gray-800">
                        <UserX className="h-12 w-12 text-gray-600 dark:text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Not Connected</h3>
                      <p className="text-muted-foreground mb-4 max-w-md">
                        You need to send a connection request to <strong>{selectedChat.name}</strong> before you can start chatting.
                      </p>
                      <Button
                        onClick={() => handleSendConnectionRequest(selectedChat.id)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Send Connection Request
                      </Button>
                    </>
                  )}
                </div>
              ) : selectedChat.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="mb-4 p-4 rounded-full bg-primary/10">
                    <MessageCircle className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Start a conversation</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    You're now connected with <strong>{selectedChat.name}</strong>. 
                    Start chatting by sending a message below.
                  </p>
                </div>
              ) : (
              <div className="space-y-4 pb-4">
                {groupMessagesByDate(selectedChat.messages).map((group, groupIndex) => (
                  <div key={groupIndex}>
                    {}
                    <div className="flex justify-center my-4">
                      <div className="px-3 py-1 bg-muted/80 backdrop-blur-sm rounded-full text-xs text-muted-foreground font-medium">
                        {formatDateSeparator(group.date)}
                      </div>
                    </div>
                    {}
                    {group.messages.map((msg, msgIndex) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'} mb-1 group`}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <div
                              className={`max-w-[65%] cursor-pointer ${
                                msg.isOwn ? 'order-1' : 'order-2'
                              }`}
                            >
                              <div
                                className={`rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-shadow ${
                      msg.isOwn
                                    ? 'bg-[#DCF8C6] text-gray-900 rounded-br-none'
                                    : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                                }`}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  setSelectedMessageId(msg.id);
                                }}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                <div className={`flex items-center justify-end gap-1 mt-1 ${msg.isOwn ? 'ml-2' : ''}`}>
                                  <span className="text-[10px] text-gray-500">
                                    {formatMessageTime(msg.timestamp)}
                                  </span>
                                  {msg.isOwn && (
                                    <span className="ml-1 flex-shrink-0">
                                      {getStatusIcon(msg.status)}
                                    </span>
                                  )}
                                  {msg.isStarred && (
                                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 ml-1" />
                                  )}
                  </div>
                </div>
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={msg.isOwn ? "end" : "start"} className="w-48">
                            <DropdownMenuItem onClick={() => handleReplyMessage(msg)}>
                              <Reply className="mr-2 h-4 w-4" />
                              Reply
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleForwardMessage(msg)}>
                              <Forward className="mr-2 h-4 w-4" />
                              Forward
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyMessage(msg.text)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStarMessage(msg.id)}>
                              <Star className={`mr-2 h-4 w-4 ${msg.isStarred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                              {msg.isStarred ? "Unstar" : "Star"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
              </div>
            ))}
          </div>
                ))}
                {}
                {selectedChat.isTyping && (
                  <div className="flex justify-start mb-1">
                    <div className="bg-white rounded-lg rounded-bl-none px-4 py-3 shadow-sm border border-gray-200">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              )}
            </ScrollArea>

            {}
            {selectedChat.connectionStatus === "connected" ? (
              <div className="p-3 border-t bg-[#F0F2F5] dark:bg-gray-800">
                {}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                />
                
                <div className="flex items-end gap-2">
                  {}
                  <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-full"
                        type="button"
                      >
                        <Smile className="h-5 w-5" />
              </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-80 p-2" 
                      align="start"
                      side="top"
                    >
                      <div className="grid grid-cols-8 gap-1 max-h-64 overflow-y-auto">
                        {commonEmojis.map((emoji, index) => (
                          <button
                            key={index}
                            onClick={() => handleEmojiSelect(emoji)}
                            className="text-2xl hover:bg-muted rounded p-1 transition-colors cursor-pointer"
                            type="button"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  {}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-full"
                    onClick={handleFileAttach}
                    type="button"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 relative">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      className="rounded-full bg-white dark:bg-gray-700 border-0 pl-4 pr-12 py-6 h-auto resize-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                  {message.trim() ? (
                    <Button 
                      onClick={handleSend} 
                      size="icon" 
                      className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90"
                    >
                      <Send className="h-5 w-5" />
              </Button>
                  ) : (
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                      <Phone className="h-5 w-5" />
              </Button>
                  )}
            </div>
          </div>
            ) : (
              <div className="p-3 border-t bg-[#F0F2F5] dark:bg-gray-800">
                <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                  {selectedChat.connectionStatus === "pending-sent" && (
                    <span>Connection request pending. You can't send messages yet.</span>
                  )}
                  {selectedChat.connectionStatus === "pending-received" && (
                    <span>Accept the connection request to start chatting.</span>
                  )}
                  {selectedChat.connectionStatus === "not-connected" && (
                    <span>Send a connection request to start chatting.</span>
                  )}
    </div>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center bg-muted/10">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-muted-foreground mb-2">
                {showCallHistory ? "Call History" : "SwapX Chat"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {showCallHistory ? "Select a call to view details" : "Select a chat to start messaging"}
              </p>
            </div>
          </div>
        )}
      </div>
      </div>

      
      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Chat</DialogTitle>
            <DialogDescription>
              Create a new chat conversation with a user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter name or email"
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleNewChat()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar URL (Optional)</Label>
              <Input
                id="avatar"
                placeholder="Enter avatar URL"
                value={newChatAvatar}
                onChange={(e) => setNewChatAvatar(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleNewChat()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewChatOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleNewChat}>
              Start Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Chat;
