using ContextMemoryStore.Core.Entities;
using ContextMemoryStore.Tests.Common;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using Xunit;

namespace ContextMemoryStore.Tests.Integration.Performance;

/// <summary>
/// Performance and load testing for the Context Memory Store system.
/// Tests API performance targets, resource utilization, and system behavior under stress.
/// </summary>
[Trait(TestTraits.Category, TestCategories.Performance)]
[Trait(TestTraits.Duration, "Long")]
public class PerformanceAndLoadTests : ServiceIntegrationTestBase
{
    private readonly TestDataManager _testDataManager;
    private readonly PerformanceMetrics _metrics;

    public PerformanceAndLoadTests()
    {
        _testDataManager = new TestDataManager();
        _metrics = new PerformanceMetrics();
    }

    protected override bool RequiresQdrant() => true;
    protected override bool RequiresNeo4j() => true;
    protected override bool RequiresOllama() => false;

    [Fact]
    public async Task HealthEndpoint_ShouldMeetPerformanceTargets()
    {
        // Arrange
        const int requestCount = 100;
        const int maxResponseTimeMs = 100; // Target: sub-100ms for health checks

        // Act
        var stopwatch = Stopwatch.StartNew();
        var tasks = Enumerable.Range(0, requestCount)
            .Select(_ => MeasureRequestTime(() => HttpClient.GetAsync("/health")));

        var results = await Task.WhenAll(tasks);
        stopwatch.Stop();

        // Assert
        var avgResponseTime = results.Average(r => r.ResponseTime.TotalMilliseconds);
        var maxResponseTime = results.Max(r => r.ResponseTime.TotalMilliseconds);
        var successRate = results.Count(r => r.IsSuccess) / (double)requestCount * 100;

        avgResponseTime.Should().BeLessThan(maxResponseTimeMs, 
            "Average response time should be under 100ms for health checks");
        successRate.Should().BeGreaterThan(95, 
            "Success rate should be above 95% under load");

        _metrics.RecordPerformanceTest("HealthEndpoint", requestCount, 
            TimeSpan.FromMilliseconds(avgResponseTime), successRate);

        Logger.LogInformation("Health endpoint performance: Avg={Avg}ms, Max={Max}ms, Success={Success}%", 
            avgResponseTime, maxResponseTime, successRate);
    }

    [Fact]
    public async Task ConcurrentHealthChecks_ShouldHandleHighLoad()
    {
        // Arrange
        const int concurrentUsers = 20;
        const int requestsPerUser = 25;
        const int totalRequests = concurrentUsers * requestsPerUser;

        // Act
        var userTasks = Enumerable.Range(0, concurrentUsers)
            .Select(async userId =>
            {
                var userStopwatch = Stopwatch.StartNew();
                var requests = Enumerable.Range(0, requestsPerUser)
                    .Select(_ => HttpClient.GetAsync("/health"));

                var responses = await Task.WhenAll(requests);
                userStopwatch.Stop();

                return new
                {
                    UserId = userId,
                    Duration = userStopwatch.Elapsed,
                    SuccessCount = responses.Count(r => r.IsSuccessStatusCode),
                    TotalRequests = requestsPerUser
                };
            });

        var userResults = await Task.WhenAll(userTasks);

        // Assert
        var totalSuccesses = userResults.Sum(u => u.SuccessCount);
        var overallSuccessRate = totalSuccesses / (double)totalRequests * 100;
        var avgUserDuration = userResults.Average(u => u.Duration.TotalMilliseconds);

        overallSuccessRate.Should().BeGreaterThan(90, 
            "System should maintain >90% success rate under concurrent load");
        avgUserDuration.Should().BeLessThan(30000, 
            "Average user session should complete within 30 seconds");

        Logger.LogInformation("Concurrent load test: {Users} users, {Requests} requests, {Success}% success rate", 
            concurrentUsers, totalRequests, overallSuccessRate);
    }

    [Fact]
    public async Task MemoryIngestEndpoint_ShouldHandleReasonableLoad()
    {
        // Arrange
        const int documentCount = 10;
        const int maxResponseTimeMs = 5000; // 5 seconds for ingest operations

        var documents = _testDataManager.CreateTestDocuments(documentCount);
        var tasks = documents.Select(doc => MeasureIngestRequest(doc));

        // Act
        var results = await Task.WhenAll(tasks);

        // Assert
        var avgResponseTime = results.Average(r => r.ResponseTime.TotalMilliseconds);
        var successRate = results.Count(r => r.IsSuccess) / (double)documentCount * 100;

        // More lenient for ingest operations as they involve external services
        avgResponseTime.Should().BeLessThan(maxResponseTimeMs, 
            "Memory ingest should complete within reasonable time");

        _metrics.RecordPerformanceTest("MemoryIngest", documentCount, 
            TimeSpan.FromMilliseconds(avgResponseTime), successRate);

        Logger.LogInformation("Memory ingest performance: Avg={Avg}ms, Success={Success}%", 
            avgResponseTime, successRate);
    }

    [Fact]
    public async Task LifecycleEndpoints_ShouldHandleSequentialOperations()
    {
        // Arrange
        var projectId = _testDataManager.GenerateTestNodeId();
        const int maxLifecycleTimeMs = 10000; // 10 seconds for lifecycle operations

        // Act & Assert - Test lifecycle start
        var startResult = await MeasureLifecycleStart(projectId);
        startResult.ResponseTime.TotalMilliseconds.Should().BeLessThan(maxLifecycleTimeMs,
            "Lifecycle start should complete within reasonable time");

        // Test lifecycle status check
        var statusResult = await MeasureLifecycleStatus(projectId);
        statusResult.ResponseTime.TotalMilliseconds.Should().BeLessThan(1000,
            "Lifecycle status should be very fast");

        Logger.LogInformation("Lifecycle performance: Start={Start}ms, Status={Status}ms", 
            startResult.ResponseTime.TotalMilliseconds, statusResult.ResponseTime.TotalMilliseconds);
    }

    [Fact]
    public async Task MetricsEndpoint_ShouldRemainsResponsiveUnderLoad()
    {
        // Arrange
        const int requestCount = 50;
        const int maxResponseTimeMs = 500; // Metrics should be fast

        // Generate some load first
        var warmupTasks = Enumerable.Range(0, 10)
            .Select(_ => HttpClient.GetAsync("/health"));
        await Task.WhenAll(warmupTasks);

        // Act
        var metricsTasks = Enumerable.Range(0, requestCount)
            .Select(_ => MeasureRequestTime(() => HttpClient.GetAsync("/metrics")));

        var results = await Task.WhenAll(metricsTasks);

        // Assert
        var avgResponseTime = results.Average(r => r.ResponseTime.TotalMilliseconds);
        var maxResponseTime = results.Max(r => r.ResponseTime.TotalMilliseconds);
        var successRate = results.Count(r => r.IsSuccess) / (double)requestCount * 100;

        avgResponseTime.Should().BeLessThan(maxResponseTimeMs,
            "Metrics endpoint should remain responsive under load");
        successRate.Should().BeGreaterThan(95,
            "Metrics endpoint should maintain high availability");

        Logger.LogInformation("Metrics endpoint performance: Avg={Avg}ms, Max={Max}ms, Success={Success}%", 
            avgResponseTime, maxResponseTime, successRate);
    }

    [Fact]
    public async Task SystemResourceUtilization_ShouldStayWithinLimits()
    {
        // Arrange - Get baseline metrics
        var baselineMemory = GC.GetTotalMemory(false);
        var baselineMetrics = await GetSystemMetrics();

        // Act - Generate load
        var loadTasks = new[]
        {
            GenerateHealthCheckLoad(50),
            GenerateMetricsLoad(25),
            GenerateLifecycleLoad(5)
        };

        await Task.WhenAll(loadTasks);

        // Get post-load metrics
        var postLoadMemory = GC.GetTotalMemory(false);
        var postLoadMetrics = await GetSystemMetrics();

        // Assert
        var memoryIncrease = postLoadMemory - baselineMemory;
        var memoryIncreasePercent = (memoryIncrease / (double)baselineMemory) * 100;

        memoryIncreasePercent.Should().BeLessThan(50,
            "Memory usage should not increase dramatically under load");

        Logger.LogInformation("Resource utilization: Memory increase={Increase}% ({Bytes} bytes)", 
            memoryIncreasePercent, memoryIncrease);
        Logger.LogInformation("Baseline metrics: {Baseline}", baselineMetrics);
        Logger.LogInformation("Post-load metrics: {PostLoad}", postLoadMetrics);
    }

    [Fact]
    public async Task StressTest_ShouldMaintainSystemStability()
    {
        // Arrange
        const int stressTestDurationMs = 30000; // 30 seconds
        const int concurrentWorkers = 10;
        var cancellationTokenSource = new CancellationTokenSource(TimeSpan.FromMilliseconds(stressTestDurationMs));

        var requestCounts = new int[concurrentWorkers];
        var errorCounts = new int[concurrentWorkers];

        // Act
        var workerTasks = Enumerable.Range(0, concurrentWorkers)
            .Select(async workerId =>
            {
                var requestCount = 0;
                var errorCount = 0;

                while (!cancellationTokenSource.Token.IsCancellationRequested)
                {
                    try
                    {
                        var response = await HttpClient.GetAsync("/health", cancellationTokenSource.Token);
                        if (!response.IsSuccessStatusCode)
                        {
                            errorCount++;
                        }
                        requestCount++;

                        // Small delay to prevent overwhelming the system
                        await Task.Delay(100, cancellationTokenSource.Token);
                    }
                    catch (OperationCanceledException)
                    {
                        break;
                    }
                    catch
                    {
                        errorCount++;
                        requestCount++;
                    }
                }

                requestCounts[workerId] = requestCount;
                errorCounts[workerId] = errorCount;
            });

        await Task.WhenAll(workerTasks);

        // Assert
        var totalRequests = requestCounts.Sum();
        var totalErrors = errorCounts.Sum();
        var errorRate = totalErrors / (double)totalRequests * 100;

        totalRequests.Should().BeGreaterThan(0, "Stress test should have made requests");
        errorRate.Should().BeLessThan(10, "Error rate should remain below 10% during stress test");

        Logger.LogInformation("Stress test completed: {Requests} requests, {Errors} errors ({ErrorRate}%)", 
            totalRequests, totalErrors, errorRate);
    }

    [Fact]
    public async Task MemoryLeakDetection_ShouldNotLeakMemoryOverTime()
    {
        // Arrange
        const int iterationCount = 100;
        var memoryReadings = new List<long>();

        // Act - Perform multiple iterations of operations
        for (int i = 0; i < iterationCount; i++)
        {
            // Perform various operations
            await HttpClient.GetAsync("/health");
            await HttpClient.GetAsync("/metrics");
            
            if (i % 10 == 0)
            {
                // Force garbage collection and record memory
                GC.Collect();
                GC.WaitForPendingFinalizers();
                GC.Collect();
                
                var memory = GC.GetTotalMemory(false);
                memoryReadings.Add(memory);
                
                Logger.LogDebug("Iteration {Iteration}: Memory={Memory} bytes", i, memory);
            }
        }

        // Assert
        memoryReadings.Should().HaveCountGreaterThan(5, "Should have multiple memory readings");

        // Check if memory is growing consistently (potential leak)
        var firstHalf = memoryReadings.Take(memoryReadings.Count / 2).Average();
        var secondHalf = memoryReadings.Skip(memoryReadings.Count / 2).Average();
        var memoryIncrease = (secondHalf - firstHalf) / firstHalf * 100;

        memoryIncrease.Should().BeLessThan(20, 
            "Memory usage should not increase significantly over time (potential memory leak)");

        Logger.LogInformation("Memory leak test: First half avg={FirstHalf}, Second half avg={SecondHalf}, Increase={Increase}%", 
            firstHalf, secondHalf, memoryIncrease);
    }

    // Helper Methods

    private async Task<PerformanceResult> MeasureRequestTime(Func<Task<HttpResponseMessage>> requestFunc)
    {
        var stopwatch = Stopwatch.StartNew();
        try
        {
            var response = await requestFunc();
            stopwatch.Stop();
            return new PerformanceResult
            {
                ResponseTime = stopwatch.Elapsed,
                IsSuccess = response.IsSuccessStatusCode
            };
        }
        catch
        {
            stopwatch.Stop();
            return new PerformanceResult
            {
                ResponseTime = stopwatch.Elapsed,
                IsSuccess = false
            };
        }
    }

    private async Task<PerformanceResult> MeasureIngestRequest(Document document)
    {
        var request = new
        {
            documents = new[] 
            {
                new 
                {
                    id = document.Id,
                    content = document.Content,
                    metadata = document.Metadata
                }
            },
            options = new { }
        };

        var json = JsonSerializer.Serialize(request);
        var httpContent = new StringContent(json, Encoding.UTF8, "application/json");

        return await MeasureRequestTime(() => HttpClient.PostAsync("/memory/ingest", httpContent));
    }

    private async Task<PerformanceResult> MeasureLifecycleStart(string projectId)
    {
        var request = new
        {
            projectId = projectId,
            config = new { }
        };

        var json = JsonSerializer.Serialize(request);
        var httpContent = new StringContent(json, Encoding.UTF8, "application/json");

        return await MeasureRequestTime(() => HttpClient.PostAsync("/lifecycle/start", httpContent));
    }

    private async Task<PerformanceResult> MeasureLifecycleStatus(string projectId)
    {
        return await MeasureRequestTime(() => HttpClient.GetAsync($"/lifecycle/status?projectId={projectId}"));
    }

    private async Task GenerateHealthCheckLoad(int requestCount)
    {
        var tasks = Enumerable.Range(0, requestCount)
            .Select(_ => HttpClient.GetAsync("/health"));
        await Task.WhenAll(tasks);
    }

    private async Task GenerateMetricsLoad(int requestCount)
    {
        var tasks = Enumerable.Range(0, requestCount)
            .Select(_ => HttpClient.GetAsync("/metrics"));
        await Task.WhenAll(tasks);
    }

    private async Task GenerateLifecycleLoad(int requestCount)
    {
        var tasks = Enumerable.Range(0, requestCount)
            .Select(async i =>
            {
                var projectId = $"load_test_project_{i}";
                await MeasureLifecycleStart(projectId);
                await MeasureLifecycleStatus(projectId);
            });
        await Task.WhenAll(tasks);
    }

    private async Task<string> GetSystemMetrics()
    {
        try
        {
            var response = await HttpClient.GetAsync("/metrics");
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                return $"Status={response.StatusCode}, Length={content.Length}";
            }
            return $"Status={response.StatusCode}";
        }
        catch (Exception ex)
        {
            return $"Error={ex.GetType().Name}";
        }
    }

    public override async Task DisposeAsync()
    {
        _metrics.LogSummary(Logger);
        Logger.LogInformation("Performance and load test cleanup completed");
        await base.DisposeAsync();
    }
}

/// <summary>
/// Result of a performance measurement
/// </summary>
public class PerformanceResult
{
    public TimeSpan ResponseTime { get; set; }
    public bool IsSuccess { get; set; }
}

/// <summary>
/// Tracks performance metrics across tests
/// </summary>
public class PerformanceMetrics
{
    private readonly List<PerformanceTestResult> _results = new();

    public void RecordPerformanceTest(string testName, int requestCount, TimeSpan avgResponseTime, double successRate)
    {
        _results.Add(new PerformanceTestResult
        {
            TestName = testName,
            RequestCount = requestCount,
            AverageResponseTime = avgResponseTime,
            SuccessRate = successRate,
            Timestamp = DateTime.UtcNow
        });
    }

    public void LogSummary(ILogger logger)
    {
        if (!_results.Any())
        {
            logger.LogInformation("No performance metrics recorded");
            return;
        }

        logger.LogInformation("Performance Test Summary:");
        foreach (var result in _results)
        {
            logger.LogInformation("- {TestName}: {RequestCount} requests, {AvgTime}ms avg, {SuccessRate}% success", 
                result.TestName, result.RequestCount, result.AverageResponseTime.TotalMilliseconds, result.SuccessRate);
        }

        var overallAvgTime = _results.Average(r => r.AverageResponseTime.TotalMilliseconds);
        var overallSuccessRate = _results.Average(r => r.SuccessRate);
        
        logger.LogInformation("Overall Performance: {OverallAvgTime}ms avg, {OverallSuccessRate}% success", 
            overallAvgTime, overallSuccessRate);
    }
}

/// <summary>
/// Individual performance test result
/// </summary>
public class PerformanceTestResult
{
    public string TestName { get; set; } = string.Empty;
    public int RequestCount { get; set; }
    public TimeSpan AverageResponseTime { get; set; }
    public double SuccessRate { get; set; }
    public DateTime Timestamp { get; set; }
}