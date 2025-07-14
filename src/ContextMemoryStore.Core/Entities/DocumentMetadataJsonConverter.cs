using System.Text.Json;
using System.Text.Json.Serialization;

namespace ContextMemoryStore.Core.Entities;

/// <summary>
/// Custom JSON converter for DocumentMetadata to handle both dictionary and typed property deserialization
/// </summary>
public class DocumentMetadataJsonConverter : JsonConverter<DocumentMetadata>
{
    public override DocumentMetadata Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var metadata = new DocumentMetadata();
        
        if (reader.TokenType != JsonTokenType.StartObject)
        {
            throw new JsonException("Expected StartObject token");
        }

        while (reader.Read())
        {
            if (reader.TokenType == JsonTokenType.EndObject)
            {
                break;
            }

            if (reader.TokenType != JsonTokenType.PropertyName)
            {
                throw new JsonException("Expected PropertyName token");
            }

            var propertyName = reader.GetString()!;
            reader.Read();

            switch (propertyName.ToLowerInvariant())
            {
                case "title":
                    metadata.Title = reader.GetString();
                    break;
                case "author":
                    metadata.Author = reader.GetString();
                    break;
                case "type":
                    metadata.Type = reader.GetString();
                    break;
                case "tags":
                    if (reader.TokenType == JsonTokenType.StartArray)
                    {
                        var tags = new List<string>();
                        while (reader.Read() && reader.TokenType != JsonTokenType.EndArray)
                        {
                            if (reader.TokenType == JsonTokenType.String)
                            {
                                tags.Add(reader.GetString()!);
                            }
                        }
                        metadata.Tags = tags;
                    }
                    break;
                case "created":
                    if (reader.TokenType == JsonTokenType.String)
                    {
                        if (DateTime.TryParse(reader.GetString(), out var created))
                        {
                            metadata.Created = created;
                        }
                    }
                    break;
                case "modified":
                    if (reader.TokenType == JsonTokenType.String)
                    {
                        if (DateTime.TryParse(reader.GetString(), out var modified))
                        {
                            metadata.Modified = modified;
                        }
                    }
                    break;
                default:
                    // Handle any other properties as generic dictionary entries
                    var value = JsonSerializer.Deserialize<object>(ref reader, options);
                    metadata[propertyName] = value ?? string.Empty;
                    break;
            }
        }

        return metadata;
    }

    public override void Write(Utf8JsonWriter writer, DocumentMetadata value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();

        // Write typed properties
        if (!string.IsNullOrWhiteSpace(value.Title))
        {
            writer.WriteString("title", value.Title);
        }
        if (!string.IsNullOrWhiteSpace(value.Author))
        {
            writer.WriteString("author", value.Author);
        }
        if (!string.IsNullOrWhiteSpace(value.Type))
        {
            writer.WriteString("type", value.Type);
        }
        if (value.Tags.Any())
        {
            writer.WriteStartArray("tags");
            foreach (var tag in value.Tags)
            {
                writer.WriteStringValue(tag);
            }
            writer.WriteEndArray();
        }
        if (value.Created.HasValue)
        {
            writer.WriteString("created", value.Created.Value);
        }
        if (value.Modified.HasValue)
        {
            writer.WriteString("modified", value.Modified.Value);
        }

        // Write any additional dictionary entries
        foreach (var kvp in value)
        {
            if (!IsTypedProperty(kvp.Key))
            {
                writer.WritePropertyName(kvp.Key);
                JsonSerializer.Serialize(writer, kvp.Value, options);
            }
        }

        writer.WriteEndObject();
    }

    private static bool IsTypedProperty(string propertyName)
    {
        return propertyName.ToLowerInvariant() switch
        {
            "title" or "author" or "type" or "tags" or "created" or "modified" => true,
            _ => false
        };
    }
}