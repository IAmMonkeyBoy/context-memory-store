using System.Net;
using System.Text.Json;
using ContextMemoryStore.Core.Entities;
using ContextMemoryStore.Core.Exceptions;

namespace ContextMemoryStore.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        var response = CreateErrorResponse(exception);
        var statusCode = GetStatusCode(exception);
        
        context.Response.StatusCode = statusCode;
        
        var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        
        await context.Response.WriteAsync(jsonResponse);
    }

    private StandardResponse<object> CreateErrorResponse(Exception exception)
    {
        var requestId = Guid.NewGuid().ToString();
        var timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

        return exception switch
        {
            MemoryStoreException memoryEx => StandardResponse<object>.CreateError(
                memoryEx.ErrorCode,
                memoryEx.Message,
                memoryEx.Details,
                requestId,
                timestamp
            ),
            ArgumentNullException nullEx => StandardResponse<object>.CreateError(
                "INVALID_REQUEST",
                "Required parameter is missing",
                new { parameter = nullEx.ParamName },
                requestId,
                timestamp
            ),
            ArgumentException argEx => StandardResponse<object>.CreateError(
                "INVALID_ARGUMENT",
                argEx.Message,
                new { parameter = argEx.ParamName },
                requestId,
                timestamp
            ),
            UnauthorizedAccessException => StandardResponse<object>.CreateError(
                "UNAUTHORIZED",
                "Access denied",
                null,
                requestId,
                timestamp
            ),
            NotImplementedException => StandardResponse<object>.CreateError(
                "NOT_IMPLEMENTED",
                "Feature not yet implemented",
                null,
                requestId,
                timestamp
            ),
            TimeoutException => StandardResponse<object>.CreateError(
                "TIMEOUT",
                "Request timeout",
                null,
                requestId,
                timestamp
            ),
            _ => StandardResponse<object>.CreateError(
                "INTERNAL_ERROR",
                "An unexpected error occurred",
                null,
                requestId,
                timestamp
            )
        };
    }

    private int GetStatusCode(Exception exception)
    {
        return exception switch
        {
            MemoryStoreException memoryEx => memoryEx.StatusCode,
            ArgumentNullException => (int)HttpStatusCode.BadRequest,
            ArgumentException => (int)HttpStatusCode.BadRequest,
            UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
            NotImplementedException => (int)HttpStatusCode.NotImplemented,
            TimeoutException => (int)HttpStatusCode.RequestTimeout,
            _ => (int)HttpStatusCode.InternalServerError
        };
    }
}