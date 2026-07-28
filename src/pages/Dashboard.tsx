import { useState, useEffect } from "react";
import { Star, Users, Award, TrendingUp, Calendar, Clock, UserPlus, UserCheck, UserX, Video, MapPin, Check, X, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { useCommunityBadges } from "@/hooks/useCommunityBadges";
import { useAuthStore } from "@/stores/useAuthStore";
import { getToken } from "@/lib/api";
import { acceptConnection, myConnections, rejectConnection } from "@/lib/connections";
import { getMeetings } from "@/lib/social-api";
import { getProfileById } from "@/lib/profile";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { earnedBadges, earnedCount, totalBadges, leaderTitle } = useCommunityBadges();
  const stats = [
    { label: "Total Sessions", value: "24", icon: Users, color: "text-primary" },
    { label: "Average Rating", value: "4.8", icon: Star, color: "text-accent" },
    { label: "Trust Score", value: "92", icon: TrendingUp, color: "text-secondary" },
  ];

  const [connections, setConnections] = useState<
    Array<{ id: string; name: string; avatar: string; skill: string; lastMessage: string }>
  >([]);

  
  const [scheduledMeetings, setScheduledMeetings] = useState<
    Array<{
      id: string;
      attendeeId: string;
      attendeeName: string;
      attendeeAvatar: string;
      date: Date;
      time: string;
      mode: "online" | "offline";
      location: string | null;
      link: string | null;
    }>
  >([]);

  
  const [connectionRequestsReceived, setConnectionRequestsReceived] = useState<any[]>([]);
  const [connectionRequestsSent, setConnectionRequestsSent] = useState<any[]>([]);

  const loadApiData = async () => {
    if (!user || !getToken()) return;

    try {
      const allConnections = await myConnections();
      const received: any[] = [];
      const sent: any[] = [];
      const accepted: typeof connections = [];

      for (const conn of allConnections) {
        const partnerId = conn.user_id === user.id ? conn.partner_id : conn.user_id;
        const profile = await getProfileById(partnerId);

        const view = {
          id: String(conn.id),
          userId: partnerId,
          name: profile?.full_name || profile?.username || "User",
          avatar:
            profile?.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerId}`,
          skill: conn.skill || profile?.skills?.[0] || "Skill Swap",
          message: conn.message,
          sentAt: conn.created_at,
          status: conn.status,
        };

        if (conn.status === "pending" && conn.partner_id === user.id) {
          received.push(view);
        } else if (conn.status === "pending" && conn.user_id === user.id) {
          sent.push(view);
        } else if (conn.status === "accepted") {
          accepted.push({
            id: partnerId,
            name: view.name,
            avatar: view.avatar,
            skill: view.skill,
            lastMessage: "Connected on SwapX",
          });
        }
      }

      setConnectionRequestsReceived(received);
      setConnectionRequestsSent(sent);
      setConnections(accepted);

      const meetings = await getMeetings();
      setScheduledMeetings(
        meetings
          .filter((meeting) => new Date(meeting.date) >= new Date())
          .map((meeting) => {
            const meetingDate = new Date(meeting.date);
            const attendeeId =
              meeting.from_user_id === user.id ? meeting.to_user_id : meeting.from_user_id;
            return {
              id: meeting.id,
              attendeeId,
              attendeeName: "User",
              attendeeAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${attendeeId}`,
              date: meetingDate,
              time: format(meetingDate, "HH:mm"),
              mode: meeting.mode,
              location: meeting.location,
              link: meeting.link,
            };
          })
      );
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  useEffect(() => {
    if (!user) return;

    if (getToken()) {
      loadApiData();
      return;
    }

    const savedReceived = localStorage.getItem("connectionRequestsReceived");
    const savedSent = localStorage.getItem("connectionRequestsSent");

    if (savedReceived) {
      try {
        const parsed = JSON.parse(savedReceived);
        setConnectionRequestsReceived(
          parsed.map((r: any) => ({
            ...r,
            sentAt: new Date(r.sentAt),
          }))
        );
      } catch {
        setConnectionRequestsReceived([]);
      }
    }

    if (savedSent) {
      try {
        const parsed = JSON.parse(savedSent);
        setConnectionRequestsSent(
          parsed.map((r: any) => ({
            ...r,
            sentAt: new Date(r.sentAt),
            status: r.status || "pending",
          }))
        );
      } catch {
        setConnectionRequestsSent([]);
      }
    }
  }, [user]);

  
  useEffect(() => {
    const handleUpdate = () => {
      if (user && getToken()) {
        loadApiData();
        return;
      }

      const savedReceived = localStorage.getItem("connectionRequestsReceived");
      const savedSent = localStorage.getItem("connectionRequestsSent");
      
      if (savedReceived) {
        try {
          const parsed = JSON.parse(savedReceived);
          setConnectionRequestsReceived(
            parsed.map((r: any) => ({
              ...r,
              sentAt: new Date(r.sentAt),
            }))
          );
        } catch {}
      }
      
      if (savedSent) {
        try {
          const parsed = JSON.parse(savedSent);
          setConnectionRequestsSent(
            parsed.map((r: any) => ({
              ...r,
              sentAt: new Date(r.sentAt),
              status: r.status || "pending",
            }))
          );
        } catch {}
      }
    };

    window.addEventListener("connectionRequestsUpdated", handleUpdate);
    window.addEventListener("demoSyncUpdated", handleUpdate);
    window.addEventListener("meetingsUpdated", handleUpdate);
    return () => {
      window.removeEventListener("connectionRequestsUpdated", handleUpdate);
      window.removeEventListener("demoSyncUpdated", handleUpdate);
      window.removeEventListener("meetingsUpdated", handleUpdate);
    };
  }, [user]);

  const handleAcceptConnection = async (requestId: string) => {
    if (user && getToken()) {
      try {
        await acceptConnection(Number(requestId));
        await loadApiData();
        const request = connectionRequestsReceived.find((item) => item.id === requestId);
        toast.success(`Connection accepted! You can now chat with ${request?.name ?? "user"}`);
        if (request?.userId) navigate(`/chat/${request.userId}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to accept connection");
      }
      return;
    }

    const request = connectionRequestsReceived.find(r => r.id === requestId);
    if (request) {
      
      const updatedReceived = connectionRequestsReceived.filter(r => r.id !== requestId);
      setConnectionRequestsReceived(updatedReceived);
      localStorage.setItem("connectionRequestsReceived", JSON.stringify(updatedReceived));

      
      const connections = JSON.parse(localStorage.getItem("connections") || "[]");
      if (!connections.includes(request.userId)) {
        connections.push(request.userId);
        localStorage.setItem("connections", JSON.stringify(connections));
      }

      
      const connectionRequestsSent = JSON.parse(localStorage.getItem("connectionRequestsSent") || "[]");
      const updatedSent = connectionRequestsSent.map((r: any) =>
        r.userId === request.userId ? { ...r, status: "accepted" } : r
      );
      localStorage.setItem("connectionRequestsSent", JSON.stringify(updatedSent));

      
      const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
      const newNotification = {
        id: Date.now().toString(),
        title: "Connection Accepted",
        message: `You are now connected with ${request.name}`,
        type: "connection",
        isRead: false,
        timestamp: new Date().toISOString(),
        link: `/chat/${request.userId}`,
        userId: request.userId,
      };
      
      
      const updatedNotifications = notifications.map((n: any) =>
        n.type === "connection" && (n.userId === request.userId || n.message?.includes(request.name))
          ? { ...n, isRead: true }
          : n
      );
      updatedNotifications.unshift(newNotification);
      const limitedNotifications = updatedNotifications.slice(0, 50);
      localStorage.setItem("notifications", JSON.stringify(limitedNotifications));

      
      window.dispatchEvent(new Event("connectionRequestsUpdated"));
      window.dispatchEvent(new Event("chatsUpdated"));
      window.dispatchEvent(new Event("notificationsUpdated"));

      toast.success(`Connection accepted! You can now chat with ${request.name}`);
      navigate(`/chat/${request.userId}`);
    }
  };

  const handleRejectConnection = async (requestId: string) => {
    if (user && getToken()) {
      try {
        await rejectConnection(Number(requestId));
        await loadApiData();
        toast.info("Connection request declined");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to decline connection");
      }
      return;
    }

    const request = connectionRequestsReceived.find(r => r.id === requestId);
    if (request) {
      
      const updatedReceived = connectionRequestsReceived.filter(r => r.id !== requestId);
      setConnectionRequestsReceived(updatedReceived);
      localStorage.setItem("connectionRequestsReceived", JSON.stringify(updatedReceived));

      
      const connectionRequestsSent = JSON.parse(localStorage.getItem("connectionRequestsSent") || "[]");
      const updatedSent = connectionRequestsSent.map((r: any) =>
        r.userId === request.userId ? { ...r, status: "rejected" } : r
      );
      localStorage.setItem("connectionRequestsSent", JSON.stringify(updatedSent));

      
      const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
      const updatedNotifications = notifications.map((n: any) =>
        n.type === "connection" && (n.userId === request.userId || n.message?.includes(request.name))
          ? { ...n, isRead: true }
          : n
      );
      localStorage.setItem("notifications", JSON.stringify(updatedNotifications));

      
      window.dispatchEvent(new Event("connectionRequestsUpdated"));
      window.dispatchEvent(new Event("chatsUpdated"));
      window.dispatchEvent(new Event("notificationsUpdated"));

      toast.info(`Connection request from ${request.name} declined`);
    }
  };

  const handleCancelConnectionRequest = (requestId: string) => {
    if (user && getToken()) {
      rejectConnection(Number(requestId))
        .then(() => loadApiData())
        .then(() => toast.info("Connection request cancelled"))
        .catch((error) =>
          toast.error(error instanceof Error ? error.message : "Failed to cancel request")
        );
      return;
    }

    const request = connectionRequestsSent.find(r => r.id === requestId);
    if (request) {
      
      const updatedSent = connectionRequestsSent.filter(r => r.id !== requestId);
      setConnectionRequestsSent(updatedSent);
      localStorage.setItem("connectionRequestsSent", JSON.stringify(updatedSent));

      
      const connectionRequestsReceived = JSON.parse(localStorage.getItem("connectionRequestsReceived") || "[]");
      const updatedReceived = connectionRequestsReceived.filter((r: any) => r.userId !== request.userId);
      localStorage.setItem("connectionRequestsReceived", JSON.stringify(updatedReceived));

      
      window.dispatchEvent(new Event("connectionRequestsUpdated"));
      window.dispatchEvent(new Event("chatsUpdated"));

      toast.info(`Connection request to ${request.name} cancelled`);
    }
  };

  const handleJoinMeeting = (meeting: typeof scheduledMeetings[0]) => {
    if (meeting.mode === "online" && meeting.link) {
      window.open(meeting.link, "_blank");
      toast.success("Opening meeting...");
    } else {
      navigate(`/meeting/${meeting.attendeeId}`);
    }
  };

  const handleCancelMeeting = (meetingId: string) => {
    const meeting = scheduledMeetings.find(m => m.id === meetingId);
    if (meeting) {
      setScheduledMeetings(prev => prev.filter(m => m.id !== meetingId));
      toast.success(`Meeting with ${meeting.attendeeName} cancelled`);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Home</h1>
          <p className="text-muted-foreground">Track your learning journey</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Badges Earned
              </CardTitle>
              <CardDescription>
                {earnedCount} of {totalBadges} earned · {leaderTitle}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/community-leader")}>
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            {earnedBadges.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="mb-3">No badges yet. Start connecting and learning to earn your first badge.</p>
                <Button onClick={() => navigate("/community-leader")}>Explore Badges</Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                {earnedBadges.slice(0, 5).map((badge) => (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => navigate("/community-leader")}
                    className="flex flex-col items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="text-4xl mb-2">{badge.emoji}</div>
                    <p className="text-xs text-center font-medium">{badge.name}</p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-4 w-4 text-primary" />
                Connection Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Tabs defaultValue="received" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-9">
                  <TabsTrigger value="received" className="flex items-center gap-1.5 text-xs">
                    <UserPlus className="h-3.5 w-3.5" />
                    Received
                    {connectionRequestsReceived.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-xs">
                        {connectionRequestsReceived.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="sent" className="flex items-center gap-1.5 text-xs">
                    <UserCheck className="h-3.5 w-3.5" />
                    Sent
                    {connectionRequestsSent.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-xs">
                        {connectionRequestsSent.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {}
                <TabsContent value="received" className="space-y-2 mt-3">
                  {connectionRequestsReceived.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No pending connection requests</p>
                    </div>
                  ) : (
                    connectionRequestsReceived.map((request) => (
                      <div key={request.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2.5 mb-2">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={request.avatar} alt={request.name} />
                            <AvatarFallback className="text-xs">{request.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{request.name}</p>
                            <p className="text-xs text-muted-foreground">Wants to learn: {request.skill}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{request.message}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={() => handleAcceptConnection(request.id)}
                          >
                            <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-8 text-xs"
                            onClick={() => handleRejectConnection(request.id)}
                          >
                            <UserX className="h-3.5 w-3.5 mr-1.5" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                {}
                <TabsContent value="sent" className="space-y-2 mt-3">
                  {connectionRequestsSent.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No pending requests</p>
                    </div>
                  ) : (
                    connectionRequestsSent.map((request) => (
                      <div key={request.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2.5 mb-2">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={request.avatar} alt={request.name} />
                            <AvatarFallback className="text-xs">{request.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="font-medium text-sm">{request.name}</p>
                              {request.status === "pending" && (
                                <Badge variant="outline" className="text-xs h-4 px-1.5">
                                  <Clock className="h-2.5 w-2.5 mr-1" />
                                  Pending
                                </Badge>
                              )}
                              {request.status === "accepted" && (
                                <Badge variant="default" className="text-xs h-4 px-1.5 bg-green-500">
                                  <Check className="h-2.5 w-2.5 mr-1" />
                                  Accepted
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">Wants to learn: {request.skill}</p>
                          </div>
                        </div>
                        {request.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full h-8 text-xs"
                            onClick={() => handleCancelConnectionRequest(request.id)}
                          >
                            <X className="h-3.5 w-3.5 mr-1.5" />
                            Cancel Request
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader>
              <CardTitle>Active Connections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {connections.map((connection) => (
                <div key={connection.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={connection.avatar} alt={connection.name} />
                      <AvatarFallback>{connection.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{connection.name}</p>
                      <p className="text-sm text-muted-foreground">{connection.lastMessage}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/chat/${connection.id}`)}>
                      Chat
                    </Button>
                    <Button size="sm" onClick={() => navigate(`/meeting/${connection.id}`)}>
                      Schedule
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {}
        <Card className="mb-6">
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Scheduled Meetings
              {scheduledMeetings.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {scheduledMeetings.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Your upcoming sessions
            </CardDescription>
            </CardHeader>
            <CardContent>
            {scheduledMeetings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No scheduled meetings</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/home")}
                >
                  Find Someone to Meet
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledMeetings.map((meeting) => (
                  <div key={meeting.id} className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={meeting.attendeeAvatar} alt={meeting.attendeeName} />
                        <AvatarFallback>{meeting.attendeeName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-lg">{meeting.attendeeName}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(meeting.date, "MMM d, yyyy")}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {meeting.time}
                              </div>
                              <div className="flex items-center gap-1">
                                {meeting.mode === "online" ? (
                                  <>
                                    <Video className="h-4 w-4" />
                                    <span>Online</span>
                                  </>
                                ) : (
                                  <>
                                    <MapPin className="h-4 w-4" />
                                    <span>{meeting.location}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {meeting.mode === "online" && meeting.link && (
                            <Button
                              size="sm"
                              onClick={() => handleJoinMeeting(meeting)}
                            >
                              <Video className="h-4 w-4 mr-2" />
                              Join Meeting
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/chat/${meeting.attendeeId}`)}
                          >
                            Chat
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelMeeting(meeting.id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </CardContent>
          </Card>

        </div>
    </Layout>
  );
};

export default Dashboard;
