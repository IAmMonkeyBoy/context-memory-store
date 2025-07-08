using Bogus;
using ContextMemoryStore.Core.Entities;
using ContextMemoryStore.Core.ValueObjects;

namespace ContextMemoryStore.Tests.Fixtures;

/// <summary>
/// Test data fixture for generating Document entities
/// </summary>
public static class DocumentFixture
{
    private static readonly Faker<Document> DocumentFaker = new Faker<Document>()
        .RuleFor(d => d.Id, f => Guid.NewGuid().ToString())
        .RuleFor(d => d.Content, f => f.Lorem.Paragraphs(2, 4))
        .RuleFor(d => d.Source, f => new DocumentSource 
        { 
            Type = f.PickRandom("file", "url", "text"),
            Path = f.Internet.Url(),
            Modified = f.Date.Recent()
        })
        .RuleFor(d => d.Metadata, f => new DocumentMetadata
        {
            Author = f.Name.FullName(),
            Created = f.Date.Recent(),
            Type = f.PickRandom("code", "documentation", "config", "test"),
            Tags = f.Lorem.Words(3).ToList(),
            Modified = f.Date.Recent()
        })
        .RuleFor(d => d.Processing, f => new DocumentProcessing
        {
            Status = f.PickRandom("pending", "processing", "completed", "failed"),
            Chunks = f.Random.Int(1, 10),
            Relationships = f.Random.Int(0, 20),
            Summary = f.Random.Bool(0.8f) ? f.Lorem.Sentence() : null
        });

    /// <summary>
    /// Generate a single document with random data
    /// </summary>
    public static Document Generate() => DocumentFaker.Generate();

    /// <summary>
    /// Generate multiple documents with random data
    /// </summary>
    public static List<Document> Generate(int count) => DocumentFaker.Generate(count);

    /// <summary>
    /// Generate a document with specific properties
    /// </summary>
    public static Document Generate(Action<Document> configure)
    {
        var document = Generate();
        configure(document);
        return document;
    }

    /// <summary>
    /// Create a builder for more control over document generation
    /// </summary>
    public static DocumentBuilder Builder() => new();
}

/// <summary>
/// Builder pattern for creating test documents with specific properties
/// </summary>
public class DocumentBuilder
{
    private string? _id;
    private string? _content;
    private DocumentSource? _source;
    private DocumentMetadata? _metadata;
    private DocumentProcessing? _processing;

    public DocumentBuilder WithId(string id)
    {
        _id = id;
        return this;
    }


    public DocumentBuilder WithContent(string content)
    {
        _content = content;
        return this;
    }

    public DocumentBuilder WithSource(DocumentSource source)
    {
        _source = source;
        return this;
    }

    public DocumentBuilder WithMetadata(DocumentMetadata metadata)
    {
        _metadata = metadata;
        return this;
    }

    public DocumentBuilder WithProcessing(DocumentProcessing processing)
    {
        _processing = processing;
        return this;
    }

    public DocumentBuilder WithProcessingStatus(ProcessingStatus status)
    {
        _processing ??= new DocumentProcessing();
        _processing.Status = status;
        return this;
    }

    public Document Build()
    {
        var document = DocumentFixture.Generate();
        
        if (_id != null) document.Id = _id;
        if (_content != null) document.Content = _content;
        if (_source != null) document.Source = _source;
        if (_metadata != null) document.Metadata = _metadata;
        if (_processing != null) document.Processing = _processing;

        return document;
    }
}