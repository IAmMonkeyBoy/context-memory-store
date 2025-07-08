# Testing Methodology

This document outlines the specific testing approach and organizational structure used in the Context Memory Store project.

## Test Organization Structure

### Method-Focused Testing Pattern

This project uses a **method-focused testing pattern** with a specific folder hierarchy:

```
Tests/
├── Unit/
│   ├── [ClassName]/
│   │   ├── [MethodName]Tests.cs
│   │   ├── [AnotherMethod]Tests.cs
│   │   └── ...
│   └── ...
├── Integration/
│   ├── [ClassName]/
│   │   ├── [MethodName]EndpointTests.cs
│   │   ├── [AnotherMethod]EndpointTests.cs
│   │   └── ...
│   └── ...
└── ...
```

### Key Principles

1. **One folder per class under test**
   - Example: `Unit/Controllers/HealthController/`
   - Example: `Unit/Configuration/ApiOptions/`

2. **One test class per method under test**
   - Example: `GetHealthTests.cs` tests only the `GetHealth()` method
   - Example: `GetDetailedHealthTests.cs` tests only the `GetDetailedHealth()` method

3. **Each test class contains multiple test scenarios for that single method**
   - Happy path scenarios
   - Error scenarios
   - Edge cases
   - Different input variations

### Example Structure

```
Unit/
├── Controllers/
│   └── HealthController/
│       ├── GetHealthTests.cs          # Tests for GetHealth() method only
│       └── GetDetailedHealthTests.cs  # Tests for GetDetailedHealth() method only
├── Configuration/
│   └── ApiOptions/
│       ├── ValidationTests.cs         # Tests for validation behavior
│       └── DefaultValueTests.cs       # Tests for default value behavior
└── Services/
    └── MemoryService/
        ├── IngestDocumentTests.cs     # Tests for IngestDocumentAsync() method only
        └── SearchTests.cs             # Tests for SearchAsync() method only
```

## Testing Infrastructure

### Base Classes

- **`TestBase`**: Foundation for all unit tests
  - Provides mock repository and logger factory
  - Common disposal patterns
  - Mock verification utilities

- **`MethodTestBase<T>`**: Specialized base for method-focused testing
  - Generic subject creation pattern
  - Method-specific logger mocking
  - Focused verification patterns

- **`IntegrationTestBase`**: Foundation for integration tests
  - TestServer setup with WebApplicationFactory
  - Service mocking and configuration
  - HTTP client management

### Naming Conventions

#### Test Classes
- Format: `[MethodName]Tests.cs` for unit tests
- Format: `[MethodName]EndpointTests.cs` for integration tests
- Examples:
  - `GetHealthTests.cs`
  - `ValidateConfigurationTests.cs`
  - `ProcessDocumentEndpointTests.cs`

#### Test Methods
- Format: `[MethodName]_[Scenario]_[ExpectedOutcome]`
- Examples:
  - `GetHealth_WhenHealthy_ReturnsOkWithHealthyStatus`
  - `GetHealth_WhenUnhealthy_ReturnsServiceUnavailable`
  - `ValidateConfiguration_WithInvalidPort_ThrowsValidationException`

### Test Categories

#### Unit Tests
- **Location**: `Tests/Unit/[ClassName]/[MethodName]Tests.cs`
- **Purpose**: Test individual methods in isolation
- **Approach**: Mock all dependencies
- **Example**: Testing HealthController.GetHealth() method logic

#### Integration Tests
- **Location**: `Tests/Integration/[ClassName]/[MethodName]EndpointTests.cs`
- **Purpose**: Test full request/response cycles
- **Approach**: Use TestServer with minimal mocking
- **Example**: Testing GET /health endpoint behavior

#### Configuration Tests
- **Location**: `Tests/Unit/Configuration/[OptionsClass]/[Behavior]Tests.cs`
- **Purpose**: Test configuration validation and binding
- **Approach**: Test data annotations and default values
- **Example**: Testing ApiOptions validation rules

## Benefits of This Approach

### Organizational Benefits
1. **Clear navigation**: Easy to find tests for specific methods
2. **Focused scope**: Each test class has a single responsibility
3. **Scalable structure**: Folder hierarchy grows naturally with codebase
4. **Consistent patterns**: Predictable location for any method's tests

### Development Benefits
1. **Targeted testing**: Write tests for specific method behaviors
2. **Easier maintenance**: Changes to a method only affect one test class
3. **Better test isolation**: Method-focused tests reduce interdependencies
4. **Clearer failure reporting**: Test failures immediately identify the problematic method

### Code Review Benefits
1. **Focused reviews**: Test changes clearly map to specific functionality
2. **Complete coverage visibility**: Easy to verify all methods have test classes
3. **Consistent expectations**: Reviewers know exactly where to find tests
4. **Documentation value**: Test structure serves as living documentation

## Implementation Guidelines

### Creating New Tests

1. **Identify the class and method** to test
2. **Create the folder structure** if it doesn't exist:
   ```bash
   mkdir -p Tests/Unit/Controllers/NewController
   ```
3. **Create the test class** following naming conventions:
   ```csharp
   public class NewMethodTests : MethodTestBase<NewController>
   ```
4. **Implement test scenarios** for the specific method
5. **Follow the established patterns** from existing test classes

### Test Class Template

```csharp
using FluentAssertions;
using ContextMemoryStore.Tests.Common;

namespace ContextMemoryStore.Tests.Unit.[Namespace].[ClassName];

/// <summary>
/// Tests for [ClassName].[MethodName]() method
/// </summary>
public class [MethodName]Tests : MethodTestBase<[ClassName]>
{
    protected override [ClassName] CreateSubject()
    {
        return new [ClassName](/* dependencies */);
    }

    [Fact]
    public void [MethodName]_[Scenario]_[ExpectedOutcome]()
    {
        // Arrange
        
        // Act
        
        // Assert
    }
}
```

## Migration from Traditional Patterns

### Traditional .NET Testing
```
Tests/
├── Controllers/
│   └── HealthControllerTests.cs    # All methods in one file
└── Services/
    └── MemoryServiceTests.cs       # All methods in one file
```

### Our Method-Focused Pattern
```
Tests/
├── Unit/
│   ├── Controllers/
│   │   └── HealthController/
│   │       ├── GetHealthTests.cs           # Single method focus
│   │       └── GetDetailedHealthTests.cs   # Single method focus
│   └── Services/
│       └── MemoryService/
│           ├── IngestDocumentTests.cs      # Single method focus
│           └── SearchTests.cs              # Single method focus
```

### Key Differences
1. **Granularity**: Method-level vs class-level organization
2. **File count**: More files, but each with focused scope
3. **Navigation**: Folder structure mirrors code structure more closely
4. **Maintenance**: Changes to individual methods affect fewer test files

## Conclusion

This method-focused testing approach provides superior organization, maintainability, and clarity for the Context Memory Store project. By dedicating each test class to a single method, we achieve better test isolation, easier navigation, and more targeted failure reporting.

The structure scales naturally as the codebase grows and provides a consistent, predictable pattern for all developers working on the project.