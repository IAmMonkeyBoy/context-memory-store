/**
 * Configuration Profiles Utilities Tests
 * Phase 7.4.3 - Comprehensive tests for profile management functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ProfileManager,
  ProfileComparator,
  ProfileInheritanceManager,
  ProfileSearchEngine,
  ProfileStatsCalculator
} from '../configurationProfiles';
import type { ConfigurationProfile, EnvironmentType } from '../../types/configurationProfiles';
import { createDefaultConfiguration } from '../configurationValidation';

describe('ProfileManager', () => {
  let profileManager: ProfileManager;

  beforeEach(() => {
    profileManager = new ProfileManager();
  });

  describe('createProfile', () => {
    it('should create a new profile with basic information', () => {
      const profile = profileManager.createProfile(
        'Test Profile',
        'A test profile',
        'development'
      );

      expect(profile.name).toBe('Test Profile');
      expect(profile.description).toBe('A test profile');
      expect(profile.environment).toBe('development');
      expect(profile.category).toBe('custom');
      expect(profile.isDefault).toBe(false);
      expect(profile.isActive).toBe(false);
      expect(profile.isReadOnly).toBe(false);
      expect(profile.configuration).toBeDefined();
      expect(profile.metadata.checksum).toBeDefined();
      expect(profile.tags).toContain('development');
    });

    it('should create profiles with different environments', () => {
      const environments: EnvironmentType[] = ['development', 'staging', 'production', 'testing'];
      
      environments.forEach(env => {
        const profile = profileManager.createProfile(
          `${env} Profile`,
          `Profile for ${env}`,
          env
        );
        expect(profile.environment).toBe(env);
        expect(profile.tags).toContain(env);
      });
    });

    it('should generate unique IDs for profiles', () => {
      const profile1 = profileManager.createProfile('Test 1', 'First test', 'development');
      const profile2 = profileManager.createProfile('Test 2', 'Second test', 'development');
      
      expect(profile1.id).not.toBe(profile2.id);
    });
  });

  describe('createFromTemplate', () => {
    it('should create profile from development template', () => {
      const profile = profileManager.createFromTemplate(
        'development',
        'Dev Profile',
        'development'
      );

      expect(profile.name).toBe('Dev Profile');
      expect(profile.environment).toBe('development');
      expect(profile.category).toBe('template');
      expect(profile.configuration.features?.debugMode).toBe(true);
    });

    it('should create profile from production template', () => {
      const profile = profileManager.createFromTemplate(
        'production',
        'Prod Profile',
        'production'
      );

      expect(profile.name).toBe('Prod Profile');
      expect(profile.environment).toBe('production');
      expect(profile.configuration.features?.debugMode).toBe(false);
      expect(profile.configuration.security?.https?.enabled).toBe(true);
    });
  });

  describe('duplicateProfile', () => {
    it('should duplicate an existing profile', () => {
      const original = profileManager.createProfile(
        'Original',
        'Original description',
        'development'
      );
      
      const duplicate = profileManager.duplicateProfile(original.id, 'Copy of Original');
      
      expect(duplicate.name).toBe('Copy of Original');
      expect(duplicate.description).toContain('Copy of Original');
      expect(duplicate.environment).toBe(original.environment);
      expect(duplicate.configuration).toEqual(original.configuration);
      expect(duplicate.id).not.toBe(original.id);
    });

    it('should throw error for non-existent profile', () => {
      expect(() => {
        profileManager.duplicateProfile('non-existent', 'Copy');
      }).toThrow('Profile not found: non-existent');
    });
  });

  describe('activateProfile', () => {
    it('should activate a profile and deactivate others', () => {
      const profile1 = profileManager.createProfile('Profile 1', 'First', 'development');
      const profile2 = profileManager.createProfile('Profile 2', 'Second', 'staging');
      
      profileManager.activateProfile(profile1.id);
      expect(profile1.isActive).toBe(true);
      
      profileManager.activateProfile(profile2.id);
      expect(profile1.isActive).toBe(false);
      expect(profile2.isActive).toBe(true);
    });

    it('should throw error for non-existent profile', () => {
      expect(() => {
        profileManager.activateProfile('non-existent');
      }).toThrow('Profile not found: non-existent');
    });
  });

  describe('deleteProfile', () => {
    it('should delete a profile', () => {
      const profile = profileManager.createProfile('Test', 'Test', 'development');
      
      const deleted = profileManager.deleteProfile(profile.id);
      expect(deleted).toBe(true);
      expect(profileManager.getProfile(profile.id)).toBeUndefined();
    });

    it('should not delete read-only profiles', () => {
      const profile = profileManager.createProfile('Test', 'Test', 'development');
      profile.isReadOnly = true;
      
      expect(() => {
        profileManager.deleteProfile(profile.id);
      }).toThrow('Cannot delete read-only profile');
    });

    it('should not delete active profiles', () => {
      const profile = profileManager.createProfile('Test', 'Test', 'development');
      profileManager.activateProfile(profile.id);
      
      expect(() => {
        profileManager.deleteProfile(profile.id);
      }).toThrow('Cannot delete active profile');
    });
  });
});

describe('ProfileComparator', () => {
  let comparator: ProfileComparator;
  let profileManager: ProfileManager;

  beforeEach(() => {
    comparator = new ProfileComparator();
    profileManager = new ProfileManager();
  });

  describe('compareProfiles', () => {
    it('should compare two identical profiles', () => {
      const profile1 = profileManager.createProfile('Profile 1', 'Test', 'development');
      const profile2 = profileManager.duplicateProfile(profile1.id, 'Profile 2');
      
      const comparison = comparator.compareProfiles(profile1, profile2);
      
      expect(comparison.differences).toHaveLength(1); // Only name difference
      expect(comparison.summary.compatibilityScore).toBeGreaterThan(95);
      expect(comparison.compatibility.isCompatible).toBe(true);
    });

    it('should identify differences between dev and prod profiles', () => {
      const devProfile = profileManager.createFromTemplate('development', 'Dev', 'development');
      const prodProfile = profileManager.createFromTemplate('production', 'Prod', 'production');
      
      const comparison = comparator.compareProfiles(devProfile, prodProfile);
      
      expect(comparison.differences.length).toBeGreaterThan(0);
      expect(comparison.summary.affectedSections).toContain('features');
      expect(comparison.summary.affectedSections).toContain('security');
    });

    it('should calculate risk level based on differences', () => {
      const profile1 = profileManager.createFromTemplate('development', 'Dev', 'development');
      const profile2 = profileManager.createFromTemplate('production', 'Prod', 'production');
      
      const comparison = comparator.compareProfiles(profile1, profile2);
      
      expect(['low', 'medium', 'high']).toContain(comparison.summary.riskLevel);
    });
  });

  describe('findSimilarProfiles', () => {
    it('should find similar profiles based on configuration', () => {
      const target = profileManager.createFromTemplate('development', 'Target', 'development');
      const similar1 = profileManager.createFromTemplate('development', 'Similar 1', 'development');
      const similar2 = profileManager.createFromTemplate('development', 'Similar 2', 'local');
      const different = profileManager.createFromTemplate('production', 'Different', 'production');
      
      const candidates = [similar1, similar2, different];
      const suggestions = comparator.findSimilarProfiles(target, candidates, 0.7);
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].confidence).toBeGreaterThan(0.7);
    });
  });
});

describe('ProfileSearchEngine', () => {
  let searchEngine: ProfileSearchEngine;
  let profiles: ConfigurationProfile[];

  beforeEach(() => {
    searchEngine = new ProfileSearchEngine();
    const profileManager = new ProfileManager();
    
    profiles = [
      profileManager.createProfile('Development Setup', 'Local development environment', 'development'),
      profileManager.createProfile('Production Config', 'Production deployment settings', 'production'),
      profileManager.createProfile('Testing Environment', 'Automated testing configuration', 'testing'),
      profileManager.createProfile('Staging Server', 'Pre-production staging', 'staging')
    ];
  });

  describe('searchProfiles', () => {
    it('should find profiles by name', () => {
      const results = searchEngine.searchProfiles(profiles, 'development');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].profile.name).toContain('Development');
      expect(results[0].matchedFields).toContain('name');
    });

    it('should find profiles by description', () => {
      const results = searchEngine.searchProfiles(profiles, 'production');
      
      expect(results.length).toBeGreaterThan(0);
      const found = results.some(r => r.profile.description.includes('production'));
      expect(found).toBe(true);
    });

    it('should return all profiles for empty query', () => {
      const results = searchEngine.searchProfiles(profiles, '');
      
      expect(results).toHaveLength(profiles.length);
      results.forEach(result => {
        expect(result.score).toBe(1);
      });
    });

    it('should highlight matching text', () => {
      const results = searchEngine.searchProfiles(profiles, 'development');
      
      const devResult = results.find(r => r.profile.name.includes('Development'));
      expect(devResult?.highlights.name).toContain('<mark>');
    });
  });

  describe('applyFilters', () => {
    it('should filter by environment', () => {
      const filtered = searchEngine.applyFilters(profiles, {
        environments: ['development', 'production'],
        categories: [],
        tags: [],
        validationStatus: [],
        showInherited: true,
        showReadOnly: true
      });
      
      expect(filtered.length).toBe(2);
      expect(filtered.every(p => ['development', 'production'].includes(p.environment))).toBe(true);
    });

    it('should filter by category', () => {
      profiles[0].category = 'template';
      
      const filtered = searchEngine.applyFilters(profiles, {
        environments: [],
        categories: ['template'],
        tags: [],
        validationStatus: [],
        showInherited: true,
        showReadOnly: true
      });
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].category).toBe('template');
    });

    it('should exclude read-only profiles when filter is disabled', () => {
      profiles[0].isReadOnly = true;
      
      const filtered = searchEngine.applyFilters(profiles, {
        environments: [],
        categories: [],
        tags: [],
        validationStatus: [],
        showInherited: true,
        showReadOnly: false
      });
      
      expect(filtered).toHaveLength(profiles.length - 1);
      expect(filtered.every(p => !p.isReadOnly)).toBe(true);
    });
  });
});

describe('ProfileStatsCalculator', () => {
  let calculator: ProfileStatsCalculator;
  let profiles: ConfigurationProfile[];

  beforeEach(() => {
    calculator = new ProfileStatsCalculator();
    const profileManager = new ProfileManager();
    
    profiles = [
      profileManager.createProfile('Dev 1', 'Development', 'development'),
      profileManager.createProfile('Dev 2', 'Development', 'development'),
      profileManager.createProfile('Prod 1', 'Production', 'production'),
      profileManager.createProfile('Test 1', 'Testing', 'testing')
    ];
    
    // Set up inheritance chain
    profiles[1].inheritanceChain = [profiles[0].id];
    profiles[2].inheritanceChain = [profiles[0].id, profiles[1].id];
  });

  describe('calculateStats', () => {
    it('should calculate total profiles', () => {
      const stats = calculator.calculateStats(profiles);
      
      expect(stats.totalProfiles).toBe(4);
    });

    it('should count profiles by environment', () => {
      const stats = calculator.calculateStats(profiles);
      
      expect(stats.byEnvironment.development).toBe(2);
      expect(stats.byEnvironment.production).toBe(1);
      expect(stats.byEnvironment.testing).toBe(1);
    });

    it('should count profiles by category', () => {
      profiles[0].category = 'template';
      profiles[1].category = 'base';
      
      const stats = calculator.calculateStats(profiles);
      
      expect(stats.byCategory.template).toBe(1);
      expect(stats.byCategory.base).toBe(1);
      expect(stats.byCategory.custom).toBe(2);
    });

    it('should calculate inheritance statistics', () => {
      const stats = calculator.calculateStats(profiles);
      
      expect(stats.inheritanceDepth.withInheritance).toBe(2);
      expect(stats.inheritanceDepth.maximum).toBe(2);
      expect(stats.inheritanceDepth.average).toBeGreaterThan(0);
    });

    it('should identify most used profiles', () => {
      profiles[0].isActive = true;
      profiles[1].updatedAt = new Date().toISOString();
      
      const stats = calculator.calculateStats(profiles);
      
      expect(stats.mostUsed.length).toBeGreaterThan(0);
      expect(stats.mostUsed[0].isActive || stats.mostUsed[0].updatedAt).toBeTruthy();
    });

    it('should list recently updated profiles', () => {
      const stats = calculator.calculateStats(profiles);
      
      expect(stats.recentlyUpdated).toHaveLength(Math.min(10, profiles.length));
      expect(stats.recentlyUpdated).toEqual(
        profiles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 10)
      );
    });
  });
});

describe('ProfileInheritanceManager', () => {
  let inheritanceManager: ProfileInheritanceManager;
  let profileManager: ProfileManager;

  beforeEach(() => {
    inheritanceManager = new ProfileInheritanceManager();
    profileManager = new ProfileManager();
  });

  describe('applyInheritance', () => {
    it('should merge parent and child configurations', () => {
      const parent = profileManager.createFromTemplate('production', 'Parent', 'production');
      const child = profileManager.createProfile('Child', 'Child profile', 'production');
      
      // Modify child to have different debug mode
      child.configuration.features!.debugMode = true;
      
      const inherited = inheritanceManager.applyInheritance(child, parent);
      
      expect(inherited.inheritanceChain).toContain(parent.id);
      expect(inherited.metadata.dependencies).toContain(parent.id);
      expect(inherited.configuration.features?.debugMode).toBe(true); // Child overrides parent
      expect(inherited.configuration.security?.https?.enabled).toBe(true); // From parent
    });

    it('should maintain inheritance chain order', () => {
      const grandparent = profileManager.createProfile('Grandparent', 'GP', 'production');
      const parent = profileManager.createProfile('Parent', 'P', 'production');
      const child = profileManager.createProfile('Child', 'C', 'production');
      
      // Set up inheritance chain
      parent.inheritanceChain = [grandparent.id];
      
      const inherited = inheritanceManager.applyInheritance(child, parent);
      
      expect(inherited.inheritanceChain).toEqual([grandparent.id, parent.id]);
    });

    it('should update checksum after inheritance', () => {
      const parent = profileManager.createProfile('Parent', 'Parent', 'production');
      const child = profileManager.createProfile('Child', 'Child', 'production');
      
      const originalChecksum = child.metadata.checksum;
      const inherited = inheritanceManager.applyInheritance(child, parent);
      
      expect(inherited.metadata.checksum).not.toBe(originalChecksum);
    });
  });
});

describe('Integration Tests', () => {
  it('should support complete profile lifecycle', () => {
    const manager = new ProfileManager();
    const comparator = new ProfileComparator();
    
    // Create profiles
    const devProfile = manager.createFromTemplate('development', 'Development', 'development');
    const prodProfile = manager.createFromTemplate('production', 'Production', 'production');
    
    // Activate development profile
    manager.activateProfile(devProfile.id);
    expect(devProfile.isActive).toBe(true);
    
    // Compare profiles
    const comparison = comparator.compareProfiles(devProfile, prodProfile);
    expect(comparison.differences.length).toBeGreaterThan(0);
    
    // Duplicate and modify
    const customProfile = manager.duplicateProfile(devProfile.id, 'Custom Development');
    customProfile.configuration.features!.experimentalFeatures = false;
    
    const updatedProfile = manager.updateProfile(customProfile.id, customProfile);
    expect(updatedProfile.configuration.features?.experimentalFeatures).toBe(false);
    
    // Verify all profiles exist
    const allProfiles = manager.getAllProfiles();
    expect(allProfiles).toHaveLength(3);
  });

  it('should handle complex search and filter scenarios', () => {
    const manager = new ProfileManager();
    const searchEngine = new ProfileSearchEngine();
    
    // Create diverse profiles
    const profiles = [
      manager.createProfile('Dev Local', 'Local development setup', 'development'),
      manager.createProfile('Dev Remote', 'Remote development setup', 'development'),
      manager.createProfile('Prod Main', 'Main production environment', 'production'),
      manager.createProfile('Prod Backup', 'Backup production environment', 'production'),
      manager.createProfile('Test Suite', 'Automated testing configuration', 'testing')
    ];
    
    // Add tags and metadata
    profiles[0].tags.push('local', 'docker');
    profiles[1].tags.push('remote', 'cloud');
    profiles[2].tags.push('primary', 'kubernetes');
    profiles[3].tags.push('backup', 'kubernetes');
    profiles[4].tags.push('automated', 'ci-cd');
    
    // Test complex search
    const searchResults = searchEngine.searchProfiles(profiles, 'development');
    expect(searchResults).toHaveLength(2);
    
    // Test complex filtering
    const filtered = searchEngine.applyFilters(profiles, {
      environments: ['development', 'production'],
      categories: [],
      tags: ['kubernetes'],
      validationStatus: [],
      showInherited: true,
      showReadOnly: true
    });
    expect(filtered).toHaveLength(2); // Production profiles with kubernetes tag
  });
});