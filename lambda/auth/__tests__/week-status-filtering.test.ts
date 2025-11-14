import { 
  getWeekNumber, 
  getWeekDates, 
  isDateInWeek 
} from '../fetch-assignments';

describe('Week Number and Status Filtering', () => {
  describe('getWeekNumber', () => {
    it('should return correct week number for January 1st', () => {
      const date = new Date(2024, 0, 1); // January 1, 2024
      const weekNumber = getWeekNumber(date);
      expect(weekNumber).toBe(1);
    });

    it('should return correct week number for middle of year', () => {
      const date = new Date(2024, 5, 15); // June 15, 2024
      const weekNumber = getWeekNumber(date);
      expect(weekNumber).toBeGreaterThan(20);
      expect(weekNumber).toBeLessThan(30);
    });

    it('should return correct week number for December 31st', () => {
      const date = new Date(2024, 11, 31); // December 31, 2024
      const weekNumber = getWeekNumber(date);
      expect(weekNumber).toBeGreaterThan(50);
    });

    it('should handle leap year correctly', () => {
      const date = new Date(2024, 1, 29); // February 29, 2024 (leap year)
      const weekNumber = getWeekNumber(date);
      expect(weekNumber).toBeGreaterThan(8);
      expect(weekNumber).toBeLessThan(10);
    });
  });

  describe('getWeekDates', () => {
    it('should return correct week start and end for week 1', () => {
      const { weekStart, weekEnd } = getWeekDates(1, 2024);
      
      // Week 1 should start on Monday
      expect(weekStart.getDay()).toBe(1); // Monday
      expect(weekStart.getFullYear()).toBe(2024);
      
      // Week 1 should end on Sunday
      expect(weekEnd.getDay()).toBe(0); // Sunday
      expect(weekEnd.getFullYear()).toBe(2024);
      
      // Week end should be 6 days after week start
      const daysDifference = Math.floor((weekEnd.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000));
      expect(daysDifference).toBe(6);
    });

    it('should return correct week start and end for middle week', () => {
      const { weekStart, weekEnd } = getWeekDates(26, 2024);
      
      expect(weekStart.getDay()).toBe(1); // Monday
      expect(weekEnd.getDay()).toBe(0); // Sunday
      
      // Should be in June/July
      expect(weekStart.getMonth()).toBeGreaterThanOrEqual(5);
      expect(weekStart.getMonth()).toBeLessThanOrEqual(6);
    });

    it('should handle year boundary correctly', () => {
      const { weekStart, weekEnd } = getWeekDates(52, 2024);
      
      expect(weekStart.getFullYear()).toBe(2024);
      expect(weekEnd.getFullYear()).toBe(2024);
      
      // Last week should be in December
      expect(weekStart.getMonth()).toBe(11); // December
      expect(weekEnd.getMonth()).toBe(11); // December
    });

    it('should set correct time for week end', () => {
      const { weekEnd } = getWeekDates(1, 2024);
      
      expect(weekEnd.getHours()).toBe(23);
      expect(weekEnd.getMinutes()).toBe(59);
      expect(weekEnd.getSeconds()).toBe(59);
      expect(weekEnd.getMilliseconds()).toBe(999);
    });
  });

  describe('isDateInWeek', () => {
    it('should return true for date in specified week', () => {
      const date = new Date(2024, 5, 15); // June 15, 2024
      const weekNumber = getWeekNumber(date);
      const result = isDateInWeek(date, weekNumber, 2024);
      expect(result).toBe(true);
    });

    it('should return false for date outside specified week', () => {
      const date = new Date(2024, 5, 15); // June 15, 2024
      const result = isDateInWeek(date, 1, 2024); // Week 1
      expect(result).toBe(false);
    });

    it('should handle week boundaries correctly', () => {
      const { weekStart, weekEnd } = getWeekDates(26, 2024);
      
      // Test start of week
      expect(isDateInWeek(weekStart, 26, 2024)).toBe(true);
      
      // Test end of week
      expect(isDateInWeek(weekEnd, 26, 2024)).toBe(true);
      
      // Test day before week
      const dayBefore = new Date(weekStart);
      dayBefore.setDate(weekStart.getDate() - 1);
      expect(isDateInWeek(dayBefore, 26, 2024)).toBe(false);
      
      // Test day after week
      const dayAfter = new Date(weekEnd);
      dayAfter.setDate(weekEnd.getDate() + 1);
      expect(isDateInWeek(dayAfter, 26, 2024)).toBe(false);
    });

    it('should handle different years correctly', () => {
      const date = new Date(2024, 5, 15);
      const result = isDateInWeek(date, 26, 2023); // Different year
      expect(result).toBe(false);
    });
  });

  describe('Week Number Edge Cases', () => {
    it('should handle January 1st on different days of week', () => {
      // Test with different years where Jan 1 falls on different days
      const testYears = [2023, 2024, 2025, 2026];
      
      testYears.forEach(year => {
        const janFirst = new Date(year, 0, 1);
        const weekNumber = getWeekNumber(janFirst);
        expect(weekNumber).toBeGreaterThanOrEqual(1);
        expect(weekNumber).toBeLessThanOrEqual(2);
      });
    });

    it('should handle December 31st correctly', () => {
      const testYears = [2023, 2024, 2025, 2026];
      
      testYears.forEach(year => {
        const decLast = new Date(year, 11, 31);
        const weekNumber = getWeekNumber(decLast);
        expect(weekNumber).toBeGreaterThanOrEqual(52);
        expect(weekNumber).toBeLessThanOrEqual(53);
      });
    });
  });

  describe('Week Date Calculations', () => {
    it('should maintain 7-day week structure', () => {
      for (let week = 1; week <= 52; week++) {
        const { weekStart, weekEnd } = getWeekDates(week, 2024);
        const daysDifference = Math.floor((weekEnd.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000));
        expect(daysDifference).toBe(6); // 6 days difference = 7 days total
        
        // Verify start is Monday and end is Sunday
        expect(weekStart.getDay()).toBe(1); // Monday
        expect(weekEnd.getDay()).toBe(0); // Sunday
      }
    });

    it('should handle leap year February correctly', () => {
      // Week containing Feb 29
      const feb29 = new Date(2024, 1, 29);
      expect(isDateInWeek(feb29, 9, 2024)).toBe(true);
    });
  });
});
