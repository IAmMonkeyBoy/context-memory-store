using Xunit;

namespace ContextMemoryStore.Tests.Common;

/// <summary>
/// XUnit collection definitions for controlling test execution behavior.
/// These collections help prevent Docker port conflicts and resource contention.
/// </summary>

/// <summary>
/// Serialized collection for integration tests that may have Docker container conflicts.
/// Tests in this collection will not run in parallel with each other.
/// </summary>
[CollectionDefinition("SerializedIntegrationTests")]
public class SerializedIntegrationTestCollection : ICollectionFixture<IntegrationTestFixture>
{
    // This class has no code, and is never created. Its purpose is simply
    // to be the place to apply [CollectionDefinition] and all the
    // ICollectionFixture<> interfaces.
}

/// <summary>
/// Collection fixture for shared test infrastructure.
/// </summary>
public class IntegrationTestFixture : IDisposable
{
    public IntegrationTestFixture()
    {
        // Initialize any shared resources here
    }

    public void Dispose()
    {
        // Cleanup any shared resources here
    }
}

/// <summary>
/// Collection for Docker-related tests that require container management.
/// </summary>
[CollectionDefinition("DockerIntegrationTests")]
public class DockerIntegrationTestCollection : ICollectionFixture<DockerTestFixture>
{
    // This class has no code, and is never created. Its purpose is simply
    // to be the place to apply [CollectionDefinition] and all the
    // ICollectionFixture<> interfaces.
}

/// <summary>
/// Collection fixture for Docker-related test infrastructure.
/// </summary>
public class DockerTestFixture : IDisposable
{
    public DockerTestFixture()
    {
        // Initialize Docker-related resources here
    }

    public void Dispose()
    {
        // Cleanup Docker-related resources here
    }
}