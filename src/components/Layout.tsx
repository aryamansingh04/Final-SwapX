import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, MessageSquare, BarChart3, Upload, User, Menu, X, Users, Video, FileText, Newspaper, Settings, MessageCircle, Bookmark, Bell, HelpCircle, Info, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "./ThemeToggle";
import IncomingCallBanner from "./IncomingCallBanner";
import { useAuthStore } from "@/stores/useAuthStore";
import { clearToken, getToken } from "@/lib/api";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/social-api";
import { isDemoUserId } from "@/lib/demo-accounts";
import {
  getDemoNotifications,
  markAllDemoNotificationsRead,
  markDemoNotificationRead,
} from "@/lib/demo-sync";

interface LayoutProps {
  children: React.ReactNode;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "connection" | "message" | "meeting" | "like" | "comment" | "call";
  isRead: boolean;
  timestamp: Date;
  link?: string;
  userId?: string; 
  chatId?: string; 
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  
  useEffect(() => {
    const loadNotifications = () => {
      if (getToken()) {
        getNotifications()
          .then((items) => {
            setNotifications(
              items.map((notification) => ({
                ...notification,
                type: notification.type as Notification["type"],
                timestamp: new Date(notification.timestamp),
              }))
            );
          })
          .catch(() => setNotifications([]));
        return;
      }

      if (user && isDemoUserId(user.id)) {
        setNotifications(
          getDemoNotifications(user.id).map((notification) => ({
            ...notification,
            timestamp: new Date(notification.timestamp),
          }))
        );
        return;
      }

      const saved = localStorage.getItem("notifications");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setNotifications(
            parsed.map((n: any) => ({
              ...n,
              timestamp: new Date(n.timestamp),
            }))
          );
        } catch {
          
          const defaultNotifications: Notification[] = [
            {
              id: "1",
              title: "New Connection Request",
              message: "Sarah Johnson wants to connect with you",
              type: "connection",
              isRead: false,
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
              link: "/dashboard",
            },
            {
              id: "2",
              title: "New Message",
              message: "You have a new message from Alex Chen",
              type: "message",
              isRead: false,
              timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
              link: "/chat",
            },
            {
              id: "3",
              title: "Meeting Reminder",
              message: "Your meeting with Morgan Lee starts in 30 minutes",
              type: "meeting",
              isRead: true,
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
              link: "/dashboard",
            },
          ];
          setNotifications(defaultNotifications);
          localStorage.setItem("notifications", JSON.stringify(defaultNotifications));
        }
      } else {
        
        const defaultNotifications: Notification[] = [
          {
            id: "1",
            title: "New Connection Request",
            message: "Sarah Johnson wants to connect with you",
            type: "connection",
            isRead: false,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            link: "/dashboard",
          },
          {
            id: "2",
            title: "New Message",
            message: "You have a new message from Alex Chen",
            type: "message",
            isRead: false,
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
            link: "/chat",
          },
          {
            id: "3",
            title: "Meeting Reminder",
            message: "Your meeting with Morgan Lee starts in 30 minutes",
            type: "meeting",
            isRead: true,
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            link: "/dashboard",
          },
        ];
        setNotifications(defaultNotifications);
        localStorage.setItem("notifications", JSON.stringify(defaultNotifications));
      }
    };

    loadNotifications();

    
    const handleNotificationUpdate = () => {
      loadNotifications();
    };
    const handleConnectionUpdate = () => {
      
      const connectionRequestsReceived = JSON.parse(
        localStorage.getItem("connectionRequestsReceived") || "[]"
      );
      const savedNotifications = JSON.parse(localStorage.getItem("notifications") || "[]");
      const existingRequestIds = new Set(
        savedNotifications
          .filter((n: any) => n.type === "connection" && n.userId)
          .map((n: any) => n.userId)
      );

      
      connectionRequestsReceived.forEach((request: any) => {
        const userId = request.userId || request.id;
        if (!existingRequestIds.has(userId)) {
          const newNotification = {
            id: Date.now().toString() + "-" + userId,
            title: "New Connection Request",
            message: `${request.name || "Someone"} wants to connect with you`,
            type: "connection",
            isRead: false,
            timestamp: new Date().toISOString(),
            link: "/dashboard",
            userId: userId,
          };
          savedNotifications.unshift(newNotification);
          existingRequestIds.add(userId);
        }
      });

      
      const limitedNotifications = savedNotifications.slice(0, 50);
      localStorage.setItem("notifications", JSON.stringify(limitedNotifications));
      loadNotifications();
    };
    const handleChatsUpdate = () => {
      
      const savedChats = JSON.parse(localStorage.getItem("chats") || "[]");
      const savedNotifications = JSON.parse(localStorage.getItem("notifications") || "[]");
      const currentPath = window.location.pathname;
      const isOnChatPage = currentPath.startsWith("/chat/");
      const currentChatId = isOnChatPage ? currentPath.split("/chat/")[1] : null;

      
      savedChats.forEach((chat: any) => {
        if (chat.messages && chat.messages.length > 0) {
          const lastMessage = chat.messages[chat.messages.length - 1];
          
          
          
          
          
          if (
            !lastMessage.isOwn &&
            chat.id !== currentChatId &&
            !chat.isMuted &&
            !chat.isArchived &&
            chat.connectionStatus === "connected"
          ) {
            
            const recentNotification = savedNotifications.find(
              (n: any) =>
                n.type === "message" &&
                n.chatId === chat.id &&
                new Date(n.timestamp).getTime() >
                  new Date(lastMessage.timestamp).getTime() - 60000 
            );

            if (!recentNotification) {
              const messageText = typeof lastMessage.text === "string" ? lastMessage.text : "";
              const messagePreview = messageText.length > 50 
                ? messageText.substring(0, 50) + "..." 
                : messageText;
              const newNotification = {
                id: Date.now().toString() + "-msg-" + chat.id + "-" + (lastMessage.id || Date.now()),
                title: "New Message",
                message: `${chat.name}: ${messagePreview}`,
                type: "message",
                isRead: false,
                timestamp: new Date(lastMessage.timestamp).toISOString(),
                link: `/chat/${chat.id}`,
                chatId: chat.id,
              };
              savedNotifications.unshift(newNotification);
            }
          }
        }
      });

      
      const limitedNotifications = savedNotifications.slice(0, 50);
      localStorage.setItem("notifications", JSON.stringify(limitedNotifications));
      loadNotifications();
    };
    window.addEventListener("notificationsUpdated", handleNotificationUpdate);
    window.addEventListener("demoSyncUpdated", handleNotificationUpdate);
    window.addEventListener("connectionRequestsUpdated", handleConnectionUpdate);
    window.addEventListener("chatsUpdated", handleChatsUpdate);

    return () => {
      window.removeEventListener("notificationsUpdated", handleNotificationUpdate);
      window.removeEventListener("demoSyncUpdated", handleNotificationUpdate);
      window.removeEventListener("connectionRequestsUpdated", handleConnectionUpdate);
      window.removeEventListener("chatsUpdated", handleChatsUpdate);
    };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = (notification: Notification) => {
    if (getToken()) {
      markNotificationRead(notification.id).then(() => {
        window.dispatchEvent(new Event("notificationsUpdated"));
      });
      if (notification.link) {
        if (notification.link.startsWith("http")) {
          window.open(notification.link, "_blank");
        } else {
          navigate(notification.link);
        }
      }
      return;
    }

    if (user && isDemoUserId(user.id)) {
      markDemoNotificationRead(user.id, notification.id);
      const refreshed = getDemoNotifications(user.id).map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
      setNotifications(refreshed);
      window.dispatchEvent(new Event("notificationsUpdated"));
      if (notification.link) {
        if (notification.link.startsWith("http")) {
          window.open(notification.link, "_blank");
        } else {
          navigate(notification.link);
        }
      }
      return;
    }
    
    const updated = notifications.map((n) =>
      n.id === notification.id ? { ...n, isRead: true } : n
    );
    
    
    if (notification.type === "message" && notification.chatId) {
      const fullyUpdated = updated.map((n) =>
        n.type === "message" && n.chatId === notification.chatId
          ? { ...n, isRead: true }
          : n
      );
      setNotifications(fullyUpdated);
      localStorage.setItem("notifications", JSON.stringify(fullyUpdated));
    } else if (notification.type === "connection" && notification.userId) {
      
      const fullyUpdated = updated.map((n) =>
        n.type === "connection" && n.userId === notification.userId
          ? { ...n, isRead: true }
          : n
      );
      setNotifications(fullyUpdated);
      localStorage.setItem("notifications", JSON.stringify(fullyUpdated));
    } else {
      setNotifications(updated);
      localStorage.setItem("notifications", JSON.stringify(updated));
    }
    
    window.dispatchEvent(new Event("notificationsUpdated"));

    
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const markAllAsRead = () => {
    if (getToken()) {
      markAllNotificationsRead().then(() => {
        window.dispatchEvent(new Event("notificationsUpdated"));
      });
      return;
    }

    if (user && isDemoUserId(user.id)) {
      markAllDemoNotificationsRead(user.id);
      const refreshed = getDemoNotifications(user.id).map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
      setNotifications(refreshed);
      window.dispatchEvent(new Event("notificationsUpdated"));
      return;
    }

    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    localStorage.setItem("notifications", JSON.stringify(updated));
    window.dispatchEvent(new Event("notificationsUpdated"));
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Users, label: "People", path: "/home" },
    { icon: MessageSquare, label: "Chats", path: "/chat" },
    { icon: Video, label: "Reels", path: "/reels" },
    { icon: FileText, label: "Notes", path: "/notes" },
    { icon: Newspaper, label: "News & Blogs", path: "/news" },
    { icon: MessageCircle, label: "Group Discussion", path: "/groups" },
    { icon: Upload, label: "Upload", path: "/proofs/upload" },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    clearToken();
    logout();
    window.dispatchEvent(new Event("authChanged"));
    navigate("/auth/login");
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/home")}
              className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
              aria-label="Go to home"
            >
              <img src="/swapx-logo.svg" alt="SwapX" className="h-8" />
            </button>
          </div>

          {}
          <nav className="hidden md:flex items-center gap-2" role="navigation" aria-label="Main navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleNavigate(item.path)}
                  aria-label={item.label}
                  aria-current={isActive(item.path) ? "page" : undefined}
                >
                  <Icon className="h-4 w-4 mr-2" aria-hidden="true" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            {}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto" role="menu">
                <div className="flex items-center justify-between p-2 border-b">
                  <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={markAllAsRead}
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="py-1">
                    {notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`cursor-pointer ${!notification.isRead ? "bg-muted/50" : ""}`}
                        onClick={() => handleNotificationClick(notification)}
                        role="menuitem"
                      >
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{notification.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                  aria-label="User menu"
                >
                  <Avatar>
                    <AvatarImage
                      src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || "User"}`}
                      alt={user?.name || "User"}
                    />
                    <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" role="menu">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    
                    handleNavigate("/profile");
                  }}
                  role="menuitem"
                >
                  <User className="h-4 w-4 mr-2" aria-hidden="true" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigate("/my-notes")} role="menuitem">
                  <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                  Your Notes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigate("/saved-notes")} role="menuitem">
                  <Bookmark className="h-4 w-4 mr-2" aria-hidden="true" />
                  Saved Notes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigate("/community-leader")} role="menuitem">
                  <Trophy className="h-4 w-4 mr-2" aria-hidden="true" />
                  Leaderboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigate("/connection-settings")} role="menuitem">
                  <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                  Connection Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavigate("/faq")} role="menuitem">
                  <HelpCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                  FAQ
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigate("/about-us")} role="menuitem">
                  <Info className="h-4 w-4 mr-2" aria-hidden="true" />
                  About Us
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} role="menuitem">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open mobile menu"
                  aria-expanded={mobileMenuOpen}
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8" role="navigation" aria-label="Mobile navigation">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.path}
                        variant={isActive(item.path) ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => handleNavigate(item.path)}
                        aria-label={item.label}
                        aria-current={isActive(item.path) ? "page" : undefined}
                      >
                        <Icon className="h-4 w-4 mr-2" aria-hidden="true" />
                        {item.label}
                      </Button>
                    );
                  })}
                  <div className="border-t pt-4 mt-4">
                    <Button
                      variant="ghost"
                      className="w-full justify-start relative"
                      onClick={() => {
                        
                        
                        handleNavigate("/dashboard");
                      }}
                    >
                      <Bell className="h-4 w-4 mr-2" aria-hidden="true" />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        
                        handleNavigate("/profile");
                      }}
                    >
                      <User className="h-4 w-4 mr-2" aria-hidden="true" />
                      Profile
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleNavigate("/my-notes")}
                    >
                      <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                      Your Notes
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleNavigate("/saved-notes")}
                    >
                      <Bookmark className="h-4 w-4 mr-2" aria-hidden="true" />
                      Saved Notes
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleNavigate("/community-leader")}
                    >
                      <Trophy className="h-4 w-4 mr-2" aria-hidden="true" />
                      Leaderboard
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleNavigate("/connection-settings")}
                    >
                      <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                      Connection Settings
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleNavigate("/faq")}
                    >
                      <HelpCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                      FAQ
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleNavigate("/about-us")}
                    >
                      <Info className="h-4 w-4 mr-2" aria-hidden="true" />
                      About Us
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive"
                      onClick={handleLogout}
                    >
                      Sign out
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main role="main">{children}</main>
      <IncomingCallBanner />
    </div>
  );
};

export default Layout;

