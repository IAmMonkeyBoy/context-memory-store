# Context Memory Store API - Dockerfile
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution file and project files
COPY ContextMemoryStore.sln .
COPY ContextMemoryStore.Core/ContextMemoryStore.Core.csproj ContextMemoryStore.Core/
COPY ContextMemoryStore.Infrastructure/ContextMemoryStore.Infrastructure.csproj ContextMemoryStore.Infrastructure/
COPY ContextMemoryStore.Api/ContextMemoryStore.Api.csproj ContextMemoryStore.Api/
COPY ContextMemoryStore.Tests/ContextMemoryStore.Tests.csproj ContextMemoryStore.Tests/

# Restore dependencies
RUN dotnet restore

# Copy source code
COPY . .

# Build the application
WORKDIR /src/ContextMemoryStore.Api
RUN dotnet build -c Release -o /app/build

# Publish the application including static files
RUN dotnet publish -c Release -o /app/publish --verbosity normal

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create directory for project data
RUN mkdir -p /app/project/logs

# Copy published application (should include wwwroot if present during publish)
COPY --from=build /app/publish .

# Also explicitly copy static files if they exist
COPY --from=build /src/ContextMemoryStore.Api/wwwroot /app/wwwroot

# Set environment variables
ENV ASPNETCORE_ENVIRONMENT=Docker
ENV ASPNETCORE_URLS=http://+:8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:8080/health || exit 1

# Run the application
ENTRYPOINT ["dotnet", "ContextMemoryStore.Api.dll"]