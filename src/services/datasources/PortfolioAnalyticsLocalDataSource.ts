import { localStorage } from '../../core/storage';
import { PortfolioAnalyticsDTO, PortfolioSnapshotDTO } from '../../core/api/PortfolioAnalyticsDTOs';
import { logger } from '../../utils/logger';

export interface PortfolioAnalyticsLocalDataSource {
  getCachedAnalytics(address: string): Promise<PortfolioAnalyticsDTO | null>;
  saveAnalytics(address: string, data: PortfolioAnalyticsDTO): Promise<void>;
  
  getCachedSnapshots(address: string): Promise<PortfolioSnapshotDTO[]>;
  saveSnapshots(address: string, snapshots: PortfolioSnapshotDTO[]): Promise<void>;
  
  clearCache(address: string): Promise<void>;
}

export class PortfolioAnalyticsLocalDataSourceImpl implements PortfolioAnalyticsLocalDataSource {
  private readonly ANALYTICS_PREFIX = 'chad_portfolio_analytics_v1_';
  private readonly SNAPSHOTS_PREFIX = 'chad_portfolio_snapshots_v1_';

  public async getCachedAnalytics(address: string): Promise<PortfolioAnalyticsDTO | null> {
    const raw = localStorage.getString(this.ANALYTICS_PREFIX + address);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PortfolioAnalyticsDTO;
    } catch {
      return null;
    }
  }

  public async saveAnalytics(address: string, data: PortfolioAnalyticsDTO): Promise<void> {
    localStorage.setString(this.ANALYTICS_PREFIX + address, JSON.stringify(data));
  }

  public async getCachedSnapshots(address: string): Promise<PortfolioSnapshotDTO[]> {
    const raw = localStorage.getString(this.SNAPSHOTS_PREFIX + address);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as PortfolioSnapshotDTO[];
    } catch {
      return [];
    }
  }

  public async saveSnapshots(address: string, snapshots: PortfolioSnapshotDTO[]): Promise<void> {
    localStorage.setString(this.SNAPSHOTS_PREFIX + address, JSON.stringify(snapshots));
  }

  public async clearCache(address: string): Promise<void> {
    localStorage.removeItem(this.ANALYTICS_PREFIX + address);
    localStorage.removeItem(this.SNAPSHOTS_PREFIX + address);
    logger.debug(`[PortfolioAnalyticsLocalDataSource] Evicted cached files for: ${address}`);
  }
}
