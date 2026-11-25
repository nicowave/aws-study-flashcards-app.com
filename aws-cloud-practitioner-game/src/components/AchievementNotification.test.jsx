import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AchievementNotification from './AchievementNotification';
import { achievements } from '../data/achievements';

describe('AchievementNotification', () => {
  it('renders nothing when there is no achievement', () => {
    const { container } = render(<AchievementNotification achievement={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("announces the achievement passed in, with its XP reward", () => {
    // App.jsx passes a full achievement object from the app's own list
    const achievement = achievements.find((a) => a.xpReward) ?? achievements[0];
    render(<AchievementNotification achievement={achievement} />);
    expect(screen.getByText(/Achievement Unlocked/)).toBeInTheDocument();
    expect(screen.getByText(achievement.name)).toBeInTheDocument();
    expect(screen.getByText(`+${achievement.xpReward} XP`)).toBeInTheDocument();
  });

  it('leaves out the XP line when the achievement has no reward', () => {
    render(<AchievementNotification achievement={{ id: 'x', name: 'Test Badge' }} />);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
    expect(screen.queryByText(/XP/)).not.toBeInTheDocument();
  });
});
