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
        id: 'memory-management', 
        label: 'Management', 
        icon: 'storage', 
        path: '/memory/management' 
      },
      { 
        id: 'document-browser', 
        label: 'Document Browser', 
        icon: 'search', 
        path: '/memory/browser' 
      },
      { 
        id: 'context-retrieval', 
        label: 'Context', 
        icon: 'account_tree', 
        path: '/memory/context' 
      },
      { 
        id: 'memory-analytics', 
        label: 'Analytics', 
        icon: 'analytics', 
        path: '/memory/analytics' 
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