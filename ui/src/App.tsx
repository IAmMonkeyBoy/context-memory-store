import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { useThemeMode } from '@hooks';
import { getTheme } from '@theme';
import { config } from '@utils';
import AppShell from './components/Layout/AppShell';

// Pages
import Dashboard from './pages/Dashboard/Dashboard';
import DocumentsIngest from './pages/Documents/DocumentsIngest';
import SystemHealth from './pages/System/SystemHealth';
import { MemoryManagement, DocumentBrowser, ContextRetrieval, MemoryAnalytics } from './pages/Memory';

// Placeholder components for routes not yet implemented
const PlaceholderPage: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div>
    <h1>{title}</h1>
    <p>{description}</p>
    <p>This page will be implemented in a future phase.</p>
  </div>
);

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  const { mode, toggleMode } = useThemeMode();
  const theme = getTheme(mode);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AppShell onThemeToggle={toggleMode} themeMode={mode}>
            <Routes>
              {/* Default redirect to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Dashboard */}
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Documents */}
              <Route path="/documents/ingest" element={<DocumentsIngest />} />
              <Route 
                path="/documents/browse" 
                element={
                  <PlaceholderPage 
                    title="Document Browser" 
                    description="Browse and manage uploaded documents with advanced filtering and search capabilities." 
                  />
                } 
              />
              <Route 
                path="/documents/search" 
                element={
                  <PlaceholderPage 
                    title="Document Search" 
                    description="Perform semantic searches across your document collection." 
                  />
                } 
              />
              
              {/* Memory */}
              <Route path="/memory/management" element={<MemoryManagement />} />
              <Route path="/memory/browser" element={<DocumentBrowser />} />
              <Route path="/memory/context" element={<ContextRetrieval />} />
              <Route path="/memory/analytics" element={<MemoryAnalytics />} />
              
              {/* System */}
              <Route path="/system/health" element={<SystemHealth />} />
              <Route 
                path="/system/metrics" 
                element={
                  <PlaceholderPage 
                    title="System Metrics" 
                    description="Comprehensive metrics dashboard with historical data and performance analytics." 
                  />
                } 
              />
              <Route 
                path="/system/diagnostics" 
                element={
                  <PlaceholderPage 
                    title="System Diagnostics" 
                    description="Advanced diagnostic tools and troubleshooting recommendations." 
                  />
                } 
              />
              <Route 
                path="/system/lifecycle" 
                element={
                  <PlaceholderPage 
                    title="Lifecycle Management" 
                    description="Control memory engine lifecycle, project configuration, and persistence." 
                  />
                } 
              />
              
              {/* Catch-all route */}
              <Route 
                path="*" 
                element={
                  <PlaceholderPage 
                    title="Page Not Found" 
                    description="The requested page could not be found." 
                  />
                } 
              />
            </Routes>
          </AppShell>
        </Router>
        
        {/* React Query DevTools (only in development) */}
        {config.environment === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;