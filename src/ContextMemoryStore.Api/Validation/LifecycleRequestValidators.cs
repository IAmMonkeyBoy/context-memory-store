using FluentValidation;
using static ContextMemoryStore.Api.Controllers.LifecycleController;

namespace ContextMemoryStore.Api.Validation;

/// <summary>
/// Validator for StartEngineRequest
/// </summary>
public class StartEngineRequestValidator : AbstractValidator<StartEngineRequest>
{
    public StartEngineRequestValidator()
    {
        RuleFor(x => x.ProjectId)
            .NotEmpty()
            .WithMessage("ProjectId is required")
            .Length(1, 100)
            .WithMessage("ProjectId must be between 1 and 100 characters")
            .Matches("^[a-zA-Z0-9-_]+$")
            .WithMessage("ProjectId can only contain alphanumeric characters, hyphens, and underscores");
    }
}

/// <summary>
/// Validator for StopEngineRequest
/// </summary>
public class StopEngineRequestValidator : AbstractValidator<StopEngineRequest>
{
    public StopEngineRequestValidator()
    {
        RuleFor(x => x.ProjectId)
            .NotEmpty()
            .WithMessage("ProjectId is required")
            .Length(1, 100)
            .WithMessage("ProjectId must be between 1 and 100 characters")
            .Matches("^[a-zA-Z0-9-_]+$")
            .WithMessage("ProjectId can only contain alphanumeric characters, hyphens, and underscores");

        RuleFor(x => x.CommitMessage)
            .MaximumLength(500)
            .WithMessage("CommitMessage cannot exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.CommitMessage));
    }
}