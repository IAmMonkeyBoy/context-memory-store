using Microsoft.Extensions.Configuration;

namespace ContextMemoryStore.Tests.Common;

/// <summary>
/// Configuration class for integration testing settings.
/// </summary>
public class IntegrationTestConfiguration
{
    public TimeSpan ContainerStartupTimeout { get; set; } = TimeSpan.FromMinutes(2);
    public TimeSpan ServiceReadinessTimeout { get; set; } = TimeSpan.FromMinutes(1);
    public TimeSpan CleanupTimeout { get; set; } = TimeSpan.FromSeconds(30);
    public bool UseTestContainers { get; set; } = true;
    public bool ParallelTestExecution { get; set; } = false;
    public bool TestDataIsolation { get; set; } = true;

    public static IntegrationTestConfiguration FromConfiguration(IConfiguration configuration)
    {
        var config = new IntegrationTestConfiguration();
        configuration.GetSection("TestConfiguration").Bind(config);
        return config;
    }
}

/// <summary>
/// Test categories for organizing integration tests.
/// </summary>
public static class TestCategories
{
    public const string Integration = "Integration";
    public const string ServiceIntegration = "ServiceIntegration";
    public const string EndToEnd = "EndToEnd";
    public const string Performance = "Performance";
    public const string Docker = "Docker";
    public const string SlowTest = "SlowTest";
    public const string RequiresExternalServices = "RequiresExternalServices";
}

/// <summary>
/// Test traits for integration testing.
/// </summary>
public static class TestTraits
{
    public const string Category = "Category";
    public const string Service = "Service";
    public const string Priority = "Priority";
    public const string Duration = "Duration";
}

/// <summary>
/// Common test values and constants.
/// </summary>
public static class TestConstants
{
    // Timeouts
    public static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(30);
    public static readonly TimeSpan ShortTimeout = TimeSpan.FromSeconds(10);
    public static readonly TimeSpan LongTimeout = TimeSpan.FromMinutes(2);

    // Test data
    public const int DefaultVectorDimensions = 768;
    public const int DefaultTestDocumentCount = 5;
    public const int DefaultTestNodeCount = 5;

    // Service endpoints (for external testing)
    public const string DefaultQdrantEndpoint = "http://localhost:6333";
    public const string DefaultNeo4jEndpoint = "bolt://localhost:7687";
    public const string DefaultOllamaEndpoint = "http://localhost:11434/v1";

    // Test collections and namespaces
    public const string TestCollectionPrefix = "test_collection_";
    public const string TestNodePrefix = "test_node_";
    public const string TestNamespace = "integration_tests";
}

/// <summary>
/// Helper class for managing test environment detection.
/// </summary>
public static class TestEnvironment
{
    /// <summary>
    /// Checks if we're running in a CI/CD environment.
    /// </summary>
    public static bool IsCiEnvironment =>
        !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("CI")) ||
        !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("GITHUB_ACTIONS")) ||
        !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("TF_BUILD"));

    /// <summary>
    /// Checks if Docker is available.
    /// </summary>
    public static bool IsDockerAvailable
    {
        get
        {
            try
            {
                var processInfo = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "docker",
                    Arguments = "info",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = System.Diagnostics.Process.Start(processInfo);
                return process?.WaitForExit(5000) == true && process.ExitCode == 0;
            }
            catch
            {
                return false;
            }
        }
    }

    /// <summary>
    /// Checks if external services are available for testing.
    /// </summary>
    public static async Task<bool> AreExternalServicesAvailable()
    {
        var tasks = new[]
        {
            CheckServiceAvailability("http://localhost:6333/", "Qdrant"),
            CheckServiceAvailability("http://localhost:7474/", "Neo4j"),
            CheckServiceAvailability("http://localhost:11434/v1/models", "Ollama")
        };

        var results = await Task.WhenAll(tasks);
        return results.Any(r => r); // At least one service is available
    }

    private static async Task<bool> CheckServiceAvailability(string endpoint, string serviceName)
    {
        try
        {
            using var httpClient = new HttpClient();
            httpClient.Timeout = TimeSpan.FromSeconds(5);
            var response = await httpClient.GetAsync(endpoint);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }
}