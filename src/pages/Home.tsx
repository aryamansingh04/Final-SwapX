import { useState, useEffect } from "react";
import { Search, Filter, X, Calendar, Video, MapPin, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfileCard from "@/components/ProfileCard";
import ProfileModal from "@/components/ProfileModal";
import Layout from "@/components/Layout";
import { mockUsers } from "@/data/mockUsers";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  demoAccountToExploreUser,
  getOtherDemoAccounts,
  isDemoUserId,
} from "@/lib/demo-accounts";
import { getDemoMeetingsForUser } from "@/lib/demo-sync";
import { format, isToday, isTomorrow, isPast, isFuture } from "date-fns";
import { useNavigate } from "react-router-dom";

interface ScheduledMeeting {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  scheduledBy: string;
  scheduledByName: string;
  date: string;
  mode: "online" | "offline";
  location: string | null;
  link: string | null;
  createdAt: string;
}

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [minTrustScore, setMinTrustScore] = useState<number>(0);
  const [scheduledMeetings, setScheduledMeetings] = useState<ScheduledMeeting[]>([]);

  
  const demoUsers = user && isDemoUserId(user.id)
    ? getOtherDemoAccounts(user.id).map(demoAccountToExploreUser)
    : [];

  const allUsers = [...demoUsers, ...mockUsers.filter((mockUser) => !demoUsers.some((demo) => demo.id === mockUser.id))];

  const allSkills = Array.from(
    new Set(allUsers.flatMap((profile) => profile.skillsKnown))
  ).sort();

  const filteredUsers = allUsers.filter(user => {
    
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.skillsKnown.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
      user.skillsToLearn.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

    
    const matchesSkills = selectedSkills.length === 0 || 
      selectedSkills.some(skill => user.skillsKnown.includes(skill));

    
    const matchesTrustScore = user.trustScore >= minTrustScore;

    return matchesSearch && matchesSkills && matchesTrustScore;
  });

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const clearFilters = () => {
    setSelectedSkills([]);
    setMinTrustScore(0);
  };

  const activeFilterCount = selectedSkills.length + (minTrustScore > 0 ? 1 : 0);

  
  useEffect(() => {
    const loadMeetings = () => {
      if (user && isDemoUserId(user.id)) {
        const meetings = getDemoMeetingsForUser(user.id).map((meeting) => ({
          id: meeting.id,
          userId: meeting.fromUserId === user.id ? meeting.toUserId : meeting.fromUserId,
          userName: meeting.fromUserId === user.id ? meeting.toName : meeting.fromName,
          userAvatar: meeting.fromUserId === user.id ? meeting.toAvatar : meeting.fromAvatar,
          scheduledBy: meeting.fromUserId,
          scheduledByName: meeting.fromName,
          date: meeting.date,
          mode: meeting.mode,
          location: meeting.location,
          link: meeting.link,
          createdAt: meeting.createdAt,
        }));
        setScheduledMeetings(meetings);
        return;
      }

      const meetings = JSON.parse(localStorage.getItem("scheduledMeetings") || "[]");
      
      const now = new Date();
      const upcomingMeetings = meetings.filter((meeting: ScheduledMeeting) => {
        const meetingDate = new Date(meeting.date);
        return meetingDate >= now;
      });
      
      upcomingMeetings.sort((a: ScheduledMeeting, b: ScheduledMeeting) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      setScheduledMeetings(upcomingMeetings);
    };

    loadMeetings();
    
    
    const handleMeetingsUpdate = () => {
      loadMeetings();
    };
    window.addEventListener("meetingsUpdated", handleMeetingsUpdate);
    
    return () => {
      window.removeEventListener("meetingsUpdated", handleMeetingsUpdate);
    };
  }, [user]);

  const formatMeetingDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `Today at ${format(date, "h:mm a")}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, yyyy 'at' h:mm a");
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="container mx-auto px-4 py-6 flex-shrink-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-4">People</h1>
            
            {}
            {scheduledMeetings.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Meetings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scheduledMeetings.slice(0, 5).map((meeting) => {
                      const meetingDate = new Date(meeting.date);
                      const isUpcoming = isFuture(meetingDate);
                      
                      return (
                        <div
                          key={meeting.id}
                          className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/chat/${meeting.userId}`)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={meeting.userAvatar} alt={meeting.userName} />
                            <AvatarFallback>{meeting.userName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm">{meeting.userName}</p>
                              <Badge variant={isUpcoming ? "default" : "secondary"} className="text-xs">
                                {meeting.mode === "online" ? (
                                  <Video className="h-3 w-3 mr-1" />
                                ) : (
                                  <MapPin className="h-3 w-3 mr-1" />
                                )}
                                {meeting.mode === "online" ? "Online" : "Offline"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatMeetingDate(meeting.date)}</span>
                              {meeting.mode === "offline" && meeting.location && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{meeting.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/chat/${meeting.userId}`);
                            }}
                          >
                            View Chat
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  {scheduledMeetings.length > 5 && (
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      +{scheduledMeetings.length - 5} more meetings
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
            
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or skill..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className={`relative ${activeFilterCount > 0 ? 'border-primary' : ''}`}
                  >
                    <Filter className="h-4 w-4" />
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Filters</h3>
                      {activeFilterCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="h-8 text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Skills</Label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {allSkills.map(skill => (
                            <div key={skill} className="flex items-center space-x-2">
                              <Checkbox
                                id={`skill-${skill}`}
                                checked={selectedSkills.includes(skill)}
                                onCheckedChange={() => handleSkillToggle(skill)}
                              />
                              <label
                                htmlFor={`skill-${skill}`}
                                className="text-sm font-normal cursor-pointer flex-1"
                              >
                                {skill}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Minimum Trust Score: {minTrustScore.toFixed(1)}
                        </Label>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.1"
                          value={minTrustScore}
                          onChange={(e) => setMinTrustScore(parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0</span>
                          <span>5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <ProfileCard
                    key={user.id}
                    user={user}
                    onViewProfile={() => setSelectedUser(user)}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <p className="text-lg">No users found matching your criteria.</p>
                  <p className="text-sm mt-2">Try adjusting your search or filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <ProfileModal
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      </div>
    </Layout>
  );
};

export default Home;
