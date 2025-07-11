/**
 * Configuration Schema & TypeScript Interface Foundation
 * Phase 7.4.1 - Comprehensive system configuration interfaces and validation
 */

// =============================================================================
// Core Configuration Interfaces
// =============================================================================

/**
 * Main system configuration interface encompassing all components
 */
export interface SystemConfiguration {
  /** Configuration schema version for migration support */
  version: string;
  /** API server configuration */
  api: ApiConfiguration;
  /** External services configuration */
  services: ServicesConfiguration;
  /** Feature flags and capabilities */
  features: FeatureConfiguration;
  /** Security and authentication settings */
  security: SecurityConfiguration;
  /** Monitoring and observability configuration */
  monitoring: MonitoringConfiguration;
  /** Performance optimization settings */
  performance: PerformanceConfiguration;
}

// =============================================================================
// API Configuration
// =============================================================================

/**
 * API server configuration with comprehensive options
 */
export interface ApiConfiguration {
  /** Base URL for the API server */
  baseUrl: string;
  /** Port number for the API server */
  port: number;
  /** CORS configuration */
  cors: CorsConfiguration;
  /** Rate limiting configuration */
  rateLimiting: RateLimitingConfiguration;
  /** Authentication configuration */
  authentication: AuthenticationConfiguration;
  /** Swagger/OpenAPI documentation configuration */
  swagger: SwaggerConfiguration;
  /** Response compression configuration */
  compression: CompressionConfiguration;
  /** Static file serving configuration */
  staticFiles: StaticFilesConfiguration;
}

export interface CorsConfiguration {
  /** Whether CORS is enabled */
  enabled: boolean;
  /** Allowed origins for CORS requests */
  origins: string[];
  /** Allowed HTTP methods */
  methods: string[];
  /** Allowed headers */
  allowedHeaders: string[];
  /** Whether credentials are allowed */
  credentials: boolean;
  /** Preflight cache duration in seconds */
  maxAge: number;
}

export interface RateLimitingConfiguration {
  /** Whether rate limiting is enabled */
  enabled: boolean;
  /** Requests per minute limit */
  requestsPerMinute: number;
  /** Burst limit for short spikes */
  burstLimit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Whether to skip successful requests */
  skipSuccessfulRequests: boolean;
  /** Whether to skip failed requests */
  skipFailedRequests: boolean;
  /** Custom message for rate limit exceeded */
  message: string;
}

export interface AuthenticationConfiguration {
  /** Whether authentication is enabled */
  enabled: boolean;
  /** Authentication provider type */
  provider: 'jwt' | 'oauth' | 'apikey' | 'none';
  /** JWT secret key (required for JWT provider) */
  jwtSecret?: string;
  /** Token expiry duration */
  tokenExpiry?: string;
  /** Refresh token expiry duration */
  refreshTokenExpiry?: string;
  /** OAuth configuration (required for OAuth provider) */
  oauth?: OAuthConfiguration;
  /** API key configuration (required for API key provider) */
  apiKey?: ApiKeyConfiguration;
}

export interface OAuthConfiguration {
  /** OAuth provider (Google, GitHub, etc.) */
  provider: string;
  /** OAuth client ID */
  clientId: string;
  /** OAuth client secret */
  clientSecret: string;
  /** OAuth callback URL */
  callbackUrl: string;
  /** OAuth scopes */
  scopes: string[];
}

export interface ApiKeyConfiguration {
  /** Header name for API key */
  headerName: string;
  /** API key prefix */
  prefix?: string;
  /** Valid API keys */
  validKeys: string[];
}

export interface SwaggerConfiguration {
  /** Whether Swagger UI is enabled */
  enabled: boolean;
  /** Swagger UI path */
  path: string;
  /** API documentation title */
  title: string;
  /** API version */
  version: string;
  /** API description */
  description: string;
  /** Contact information */
  contact?: {
    name: string;
    email: string;
    url: string;
  };
  /** License information */
  license?: {
    name: string;
    url: string;
  };
}

export interface CompressionConfiguration {
  /** Whether compression is enabled */
  enabled: boolean;
  /** Compression level (0-9) */
  level: number;
  /** Minimum size threshold for compression in bytes */
  threshold: number;
  /** Compression algorithm */
  algorithm: 'gzip' | 'brotli' | 'deflate';
}

export interface StaticFilesConfiguration {
  /** Whether static file serving is enabled */
  enabled: boolean;
  /** Root directory for static files */
  root: string;
  /** Default file name */
  index: string;
  /** Cache control max-age in seconds */
  maxAge: number;
  /** Whether to enable ETag headers */
  etag: boolean;
}

// =============================================================================
// Services Configuration
// =============================================================================

/**
 * External services configuration
 */
export interface ServicesConfiguration {
  /** Qdrant vector database configuration */
  qdrant: QdrantConfiguration;
  /** Neo4j graph database configuration */
  neo4j: Neo4jConfiguration;
  /** Ollama LLM service configuration */
  ollama: OllamaConfiguration;
}

export interface QdrantConfiguration {
  /** Qdrant server URL */
  url: string;
  /** API key for authentication */
  apiKey?: string;
  /** Collection name for vectors */
  collection: string;
  /** Vector dimension size */
  vectorSize: number;
  /** Distance metric for similarity */
  distance: 'cosine' | 'euclidean' | 'dot' | 'manhattan';
  /** Request timeout in milliseconds */
  timeout: number;
  /** Number of retry attempts */
  retryAttempts: number;
  /** Delay between retries in milliseconds */
  retryDelay: number;
  /** Health check interval in seconds */
  healthCheckInterval: number;
  /** Connection pool configuration */
  connectionPool: {
    /** Maximum number of connections */
    maxConnections: number;
    /** Connection idle timeout in milliseconds */
    idleTimeout: number;
  };
}

export interface Neo4jConfiguration {
  /** Neo4j server URI */
  uri: string;
  /** Username for authentication */
  username: string;
  /** Password for authentication */
  password: string;
  /** Database name */
  database: string;
  /** Maximum connection lifetime in milliseconds */
  maxConnectionLifetime: number;
  /** Maximum connection pool size */
  maxConnectionPoolSize: number;
  /** Connection acquisition timeout in milliseconds */
  connectionAcquisitionTimeout: number;
  /** Health check interval in seconds */
  healthCheckInterval: number;
  /** Whether to use encrypted connections */
  encrypted: boolean;
  /** Trust strategy for certificates */
  trustStrategy: 'TRUST_ALL_CERTIFICATES' | 'TRUST_SYSTEM_CA_SIGNED_CERTIFICATES';
}

export interface OllamaConfiguration {
  /** Ollama server base URL */
  baseUrl: string;
  /** Default chat model */
  chatModel: string;
  /** Default embedding model */
  embeddingModel: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Maximum number of retries */
  maxRetries: number;
  /** Delay between retries in milliseconds */
  retryDelay: number;
  /** Whether streaming is enabled */
  streamingEnabled: boolean;
  /** Keep-alive duration */
  keepAlive: string;
  /** Default temperature for text generation */
  temperature: number;
  /** Top-p sampling parameter */
  topP: number;
  /** Top-k sampling parameter */
  topK: number;
  /** Context window size */
  contextWindow: number;
  /** Available models configuration */
  models: {
    /** Chat models */
    chat: string[];
    /** Embedding models */
    embedding: string[];
  };
}

// =============================================================================
// Feature Configuration
// =============================================================================

/**
 * Feature flags and capabilities configuration
 */
export interface FeatureConfiguration {
  /** Whether real-time updates are enabled */
  realTimeUpdates: boolean;
  /** Whether advanced analytics are enabled */
  advancedAnalytics: boolean;
  /** Whether experimental features are enabled */
  experimentalFeatures: boolean;
  /** Whether debug mode is enabled */
  debugMode: boolean;
  /** Batch processing configuration */
  batchProcessing: BatchProcessingConfiguration;
  /** Caching configuration */
  caching: CachingConfiguration;
  /** Search configuration */
  search: SearchConfiguration;
  /** Streaming configuration */
  streaming: StreamingConfiguration;
}

export interface BatchProcessingConfiguration {
  /** Whether batch processing is enabled */
  enabled: boolean;
  /** Default batch size */
  batchSize: number;
  /** Maximum concurrent batches */
  maxConcurrency: number;
  /** Queue timeout in milliseconds */
  queueTimeout: number;
  /** Retry configuration */
  retries: {
    /** Maximum retry attempts */
    maxAttempts: number;
    /** Delay between retries in milliseconds */
    delay: number;
    /** Backoff multiplier */
    backoffMultiplier: number;
  };
}

export interface CachingConfiguration {
  /** Whether caching is enabled */
  enabled: boolean;
  /** Default TTL in seconds */
  ttl: number;
  /** Maximum cache size in bytes */
  maxSize: number;
  /** Cache eviction strategy */
  strategy: 'lru' | 'lfu' | 'fifo';
  /** Cache layers configuration */
  layers: {
    /** Memory cache configuration */
    memory: {
      enabled: boolean;
      maxEntries: number;
      ttl: number;
    };
    /** Redis cache configuration */
    redis?: {
      enabled: boolean;
      url: string;
      ttl: number;
    };
  };
}

export interface SearchConfiguration {
  /** Whether fuzzy search is enabled */
  fuzzySearch: boolean;
  /** Maximum number of results */
  maxResults: number;
  /** Minimum relevance threshold */
  relevanceThreshold: number;
  /** Search index configuration */
  indexing: {
    /** Whether automatic indexing is enabled */
    autoIndex: boolean;
    /** Index update interval in seconds */
    updateInterval: number;
    /** Maximum index size in MB */
    maxSizeMb: number;
  };
}

export interface StreamingConfiguration {
  /** Whether streaming is enabled */
  enabled: boolean;
  /** Maximum concurrent streams */
  maxConcurrentStreams: number;
  /** Stream timeout in milliseconds */
  timeout: number;
  /** Buffer size for streaming */
  bufferSize: number;
  /** Heartbeat interval in seconds */
  heartbeatInterval: number;
}

// =============================================================================
// Security Configuration
// =============================================================================

/**
 * Security and authentication configuration
 */
export interface SecurityConfiguration {
  /** HTTPS configuration */
  https: HttpsConfiguration;
  /** Security headers configuration */
  headers: SecurityHeadersConfiguration;
  /** Data protection configuration */
  dataProtection: DataProtectionConfiguration;
  /** Input validation configuration */
  validation: ValidationConfiguration;
  /** Audit logging configuration */
  audit: AuditConfiguration;
}

export interface HttpsConfiguration {
  /** Whether HTTPS is enabled */
  enabled: boolean;
  /** SSL certificate file path */
  certificatePath?: string;
  /** SSL private key file path */
  keyPath?: string;
  /** Whether to redirect HTTP to HTTPS */
  redirectHttp: boolean;
  /** Minimum TLS version */
  minTlsVersion: '1.2' | '1.3';
  /** Cipher suites */
  cipherSuites?: string[];
}

export interface SecurityHeadersConfiguration {
  /** Content Security Policy header */
  contentSecurityPolicy: string;
  /** Strict Transport Security header */
  strictTransportSecurity: string;
  /** X-Frame-Options header */
  xFrameOptions: string;
  /** X-Content-Type-Options header */
  xContentTypeOptions: string;
  /** Referrer-Policy header */
  referrerPolicy: string;
  /** X-XSS-Protection header */
  xXssProtection: string;
  /** Permissions-Policy header */
  permissionsPolicy?: string;
}

export interface DataProtectionConfiguration {
  /** Encryption key for sensitive data */
  encryptionKey?: string;
  /** Hash salt rounds for passwords */
  hashSaltRounds: number;
  /** Session secret */
  sessionSecret?: string;
  /** Whether cookies should be secure */
  cookieSecure: boolean;
  /** Cookie SameSite policy */
  cookieSameSite: 'strict' | 'lax' | 'none';
  /** Data retention policy in days */
  dataRetentionDays: number;
}

export interface ValidationConfiguration {
  /** Whether strict validation is enabled */
  strictMode: boolean;
  /** Maximum request body size in bytes */
  maxRequestSize: number;
  /** Maximum URL length */
  maxUrlLength: number;
  /** Allowed file upload types */
  allowedFileTypes: string[];
  /** Maximum file upload size in bytes */
  maxFileSize: number;
}

export interface AuditConfiguration {
  /** Whether audit logging is enabled */
  enabled: boolean;
  /** Events to audit */
  events: string[];
  /** Audit log retention in days */
  retentionDays: number;
  /** Whether to include request bodies */
  includeRequestBodies: boolean;
  /** Whether to include response bodies */
  includeResponseBodies: boolean;
}

// =============================================================================
// Monitoring Configuration
// =============================================================================

/**
 * Monitoring and observability configuration
 */
export interface MonitoringConfiguration {
  /** Logging configuration */
  logging: LoggingConfiguration;
  /** Metrics configuration */
  metrics: MetricsConfiguration;
  /** Alerting configuration */
  alerting: AlertingConfiguration;
  /** Health checks configuration */
  healthChecks: HealthChecksConfiguration;
  /** Tracing configuration */
  tracing: TracingConfiguration;
}

export interface LoggingConfiguration {
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Log format */
  format: 'json' | 'text';
  /** Log output destinations */
  outputs: LogOutputConfiguration[];
  /** Whether to include timestamps */
  includeTimestamp: boolean;
  /** Whether to include stack traces */
  includeStackTrace: boolean;
  /** Log rotation configuration */
  rotation: {
    /** Whether log rotation is enabled */
    enabled: boolean;
    /** Maximum file size in MB */
    maxSizeMb: number;
    /** Maximum number of files */
    maxFiles: number;
    /** Rotation interval */
    interval: 'daily' | 'weekly' | 'monthly';
  };
}

export interface LogOutputConfiguration {
  /** Output type */
  type: 'console' | 'file' | 'syslog' | 'http';
  /** Output configuration */
  config: Record<string, any>;
}

export interface MetricsConfiguration {
  /** Whether metrics collection is enabled */
  enabled: boolean;
  /** Metrics export format */
  format: 'prometheus' | 'json';
  /** Metrics endpoint path */
  endpoint: string;
  /** Collection interval in seconds */
  interval: number;
  /** Custom metrics configuration */
  custom: CustomMetricConfiguration[];
}

export interface CustomMetricConfiguration {
  /** Metric name */
  name: string;
  /** Metric type */
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  /** Metric description */
  description: string;
  /** Metric labels */
  labels: string[];
}

export interface AlertingConfiguration {
  /** Whether alerting is enabled */
  enabled: boolean;
  /** Alert channels */
  channels: AlertChannelConfiguration[];
  /** Alert rules */
  rules: AlertRuleConfiguration[];
}

export interface AlertChannelConfiguration {
  /** Channel type */
  type: 'email' | 'webhook' | 'slack';
  /** Channel configuration */
  config: Record<string, any>;
}

export interface AlertRuleConfiguration {
  /** Rule name */
  name: string;
  /** Metric to monitor */
  metric: string;
  /** Threshold value */
  threshold: number;
  /** Comparison operator */
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  /** Evaluation interval in seconds */
  interval: number;
  /** Alert severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface HealthChecksConfiguration {
  /** Whether health checks are enabled */
  enabled: boolean;
  /** Health check interval in seconds */
  interval: number;
  /** Health check timeout in milliseconds */
  timeout: number;
  /** Individual service health checks */
  services: ServiceHealthCheckConfiguration[];
}

export interface ServiceHealthCheckConfiguration {
  /** Service name */
  name: string;
  /** Service URL for health check */
  url: string;
  /** Expected status code */
  expectedStatus: number;
  /** Health check interval in seconds */
  interval: number;
  /** Health check timeout in milliseconds */
  timeout: number;
}

export interface TracingConfiguration {
  /** Whether tracing is enabled */
  enabled: boolean;
  /** Tracing provider */
  provider: 'jaeger' | 'zipkin' | 'otlp';
  /** Tracing endpoint */
  endpoint: string;
  /** Sampling rate (0.0 to 1.0) */
  samplingRate: number;
  /** Service name for tracing */
  serviceName: string;
}

// =============================================================================
// Performance Configuration
// =============================================================================

/**
 * Performance optimization configuration
 */
export interface PerformanceConfiguration {
  /** Timeout configurations */
  timeouts: TimeoutConfiguration;
  /** Connection pool configurations */
  connectionPools: ConnectionPoolConfiguration;
  /** Resource limits */
  resourceLimits: ResourceLimitsConfiguration;
  /** Optimization settings */
  optimization: OptimizationConfiguration;
}

export interface TimeoutConfiguration {
  /** Request timeout in milliseconds */
  request: number;
  /** Connection timeout in milliseconds */
  connection: number;
  /** Keep-alive timeout in milliseconds */
  keepAlive: number;
  /** Header timeout in milliseconds */
  header: number;
  /** Body timeout in milliseconds */
  body: number;
}

export interface ConnectionPoolConfiguration {
  /** Maximum number of connections */
  maxConnections: number;
  /** Minimum number of connections */
  minConnections: number;
  /** Connection idle timeout in milliseconds */
  idleTimeout: number;
  /** Connection acquisition timeout in milliseconds */
  acquisitionTimeout: number;
  /** Whether to validate connections */
  validateConnections: boolean;
}

export interface ResourceLimitsConfiguration {
  /** Maximum memory usage in MB */
  maxMemoryMb: number;
  /** Maximum CPU usage percentage */
  maxCpuPercent: number;
  /** Maximum concurrent requests */
  maxConcurrentRequests: number;
  /** Maximum request queue size */
  maxRequestQueueSize: number;
  /** Maximum file descriptors */
  maxFileDescriptors: number;
}

export interface OptimizationConfiguration {
  /** Whether to enable HTTP/2 */
  http2Enabled: boolean;
  /** Whether to enable keep-alive */
  keepAliveEnabled: boolean;
  /** Whether to enable request pipelining */
  pipeliningEnabled: boolean;
  /** Whether to enable response compression */
  compressionEnabled: boolean;
  /** Whether to enable static file caching */
  staticFileCachingEnabled: boolean;
  /** Garbage collection settings */
  gc: {
    /** GC strategy */
    strategy: 'adaptive' | 'throughput' | 'latency';
    /** GC heap size in MB */
    heapSizeMb: number;
  };
}

// =============================================================================
// Validation Framework Types
// =============================================================================

/**
 * Validation error details
 */
export interface ValidationError {
  /** Field path where the error occurred */
  path: string;
  /** Human-readable error message */
  message: string;
  /** Error severity level */
  severity: 'error' | 'warning' | 'info';
  /** Error code for programmatic handling */
  code: string;
  /** Suggested fixes or improvements */
  suggestions?: string[];
  /** Current value that caused the error */
  value?: any;
  /** Expected value or format */
  expected?: any;
}

/**
 * Validation result containing all findings
 */
export interface ValidationResult {
  /** Whether the configuration is valid */
  isValid: boolean;
  /** Critical errors that prevent operation */
  errors: ValidationError[];
  /** Non-critical warnings */
  warnings: ValidationError[];
  /** Optimization suggestions */
  suggestions: ValidationError[];
  /** Validation metadata */
  metadata: {
    /** Validation duration in milliseconds */
    durationMs: number;
    /** Configuration schema version */
    schemaVersion: string;
    /** Timestamp of validation */
    timestamp: string;
    /** Validator version */
    validatorVersion: string;
  };
}

/**
 * Configuration dependency definition
 */
export interface ConfigurationDependency {
  /** Source field path */
  source: string;
  /** Target field path */
  target: string;
  /** Dependency type */
  type: 'requires' | 'conflicts' | 'implies' | 'excludes';
  /** Condition for the dependency */
  condition?: (sourceValue: any, targetValue: any) => boolean;
  /** Error message when dependency is violated */
  message: string;
}

/**
 * Configuration migration definition
 */
export interface ConfigurationMigration {
  /** Source version */
  fromVersion: string;
  /** Target version */
  toVersion: string;
  /** Migration function */
  migrate: (config: any) => any;
  /** Migration description */
  description: string;
}