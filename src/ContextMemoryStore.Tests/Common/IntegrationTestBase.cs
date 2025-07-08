using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using ContextMemoryStore.Api;
using ContextMemoryStore.Core.Interfaces;
using Moq;

namespace ContextMemoryStore.Tests.Common;

/// <summary>
/// Base class for integration tests using TestServer
/// </summary>
public abstract class IntegrationTestBase : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    protected readonly WebApplicationFactory<Program> Factory;
    protected readonly HttpClient Client;
    protected readonly IServiceScope ServiceScope;
    protected readonly IServiceProvider Services;

    protected IntegrationTestBase(WebApplicationFactory<Program> factory)
    {
        Factory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureAppConfiguration(ConfigureTestConfiguration);
            builder.ConfigureServices(ConfigureTestServices);
        });

        Client = Factory.CreateClient();
        ServiceScope = Factory.Services.CreateScope();
        Services = ServiceScope.ServiceProvider;
    }

    /// <summary>
    /// Configure test-specific configuration
    /// </summary>
    protected virtual void ConfigureTestConfiguration(IConfigurationBuilder builder)
    {
        // Load centralized test configuration to avoid drift
        builder.AddJsonFile("appsettings.Testing.json", optional: false, reloadOnChange: true);
    }

    /// <summary>
    /// Configure test-specific services (override for mocking)
    /// </summary>
    protected virtual void ConfigureTestServices(IServiceCollection services)
    {
        // Override with mocks by default for fast unit-style integration tests
        ReplaceWithMockServices(services);
    }

    /// <summary>
    /// Replace external dependencies with mocks
    /// </summary>
    protected virtual void ReplaceWithMockServices(IServiceCollection services)
    {
        // Remove existing service registrations
        RemoveService<IVectorStoreService>(services);
        RemoveService<IGraphStoreService>(services);
        RemoveService<ILLMService>(services);
        RemoveService<IMemoryService>(services);

        // Add mock services
        var mockVectorStore = new Mock<IVectorStoreService>();
        var mockGraphStore = new Mock<IGraphStoreService>();
        var mockLLMService = new Mock<ILLMService>();
        var mockMemoryService = new Mock<IMemoryService>();

        // Configure default mock behavior for health checks
        mockVectorStore.Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true);
        mockGraphStore.Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true);
        mockLLMService.Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true);
        mockMemoryService.Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true);

        services.AddSingleton(mockVectorStore.Object);
        services.AddSingleton(mockGraphStore.Object);
        services.AddSingleton(mockLLMService.Object);
        services.AddSingleton(mockMemoryService.Object);
    }

    /// <summary>
    /// Remove a service from the service collection
    /// </summary>
    protected static void RemoveService<T>(IServiceCollection services)
    {
        var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(T));
        if (descriptor != null)
        {
            services.Remove(descriptor);
        }
    }

    /// <summary>
    /// Get a service from the test service provider
    /// </summary>
    protected T GetService<T>() where T : notnull => Services.GetRequiredService<T>();

    /// <summary>
    /// Get a logger for the specified type
    /// </summary>
    protected ILogger<T> GetLogger<T>() => Services.GetRequiredService<ILogger<T>>();

    public virtual void Dispose()
    {
        ServiceScope?.Dispose();
        Client?.Dispose();
        GC.SuppressFinalize(this);
    }
}