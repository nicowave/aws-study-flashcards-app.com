export const achievements = [
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Complete your first question',
    icon: '🎯',
    xpReward: 50,
    condition: (stats) => stats.totalAnswered >= 1
  },
  {
    id: 'perfect_domain',
    name: 'Domain Master',
    description: 'Score 100% on a domain session',
    icon: '👑',
    xpReward: 100,
    condition: (stats) => stats.perfectDomains >= 1
  },
  {
    id: 'streak_5',
    name: 'On Fire',
    description: '5 correct answers in a row',
    icon: '🔥',
    xpReward: 75,
    condition: (stats) => stats.maxStreak >= 5
  },
  {
    id: 'streak_10',
    name: 'Unstoppable',
    description: '10 correct answers in a row',
    icon: '💫',
    xpReward: 150,
    condition: (stats) => stats.maxStreak >= 10
  },
  {
    id: 'all_domains',
    name: 'Well Rounded',
    description: 'Complete at least one session in each domain',
    icon: '🌟',
    xpReward: 200,
    condition: (stats) => stats.domainsCompleted >= 4
  },
  {
    id: 'hundred_club',
    name: 'Century',
    description: 'Answer 100 questions',
    icon: '💯',
    xpReward: 250,
    condition: (stats) => stats.totalAnswered >= 100
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Answer correctly in under 5 seconds',
    icon: '⚡',
    xpReward: 50,
    condition: (stats) => stats.fastAnswers >= 1
  },
  {
    id: 'dedicated',
    name: 'Dedicated Learner',
    description: 'Complete 10 study sessions',
    icon: '📚',
    xpReward: 100,
    condition: (stats) => stats.totalSessions >= 10
  },
  {
    id: 'accuracy_master',
    name: 'Accuracy Master',
    description: 'Maintain 80%+ accuracy over 50 questions',
    icon: '🎯',
    xpReward: 200,
    condition: (stats) => stats.totalAnswered >= 50 && (stats.totalCorrect / stats.totalAnswered) >= 0.8
  }
];

export const getUnlockedAchievements = (stats, unlockedIds) => {
  return achievements.filter(a => unlockedIds.includes(a.id));
};

export const checkNewAchievements = (stats, unlockedIds) => {
  return achievements.filter(
    a => !unlockedIds.includes(a.id) && a.condition(stats)
  );
};
