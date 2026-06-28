import { IPortfolioAnalyticsRepository } from './IPortfolioAnalyticsRepository';
import { PortfolioAnalyticsRemoteDataSource } from '../datasources/PortfolioAnalyticsRemoteDataSource';
import { PortfolioAnalyticsLocalDataSource } from '../datasources/PortfolioAnalyticsLocalDataSource';
import { PortfolioAnalyticsDTO, PortfolioSnapshotDTO } from '../../core/api/PortfolioAnalyticsDTOs';
import { featureFlagsManager } from '../../core/api/FeatureFlags';
import { logger } from '../../utils/logger';
import { RepositoryError } from '../../core/errors';

export class PortfolioAnalyticsRepository implements IPortfolioAnalyticsRepository {
  constructor(
    private remoteDS: PortfolioAnalyticsRemoteDataSource,
    private localDS: PortfolioAnalyticsLocalDataSource
  ) {}

  public async getPortfolioAnalytics(address: string, forceRefresh = false): Promise<PortfolioAnalyticsDTO> {
    if (!featureFlagsManager.isEnabled('ENABLE_PORTFOLIO_ANALYTICS')) {
      throw new RepositoryError('PORTFOLIO_ANALYTICS_DISABLED', 'Portfolio analytics feature is currently disabled.');
    }

    // 1. Resolve local cache map first
    if (!forceRefresh) {
      const cached = await this.localDS.getCachedAnalytics(address);
      if (cached) {
        logger.debug(`[PortfolioAnalyticsRepository] Serving cached portfolio stats for: ${address}`);
        return cached;
      }
    }

    try {
      // 2. Query remote statistics
      const data = await this.remoteDS.fetchPortfolioAnalytics(address);
      await this.localDS.saveAnalytics(address, data);
      return data;
    } catch (e: any) {
      logger.error(`[PortfolioAnalyticsRepository] Failed to query portfolio stats for: ${address}`, e);
      
      const cached = await this.localDS.getCachedAnalytics(address);
      if (cached) return cached;
      
      throw new RepositoryError('PORTFOLIO_QUERY_FAILED', 'Failed to retrieve current portfolio analytics.', e);
    }
  }

  public async getHistoricalSnapshots(address: string, forceRefresh = false): Promise<PortfolioSnapshotDTO[]> {
    if (!featureFlagsManager.isEnabled('ENABLE_HISTORICAL_SNAPSHOTS')) {
      return [];
    }

    if (!forceRefresh) {
      const cached = await this.localDS.getCachedSnapshots(address);
      if (cached.length > 0) {
        logger.debug(`[PortfolioAnalyticsRepository] Serving cached snapshots for: ${address}`);
        return cached;
      }
    }

    try {
      const data = await this.remoteDS.fetchHistoricalSnapshots(address);
      await this.localDS.saveSnapshots(address, data);
      return data;
    } catch (e: any) {
      logger.error(`[PortfolioAnalyticsRepository] Failed to query historical snapshots for: ${address}`, e);
      return this.localDS.getCachedSnapshots(address);
    }
  }

  public async addSnapshot(address: string, snapshot: PortfolioSnapshotDTO): Promise<void> {
    const list = await this.localDS.getCachedSnapshots(address);
    list.push(snapshot);
    await this.localDS.saveSnapshots(address, list);
    logger.info(`[PortfolioAnalyticsRepository] Added new snapshot: ${snapshot.snapshot_id} to address: ${address}`);
  }

  public async clearPortfolioCache(address: string): Promise<void> {
    await this.localDS.clearCache(address);
  }
}
