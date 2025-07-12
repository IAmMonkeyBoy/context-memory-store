/**
 * Configuration Health Monitoring & Alerting System
 * Phase 7.4.5 - Real-time health monitoring and alerting for configuration management
 */

import type {
  ConfigurationHealth,
  HealthStatus,
  ComponentHealth,
  HealthMetrics,
  HealthAlert,
  HealthTrend,
  HealthDataPoint,
  HealthForecast
} from '../types/configurationImportExport';
import type { SystemConfiguration } from '../types/configuration';
import type { EnvironmentType } from '../types/configurationProfiles';

// =============================================================================
// Configuration Health Monitor
// =============================================================================

export class ConfigurationHealthMonitor {
  private static healthHistory: Map<string, HealthDataPoint[]> = new Map();
  private static activeAlerts: Map<string, HealthAlert> = new Map();
  private static thresholds: HealthThresholds = {
    responseTime: { warning: 1000, critical: 3000 },
    errorRate: { warning: 5, critical: 15 },
    availability: { warning: 95, critical: 90 },
    resourceUsage: { warning: 80, critical: 95 },
    configurationDrift: { warning: 10, critical: 25 }
  };

  /**
   * Monitor configuration health
   */
  static async monitorHealth(
    config: SystemConfiguration,
    environment: EnvironmentType = 'development'
  ): Promise<ConfigurationHealth> {
    const timestamp = new Date().toISOString();
    
    // Collect current metrics
    const metrics = await this.collectHealthMetrics(config);
    
    // Assess component health
    const components = await this.assessComponentHealth(config, metrics);
    
    // Calculate overall health status
    const overall = this.calculateOverallHealth(components, metrics);
    
    // Check for alerts
    const alerts = this.checkHealthAlerts(components, metrics);
    
    // Analyze trends
    const trends = this.analyzeTrends(metrics);
    
    // Generate recommendations
    const recommendations = this.generateHealthRecommendations(overall, components, alerts);

    // Store health data for trend analysis
    this.storeHealthData('overall', overall.score, timestamp, { environment });

    return {
      overall,
      components,
      metrics,
      alerts,
      trends,
      recommendations,
      lastChecked: timestamp
    };
  }

  /**
   * Collect comprehensive health metrics
   */
  private static async collectHealthMetrics(config: SystemConfiguration): Promise<HealthMetrics> {
    // Simulate metric collection - in real implementation, these would be actual service calls
    const metrics: HealthMetrics = {
      response_time: await this.measureResponseTime(config),
      error_rate: await this.calculateErrorRate(config),
      throughput: await this.measureThroughput(config),
      resource_usage: {
        cpu: await this.getCPUUsage(),
        memory: await this.getMemoryUsage(config),
        disk: await this.getDiskUsage(),
        network: await this.getNetworkUsage()
      },
      configuration_drift: await this.calculateConfigurationDrift(config),
      security_score: await this.calculateSecurityScore(config),
      compliance_score: await this.calculateComplianceScore(config)
    };

    return metrics;
  }

  /**
   * Assess health of individual components
   */
  private static async assessComponentHealth(
    config: SystemConfiguration,
    metrics: HealthMetrics
  ): Promise<ComponentHealth[]> {
    const components: ComponentHealth[] = [];

    // Qdrant Vector Store Health
    components.push(await this.assessQdrantHealth(config, metrics));
    
    // Neo4j Graph Database Health
    components.push(await this.assessNeo4jHealth(config, metrics));
    
    // Ollama LLM Service Health
    components.push(await this.assessOllamaHealth(config, metrics));
    
    // API Server Health
    components.push(await this.assessAPIHealth(config, metrics));
    
    // Caching System Health
    components.push(await this.assessCachingHealth(config, metrics));
    
    // Security System Health
    components.push(await this.assessSecurityHealth(config, metrics));

    return components;
  }

  /**
   * Calculate overall health status
   */
  private static calculateOverallHealth(
    components: ComponentHealth[],
    metrics: HealthMetrics
  ): HealthStatus {
    const componentScores = components.map(c => c.score);
    const averageScore = componentScores.reduce((sum, score) => sum + score, 0) / componentScores.length;
    
    // Factor in key metrics
    let adjustedScore = averageScore;
    
    if (metrics.error_rate > this.thresholds.errorRate.critical) {
      adjustedScore -= 20;
    } else if (metrics.error_rate > this.thresholds.errorRate.warning) {
      adjustedScore -= 10;
    }
    
    if (metrics.response_time > this.thresholds.responseTime.critical) {
      adjustedScore -= 15;
    } else if (metrics.response_time > this.thresholds.responseTime.warning) {
      adjustedScore -= 8;
    }
    
    // Ensure score is between 0 and 100
    adjustedScore = Math.max(0, Math.min(100, adjustedScore));
    
    const status = this.getHealthStatusLevel(adjustedScore);
    const grade = this.getHealthGrade(adjustedScore);
    
    // Calculate uptime and availability
    const uptime = this.calculateUptime(components);
    const availability = this.calculateAvailability(metrics);

    return {
      status,
      score: Math.round(adjustedScore),
      grade,
      message: this.generateHealthMessage(status, adjustedScore),
      uptime,
      availability
    };
  }

  /**
   * Check for health alerts
   */
  private static checkHealthAlerts(
    components: ComponentHealth[],
    metrics: HealthMetrics
  ): HealthAlert[] {
    const alerts: HealthAlert[] = [];
    const timestamp = new Date().toISOString();

    // Check response time alerts
    if (metrics.response_time > this.thresholds.responseTime.critical) {
      alerts.push(this.createAlert(
        'response-time-critical',
        'critical',
        'system',
        `Response time ${metrics.response_time}ms exceeds critical threshold`,
        timestamp,
        { metric: 'response_time', value: this.thresholds.responseTime.critical, operator: '>' }
      ));
    } else if (metrics.response_time > this.thresholds.responseTime.warning) {
      alerts.push(this.createAlert(
        'response-time-warning',
        'warning',
        'system',
        `Response time ${metrics.response_time}ms exceeds warning threshold`,
        timestamp,
        { metric: 'response_time', value: this.thresholds.responseTime.warning, operator: '>' }
      ));
    }

    // Check error rate alerts
    if (metrics.error_rate > this.thresholds.errorRate.critical) {
      alerts.push(this.createAlert(
        'error-rate-critical',
        'critical',
        'system',
        `Error rate ${metrics.error_rate}% exceeds critical threshold`,
        timestamp,
        { metric: 'error_rate', value: this.thresholds.errorRate.critical, operator: '>' }
      ));
    }

    // Check resource usage alerts
    Object.entries(metrics.resource_usage).forEach(([resource, usage]) => {
      if (usage > this.thresholds.resourceUsage.critical) {
        alerts.push(this.createAlert(
          `${resource}-usage-critical`,
          'critical',
          'system',
          `${resource.toUpperCase()} usage ${usage}% exceeds critical threshold`,
          timestamp,
          { metric: `resource_usage.${resource}`, value: this.thresholds.resourceUsage.critical, operator: '>' }
        ));
      }
    });

    // Check component-specific alerts
    components.forEach(component => {
      if (component.status === 'critical') {
        alerts.push(this.createAlert(
          `${component.component}-critical`,
          'critical',
          component.component,
          `Component ${component.component} is in critical state`,
          timestamp,
          { metric: 'component_health', value: 25, operator: '<' }
        ));
      }
    });

    // Store active alerts
    alerts.forEach(alert => {
      this.activeAlerts.set(alert.id, alert);
    });

    return alerts;
  }

  /**
   * Analyze health trends
   */
  private static analyzeTrends(metrics: HealthMetrics): HealthTrend[] {
    const trends: HealthTrend[] = [];
    const now = new Date().toISOString();

    // Analyze response time trend
    const responseTimeHistory = this.healthHistory.get('response_time') || [];
    responseTimeHistory.push({ timestamp: now, value: metrics.response_time });
    this.healthHistory.set('response_time', responseTimeHistory.slice(-100)); // Keep last 100 data points

    trends.push({
      metric: 'response_time',
      period: '24h',
      trend: this.calculateTrendDirection(responseTimeHistory),
      change: this.calculateTrendChange(responseTimeHistory),
      data_points: responseTimeHistory.slice(-24), // Last 24 hours
      forecast: this.generateForecast(responseTimeHistory, 'response_time')
    });

    // Analyze error rate trend
    const errorRateHistory = this.healthHistory.get('error_rate') || [];
    errorRateHistory.push({ timestamp: now, value: metrics.error_rate });
    this.healthHistory.set('error_rate', errorRateHistory.slice(-100));

    trends.push({
      metric: 'error_rate',
      period: '24h',
      trend: this.calculateTrendDirection(errorRateHistory),
      change: this.calculateTrendChange(errorRateHistory),
      data_points: errorRateHistory.slice(-24),
      forecast: this.generateForecast(errorRateHistory, 'error_rate')
    });

    // Analyze throughput trend
    const throughputHistory = this.healthHistory.get('throughput') || [];
    throughputHistory.push({ timestamp: now, value: metrics.throughput });
    this.healthHistory.set('throughput', throughputHistory.slice(-100));

    trends.push({
      metric: 'throughput',
      period: '24h',
      trend: this.calculateTrendDirection(throughputHistory),
      change: this.calculateTrendChange(throughputHistory),
      data_points: throughputHistory.slice(-24),
      forecast: this.generateForecast(throughputHistory, 'throughput')
    });

    return trends;
  }

  /**
   * Generate health recommendations
   */
  private static generateHealthRecommendations(
    overall: HealthStatus,
    components: ComponentHealth[],
    alerts: HealthAlert[]
  ): string[] {
    const recommendations: string[] = [];

    // Overall health recommendations
    if (overall.score < 70) {
      recommendations.push('System health is below optimal. Consider immediate attention to critical issues.');
    }

    // Alert-based recommendations
    const criticalAlerts = alerts.filter(a => a.level === 'critical');
    if (criticalAlerts.length > 0) {
      recommendations.push(`Address ${criticalAlerts.length} critical alert(s) immediately.`);
    }

    // Component-specific recommendations
    const unhealthyComponents = components.filter(c => c.status === 'critical' || c.status === 'warning');
    if (unhealthyComponents.length > 0) {
      recommendations.push(`Review configuration for: ${unhealthyComponents.map(c => c.component).join(', ')}`);
    }

    // Performance recommendations
    const slowComponents = components.filter(c => c.issues.some(issue => issue.includes('slow') || issue.includes('timeout')));
    if (slowComponents.length > 0) {
      recommendations.push('Consider optimizing timeout and performance settings for better response times.');
    }

    // Security recommendations
    const securityComponent = components.find(c => c.component === 'Security System');
    if (securityComponent && securityComponent.score < 80) {
      recommendations.push('Review security configuration and strengthen authentication/encryption settings.');
    }

    // Default recommendation
    if (recommendations.length === 0) {
      recommendations.push('System health is good. Continue monitoring for optimal performance.');
    }

    return recommendations;
  }

  // Component assessment methods
  private static async assessQdrantHealth(config: SystemConfiguration, metrics: HealthMetrics): Promise<ComponentHealth> {
    const issues: string[] = [];
    let score = 100;

    // Check timeout configuration
    if (config.services.qdrant.timeout < 30000) {
      issues.push('Timeout setting may be too low for vector operations');
      score -= 15;
    }

    // Check connection status (simulated)
    const connectionHealthy = await this.checkServiceConnection('qdrant', config.services.qdrant.url);
    if (!connectionHealthy) {
      issues.push('Unable to connect to Qdrant service');
      score -= 30;
    }

    return {
      component: 'Qdrant Vector Store',
      status: this.getHealthStatusLevel(score),
      score,
      metrics: {
        response_time: metrics.response_time * 0.3, // Qdrant portion
        availability: connectionHealthy ? 100 : 0,
        error_rate: connectionHealthy ? 0 : 100
      },
      lastCheck: new Date().toISOString(),
      issues,
      dependencies: ['Network', 'Storage']
    };
  }

  private static async assessNeo4jHealth(config: SystemConfiguration, metrics: HealthMetrics): Promise<ComponentHealth> {
    const issues: string[] = [];
    let score = 100;

    // Check default password
    if (config.services.neo4j.password === 'contextmemory') {
      issues.push('Using default password - security risk');
      score -= 25;
    }

    // Check connection pool size
    if (config.services.neo4j.maxConnectionPoolSize < 5) {
      issues.push('Connection pool size may be too small');
      score -= 10;
    }

    const connectionHealthy = await this.checkServiceConnection('neo4j', config.services.neo4j.uri);
    if (!connectionHealthy) {
      issues.push('Unable to connect to Neo4j database');
      score -= 35;
    }

    return {
      component: 'Neo4j Graph Database',
      status: this.getHealthStatusLevel(score),
      score,
      metrics: {
        response_time: metrics.response_time * 0.2,
        availability: connectionHealthy ? 100 : 0,
        memory_usage: 45 // Simulated
      },
      lastCheck: new Date().toISOString(),
      issues,
      dependencies: ['Network', 'Storage', 'JVM']
    };
  }

  private static async assessOllamaHealth(config: SystemConfiguration, metrics: HealthMetrics): Promise<ComponentHealth> {
    const issues: string[] = [];
    let score = 100;

    // Check timeout for LLM operations
    if (config.services.ollama.timeout < 60000) {
      issues.push('Timeout may be too low for LLM inference operations');
      score -= 20;
    }

    const connectionHealthy = await this.checkServiceConnection('ollama', config.services.ollama.baseUrl);
    if (!connectionHealthy) {
      issues.push('Unable to connect to Ollama service');
      score -= 40;
    }

    return {
      component: 'Ollama LLM Service',
      status: this.getHealthStatusLevel(score),
      score,
      metrics: {
        response_time: metrics.response_time * 0.4, // LLM operations are slower
        availability: connectionHealthy ? 100 : 0,
        throughput: metrics.throughput * 0.1 // LLM throughput is typically lower
      },
      lastCheck: new Date().toISOString(),
      issues,
      dependencies: ['Network', 'GPU/CPU', 'Models']
    };
  }

  private static async assessAPIHealth(config: SystemConfiguration, metrics: HealthMetrics): Promise<ComponentHealth> {
    const issues: string[] = [];
    let score = 100;

    // Check authentication
    if (!config.api.authentication.enabled) {
      issues.push('API authentication is disabled');
      score -= 20;
    }

    // Check rate limiting
    if (!config.api.rateLimiting.enabled) {
      issues.push('Rate limiting is disabled - potential abuse risk');
      score -= 15;
    }

    // Check HTTPS
    if (!config.security.https.enabled) {
      issues.push('HTTPS is not enabled - security risk');
      score -= 25;
    }

    return {
      component: 'API Server',
      status: this.getHealthStatusLevel(score),
      score,
      metrics: {
        response_time: metrics.response_time,
        error_rate: metrics.error_rate,
        throughput: metrics.throughput
      },
      lastCheck: new Date().toISOString(),
      issues,
      dependencies: ['Network', 'Authentication', 'Database']
    };
  }

  private static async assessCachingHealth(config: SystemConfiguration, metrics: HealthMetrics): Promise<ComponentHealth> {
    const issues: string[] = [];
    let score = 100;

    if (!config.features.caching.enabled) {
      issues.push('Caching is disabled - performance impact');
      score -= 30;
    } else {
      if (config.features.caching.maxSize < 5000) {
        issues.push('Cache size may be too small for optimal performance');
        score -= 15;
      }

      if (config.features.caching.ttl < 300) {
        issues.push('Cache TTL is very short - frequent cache misses expected');
        score -= 10;
      }
    }

    return {
      component: 'Caching System',
      status: this.getHealthStatusLevel(score),
      score,
      metrics: {
        hit_rate: config.features.caching.enabled ? 75 : 0,
        size: config.features.caching.enabled ? config.features.caching.maxSize : 0
      },
      lastCheck: new Date().toISOString(),
      issues,
      dependencies: ['Memory', 'Storage']
    };
  }

  private static async assessSecurityHealth(config: SystemConfiguration, metrics: HealthMetrics): Promise<ComponentHealth> {
    const issues: string[] = [];
    let score = metrics.security_score;

    if (!config.security.https.enabled) {
      issues.push('HTTPS not enabled');
    }

    if (!config.api.authentication.enabled) {
      issues.push('Authentication disabled');
    }

    if (!config.security.headers.contentSecurityPolicy) {
      issues.push('Missing security headers');
    }

    return {
      component: 'Security System',
      status: this.getHealthStatusLevel(score),
      score,
      metrics: {
        security_score: metrics.security_score,
        compliance_score: metrics.compliance_score
      },
      lastCheck: new Date().toISOString(),
      issues,
      dependencies: ['Authentication', 'Encryption', 'Network']
    };
  }

  // Utility methods
  private static async measureResponseTime(config: SystemConfiguration): Promise<number> {
    // Simulate response time measurement
    let baseTime = 200;
    
    if (!config.features.caching.enabled) baseTime += 300;
    if (config.services.qdrant.timeout < 30000) baseTime += 200;
    if (config.features.batchProcessing.batchSize > 500) baseTime += 150;
    
    return baseTime + Math.random() * 100; // Add some variation
  }

  private static async calculateErrorRate(config: SystemConfiguration): Promise<number> {
    // Simulate error rate calculation
    let errorRate = 1.0; // Base error rate
    
    if (!config.api.authentication.enabled) errorRate += 2.0;
    if (config.services.qdrant.timeout < 30000) errorRate += 1.5;
    
    return Math.min(errorRate + Math.random() * 2, 15);
  }

  private static async measureThroughput(config: SystemConfiguration): Promise<number> {
    // Simulate throughput measurement (requests per second)
    let throughput = 100;
    
    if (config.features.caching.enabled) throughput += 50;
    if (config.features.batchProcessing.enabled) throughput += 30;
    
    return throughput + Math.random() * 20;
  }

  private static async getCPUUsage(): Promise<number> {
    return 45 + Math.random() * 30; // Simulated CPU usage
  }

  private static async getMemoryUsage(config: SystemConfiguration): Promise<number> {
    let usage = 40;
    
    if (config.features.caching.enabled) usage += 15;
    if (config.features.batchProcessing.batchSize > 500) usage += 20;
    
    return Math.min(usage + Math.random() * 20, 95);
  }

  private static async getDiskUsage(): Promise<number> {
    return 25 + Math.random() * 40; // Simulated disk usage
  }

  private static async getNetworkUsage(): Promise<number> {
    return 20 + Math.random() * 50; // Simulated network usage
  }

  private static async calculateConfigurationDrift(config: SystemConfiguration): Promise<number> {
    // Simulate configuration drift calculation
    return Math.random() * 15; // 0-15% drift
  }

  private static async calculateSecurityScore(config: SystemConfiguration): Promise<number> {
    let score = 100;
    
    if (!config.security.https.enabled) score -= 25;
    if (!config.api.authentication.enabled) score -= 30;
    if (!config.api.rateLimiting.enabled) score -= 10;
    if (!config.security.headers.contentSecurityPolicy) score -= 10;
    
    return Math.max(0, score);
  }

  private static async calculateComplianceScore(config: SystemConfiguration): Promise<number> {
    // Simplified compliance scoring
    let score = 50;
    
    if (config.security.https.enabled) score += 20;
    if (config.api.authentication.enabled) score += 20;
    if (config.api.rateLimiting.enabled) score += 10;
    
    return Math.min(100, score);
  }

  private static async checkServiceConnection(service: string, url: string): Promise<boolean> {
    // Simulate service connection check
    return Math.random() > 0.1; // 90% success rate
  }

  private static getHealthStatusLevel(score: number): 'healthy' | 'warning' | 'critical' | 'unknown' {
    if (score >= 80) return 'healthy';
    if (score >= 60) return 'warning';
    if (score >= 0) return 'critical';
    return 'unknown';
  }

  private static getHealthGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private static generateHealthMessage(status: string, score: number): string {
    switch (status) {
      case 'healthy':
        return `System is healthy with a score of ${score}/100`;
      case 'warning':
        return `System needs attention with a score of ${score}/100`;
      case 'critical':
        return `System requires immediate attention with a score of ${score}/100`;
      default:
        return 'System health status unknown';
    }
  }

  private static calculateUptime(components: ComponentHealth[]): number {
    const availableComponents = components.filter(c => c.status !== 'critical').length;
    return (availableComponents / components.length) * 100;
  }

  private static calculateAvailability(metrics: HealthMetrics): number {
    return Math.max(0, 100 - metrics.error_rate);
  }

  private static createAlert(
    id: string,
    level: 'info' | 'warning' | 'error' | 'critical',
    component: string,
    message: string,
    timestamp: string,
    threshold: { metric: string; value: number; operator: string }
  ): HealthAlert {
    return {
      id,
      level,
      component,
      message,
      timestamp,
      acknowledged: false,
      resolved: false,
      threshold
    };
  }

  private static calculateTrendDirection(dataPoints: HealthDataPoint[]): 'improving' | 'stable' | 'degrading' {
    if (dataPoints.length < 2) return 'stable';
    
    const recent = dataPoints.slice(-5); // Last 5 data points
    const firstValue = recent[0].value;
    const lastValue = recent[recent.length - 1].value;
    
    const change = ((lastValue - firstValue) / firstValue) * 100;
    
    if (change > 5) return 'degrading'; // For metrics like response time, increasing is bad
    if (change < -5) return 'improving';
    return 'stable';
  }

  private static calculateTrendChange(dataPoints: HealthDataPoint[]): number {
    if (dataPoints.length < 2) return 0;
    
    const recent = dataPoints.slice(-5);
    const firstValue = recent[0].value;
    const lastValue = recent[recent.length - 1].value;
    
    return ((lastValue - firstValue) / firstValue) * 100;
  }

  private static generateForecast(dataPoints: HealthDataPoint[], metric: string): HealthForecast {
    // Simplified forecasting - in real implementation, use proper forecasting algorithms
    const trend = this.calculateTrendDirection(dataPoints);
    const currentValue = dataPoints[dataPoints.length - 1]?.value || 0;
    
    let predictedValue = currentValue;
    if (trend === 'improving') {
      predictedValue *= 0.9; // 10% improvement
    } else if (trend === 'degrading') {
      predictedValue *= 1.1; // 10% degradation
    }
    
    return {
      predicted_value: predictedValue,
      confidence: 0.7,
      time_horizon: '1 hour',
      methodology: 'linear_trend'
    };
  }

  /**
   * Acknowledge an alert
   */
  static acknowledgeAlert(alertId: string, user: string = 'system'): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.activeAlerts.set(alertId, alert);
      return true;
    }
    return false;
  }

  /**
   * Resolve an alert
   */
  static resolveAlert(alertId: string, user: string = 'system'): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.duration = new Date().getTime() - new Date(alert.timestamp).getTime();
      this.activeAlerts.set(alertId, alert);
      return true;
    }
    return false;
  }

  /**
   * Get active alerts
   */
  static getActiveAlerts(): HealthAlert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Clear resolved alerts
   */
  static clearResolvedAlerts(): number {
    const resolvedAlerts = Array.from(this.activeAlerts.entries())
      .filter(([_, alert]) => alert.resolved);
    
    resolvedAlerts.forEach(([id, _]) => {
      this.activeAlerts.delete(id);
    });
    
    return resolvedAlerts.length;
  }

  /**
   * Update health thresholds
   */
  static updateThresholds(newThresholds: Partial<HealthThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Get current health thresholds
   */
  static getThresholds(): HealthThresholds {
    return { ...this.thresholds };
  }

  /**
   * Store health data for trend analysis
   */
  private static storeHealthData(metric: string, value: number, timestamp: string, context?: Record<string, any>): void {
    const history = this.healthHistory.get(metric) || [];
    history.push({ timestamp, value, context });
    this.healthHistory.set(metric, history.slice(-100)); // Keep last 100 data points
  }
}

interface HealthThresholds {
  responseTime: { warning: number; critical: number };
  errorRate: { warning: number; critical: number };
  availability: { warning: number; critical: number };
  resourceUsage: { warning: number; critical: number };
  configurationDrift: { warning: number; critical: number };
}

export default {
  ConfigurationHealthMonitor
};