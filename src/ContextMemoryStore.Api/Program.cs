using ContextMemoryStore.Core.Interfaces;
using ContextMemoryStore.Infrastructure.Extensions;
using ContextMemoryStore.Api.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

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

// Add Health Checks
builder.Services.AddHealthChecks();

// Add CORS for web clients
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

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
app.UseCors();

// Add global exception handling
app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseRouting();

app.MapControllers();

// Health check endpoints
app.MapHealthChecks("/health");
app.MapHealthChecks("/v1/health");

app.Run();
