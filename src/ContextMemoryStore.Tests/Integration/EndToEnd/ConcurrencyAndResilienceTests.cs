using ContextMemoryStore.Tests.Common;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net.Http;
using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace ContextMemoryStore.Tests.Integration.EndToEnd;

/// <summary>
/// Tests concurrent access patterns and system resilience under various load conditions.
/// Validates that the system can handle multiple simultaneous operations gracefully
/// and maintains data integrity under stress.
/// </summary>
[Trait(TestTraits.Category, TestCategories.EndToEnd)]
[Trait(TestTraits.Service, "ConcurrencyResilience")]
[Trait(TestTraits.Duration, "Long")]
public class ConcurrencyAndResilienceTests : ServiceIntegrationTestBase
{
    private readonly TestDataManager _testDataManager;
    private readonly JsonSerializerOptions _jsonOptions;
    private readonly ConcurrentBag<string> _activeProjects;

    public ConcurrencyAndResilienceTests()
    {
        _testDataManager = new TestDataManager();
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };
        _activeProjects = new ConcurrentBag<string>();
    }

    protected override bool RequiresQdrant() => false; // Using mocked services for reliability
    protected override bool RequiresNeo4j() => false;
    protected override bool RequiresOllama() => false;

    [Fact]
    public async Task ConcurrentIngestion_ShouldMaintainDataIntegrity()
    {
        // Arrange
        var projectId = GenerateTestProjectId();
        var batchCount = 5;
        var documentsPerBatch = 3;
        var allBatches = new List<List<ContextMemoryStore.Core.Entities.Document>>();

        for (int i = 0; i < batchCount; i++)
        {
            var batch = _testDataManager.CreateTestDocuments(documentsPerBatch, $"batch_{i}");
            allBatches.Add(batch);
        }

        // Act
        await StartEngine(projectId);

        var ingestionTasks = allBatches.Select(async (batch, index) =>
        {
            var stopwatch = Stopwatch.StartNew();
            try
            {
                await IngestDocuments(projectId, batch);
                stopwatch.Stop();
                Logger.LogInformation("Batch {Index} ingested in {Duration}ms", index, stopwatch.ElapsedMilliseconds);
                return true;
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Batch {Index} failed to ingest", index);
                return false;
            }
        });

        var results = await Task.WhenAll(ingestionTasks);

        // Assert
        results.Should().AllSatisfy(result => result.Should().BeTrue());

        // Verify all data is searchable
        var searchResponse = await SearchDocuments(projectId, "test");
        searchResponse.Should().NotBeNull();

        Logger.LogInformation("Concurrent ingestion of {BatchCount} batches completed successfully", batchCount);

        await StopEngine(projectId);
    }

    [Fact]
    public async Task ConcurrentQueries_ShouldReturnConsistentResults()
    {
        // Arrange
        var projectId = GenerateTestProjectId();
        var documents = _testDataManager.CreateTestDocuments(10);
        var queryCount = 10;
        var queries = Enumerable.Range(0, queryCount)
            .Select(i => $"test query {i % 3}") // Repeat some queries
            .ToList();

        // Act
        await StartEngine(projectId);
        await IngestDocuments(projectId, documents);

        var queryTasks = queries.Select(async (query, index) =>
        {
            var stopwatch = Stopwatch.StartNew();
            try
            {
                var contextResult = await QueryContext(projectId, query);
                var searchResult = await SearchDocuments(projectId, query);
                stopwatch.Stop();

                Logger.LogInformation("Query {Index} ({Query}) completed in {Duration}ms", 
                    index, query, stopwatch.ElapsedMilliseconds);

                return new { Index = index, Query = query, Success = true, ContextResult = contextResult, SearchResult = searchResult };
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Query {Index} ({Query}) failed", index, query);
                return new { Index = index, Query = query, Success = false, ContextResult = (object?)null, SearchResult = (object?)null };
            }
        });

        var queryResults = await Task.WhenAll(queryTasks);

        // Assert
        queryResults.Should().AllSatisfy(result => result.Success.Should().BeTrue());
        queryResults.Should().AllSatisfy(result => result.ContextResult.Should().NotBeNull());
        queryResults.Should().AllSatisfy(result => result.SearchResult.Should().NotBeNull());

        Logger.LogInformation("Concurrent queries completed successfully: {SuccessCount}/{TotalCount}", 
            queryResults.Count(r => r.Success), queryResults.Length);

        await StopEngine(projectId);
    }

    [Fact]
    public async Task MixedOperations_ShouldHandleConcurrentReadWrite()
    {
        // Arrange
        var projectId = GenerateTestProjectId();
        var initialDocs = _testDataManager.CreateTestDocuments(5);
        var additionalBatches = Enumerable.Range(0, 3)
            .Select(i => _testDataManager.CreateTestDocuments(2, $"additional_batch_{i}"))
            .ToList();

        // Act
        await StartEngine(projectId);
        await IngestDocuments(projectId, initialDocs);

        var mixedTasks = new List<Task>();

        // Add concurrent write operations
        foreach (var batch in additionalBatches)
        {
            mixedTasks.Add(IngestDocuments(projectId, batch));
        }

        // Add concurrent read operations
        for (int i = 0; i < 5; i++)
        {
            var query = $"test query {i}";
            mixedTasks.Add(QueryContext(projectId, query));
            mixedTasks.Add(SearchDocuments(projectId, query));
        }

        // Add status checks
        for (int i = 0; i < 3; i++)
        {
            mixedTasks.Add(GetEngineStatus(projectId));
        }

        // Execute all operations concurrently
        await Task.WhenAll(mixedTasks);

        // Assert - System should remain stable
        var finalStatus = await GetEngineStatus(projectId);
        finalStatus.Should().NotBeNull();

        var finalContext = await QueryContext(projectId, "comprehensive test");
        finalContext.Should().NotBeNull();

        Logger.LogInformation("Mixed concurrent operations completed successfully");

        await StopEngine(projectId);
    }

    [Fact]
    public async Task MultipleProjects_ShouldHandleConcurrentLifecycles()
    {
        // Arrange
        var projectCount = 3;
        var projects = Enumerable.Range(0, projectCount)
            .Select(i => new
            {
                Id = GenerateTestProjectId(),
                Documents = _testDataManager.CreateTestDocuments(3, $"project_{i}")
            })
            .ToList();

        // Act
        var projectTasks = projects.Select(async project =>
        {
            var stopwatch = Stopwatch.StartNew();
            try
            {
                _activeProjects.Add(project.Id);

                await StartEngine(project.Id);
                await IngestDocuments(project.Id, project.Documents);
                
                // Perform multiple operations
                await QueryContext(project.Id, "test");
                await SearchDocuments(project.Id, "content");
                await GetEngineStatus(project.Id);
                
                await StopEngine(project.Id);
                
                stopwatch.Stop();
                Logger.LogInformation("Project {ProjectId} lifecycle completed in {Duration}ms", 
                    project.Id, stopwatch.ElapsedMilliseconds);
                
                return true;
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Project {ProjectId} lifecycle failed", project.Id);
                return false;
            }
        });

        var results = await Task.WhenAll(projectTasks);

        // Assert
        results.Should().AllSatisfy(result => result.Should().BeTrue());

        Logger.LogInformation("Concurrent project lifecycles completed: {SuccessCount}/{TotalCount}", 
            results.Count(r => r), results.Length);
    }

    [Fact]
    public async Task SystemResilience_UnderSustainedLoad()
    {
        // Arrange
        var projectId = GenerateTestProjectId();
        var loadDurationSeconds = 10; // Short duration for test
        var operationsPerSecond = 5;
        var totalOperations = loadDurationSeconds * operationsPerSecond;

        // Act
        await StartEngine(projectId);

        // Initial data
        var initialDocs = _testDataManager.CreateTestDocuments(5);
        await IngestDocuments(projectId, initialDocs);

        var loadTasks = new List<Task>();
        var successCount = 0;
        var failureCount = 0;
        var lockObject = new object();

        // Generate sustained load
        for (int i = 0; i < totalOperations; i++)
        {
            var operationIndex = i;
            loadTasks.Add(Task.Run(async () =>
            {
                try
                {
                    // Mix different operations
                    switch (operationIndex % 4)
                    {
                        case 0:
                            await QueryContext(projectId, $"load test {operationIndex}");
                            break;
                        case 1:
                            await SearchDocuments(projectId, $"search {operationIndex}");
                            break;
                        case 2:
                            await GetEngineStatus(projectId);
                            break;
                        case 3:
                            var smallBatch = _testDataManager.CreateTestDocuments(1, $"load_{operationIndex}");
                            await IngestDocuments(projectId, smallBatch);
                            break;
                    }

                    lock (lockObject)
                    {
                        successCount++;
                    }
                }
                catch (Exception ex)
                {
                    Logger.LogWarning(ex, "Load operation {Index} failed", operationIndex);
                    lock (lockObject)
                    {
                        failureCount++;
                    }
                }

                // Throttle operations
                await Task.Delay(1000 / operationsPerSecond);
            }));
        }

        await Task.WhenAll(loadTasks);

        // Assert
        var successRate = (double)successCount / (successCount + failureCount);
        successRate.Should().BeGreaterThan(0.8, "System should maintain >80% success rate under load");

        // Verify system is still responsive
        var finalStatus = await GetEngineStatus(projectId);
        finalStatus.Should().NotBeNull();

        Logger.LogInformation("Sustained load test completed: {SuccessCount} successes, {FailureCount} failures, {SuccessRate:P} success rate", 
            successCount, failureCount, successRate);

        await StopEngine(projectId);
    }

    [Fact]
    public async Task ErrorRecovery_AfterTransientFailures()
    {
        // Arrange
        var projectId = GenerateTestProjectId();
        var documents = _testDataManager.CreateTestDocuments(5);

        // Act
        await StartEngine(projectId);
        await IngestDocuments(projectId, documents);

        // Simulate some operations that might encounter transient errors
        var resilientOperations = new List<Task>();

        for (int i = 0; i < 10; i++)
        {
            resilientOperations.Add(PerformResilientOperation(projectId, $"resilient query {i}"));
        }

        await Task.WhenAll(resilientOperations);

        // Assert - System should recover and remain operational
        var recoveryQuery = await QueryContext(projectId, "recovery test");
        recoveryQuery.Should().NotBeNull();

        var status = await GetEngineStatus(projectId);
        status.Should().NotBeNull();

        Logger.LogInformation("Error recovery validation completed successfully");

        await StopEngine(projectId);
    }

    // Helper Methods

    private async Task<object?> PerformResilientOperation(string projectId, string query)
    {
        const int maxRetries = 3;
        const int retryDelayMs = 100;

        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                return await QueryContext(projectId, query);
            }
            catch (Exception ex) when (attempt < maxRetries)
            {
                Logger.LogWarning(ex, "Operation failed on attempt {Attempt}, retrying...", attempt);
                await Task.Delay(retryDelayMs * attempt);
            }
        }

        throw new InvalidOperationException($"Operation failed after {maxRetries} attempts");
    }

    private async Task<object?> StartEngine(string projectId)
    {
        var request = new
        {
            ProjectId = projectId,
            Config = new
            {
                VectorStoreConfig = new { CollectionName = $"concurrent_test_{projectId}" },
                GraphStoreConfig = new { DatabaseName = "neo4j" }
            }
        };

        var json = JsonSerializer.Serialize(request, _jsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await HttpClient.PostAsync("/lifecycle/start", content);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var responseContent = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<object>(responseContent);
    }

    private async Task<object?> StopEngine(string projectId)
    {
        var request = new
        {
            ProjectId = projectId,
            CommitMessage = $"Concurrency test completion for {projectId}"
        };

        var json = JsonSerializer.Serialize(request, _jsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await HttpClient.PostAsync("/lifecycle/stop", content);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var responseContent = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<object>(responseContent);
    }

    private async Task<object?> GetEngineStatus(string projectId)
    {
        var response = await HttpClient.GetAsync($"/lifecycle/status?projectId={projectId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var responseContent = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<object>(responseContent);
    }

    private async Task<object?> IngestDocuments(string projectId, List<ContextMemoryStore.Core.Entities.Document> documents)
    {
        var request = new
        {
            ProjectId = projectId,
            Documents = documents.Select(d => new
            {
                d.Id,
                d.Content,
                Metadata = d.Metadata,
                Source = new
                {
                    d.Source.Type,
                    d.Source.Path
                }
            }).ToList(),
            Options = new
            {
                ProcessRelationships = true,
                GenerateSummary = false // Reduce processing time for concurrency tests
            }
        };

        var json = JsonSerializer.Serialize(request, _jsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await HttpClient.PostAsync("/memory/ingest", content);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var responseContent = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<object>(responseContent);
    }

    private async Task<object?> QueryContext(string projectId, string query)
    {
        var url = $"/memory/context?q={Uri.EscapeDataString(query)}&limit=5&includeRelationships=false&minScore=0.1";
        var response = await HttpClient.GetAsync(url);
        
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var responseContent = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<object>(responseContent);
    }

    private async Task<object?> SearchDocuments(string projectId, string query)
    {
        var url = $"/memory/search?q={Uri.EscapeDataString(query)}&limit=10&offset=0&sort=relevance";
        var response = await HttpClient.GetAsync(url);
        
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var responseContent = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<object>(responseContent);
    }

    private string GenerateTestProjectId()
    {
        return $"concurrent_test_{DateTime.UtcNow:yyyyMMdd_HHmmss}_{Guid.NewGuid():N}";
    }

    public override async Task DisposeAsync()
    {
        // Cleanup any remaining active projects
        var cleanupTasks = _activeProjects.Select(async projectId =>
        {
            try
            {
                await StopEngine(projectId);
            }
            catch (Exception ex)
            {
                Logger.LogWarning(ex, "Failed to cleanup project {ProjectId}", projectId);
            }
        });

        await Task.WhenAll(cleanupTasks);
        await base.DisposeAsync();
    }
}