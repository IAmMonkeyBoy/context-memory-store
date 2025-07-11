import { NavigationItem } from '@types';

export const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/dashboard'
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: 'description',
    path: '/documents',
    children: [
      { 
        id: 'ingest', 
        label: 'Ingest', 
        icon: 'upload', 
        path: '/documents/ingest' 
      },
      { 
        id: 'browse', 
        label: 'Browse', 
        icon: 'folder', 
        path: '/documents/browse' 
      },
      { 
        id: 'search', 
        label: 'Search', 
        icon: 'search', 
        path: '/documents/search' 
      }
    ]
  },
  {
    id: 'memory',
    label: 'Memory',
    icon: 'memory',
    path: '/memory',
    children: [
      { 
        id: 'context', 
        label: 'Context', 
        icon: 'hub', 
        path: '/memory/context' 
      },
      { 
        id: 'analysis', 
        label: 'Analysis', 
        icon: 'analytics', 
        path: '/memory/analysis' 
      },
      { 
        id: 'relationships', 
        label: 'Relationships', 
        icon: 'account_tree', 
        path: '/memory/relationships' 
      }
    ]
  },
  {
    id: 'system',
    label: 'System',
    icon: 'settings',
    path: '/system',
    children: [
      { 
        id: 'health', 
        label: 'Health', 
        icon: 'health_and_safety', 
        path: '/system/health' 
      },
      { 
        id: 'metrics', 
        label: 'Metrics', 
        icon: 'bar_chart', 
        path: '/system/metrics' 
      },
      { 
        id: 'diagnostics', 
        label: 'Diagnostics', 
        icon: 'bug_report', 
        path: '/system/diagnostics' 
      },
      { 
        id: 'lifecycle', 
        label: 'Lifecycle', 
        icon: 'power_settings_new', 
        path: '/system/lifecycle' 
      }
    ]
  }
];