import { getGreeting, getMsUntilNextBoundary } from '../index';

describe('Greeting Utility tests', () => {
  const cases = [
    { hour: 0, min: 0, expected: 'Good Night 🌙' },
    { hour: 4, min: 59, expected: 'Good Night 🌙' },
    { hour: 5, min: 0, expected: 'Good Morning ☀️' },
    { hour: 11, min: 59, expected: 'Good Morning ☀️' },
    { hour: 12, min: 0, expected: 'Good Afternoon 🌤️' },
    { hour: 16, min: 59, expected: 'Good Afternoon 🌤️' },
    { hour: 17, min: 0, expected: 'Good Evening 🌇' },
    { hour: 20, min: 59, expected: 'Good Evening 🌇' },
    { hour: 21, min: 0, expected: 'Good Night 🌙' },
    { hour: 23, min: 59, expected: 'Good Night 🌙' },
  ];

  cases.forEach(({ hour, min, expected }) => {
    it(`should return "${expected}" for local time ${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`, () => {
      const testDate = new Date();
      testDate.setHours(hour, min, 0, 0);
      expect(getGreeting(testDate)).toBe(expected);
    });
  });

  it('should calculate correct milliseconds until next boundary (11:59 -> 12:00)', () => {
    const testDate = new Date();
    testDate.setHours(11, 59, 0, 0);
    const msRemaining = getMsUntilNextBoundary(testDate);
    expect(msRemaining).toBe(60000);
  });

  it('should calculate correct milliseconds until next boundary (23:59 -> 00:00 of next day)', () => {
    const testDate = new Date();
    testDate.setHours(23, 59, 0, 0);
    const msRemaining = getMsUntilNextBoundary(testDate);
    expect(msRemaining).toBe(60000);
  });
});
