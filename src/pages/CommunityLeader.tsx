import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCommunityLeaderboard } from "@/hooks/useCommunityLeaderboard";
import {
  Award,
  Crown,
  Loader2,
  Lock,
  Medal,
  Star,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const rankStyles: Record<number, string> = {
  1: "border-yellow-400/50 bg-yellow-500/10",
  2: "border-slate-300/50 bg-slate-400/10",
  3: "border-amber-700/40 bg-amber-700/10",
};

const CommunityLeader = () => {
  const navigate = useNavigate();
  const {
    leaderboard,
    currentUserEntry,
    earnedBadges,
    lockedBadges,
    earnedCount,
    totalBadges,
    loading,
  } = useCommunityLeaderboard();

  const topThree = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);

  const renderRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-semibold text-muted-foreground w-5 text-center">#{rank}</span>;
  };

  const renderLeaderRow = (entry: (typeof leaderboard)[number]) => (
    <div
      key={entry.id}
      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
        entry.isCurrentUser
          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
          : "hover:bg-muted/40"
      }`}
    >
      <div className="w-8 flex justify-center">{renderRankIcon(entry.rank)}</div>
      <Avatar className="h-11 w-11 border">
        <AvatarImage src={entry.avatar} alt={entry.name} />
        <AvatarFallback>{entry.name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold truncate">{entry.name}</p>
          {entry.isCurrentUser && <Badge variant="secondary">You</Badge>}
        </div>
        <p className="text-sm text-muted-foreground truncate">{entry.title}</p>
      </div>
      <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
        <Star className="h-3.5 w-3.5" />
        {entry.rating > 0 ? entry.rating.toFixed(1) : "—"}
      </div>
      <div className="hidden md:block text-sm text-muted-foreground">
        {entry.badgesEarned} badges
      </div>
      <div className="text-right min-w-[72px]">
        <p className="font-bold text-primary">{entry.points}</p>
        <p className="text-xs text-muted-foreground">points</p>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-7 w-7 text-primary" />
                <h1 className="text-3xl font-bold">Community Leaderboard</h1>
              </div>
              <p className="text-muted-foreground max-w-2xl">
                Rankings are based on badge points earned from real activity — sessions,
                connections, proofs, notes, chats, and profile progress.
              </p>
            </div>
            {currentUserEntry && (
              <Card className="md:min-w-[280px] border-primary/20 bg-[image:var(--gradient-glow)]">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Your rank</p>
                  <p className="text-2xl font-bold">#{currentUserEntry.rank}</p>
                  <p className="text-sm mt-1">
                    {currentUserEntry.points} pts · {currentUserEntry.title}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="leaderboard" className="space-y-6">
            <TabsList>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="badges">
                My Badges ({earnedCount}/{totalBadges})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leaderboard" className="space-y-6">
              {topThree.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topThree.map((entry) => (
                    <Card
                      key={entry.id}
                      className={`${rankStyles[entry.rank] ?? ""} ${
                        entry.isCurrentUser ? "ring-2 ring-primary/30" : ""
                      }`}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="flex justify-center mb-3">
                          {renderRankIcon(entry.rank)}
                        </div>
                        <Avatar className="h-16 w-16 mx-auto mb-3 border-2 border-background">
                          <AvatarImage src={entry.avatar} alt={entry.name} />
                          <AvatarFallback>{entry.name[0]}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-lg">{entry.name}</p>
                        {entry.isCurrentUser && (
                          <Badge variant="secondary" className="mt-1">
                            You
                          </Badge>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">{entry.title}</p>
                        <p className="text-3xl font-bold text-primary mt-3">{entry.points}</p>
                        <p className="text-xs text-muted-foreground">leaderboard points</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Full Rankings
                  </CardTitle>
                  <CardDescription>
                    {leaderboard.length} community members ranked by badge points
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {leaderboard.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No leaderboard data yet. Start learning to appear on the board.
                    </p>
                  ) : (
                    restOfLeaderboard.map((entry) => renderLeaderRow(entry))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="badges" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Earned Badges
                    </CardTitle>
                    <CardDescription>{earnedBadges.length} unlocked</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {earnedBadges.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">
                          No badges yet. Climb the leaderboard by staying active.
                        </p>
                        <Button onClick={() => navigate("/home")}>Find People</Button>
                      </div>
                    ) : (
                      earnedBadges.map((badge) => (
                        <div
                          key={badge.id}
                          className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3"
                        >
                          <span className="text-2xl">{badge.emoji}</span>
                          <div className="flex-1">
                            <p className="font-medium">{badge.name}</p>
                            <p className="text-xs text-muted-foreground">{badge.description}</p>
                          </div>
                          <Badge>{badge.points} pts</Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                      Not Yet Earned
                    </CardTitle>
                    <CardDescription>{lockedBadges.length} still locked</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[520px] overflow-y-auto">
                    {lockedBadges.map((badge) => (
                      <div key={badge.id} className="rounded-lg border p-3">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl grayscale opacity-60">{badge.emoji}</span>
                          <div className="flex-1">
                            <p className="font-medium">{badge.name}</p>
                            <p className="text-xs text-muted-foreground">{badge.requirement}</p>
                          </div>
                        </div>
                        <Progress value={badge.progressPercent} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {badge.progressCurrent}/{badge.progressTarget} · {badge.progressPercent}% complete
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default CommunityLeader;
