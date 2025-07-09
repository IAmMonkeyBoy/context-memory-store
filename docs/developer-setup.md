# Developer Setup Guide

This guide provides step-by-step instructions for setting up the Context Memory Store development environment.

## Prerequisites

### Required Software

1. **Git** - For version control
   ```bash
   # Check if installed
   git --version
   ```

2. **.NET 9 SDK** - For .NET development
   ```bash
   # Check if installed
   dotnet --version
   # Should show 9.0.x
   ```
   Download from: https://dotnet.microsoft.com/download/dotnet/9.0

3. **Docker Desktop** - For containerized services
   ```bash
   # Check if installed
   docker --version
   docker-compose --version
   ```
   Download from: https://www.docker.com/products/docker-desktop

### Optional but Recommended

4. **Visual Studio Code** - Lightweight editor
   - Extensions: C# Dev Kit, Docker
   - Download from: https://code.visualstudio.com/

5. **JetBrains Rider** - Full IDE (alternative to VS Code)
   - Download from: https://www.jetbrains.com/rider/

6. **Ollama** - Local LLM service
   ```bash
   # Check if installed
   ollama --version
   ```
   Download from: https://ollama.com/

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/IAmMonkeyBoy/context-memory-store.git
cd context-memory-store
```

### 2. Start Infrastructure Services

```bash
# Start all Docker services
docker-compose up -d

# Check service status
docker-compose ps

# View logs if needed
docker-compose logs -f
```

### 3. Build .NET Solution

```bash
cd src
dotnet restore
dotnet build
```

### 4. Run Tests

```bash
# Run all tests
dotnet test

# Run tests with verbose output
dotnet test --verbosity normal
```

### 5. Start API Development Server

```bash
cd src/ContextMemoryStore.Api
dotnet run
```

The API will be available at:
- **HTTP**: http://localhost:8080
- **Health Check**: http://localhost:8080/health
- **OpenAPI/Swagger**: http://localhost:8080/swagger

## Development Workflow

### Project Structure

```
context-memory-store/
├── src/                                    # .NET solution
│   ├── ContextMemoryStore.sln             # Solution file
│   ├── ContextMemoryStore.Core/            # Domain layer
│   ├── ContextMemoryStore.Infrastructure/  # Data access layer
│   ├── ContextMemoryStore.Api/             # API layer
│   └── ContextMemoryStore.Tests/           # Tests
├── docs/                                   # Documentation
├── config/                                 # Service configurations
├── project/                                # Project data directory
└── docker-compose.yml                     # Docker services
```

### Service Access

Once Docker Compose is running, access services at:

| Service | URL | Purpose |
|---------|-----|---------|
| **API** | http://localhost:8080 | Main REST API |
| **Swagger** | http://localhost:8080/swagger | API documentation |
| **Health** | http://localhost:8080/health | Health check |
| **Qdrant** | http://localhost:6333 | Vector database |
| **Neo4j** | http://localhost:7474 | Graph database |
| **Prometheus** | http://localhost:9090 | Metrics collection |
| **Grafana** | http://localhost:3000 | Monitoring dashboards |

### Testing Approach

The project uses **method-focused testing** with this structure:

```
Tests/
├── Unit/
│   ├── [ClassName]/
│   │   ├── [MethodName]Tests.cs      # One test class per method
│   │   └── [AnotherMethod]Tests.cs   # Focused test scope
│   └── ...
├── Integration/
│   ├── [ClassName]/
│   │   ├── [MethodName]EndpointTests.cs
│   │   └── ...
│   └── ...
└── Common/
    ├── TestBase.cs                   # Base test utilities
    ├── MethodTestBase.cs             # Method-focused testing
    └── IntegrationTestBase.cs        # Integration test setup
```

See [Testing Methodology](testing-methodology.md) for detailed guidance.

## Development Tasks

### Adding New Features

1. **Create branch** for your feature
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow Clean Architecture**
   - Core: Domain entities and interfaces
   - Infrastructure: Service implementations
   - API: Controllers and DTOs
   - Tests: Method-focused test classes

3. **Write tests first** (TDD approach)
   - Create test class in appropriate folder
   - Write failing tests
   - Implement feature
   - Verify tests pass

4. **Update documentation**
   - Add/update relevant docs
   - Update API documentation if needed

### Running Specific Tests

```bash
# Run tests for specific namespace
dotnet test --filter "FullyQualifiedName~ContextMemoryStore.Tests.Unit.Controllers"

# Run tests for specific class
dotnet test --filter "FullyQualifiedName~GetHealthTests"

# Run tests with specific name pattern
dotnet test --filter "Name~WhenHealthy"
```

### Code Quality

```bash
# Format code
dotnet format

# Build in release mode
dotnet build --configuration Release

# Run code analysis (if configured)
dotnet build --verbosity normal
```

## Configuration Management

### Application Settings

The API uses a comprehensive configuration system:

- **Development**: `appsettings.Development.json`
- **Docker**: `appsettings.Docker.json`
- **Testing**: `appsettings.Testing.json`

### Environment Variables

Key environment variables for development:

```bash
# .NET Environment
ASPNETCORE_ENVIRONMENT=Development

# Service URLs
ASPNETCORE_URLS=http://+:8080

# External services (when not using Docker)
ConnectionStrings__Qdrant=http://localhost:6333
ConnectionStrings__Neo4j=bolt://localhost:7687
ConnectionStrings__Ollama=http://localhost:11434/v1
```

### Docker Configuration

Services are configured via Docker Compose:

```bash
# View current configuration
docker-compose config

# Restart specific service
docker-compose restart context-api

# View service logs
docker-compose logs -f context-api
```

## Troubleshooting

### Common Issues

1. **Build Errors**
   ```bash
   # Clean and rebuild
   dotnet clean
   dotnet restore
   dotnet build
   ```

2. **Docker Issues**
   ```bash
   # Stop all services
   docker-compose down
   
   # Remove volumes (data loss!)
   docker-compose down -v
   
   # Rebuild and start
   docker-compose up -d --build
   ```

3. **Port Conflicts**
   - Check if ports 8080, 6333, 7474, 9090, 3000 are available
   - Stop conflicting services or modify docker-compose.yml

4. **Test Failures**
   - Integration tests require Docker services to be running
   - Check service health: `docker-compose ps`
   - Review test logs for specific errors

### Getting Help

1. **Documentation**: Check `docs/` directory for detailed guides
2. **Issues**: Create GitHub issue with reproduction steps
3. **Logs**: Include relevant service logs when reporting issues

### Validation Scripts

The project includes validation scripts:

```bash
# Basic health check
./scripts/health-check.sh

# Comprehensive service validation
./scripts/validate-services.sh

# Full infrastructure testing
./test.sh
```

## Next Steps

Once your environment is set up:

1. **Explore the codebase**: Review the Clean Architecture structure
2. **Run tests**: Ensure all tests pass in your environment
3. **Review documentation**: Read the API design and testing methodology
4. **Start developing**: Follow the established patterns and conventions

## Development Tips

### IDE Setup

**Visual Studio Code**:
- Install C# Dev Kit extension
- Configure launch.json for debugging API
- Use integrated terminal for CLI commands

**JetBrains Rider**:
- Import solution directly
- Configure run configurations for API and tests
- Use built-in Docker integration

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "Your descriptive message"

# Push and create PR
git push -u origin feature/your-feature
# Create PR via GitHub UI
```

### Best Practices

1. **Follow established patterns** in existing code
2. **Write tests first** for new functionality
3. **Keep commits focused** and descriptive
4. **Update documentation** with your changes
5. **Review Clean Architecture** principles

---

*This guide is updated as the development environment evolves.*