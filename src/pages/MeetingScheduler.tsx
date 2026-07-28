import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar as CalendarIcon, Video, MapPin, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useAuthStore } from "@/stores/useAuthStore";
import { myConnections } from "@/lib/connections";
import { sendMessage } from "@/lib/chat";
import { getProfileById } from "@/lib/profile";
import { getToken } from "@/lib/api";
import { createMeeting, initiateCall } from "@/lib/social-api";

const MeetingScheduler = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { user: apiUser } = useAuthUser();
  const { user: authStoreUser } = useAuthStore();
  const [mode, setMode] = useState<"online" | "offline">("online");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("10:00");
  const [isScheduling, setIsScheduling] = useState(false);

  
  const getChatUserInfo = async () => {
    if (id && id !== "new") {
      
      if (apiUser || authStoreUser) {
        try {
          const profile = await getProfileById(id);
          if (profile) {
            return {
              id: profile.id,
              name: profile.full_name || profile.username || "User",
              avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name || profile.username || id}`,
            };
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
      
      
      const chatUsers: Record<string, { id: string; name: string; avatar: string }> = {
        "1": { id: "1", name: "Sarah Johnson", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
        "2": { id: "2", name: "Alex Chen", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" },
        "3": { id: "3", name: "Maya Patel", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya" },
        "4": { id: "4", name: "Jordan Taylor", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan" },
      };
      return chatUsers[id] || { id, name: "User", avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}` };
    }
    return null;
  };

  const [chatUser, setChatUser] = useState<{ id: string; name: string; avatar: string } | null>(null);
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  const [location, setLocation] = useState("");

  
  useEffect(() => {
    const loadChatUser = async () => {
      const user = await getChatUserInfo();
      setChatUser(user);
    };
    if (id && id !== "new") {
      loadChatUser();
    }
  }, [id, apiUser, authStoreUser]);

  const handleSchedule = async () => {
    if (!date) {
      toast.error("Please select a date");
      return;
    }

    if (!chatUser) {
      toast.error("Please select a user to schedule a meeting with");
      return;
    }
    
    setIsScheduling(true);
    
    const jitsiLink = mode === "online" ? `https://meet.jit.si/swapx-${Date.now()}` : null;
    const meetingDate = new Date(date);
    meetingDate.setHours(parseInt(time.split(":")[0]), parseInt(time.split(":")[1]), 0, 0);
    const attendeeName = chatUser.name;
    const currentUser = apiUser || authStoreUser;
    const currentUserName = apiUser?.name ||
                            authStoreUser?.name || 
                            "You";
    
    try {
      const currentUserId = apiUser?.id || authStoreUser?.id;
      const jitsiLink = mode === "online" ? `https://meet.jit.si/swapx-${Date.now()}` : null;

      if (currentUserId && chatUser.id && getToken()) {
        await createMeeting({
          to_user_id: chatUser.id,
          date: meetingDate.toISOString(),
          mode,
          location: mode === "offline" ? location : null,
          link: jitsiLink,
        });

        toast.success(
          mode === "online"
            ? `Meeting scheduled! ${chatUser.name} will see it on their dashboard.`
            : `Meeting scheduled! ${chatUser.name} will be notified.`
        );

        setTimeout(() => {
          navigate(`/chat/${chatUser.id}`);
        }, 1200);
        return;
      }

      const meetings = JSON.parse(localStorage.getItem("scheduledMeetings") || "[]");
      const meetingId = `meeting-${Date.now()}`;
      const newMeeting = {
        id: meetingId,
        userId: chatUser.id,
        userName: attendeeName,
        userAvatar: chatUser.avatar,
        scheduledBy: currentUser?.id || "current-user",
        scheduledByName: currentUserName,
        date: meetingDate.toISOString(),
        mode: mode,
        location: mode === "offline" ? location : null,
        link: jitsiLink,
        createdAt: new Date().toISOString(),
      };
      meetings.push(newMeeting);
      localStorage.setItem("scheduledMeetings", JSON.stringify(meetings));
      window.dispatchEvent(new Event("meetingsUpdated"));
      
      
      if (apiUser || authStoreUser) {
        try {
          
          const connections = await myConnections();
          const connection = connections.find(
            conn => (conn.user_id === (apiUser?.id || authStoreUser?.id) && conn.partner_id === chatUser.id) ||
                    (conn.partner_id === (apiUser?.id || authStoreUser?.id) && conn.user_id === chatUser.id)
          );
          
          if (connection && connection.status === "accepted") {
            
            const meetingMessage = mode === "online"
              ? `📅 Meeting scheduled for ${format(meetingDate, "MMM d, yyyy 'at' h:mm a")}\n\n${jitsiLink ? `Meeting Link: ${jitsiLink}` : "Online meeting via Jitsi"}`
              : `📅 Meeting scheduled for ${format(meetingDate, "MMM d, yyyy 'at' h:mm a")}\n\n📍 Location: ${location || "To be determined"}`;
            
            await sendMessage(connection.id, meetingMessage);
            console.log("Meeting message sent via Supabase");
          } else {
            
            const chats = JSON.parse(localStorage.getItem("chats") || "[]");
            let chat = chats.find((c: any) => c.id === chatUser.id);
            
            if (!chat) {
              
              chat = {
                id: chatUser.id,
                name: attendeeName,
                avatar: chatUser.avatar,
                lastMessage: "",
                lastMessageTime: format(new Date(), "h:mm a"),
                lastSeen: undefined,
                unreadCount: 0,
                isPinned: false,
                isMuted: false,
                isArchived: false,
                isTyping: false,
                connectionStatus: "not-connected",
                messages: [],
              };
              chats.push(chat);
            }
            
            const meetingMessage = mode === "online"
              ? `📅 Meeting scheduled for ${format(meetingDate, "MMM d, yyyy 'at' h:mm a")}\n\n${jitsiLink ? `Meeting Link: ${jitsiLink}` : "Online meeting via Jitsi"}`
              : `📅 Meeting scheduled for ${format(meetingDate, "MMM d, yyyy 'at' h:mm a")}\n\n📍 Location: ${location || "To be determined"}`;
            
            const newMessage = {
              id: Date.now().toString(),
              sender: "You",
              text: meetingMessage,
              time: format(new Date(), "h:mm a"),
              timestamp: new Date().toISOString(),
              isOwn: true,
              status: "sent",
            };
            
            chat.messages.push(newMessage);
            chat.lastMessage = meetingMessage;
            chat.lastMessageTime = format(new Date(), "h:mm a");
            
            localStorage.setItem("chats", JSON.stringify(chats));
            window.dispatchEvent(new Event("chatsUpdated"));
            console.log("Meeting message sent via localStorage");
          }
        } catch (chatError) {
          console.error("Error sending meeting message:", chatError);
          
        }
      }
      
      
      const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
      const newNotification = {
        id: Date.now().toString() + "-meeting",
        title: "Meeting Scheduled",
        message: `Meeting with ${attendeeName} scheduled for ${format(meetingDate, "MMM d, yyyy 'at' h:mm a")}`,
        type: "meeting",
        isRead: false,
        timestamp: new Date().toISOString(),
        link: mode === "online" && jitsiLink ? jitsiLink : `/meetings/${meetingId}`,
      };
      notifications.unshift(newNotification);
      
      
      const reminderTime = new Date(meetingDate.getTime() - 30 * 60 * 1000);
      if (reminderTime > new Date()) {
        const reminderNotification = {
          id: Date.now().toString() + "-reminder",
          title: "Meeting Reminder",
          message: `Your meeting with ${attendeeName} starts in 30 minutes`,
          type: "meeting",
          isRead: false,
          timestamp: reminderTime.toISOString(),
          link: mode === "online" && jitsiLink ? jitsiLink : `/meetings/${meetingId}`,
        };
        notifications.unshift(reminderNotification);
      }
      
      
      const limitedNotifications = notifications.slice(0, 50);
      localStorage.setItem("notifications", JSON.stringify(limitedNotifications));
      window.dispatchEvent(new Event("notificationsUpdated"));
      
      toast.success(mode === "online" 
        ? `Meeting scheduled! A message has been sent to ${attendeeName}. Link: ${jitsiLink}` 
        : `Meeting scheduled! A message has been sent to ${attendeeName}.`
      );
      
      
      setTimeout(() => {
        if (chatUser && id) {
          navigate(`/chat/${id}`);
        } else {
          navigate("/home");
        }
      }, 1500);
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      toast.error(error instanceof Error ? error.message : "Failed to schedule meeting");
    } finally {
      setIsScheduling(false);
    }
  };

  
  const handleEndScheduledMeeting = () => {
    if (!chatUser) {
      toast.error("Cannot end meeting: No attendee information");
      return;
    }
    
    const sessionId = `session-${Date.now()}`;
    const params = new URLSearchParams({
      attendeeId: chatUser.id,
      attendeeName: chatUser.name,
      attendeeAvatar: chatUser.avatar,
    });
    
    navigate(`/rate/${sessionId}?${params.toString()}`);
    toast.info("Meeting ended. Please rate your session partner.");
  };

  const handleStartNow = async () => {
    const jitsiLink = `https://meet.jit.si/swapx-${Date.now()}`;
    const currentUserId = apiUser?.id || authStoreUser?.id;

    if (currentUserId && chatUser && getToken()) {
      await initiateCall({
        to_user_id: chatUser.id,
        link: jitsiLink,
        type: "video",
      });
      setMeetingLink(jitsiLink);
      setIsMeetingActive(true);
      window.open(jitsiLink, "_blank");
      toast.success(`Calling ${chatUser.name}...`);
      return;
    }

    setMeetingLink(jitsiLink);
    setIsMeetingActive(true);
    window.open(jitsiLink, "_blank");
    toast.success("Opening video call...");
  };

  const handleEndMeeting = () => {
    if (!chatUser) {
      toast.error("Cannot end meeting: No attendee information");
      return;
    }
    
    
    const sessionId = `session-${Date.now()}`;
    
    
    const params = new URLSearchParams({
      attendeeId: chatUser.id,
      attendeeName: chatUser.name,
      attendeeAvatar: chatUser.avatar,
    });
    
    navigate(`/rate/${sessionId}?${params.toString()}`);
    toast.info("Meeting ended. Please rate your session partner.");
  };

  
  if (isMeetingActive && chatUser) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Meeting in Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-green-500 flex items-center justify-center">
                    <Video className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Meeting with {chatUser.name}</h3>
                  <p className="text-sm text-muted-foreground">Click the link below to join</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm font-medium">Meeting Link</p>
                <div className="flex items-center gap-2">
                  <Input 
                    value={meetingLink || ""} 
                    readOnly 
                    className="flex-1 font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (meetingLink) {
                        navigator.clipboard.writeText(meetingLink);
                        toast.success("Link copied!");
                      }
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (meetingLink) {
                      window.open(meetingLink, "_blank");
                    }
                  }}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Open Meeting in New Tab
                </Button>
              </div>

              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleEndMeeting}
                >
                  End Meeting & Rate Session
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  After ending the meeting, you'll be asked to rate {chatUser.name}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {chatUser ? `Schedule Meeting with ${chatUser.name}` : "Schedule a Meeting"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Meeting Mode</Label>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as "online" | "offline")}>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="online" id="online" />
                  <Label htmlFor="online" className="flex-1 cursor-pointer flex items-center gap-2">
                    <Video className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">Online Meeting</p>
                      <p className="text-sm text-muted-foreground">Video call via Jitsi</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="offline" id="offline" />
                  <Label htmlFor="offline" className="flex-1 cursor-pointer flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-secondary" />
                    <div>
                      <p className="font-medium">Offline Meeting</p>
                      <p className="text-sm text-muted-foreground">Meet in person</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    modifiersClassNames={{
                      selected: "rounded-full"
                    }}
                    classNames={{
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full",
                      day_today: "",
                    }}
                  />
                </PopoverContent>
              </Popover>
              {date && (
                <div className="text-sm text-muted-foreground">
                  Selected: <span className="font-medium text-foreground">{format(date, "EEEE, MMMM d, yyyy")}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="time">Select Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>

            {mode === "offline" && (
              <div className="space-y-3">
                <Label htmlFor="location">Meeting Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter address or place..."
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleStartNow}
                className="flex-1"
              >
                <Video className="h-4 w-4 mr-2" />
                Start Now
              </Button>
              <Button onClick={handleSchedule} className="flex-1" disabled={isScheduling}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                {isScheduling ? "Scheduling..." : "Schedule Meeting"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MeetingScheduler;
