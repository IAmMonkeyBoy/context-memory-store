/**
 * Configuration Profiles Utilities
 * Phase 7.4.3 - Utilities for configuration profile and environment management
 */

import type {
  ConfigurationProfile,
  EnvironmentType,
  ProfileCategory,
  ProfileComparison,
  ProfileDifference,
  ProfileValidationResult,
  ProfileInheritance,
  InheritanceConflict,
  ConfigurationOverride,
  ProfileExportOptions,
  ProfileImportOptions,
  ProfileExportResult,
  ProfileImportResult,
  ProfileFilters,
  ProfileSearchResult,
  ProfileSuggestion,
  ProfileStats
} from '../types/configurationProfiles';
import type { SystemConfiguration } from '../types/configuration';
import { configurationDiffer, configurationMerger, configurationTemplateManager } from './configurationUtils';
import { createDefaultConfiguration } from './configurationValidation';

// =============================================================================
// Profile Management Utilities
// =============================================================================

export class ProfileManager {
  private profiles: Map<string, ConfigurationProfile> = new Map();
  private activeProfileId: string | null = null;

  /**
   * Create a new configuration profile
   */
  createProfile(
    name: string,
    description: string,
    environment: EnvironmentType,
    category: ProfileCategory = 'custom',
    baseConfiguration?: Partial<SystemConfiguration>
  ): ConfigurationProfile {
    const id = this.generateProfileId(name, environment);
    const config = baseConfiguration 
      ? configurationMerger.merge({}, baseConfiguration)
      : createDefaultConfiguration();

    const profile: ConfigurationProfile = {
      id,
      name,
      description,
      environment,
      category,
      isDefault: false,
      isActive: false,
      isReadOnly: false,
      configuration: config,
      metadata: {
        author: 'system',
        purpose: description,
        compatibleVersions: ['1.0.0'],
        dependencies: [],
        warnings: [],
        validationStatus: 'unknown',
        checksum: this.calculateChecksum(config)
      },
      tags: [environment],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    this.profiles.set(id, profile);
    return profile;
  }

  /**
   * Create profile from template
   */
  createFromTemplate(
    templateName: string,
    profileName: string,
    environment: EnvironmentType,
    variables: Record<string, any> = {}
  ): ConfigurationProfile {
    const templateConfig = configurationTemplateManager.generateFromTemplate(templateName, variables);
    return this.createProfile(
      profileName,
      `Profile created from ${templateName} template`,
      environment,
      'template',
      templateConfig
    );
  }

  /**
   * Duplicate an existing profile
   */
  duplicateProfile(sourceId: string, newName: string): ConfigurationProfile {
    const sourceProfile = this.getProfile(sourceId);
    if (!sourceProfile) {
      throw new Error(`Profile not found: ${sourceId}`);
    }

    const duplicated = this.createProfile(
      newName,
      `Copy of ${sourceProfile.name}`,
      sourceProfile.environment,
      sourceProfile.category,
      sourceProfile.configuration
    );

    // Copy metadata and tags
    duplicated.metadata = {
      ...sourceProfile.metadata,
      author: 'system',
      checksum: this.calculateChecksum(duplicated.configuration)
    };
    duplicated.tags = [...sourceProfile.tags];

    return duplicated;
  }

  /**
   * Update profile configuration
   */
  updateProfile(profileId: string, updates: Partial<ConfigurationProfile>): ConfigurationProfile {
    const profile = this.getProfile(profileId);
    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    if (profile.isReadOnly) {
      throw new Error(`Cannot update read-only profile: ${profileId}`);
    }

    const updated: ConfigurationProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Update checksum if configuration changed
    if (updates.configuration) {
      updated.metadata.checksum = this.calculateChecksum(updates.configuration);
      updated.metadata.validationStatus = 'unknown';
    }

    this.profiles.set(profileId, updated);
    return updated;
  }

  /**
   * Delete a profile
   */
  deleteProfile(profileId: string): boolean {
    const profile = this.getProfile(profileId);
    if (!profile) {
      return false;
    }

    if (profile.isReadOnly) {
      throw new Error(`Cannot delete read-only profile: ${profileId}`);
    }

    if (profile.isActive) {
      throw new Error(`Cannot delete active profile: ${profileId}`);
    }

    return this.profiles.delete(profileId);
  }

  /**
   * Get profile by ID
   */
  getProfile(profileId: string): ConfigurationProfile | undefined {
    return this.profiles.get(profileId);
  }

  /**
   * Get all profiles
   */
  getAllProfiles(): ConfigurationProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Activate a profile
   */
  activateProfile(profileId: string): void {
    const profile = this.getProfile(profileId);
    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    // Deactivate current active profile
    if (this.activeProfileId) {
      const currentActive = this.getProfile(this.activeProfileId);
      if (currentActive) {
        currentActive.isActive = false;
      }
    }

    // Activate new profile
    profile.isActive = true;
    this.activeProfileId = profileId;
  }

  /**
   * Get active profile
   */
  getActiveProfile(): ConfigurationProfile | null {
    return this.activeProfileId ? this.getProfile(this.activeProfileId) || null : null;
  }

  /**
   * Generate unique profile ID
   */
  private generateProfileId(name: string, environment: EnvironmentType): string {
    const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const timestamp = Date.now().toString(36);
    return `${environment}-${sanitized}-${timestamp}`;
  }

  /**
   * Calculate configuration checksum
   */
  private calculateChecksum(config: SystemConfiguration): string {
    const str = JSON.stringify(config, Object.keys(config).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

// =============================================================================
// Profile Comparison Utilities
// =============================================================================

export class ProfileComparator {
  /**
   * Compare two configuration profiles
   */
  compareProfiles(profileA: ConfigurationProfile, profileB: ConfigurationProfile): ProfileComparison {
    const configDiffs = configurationDiffer.diff(profileA.configuration, profileB.configuration);
    
    // Convert configuration differences to profile differences
    const differences: ProfileDifference[] = configDiffs.map(diff => ({
      path: `configuration.${diff.path}`,
      type: diff.type,
      valueA: diff.oldValue,
      valueB: diff.newValue,
      severity: diff.severity,
      description: diff.description,
      category: 'configuration',
      recommendation: this.getRecommendation(diff.path, diff.type, diff.severity)
    }));

    // Add metadata differences
    differences.push(...this.compareMetadata(profileA, profileB));

    // Calculate summary
    const summary = this.calculateComparisonSummary(differences);
    
    // Assess compatibility
    const compatibility = this.assessCompatibility(profileA, profileB, differences);

    return {
      profileA,
      profileB,
      differences,
      summary,
      compatibility
    };
  }

  /**
   * Compare multiple profiles
   */
  compareMultipleProfiles(profiles: ConfigurationProfile[]): ProfileComparison[] {
    const comparisons: ProfileComparison[] = [];
    
    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        comparisons.push(this.compareProfiles(profiles[i], profiles[j]));
      }
    }

    return comparisons;
  }

  /**
   * Find similar profiles
   */
  findSimilarProfiles(
    targetProfile: ConfigurationProfile, 
    candidates: ConfigurationProfile[],
    threshold: number = 0.7
  ): ProfileSuggestion[] {
    const suggestions: ProfileSuggestion[] = [];

    for (const candidate of candidates) {
      if (candidate.id === targetProfile.id) continue;

      const comparison = this.compareProfiles(targetProfile, candidate);
      const similarity = this.calculateSimilarity(comparison);

      if (similarity >= threshold) {
        suggestions.push({
          type: this.determineSuggestionType(targetProfile, candidate),
          profile: candidate,
          reason: this.generateSuggestionReason(targetProfile, candidate, similarity),
          confidence: similarity
        });
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private compareMetadata(profileA: ConfigurationProfile, profileB: ConfigurationProfile): ProfileDifference[] {
    const differences: ProfileDifference[] = [];

    // Compare basic metadata
    const metadataFields = ['name', 'description', 'environment', 'category', 'version'];
    for (const field of metadataFields) {
      if ((profileA as any)[field] !== (profileB as any)[field]) {
        differences.push({
          path: field,
          type: 'changed',
          valueA: (profileA as any)[field],
          valueB: (profileB as any)[field],
          severity: field === 'environment' ? 'high' : 'low',
          description: `${field} differs between profiles`,
          category: 'metadata'
        });
      }
    }

    return differences;
  }

  private calculateComparisonSummary(differences: ProfileDifference[]) {
    const byType = differences.reduce((acc, diff) => {
      acc[diff.type] = (acc[diff.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = differences.reduce((acc, diff) => {
      acc[diff.severity] = (acc[diff.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const affectedSections = [...new Set(
      differences
        .filter(d => d.category === 'configuration')
        .map(d => d.path.split('.')[1])
    )];

    // Calculate compatibility score (0-100)
    const totalDiffs = differences.length;
    const criticalDiffs = bySeverity.critical || 0;
    const highDiffs = bySeverity.high || 0;
    
    let compatibilityScore = 100;
    compatibilityScore -= criticalDiffs * 20;
    compatibilityScore -= highDiffs * 10;
    compatibilityScore -= (totalDiffs - criticalDiffs - highDiffs) * 2;
    compatibilityScore = Math.max(0, compatibilityScore);

    const riskLevel = compatibilityScore > 80 ? 'low' : 
                     compatibilityScore > 50 ? 'medium' : 'high';

    return {
      totalDifferences: totalDiffs,
      byType,
      bySeverity,
      affectedSections,
      compatibilityScore,
      riskLevel
    };
  }

  private assessCompatibility(
    profileA: ConfigurationProfile, 
    profileB: ConfigurationProfile, 
    differences: ProfileDifference[]
  ) {
    const criticalDiffs = differences.filter(d => d.severity === 'critical');
    const blockers = criticalDiffs.map(d => d.description);
    
    const warnings = differences
      .filter(d => d.severity === 'high')
      .map(d => d.description);

    const isCompatible = criticalDiffs.length === 0;
    const canMigrate = isCompatible || criticalDiffs.every(d => d.recommendation);
    
    const migrationComplexity = criticalDiffs.length > 5 ? 'complex' :
                               criticalDiffs.length > 2 ? 'moderate' : 'simple';

    return {
      isCompatible,
      issues: [],
      warnings,
      blockers,
      canMigrate,
      migrationComplexity
    };
  }

  private calculateSimilarity(comparison: ProfileComparison): number {
    return comparison.summary.compatibilityScore / 100;
  }

  private determineSuggestionType(
    target: ConfigurationProfile, 
    candidate: ConfigurationProfile
  ): ProfileSuggestion['type'] {
    if (candidate.environment === target.environment) return 'similar';
    if (candidate.category === 'template') return 'template';
    if (candidate.inheritanceChain?.includes(target.id)) return 'parent';
    return 'environment';
  }

  private generateSuggestionReason(
    target: ConfigurationProfile,
    candidate: ConfigurationProfile,
    similarity: number
  ): string {
    const percent = Math.round(similarity * 100);
    
    if (candidate.environment === target.environment) {
      return `${percent}% similar configuration in the same environment`;
    }
    
    if (candidate.category === 'template') {
      return `Template with ${percent}% compatibility`;
    }
    
    return `${percent}% configuration similarity`;
  }

  private getRecommendation(path: string, type: string, severity: string): string | undefined {
    if (severity === 'critical') {
      return `Critical difference in ${path} requires manual resolution`;
    }
    
    if (severity === 'high' && type === 'changed') {
      return `Consider reviewing ${path} configuration carefully`;
    }

    return undefined;
  }
}

// =============================================================================
// Profile Inheritance Utilities
// =============================================================================

export class ProfileInheritanceManager {
  /**
   * Apply inheritance to a profile
   */
  applyInheritance(
    childProfile: ConfigurationProfile,
    parentProfile: ConfigurationProfile
  ): ConfigurationProfile {
    const inheritedConfig = configurationMerger.merge(
      parentProfile.configuration,
      childProfile.configuration,
      {
        mergeArrays: false, // Child overrides parent arrays
        preserveNulls: true,
        validate: true,
        excludePaths: [],
        customStrategies: {}
      }
    );

    return {
      ...childProfile,
      configuration: inheritedConfig,
      inheritanceChain: [
        ...(parentProfile.inheritanceChain || []),
        parentProfile.id
      ],
      metadata: {
        ...childProfile.metadata,
        dependencies: [...childProfile.metadata.dependencies, parentProfile.id],
        checksum: this.calculateInheritedChecksum(inheritedConfig, parentProfile.id)
      }
    };
  }

  /**
   * Resolve inheritance conflicts
   */
  resolveInheritanceConflicts(
    conflicts: InheritanceConflict[],
    strategy: 'auto' | 'manual' = 'auto'
  ): ConfigurationOverride[] {
    const overrides: ConfigurationOverride[] = [];

    for (const conflict of conflicts) {
      if (strategy === 'auto' && conflict.autoResolvable) {
        const resolution = this.autoResolveConflict(conflict);
        if (resolution) {
          overrides.push(resolution);
        }
      }
    }

    return overrides;
  }

  private autoResolveConflict(conflict: InheritanceConflict): ConfigurationOverride | null {
    switch (conflict.resolutionStrategy) {
      case 'use_child':
        return {
          path: conflict.path,
          originalValue: conflict.conflictingValues[0]?.value,
          overrideValue: conflict.conflictingValues[conflict.conflictingValues.length - 1]?.value,
          reason: 'Child profile takes precedence',
          priority: 100,
          source: 'system'
        };
        
      case 'highest_priority':
        const highest = conflict.conflictingValues.reduce((prev, current) => 
          current.priority > prev.priority ? current : prev
        );
        return {
          path: conflict.path,
          originalValue: conflict.conflictingValues[0]?.value,
          overrideValue: highest.value,
          reason: 'Highest priority value selected',
          priority: highest.priority,
          source: 'system'
        };
        
      default:
        return null;
    }
  }

  private calculateInheritedChecksum(config: SystemConfiguration, parentId: string): string {
    const str = JSON.stringify({ config, parentId }, Object.keys({ config, parentId }).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

// =============================================================================
// Profile Search and Filter Utilities
// =============================================================================

export class ProfileSearchEngine {
  /**
   * Search profiles with fuzzy matching
   */
  searchProfiles(
    profiles: ConfigurationProfile[],
    query: string,
    filters?: ProfileFilters
  ): ProfileSearchResult[] {
    let filtered = this.applyFilters(profiles, filters);
    
    if (!query.trim()) {
      return filtered.map(profile => ({
        profile,
        score: 1,
        matchedFields: [],
        highlights: {}
      }));
    }

    const results: ProfileSearchResult[] = [];
    const queryLower = query.toLowerCase();

    for (const profile of filtered) {
      const matches = this.searchInProfile(profile, queryLower);
      if (matches.score > 0) {
        results.push(matches);
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Apply filters to profile list
   */
  applyFilters(profiles: ConfigurationProfile[], filters?: ProfileFilters): ConfigurationProfile[] {
    if (!filters) return profiles;

    return profiles.filter(profile => {
      // Environment filter
      if (filters.environments?.length && !filters.environments.includes(profile.environment)) {
        return false;
      }

      // Category filter
      if (filters.categories?.length && !filters.categories.includes(profile.category)) {
        return false;
      }

      // Tags filter
      if (filters.tags?.length && !filters.tags.some(tag => profile.tags.includes(tag))) {
        return false;
      }

      // Validation status filter
      if (filters.validationStatus?.length && 
          !filters.validationStatus.includes(profile.metadata.validationStatus)) {
        return false;
      }

      // Read-only filter
      if (!filters.showReadOnly && profile.isReadOnly) {
        return false;
      }

      // Inheritance filter
      if (!filters.showInherited && profile.inheritanceChain?.length) {
        return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const updated = new Date(profile.updatedAt);
        const from = new Date(filters.dateRange.from);
        const to = new Date(filters.dateRange.to);
        
        if (updated < from || updated > to) {
          return false;
        }
      }

      return true;
    });
  }

  private searchInProfile(profile: ConfigurationProfile, query: string): ProfileSearchResult {
    const searchableFields = {
      name: profile.name,
      description: profile.description,
      environment: profile.environment,
      category: profile.category,
      tags: profile.tags.join(' '),
      author: profile.metadata.author,
      purpose: profile.metadata.purpose
    };

    let score = 0;
    const matchedFields: string[] = [];
    const highlights: Record<string, string> = {};

    for (const [field, value] of Object.entries(searchableFields)) {
      const valueLower = value.toLowerCase();
      const index = valueLower.indexOf(query);
      
      if (index !== -1) {
        // Exact match gets higher score
        const exactMatch = valueLower === query;
        const startMatch = index === 0;
        
        let fieldScore = exactMatch ? 10 : startMatch ? 5 : 1;
        
        // Name and description are more important
        if (field === 'name') fieldScore *= 3;
        if (field === 'description') fieldScore *= 2;
        
        score += fieldScore;
        matchedFields.push(field);
        
        // Create highlight
        const before = value.substring(0, index);
        const match = value.substring(index, index + query.length);
        const after = value.substring(index + query.length);
        highlights[field] = `${before}<mark>${match}</mark>${after}`;
      }
    }

    return {
      profile,
      score,
      matchedFields,
      highlights
    };
  }
}

// =============================================================================
// Profile Statistics Utilities
// =============================================================================

export class ProfileStatsCalculator {
  /**
   * Calculate comprehensive profile statistics
   */
  calculateStats(profiles: ConfigurationProfile[]): ProfileStats {
    const totalProfiles = profiles.length;
    
    const byEnvironment = profiles.reduce((acc, profile) => {
      acc[profile.environment] = (acc[profile.environment] || 0) + 1;
      return acc;
    }, {} as Record<EnvironmentType, number>);

    const byCategory = profiles.reduce((acc, profile) => {
      acc[profile.category] = (acc[profile.category] || 0) + 1;
      return acc;
    }, {} as Record<ProfileCategory, number>);

    const byValidationStatus = profiles.reduce((acc, profile) => {
      const status = profile.metadata.validationStatus;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Most used profiles (based on active status and recent updates)
    const mostUsed = profiles
      .filter(p => p.isActive || this.isRecentlyUsed(p))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    // Recently updated profiles
    const recentlyUpdated = profiles
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);

    // Inheritance statistics
    const inheritanceDepths = profiles
      .map(p => p.inheritanceChain?.length || 0);
    
    const inheritanceDepth = {
      average: inheritanceDepths.reduce((a, b) => a + b, 0) / inheritanceDepths.length || 0,
      maximum: Math.max(...inheritanceDepths, 0),
      withInheritance: profiles.filter(p => p.inheritanceChain?.length).length
    };

    return {
      totalProfiles,
      byEnvironment,
      byCategory,
      byValidationStatus,
      mostUsed,
      recentlyUpdated,
      inheritanceDepth
    };
  }

  private isRecentlyUsed(profile: ConfigurationProfile): boolean {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(profile.updatedAt) > oneWeekAgo;
  }
}

// =============================================================================
// Export Utility Instances
// =============================================================================

export const profileManager = new ProfileManager();
export const profileComparator = new ProfileComparator();
export const profileInheritanceManager = new ProfileInheritanceManager();
export const profileSearchEngine = new ProfileSearchEngine();
export const profileStatsCalculator = new ProfileStatsCalculator();