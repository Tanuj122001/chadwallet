import { PaginatedResponse } from './contracts';
import { logger } from '../../utils/logger';

export interface PaginationParams {
  limit: number;
  offset?: number;
  cursor?: string;
}

export type PaginatedFetcher<T> = (params: PaginationParams) => Promise<PaginatedResponse<T>>;

export class PaginationController<T> {
  private fetcher: PaginatedFetcher<T>;
  private limit: number;
  
  // Internal State
  public items: T[] = [];
  public offset = 0;
  public cursor?: string;
  public hasNextPage = true;
  public loading = false;
  public error: Error | null = null;

  constructor(fetcher: PaginatedFetcher<T>, defaultLimit: number = 20) {
    this.fetcher = fetcher;
    this.limit = defaultLimit;
  }

  // Load the next page sequentially - offset or cursor strategy
  public async loadNextPage(): Promise<void> {
    if (this.loading || !this.hasNextPage) return;

    this.loading = true;
    this.error = null;
    logger.debug(`[PaginationController] Loading page offset: ${this.offset}, cursor: ${this.cursor}`);

    try {
      const response = await this.fetcher({
        limit: this.limit,
        offset: this.offset,
        cursor: this.cursor,
      });

      this.items = [...this.items, ...response.items];
      this.offset += response.items.length;
      this.cursor = response.nextCursor;
      this.hasNextPage = response.hasNextPage;
      
      logger.info(`[PaginationController] Page loaded successfully. Items fetched: ${response.items.length}, total accumulated: ${this.items.length}`);
    } catch (e: any) {
      this.error = e;
      logger.error('[PaginationController] Load next page failed', e);
      throw e;
    } finally {
      this.loading = false;
    }
  }

  // Reload back to page 1
  public async refresh(): Promise<void> {
    this.items = [];
    this.offset = 0;
    this.cursor = undefined;
    this.hasNextPage = true;
    this.loading = false;
    this.error = null;

    await this.loadNextPage();
  }
}

class PaginationEngine {
  public createController<T>(fetcher: PaginatedFetcher<T>, limit: number = 20): PaginationController<T> {
    return new PaginationController<T>(fetcher, limit);
  }
}

export const paginationEngine = new PaginationEngine();
export default paginationEngine;
