import { useCallback, useEffect, useState } from "react";
import { useAppAuth } from "@/hooks/useAppAuth";
import { useProfileStore } from "@/stores/useProfileStore";
import {
  BADGE_SYNC_EVENTS,
  collectCommunityMetrics,
  evaluateBadges,
  EvaluatedBadge,
  CommunityMetrics,
  fetchLeaderboard,
  getLeaderTitle,
  LeaderboardEntry,
} from "@/lib/community-badges";

interface UseCommunityLeaderboardResult {
  leaderboard: LeaderboardEntry[];
  currentUserEntry: LeaderboardEntry | null;
  earnedBadges: EvaluatedBadge[];
  lockedBadges: EvaluatedBadge[];
  metrics: CommunityMetrics | null;
  earnedCount: number;
  totalBadges: number;
  totalPoints: number;
  leaderTitle: string;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useCommunityLeaderboard(): UseCommunityLeaderboardResult {
  const { user } = useAppAuth();
  const { getProfile } = useProfileStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [badges, setBadges] = useState<EvaluatedBadge[]>([]);
  const [metrics, setMetrics] = useState<CommunityMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const localProfile = user ? getProfile(user.id) : null;
      const profileData = {
        name: localProfile?.name ?? user?.name,
        avatar: localProfile?.avatar ?? user?.avatar,
        skills: localProfile?.skills,
        skillsToLearn: localProfile?.skillsToLearn,
        bio: localProfile?.bio,
        occupation: localProfile?.occupation,
      };

      const [nextLeaderboard, nextMetrics] = await Promise.all([
        fetchLeaderboard(
          user ? { id: user.id, name: user.name, avatar: user.avatar } : undefined,
          profileData
        ),
        collectCommunityMetrics(user?.id, profileData),
      ]);

      setLeaderboard(nextLeaderboard);
      setMetrics(nextMetrics);
      setBadges(evaluateBadges(nextMetrics));
    } finally {
      setLoading(false);
    }
  }, [user, getProfile]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handleSync = () => {
      refresh();
    };

    BADGE_SYNC_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleSync);
    });

    return () => {
      BADGE_SYNC_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleSync);
      });
    };
  }, [refresh]);

  const earnedBadges = badges.filter((badge) => badge.earned);
  const lockedBadges = badges.filter((badge) => !badge.earned);
  const totalPoints = earnedBadges.reduce((sum, badge) => sum + badge.points, 0);
  const currentUserEntry =
    leaderboard.find((entry) => entry.isCurrentUser) ?? null;

  return {
    leaderboard,
    currentUserEntry,
    earnedBadges,
    lockedBadges,
    metrics,
    earnedCount: earnedBadges.length,
    totalBadges: badges.length,
    totalPoints,
    leaderTitle: getLeaderTitle(earnedBadges.length, totalPoints),
    loading,
    refresh,
  };
}
