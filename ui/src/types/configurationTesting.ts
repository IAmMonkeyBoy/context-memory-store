/**
 * Configuration Testing Framework Types
 * Phase 7.4.4 - Types for configuration testing, validation, and quality assurance
 */

import type { SystemConfiguration, EnvironmentType } from './configuration';

// =============================================================================
// Core Testing Types
// =============================================================================

export interface ConfigurationTest {
  id: string;
  name: string;
  description: string;
  category: TestCategory;
  priority: TestPriority;
  timeout: number;
  dependencies: string[]; // Other test IDs this test depends on
  execute: (config: SystemConfiguration, context?: TestContext) => Promise<TestResult>;
  cleanup?: (config: SystemConfiguration, context?: TestContext) => Promise<void>;
}

export type TestCategory = 'connectivity' | 'performance' | 'security' | 'validation' | 'integration';
export type TestPriority = 'critical' | 'high' | 'medium' | 'low';
export type TestSeverity = 'error' | 'warning' | 'info' | 'success';

export interface TestResult {
  testId: string;
  passed: boolean;
  duration: number;
  timestamp: string;
  message: string;
  details?: any;
  suggestions?: string[];
  severity: TestSeverity;
  metrics?: TestMetrics;
}

export interface TestMetrics {
  responseTime?: number;
  throughput?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  errorRate?: number;
  availability?: number;
  score?: number;
}

export interface TestContext {
  environment: EnvironmentType;
  previousConfig?: SystemConfiguration;
  testData?: Record<string, any>;
  requestId: string;
  userId?: string;
}

// =============================================================================
// Test Suites and Execution
// =============================================================================

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: ConfigurationTest[];
  environment?: EnvironmentType;
  schedule?: TestSchedule;
  lastRun?: string;
  successRate?: number;
  tags?: string[];
}

export interface TestSchedule {
  enabled: boolean;
  frequency: TestFrequency;
  cron?: string;
  conditions?: TestCondition[];
  notifications?: NotificationSettings;
}

export type TestFrequency = 'continuous' | 'hourly' | 'daily' | 'weekly' | 'on-change' | 'manual';

export interface TestCondition {
  type: 'config-change' | 'time-based' | 'event-triggered' | 'threshold-based';
  parameters: Record<string, any>;
}

export interface NotificationSettings {
  onFailure: boolean;
  onSuccess: boolean;
  onThreshold: boolean;
  channels: NotificationChannel[];
}

export type NotificationChannel = 'email' | 'webhook' | 'ui' | 'log';

// =============================================================================
// Test Execution and Results
// =============================================================================

export interface TestExecution {
  id: string;
  suiteId?: string;
  testIds: string[];
  status: ExecutionStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  results: TestResult[];
  summary: ExecutionSummary;
  context: TestContext;
  triggeredBy: string;
}

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ExecutionSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  successRate: number;
  criticalFailures: number;
  overallHealth: HealthScore;
}

export interface HealthScore {
  score: number; // 0-100
  grade: HealthGrade;
  factors: HealthFactor[];
  recommendations: string[];
}

export type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface HealthFactor {
  category: string;
  score: number;
  weight: number;
  impact: string;
  details: string;
}

// =============================================================================
// Validation Framework
// =============================================================================

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: ValidationCategory;
  severity: TestSeverity;
  validate: (config: SystemConfiguration, context?: ValidationContext) => Promise<ValidationResult>;
}

export type ValidationCategory = 'schema' | 'security' | 'performance' | 'compatibility' | 'best-practices';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  score: number;
}

export interface ValidationError {
  path: string;
  message: string;
  severity: TestSeverity;
  code?: string;
  fixes?: string[];
}

export interface ValidationWarning {
  path: string;
  message: string;
  impact: string;
  recommendation: string;
}

export interface ValidationSuggestion {
  path: string;
  message: string;
  benefit: string;
  effort: 'low' | 'medium' | 'high';
}

export interface ValidationContext {
  environment: EnvironmentType;
  strict: boolean;
  customRules?: ValidationRule[];
}

// =============================================================================
// Analytics and Reporting
// =============================================================================

export interface TestAnalytics {
  testId: string;
  history: TestHistoryEntry[];
  trends: TestTrend[];
  statistics: TestStatistics;
  insights: TestInsight[];
}

export interface TestHistoryEntry {
  timestamp: string;
  result: TestResult;
  configuration?: Partial<SystemConfiguration>;
  environment: EnvironmentType;
}

export interface TestTrend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  change: number;
  period: string;
  significance: 'high' | 'medium' | 'low';
}

export interface TestStatistics {
  successRate: number;
  averageDuration: number;
  failurePattern: string[];
  commonIssues: string[];
  improvementSuggestions: string[];
}

export interface TestInsight {
  type: 'performance' | 'reliability' | 'security' | 'optimization';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action: string;
  priority: number;
}

// =============================================================================
// Configuration Quality Assessment
// =============================================================================

export interface ConfigurationQuality {
  overallScore: number;
  grade: HealthGrade;
  dimensions: QualityDimension[];
  recommendations: QualityRecommendation[];
  riskFactors: RiskFactor[];
  complianceStatus: ComplianceStatus;
}

export interface QualityDimension {
  name: string;
  score: number;
  weight: number;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  details: string;
  improvements: string[];
}

export interface QualityRecommendation {
  id: string;
  priority: TestPriority;
  category: string;
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  steps: string[];
}

export interface RiskFactor {
  id: string;
  severity: TestSeverity;
  category: string;
  description: string;
  likelihood: number; // 0-100
  impact: number; // 0-100
  mitigation: string[];
}

export interface ComplianceStatus {
  overall: boolean;
  standards: ComplianceStandard[];
  violations: ComplianceViolation[];
  recommendations: string[];
}

export interface ComplianceStandard {
  name: string;
  version: string;
  compliant: boolean;
  score: number;
  requirements: ComplianceRequirement[];
}

export interface ComplianceRequirement {
  id: string;
  description: string;
  status: 'compliant' | 'non-compliant' | 'partially-compliant' | 'not-applicable';
  details: string;
}

export interface ComplianceViolation {
  standardId: string;
  requirementId: string;
  severity: TestSeverity;
  description: string;
  remediation: string[];
}

// =============================================================================
// Dashboard and UI Types
// =============================================================================

export interface TestingDashboardState {
  selectedSuite?: string;
  selectedCategory: TestCategory | 'all';
  activeExecution?: string;
  filters: TestFilters;
  viewMode: TestViewMode;
  autoRefresh: boolean;
  refreshInterval: number;
}

export interface TestFilters {
  categories: TestCategory[];
  priorities: TestPriority[];
  statuses: ExecutionStatus[];
  timeRange: TimeRange;
  searchQuery: string;
}

export interface TimeRange {
  start: string;
  end: string;
  preset?: 'last-hour' | 'last-day' | 'last-week' | 'last-month' | 'custom';
}

export type TestViewMode = 'grid' | 'list' | 'timeline' | 'analytics';

export interface TestDisplayOptions {
  showDetails: boolean;
  showMetrics: boolean;
  showSuggestions: boolean;
  groupBy: 'category' | 'priority' | 'status' | 'none';
  sortBy: 'name' | 'duration' | 'timestamp' | 'success-rate';
  sortOrder: 'asc' | 'desc';
}

// =============================================================================
// Error and Exception Types
// =============================================================================

export interface TestExecutionError {
  testId: string;
  error: string;
  stack?: string;
  context?: any;
  timestamp: string;
  recoverable: boolean;
}

export interface ValidationException {
  rule: string;
  path: string;
  value: any;
  message: string;
  code?: string;
}

// =============================================================================
// Integration Types
// =============================================================================

export interface TestingIntegration {
  name: string;
  type: 'webhook' | 'api' | 'notification' | 'monitoring';
  config: Record<string, any>;
  events: IntegrationEvent[];
  enabled: boolean;
}

export interface IntegrationEvent {
  trigger: 'test-start' | 'test-complete' | 'test-failure' | 'health-change';
  action: string;
  parameters: Record<string, any>;
}

// =============================================================================
// Export all types
// =============================================================================

export type {
  // Re-export from configuration types for convenience
  SystemConfiguration,
  EnvironmentType
};