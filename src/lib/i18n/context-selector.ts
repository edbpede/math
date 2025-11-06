/**
 * Context Selector Service
 *
 * Provides context selection logic with variety tracking and rotation.
 * Ensures that exercises use a diverse set of names, places, and items
 * to keep content fresh and engaging.
 *
 * Requirements:
 * - 2.6: Select culturally appropriate contexts from locale-specific pools
 * - 3.3: Implement context rotation to ensure variety
 */

import type { Locale, ContextPool } from './types';
import { getContextPool } from './utils';

/**
 * Interface for tracking recently used contexts
 */
interface ContextUsageTracker {
  category: string;
  recentlyUsed: string[];
  maxRecentSize: number;
}

/**
 * Context Selector class with variety tracking
 */
export class ContextSelector {
  private locale: Locale;
  private contextPool: ContextPool | null = null;
  private usageTrackers: Map<string, ContextUsageTracker> = new Map();
  private readonly defaultMaxRecent: number;

  constructor(locale: Locale, maxRecentSize: number = 10) {
    this.locale = locale;
    this.defaultMaxRecent = maxRecentSize;
  }

  /**
   * Load context pool for the current locale
   */
  async loadContextPool(): Promise<void> {
    this.contextPool = await getContextPool(this.locale);
  }

  /**
   * Get tracker for a specific category
   */
  private getTracker(category: string): ContextUsageTracker {
    if (!this.usageTrackers.has(category)) {
      this.usageTrackers.set(category, {
        category,
        recentlyUsed: [],
        maxRecentSize: this.defaultMaxRecent,
      });
    }
    return this.usageTrackers.get(category)!;
  }

  /**
   * Mark a context item as used
   */
  private markAsUsed(category: string, item: string): void {
    const tracker = this.getTracker(category);

    // Remove item if it already exists in recently used
    const index = tracker.recentlyUsed.indexOf(item);
    if (index > -1) {
      tracker.recentlyUsed.splice(index, 1);
    }

    // Add to the front of the list
    tracker.recentlyUsed.unshift(item);

    // Trim to max size
    if (tracker.recentlyUsed.length > tracker.maxRecentSize) {
      tracker.recentlyUsed = tracker.recentlyUsed.slice(0, tracker.maxRecentSize);
    }
  }

  /**
   * Get available items for a category (excluding recently used)
   */
  private getAvailableItems(category: string, allItems: string[]): string[] {
    const tracker = this.getTracker(category);

    // Filter out recently used items
    const available = allItems.filter(
      (item) => !tracker.recentlyUsed.includes(item)
    );

    // If we've exhausted all items, reset and use all items
    if (available.length === 0) {
      tracker.recentlyUsed = [];
      return allItems;
    }

    return available;
  }

  /**
   * Select a random name with variety tracking
   *
   * @param gender - Optional gender filter ('male', 'female', 'neutral')
   * @returns Random name from the appropriate pool
   */
  async selectName(gender?: 'male' | 'female' | 'neutral'): Promise<string> {
    if (!this.contextPool) {
      await this.loadContextPool();
    }

    if (!this.contextPool) {
      throw new Error('Failed to load context pool');
    }

    // Load full name data
    const contextData = await import(
      `../../locales/${this.locale}/contexts.json`
    );
    const data = contextData.default || contextData;

    let allNames: string[] = [];
    let categoryKey = 'names';

    if (gender) {
      allNames = data.names?.[gender] || [];
      categoryKey = `names:${gender}`;
    } else {
      // Combine all names
      allNames = [
        ...(data.names?.male || []),
        ...(data.names?.female || []),
        ...(data.names?.neutral || []),
      ];
    }

    if (allNames.length === 0) {
      throw new Error(`No names available for gender: ${gender || 'any'}`);
    }

    const available = this.getAvailableItems(categoryKey, allNames);
    const selected = available[Math.floor(Math.random() * available.length)];
    this.markAsUsed(categoryKey, selected);

    return selected;
  }

  /**
   * Select a random place with variety tracking
   *
   * @param type - Optional type filter ('cities', 'locations', 'neighborhoods')
   * @returns Random place from the appropriate pool
   */
  async selectPlace(
    type?: 'cities' | 'locations' | 'neighborhoods'
  ): Promise<string> {
    if (!this.contextPool) {
      await this.loadContextPool();
    }

    if (!this.contextPool) {
      throw new Error('Failed to load context pool');
    }

    const contextData = await import(
      `../../locales/${this.locale}/contexts.json`
    );
    const data = contextData.default || contextData;

    let allPlaces: string[] = [];
    let categoryKey = 'places';

    if (type) {
      allPlaces = data.places?.[type] || [];
      categoryKey = `places:${type}`;
    } else {
      // Combine all places
      allPlaces = [
        ...(data.places?.cities || []),
        ...(data.places?.locations || []),
        ...(data.places?.neighborhoods || []),
      ];
    }

    if (allPlaces.length === 0) {
      throw new Error(`No places available for type: ${type || 'any'}`);
    }

    const available = this.getAvailableItems(categoryKey, allPlaces);
    const selected = available[Math.floor(Math.random() * available.length)];
    this.markAsUsed(categoryKey, selected);

    return selected;
  }

  /**
   * Select random items from a category with variety tracking
   *
   * @param category - Item category (e.g., 'food', 'school', 'toys')
   * @param count - Number of items to select (default: 1)
   * @returns Array of random items
   */
  async selectItems(category: string, count: number = 1): Promise<string[]> {
    if (!this.contextPool) {
      await this.loadContextPool();
    }

    if (!this.contextPool) {
      throw new Error('Failed to load context pool');
    }

    const contextData = await import(
      `../../locales/${this.locale}/contexts.json`
    );
    const data = contextData.default || contextData;

    const allItems = data.items?.[category] || [];

    if (allItems.length === 0) {
      throw new Error(`No items available for category: ${category}`);
    }

    const categoryKey = `items:${category}`;
    const available = this.getAvailableItems(categoryKey, allItems);

    // Shuffle available items
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    // Mark all selected items as used
    selected.forEach((item) => this.markAsUsed(categoryKey, item));

    return selected;
  }

  /**
   * Select a random scenario from a category
   *
   * @param category - Scenario category (e.g., 'shopping', 'school', 'home')
   * @returns Random scenario
   */
  async selectScenario(category: string): Promise<string> {
    if (!this.contextPool) {
      await this.loadContextPool();
    }

    if (!this.contextPool) {
      throw new Error('Failed to load context pool');
    }

    const contextData = await import(
      `../../locales/${this.locale}/contexts.json`
    );
    const data = contextData.default || contextData;

    const allScenarios = data.scenarios?.[category] || [];

    if (allScenarios.length === 0) {
      throw new Error(`No scenarios available for category: ${category}`);
    }

    const categoryKey = `scenarios:${category}`;
    const available = this.getAvailableItems(categoryKey, allScenarios);
    const selected = available[Math.floor(Math.random() * available.length)];
    this.markAsUsed(categoryKey, selected);

    return selected;
  }

  /**
   * Select a random activity verb
   *
   * @returns Random activity verb
   */
  async selectActivityVerb(): Promise<string> {
    if (!this.contextPool) {
      await this.loadContextPool();
    }

    if (!this.contextPool) {
      throw new Error('Failed to load context pool');
    }

    const contextData = await import(
      `../../locales/${this.locale}/contexts.json`
    );
    const data = contextData.default || contextData;

    const allVerbs = data.activities?.verbs || [];

    if (allVerbs.length === 0) {
      throw new Error('No activity verbs available');
    }

    const categoryKey = 'activities:verbs';
    const available = this.getAvailableItems(categoryKey, allVerbs);
    const selected = available[Math.floor(Math.random() * available.length)];
    this.markAsUsed(categoryKey, selected);

    return selected;
  }

  /**
   * Get currency information for the current locale
   *
   * @returns Currency information
   */
  getCurrency(): { symbol: string; name: string } {
    if (!this.contextPool) {
      throw new Error('Context pool not loaded. Call loadContextPool() first.');
    }

    return this.contextPool.currency;
  }

  /**
   * Reset usage tracking for all categories
   */
  resetUsageTracking(): void {
    this.usageTrackers.clear();
  }

  /**
   * Reset usage tracking for a specific category
   *
   * @param category - Category to reset
   */
  resetCategoryTracking(category: string): void {
    this.usageTrackers.delete(category);
  }

  /**
   * Get statistics about context usage
   *
   * @returns Usage statistics
   */
  getUsageStats(): Record<string, { total: number; available: number }> {
    const stats: Record<string, { total: number; available: number }> = {};

    for (const [category, tracker] of this.usageTrackers.entries()) {
      stats[category] = {
        total: tracker.recentlyUsed.length,
        available: tracker.maxRecentSize - tracker.recentlyUsed.length,
      };
    }

    return stats;
  }
}

/**
 * Create a context selector instance for a locale
 *
 * @param locale - The locale to use
 * @param maxRecentSize - Maximum number of recently used items to track
 * @returns ContextSelector instance
 */
export function createContextSelector(
  locale: Locale,
  maxRecentSize?: number
): ContextSelector {
  return new ContextSelector(locale, maxRecentSize);
}
