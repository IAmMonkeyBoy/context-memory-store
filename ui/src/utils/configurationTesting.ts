/**
 * Configuration Testing Framework
 * Phase 7.4.4 - Core testing utilities and test implementations
 */

import type {
  ConfigurationTest,
  TestResult,
  TestContext,
  TestMetrics,
  TestExecution,
  ExecutionSummary,
  HealthScore,
  TestSuite,
  ValidationRule,
  ValidationResult,
  ConfigurationQuality,
  TestCategory,
  TestPriority,
  ExecutionStatus
} from '../types/configurationTesting';
import type { SystemConfiguration, EnvironmentType } from '../types/configuration';

// =============================================================================
// Utility Functions
// =============================================================================

export const generateTestId = (): string => {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const calculateHealthScore = (results: TestResult[]): HealthScore => {
  const total = results.length;
  if (total === 0) {
    return {
      score: 0,
      grade: 'F',
      factors: [],
      recommendations: ['No tests have been executed']
    };
  }

  const passed = results.filter(r => r.passed).length;
  const criticalFailed = results.filter(r => !r.passed && r.severity === 'error').length;
  const warnings = results.filter(r => !r.passed && r.severity === 'warning').length;

  let score = (passed / total) * 100;
  
  // Penalize critical failures more heavily
  score -= criticalFailed * 20;
  score -= warnings * 5;
  
  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score));

  const getGrade = (score: number): 'A' | 'B' | 'C' | 'D' | 'F' => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const factors = [
    {
      category: 'Test Success Rate',
      score: (passed / total) * 100,
      weight: 0.6,
      impact: `${passed}/${total} tests passed`,
      details: 'Percentage of tests that completed successfully'
    },
    {
      category: 'Critical Issues',
      score: Math.max(0, 100 - (criticalFailed * 25)),
      weight: 0.3,
      impact: `${criticalFailed} critical failures`,
      details: 'Number of critical issues that must be addressed'
    },
    {
      category: 'Warnings',
      score: Math.max(0, 100 - (warnings * 10)),
      weight: 0.1,
      impact: `${warnings} warnings`,
      details: 'Number of warnings that should be reviewed'
    }
  ];

  const recommendations: string[] = [];
  if (criticalFailed > 0) {
    recommendations.push(`Address ${criticalFailed} critical failure(s) immediately`);
  }
  if (warnings > 0) {
    recommendations.push(`Review ${warnings} warning(s) for potential improvements`);
  }
  if (score < 80) {
    recommendations.push('Configuration needs significant improvements');
  }
  if (recommendations.length === 0) {
    recommendations.push('Configuration is in good health');
  }

  return {
    score: Math.round(score),
    grade: getGrade(score),
    factors,
    recommendations
  };
};

// =============================================================================
// Core Configuration Tests
// =============================================================================

export const configurationTests: ConfigurationTest[] = [
  // Connectivity Tests
  {
    id: 'qdrant-connectivity',
    name: 'Qdrant Vector Database Connectivity',
    description: 'Test connection and basic operations with Qdrant vector database',
    category: 'connectivity',
    priority: 'critical',
    timeout: 30000,
    dependencies: [],
    execute: async (config: SystemConfiguration, context?: TestContext): Promise<TestResult> => {
      const startTime = Date.now();
      const qdrantConfig = config.services.qdrant;
      
      try {
        // Test basic connectivity
        const healthResponse = await fetch(`${qdrantConfig.url}/health`, {
          signal: AbortSignal.timeout(qdrantConfig.timeout || 30000),
          headers: qdrantConfig.apiKey ? { 'Authorization': `Bearer ${qdrantConfig.apiKey}` } : {}
        });

        if (!healthResponse.ok) {
          return {
            testId: 'qdrant-connectivity',
            passed: false,
            duration: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            message: `Qdrant health check failed: ${healthResponse.status} ${healthResponse.statusText}`,
            severity: 'error',
            suggestions: [
              'Verify Qdrant service is running',
              'Check Qdrant URL configuration',
              'Validate API key if authentication is enabled'
            ]
          };
        }

        // Test collection operations
        const collectionsResponse = await fetch(`${qdrantConfig.url}/collections`, {
          signal: AbortSignal.timeout(qdrantConfig.timeout || 30000),
          headers: qdrantConfig.apiKey ? { 'Authorization': `Bearer ${qdrantConfig.apiKey}` } : {}
        });

        const collections = await collectionsResponse.json();
        
        // Test specific collection if configured
        let collectionExists = false;
        if (qdrantConfig.collection && collections.result?.collections) {
          collectionExists = collections.result.collections.some(
            (col: any) => col.name === qdrantConfig.collection
          );
        }

        const duration = Date.now() - startTime;
        const metrics: TestMetrics = {
          responseTime: duration,
          availability: 100
        };

        return {
          testId: 'qdrant-connectivity',
          passed: true,
          duration,
          timestamp: new Date().toISOString(),
          message: `Qdrant connectivity successful. ${collections.result?.collections?.length || 0} collections found.`,
          severity: 'success',
          details: {
            health: 'ok',
            collections: collections.result?.collections?.length || 0,
            targetCollection: qdrantConfig.collection,
            targetCollectionExists: collectionExists
          },
          suggestions: !collectionExists && qdrantConfig.collection ? [
            `Collection '${qdrantConfig.collection}' does not exist. It will be created automatically on first use.`
          ] : [],
          metrics
        };

      } catch (error: any) {
        return {
          testId: 'qdrant-connectivity',
          passed: false,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          message: `Qdrant connectivity failed: ${error.message}`,
          severity: 'error',
          suggestions: [
            'Check if Qdrant service is running and accessible',
            'Verify network connectivity to Qdrant URL',
            'Check firewall and security group settings',
            'Validate Qdrant configuration parameters'
          ]
        };
      }
    }
  },

  {
    id: 'neo4j-connectivity',
    name: 'Neo4j Graph Database Connectivity',
    description: 'Test connection and basic operations with Neo4j graph database',
    category: 'connectivity',
    priority: 'critical',
    timeout: 30000,
    dependencies: [],
    execute: async (config: SystemConfiguration, context?: TestContext): Promise<TestResult> => {
      const startTime = Date.now();
      const neo4jConfig = config.services.neo4j;
      
      try {
        // Convert bolt/neo4j URI to HTTP for testing
        const httpUri = neo4jConfig.uri
          .replace('bolt://', 'http://')
          .replace('neo4j://', 'http://')
          .replace(':7687', ':7474'); // Default HTTP port

        // Test Neo4j connectivity using HTTP API
        const authHeader = btoa(`${neo4jConfig.username}:${neo4jConfig.password}`);
        const response = await fetch(`${httpUri}/db/data/`, {
          signal: AbortSignal.timeout(30000),
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          return {
            testId: 'neo4j-connectivity',
            passed: false,
            duration: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            message: `Neo4j connectivity failed: ${response.status} ${response.statusText}`,
            severity: 'error',
            suggestions: [
              'Verify Neo4j service is running',
              'Check Neo4j URI configuration',
              'Validate username and password',
              'Ensure Neo4j HTTP connector is enabled'
            ]
          };
        }

        // Test query execution
        const queryResponse = await fetch(`${httpUri}/db/${neo4jConfig.database || 'neo4j'}/tx/commit`, {
          method: 'POST',
          signal: AbortSignal.timeout(30000),
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            statements: [{
              statement: 'RETURN 1 as test'
            }]
          })
        });

        const queryResult = await queryResponse.json();
        const duration = Date.now() - startTime;

        return {
          testId: 'neo4j-connectivity',
          passed: queryResult.errors?.length === 0,
          duration,
          timestamp: new Date().toISOString(),
          message: queryResult.errors?.length === 0 
            ? 'Neo4j connectivity and query execution successful'
            : `Neo4j query failed: ${queryResult.errors[0]?.message}`,
          severity: queryResult.errors?.length === 0 ? 'success' : 'error',
          details: {
            database: neo4jConfig.database || 'neo4j',
            queryExecuted: true,
            errors: queryResult.errors
          },
          metrics: {
            responseTime: duration,
            availability: queryResult.errors?.length === 0 ? 100 : 0
          }
        };

      } catch (error: any) {
        return {
          testId: 'neo4j-connectivity',
          passed: false,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          message: `Neo4j connectivity failed: ${error.message}`,
          severity: 'error',
          suggestions: [
            'Check if Neo4j service is running',
            'Verify Neo4j URI and port configuration',
            'Check network connectivity',
            'Validate Neo4j authentication credentials'
          ]
        };
      }
    }
  },

  {
    id: 'ollama-connectivity',
    name: 'Ollama LLM Service Connectivity',
    description: 'Test connection and basic operations with Ollama LLM service',
    category: 'connectivity',
    priority: 'critical',
    timeout: 60000,
    dependencies: [],
    execute: async (config: SystemConfiguration, context?: TestContext): Promise<TestResult> => {
      const startTime = Date.now();
      const ollamaConfig = config.services.ollama;
      
      try {
        // Test basic connectivity
        const healthResponse = await fetch(`${ollamaConfig.baseUrl}/api/tags`, {
          signal: AbortSignal.timeout(ollamaConfig.timeout || 60000)
        });

        if (!healthResponse.ok) {
          return {
            testId: 'ollama-connectivity',
            passed: false,
            duration: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            message: `Ollama connectivity failed: ${healthResponse.status} ${healthResponse.statusText}`,
            severity: 'error',
            suggestions: [
              'Verify Ollama service is running',
              'Check Ollama base URL configuration',
              'Ensure Ollama API is accessible'
            ]
          };
        }

        const models = await healthResponse.json();
        
        // Check if configured models are available
        const availableModels = models.models?.map((m: any) => m.name) || [];
        const chatModelAvailable = availableModels.includes(ollamaConfig.chatModel);
        const embeddingModelAvailable = availableModels.includes(ollamaConfig.embeddingModel);

        const duration = Date.now() - startTime;
        const allModelsAvailable = chatModelAvailable && embeddingModelAvailable;

        return {
          testId: 'ollama-connectivity',
          passed: allModelsAvailable,
          duration,
          timestamp: new Date().toISOString(),
          message: allModelsAvailable 
            ? `Ollama connectivity successful. Required models available.`
            : `Ollama connected but some required models are missing.`,
          severity: allModelsAvailable ? 'success' : 'warning',
          details: {
            totalModels: availableModels.length,
            availableModels,
            chatModel: ollamaConfig.chatModel,
            chatModelAvailable,
            embeddingModel: ollamaConfig.embeddingModel,
            embeddingModelAvailable
          },
          suggestions: [
            ...(chatModelAvailable ? [] : [`Pull chat model: ollama pull ${ollamaConfig.chatModel}`]),
            ...(embeddingModelAvailable ? [] : [`Pull embedding model: ollama pull ${ollamaConfig.embeddingModel}`])
          ],
          metrics: {
            responseTime: duration,
            availability: 100
          }
        };

      } catch (error: any) {
        return {
          testId: 'ollama-connectivity',
          passed: false,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          message: `Ollama connectivity failed: ${error.message}`,
          severity: 'error',
          suggestions: [
            'Check if Ollama service is running',
            'Verify Ollama base URL configuration',
            'Check network connectivity to Ollama service'
          ]
        };
      }
    }
  },

  // Performance Tests
  {
    id: 'performance-impact-analysis',
    name: 'Configuration Performance Impact Analysis',
    description: 'Analyze the performance impact of current configuration settings',
    category: 'performance',
    priority: 'high',
    timeout: 60000,
    dependencies: ['qdrant-connectivity', 'neo4j-connectivity'],
    execute: async (config: SystemConfiguration, context?: TestContext): Promise<TestResult> => {
      const startTime = Date.now();
      const issues: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];
      let score = 100;

      // Analyze batch processing settings
      if (config.features.batchProcessing.enabled) {
        const batchSize = config.features.batchProcessing.batchSize;
        const maxConcurrency = config.features.batchProcessing.maxConcurrency;

        if (batchSize > 1000) {
          issues.push('Batch size exceeds recommended maximum (1000)');
          suggestions.push('Consider reducing batch size to 100-500 for optimal memory usage');
          score -= 20;
        }

        if (maxConcurrency > 10) {
          warnings.push('High concurrency may overwhelm downstream services');
          suggestions.push('Consider limiting concurrency to 5-10 for better stability');
          score -= 10;
        }

        if (batchSize > 100 && maxConcurrency > 5) {
          warnings.push('High batch size combined with high concurrency may cause memory issues');
          suggestions.push('Reduce either batch size or concurrency for better resource management');
          score -= 15;
        }
      }

      // Analyze caching settings
      if (config.features.caching.enabled) {
        const maxSize = config.features.caching.maxSize;
        const ttl = config.features.caching.ttl;

        if (maxSize < 1000) {
          warnings.push('Cache size may be too small for optimal performance');
          suggestions.push('Consider increasing cache size to 5000+ for better hit rates');
          score -= 10;
        }

        if (ttl < 300) {
          warnings.push('Cache TTL is very short, may cause frequent cache misses');
          suggestions.push('Consider increasing TTL to 300-3600 seconds for better performance');
          score -= 5;
        }
      } else {
        warnings.push('Caching is disabled, which may impact performance');
        suggestions.push('Enable caching for better response times');
        score -= 15;
      }

      // Analyze service timeouts
      const qdrantTimeout = config.services.qdrant.timeout;
      const ollamaTimeout = config.services.ollama.timeout;

      if (qdrantTimeout < 5000) {
        warnings.push('Qdrant timeout is very short, may cause frequent timeouts');
        suggestions.push('Consider increasing Qdrant timeout to 10-30 seconds');
        score -= 5;
      }

      if (ollamaTimeout < 30000) {
        warnings.push('Ollama timeout may be too short for large model operations');
        suggestions.push('Consider increasing Ollama timeout to 60+ seconds for complex queries');
        score -= 5;
      }

      const duration = Date.now() - startTime;
      const passed = issues.length === 0;

      return {
        testId: 'performance-impact-analysis',
        passed,
        duration,
        timestamp: new Date().toISOString(),
        message: passed 
          ? `Performance analysis complete. Score: ${score}/100`
          : `Performance issues detected. Score: ${score}/100`,
        severity: issues.length > 0 ? 'warning' : warnings.length > 0 ? 'info' : 'success',
        details: {
          score,
          issues,
          warnings,
          analysisPoints: [
            'Batch processing configuration',
            'Caching strategy',
            'Service timeout settings',
            'Resource utilization patterns'
          ]
        },
        suggestions,
        metrics: {
          responseTime: duration,
          score
        }
      };
    }
  },

  // Security Tests
  {
    id: 'security-configuration-audit',
    name: 'Security Configuration Audit',
    description: 'Audit security-related configuration settings for vulnerabilities',
    category: 'security',
    priority: 'critical',
    timeout: 30000,
    dependencies: [],
    execute: async (config: SystemConfiguration, context?: TestContext): Promise<TestResult> => {
      const startTime = Date.now();
      const vulnerabilities: string[] = [];
      const recommendations: string[] = [];
      let securityScore = 100;

      // Check HTTPS configuration
      if (!config.security.https.enabled) {
        vulnerabilities.push('HTTPS is disabled - data transmission is not encrypted');
        recommendations.push('Enable HTTPS for secure data transmission');
        securityScore -= 30;
      }

      // Check authentication
      if (!config.api.authentication.enabled) {
        vulnerabilities.push('API authentication is disabled - unauthorized access possible');
        recommendations.push('Enable API authentication to secure endpoints');
        securityScore -= 25;
      }

      // Check CORS configuration
      if (config.api.corsEnabled && config.api.corsOrigins.includes('*')) {
        vulnerabilities.push('CORS allows all origins (*) - potential security risk');
        recommendations.push('Specify explicit CORS origins instead of using wildcard');
        securityScore -= 15;
      }

      // Check rate limiting
      if (!config.api.rateLimiting.enabled) {
        vulnerabilities.push('Rate limiting is disabled - vulnerable to DoS attacks');
        recommendations.push('Enable rate limiting to prevent abuse');
        securityScore -= 10;
      }

      // Check security headers
      const headers = config.security.headers;
      if (!headers.contentSecurityPolicy || headers.contentSecurityPolicy === '') {
        vulnerabilities.push('Content Security Policy header is not configured');
        recommendations.push('Configure CSP header to prevent XSS attacks');
        securityScore -= 10;
      }

      if (!headers.strictTransportSecurity || headers.strictTransportSecurity === '') {
        vulnerabilities.push('Strict Transport Security header is not configured');
        recommendations.push('Configure HSTS header to enforce HTTPS');
        securityScore -= 5;
      }

      // Check debug mode in production
      if (context?.environment === 'production' && config.features.debugMode) {
        vulnerabilities.push('Debug mode is enabled in production environment');
        recommendations.push('Disable debug mode in production for security');
        securityScore -= 20;
      }

      const duration = Date.now() - startTime;
      const passed = vulnerabilities.length === 0;

      return {
        testId: 'security-configuration-audit',
        passed,
        duration,
        timestamp: new Date().toISOString(),
        message: passed 
          ? `Security audit passed. Score: ${securityScore}/100`
          : `Security vulnerabilities detected. Score: ${securityScore}/100`,
        severity: vulnerabilities.length > 0 ? 'error' : 'success',
        details: {
          securityScore,
          vulnerabilities,
          auditAreas: [
            'HTTPS configuration',
            'Authentication settings',
            'CORS policy',
            'Rate limiting',
            'Security headers',
            'Debug mode settings'
          ]
        },
        suggestions: recommendations,
        metrics: {
          responseTime: duration,
          score: securityScore
        }
      };
    }
  }
];

// =============================================================================
// Test Execution Engine
// =============================================================================

export class ConfigurationTestRunner {
  private executions: Map<string, TestExecution> = new Map();
  
  async executeTests(
    testIds: string[],
    config: SystemConfiguration,
    context: TestContext
  ): Promise<TestExecution> {
    const executionId = generateTestId();
    const execution: TestExecution = {
      id: executionId,
      testIds,
      status: 'running',
      startTime: new Date().toISOString(),
      results: [],
      summary: {
        total: testIds.length,
        passed: 0,
        failed: 0,
        skipped: 0,
        successRate: 0,
        criticalFailures: 0,
        overallHealth: {
          score: 0,
          grade: 'F',
          factors: [],
          recommendations: []
        }
      },
      context,
      triggeredBy: context.userId || 'system'
    };

    this.executions.set(executionId, execution);

    try {
      // Get tests to run
      const testsToRun = configurationTests.filter(test => testIds.includes(test.id));
      
      // Sort tests by dependencies (topological sort)
      const sortedTests = this.topologicalSort(testsToRun);
      
      const results: TestResult[] = [];

      for (const test of sortedTests) {
        try {
          const result = await test.execute(config, context);
          results.push(result);
          
          // Update execution with partial results
          execution.results = results;
          this.executions.set(executionId, execution);
          
          // If critical test fails, consider stopping execution
          if (!result.passed && test.priority === 'critical') {
            // For now, continue with other tests but note the critical failure
          }
        } catch (error: any) {
          const errorResult: TestResult = {
            testId: test.id,
            passed: false,
            duration: 0,
            timestamp: new Date().toISOString(),
            message: `Test execution failed: ${error.message}`,
            severity: 'error',
            suggestions: ['Check test configuration', 'Contact system administrator']
          };
          results.push(errorResult);
        }
      }

      // Calculate summary
      const summary = this.calculateSummary(results);
      
      execution.status = 'completed';
      execution.endTime = new Date().toISOString();
      execution.duration = new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime();
      execution.results = results;
      execution.summary = summary;

      this.executions.set(executionId, execution);
      
      return execution;
      
    } catch (error: any) {
      execution.status = 'failed';
      execution.endTime = new Date().toISOString();
      execution.duration = new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime();
      
      this.executions.set(executionId, execution);
      throw error;
    }
  }

  private topologicalSort(tests: ConfigurationTest[]): ConfigurationTest[] {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const result: ConfigurationTest[] = [];
    const testMap = new Map(tests.map(t => [t.id, t]));

    const visit = (testId: string) => {
      if (temp.has(testId)) {
        throw new Error(`Circular dependency detected involving test: ${testId}`);
      }
      if (visited.has(testId)) {
        return;
      }

      temp.add(testId);
      const test = testMap.get(testId);
      if (test) {
        for (const depId of test.dependencies) {
          if (testMap.has(depId)) {
            visit(depId);
          }
        }
        temp.delete(testId);
        visited.add(testId);
        result.push(test);
      }
    };

    for (const test of tests) {
      if (!visited.has(test.id)) {
        visit(test.id);
      }
    }

    return result;
  }

  private calculateSummary(results: TestResult[]): ExecutionSummary {
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const skipped = 0; // Not implementing skipped tests yet
    const successRate = total > 0 ? (passed / total) * 100 : 0;
    const criticalFailures = results.filter(r => !r.passed && r.severity === 'error').length;
    const overallHealth = calculateHealthScore(results);

    return {
      total,
      passed,
      failed,
      skipped,
      successRate,
      criticalFailures,
      overallHealth
    };
  }

  getExecution(executionId: string): TestExecution | undefined {
    return this.executions.get(executionId);
  }

  getAllExecutions(): TestExecution[] {
    return Array.from(this.executions.values());
  }
}

// =============================================================================
// Test Suites Management
// =============================================================================

export const predefinedTestSuites: TestSuite[] = [
  {
    id: 'connectivity-suite',
    name: 'Service Connectivity Tests',
    description: 'Test connectivity to all external services',
    tests: configurationTests.filter(t => t.category === 'connectivity'),
    tags: ['connectivity', 'services', 'critical']
  },
  {
    id: 'performance-suite',
    name: 'Performance Analysis Tests',
    description: 'Analyze configuration performance impact',
    tests: configurationTests.filter(t => t.category === 'performance'),
    tags: ['performance', 'optimization', 'analysis']
  },
  {
    id: 'security-suite',
    name: 'Security Audit Tests',
    description: 'Security configuration audit and vulnerability assessment',
    tests: configurationTests.filter(t => t.category === 'security'),
    tags: ['security', 'audit', 'compliance']
  },
  {
    id: 'full-suite',
    name: 'Complete Configuration Test Suite',
    description: 'Run all available configuration tests',
    tests: configurationTests,
    tags: ['complete', 'comprehensive', 'all']
  }
];

// =============================================================================
// Export instances
// =============================================================================

export const testRunner = new ConfigurationTestRunner();

export default {
  configurationTests,
  testRunner,
  predefinedTestSuites,
  calculateHealthScore,
  generateTestId
};