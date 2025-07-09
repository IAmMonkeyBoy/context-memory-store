using FluentValidation;
using ContextMemoryStore.Core.Entities;
using static ContextMemoryStore.Api.Controllers.MemoryController;

namespace ContextMemoryStore.Api.Validation;

/// <summary>
/// Validator for IngestDocumentsRequest
/// </summary>
public class IngestDocumentsRequestValidator : AbstractValidator<IngestDocumentsRequest>
{
    public IngestDocumentsRequestValidator()
    {
        RuleFor(x => x.Documents)
            .NotNull()
            .WithMessage("Documents list is required")
            .NotEmpty()
            .WithMessage("At least one document is required")
            .Must(docs => docs?.Count <= 100)
            .WithMessage("Maximum 100 documents allowed per batch");

        RuleForEach(x => x.Documents)
            .SetValidator(new DocumentValidator());

        RuleFor(x => x.Options)
            .SetValidator(new IngestOptionsValidator()!)
            .When(x => x.Options != null);
    }
}

/// <summary>
/// Validator for Document entities
/// </summary>
public class DocumentValidator : AbstractValidator<Document>
{
    public DocumentValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Document ID is required")
            .Length(1, 100)
            .WithMessage("Document ID must be between 1 and 100 characters");

        RuleFor(x => x.Content)
            .NotEmpty()
            .WithMessage("Document content is required")
            .Length(1, 50 * 1024 * 1024) // 50MB max
            .WithMessage("Document content cannot exceed 50MB");

        RuleFor(x => x.Source)
            .NotNull()
            .WithMessage("Document source is required")
            .SetValidator(new DocumentSourceValidator());

        RuleFor(x => x.Metadata)
            .NotNull()
            .WithMessage("Document metadata is required")
            .SetValidator(new DocumentMetadataValidator());
    }
}

/// <summary>
/// Validator for DocumentSource
/// </summary>
public class DocumentSourceValidator : AbstractValidator<DocumentSource>
{
    public DocumentSourceValidator()
    {
        RuleFor(x => x.Type)
            .NotEmpty()
            .WithMessage("Source type is required")
            .Must(type => new[] { "file", "url", "text", "api" }.Contains(type?.ToLowerInvariant()))
            .WithMessage("Source type must be one of: file, url, text, api");

        RuleFor(x => x.Path)
            .NotEmpty()
            .WithMessage("Source path is required")
            .Length(1, 500)
            .WithMessage("Source path must be between 1 and 500 characters");
    }
}

/// <summary>
/// Validator for DocumentMetadata
/// </summary>
public class DocumentMetadataValidator : AbstractValidator<DocumentMetadata>
{
    public DocumentMetadataValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .WithMessage("Document title is required")
            .Length(1, 200)
            .WithMessage("Document title must be between 1 and 200 characters");

        RuleFor(x => x.Type)
            .NotEmpty()
            .WithMessage("Document type is required")
            .Length(1, 50)
            .WithMessage("Document type must be between 1 and 50 characters");

        RuleFor(x => x.Tags)
            .Must(tags => tags.Count <= 20)
            .WithMessage("Maximum 20 tags allowed per document")
            .When(x => x.Tags != null);

        RuleForEach(x => x.Tags)
            .Length(1, 50)
            .WithMessage("Each tag must be between 1 and 50 characters")
            .When(x => x.Tags != null);
    }
}

/// <summary>
/// Validator for IngestOptions
/// </summary>
public class IngestOptionsValidator : AbstractValidator<IngestOptions>
{
    public IngestOptionsValidator()
    {
        RuleFor(x => x.ChunkSize)
            .GreaterThan(100)
            .WithMessage("Chunk size must be greater than 100")
            .LessThanOrEqualTo(10000)
            .WithMessage("Chunk size cannot exceed 10,000 characters");
    }
}

/// <summary>
/// Validator for context retrieval query parameters
/// </summary>
public class ContextQueryValidator : AbstractValidator<ContextQueryRequest>
{
    public ContextQueryValidator()
    {
        RuleFor(x => x.Query)
            .NotEmpty()
            .WithMessage("Query is required")
            .Length(1, 1000)
            .WithMessage("Query must be between 1 and 1000 characters");

        RuleFor(x => x.Limit)
            .GreaterThan(0)
            .WithMessage("Limit must be greater than 0")
            .LessThanOrEqualTo(100)
            .WithMessage("Limit cannot exceed 100");

        RuleFor(x => x.MinScore)
            .GreaterThanOrEqualTo(0.0)
            .WithMessage("MinScore must be greater than or equal to 0.0")
            .LessThanOrEqualTo(1.0)
            .WithMessage("MinScore cannot exceed 1.0");
    }
}

/// <summary>
/// Validator for search query parameters
/// </summary>
public class SearchQueryValidator : AbstractValidator<SearchQueryRequest>
{
    public SearchQueryValidator()
    {
        RuleFor(x => x.Query)
            .NotEmpty()
            .WithMessage("Query is required")
            .Length(1, 1000)
            .WithMessage("Query must be between 1 and 1000 characters");

        RuleFor(x => x.Limit)
            .GreaterThan(0)
            .WithMessage("Limit must be greater than 0")
            .LessThanOrEqualTo(100)
            .WithMessage("Limit cannot exceed 100");

        RuleFor(x => x.Offset)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Offset must be greater than or equal to 0");

        RuleFor(x => x.Sort)
            .Must(sort => new[] { "relevance", "date", "title" }.Contains(sort?.ToLowerInvariant()))
            .WithMessage("Sort must be one of: relevance, date, title")
            .When(x => !string.IsNullOrEmpty(x.Sort));
    }
}

/// <summary>
/// Request model for context queries
/// </summary>
public class ContextQueryRequest
{
    public string Query { get; set; } = string.Empty;
    public int Limit { get; set; } = 10;
    public bool IncludeRelationships { get; set; } = false;
    public double MinScore { get; set; } = 0.5;
}

/// <summary>
/// Request model for search queries
/// </summary>
public class SearchQueryRequest
{
    public string Query { get; set; } = string.Empty;
    public int Limit { get; set; } = 10;
    public int Offset { get; set; } = 0;
    public string? Filter { get; set; }
    public string Sort { get; set; } = "relevance";
}