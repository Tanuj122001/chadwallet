import { logger } from '../../utils/logger';

export type ApiVersion = 'v1' | 'v2';

export interface IVersionResolver {
  resolvePath(path: string, strategy: 'url' | 'header', targetVersion?: ApiVersion): { path: string; headers: Record<string, string> };
  registerMigration(fromVersion: ApiVersion, toVersion: ApiVersion, migrationFn: (data: any) => any): void;
  migrateResponse(fromVersion: ApiVersion, toVersion: ApiVersion, data: any): any;
}

class VersionResolver implements IVersionResolver {
  private defaultVersion: ApiVersion = 'v1';
  private migrations = new Map<string, (data: any) => any>();

  // Version Resolver strategy: resolves path modification or header injects
  public resolvePath(
    path: string,
    strategy: 'url' | 'header' = 'url',
    targetVersion: ApiVersion = this.defaultVersion
  ): { path: string; headers: Record<string, string> } {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const headers: Record<string, string> = {};

    if (strategy === 'url') {
      // Strategy 1: URL versioning (e.g. /v1/auth/login)
      const versionedPath = `/${targetVersion}${cleanPath}`;
      return { path: versionedPath, headers };
    } else {
      // Strategy 2: Header-based versioning (e.g. x-api-version: v2)
      headers['x-api-version'] = targetVersion;
      headers['Accept'] = `application/vnd.chadwallet.${targetVersion}+json`;
      return { path: cleanPath, headers };
    }
  }

  // Future migration hooks mapping older model shapes to new ones
  public registerMigration(fromVersion: ApiVersion, toVersion: ApiVersion, migrationFn: (data: any) => any): void {
    const migrationKey = `${fromVersion}->${toVersion}`;
    this.migrations.set(migrationKey, migrationFn);
    logger.info(`[VersionResolver] Registered migration path: ${migrationKey}`);
  }

  public migrateResponse(fromVersion: ApiVersion, toVersion: ApiVersion, data: any): any {
    const migrationKey = `${fromVersion}->${toVersion}`;
    const migrator = this.migrations.get(migrationKey);
    
    if (migrator) {
      logger.info(`[VersionResolver] Migrating response data from ${fromVersion} to ${toVersion}`);
      return migrator(data);
    }
    
    logger.warn(`[VersionResolver] No migrator registered for path: ${migrationKey}`);
    return data;
  }
}

export const versionResolver = new VersionResolver();
export default versionResolver;
