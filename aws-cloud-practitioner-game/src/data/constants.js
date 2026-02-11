export const INITIAL_STATS = {
  totalAnswered: 0,
  totalCorrect: 0,
  maxStreak: 0,
  currentStreak: 0,
  perfectDomains: 0,
  domainsCompleted: 0,
  domainProgress: {},
  fastAnswers: 0,
  unlockedAchievements: [],
  totalSessions: 0,
  xp: 0,
  level: 1
};

export const STORAGE_KEY = 'aws-cloud-game-stats';

export const XP_PER_LEVEL = 100;

export const calculateLevel = (xp) => Math.floor(xp / XP_PER_LEVEL) + 1;

export const xpForNextLevel = (level) => level * XP_PER_LEVEL;

export const currentLevelProgress = (xp) => xp % XP_PER_LEVEL;
