import { HOME_DATA } from '@/data/homeData';

describe('Home Data', () => {
  it('provides default fallback data for home screen', () => {
    expect(HOME_DATA.streak).toBe(12);
    expect(HOME_DATA.dailyGoal.currentXp).toBe(15);
    expect(HOME_DATA.todaysPlan.length).toBeGreaterThan(0);
  });
});
