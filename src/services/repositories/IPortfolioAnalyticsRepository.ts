import { PortfolioAnalyticsDTO, PortfolioSnapshotDTO } from '../../core/api/PortfolioAnalyticsDTOs';

export interface IPortfolioAnalyticsRepository {
  getPortfolioAnalytics(address: string, forceRefresh?: boolean): Promise<PortfolioAnalyticsDTO>;
  
  getHistoricalSnapshots(address: string, forceRefresh?: boolean): Promise<PortfolioSnapshotDTO[]>;
  
  addSnapshot(address: string, snapshot: PortfolioSnapshotDTO): Promise<void>;
  
  clearPortfolioCache(address: string): Promise<void>;
}
