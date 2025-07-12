/**
 * Configuration Profiles Types
 * Phase 7.4.3 - Types for configuration profile and environment management
 */

import type { SystemConfiguration } from './configuration';

// =============================================================================
// Profile Management Types
// =============================================================================

export interface ConfigurationProfile {
  id: string;
  name: string;
  description: string;
  environment: EnvironmentType;
  category: ProfileCategory;
  isDefault: boolean;
  isActive: boolean;
  isReadOnly: boolean;
  configuration: SystemConfiguration;
  metadata: ProfileMetadata;
  inheritanceChain?: string[]; // Parent profile IDs
  tags: string[];
  createdAt: string;
  updatedAt: string;
  version: string;
}

export type EnvironmentType = 
  | 'development' 
  | 'staging' 
  | 'testing' 
  | 'production' 
  | 'local' 
  | 'demo' 
  | 'custom';

export type ProfileCategory = 
  | 'base' 
  | 'feature' 
  | 'environment' 
  | 'custom' 
  | 'template';

export interface ProfileMetadata {
  author: string;
  purpose: string;
  compatibleVersions: string[];
  dependencies: string[];
  warnings: string[];
  migrationNotes?: string;
  lastValidated?: string;
  validationStatus: 'valid' | 'warning' | 'error' | 'unknown';
  checksum: string;
}

// =============================================================================
// Profile Operations Types
// =============================================================================

export interface ProfileComparison {
  profileA: ConfigurationProfile;
  profileB: ConfigurationProfile;
  differences: ProfileDifference[];
  summary: ComparisonSummary;
  compatibility: CompatibilityStatus;
}

export interface ProfileDifference {
  path: string;
  type: 'added' | 'removed' | 'changed' | 'conflict';
  valueA?: any;
  valueB?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  category: 'configuration' | 'metadata' | 'inheritance';
  recommendation?: string;
}

export interface ComparisonSummary {
  totalDifferences: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  affectedSections: string[];
  compatibilityScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CompatibilityStatus {
  isCompatible: boolean;
  issues: CompatibilityIssue[];
  warnings: string[];
  blockers: string[];
  canMigrate: boolean;
  migrationComplexity: 'simple' | 'moderate' | 'complex';
}

export interface CompatibilityIssue {
  type: 'version' | 'dependency' | 'configuration' | 'feature';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  path?: string;
  solution?: string;
}

// =============================================================================
// Profile Inheritance Types
// =============================================================================

export interface ProfileInheritance {
  profileId: string;
  parentId: string;
  inheritanceType: InheritanceType;
  overrides: ConfigurationOverride[];
  conflicts: InheritanceConflict[];
  resolutionStrategy: ConflictResolution;
}

export type InheritanceType = 
  | 'full' 
  | 'partial' 
  | 'override' 
  | 'merge';

export interface ConfigurationOverride {
  path: string;
  originalValue: any;
  overrideValue: any;
  reason: string;
  priority: number;
  source: 'user' | 'system' | 'migration' | 'template';
}

export interface InheritanceConflict {
  path: string;
  conflictingValues: ConflictingValue[];
  resolutionStrategy: ConflictResolution;
  severity: 'low' | 'medium' | 'high';
  autoResolvable: boolean;
}

export interface ConflictingValue {
  source: string;
  value: any;
  priority: number;
  reason?: string;
}

export type ConflictResolution = 
  | 'use_parent' 
  | 'use_child' 
  | 'merge' 
  | 'manual' 
  | 'latest' 
  | 'highest_priority';

// =============================================================================
// Profile Validation Types
// =============================================================================

export interface ProfileValidationResult {
  isValid: boolean;
  errors: ProfileValidationError[];
  warnings: ProfileValidationWarning[];
  score: number; // 0-100
  validatedAt: string;
  validatedBy: string;
  recommendations: string[];
}

export interface ProfileValidationError {
  code: string;
  message: string;
  path: string;
  severity: 'error' | 'critical';
  category: 'configuration' | 'inheritance' | 'compatibility' | 'security';
  fixable: boolean;
  suggestedFix?: string;
}

export interface ProfileValidationWarning {
  code: string;
  message: string;
  path?: string;
  category: 'performance' | 'compatibility' | 'best_practice' | 'security';
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
}

// =============================================================================
// Profile Export/Import Types
// =============================================================================

export interface ProfileExportOptions {
  format: 'json' | 'yaml' | 'zip';
  includeMetadata: boolean;
  includeInheritance: boolean;
  maskSecrets: boolean;
  compress: boolean;
  includeValidation: boolean;
  sections?: string[];
}

export interface ProfileImportOptions {
  replaceExisting: boolean;
  validateBeforeImport: boolean;
  resolveConflicts: boolean;
  conflictResolution: ConflictResolution;
  assignNewIds: boolean;
  updateMetadata: boolean;
  preserveInheritance: boolean;
}

export interface ProfileExportResult {
  success: boolean;
  data?: string | Blob;
  filename?: string;
  size?: number;
  checksum?: string;
  error?: string;
  warnings: string[];
}

export interface ProfileImportResult {
  success: boolean;
  importedProfiles: ConfigurationProfile[];
  skippedProfiles: SkippedProfile[];
  conflicts: ImportConflict[];
  warnings: string[];
  errors: string[];
  summary: ImportSummary;
}

export interface SkippedProfile {
  name: string;
  reason: string;
  canResolve: boolean;
  resolution?: string;
}

export interface ImportConflict {
  profileName: string;
  conflictType: 'name' | 'id' | 'configuration' | 'dependency';
  existingProfile?: ConfigurationProfile;
  resolution: 'skip' | 'overwrite' | 'rename' | 'merge';
  autoResolved: boolean;
}

export interface ImportSummary {
  totalProfiles: number;
  imported: number;
  skipped: number;
  conflicts: number;
  warnings: number;
  errors: number;
  duration: number;
}

// =============================================================================
// Profile Management Store Types
// =============================================================================

export interface ProfileManagerState {
  profiles: ConfigurationProfile[];
  activeProfileId: string | null;
  selectedProfileIds: string[];
  filters: ProfileFilters;
  sortBy: ProfileSortOption;
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  loading: boolean;
  error: string | null;
  lastSync: string | null;
  isDirty: boolean;
}

export interface ProfileFilters {
  environments: EnvironmentType[];
  categories: ProfileCategory[];
  tags: string[];
  validationStatus: ('valid' | 'warning' | 'error')[];
  showInherited: boolean;
  showReadOnly: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
}

export type ProfileSortOption = 
  | 'name' 
  | 'environment' 
  | 'category' 
  | 'created' 
  | 'updated' 
  | 'validation';

// =============================================================================
// Profile Actions Types
// =============================================================================

export interface ProfileAction {
  type: ProfileActionType;
  payload: any;
  timestamp: string;
  user: string;
}

export type ProfileActionType =
  | 'CREATE_PROFILE'
  | 'UPDATE_PROFILE'
  | 'DELETE_PROFILE'
  | 'ACTIVATE_PROFILE'
  | 'DUPLICATE_PROFILE'
  | 'IMPORT_PROFILE'
  | 'EXPORT_PROFILE'
  | 'VALIDATE_PROFILE'
  | 'COMPARE_PROFILES'
  | 'MERGE_PROFILES'
  | 'RESOLVE_CONFLICT'
  | 'UPDATE_INHERITANCE'
  | 'TAG_PROFILE'
  | 'SHARE_PROFILE';

// =============================================================================
// Profile UI State Types
// =============================================================================

export interface ProfileEditorState {
  mode: 'view' | 'edit' | 'create' | 'compare';
  activeTab: ProfileEditorTab;
  unsavedChanges: boolean;
  validationInProgress: boolean;
  previewMode: boolean;
  splitView: boolean;
  comparisonProfiles?: [string, string];
}

export type ProfileEditorTab = 
  | 'configuration' 
  | 'metadata' 
  | 'inheritance' 
  | 'validation' 
  | 'export' 
  | 'preview';

export interface ProfileComparisonState {
  profileA: ConfigurationProfile | null;
  profileB: ConfigurationProfile | null;
  comparison: ProfileComparison | null;
  viewMode: 'side-by-side' | 'unified' | 'tree';
  showOnlyDifferences: boolean;
  highlightLevel: 'all' | 'medium' | 'high' | 'critical';
  loading: boolean;
}

// =============================================================================
// Utility Types
// =============================================================================

export interface ProfileSearchResult {
  profile: ConfigurationProfile;
  score: number;
  matchedFields: string[];
  highlights: Record<string, string>;
}

export interface ProfileSuggestion {
  type: 'similar' | 'template' | 'parent' | 'environment';
  profile: ConfigurationProfile;
  reason: string;
  confidence: number;
}

export interface ProfileStats {
  totalProfiles: number;
  byEnvironment: Record<EnvironmentType, number>;
  byCategory: Record<ProfileCategory, number>;
  byValidationStatus: Record<string, number>;
  mostUsed: ConfigurationProfile[];
  recentlyUpdated: ConfigurationProfile[];
  inheritanceDepth: {
    average: number;
    maximum: number;
    withInheritance: number;
  };
}