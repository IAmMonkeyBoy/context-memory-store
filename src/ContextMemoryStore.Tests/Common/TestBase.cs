using Microsoft.Extensions.Logging;
using Moq;

namespace ContextMemoryStore.Tests.Common;

/// <summary>
/// Base class for all unit tests providing common test utilities
/// </summary>
public abstract class TestBase : IDisposable
{
    protected readonly MockRepository MockRepository;
    protected readonly ILoggerFactory LoggerFactory;

    protected TestBase()
    {
        MockRepository = new MockRepository(MockBehavior.Strict);
        LoggerFactory = new LoggerFactory();
    }

    /// <summary>
    /// Creates a logger for the specified type
    /// </summary>
    protected ILogger<T> CreateLogger<T>() => LoggerFactory.CreateLogger<T>();

    /// <summary>
    /// Creates a mock of the specified type
    /// </summary>
    protected Mock<T> CreateMock<T>() where T : class => MockRepository.Create<T>();

    /// <summary>
    /// Verifies all mocks created during the test
    /// </summary>
    protected virtual void VerifyMocks() => MockRepository.VerifyAll();

    public virtual void Dispose()
    {
        LoggerFactory?.Dispose();
        GC.SuppressFinalize(this);
    }
}