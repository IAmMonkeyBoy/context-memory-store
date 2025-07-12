/**
 * Configuration Import/Export & Security Types
 * Phase 7.4.5 - Types for configuration management, import/export, and security features
 */

import type { SystemConfiguration } from './configuration';
import type { EnvironmentType } from './configurationProfiles';

// =============================================================================
// Import/Export Types
// =============================================================================

export type ConfigurationFormat = 'json' | 'yaml' | 'toml' | 'env' | 'xml';

export type ExportScope = 'full' | 'services' | 'features' | 'security' | 'monitoring' | 'custom';

export interface ConfigurationExportOptions {
  format: ConfigurationFormat;
  scope: ExportScope;
  includeComments: boolean;
  includeSensitive: boolean;
  maskSensitive: boolean;
  customFields?: string[];
  excludeFields?: string[];
  minifyOutput: boolean;
  validateExport: boolean;
}

export interface ConfigurationImportOptions {
  format: ConfigurationFormat;
  mergeStrategy: MergeStrategy;
  validateImport: boolean;
  backupBeforeImport: boolean;
  skipValidation: boolean;
  dryRun: boolean;
  conflictResolution: ConflictResolution;
  customMappings?: Record<string, string>;
}

export type MergeStrategy = 'replace' | 'merge' | 'preserve' | 'selective';

export type ConflictResolution = 'abort' | 'skip' | 'overwrite' | 'prompt' | 'merge';

export interface ExportResult {
  success: boolean;
  format: ConfigurationFormat;
  data: string | object;
  metadata: ExportMetadata;
  warnings: string[];
  errors: string[];
  size: number;
  checksum: string;
}

export interface ExportMetadata {
  exportedAt: string;
  exportedBy: string;
  sourceVersion: string;
  format: ConfigurationFormat;
  scope: ExportScope;
  fieldCount: number;
  sensitiveFields: string[];
  maskedFields: string[];
  originalChecksum: string;
}

export interface ImportResult {
  success: boolean;
  imported: boolean;
  skipped: boolean;
  conflicts: ConfigurationConflict[];
  changes: ConfigurationChange[];
  warnings: string[];
  errors: string[];
  metadata: ImportMetadata;
  rollbackData?: ConfigurationBackup;
}

export interface ImportMetadata {
  importedAt: string;
  importedBy: string;
  sourceFormat: ConfigurationFormat;
  targetVersion: string;
  mergeStrategy: MergeStrategy;
  fieldCount: number;
  changedFields: number;
  conflictCount: number;
  backupCreated: boolean;
}

export interface ConfigurationConflict {
  field: string;
  currentValue: any;
  importValue: any;
  resolution: ConflictResolution;
  resolved: boolean;
  userChoice?: any;
  metadata: {
    path: string;
    type: string;
    sensitive: boolean;
    required: boolean;
  };
}

export interface ConfigurationChange {
  field: string;
  operation: 'add' | 'update' | 'delete';
  oldValue?: any;
  newValue?: any;
  path: string;
  timestamp: string;
  user: string;
  reason?: string;
}

// =============================================================================
// Security Types
// =============================================================================

export type EncryptionAlgorithm = 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305';

export type KeyDerivationFunction = 'pbkdf2' | 'scrypt' | 'argon2id';

export interface SecurityConfiguration {
  encryption: EncryptionSettings;
  accessControl: AccessControlSettings;
  auditLogging: AuditLoggingSettings;
  secretsManagement: SecretsManagementSettings;
  compliance: ComplianceSettings;
}

export interface EncryptionSettings {
  enabled: boolean;
  algorithm: EncryptionAlgorithm;
  keyDerivation: KeyDerivationFunction;
  keySize: number;
  iterationCount: number;
  saltLength: number;
  encryptSensitiveFields: boolean;
  encryptionFields: string[];
  rotationPolicy: {
    enabled: boolean;
    intervalDays: number;
    autoRotate: boolean;
  };
}

export interface AccessControlSettings {
  enabled: boolean;
  requireAuthentication: boolean;
  roleBasedAccess: boolean;
  allowedUsers: string[];
  allowedRoles: string[];
  adminUsers: string[];
  readOnlyUsers: string[];
  sessionTimeout: number;
  maxFailedAttempts: number;
  lockoutDuration: number;
}

export interface AuditLoggingSettings {
  enabled: boolean;
  logLevel: 'minimal' | 'standard' | 'detailed' | 'verbose';
  logConfigChanges: boolean;
  logAccess: boolean;
  logAuthentication: boolean;
  logExportImport: boolean;
  retentionDays: number;
  logFormat: 'json' | 'csv' | 'syslog';
  destination: 'file' | 'database' | 'external';
  externalEndpoint?: string;
}

export interface SecretsManagementSettings {
  provider: 'internal' | 'vault' | 'aws-secrets' | 'azure-keyvault' | 'kubernetes';
  vaultConfig?: {
    endpoint: string;
    token?: string;
    namespace?: string;
    path: string;
  };
  awsConfig?: {
    region: string;
    secretsPrefix: string;
    kmsKeyId?: string;
  };
  azureConfig?: {
    vaultUrl: string;
    clientId: string;
    tenantId: string;
  };
  kubernetesConfig?: {
    namespace: string;
    secretName: string;
  };
  autoRefresh: boolean;
  refreshInterval: number;
  cacheDuration: number;
}

export interface ComplianceSettings {
  standards: ComplianceStandard[];
  dataClassification: DataClassificationSettings;
  dataRetention: DataRetentionSettings;
  encryptionCompliance: boolean;
  auditCompliance: boolean;
  accessControlCompliance: boolean;
}

export type ComplianceStandard = 'gdpr' | 'hipaa' | 'pci-dss' | 'sox' | 'iso27001' | 'custom';

export interface DataClassificationSettings {
  enabled: boolean;
  categories: DataCategory[];
  autoClassify: boolean;
  classificationRules: ClassificationRule[];
}

export interface DataCategory {
  name: string;
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  description: string;
  encryptionRequired: boolean;
  accessRestrictions: string[];
  retentionPeriod: number;
}

export interface ClassificationRule {
  field: string;
  pattern: string;
  category: string;
  confidence: number;
  action: 'classify' | 'encrypt' | 'mask' | 'alert';
}

export interface DataRetentionSettings {
  enabled: boolean;
  defaultRetentionDays: number;
  categoryRetention: Record<string, number>;
  autoCleanup: boolean;
  cleanupSchedule: string;
  archiveBeforeDelete: boolean;
  archiveLocation: string;
}

// =============================================================================
// Backup & Versioning Types
// =============================================================================

export interface ConfigurationBackup {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  type: BackupType;
  configuration: SystemConfiguration;
  metadata: BackupMetadata;
  encrypted: boolean;
  checksum: string;
  size: number;
  tags: string[];
}

export type BackupType = 'manual' | 'scheduled' | 'pre-import' | 'pre-update' | 'migration';

export interface BackupMetadata {
  version: string;
  environment: EnvironmentType;
  configurationHash: string;
  systemInfo: {
    hostname: string;
    platform: string;
    nodeVersion: string;
    timestamp: string;
  };
  statistics: {
    totalFields: number;
    sensitiveFields: number;
    customFields: number;
    validationStatus: 'valid' | 'invalid' | 'unknown';
  };
}

export interface BackupSchedule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  cronExpression: string;
  retentionPolicy: RetentionPolicy;
  backupOptions: BackupOptions;
  notifications: NotificationSettings;
  lastRun?: string;
  nextRun: string;
}

export interface RetentionPolicy {
  keepDaily: number;
  keepWeekly: number;
  keepMonthly: number;
  keepYearly: number;
  maxBackups: number;
  autoCleanup: boolean;
}

export interface BackupOptions {
  includeSecrets: boolean;
  compress: boolean;
  encrypt: boolean;
  validateBackup: boolean;
  includeMetadata: boolean;
  customName?: string;
  tags: string[];
}

export interface NotificationSettings {
  enabled: boolean;
  onSuccess: boolean;
  onFailure: boolean;
  channels: NotificationChannel[];
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, any>;
  enabled: boolean;
}

// =============================================================================
// Version Management Types
// =============================================================================

export interface ConfigurationVersion {
  id: string;
  version: string;
  name?: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  configuration: SystemConfiguration;
  changes: ConfigurationChange[];
  parentVersion?: string;
  tags: string[];
  status: VersionStatus;
  metadata: VersionMetadata;
}

export type VersionStatus = 'draft' | 'active' | 'archived' | 'deprecated';

export interface VersionMetadata {
  changeCount: number;
  majorChange: boolean;
  breakingChange: boolean;
  migrationRequired: boolean;
  compatibilityVersion: string;
  validationStatus: 'valid' | 'invalid' | 'warning';
  deploymentStatus?: 'pending' | 'deployed' | 'failed' | 'rolled-back';
}

export interface VersionComparison {
  sourceVersion: string;
  targetVersion: string;
  changes: ConfigurationChange[];
  summary: ComparisonSummary;
  compatibility: CompatibilityInfo;
  migration: MigrationInfo;
}

export interface ComparisonSummary {
  totalChanges: number;
  additions: number;
  modifications: number;
  deletions: number;
  majorChanges: number;
  breakingChanges: number;
  affectedSections: string[];
}

export interface CompatibilityInfo {
  compatible: boolean;
  level: 'patch' | 'minor' | 'major' | 'breaking';
  issues: CompatibilityIssue[];
  warnings: string[];
}

export interface CompatibilityIssue {
  field: string;
  type: 'removed' | 'type-changed' | 'required-added' | 'validation-changed';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  migration?: string;
}

export interface MigrationInfo {
  required: boolean;
  automatic: boolean;
  migrationSteps: MigrationStep[];
  estimatedDuration: number;
  rollbackPossible: boolean;
}

export interface MigrationStep {
  id: string;
  name: string;
  description: string;
  type: 'rename' | 'transform' | 'validate' | 'custom';
  automatic: boolean;
  reversible: boolean;
  config: Record<string, any>;
}

// =============================================================================
// Optimization & Recommendations Types
// =============================================================================

export interface ConfigurationOptimization {
  recommendations: OptimizationRecommendation[];
  performance: PerformanceOptimization;
  security: SecurityOptimization;
  maintenance: MaintenanceOptimization;
  cost: CostOptimization;
  summary: OptimizationSummary;
}

export interface OptimizationRecommendation {
  id: string;
  type: RecommendationType;
  category: 'performance' | 'security' | 'maintenance' | 'cost' | 'compliance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: ImpactAssessment;
  implementation: ImplementationGuide;
  field?: string;
  currentValue?: any;
  recommendedValue?: any;
  estimatedBenefit: string;
  effort: 'low' | 'medium' | 'high';
}

export type RecommendationType = 
  | 'configuration-change'
  | 'security-improvement'
  | 'performance-tuning'
  | 'resource-optimization'
  | 'maintenance-task'
  | 'compliance-fix'
  | 'best-practice';

export interface ImpactAssessment {
  performance: number; // -100 to 100
  security: number;
  maintenance: number;
  cost: number;
  user_experience: number;
  description: string;
  risks: string[];
  benefits: string[];
}

export interface ImplementationGuide {
  steps: string[];
  prerequisites: string[];
  commands?: string[];
  configChanges?: Record<string, any>;
  testingSteps: string[];
  rollbackPlan: string[];
  estimatedTime: number; // minutes
}

export interface PerformanceOptimization {
  score: number; // 0-100
  bottlenecks: PerformanceBottleneck[];
  improvements: PerformanceImprovement[];
  benchmarks: PerformanceBenchmark[];
}

export interface PerformanceBottleneck {
  component: string;
  issue: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  estimatedImprovement: string;
}

export interface PerformanceImprovement {
  area: string;
  current: number;
  potential: number;
  unit: string;
  confidence: number;
}

export interface PerformanceBenchmark {
  metric: string;
  current: number;
  target: number;
  industry_average: number;
  unit: string;
  status: 'below' | 'meeting' | 'exceeding';
}

export interface SecurityOptimization {
  score: number; // 0-100
  vulnerabilities: SecurityVulnerability[];
  improvements: SecurityImprovement[];
  compliance: ComplianceStatus[];
}

export interface SecurityVulnerability {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affected_components: string[];
  remediation: string;
  cve_references?: string[];
}

export interface SecurityImprovement {
  area: string;
  current_status: string;
  recommended_action: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  compliance_impact: string[];
}

export interface ComplianceStatus {
  standard: ComplianceStandard;
  status: 'compliant' | 'non-compliant' | 'partial' | 'unknown';
  score: number;
  issues: string[];
  recommendations: string[];
}

export interface MaintenanceOptimization {
  score: number; // 0-100
  tasks: MaintenanceTask[];
  schedule: MaintenanceSchedule;
  automation: AutomationOpportunity[];
}

export interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  frequency: string;
  last_performed?: string;
  next_due: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  automated: boolean;
  estimated_duration: number;
}

export interface MaintenanceSchedule {
  daily: MaintenanceTask[];
  weekly: MaintenanceTask[];
  monthly: MaintenanceTask[];
  quarterly: MaintenanceTask[];
  yearly: MaintenanceTask[];
}

export interface AutomationOpportunity {
  task: string;
  current_effort: number; // hours per month
  potential_savings: number; // hours per month
  implementation_effort: number; // hours
  roi_months: number;
  feasibility: 'high' | 'medium' | 'low';
}

export interface CostOptimization {
  score: number; // 0-100
  savings: CostSaving[];
  usage: ResourceUsage[];
  recommendations: CostRecommendation[];
}

export interface CostSaving {
  area: string;
  current_cost: number;
  potential_savings: number;
  implementation_cost: number;
  payback_period: number; // months
  confidence: number;
}

export interface ResourceUsage {
  resource: string;
  current_usage: number;
  capacity: number;
  utilization: number;
  cost_per_unit: number;
  optimization_potential: number;
}

export interface CostRecommendation {
  category: string;
  recommendation: string;
  potential_savings: number;
  implementation_effort: 'low' | 'medium' | 'high';
  risk_level: 'low' | 'medium' | 'high';
}

export interface OptimizationSummary {
  overall_score: number; // 0-100
  total_recommendations: number;
  critical_issues: number;
  estimated_savings: {
    performance: string;
    cost: number;
    time: number; // hours per month
  };
  implementation_effort: {
    total_hours: number;
    priority_hours: number;
    quick_wins: number;
  };
  risk_assessment: {
    low_risk: number;
    medium_risk: number;
    high_risk: number;
  };
}

// =============================================================================
// Health Monitoring Types
// =============================================================================

export interface ConfigurationHealth {
  overall: HealthStatus;
  components: ComponentHealth[];
  metrics: HealthMetrics;
  alerts: HealthAlert[];
  trends: HealthTrend[];
  recommendations: string[];
  lastChecked: string;
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  message: string;
  uptime: number; // percentage
  availability: number; // percentage
}

export interface ComponentHealth {
  component: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  score: number;
  metrics: Record<string, number>;
  lastCheck: string;
  issues: string[];
  dependencies: string[];
}

export interface HealthMetrics {
  response_time: number;
  error_rate: number;
  throughput: number;
  resource_usage: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  configuration_drift: number;
  security_score: number;
  compliance_score: number;
}

export interface HealthAlert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  component: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
  duration?: number;
  threshold: {
    metric: string;
    value: number;
    operator: '>' | '<' | '=' | '!=' | '>=' | '<=';
  };
}

export interface HealthTrend {
  metric: string;
  period: string;
  trend: 'improving' | 'stable' | 'degrading';
  change: number; // percentage
  data_points: HealthDataPoint[];
  forecast?: HealthForecast;
}

export interface HealthDataPoint {
  timestamp: string;
  value: number;
  context?: Record<string, any>;
}

export interface HealthForecast {
  predicted_value: number;
  confidence: number;
  time_horizon: string;
  methodology: string;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ConfigurationImportExportResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  errors: string[];
  warnings: string[];
  metadata: {
    timestamp: string;
    operation: string;
    user: string;
    duration: number;
  };
}

export interface BatchOperationResult {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  results: (ExportResult | ImportResult)[];
  summary: {
    duration: number;
    errors: string[];
    warnings: string[];
  };
}