/**
 * Configuration Profile Comparison
 * Phase 7.4.3 - Interface for comparing configuration profiles
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Stack,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Compare as CompareIcon,
  SwapHoriz as SwapIcon,
  FileDownload as ExportIcon,
  Merge as MergeIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Remove as RemoveIcon,
  Add as AddIcon,
  Edit as ChangeIcon,
  Close as CloseIcon
} from '@mui/icons-material';

import type {
  ConfigurationProfile,
  ProfileComparison,
  ProfileDifference
} from '../../types/configurationProfiles';
import { profileComparator } from '../../utils/configurationProfiles';

interface ProfileComparisonProps {
  profiles: ConfigurationProfile[];
  onClose?: () => void;
  onMerge?: (merged: ConfigurationProfile) => void;
}

const SEVERITY_COLORS = {
  low: 'info',
  medium: 'warning', 
  high: 'error',
  critical: 'error'
} as const;

const SEVERITY_ICONS = {
  low: InfoIcon,
  medium: WarningIcon,
  high: ErrorIcon,
  critical: ErrorIcon
};

const DIFF_TYPE_ICONS = {
  added: AddIcon,
  removed: RemoveIcon,
  changed: ChangeIcon,
  conflict: ErrorIcon
};

const DIFF_TYPE_COLORS = {
  added: 'success',
  removed: 'error',
  changed: 'warning',
  conflict: 'error'
} as const;

export const ProfileComparison: React.FC<ProfileComparisonProps> = ({
  profiles,
  onClose,
  onMerge
}) => {
  const [selectedProfiles, setSelectedProfiles] = useState<[number, number]>([0, 1]);
  const [comparison, setComparison] = useState<ProfileComparison | null>(null);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified' | 'tree'>('side-by-side');
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
  const [highlightLevel, setHighlightLevel] = useState<'all' | 'medium' | 'high' | 'critical'>('all');
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['summary']);

  // Perform comparison when profiles change
  useEffect(() => {
    if (profiles.length >= 2) {
      performComparison();
    }
  }, [selectedProfiles, profiles]);

  const performComparison = async () => {
    if (profiles.length < 2) return;

    setLoading(true);
    try {
      const [indexA, indexB] = selectedProfiles;
      const profileA = profiles[indexA];
      const profileB = profiles[indexB];
      
      if (profileA && profileB) {
        const result = profileComparator.compareProfiles(profileA, profileB);
        setComparison(result);
      }
    } catch (error) {
      console.error('Comparison failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered differences based on highlight level
  const filteredDifferences = useMemo(() => {
    if (!comparison) return [];
    
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const minSeverity = severityOrder[highlightLevel];
    
    return comparison.differences.filter(diff => 
      severityOrder[diff.severity] >= minSeverity
    );
  }, [comparison, highlightLevel]);

  // Group differences by category/section
  const groupedDifferences = useMemo(() => {
    const groups: Record<string, ProfileDifference[]> = {};
    
    filteredDifferences.forEach(diff => {
      const section = diff.path.split('.')[1] || 'metadata';
      if (!groups[section]) {
        groups[section] = [];
      }
      groups[section].push(diff);
    });
    
    return groups;
  }, [filteredDifferences]);

  const handleSwapProfiles = () => {
    setSelectedProfiles(prev => [prev[1], prev[0]]);
  };

  const handleProfileChange = (index: 0 | 1, profileIndex: number) => {
    setSelectedProfiles(prev => {
      const newSelection: [number, number] = [...prev];
      newSelection[index] = profileIndex;
      return newSelection;
    });
  };

  const handleToggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const renderProfileHeader = (profile: ConfigurationProfile, side: 'A' | 'B') => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="between" mb={1}>
          <Typography variant="h6">{profile.name}</Typography>
          <Chip 
            label={`Profile ${side}`} 
            color={side === 'A' ? 'primary' : 'secondary'} 
            size="small" 
          />
        </Box>
        <Typography variant="body2" color="text.secondary" mb={1}>
          {profile.description}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip label={profile.environment} size="small" />
          <Chip label={profile.category} variant="outlined" size="small" />
          <Chip label={`v${profile.version}`} variant="outlined" size="small" />
          {profile.inheritanceChain && profile.inheritanceChain.length > 0 && (
            <Chip label={`Inherits (${profile.inheritanceChain.length})`} variant="outlined" size="small" />
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  const renderComparisonSummary = () => {
    if (!comparison) return null;

    const { summary, compatibility } = comparison;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Comparison Summary
          </Typography>
          
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {summary.totalDifferences}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Differences
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color={summary.riskLevel === 'low' ? 'success.main' : summary.riskLevel === 'medium' ? 'warning.main' : 'error.main'}>
                  {summary.compatibilityScore}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Compatibility
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {summary.affectedSections.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Affected Sections
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color={compatibility.isCompatible ? 'success.main' : 'error.main'}>
                  {compatibility.isCompatible ? 'Yes' : 'No'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Compatible
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Difference breakdown */}
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>Differences by Type</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {Object.entries(summary.byType).map(([type, count]) => (
                <Chip
                  key={type}
                  icon={React.createElement(DIFF_TYPE_ICONS[type as keyof typeof DIFF_TYPE_ICONS])}
                  label={`${type}: ${count}`}
                  color={DIFF_TYPE_COLORS[type as keyof typeof DIFF_TYPE_COLORS]}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Stack>
          </Box>

          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>Differences by Severity</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {Object.entries(summary.bySeverity).map(([severity, count]) => (
                <Chip
                  key={severity}
                  label={`${severity}: ${count}`}
                  color={SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS]}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Stack>
          </Box>

          {/* Compatibility warnings */}
          {compatibility.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Compatibility Warnings:</Typography>
              {compatibility.warnings.map((warning, index) => (
                <Typography key={index} variant="body2">• {warning}</Typography>
              ))}
            </Alert>
          )}

          {/* Blockers */}
          {compatibility.blockers.length > 0 && (
            <Alert severity="error">
              <Typography variant="subtitle2" gutterBottom>Compatibility Blockers:</Typography>
              {compatibility.blockers.map((blocker, index) => (
                <Typography key={index} variant="body2">• {blocker}</Typography>
              ))}
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderDifferenceItem = (diff: ProfileDifference) => {
    const SeverityIcon = SEVERITY_ICONS[diff.severity];
    const TypeIcon = DIFF_TYPE_ICONS[diff.type];

    return (
      <TableRow key={diff.path}>
        <TableCell>
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title={`Severity: ${diff.severity}`}>
              <SeverityIcon 
                color={SEVERITY_COLORS[diff.severity] as any} 
                fontSize="small" 
              />
            </Tooltip>
            <Tooltip title={`Type: ${diff.type}`}>
              <TypeIcon 
                color={DIFF_TYPE_COLORS[diff.type] as any} 
                fontSize="small" 
              />
            </Tooltip>
            <Typography variant="body2" fontFamily="monospace">
              {diff.path}
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {diff.valueA !== undefined ? JSON.stringify(diff.valueA) : '—'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {diff.valueB !== undefined ? JSON.stringify(diff.valueB) : '—'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{diff.description}</Typography>
          {diff.recommendation && (
            <Typography variant="caption" color="text.secondary" display="block">
              💡 {diff.recommendation}
            </Typography>
          )}
        </TableCell>
      </TableRow>
    );
  };

  const renderDifferencesTable = () => {
    if (!comparison || filteredDifferences.length === 0) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <SuccessIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
          <Typography variant="h6" gutterBottom>No Differences Found</Typography>
          <Typography variant="body2" color="text.secondary">
            The selected profiles are identical at the current highlight level.
          </Typography>
        </Paper>
      );
    }

    return (
      <Box>
        {Object.entries(groupedDifferences).map(([section, diffs]) => (
          <Accordion 
            key={section}
            expanded={expandedSections.includes(section)}
            onChange={() => handleToggleSection(section)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={2} width="100%">
                <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                  {section.replace(/([A-Z])/g, ' $1').trim()}
                </Typography>
                <Chip 
                  label={`${diffs.length} differences`} 
                  size="small" 
                  color="primary" 
                />
                <Box sx={{ flexGrow: 1 }} />
                <Stack direction="row" spacing={1}>
                  {['critical', 'high', 'medium', 'low'].map(severity => {
                    const count = diffs.filter(d => d.severity === severity).length;
                    if (count === 0) return null;
                    return (
                      <Chip
                        key={severity}
                        label={count}
                        size="small"
                        color={SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS]}
                      />
                    );
                  })}
                </Stack>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Configuration Path</TableCell>
                      <TableCell>{comparison.profileA.name}</TableCell>
                      <TableCell>{comparison.profileB.name}</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {diffs.map(renderDifferenceItem)}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  if (profiles.length < 2) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CompareIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          Select at least 2 profiles to compare
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Profile Comparison</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            disabled={!comparison}
          >
            Export Report
          </Button>
          {comparison?.compatibility.canMigrate && (
            <Button
              variant="contained"
              startIcon={<MergeIcon />}
              onClick={() => {
                // Handle merge logic
                console.log('Merge profiles');
              }}
            >
              Merge Profiles
            </Button>
          )}
          {onClose && (
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Profile Selection */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <FormControl fullWidth>
              <InputLabel>Profile A</InputLabel>
              <Select
                value={selectedProfiles[0]}
                onChange={(e) => handleProfileChange(0, e.target.value as number)}
              >
                {profiles.map((profile, index) => (
                  <MenuItem key={profile.id} value={index} disabled={index === selectedProfiles[1]}>
                    {profile.name} ({profile.environment})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2} textAlign="center">
            <IconButton onClick={handleSwapProfiles} size="large">
              <SwapIcon />
            </IconButton>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <FormControl fullWidth>
              <InputLabel>Profile B</InputLabel>
              <Select
                value={selectedProfiles[1]}
                onChange={(e) => handleProfileChange(1, e.target.value as number)}
              >
                {profiles.map((profile, index) => (
                  <MenuItem key={profile.id} value={index} disabled={index === selectedProfiles[0]}>
                    {profile.name} ({profile.environment})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Comparison Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>View Mode</InputLabel>
              <Select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as any)}
              >
                <MenuItem value="side-by-side">Side by Side</MenuItem>
                <MenuItem value="unified">Unified</MenuItem>
                <MenuItem value="tree">Tree View</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Highlight Level</InputLabel>
              <Select
                value={highlightLevel}
                onChange={(e) => setHighlightLevel(e.target.value as any)}
              >
                <MenuItem value="all">All Differences</MenuItem>
                <MenuItem value="medium">Medium & Above</MenuItem>
                <MenuItem value="high">High & Critical</MenuItem>
                <MenuItem value="critical">Critical Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={showOnlyDifferences}
                  onChange={(e) => setShowOnlyDifferences(e.target.checked)}
                />
              }
              label="Show only differences"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              {filteredDifferences.length} differences shown
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Profile Headers */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={6}>
          {renderProfileHeader(profiles[selectedProfiles[0]], 'A')}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderProfileHeader(profiles[selectedProfiles[1]], 'B')}
        </Grid>
      </Grid>

      {/* Comparison Results */}
      {comparison && (
        <Box>
          {renderComparisonSummary()}
          <Divider sx={{ my: 3 }} />
          {renderDifferencesTable()}
        </Box>
      )}
    </Box>
  );
};