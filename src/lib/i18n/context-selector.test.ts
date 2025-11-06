/**
 * Context Selector Tests
 *
 * Tests for context selection logic with variety tracking and rotation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContextSelector, createContextSelector } from './context-selector';

describe('ContextSelector', () => {
  describe('Danish locale (da-DK)', () => {
    let selector: ContextSelector;

    beforeEach(async () => {
      selector = createContextSelector('da-DK', 5);
      await selector.loadContextPool();
    });

    it('should select names with variety tracking', async () => {
      const names = new Set<string>();

      // Select 10 names
      for (let i = 0; i < 10; i++) {
        const name = await selector.selectName();
        names.add(name);
      }

      // Should have variety (at least 8 unique names out of 10)
      expect(names.size).toBeGreaterThanOrEqual(8);
    });

    it('should filter names by gender', async () => {
      const maleName = await selector.selectName('male');
      const femaleName = await selector.selectName('female');
      const neutralName = await selector.selectName('neutral');

      expect(maleName).toBeTruthy();
      expect(femaleName).toBeTruthy();
      expect(neutralName).toBeTruthy();
    });

    it('should avoid recently used names', async () => {
      const selector2 = createContextSelector('da-DK', 3);
      await selector2.loadContextPool();

      const first = await selector2.selectName('male');
      const second = await selector2.selectName('male');
      const third = await selector2.selectName('male');
      const fourth = await selector2.selectName('male');

      // First name should not appear in the next 3 selections
      expect([second, third, fourth]).not.toContain(first);
    });

    it('should select places with variety tracking', async () => {
      const places = new Set<string>();

      for (let i = 0; i < 10; i++) {
        const place = await selector.selectPlace();
        places.add(place);
      }

      expect(places.size).toBeGreaterThanOrEqual(8);
    });

    it('should filter places by type', async () => {
      const city = await selector.selectPlace('cities');
      const location = await selector.selectPlace('locations');
      const neighborhood = await selector.selectPlace('neighborhoods');

      expect(city).toBeTruthy();
      expect(location).toBeTruthy();
      expect(neighborhood).toBeTruthy();
    });

    it('should select items from categories', async () => {
      const food = await selector.selectItems('food', 3);
      expect(food).toHaveLength(3);
      expect(new Set(food).size).toBe(3); // All unique

      const school = await selector.selectItems('school', 5);
      expect(school).toHaveLength(5);
      expect(new Set(school).size).toBe(5);
    });

    it('should avoid recently used items', async () => {
      const selector2 = createContextSelector('da-DK', 3);
      await selector2.loadContextPool();

      const first = await selector2.selectItems('food', 1);
      const second = await selector2.selectItems('food', 1);
      const third = await selector2.selectItems('food', 1);
      const fourth = await selector2.selectItems('food', 1);

      // First item should not appear in the next 3 selections
      expect([...second, ...third, ...fourth]).not.toContain(first[0]);
    });

    it('should select scenarios from categories', async () => {
      const shopping = await selector.selectScenario('shopping');
      const school = await selector.selectScenario('school');
      const home = await selector.selectScenario('home');

      expect(shopping).toBeTruthy();
      expect(school).toBeTruthy();
      expect(home).toBeTruthy();
    });

    it('should select activity verbs', async () => {
      const verb = await selector.selectActivityVerb();
      expect(verb).toBeTruthy();
    });

    it('should return currency information', async () => {
      const currency = selector.getCurrency();
      expect(currency).toEqual({
        symbol: 'kr',
        name: 'kroner',
      });
    });

    it('should reset usage tracking', async () => {
      // Select some items
      await selector.selectName();
      await selector.selectPlace();
      await selector.selectItems('food', 2);

      const statsBefore = selector.getUsageStats();
      expect(Object.keys(statsBefore).length).toBeGreaterThan(0);

      // Reset
      selector.resetUsageTracking();

      const statsAfter = selector.getUsageStats();
      expect(Object.keys(statsAfter).length).toBe(0);
    });

    it('should reset category-specific tracking', async () => {
      await selector.selectName();
      await selector.selectPlace();

      selector.resetCategoryTracking('names');

      const stats = selector.getUsageStats();
      expect(stats['names']).toBeUndefined();
      expect(stats['places']).toBeDefined();
    });

    it('should provide usage statistics', async () => {
      await selector.selectName();
      await selector.selectName();
      await selector.selectPlace();

      const stats = selector.getUsageStats();

      expect(stats['names']).toBeDefined();
      expect(stats['names'].total).toBe(2);
      expect(stats['places']).toBeDefined();
      expect(stats['places'].total).toBe(1);
    });

    it('should handle exhaustion of available items', async () => {
      // Create selector with very small recent size
      const selector2 = createContextSelector('da-DK', 100);
      await selector2.loadContextPool();

      // Select many items (more than available in a small category)
      const items: string[] = [];
      for (let i = 0; i < 50; i++) {
        const item = await selector2.selectItems('weather', 1);
        items.push(...item);
      }

      // Should not throw and should repeat items after exhaustion
      expect(items.length).toBe(50);
    });
  });

  describe('English locale (en-US)', () => {
    let selector: ContextSelector;

    beforeEach(async () => {
      selector = createContextSelector('en-US', 5);
      await selector.loadContextPool();
    });

    it('should select names in English', async () => {
      const name = await selector.selectName();
      expect(name).toBeTruthy();
    });

    it('should select places in English', async () => {
      const place = await selector.selectPlace();
      expect(place).toBeTruthy();
    });

    it('should select items in English', async () => {
      const items = await selector.selectItems('food', 3);
      expect(items).toHaveLength(3);
    });

    it('should return currency information', async () => {
      const currency = selector.getCurrency();
      expect(currency).toEqual({
        symbol: 'kr',
        name: 'kroner',
      });
    });
  });

  describe('Factory function', () => {
    it('should create context selector with default max recent size', () => {
      const selector = createContextSelector('da-DK');
      expect(selector).toBeInstanceOf(ContextSelector);
    });

    it('should create context selector with custom max recent size', () => {
      const selector = createContextSelector('da-DK', 20);
      expect(selector).toBeInstanceOf(ContextSelector);
    });
  });

  describe('Error handling', () => {
    it('should throw error when context pool not loaded', () => {
      const selector = createContextSelector('da-DK');
      expect(() => selector.getCurrency()).toThrow(
        'Context pool not loaded'
      );
    });

    it('should throw error for invalid category', async () => {
      const selector = createContextSelector('da-DK');
      await selector.loadContextPool();

      await expect(
        selector.selectItems('invalid-category', 1)
      ).rejects.toThrow('No items available');
    });
  });

  describe('Variety tracking algorithm', () => {
    it('should maintain variety across multiple selections', async () => {
      const selector = createContextSelector('da-DK', 10);
      await selector.loadContextPool();

      const selectedNames: string[] = [];

      // Select 20 names
      for (let i = 0; i < 20; i++) {
        const name = await selector.selectName('male');
        selectedNames.push(name);
      }

      // Check that recent selections don't repeat
      for (let i = 0; i < selectedNames.length - 10; i++) {
        const current = selectedNames[i];
        const next10 = selectedNames.slice(i + 1, i + 11);

        // Current name should not appear in the next 10
        expect(next10).not.toContain(current);
      }
    });

    it('should balance variety with availability', async () => {
      // Test with a category that has limited items
      const selector = createContextSelector('da-DK', 5);
      await selector.loadContextPool();

      const selectedItems: string[] = [];

      // Select many items
      for (let i = 0; i < 30; i++) {
        const items = await selector.selectItems('seasons', 1);
        selectedItems.push(...items);
      }

      // Should not fail and should cycle through items
      expect(selectedItems.length).toBe(30);

      // Count occurrences - items should be relatively balanced
      const counts = new Map<string, number>();
      selectedItems.forEach((item) => {
        counts.set(item, (counts.get(item) || 0) + 1);
      });

      // With 4 seasons and 30 selections, each should appear 7-8 times
      // (allowing for some randomness)
      for (const count of counts.values()) {
        expect(count).toBeGreaterThanOrEqual(5);
        expect(count).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('Integration with multiple categories', () => {
    it('should track usage independently per category', async () => {
      const selector = createContextSelector('da-DK', 3);
      await selector.loadContextPool();

      // Select from different categories
      await selector.selectItems('food', 2);
      await selector.selectItems('school', 2);
      await selector.selectItems('toys', 2);

      const stats = selector.getUsageStats();

      expect(stats['items:food'].total).toBe(2);
      expect(stats['items:school'].total).toBe(2);
      expect(stats['items:toys'].total).toBe(2);
    });

    it('should maintain separate tracking for subcategories', async () => {
      const selector = createContextSelector('da-DK', 3);
      await selector.loadContextPool();

      await selector.selectName('male');
      await selector.selectName('female');
      await selector.selectName('neutral');

      const stats = selector.getUsageStats();

      expect(stats['names:male'].total).toBe(1);
      expect(stats['names:female'].total).toBe(1);
      expect(stats['names:neutral'].total).toBe(1);
    });
  });
});
