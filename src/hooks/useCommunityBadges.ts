import { useCallback, useEffect, useState } from "react";
import { useAppAuth } from "@/hooks/useAppAuth";
import { useProfileStore } from "@/stores/useProfileStore";
import {
  BADGE_SYNC_EVENTS,
  collectCommunityMetrics,
  evaluateBadges,
  EvaluatedBadge,
  CommunityMetrics,
  getLeaderTitle,
} from "@/lib/community-badges";

interface UseCommunityBadgesResult {
  badges: EvaluatedBadge[];
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

export function useCommunityBadges(): UseCommunityBadgesResult {
  const { user } = useAppAuth();
  const { getProfile } = useProfileStore();
  const [badges, setBadges] = useState<EvaluatedBadge[]>([]);
  const [metrics, setMetrics] = useState<CommunityMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const localProfile = user ? getProfile(user.id) : null;
      const nextMetrics = await collectCommunityMetrics(user?.id, {
        name: localProfile?.name ?? user?.name,
        avatar: localProfile?.avatar ?? user?.avatar,
        skills: localProfile?.skills,
        skillsToLearn: localProfile?.skillsToLearn,
        bio: localProfile?.bio,
        occupation: localProfile?.occupation,
      });
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

  return {
    badges,
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
