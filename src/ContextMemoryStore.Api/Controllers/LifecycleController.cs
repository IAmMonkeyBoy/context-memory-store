using Microsoft.AspNetCore.Mvc;
using ContextMemoryStore.Core.Entities;
using ContextMemoryStore.Core.Interfaces;
using FluentValidation;
using static ContextMemoryStore.Core.Interfaces.IMemoryService;

namespace ContextMemoryStore.Api.Controllers;

[ApiController]
[Route("lifecycle")]
[Produces("application/json")]
public class LifecycleController : ControllerBase
{
    private readonly IMemoryService _memoryService;
    private readonly ILifecycleService _lifecycleService;
    private readonly IValidator<StartEngineRequest> _startRequestValidator;
    private readonly IValidator<StopEngineRequest> _stopRequestValidator;
    private readonly ILogger<LifecycleController> _logger;

    public LifecycleController(
        IMemoryService memoryService,
        ILifecycleService lifecycleService,
        IValidator<StartEngineRequest> startRequestValidator,
        IValidator<StopEngineRequest> stopRequestValidator,
        ILogger<LifecycleController> logger)
    {
        _memoryService = memoryService;
        _lifecycleService = lifecycleService;
        _startRequestValidator = startRequestValidator;
        _stopRequestValidator = stopRequestValidator;
        _logger = logger;
    }

    /// <summary>
    /// Initialize the memory engine for a project
    /// </summary>
    /// <param name="request">Project initialization request</param>
    /// <returns>Memory engine initialization response</returns>
    [HttpPost("start")]
    [ProducesResponseType(typeof(StandardResponse<object>), 200)]
    [ProducesResponseType(typeof(StandardResponse<object>), 400)]
    [ProducesResponseType(typeof(StandardResponse<object>), 500)]
    public async Task<IActionResult> Start([FromBody] StartEngineRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            // Validate request
            var validationResult = await _startRequestValidator.ValidateAsync(request, cancellationToken);
            if (!validationResult.IsValid)
            {
                var validationResponse = StandardResponse<object>.CreateError(
                    "VALIDATION_ERROR",
                    "Request validation failed",
                    validationResult.Errors.Select(e => new { field = e.PropertyName, error = e.ErrorMessage })
                );
                return BadRequest(validationResponse);
            }

            _logger.LogInformation("Starting memory engine for project: {ProjectId}", request.ProjectId);
            
            var result = await _lifecycleService.StartEngineAsync(request.ProjectId, request.Config, cancellationToken);
            
            if (!result.Success)
            {
                var errorResponse = StandardResponse<object>.CreateError(
                    "STARTUP_FAILED",
                    result.ErrorMessage ?? "Failed to start memory engine",
                    new { project_id = request.ProjectId }
                );
                return StatusCode(500, errorResponse);
            }

            var response = StandardResponse<object>.Success(new
            {
                project_id = result.ProjectId,
                session_id = result.SessionId,
                started_at = result.Timestamp,
                config = request.Config,
                metadata = result.Metadata
            });

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting memory engine for project: {ProjectId}", request.ProjectId);
            
            var errorResponse = StandardResponse<object>.CreateError(
                "INTERNAL_ERROR",
                "Failed to start memory engine",
                new { project_id = request.ProjectId }
            );

            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Serialize memory state and commit to Git
    /// </summary>
    /// <param name="request">Memory engine stop request</param>
    /// <returns>Memory engine stop response</returns>
    [HttpPost("stop")]
    [ProducesResponseType(typeof(StandardResponse<object>), 200)]
    [ProducesResponseType(typeof(StandardResponse<object>), 400)]
    [ProducesResponseType(typeof(StandardResponse<object>), 500)]
    public async Task<IActionResult> Stop([FromBody] StopEngineRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            // Validate request
            var validationResult = await _stopRequestValidator.ValidateAsync(request, cancellationToken);
            if (!validationResult.IsValid)
            {
                var validationResponse = StandardResponse<object>.CreateError(
                    "VALIDATION_ERROR",
                    "Request validation failed",
                    validationResult.Errors.Select(e => new { field = e.PropertyName, error = e.ErrorMessage })
                );
                return BadRequest(validationResponse);
            }

            _logger.LogInformation("Stopping memory engine for project: {ProjectId}", request.ProjectId);
            
            var result = await _lifecycleService.StopEngineAsync(request.ProjectId, request.CommitMessage, cancellationToken);
            
            if (!result.Success)
            {
                var errorResponse = StandardResponse<object>.CreateError(
                    "SHUTDOWN_FAILED",
                    result.ErrorMessage ?? "Failed to stop memory engine",
                    new { project_id = request.ProjectId }
                );
                return StatusCode(500, errorResponse);
            }

            var response = StandardResponse<object>.Success(new
            {
                project_id = result.ProjectId,
                snapshot_id = result.SessionId,
                commit_hash = result.CommitHash,
                stopped_at = result.Timestamp,
                files_persisted = result.FilesPersisted.ToArray(),
                metadata = result.Metadata
            });

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error stopping memory engine for project: {ProjectId}", request.ProjectId);
            
            var errorResponse = StandardResponse<object>.CreateError(
                "INTERNAL_ERROR",
                "Failed to stop memory engine",
                new { project_id = request.ProjectId }
            );

            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Check current memory engine status
    /// </summary>
    /// <param name="projectId">Project identifier</param>
    /// <returns>Memory engine status</returns>
    [HttpGet("status")]
    [ProducesResponseType(typeof(StandardResponse<object>), 200)]
    [ProducesResponseType(typeof(StandardResponse<object>), 404)]
    [ProducesResponseType(typeof(StandardResponse<object>), 500)]
    public async Task<IActionResult> GetStatus([FromQuery] string projectId, CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(projectId))
            {
                var badRequestResponse = StandardResponse<object>.CreateError(
                    "INVALID_PROJECT_ID",
                    "Project ID is required",
                    new { parameter = "projectId", expected = "non-empty string", received = "null" }
                );
                return BadRequest(badRequestResponse);
            }

            _logger.LogInformation("Getting status for project: {ProjectId}", projectId);
            
            var systemStatus = await _lifecycleService.GetStatusAsync(projectId, cancellationToken);
            
            var response = StandardResponse<object>.Success(new
            {
                project_id = systemStatus.ProjectId,
                state = systemStatus.State,
                uptime_seconds = systemStatus.UptimeSeconds,
                memory_usage = new
                {
                    documents = systemStatus.MemoryUsage.Documents,
                    vectors = systemStatus.MemoryUsage.Vectors,
                    relationships = systemStatus.MemoryUsage.Relationships
                },
                last_activity = systemStatus.LastActivity,
                service_health = systemStatus.ServiceHealth
            });

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting status for project: {ProjectId}", projectId);
            
            var errorResponse = StandardResponse<object>.CreateError(
                "INTERNAL_ERROR",
                "Failed to get memory engine status",
                new { project_id = projectId }
            );

            return StatusCode(500, errorResponse);
        }
    }

    private long GetUptimeSeconds()
    {
        return (long)(DateTime.UtcNow - System.Diagnostics.Process.GetCurrentProcess().StartTime.ToUniversalTime()).TotalSeconds;
    }

    public class StartEngineRequest
    {
        public string ProjectId { get; set; } = string.Empty;
        public Dictionary<string, object>? Config { get; set; }
    }

    public class StopEngineRequest
    {
        public string ProjectId { get; set; } = string.Empty;
        public string? CommitMessage { get; set; }
    }
}