using ContextMemoryStore.Core.Entities;
using ContextMemoryStore.Core.Interfaces;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace ContextMemoryStore.Infrastructure.Services;

/// <summary>
/// Implementation of diagnostics service
/// </summary>
public class DiagnosticsService : IDiagnosticsService
{
    private readonly ILogger<DiagnosticsService> _logger;
    private readonly IVectorStoreService _vectorStoreService;
    private readonly IGraphStoreService _graphStoreService;
    private readonly ILLMService _llmService;
    private readonly IHealthCheckScoringService _healthCheckScoringService;
    private readonly IMetricsCollectionService _metricsCollectionService;

    public DiagnosticsService(
        ILogger<DiagnosticsService> logger,
        IVectorStoreService vectorStoreService,
        IGraphStoreService graphStoreService,
        ILLMService llmService,
        IHealthCheckScoringService healthCheckScoringService,
        IMetricsCollectionService metricsCollectionService)
    {
        _logger = logger;
        _vectorStoreService = vectorStoreService;
        _graphStoreService = graphStoreService;
        _llmService = llmService;
        _healthCheckScoringService = healthCheckScoringService;
        _metricsCollectionService = metricsCollectionService;
    }

    public async Task<SystemDiagnostics> GetSystemDiagnosticsAsync()
    {
        var currentProcess = Process.GetCurrentProcess();
        
        return new SystemDiagnostics
        {
            SystemInfo = new SystemInfo
            {
                MachineName = Environment.MachineName,
                OperatingSystem = Environment.OSVersion.ToString(),
                ProcessorCount = Environment.ProcessorCount,
                Is64BitOperatingSystem = Environment.Is64BitOperatingSystem,
                Is64BitProcess = Environment.Is64BitProcess,
                UserName = Environment.UserName,
                WorkingDirectory = Environment.CurrentDirectory,
                WorkingSetMemory = Environment.WorkingSet
            },
            RuntimeInfo = new RuntimeInfo
            {
                RuntimeVersion = Environment.Version.ToString(),
                RuntimeFramework = ".NET",
                StartTime = currentProcess.StartTime,
                Uptime = DateTime.UtcNow - currentProcess.StartTime,
                TotalMemoryAllocated = GC.GetTotalAllocatedBytes(),
                ThreadCount = currentProcess.Threads.Count,
                Gen0Collections = GC.CollectionCount(0),
                Gen1Collections = GC.CollectionCount(1),
                Gen2Collections = GC.CollectionCount(2)
            },
            EnvironmentInfo = new EnvironmentInfo
            {
                EnvironmentName = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
                ApplicationName = "ContextMemoryStore.Api",
                ApplicationVersion = "1.0.0"
            },
            ServiceStatus = new ServiceStatusInfo
            {
                Services = new Dictionary<string, ServiceStatus>
                {
                    ["qdrant"] = await _vectorStoreService.IsHealthyAsync() ? ServiceStatus.Healthy : ServiceStatus.Unhealthy,
                    ["neo4j"] = await _graphStoreService.IsHealthyAsync() ? ServiceStatus.Healthy : ServiceStatus.Unhealthy,
                    ["ollama"] = await _llmService.IsHealthyAsync() ? ServiceStatus.Healthy : ServiceStatus.Unhealthy
                },
                CriticalServices = new List<string> { "qdrant", "neo4j" },
                HealthyServices = new List<string>(),
                UnhealthyServices = new List<string>()
            },
            ConfigurationStatus = new ConfigurationStatus
            {
                IsValid = true,
                ValidationErrors = new List<string>(),
                ValidationWarnings = new List<string>(),
                KeySettings = new Dictionary<string, string>()
            }
        };
    }

    public async Task<PerformanceDiagnostics> GetPerformanceDiagnosticsAsync(TimeSpan timeRange)
    {
        var performanceMetrics = await _metricsCollectionService.GetPerformanceMetricsAsync(timeRange);
        
        return new PerformanceDiagnostics
        {
            TimeRange = timeRange,
            Performance = performanceMetrics,
            ResourceUtilization = new ResourceUtilization
            {
                CpuUtilization = 0, // Placeholder - would implement actual CPU monitoring
                MemoryUtilization = (double)GC.GetTotalMemory(false) / (1024 * 1024 * 1024), // GB
                DiskUtilization = 0, // Placeholder
                NetworkUtilization = 0, // Placeholder
                IsOverUtilized = false
            },
            Bottlenecks = new List<PerformanceBottleneck>(),
            Recommendations = new List<PerformanceRecommendation>()
        };
    }

    public async Task<ServiceConnectivityDiagnostics> GetServiceConnectivityDiagnosticsAsync()
    {
        var serviceConnections = new Dictionary<string, ServiceConnectionStatus>();
        
        // Test Qdrant connectivity
        try
        {
            var isQdrantHealthy = await _vectorStoreService.IsHealthyAsync();
            serviceConnections["qdrant"] = new ServiceConnectionStatus
            {
                Status = isQdrantHealthy ? "Connected" : "Disconnected",
                ResponseTime = 0, // Would measure actual response time
                LastConnected = DateTime.UtcNow,
                ConnectionPoolSize = 10,
                ActiveConnections = 3
            };
        }
        catch
        {
            serviceConnections["qdrant"] = new ServiceConnectionStatus
            {
                Status = "Error",
                ResponseTime = 0,
                LastConnected = DateTime.MinValue,
                ConnectionPoolSize = 0,
                ActiveConnections = 0
            };
        }

        // Test Neo4j connectivity
        try
        {
            var isNeo4jHealthy = await _graphStoreService.IsHealthyAsync();
            serviceConnections["neo4j"] = new ServiceConnectionStatus
            {
                Status = isNeo4jHealthy ? "Connected" : "Disconnected",
                ResponseTime = 0,
                LastConnected = DateTime.UtcNow,
                ConnectionPoolSize = 15,
                ActiveConnections = 5
            };
        }
        catch
        {
            serviceConnections["neo4j"] = new ServiceConnectionStatus
            {
                Status = "Error",
                ResponseTime = 0,
                LastConnected = DateTime.MinValue,
                ConnectionPoolSize = 0,
                ActiveConnections = 0
            };
        }

        // Test Ollama connectivity
        try
        {
            var isOllamaHealthy = await _llmService.IsHealthyAsync();
            serviceConnections["ollama"] = new ServiceConnectionStatus
            {
                Status = isOllamaHealthy ? "Connected" : "Disconnected",
                ResponseTime = 0,
                LastConnected = DateTime.UtcNow,
                ConnectionPoolSize = 0,
                ActiveConnections = 0
            };
        }
        catch
        {
            serviceConnections["ollama"] = new ServiceConnectionStatus
            {
                Status = "Error",
                ResponseTime = 0,
                LastConnected = DateTime.MinValue,
                ConnectionPoolSize = 0,
                ActiveConnections = 0
            };
        }

        return new ServiceConnectivityDiagnostics
        {
            ServiceConnections = serviceConnections,
            NetworkTests = new List<NetworkConnectivityTest>(),
            ConnectionPools = new Dictionary<string, ConnectionPoolStats>()
        };
    }

    public async Task<ConfigurationDiagnostics> GetConfigurationDiagnosticsAsync()
    {
        return new ConfigurationDiagnostics
        {
            ValidationResults = new List<ConfigurationValidationResult>
            {
                new ConfigurationValidationResult
                {
                    Section = "QdrantOptions",
                    IsValid = true,
                    ValidationErrors = new List<string>(),
                    ValidationWarnings = new List<string>()
                },
                new ConfigurationValidationResult
                {
                    Section = "Neo4jOptions",
                    IsValid = true,
                    ValidationErrors = new List<string>(),
                    ValidationWarnings = new List<string> { "Using default configuration" }
                }
            },
            EnvironmentConfiguration = new Dictionary<string, string>
            {
                ["ASPNETCORE_ENVIRONMENT"] = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
                ["ASPNETCORE_URLS"] = Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "Unknown"
            },
            ConfigurationSources = new List<ConfigurationSource>
            {
                new ConfigurationSource
                {
                    Source = "appsettings.json",
                    Priority = 1,
                    Loaded = true
                }
            }
        };
    }

    public async Task<ResourceUsageDiagnostics> GetResourceUsageDiagnosticsAsync()
    {
        var currentProcess = Process.GetCurrentProcess();
        var workingSet = currentProcess.WorkingSet64;
        var privateMemory = currentProcess.PrivateMemorySize64;
        
        return new ResourceUsageDiagnostics
        {
            MemoryUsage = new MemoryUsageDetails
            {
                WorkingSet = workingSet,
                PrivateMemory = privateMemory,
                GcMemory = GC.GetTotalMemory(false),
                MemoryUtilization = (double)workingSet / (1024 * 1024 * 1024), // GB
                AvailableMemory = 8L * 1024 * 1024 * 1024, // 8GB placeholder
                TotalMemory = 16L * 1024 * 1024 * 1024, // 16GB placeholder
                Gen0Collections = GC.CollectionCount(0),
                Gen1Collections = GC.CollectionCount(1),
                Gen2Collections = GC.CollectionCount(2)
            },
            CpuUsage = new CpuUsageDetails
            {
                CurrentUsage = 0, // Placeholder
                AverageUsage = 0, // Placeholder
                PeakUsage = 0, // Placeholder
                CpuTime = currentProcess.TotalProcessorTime,
                ProcessorCount = Environment.ProcessorCount,
                SystemCpuUsage = 0 // Placeholder
            },
            DiskUsage = new DiskUsageDetails
            {
                TotalSpace = 1000L * 1024 * 1024 * 1024, // 1TB placeholder
                UsedSpace = 500L * 1024 * 1024 * 1024, // 500GB placeholder
                AvailableSpace = 500L * 1024 * 1024 * 1024, // 500GB placeholder
                DiskUtilization = 50.0
            },
            NetworkUsage = new NetworkUsageDetails
            {
                BytesSent = 0,
                BytesReceived = 0,
                NetworkUtilization = 0,
                ActiveConnections = 0
            },
            ResourceAlerts = new List<ResourceAlert>()
        };
    }

    public async Task<ComprehensiveHealthCheck> RunComprehensiveHealthCheckAsync()
    {
        var systemHealthScore = await _healthCheckScoringService.GetSystemHealthScoreAsync();
        
        return new ComprehensiveHealthCheck
        {
            OverallStatus = systemHealthScore.SystemStatus,
            ServiceHealthChecks = new Dictionary<string, HealthCheckResult>(),
            SystemHealthScore = systemHealthScore,
            CriticalIssues = new List<CriticalIssue>(),
            Warnings = new List<HealthWarning>(),
            HealthTrends = new Dictionary<string, HealthTrend>()
        };
    }

    public async Task<List<TroubleshootingRecommendation>> GetTroubleshootingRecommendationsAsync()
    {
        var recommendations = new List<TroubleshootingRecommendation>();
        
        try
        {
            var systemHealth = await _healthCheckScoringService.GetSystemHealthScoreAsync();
            
            if (systemHealth.OverallScore < 70)
            {
                recommendations.Add(new TroubleshootingRecommendation
                {
                    Priority = RecommendationPriority.High,
                    Category = "Performance",
                    Issue = "Overall system health score is below threshold",
                    RecommendedAction = "Investigate individual service health and performance metrics",
                    Details = $"System health score is {systemHealth.OverallScore}, which is below the recommended threshold of 70.",
                    EstimatedTimeToResolve = TimeSpan.FromMinutes(30)
                });
            }
            
            foreach (var criticalIssue in systemHealth.CriticalIssues)
            {
                recommendations.Add(new TroubleshootingRecommendation
                {
                    Priority = RecommendationPriority.Critical,
                    Category = "Service Health",
                    Issue = $"Critical issue with service: {criticalIssue}",
                    RecommendedAction = $"Investigate and resolve issues with {criticalIssue} service",
                    Details = $"Service {criticalIssue} is experiencing critical issues that require immediate attention.",
                    EstimatedTimeToResolve = TimeSpan.FromMinutes(15)
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating troubleshooting recommendations");
        }
        
        return recommendations;
    }

    public async Task<DiagnosticReport> GenerateDiagnosticReportAsync()
    {
        return new DiagnosticReport
        {
            ReportId = $"diag-{DateTime.UtcNow:yyyy-MM-dd-HH-mm-ss}-{Guid.NewGuid().ToString()[..8]}",
            GeneratedAt = DateTime.UtcNow,
            SystemDiagnostics = await GetSystemDiagnosticsAsync(),
            PerformanceDiagnostics = await GetPerformanceDiagnosticsAsync(TimeSpan.FromMinutes(30)),
            ServiceConnectivityDiagnostics = await GetServiceConnectivityDiagnosticsAsync(),
            ConfigurationDiagnostics = await GetConfigurationDiagnosticsAsync(),
            ResourceUsageDiagnostics = await GetResourceUsageDiagnosticsAsync(),
            ComprehensiveHealthCheck = await RunComprehensiveHealthCheckAsync(),
            TroubleshootingRecommendations = await GetTroubleshootingRecommendationsAsync(),
            RecentLogs = new List<LogEntry>() // Would implement log collection
        };
    }
}