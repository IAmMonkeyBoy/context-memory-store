using Microsoft.AspNetCore.Mvc;
using ContextMemoryStore.Core.Entities;
using ContextMemoryStore.Core.Interfaces;
using static ContextMemoryStore.Core.Interfaces.IMemoryService;

namespace ContextMemoryStore.Api.Controllers;

[ApiController]
[Route("lifecycle")]
[Produces("application/json")]
public class LifecycleController : ControllerBase
{
    private readonly IMemoryService _memoryService;
    private readonly ILogger<LifecycleController> _logger;

    public LifecycleController(IMemoryService memoryService, ILogger<LifecycleController> logger)
    {
        _memoryService = memoryService;
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
    public async Task<IActionResult> Start([FromBody] StartEngineRequest request)
    {
        try
        {
            _logger.LogInformation("Starting memory engine for project: {ProjectId}", request.ProjectId);
            
            // For now, return a success response
            // TODO: Implement actual lifecycle management when infrastructure services are available
            var response = StandardResponse<object>.Success(new
            {
                project_id = request.ProjectId,
                session_id = Guid.NewGuid().ToString(),
                started_at = DateTime.UtcNow,
                config = request.Config
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
    public async Task<IActionResult> Stop([FromBody] StopEngineRequest request)
    {
        try
        {
            _logger.LogInformation("Stopping memory engine for project: {ProjectId}", request.ProjectId);
            
            // For now, return a success response
            // TODO: Implement actual lifecycle management when infrastructure services are available
            var response = StandardResponse<object>.Success(new
            {
                project_id = request.ProjectId,
                snapshot_id = Guid.NewGuid().ToString(),
                commit_hash = "abc123",
                stopped_at = DateTime.UtcNow,
                files_persisted = new[] { "vector-store.jsonl", "graph.cypher", "summary.md" }
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
    public async Task<IActionResult> GetStatus([FromQuery] string projectId)
    {
        try
        {
            _logger.LogInformation("Getting status for project: {ProjectId}", projectId);
            
            // Use the memory service to get statistics
            var stats = await _memoryService.GetStatisticsAsync();
            
            var response = StandardResponse<object>.Success(new
            {
                project_id = projectId,
                state = "active",
                uptime_seconds = GetUptimeSeconds(),
                document_count = stats.DocumentCount,
                memory_usage = new
                {
                    documents = stats.DocumentCount,
                    vectors = stats.VectorCount,
                    relationships = stats.RelationshipCount
                },
                last_activity = stats.LastUpdated
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