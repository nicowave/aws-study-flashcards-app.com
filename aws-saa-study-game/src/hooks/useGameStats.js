import { useState, useEffect, useCallback } from 'react';
import { INITIAL_STATS, STORAGE_KEY, calculateLevel } from '../data/constants';
import { checkNewAchievements } from '../data/achievements';

export const useGameStats = () => {
  const [globalStats, setGlobalStats] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_STATS;
    } catch {
      return INITIAL_STATS;
    }
  });

  // Save stats to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(globalStats));
    } catch (e) {
      console.warn('Failed to save stats:', e);
    }
  }, [globalStats]);

  // Update stats after correct answer
  const recordCorrectAnswer = useCallback((responseTime, domainColor) => {
    const xpGained = responseTime < 5 ? 15 : responseTime < 10 ? 10 : 5;
    const isFastAnswer = responseTime < 5;

    setGlobalStats(prev => ({
      ...prev,
      totalCorrect: prev.totalCorrect + 1,
      totalAnswered: prev.totalAnswered + 1,
      currentStreak: prev.currentStreak + 1,
      maxStreak: Math.max(prev.maxStreak, prev.currentStreak + 1),
      fastAnswers: isFastAnswer ? prev.fastAnswers + 1 : prev.fastAnswers,
      xp: prev.xp + xpGained,
      level: calculateLevel(prev.xp + xpGained)
    }));

    return xpGained;
  }, []);

  // Update stats after incorrect answer
  const recordIncorrectAnswer = useCallback(() => {
    setGlobalStats(prev => ({
      ...prev,
      totalAnswered: prev.totalAnswered + 1,
      currentStreak: 0,
      xp: prev.xp + 2
    }));
  }, []);

  // Complete a session
  const completeSession = useCallback((domainId, correctCount, totalCount) => {
    const isPerfect = correctCount === totalCount;

    setGlobalStats(prev => {
      const domainProgress = { ...prev.domainProgress };
      
      if (!domainProgress[domainId]) {
        domainProgress[domainId] = { completed: 0, bestScore: 0 };
      }
      
      domainProgress[domainId].completed += 1;
      domainProgress[domainId].bestScore = Math.max(
        domainProgress[domainId].bestScore,
        correctCount / totalCount
      );

      const domainsCompleted = Object.keys(domainProgress).filter(
        d => domainProgress[d].completed > 0
      ).length;

      return {
        ...prev,
        perfectDomains: isPerfect ? prev.perfectDomains + 1 : prev.perfectDomains,
        domainsCompleted,
        domainProgress,
        totalSessions: prev.totalSessions + 1
      };
    });
  }, []);

  // Unlock achievement
  const unlockAchievement = useCallback((achievementId, xpReward) => {
    setGlobalStats(prev => ({
      ...prev,
      unlockedAchievements: [...prev.unlockedAchievements, achievementId],
      xp: prev.xp + xpReward,
      level: calculateLevel(prev.xp + xpReward)
    }));
  }, []);

  // Check for new achievements
  const getNewAchievements = useCallback(() => {
    return checkNewAchievements(globalStats, globalStats.unlockedAchievements);
  }, [globalStats]);

  // Merge cloud stats with local (take the higher value for each field)
  const mergeCloudStats = useCallback((cloudData) => {
    if (!cloudData) return;
    setGlobalStats(prev => {
      // Merge domain progress (take best scores and max completions)
      const mergedDomainProgress = { ...prev.domainProgress };
      const cloudDomainProgress = cloudData.domainProgress || {};
      for (const domainId of Object.keys(cloudDomainProgress)) {
        if (!mergedDomainProgress[domainId]) {
          mergedDomainProgress[domainId] = { ...cloudDomainProgress[domainId] };
        } else {
          mergedDomainProgress[domainId] = {
            completed: Math.max(mergedDomainProgress[domainId].completed || 0, cloudDomainProgress[domainId].completed || 0),
            bestScore: Math.max(mergedDomainProgress[domainId].bestScore || 0, cloudDomainProgress[domainId].bestScore || 0)
          };
        }
      }

      // Merge unlocked achievements (union of both sets)
      const localAchievements = prev.unlockedAchievements || [];
      const cloudAchievements = cloudData.unlockedAchievements || [];
      const mergedAchievements = [...new Set([...localAchievements, ...cloudAchievements])];

      const mergedXp = Math.max(prev.xp || 0, cloudData.xp || 0);

      return {
        ...prev,
        totalAnswered: Math.max(prev.totalAnswered, cloudData.totalAnswered || 0),
        totalCorrect: Math.max(prev.totalCorrect, cloudData.totalCorrect || 0),
        maxStreak: Math.max(prev.maxStreak, cloudData.maxStreak || 0),
        perfectDomains: Math.max(prev.perfectDomains, cloudData.perfectDomains || 0),
        domainsCompleted: Math.max(prev.domainsCompleted, cloudData.domainsCompleted || 0),
        fastAnswers: Math.max(prev.fastAnswers, cloudData.fastAnswers || 0),
        totalSessions: Math.max(prev.totalSessions, cloudData.totalSessions || 0),
        xp: mergedXp,
        level: calculateLevel(mergedXp),
        domainProgress: mergedDomainProgress,
        unlockedAchievements: mergedAchievements
      };
    });
  }, []);

  // Reset all stats
  const resetStats = useCallback(() => {
    setGlobalStats(INITIAL_STATS);
  }, []);

  return {
    globalStats,
    recordCorrectAnswer,
    recordIncorrectAnswer,
    completeSession,
    unlockAchievement,
    getNewAchievements,
    resetStats,
    mergeCloudStats
  };
};

export default useGameStats;
