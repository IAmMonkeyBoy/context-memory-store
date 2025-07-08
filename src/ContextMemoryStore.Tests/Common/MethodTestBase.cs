using Microsoft.Extensions.Logging;
using Moq;

namespace ContextMemoryStore.Tests.Common;

/// <summary>
/// Base class for unit tests focused on testing a single method
/// </summary>
/// <typeparam name="TSubject">The class under test</typeparam>
public abstract class MethodTestBase<TSubject> : TestBase where TSubject : class
{
    protected readonly Mock<ILogger<TSubject>> LoggerMock;

    protected MethodTestBase()
    {
        LoggerMock = CreateMock<ILogger<TSubject>>();
    }

    /// <summary>
    /// Creates an instance of the subject under test with mocked dependencies
    /// Override this method to provide the actual instance creation logic
    /// </summary>
    protected abstract TSubject CreateSubject();

    /// <summary>
    /// Verify that no unexpected interactions occurred with mocked dependencies
    /// </summary>
    protected override void VerifyMocks()
    {
        base.VerifyMocks();
        
        // Verify no unexpected logging calls were made
        LoggerMock.VerifyNoOtherCalls();
    }

    /// <summary>
    /// Setup logging expectations for the test
    /// </summary>
    protected void SetupLogging(LogLevel level, string message)
    {
        LoggerMock.Setup(x => x.Log(
            level,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains(message)),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()));
    }

    /// <summary>
    /// Verify that a log message was written at the specified level
    /// </summary>
    protected void VerifyLogging(LogLevel level, string message, Times times)
    {
        LoggerMock.Verify(x => x.Log(
            level,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains(message)),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()), times);
    }
}