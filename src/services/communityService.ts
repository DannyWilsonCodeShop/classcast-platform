// Community Service - Best practices for data management
export interface CommunityStats {
  totalPosts: number;
  activeUsers: number;
  postsThisWeek: number;
  onlineNow: number;
}

export interface TrendingTopic {
  tag: string;
  count: number;
  trend: 'up' | 'down';
  changePercent: number;
}

export interface OnlineUser {
  id: string;
  name: string;
  lastSeen: string;
  isOnline: boolean;
}

export class CommunityService {
  private static instance: CommunityService;
  private cache: {
    stats?: CommunityStats;
    trendingTopics?: TrendingTopic[];
    onlineUsers?: OnlineUser[];
    lastUpdated?: number;
  } = {};

  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): CommunityService {
    if (!CommunityService.instance) {
      CommunityService.instance = new CommunityService();
    }
    return CommunityService.instance;
  }

  private isCacheValid(): boolean {
    return !!(
      this.cache.lastUpdated &&
      Date.now() - this.cache.lastUpdated < this.CACHE_DURATION
    );
  }

  async getCommunityStats(): Promise<CommunityStats> {
    if (this.cache.stats && this.isCacheValid()) {
      return this.cache.stats;
    }

    try {
      const response = await fetch('/api/community/stats');
      if (response.ok) {
        const stats = await response.json();
        this.cache.stats = stats;
        this.cache.lastUpdated = Date.now();
        return stats;
      }
    } catch (error) {
      console.warn('Failed to fetch community stats:', error);
    }

    // Return default empty stats instead of mock data
    return {
      totalPosts: 0,
      activeUsers: 0,
      postsThisWeek: 0,
      onlineNow: 0
    };
  }

  async getTrendingTopics(): Promise<TrendingTopic[]> {
    if (this.cache.trendingTopics && this.isCacheValid()) {
      return this.cache.trendingTopics;
    }

    try {
      const response = await fetch('/api/community/trending');
      if (response.ok) {
        const topics = await response.json();
        this.cache.trendingTopics = topics;
        this.cache.lastUpdated = Date.now();
        return topics;
      }
    } catch (error) {
      console.warn('Failed to fetch trending topics:', error);
    }

    // Return empty array instead of mock data
    return [];
  }

  async getOnlineUsers(): Promise<OnlineUser[]> {
    if (this.cache.onlineUsers && this.isCacheValid()) {
      return this.cache.onlineUsers;
    }

    try {
      const response = await fetch('/api/community/online-users');
      if (response.ok) {
        const users = await response.json();
        this.cache.onlineUsers = users;
        this.cache.lastUpdated = Date.now();
        return users;
      }
    } catch (error) {
      console.warn('Failed to fetch online users:', error);
    }

    // Return empty array instead of mock data
    return [];
  }

  clearCache(): void {
    this.cache = {};
  }
}

export const communityService = CommunityService.getInstance();
