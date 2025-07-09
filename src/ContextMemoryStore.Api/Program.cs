using ContextMemoryStore.Core.Interfaces;
using ContextMemoryStore.Infrastructure.Extensions;
using ContextMemoryStore.Infrastructure.Configuration;
using ContextMemoryStore.Api.Middleware;
using FluentValidation;
using Prometheus;
using Serilog;
using Serilog.Events;
using Serilog.Formatting.Compact;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithEnvironmentName()
    .Enrich.WithMachineName()
    .Enrich.WithProcessId()
    .Enrich.WithThreadId()
    .CreateLogger();

// Add Serilog to the builder
builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Add FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Configure OpenAPI/Swagger
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Info = new()
        {
            Title = "Context Memory Store API",
            Description = "API for managing context and memory in AI coding agent systems",
            Version = "1.0.0",
            Contact = new()
            {
                Name = "Context Memory Store",
                Url = new Uri("https://github.com/IAmMonkeyBoy/context-memory-store")
            },
            License = new()
            {
                Name = "MIT",
                Url = new Uri("https://opensource.org/licenses/MIT")
            }
        };
        
        document.Servers = new List<Microsoft.OpenApi.Models.OpenApiServer>
        {
            new() { Url = "http://localhost:8080/v1", Description = "Local development server" }
        };
        
        return Task.CompletedTask;
    });
});

// Add Infrastructure services
builder.Services.AddInfrastructureServices(builder.Configuration);

// Configure options validation
builder.Services.AddOptions<ApiOptions>()
    .BindConfiguration(ApiOptions.SectionName)
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddOptions<QdrantOptions>()
    .BindConfiguration(QdrantOptions.SectionName)
    .ValidateOnStart();

builder.Services.AddOptions<Neo4jOptions>()
    .BindConfiguration(Neo4jOptions.SectionName)
    .ValidateOnStart();

builder.Services.AddOptions<OllamaOptions>()
    .BindConfiguration(OllamaOptions.SectionName)
    .ValidateOnStart();

// Add Health Checks
builder.Services.AddHealthChecks();

// Configure CORS based on settings
var apiOptions = builder.Configuration.GetSection(ApiOptions.SectionName).Get<ApiOptions>() ?? new ApiOptions();
if (apiOptions.CorsEnabled)
{
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
    });
}

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "Context Memory Store API v1");
        options.RoutePrefix = "swagger";
    });
}

// API versioning - all controllers will be under /v1
app.UsePathBase("/v1");

app.UseHttpsRedirection();

// Use CORS if enabled
if (apiOptions.CorsEnabled)
{
    app.UseCors();
}

// Add Phase 5 Step 3 monitoring middleware
app.UseCorrelationId();
app.UsePerformanceMonitoring();

// Add global exception handling
app.UseMiddleware<GlobalExceptionMiddleware>();

// Add Prometheus metrics middleware
app.UseMetricServer();
app.UseHttpMetrics();

app.UseRouting();

app.MapControllers();

// Health check endpoints
app.MapHealthChecks("/health");
app.MapHealthChecks("/v1/health");

try
{
    Log.Information("Starting Context Memory Store API");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

/// <summary>
/// Program class for integration testing
/// </summary>
public partial class Program { }
