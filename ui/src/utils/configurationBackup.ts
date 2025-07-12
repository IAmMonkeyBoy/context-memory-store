/**
 * Configuration Backup & Rollback System
 * Phase 7.4.5 - Backup, versioning, and rollback utilities for configuration management
 */

import type {
  ConfigurationBackup,
  BackupType,
  BackupMetadata,
  BackupSchedule,
  RetentionPolicy,
  BackupOptions,
  NotificationSettings,
  ConfigurationVersion,
  VersionStatus,
  VersionMetadata,
  VersionComparison,
  ConfigurationChange
} from '../types/configurationImportExport';
import type { SystemConfiguration } from '../types/configuration';
import type { EnvironmentType } from '../types/configurationProfiles';

// =============================================================================
// Configuration Backup System
// =============================================================================

export class ConfigurationBackupManager {
  private static backups: Map<string, ConfigurationBackup> = new Map();
  private static schedules: Map<string, BackupSchedule> = new Map();

  /**
   * Create a backup of the current configuration
   */
  static async createBackup(
    config: SystemConfiguration,
    options: Partial<BackupOptions> = {},
    type: BackupType = 'manual',
    user: string = 'system'
  ): Promise<ConfigurationBackup> {
    try {
      const backupId = this.generateBackupId();
      const timestamp = new Date().toISOString();
      
      // Prepare configuration for backup
      const backupConfig = options.includeSecrets 
        ? config 
        : this.removeSensitiveData(config);

      // Generate metadata
      const metadata = this.generateBackupMetadata(config, timestamp);
      
      // Calculate checksum
      const checksum = await this.calculateChecksum(JSON.stringify(backupConfig));
      
      // Create backup object
      const backup: ConfigurationBackup = {
        id: backupId,
        name: options.customName || this.generateBackupName(type, timestamp),
        description: `Backup created on ${new Date(timestamp).toLocaleString()}`,
        createdAt: timestamp,
        createdBy: user,
        type,
        configuration: backupConfig,
        metadata,
        encrypted: false, // TODO: Implement encryption
        checksum,
        size: JSON.stringify(backupConfig).length,
        tags: options.tags || this.getDefaultTags(type)
      };

      // Compress if requested
      if (options.compress) {
        backup.configuration = await this.compressConfiguration(backup.configuration);
        backup.size = JSON.stringify(backup.configuration).length;
        backup.tags.push('compressed');
      }

      // Validate backup if requested
      if (options.validateBackup) {
        const validationResult = await this.validateBackup(backup);
        if (!validationResult.valid) {
          throw new Error(`Backup validation failed: ${validationResult.errors.join(', ')}`);
        }
      }

      // Store backup
      this.backups.set(backupId, backup);
      
      // Apply retention policy
      await this.applyRetentionPolicy();
      
      return backup;
    } catch (error: any) {
      throw new Error(`Backup creation failed: ${error.message}`);
    }
  }

  /**
   * Restore configuration from backup
   */
  static async restoreFromBackup(
    backupId: string,
    options: RestoreOptions = {}
  ): Promise<RestoreResult> {
    try {
      const backup = this.backups.get(backupId);
      if (!backup) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      // Validate backup integrity
      const validationResult = await this.validateBackup(backup);
      if (!validationResult.valid) {
        throw new Error(`Backup validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Create current backup before restore if requested
      let currentBackup: ConfigurationBackup | undefined;
      if (options.backupCurrent) {
        currentBackup = await this.createBackup(
          options.currentConfig!,
          { validateBackup: true },
          'pre-restore',
          options.user || 'system'
        );
      }

      // Decompress if needed
      let restoredConfig = backup.configuration;
      if (backup.tags.includes('compressed')) {
        restoredConfig = await this.decompressConfiguration(restoredConfig);
      }

      // Calculate changes
      const changes = options.currentConfig 
        ? this.calculateRestoreChanges(options.currentConfig, restoredConfig)
        : [];

      return {
        success: true,
        backup,
        restoredConfiguration: restoredConfig,
        changes,
        currentBackup,
        warnings: [],
        metadata: {
          restoredAt: new Date().toISOString(),
          restoredBy: options.user || 'system',
          backupId,
          changeCount: changes.length
        }
      };
    } catch (error: any) {
      return {
        success: false,
        backup: this.backups.get(backupId),
        restoredConfiguration: {} as SystemConfiguration,
        changes: [],
        warnings: [],
        errors: [error.message],
        metadata: {
          restoredAt: new Date().toISOString(),
          restoredBy: options.user || 'system',
          backupId,
          changeCount: 0
        }
      };
    }
  }

  /**
   * List all backups with optional filtering
   */
  static listBackups(filter?: BackupFilter): ConfigurationBackup[] {
    let backups = Array.from(this.backups.values());

    if (filter) {
      if (filter.type) {
        backups = backups.filter(b => b.type === filter.type);
      }
      if (filter.createdBy) {
        backups = backups.filter(b => b.createdBy === filter.createdBy);
      }
      if (filter.tags && filter.tags.length > 0) {
        backups = backups.filter(b => 
          filter.tags!.some(tag => b.tags.includes(tag))
        );
      }
      if (filter.startDate) {
        const startDate = new Date(filter.startDate);
        backups = backups.filter(b => new Date(b.createdAt) >= startDate);
      }
      if (filter.endDate) {
        const endDate = new Date(filter.endDate);
        backups = backups.filter(b => new Date(b.createdAt) <= endDate);
      }
    }

    // Sort by creation date (newest first)
    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return backups.slice(0, filter?.limit || 100);
  }

  /**
   * Delete a backup
   */
  static deleteBackup(backupId: string, user: string = 'system'): boolean {
    const backup = this.backups.get(backupId);
    if (!backup) {
      return false;
    }

    this.backups.delete(backupId);
    
    // Log deletion (would integrate with audit system)
    console.log(`Backup ${backupId} deleted by ${user} at ${new Date().toISOString()}`);
    
    return true;
  }

  /**
   * Create scheduled backup
   */
  static createScheduledBackup(schedule: Omit<BackupSchedule, 'id' | 'lastRun' | 'nextRun'>): BackupSchedule {
    const scheduleId = this.generateScheduleId();
    const nextRun = this.calculateNextRun(schedule.cronExpression);
    
    const fullSchedule: BackupSchedule = {
      ...schedule,
      id: scheduleId,
      nextRun
    };

    this.schedules.set(scheduleId, fullSchedule);
    return fullSchedule;
  }

  /**
   * Execute scheduled backups
   */
  static async executeScheduledBackups(currentConfig: SystemConfiguration): Promise<ScheduledBackupResult[]> {
    const results: ScheduledBackupResult[] = [];
    const now = new Date();

    for (const [scheduleId, schedule] of this.schedules.entries()) {
      if (!schedule.enabled) continue;
      
      const nextRun = new Date(schedule.nextRun);
      if (now >= nextRun) {
        try {
          const backup = await this.createBackup(
            currentConfig,
            schedule.backupOptions,
            'scheduled',
            'scheduler'
          );

          // Update schedule
          schedule.lastRun = now.toISOString();
          schedule.nextRun = this.calculateNextRun(schedule.cronExpression);
          this.schedules.set(scheduleId, schedule);

          results.push({
            scheduleId,
            scheduleName: schedule.name,
            success: true,
            backup,
            executedAt: now.toISOString()
          });

          // Send notifications if configured
          if (schedule.notifications.enabled && schedule.notifications.onSuccess) {
            await this.sendNotification(schedule.notifications, 'success', backup);
          }
        } catch (error: any) {
          results.push({
            scheduleId,
            scheduleName: schedule.name,
            success: false,
            error: error.message,
            executedAt: now.toISOString()
          });

          // Send error notifications
          if (schedule.notifications.enabled && schedule.notifications.onFailure) {
            await this.sendNotification(schedule.notifications, 'failure', undefined, error.message);
          }
        }
      }
    }

    return results;
  }

  private static generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private static generateScheduleId(): string {
    return `schedule_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private static generateBackupName(type: BackupType, timestamp: string): string {
    const date = new Date(timestamp).toISOString().slice(0, 19).replace(/[T:]/g, '-');
    return `${type}-backup-${date}`;
  }

  private static getDefaultTags(type: BackupType): string[] {
    const baseTags = [type];
    
    if (type === 'scheduled') {
      baseTags.push('automatic');
    }
    
    return baseTags;
  }

  private static removeSensitiveData(config: SystemConfiguration): SystemConfiguration {
    const cleaned = JSON.parse(JSON.stringify(config));
    
    // Remove sensitive fields
    if (cleaned.services?.neo4j?.password) {
      cleaned.services.neo4j.password = '[REDACTED]';
    }
    if (cleaned.services?.qdrant?.apiKey) {
      cleaned.services.qdrant.apiKey = '[REDACTED]';
    }
    
    return cleaned;
  }

  private static generateBackupMetadata(config: SystemConfiguration, timestamp: string): BackupMetadata {
    return {
      version: config.version,
      environment: 'unknown' as EnvironmentType, // Would be determined from context
      configurationHash: this.simpleHash(JSON.stringify(config)),
      systemInfo: {
        hostname: 'unknown',
        platform: navigator.platform,
        nodeVersion: 'unknown',
        timestamp
      },
      statistics: {
        totalFields: this.countFields(config),
        sensitiveFields: this.countSensitiveFields(config),
        customFields: 0,
        validationStatus: 'unknown'
      }
    };
  }

  private static async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataArray = encoder.encode(data);
    const hash = await crypto.subtle.digest('SHA-256', dataArray);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  private static countFields(obj: any): number {
    let count = 0;
    const traverse = (o: any) => {
      for (const key in o) {
        if (o.hasOwnProperty(key)) {
          count++;
          if (typeof o[key] === 'object' && o[key] !== null && !Array.isArray(o[key])) {
            traverse(o[key]);
          }
        }
      }
    };
    traverse(obj);
    return count;
  }

  private static countSensitiveFields(obj: any): number {
    let count = 0;
    const sensitivePatterns = ['password', 'key', 'secret', 'token'];
    
    const traverse = (o: any, path: string = '') => {
      for (const key in o) {
        if (o.hasOwnProperty(key)) {
          const currentPath = path ? `${path}.${key}` : key;
          if (sensitivePatterns.some(pattern => key.toLowerCase().includes(pattern))) {
            count++;
          }
          if (typeof o[key] === 'object' && o[key] !== null && !Array.isArray(o[key])) {
            traverse(o[key], currentPath);
          }
        }
      }
    };
    
    traverse(obj);
    return count;
  }

  private static async compressConfiguration(config: SystemConfiguration): Promise<any> {
    // Simplified compression - in real implementation, use proper compression library
    return config; // Return as-is for now
  }

  private static async decompressConfiguration(config: any): Promise<SystemConfiguration> {
    // Simplified decompression - in real implementation, use proper compression library
    return config as SystemConfiguration;
  }

  private static async validateBackup(backup: ConfigurationBackup): Promise<BackupValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check checksum
    const currentChecksum = await this.calculateChecksum(JSON.stringify(backup.configuration));
    if (currentChecksum !== backup.checksum) {
      errors.push('Backup checksum mismatch - data may be corrupted');
    }

    // Check required fields
    if (!backup.configuration.version) {
      errors.push('Configuration version is missing');
    }

    if (!backup.configuration.services) {
      errors.push('Services configuration is missing');
    }

    // Check metadata consistency
    if (backup.metadata.configurationHash !== this.simpleHash(JSON.stringify(backup.configuration))) {
      warnings.push('Configuration hash in metadata does not match current hash');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static calculateRestoreChanges(
    current: SystemConfiguration,
    restored: SystemConfiguration
  ): ConfigurationChange[] {
    const changes: ConfigurationChange[] = [];
    const timestamp = new Date().toISOString();
    
    this.compareConfigurations(current, restored, '', changes, timestamp);
    
    return changes;
  }

  private static compareConfigurations(
    current: any,
    restored: any,
    path: string,
    changes: ConfigurationChange[],
    timestamp: string
  ): void {
    const allKeys = new Set([...Object.keys(current || {}), ...Object.keys(restored || {})]);
    
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const currentValue = current?.[key];
      const restoredValue = restored?.[key];
      
      if (currentValue === undefined && restoredValue !== undefined) {
        changes.push({
          field: key,
          operation: 'add',
          newValue: restoredValue,
          path: currentPath,
          timestamp,
          user: 'restore',
          reason: 'Value added during restore'
        });
      } else if (currentValue !== undefined && restoredValue === undefined) {
        changes.push({
          field: key,
          operation: 'delete',
          oldValue: currentValue,
          path: currentPath,
          timestamp,
          user: 'restore',
          reason: 'Value removed during restore'
        });
      } else if (typeof currentValue === 'object' && typeof restoredValue === 'object' &&
                 currentValue !== null && restoredValue !== null &&
                 !Array.isArray(currentValue) && !Array.isArray(restoredValue)) {
        this.compareConfigurations(currentValue, restoredValue, currentPath, changes, timestamp);
      } else if (currentValue !== restoredValue) {
        changes.push({
          field: key,
          operation: 'update',
          oldValue: currentValue,
          newValue: restoredValue,
          path: currentPath,
          timestamp,
          user: 'restore',
          reason: 'Value changed during restore'
        });
      }
    }
  }

  private static calculateNextRun(cronExpression: string): string {
    // Simplified cron calculation - in real implementation, use proper cron library
    const now = new Date();
    
    // For demo purposes, just add 1 hour to current time
    // Real implementation would parse cron expression properly
    const nextRun = new Date(now.getTime() + 60 * 60 * 1000);
    
    return nextRun.toISOString();
  }

  private static async sendNotification(
    settings: NotificationSettings,
    type: 'success' | 'failure',
    backup?: ConfigurationBackup,
    error?: string
  ): Promise<void> {
    // Simplified notification - in real implementation, integrate with actual notification services
    console.log(`Notification: Backup ${type}`, { backup: backup?.id, error });
  }

  private static async applyRetentionPolicy(): Promise<void> {
    // Simplified retention policy - in real implementation, implement proper policy logic
    if (this.backups.size > 100) {
      const oldestBackups = Array.from(this.backups.values())
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(0, this.backups.size - 100);
      
      oldestBackups.forEach(backup => {
        this.backups.delete(backup.id);
      });
    }
  }
}

// =============================================================================
// Configuration Version Management
// =============================================================================

export class ConfigurationVersionManager {
  private static versions: Map<string, ConfigurationVersion> = new Map();
  private static activeVersion: string | null = null;

  /**
   * Create a new configuration version
   */
  static createVersion(
    config: SystemConfiguration,
    options: CreateVersionOptions
  ): ConfigurationVersion {
    const versionId = this.generateVersionId();
    const timestamp = new Date().toISOString();
    
    // Calculate changes from parent version
    const changes = options.parentVersionId 
      ? this.calculateVersionChanges(options.parentVersionId, config)
      : [];

    const version: ConfigurationVersion = {
      id: versionId,
      version: options.version,
      name: options.name,
      description: options.description,
      createdAt: timestamp,
      createdBy: options.user,
      configuration: config,
      changes,
      parentVersion: options.parentVersionId,
      tags: options.tags || [],
      status: options.status || 'draft',
      metadata: this.generateVersionMetadata(config, changes)
    };

    this.versions.set(versionId, version);
    
    return version;
  }

  /**
   * Activate a configuration version
   */
  static activateVersion(versionId: string): boolean {
    const version = this.versions.get(versionId);
    if (!version) {
      return false;
    }

    // Deactivate current active version
    if (this.activeVersion) {
      const currentActive = this.versions.get(this.activeVersion);
      if (currentActive) {
        currentActive.status = 'archived';
        this.versions.set(this.activeVersion, currentActive);
      }
    }

    // Activate new version
    version.status = 'active';
    this.activeVersion = versionId;
    this.versions.set(versionId, version);

    return true;
  }

  /**
   * Compare two configuration versions
   */
  static compareVersions(
    sourceVersionId: string,
    targetVersionId: string
  ): VersionComparison | null {
    const sourceVersion = this.versions.get(sourceVersionId);
    const targetVersion = this.versions.get(targetVersionId);
    
    if (!sourceVersion || !targetVersion) {
      return null;
    }

    const changes = this.calculateConfigurationChanges(
      sourceVersion.configuration,
      targetVersion.configuration
    );

    const summary = this.generateComparisonSummary(changes);
    const compatibility = this.assessCompatibility(changes);
    const migration = this.generateMigrationInfo(changes);

    return {
      sourceVersion: sourceVersion.version,
      targetVersion: targetVersion.version,
      changes,
      summary,
      compatibility,
      migration
    };
  }

  /**
   * Get version history
   */
  static getVersionHistory(limit: number = 50): ConfigurationVersion[] {
    return Array.from(this.versions.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Get active version
   */
  static getActiveVersion(): ConfigurationVersion | null {
    return this.activeVersion ? this.versions.get(this.activeVersion) || null : null;
  }

  private static generateVersionId(): string {
    return `version_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private static generateVersionMetadata(
    config: SystemConfiguration,
    changes: ConfigurationChange[]
  ): VersionMetadata {
    const majorChange = changes.some(c => this.isMajorChange(c));
    const breakingChange = changes.some(c => this.isBreakingChange(c));

    return {
      changeCount: changes.length,
      majorChange,
      breakingChange,
      migrationRequired: breakingChange,
      compatibilityVersion: config.version,
      validationStatus: 'valid' // Would be validated in real implementation
    };
  }

  private static calculateVersionChanges(
    parentVersionId: string,
    config: SystemConfiguration
  ): ConfigurationChange[] {
    const parentVersion = this.versions.get(parentVersionId);
    if (!parentVersion) {
      return [];
    }

    return this.calculateConfigurationChanges(parentVersion.configuration, config);
  }

  private static calculateConfigurationChanges(
    before: SystemConfiguration,
    after: SystemConfiguration
  ): ConfigurationChange[] {
    const changes: ConfigurationChange[] = [];
    const timestamp = new Date().toISOString();
    
    this.compareConfigObjects(before, after, '', changes, timestamp);
    
    return changes;
  }

  private static compareConfigObjects(
    before: any,
    after: any,
    path: string,
    changes: ConfigurationChange[],
    timestamp: string
  ): void {
    const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
    
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const beforeValue = before?.[key];
      const afterValue = after?.[key];
      
      if (beforeValue === undefined && afterValue !== undefined) {
        changes.push({
          field: key,
          operation: 'add',
          newValue: afterValue,
          path: currentPath,
          timestamp,
          user: 'version-manager'
        });
      } else if (beforeValue !== undefined && afterValue === undefined) {
        changes.push({
          field: key,
          operation: 'delete',
          oldValue: beforeValue,
          path: currentPath,
          timestamp,
          user: 'version-manager'
        });
      } else if (typeof beforeValue === 'object' && typeof afterValue === 'object' &&
                 beforeValue !== null && afterValue !== null &&
                 !Array.isArray(beforeValue) && !Array.isArray(afterValue)) {
        this.compareConfigObjects(beforeValue, afterValue, currentPath, changes, timestamp);
      } else if (beforeValue !== afterValue) {
        changes.push({
          field: key,
          operation: 'update',
          oldValue: beforeValue,
          newValue: afterValue,
          path: currentPath,
          timestamp,
          user: 'version-manager'
        });
      }
    }
  }

  private static isMajorChange(change: ConfigurationChange): boolean {
    const majorFields = ['services', 'api.port', 'security'];
    return majorFields.some(field => change.path.startsWith(field));
  }

  private static isBreakingChange(change: ConfigurationChange): boolean {
    const breakingPatterns = [
      'api.port',
      'services.*.url',
      'services.*.uri',
      'security.https.enabled'
    ];
    
    return breakingPatterns.some(pattern => {
      const regex = new RegExp(pattern.replace('*', '[^.]+'));
      return regex.test(change.path);
    });
  }

  private static generateComparisonSummary(changes: ConfigurationChange[]) {
    const additions = changes.filter(c => c.operation === 'add').length;
    const modifications = changes.filter(c => c.operation === 'update').length;
    const deletions = changes.filter(c => c.operation === 'delete').length;
    const majorChanges = changes.filter(c => this.isMajorChange(c)).length;
    const breakingChanges = changes.filter(c => this.isBreakingChange(c)).length;
    
    const affectedSections = [...new Set(
      changes.map(c => c.path.split('.')[0])
    )];

    return {
      totalChanges: changes.length,
      additions,
      modifications,
      deletions,
      majorChanges,
      breakingChanges,
      affectedSections
    };
  }

  private static assessCompatibility(changes: ConfigurationChange[]) {
    const breakingChanges = changes.filter(c => this.isBreakingChange(c));
    const majorChanges = changes.filter(c => this.isMajorChange(c));
    
    let level: 'patch' | 'minor' | 'major' | 'breaking' = 'patch';
    
    if (breakingChanges.length > 0) {
      level = 'breaking';
    } else if (majorChanges.length > 0) {
      level = 'major';
    } else if (changes.some(c => c.operation === 'add')) {
      level = 'minor';
    }

    return {
      compatible: level !== 'breaking',
      level,
      issues: [], // Would be populated with actual compatibility issues
      warnings: breakingChanges.map(c => `Breaking change in ${c.path}`)
    };
  }

  private static generateMigrationInfo(changes: ConfigurationChange[]) {
    const breakingChanges = changes.filter(c => this.isBreakingChange(c));
    const required = breakingChanges.length > 0;
    
    return {
      required,
      automatic: false, // Manual migration required for breaking changes
      migrationSteps: [], // Would be populated with actual migration steps
      estimatedDuration: required ? 30 : 0, // minutes
      rollbackPossible: true
    };
  }
}

// Type definitions
interface RestoreOptions {
  currentConfig?: SystemConfiguration;
  backupCurrent?: boolean;
  user?: string;
}

interface RestoreResult {
  success: boolean;
  backup?: ConfigurationBackup;
  restoredConfiguration: SystemConfiguration;
  changes: ConfigurationChange[];
  currentBackup?: ConfigurationBackup;
  warnings: string[];
  errors?: string[];
  metadata: {
    restoredAt: string;
    restoredBy: string;
    backupId: string;
    changeCount: number;
  };
}

interface BackupFilter {
  type?: BackupType;
  createdBy?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  limit?: number;
}

interface BackupValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface ScheduledBackupResult {
  scheduleId: string;
  scheduleName: string;
  success: boolean;
  backup?: ConfigurationBackup;
  error?: string;
  executedAt: string;
}

interface CreateVersionOptions {
  version: string;
  name?: string;
  description?: string;
  user: string;
  parentVersionId?: string;
  tags?: string[];
  status?: VersionStatus;
}

// Export utilities
export default {
  ConfigurationBackupManager,
  ConfigurationVersionManager
};