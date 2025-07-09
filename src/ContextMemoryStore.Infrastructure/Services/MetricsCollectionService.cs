using ContextMemoryStore.Core.Entities;
using ContextMemoryStore.Core.Interfaces;
using Microsoft.Extensions.Logging;
using Prometheus;
using System.Collections.Concurrent;
using System.Diagnostics;

namespace ContextMemoryStore.Infrastructure.Services;

/// <summary>
/// Enhanced metrics collection service with comprehensive system monitoring
/// </summary>
public class MetricsCollectionService : IMetricsCollectionService
{
    private readonly ILogger<MetricsCollectionService> _logger;
    private readonly Process _currentProcess;
    private readonly DateTime _startTime;
    
    // Prometheus metrics
    private static readonly Counter RequestsTotal = Metrics
        .CreateCounter("http_requests_total", "Total HTTP requests", "endpoint", "method", "status_code");
    
    private static readonly Histogram RequestDuration = Metrics
        .CreateHistogram("http_request_duration_seconds", "HTTP request duration", "endpoint", "method");
    
    private static readonly Counter DatabaseOperationsTotal = Metrics
        .CreateCounter("database_operations_total", "Total database operations", "operation", "success");
    
    private static readonly Histogram DatabaseOperationDuration = Metrics
        .CreateHistogram("database_operation_duration_seconds", "Database operation duration", "operation");
    
    private static readonly Counter LLMOperationsTotal = Metrics
        .CreateCounter("llm_operations_total", "Total LLM operations", "operation", "model", "success");
    
    private static readonly Histogram LLMOperationDuration = Metrics
        .CreateHistogram("llm_operation_duration_seconds", "LLM operation duration", "operation", "model");
    
    private static readonly Counter LLMTokensProcessed = Metrics
        .CreateCounter("llm_tokens_processed_total", "Total LLM tokens processed", "operation", "model");
    
    private static readonly Counter ErrorsTotal = Metrics
        .CreateCounter("errors_total", "Total errors", "error_type", "source");
    
    private static readonly Counter BusinessMetricsTotal = Metrics
        .CreateCounter("business_metrics_total", "Business metrics", "metric");
    
    private static readonly Gauge SystemMemoryUsage = Metrics
        .CreateGauge("system_memory_usage_bytes", "System memory usage in bytes");
    
    private static readonly Gauge SystemCpuUsage = Metrics
        .CreateGauge("system_cpu_usage_percent", "System CPU usage percentage");
    
    private static readonly Gauge GarbageCollectionGen0 = Metrics
        .CreateGauge("dotnet_gc_gen0_collections_total", "Generation 0 garbage collections");
    
    private static readonly Gauge GarbageCollectionGen1 = Metrics
        .CreateGauge("dotnet_gc_gen1_collections_total", "Generation 1 garbage collections");
    
    private static readonly Gauge GarbageCollectionGen2 = Metrics
        .CreateGauge("dotnet_gc_gen2_collections_total", "Generation 2 garbage collections");
    
    private static readonly Gauge ThreadPoolWorkerThreads = Metrics
        .CreateGauge("dotnet_threadpool_worker_threads", "Thread pool worker threads", "type");
    
    private static readonly Gauge ActiveRequests = Metrics
        .CreateGauge("http_requests_active", "Active HTTP requests");

    // In-memory storage for metrics
    private readonly ConcurrentDictionary<string, ConcurrentBag<long>> _responseTimes = new();
    private readonly ConcurrentDictionary<string, ConcurrentBag<ErrorSample>> _errors = new();
    private readonly ConcurrentDictionary<string, long> _counters = new();
    private readonly ConcurrentDictionary<string, double> _gauges = new();
    private long _activeRequestCount;

    public MetricsCollectionService(ILogger<MetricsCollectionService> logger)
    {
        _logger = logger;
        _currentProcess = Process.GetCurrentProcess();
        _startTime = DateTime.UtcNow;
        
        // Start background metrics collection
        _ = Task.Run(CollectSystemMetricsAsync);
    }

    /// <summary>
    /// Records a request metric
    /// </summary>
    public void RecordRequest(string endpoint, string method, int statusCode, long responseTime, string? correlationId = null)
    {
        var success = statusCode < 400 ? "true" : "false";
        var statusCodeString = statusCode.ToString();
        
        // Update Prometheus metrics
        RequestsTotal.WithLabels(endpoint, method, statusCodeString).Inc();
        RequestDuration.WithLabels(endpoint, method).Observe(responseTime / 1000.0);
        
        // Store response time for percentile calculations
        var key = $"{endpoint}:{method}";
        _responseTimes.AddOrUpdate(key, new ConcurrentBag<long> { responseTime }, (k, bag) =>
        {
            bag.Add(responseTime);
            // Keep only last 1000 response times
            if (bag.Count > 1000)
            {
                var items = bag.ToList();
                bag.Clear();
                foreach (var item in items.TakeLast(1000))
                {
                    bag.Add(item);
                }
            }
            return bag;
        });
        
        // Update counters
        IncrementCounter("requests_total");
        if (statusCode < 400)
        {
            IncrementCounter("requests_successful");
        }
        else
        {
            IncrementCounter("requests_failed");
        }
        
        _logger.LogDebug("Request recorded: {Endpoint} {Method} {StatusCode} {ResponseTime}ms {CorrelationId}", 
            endpoint, method, statusCode, responseTime, correlationId);
    }

    /// <summary>
    /// Records a database operation metric
    /// </summary>
    public void RecordDatabaseOperation(string operation, long duration, bool success, int recordCount = 0)
    {
        var successString = success ? "true" : "false";
        
        // Update Prometheus metrics
        DatabaseOperationsTotal.WithLabels(operation, successString).Inc();
        DatabaseOperationDuration.WithLabels(operation).Observe(duration / 1000.0);
        
        // Update counters
        IncrementCounter("database_operations_total");
        IncrementCounter($"database_operations_{operation}");
        if (success)
        {
            IncrementCounter("database_operations_successful");
        }
        else
        {
            IncrementCounter("database_operations_failed");
        }
        
        if (recordCount > 0)
        {
            IncrementCounter("database_records_processed", recordCount);
        }
        
        _logger.LogDebug("Database operation recorded: {Operation} {Duration}ms {Success} {RecordCount}", 
            operation, duration, success, recordCount);
    }

    /// <summary>
    /// Records an LLM service operation metric
    /// </summary>
    public void RecordLLMOperation(string operation, string model, long duration, bool success, int tokenCount = 0)
    {
        var successString = success ? "true" : "false";
        
        // Update Prometheus metrics
        LLMOperationsTotal.WithLabels(operation, model, successString).Inc();
        LLMOperationDuration.WithLabels(operation, model).Observe(duration / 1000.0);
        
        if (tokenCount > 0)
        {
            LLMTokensProcessed.WithLabels(operation, model).Inc(tokenCount);
        }
        
        // Update counters
        IncrementCounter("llm_operations_total");
        IncrementCounter($"llm_operations_{operation}");
        IncrementCounter($"llm_operations_{model}");
        if (success)
        {
            IncrementCounter("llm_operations_successful");
        }
        else
        {
            IncrementCounter("llm_operations_failed");
        }
        
        if (tokenCount > 0)
        {
            IncrementCounter("llm_tokens_processed", tokenCount);
        }
        
        _logger.LogDebug("LLM operation recorded: {Operation} {Model} {Duration}ms {Success} {TokenCount}", 
            operation, model, duration, success, tokenCount);
    }

    /// <summary>
    /// Records a business metric
    /// </summary>
    public void RecordBusinessMetric(string metric, double value, Dictionary<string, string>? tags = null)
    {
        // Update Prometheus metrics
        BusinessMetricsTotal.WithLabels(metric).Inc(value);
        
        // Update gauges
        SetGauge($"business_{metric}", value, tags);
        
        _logger.LogDebug("Business metric recorded: {Metric} {Value} {Tags}", metric, value, tags);
    }

    /// <summary>
    /// Records an error metric
    /// </summary>
    public void RecordError(string errorType, string source, string message, string? correlationId = null)
    {
        // Update Prometheus metrics
        ErrorsTotal.WithLabels(errorType, source).Inc();
        
        // Store error sample
        var errorSample = new ErrorSample
        {
            ErrorType = errorType,
            Source = source,
            Message = message,
            CorrelationId = correlationId
        };
        
        _errors.AddOrUpdate(errorType, new ConcurrentBag<ErrorSample> { errorSample }, (k, bag) =>
        {
            bag.Add(errorSample);
            // Keep only last 100 errors per type
            if (bag.Count > 100)
            {
                var items = bag.ToList();
                bag.Clear();
                foreach (var item in items.TakeLast(100))
                {
                    bag.Add(item);
                }
            }
            return bag;
        });
        
        // Update counters
        IncrementCounter("errors_total");
        IncrementCounter($"errors_{errorType}");
        IncrementCounter($"errors_source_{source}");
        
        _logger.LogDebug("Error recorded: {ErrorType} {Source} {Message} {CorrelationId}", 
            errorType, source, message, correlationId);
    }

    /// <summary>
    /// Gets current system metrics
    /// </summary>
    public async Task<SystemMetrics> GetSystemMetricsAsync()
    {
        var uptime = (long)(DateTime.UtcNow - _startTime).TotalSeconds;
        var memoryUsage = GC.GetTotalMemory(false);
        
        // Get thread pool info
        ThreadPool.GetAvailableThreads(out var availableWorkerThreads, out var availableCompletionPortThreads);
        ThreadPool.GetMaxThreads(out var maxWorkerThreads, out var maxCompletionPortThreads);
        
        var systemMetrics = new SystemMetrics
        {
            UptimeSeconds = uptime,
            MemoryUsageBytes = memoryUsage,
            CpuUsagePercent = await GetCpuUsageAsync(),
            GarbageCollection = new GarbageCollectionMetrics
            {
                Gen0Collections = GC.CollectionCount(0),
                Gen1Collections = GC.CollectionCount(1),
                Gen2Collections = GC.CollectionCount(2),
                TotalAllocatedBytes = GC.GetTotalAllocatedBytes(),
                TimeInGCPercent = GetTimeInGCPercent()
            },
            ThreadPool = new ThreadPoolMetrics
            {
                AvailableWorkerThreads = availableWorkerThreads,
                AvailableCompletionPortThreads = availableCompletionPortThreads,
                MaxWorkerThreads = maxWorkerThreads,
                MaxCompletionPortThreads = maxCompletionPortThreads,
                QueuedWorkItems = ThreadPool.ThreadCount
            },
            Requests = new RequestMetrics
            {
                TotalRequests = GetCounterValue("requests_total"),
                SuccessfulRequests = GetCounterValue("requests_successful"),
                FailedRequests = GetCounterValue("requests_failed"),
                ActiveRequests = (int)Interlocked.Read(ref _activeRequestCount)
            },
            Database = new DatabaseMetrics
            {
                TotalOperations = GetCounterValue("database_operations_total"),
                SuccessfulOperations = GetCounterValue("database_operations_successful"),
                FailedOperations = GetCounterValue("database_operations_failed"),
                RecordsProcessed = GetCounterValue("database_records_processed")
            },
            LLMService = new LLMServiceMetrics
            {
                TotalOperations = GetCounterValue("llm_operations_total"),
                SuccessfulOperations = GetCounterValue("llm_operations_successful"),
                FailedOperations = GetCounterValue("llm_operations_failed"),
                TotalTokens = GetCounterValue("llm_tokens_processed")
            },
            Business = new BusinessMetrics
            {
                DocumentsIngested = GetCounterValue("documents_ingested"),
                ContextRequests = GetCounterValue("context_requests"),
                SearchRequests = GetCounterValue("search_requests"),
                CustomMetrics = _gauges.Where(kvp => kvp.Key.StartsWith("business_")).ToDictionary(kvp => kvp.Key, kvp => kvp.Value)
            }
        };
        
        return systemMetrics;
    }

    /// <summary>
    /// Gets performance metrics for a specific time range
    /// </summary>
    public async Task<PerformanceMetrics> GetPerformanceMetricsAsync(TimeSpan timeRange)
    {
        var allResponseTimes = new List<long>();
        var endpointMetrics = new Dictionary<string, EndpointMetrics>();
        
        foreach (var kvp in _responseTimes)
        {
            var responseTimes = kvp.Value.ToList();
            allResponseTimes.AddRange(responseTimes);
            
            var endpoint = kvp.Key;
            var avgResponseTime = responseTimes.Average();
            var sortedTimes = responseTimes.OrderBy(x => x).ToList();
            
            endpointMetrics[endpoint] = new EndpointMetrics
            {
                Endpoint = endpoint,
                TotalRequests = responseTimes.Count,
                AverageResponseTime = avgResponseTime,
                P95ResponseTime = GetPercentile(sortedTimes, 0.95)
            };
        }
        
        var sortedAllTimes = allResponseTimes.OrderBy(x => x).ToList();
        var totalRequests = GetCounterValue("requests_total");
        var successfulRequests = GetCounterValue("requests_successful");
        
        return new PerformanceMetrics
        {
            TimeRange = timeRange,
            AverageResponseTime = sortedAllTimes.Any() ? sortedAllTimes.Average() : 0,
            P50ResponseTime = GetPercentile(sortedAllTimes, 0.5),
            P90ResponseTime = GetPercentile(sortedAllTimes, 0.9),
            P95ResponseTime = GetPercentile(sortedAllTimes, 0.95),
            P99ResponseTime = GetPercentile(sortedAllTimes, 0.99),
            RequestsPerSecond = totalRequests / timeRange.TotalSeconds,
            SuccessRate = totalRequests > 0 ? (double)successfulRequests / totalRequests * 100 : 0,
            EndpointMetrics = endpointMetrics
        };
    }

    /// <summary>
    /// Gets error metrics for a specific time range
    /// </summary>
    public async Task<ErrorMetrics> GetErrorMetricsAsync(TimeSpan timeRange)
    {
        var cutoffTime = DateTime.UtcNow - timeRange;
        var allErrors = new List<ErrorSample>();
        var errorsByType = new Dictionary<string, long>();
        var errorsBySource = new Dictionary<string, long>();
        
        foreach (var kvp in _errors)
        {
            var recentErrors = kvp.Value.Where(e => e.Timestamp >= cutoffTime).ToList();
            allErrors.AddRange(recentErrors);
            
            errorsByType[kvp.Key] = recentErrors.Count;
            
            foreach (var error in recentErrors)
            {
                errorsBySource[error.Source] = errorsBySource.GetValueOrDefault(error.Source, 0) + 1;
            }
        }
        
        return new ErrorMetrics
        {
            TimeRange = timeRange,
            TotalErrors = allErrors.Count,
            ErrorRate = allErrors.Count / timeRange.TotalSeconds,
            ErrorsByType = errorsByType,
            ErrorsBySource = errorsBySource,
            RecentErrors = allErrors.OrderByDescending(e => e.Timestamp).Take(50).ToList()
        };
    }

    /// <summary>
    /// Starts a performance timer for an operation
    /// </summary>
    public IDisposable StartTimer(string operationName)
    {
        Interlocked.Increment(ref _activeRequestCount);
        ActiveRequests.Set(_activeRequestCount);
        
        return new PerformanceTimer(operationName, this);
    }

    /// <summary>
    /// Increments a counter metric
    /// </summary>
    public void IncrementCounter(string counterName, long increment = 1, Dictionary<string, string>? tags = null)
    {
        _counters.AddOrUpdate(counterName, increment, (k, v) => v + increment);
    }

    /// <summary>
    /// Sets a gauge metric value
    /// </summary>
    public void SetGauge(string gaugeName, double value, Dictionary<string, string>? tags = null)
    {
        _gauges.AddOrUpdate(gaugeName, value, (k, v) => value);
    }

    private long GetCounterValue(string counterName)
    {
        return _counters.GetValueOrDefault(counterName, 0);
    }

    private double GetPercentile(List<long> sortedValues, double percentile)
    {
        if (!sortedValues.Any()) return 0;
        
        var index = (int)Math.Ceiling(percentile * sortedValues.Count) - 1;
        index = Math.Max(0, Math.Min(index, sortedValues.Count - 1));
        
        return sortedValues[index];
    }

    private async Task<double> GetCpuUsageAsync()
    {
        try
        {
            var startTime = DateTime.UtcNow;
            var startCpuUsage = _currentProcess.TotalProcessorTime;
            
            await Task.Delay(1000);
            
            var endTime = DateTime.UtcNow;
            var endCpuUsage = _currentProcess.TotalProcessorTime;
            
            var cpuUsedMs = (endCpuUsage - startCpuUsage).TotalMilliseconds;
            var totalMsPassed = (endTime - startTime).TotalMilliseconds;
            var cpuUsageTotal = cpuUsedMs / (Environment.ProcessorCount * totalMsPassed);
            
            return cpuUsageTotal * 100;
        }
        catch
        {
            return 0;
        }
    }

    private double GetTimeInGCPercent()
    {
        // This is a simplified calculation - in a real implementation,
        // you'd use performance counters or ETW events
        return 0.5; // Placeholder
    }

    private async Task CollectSystemMetricsAsync()
    {
        while (true)
        {
            try
            {
                var memoryUsage = GC.GetTotalMemory(false);
                var cpuUsage = await GetCpuUsageAsync();
                
                SystemMemoryUsage.Set(memoryUsage);
                SystemCpuUsage.Set(cpuUsage);
                GarbageCollectionGen0.Set(GC.CollectionCount(0));
                GarbageCollectionGen1.Set(GC.CollectionCount(1));
                GarbageCollectionGen2.Set(GC.CollectionCount(2));
                
                ThreadPool.GetAvailableThreads(out var availableWorkerThreads, out var availableCompletionPortThreads);
                ThreadPoolWorkerThreads.WithLabels("available").Set(availableWorkerThreads);
                ThreadPoolWorkerThreads.WithLabels("available_completion_port").Set(availableCompletionPortThreads);
                
                await Task.Delay(TimeSpan.FromSeconds(30));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error collecting system metrics");
                await Task.Delay(TimeSpan.FromSeconds(60));
            }
        }
    }

    private class PerformanceTimer : IDisposable
    {
        private readonly string _operationName;
        private readonly MetricsCollectionService _metricsService;
        private readonly Stopwatch _stopwatch;

        public PerformanceTimer(string operationName, MetricsCollectionService metricsService)
        {
            _operationName = operationName;
            _metricsService = metricsService;
            _stopwatch = Stopwatch.StartNew();
        }

        public void Dispose()
        {
            _stopwatch.Stop();
            var duration = _stopwatch.ElapsedMilliseconds;
            
            Interlocked.Decrement(ref _metricsService._activeRequestCount);
            ActiveRequests.Set(_metricsService._activeRequestCount);
            
            _metricsService._logger.LogDebug("Operation {OperationName} completed in {Duration}ms", 
                _operationName, duration);
        }
    }
}