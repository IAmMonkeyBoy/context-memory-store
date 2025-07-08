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

# Publish the application
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Create directory for project data
RUN mkdir -p /app/project/logs

# Copy published application
COPY --from=build /app/publish .

# Set environment variables
ENV ASPNETCORE_ENVIRONMENT=Docker
ENV ASPNETCORE_URLS=http://+:8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run the application
ENTRYPOINT ["dotnet", "ContextMemoryStore.Api.dll"]