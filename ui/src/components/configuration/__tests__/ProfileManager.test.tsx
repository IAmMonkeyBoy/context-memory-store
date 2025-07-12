/**
 * ProfileManager Component Tests
 * Phase 7.4.3 - Tests for the profile management interface
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material';

import { ProfileManager } from '../ProfileManager';
import { profileManager } from '../../../utils/configurationProfiles';
import type { ConfigurationProfile } from '../../../types/configurationProfiles';

// Mock the profile manager
vi.mock('../../../utils/configurationProfiles', () => ({
  profileManager: {
    createProfile: vi.fn(),
    createFromTemplate: vi.fn(),
    duplicateProfile: vi.fn(),
    updateProfile: vi.fn(),
    deleteProfile: vi.fn(),
    getProfile: vi.fn(),
    getAllProfiles: vi.fn(),
    activateProfile: vi.fn(),
  },
  profileSearchEngine: {
    searchProfiles: vi.fn(),
    applyFilters: vi.fn(),
  },
  profileStatsCalculator: {
    calculateStats: vi.fn(),
  },
}));

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

const mockProfiles: ConfigurationProfile[] = [
  {
    id: 'dev-profile-1',
    name: 'Development Environment',
    description: 'Local development configuration',
    environment: 'development',
    category: 'environment',
    isDefault: false,
    isActive: true,
    isReadOnly: false,
    configuration: {} as any,
    metadata: {
      author: 'system',
      purpose: 'Development',
      compatibleVersions: ['1.0.0'],
      dependencies: [],
      warnings: [],
      validationStatus: 'valid',
      checksum: 'abc123'
    },
    tags: ['development', 'local'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
    version: '1.0.0'
  },
  {
    id: 'prod-profile-1',
    name: 'Production Environment',
    description: 'Production deployment configuration',
    environment: 'production',
    category: 'environment',
    isDefault: false,
    isActive: false,
    isReadOnly: true,
    configuration: {} as any,
    metadata: {
      author: 'system',
      purpose: 'Production',
      compatibleVersions: ['1.0.0'],
      dependencies: [],
      warnings: ['High memory usage'],
      validationStatus: 'warning',
      checksum: 'def456'
    },
    tags: ['production', 'kubernetes'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T18:00:00Z',
    version: '1.0.0'
  }
];

const mockStats = {
  totalProfiles: 2,
  byEnvironment: { development: 1, production: 1 },
  byCategory: { environment: 2 },
  byValidationStatus: { valid: 1, warning: 1 },
  mostUsed: mockProfiles,
  recentlyUpdated: mockProfiles,
  inheritanceDepth: {
    average: 0,
    maximum: 0,
    withInheritance: 0
  }
};

describe('ProfileManager', () => {
  const mockOnProfileSelected = vi.fn();
  const mockOnProfileEdit = vi.fn();
  const mockOnProfileCompare = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    (profileManager.getAllProfiles as any).mockReturnValue(mockProfiles);
    (require('../../../utils/configurationProfiles').profileSearchEngine.searchProfiles as any)
      .mockReturnValue(mockProfiles.map(profile => ({ profile, score: 1, matchedFields: [], highlights: {} })));
    (require('../../../utils/configurationProfiles').profileStatsCalculator.calculateStats as any)
      .mockReturnValue(mockStats);
  });

  it('should render profile management interface', () => {
    render(
      <TestWrapper>
        <ProfileManager 
          onProfileSelected={mockOnProfileSelected}
          onProfileEdit={mockOnProfileEdit}
          onProfileCompare={mockOnProfileCompare}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Configuration Profiles')).toBeInTheDocument();
    expect(screen.getByText('Manage environment-specific configurations and profile inheritance')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create profile/i })).toBeInTheDocument();
  });

  it('should display profile statistics', () => {
    render(
      <TestWrapper>
        <ProfileManager />
      </TestWrapper>
    );

    expect(screen.getByText('2')).toBeInTheDocument(); // Total profiles
    expect(screen.getByText('Total Profiles')).toBeInTheDocument();
    expect(screen.getByText('Environments')).toBeInTheDocument();
    expect(screen.getByText('With Inheritance')).toBeInTheDocument();
    expect(screen.getByText('Valid Profiles')).toBeInTheDocument();
  });

  it('should display profile cards', () => {
    render(
      <TestWrapper>
        <ProfileManager />
      </TestWrapper>
    );

    expect(screen.getByText('Development Environment')).toBeInTheDocument();
    expect(screen.getByText('Production Environment')).toBeInTheDocument();
    expect(screen.getByText('Local development configuration')).toBeInTheDocument();
    expect(screen.getByText('Production deployment configuration')).toBeInTheDocument();
  });

  it('should show active profile indicator', () => {
    render(
      <TestWrapper>
        <ProfileManager />
      </TestWrapper>
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should show read-only profile indicator', () => {
    render(
      <TestWrapper>
        <ProfileManager />
      </TestWrapper>
    );

    expect(screen.getByText('Read-only')).toBeInTheDocument();
  });

  it('should open create profile dialog', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ProfileManager />
      </TestWrapper>
    );

    const createButton = screen.getByRole('button', { name: /create profile/i });
    await user.click(createButton);

    expect(screen.getByText('Create New Profile')).toBeInTheDocument();
    expect(screen.getByLabelText(/profile name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/environment/i)).toBeInTheDocument();
  });

  it('should create a new profile', async () => {
    const user = userEvent.setup();
    const mockCreatedProfile = { ...mockProfiles[0], id: 'new-profile', name: 'New Test Profile' };
    (profileManager.createProfile as any).mockReturnValue(mockCreatedProfile);
    
    render(
      <TestWrapper>
        <ProfileManager />
      </TestWrapper>
    );

    // Open create dialog
    const createButton = screen.getByRole('button', { name: /create profile/i });
    await user.click(createButton);

    // Fill in form
    const nameInput = screen.getByLabelText(/profile name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    
    await user.type(nameInput, 'New Test Profile');
    await user.type(descriptionInput, 'A new test profile');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /^create$/i });
    await user.click(submitButton);

    expect(profileManager.createProfile).toHaveBeenCalledWith(
      'New Test Profile',
      'A new test profile',
      'development',
      'custom'
    );
  });

  it('should create profile from template', async () => {
    const user = userEvent.setup();
    const mockCreatedProfile = { ...mockProfiles[0], id: 'template-profile' };
    (profileManager.createFromTemplate as any).mockReturnValue(mockCreatedProfile);
    
    render(
      <TestWrapper>
        <ProfileManager />
      </TestWrapper>
    );

    // Open create dialog
    const createButton = screen.getByRole('button', { name: /create profile/i });
    await user.click(createButton);

    // Fill in form with template
    await user.type(screen.getByLabelText(/profile name/i), 'Template Profile');
    
    // Select template
    const templateSelect = screen.getByLabelText(/template/i);
    await user.click(templateSelect);
    await user.click(screen.getByText('Development Template'));

    // Submit form
    const submitButton = screen.getByRole('button', { name: /^create$/i });
    await user.click(submitButton);

    expect(profileManager.createFromTemplate).toHaveBeenCalledWith(
      'development',
      'Template Profile',
      'development'
    );
  });

  it('should handle profile selection', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ProfileManager 
          onProfileSelected={mockOnProfileSelected}
        />
      </TestWrapper>
    );

    const profileCard = screen.getByText('Development Environment').closest('[role="button"]');
    expect(profileCard).toBeInTheDocument();
    
    if (profileCard) {
      await user.click(profileCard);
      expect(mockOnProfileSelected).toHaveBeenCalledWith(mockProfiles[0]);
    }
  });

  it('should open profile context menu', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ProfileManager />
      </TestWrapper>
    );

    const moreButtons = screen.getAllByLabelText(/more/i);
    await user.click(moreButtons[0]);

    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('Edit Configuration')).toBeInTheDocument();
    expect(screen.getByText('Activate')).toBeInTheDocument();
    expect(screen.getByText('Duplicate')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should activate profile from context menu', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ProfileManager />
      </TestWrapper>
    );

    // Open context menu for inactive profile (production)
    const moreButtons = screen.getAllByLabelText(/more/i);
    await user.click(moreButtons[1]);
    
    const activateButton = screen.getByText('Activate');
    await user.click(activateButton);

    expect(profileManager.activateProfile).toHaveBeenCalledWith('prod-profile-1');
  });

  it('should duplicate profile from context menu', async () => {
    const user = userEvent.setup();
    const mockDuplicatedProfile = { ...mockProfiles[0], id: 'duplicated-profile' };
    (profileManager.duplicateProfile as any).mockReturnValue(mockDuplicatedProfile);
    
    render(
      <TestWrapper>
        <ProfileManager />
      </TestWrapper>
    );

    const moreButtons = screen.getAllByLabelText(/more/i);
    await user.click(moreButtons[0]);
    
    const duplicateButton = screen.getByText('Duplicate');
    await user.click(duplicateButton);

    expect(profileManager.duplicateProfile).toHaveBeenCalledWith(
      'dev-profile-1',
      'Development Environment (Copy)'
    );
  });

  it('should search profiles', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ProfileManager />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search profiles...');
    await user.type(searchInput, 'development');

    await waitFor(() => {
      expect(require('../../../utils/configurationProfiles').profileSearchEngine.searchProfiles)
        .toHaveBeenCalledWith(mockProfiles, 'development', expect.any(Object));
    });
  });

  it('should sort profiles', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ProfileManager />
      </TestWrapper>
    );

    const sortSelect = screen.getByLabelText(/sort by/i);
    await user.click(sortSelect);
    await user.click(screen.getByText('Name'));

    // Should trigger re-render with sorted profiles
    expect(screen.getByDisplayValue('name')).toBeInTheDocument();
  });

  it('should handle multi-select for comparison', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ProfileManager 
          onProfileCompare={mockOnProfileCompare}
        />
      </TestWrapper>
    );

    // Select first profile with Ctrl+click
    const firstCard = screen.getByText('Development Environment').closest('[role="button"]');
    if (firstCard) {
      await user.keyboard('{Control>}');
      await user.click(firstCard);
      await user.keyboard('{/Control}');
    }

    // Select second profile with Ctrl+click
    const secondCard = screen.getByText('Production Environment').closest('[role="button"]');
    if (secondCard) {
      await user.keyboard('{Control>}');
      await user.click(secondCard);
      await user.keyboard('{/Control}');
    }

    // Compare button should appear
    const compareButton = screen.getByRole('button', { name: /compare \(2\)/i });
    expect(compareButton).toBeInTheDocument();
    
    await user.click(compareButton);
    expect(mockOnProfileCompare).toHaveBeenCalledWith(mockProfiles);
  });

  it('should disable actions for read-only profiles', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ProfileManager />
      </TestWrapper>
    );

    // Open context menu for read-only profile (production)
    const moreButtons = screen.getAllByLabelText(/more/i);
    await user.click(moreButtons[1]);

    const editButton = screen.getByText('Edit Configuration');
    const deleteButton = screen.getByText('Delete');
    
    expect(editButton.closest('li')).toHaveAttribute('aria-disabled', 'true');
    expect(deleteButton.closest('li')).toHaveAttribute('aria-disabled', 'true');
  });

  it('should show empty state when no profiles exist', () => {
    (profileManager.getAllProfiles as any).mockReturnValue([]);
    (require('../../../utils/configurationProfiles').profileSearchEngine.searchProfiles as any)
      .mockReturnValue([]);
    
    render(
      <TestWrapper>
        <ProfileManager />
      </TestWrapper>
    );

    expect(screen.getByText('No profiles found')).toBeInTheDocument();
    expect(screen.getByText('Create your first configuration profile to get started')).toBeInTheDocument();
  });

  it('should show validation status icons', () => {
    render(
      <TestWrapper>
        <ProfileManager />
      </TestWrapper>
    );

    // Should show validation status icons for each profile
    const validIcon = screen.getByTitle('Validation: valid');
    const warningIcon = screen.getByTitle('Validation: warning');
    
    expect(validIcon).toBeInTheDocument();
    expect(warningIcon).toBeInTheDocument();
  });

  it('should display profile tags', () => {
    render(
      <TestWrapper>
        <ProfileManager />
      </TestWrapper>
    );

    expect(screen.getByText('development')).toBeInTheDocument();
    expect(screen.getByText('local')).toBeInTheDocument();
    expect(screen.getByText('production')).toBeInTheDocument();
    expect(screen.getByText('kubernetes')).toBeInTheDocument();
  });

  it('should handle error states gracefully', () => {
    (profileManager.getAllProfiles as any).mockImplementation(() => {
      throw new Error('Failed to load profiles');
    });

    // Should not crash and should handle the error
    render(
      <TestWrapper>
        <ProfileManager />
      </TestWrapper>
    );

    expect(screen.getByText('Configuration Profiles')).toBeInTheDocument();
  });
});