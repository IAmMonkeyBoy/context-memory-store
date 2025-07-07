# Project Layout

This document describes the directory structure and file organization of the Context Memory Store system.

## Repository Structure

```
context-memory-store/
├── README.md                    # Main project documentation
├── CLAUDE.md                    # Claude Code assistant instructions
├── LICENSE                      # MIT License
├── .gitignore                   # Git ignore patterns
├── docker-compose.yml           # Docker services configuration
├── .mcp.json                    # MCP server configuration
├── config/                      # Service configurations
│   ├── qdrant.yaml             # Qdrant vector database config
│   ├── neo4j.conf              # Neo4j graph database config
│   ├── prometheus.yml          # Prometheus metrics config
│   └── grafana/                # Grafana configurations
│       ├── dashboards/         # Dashboard definitions
│       └── datasources/        # Data source configurations
├── docs/                       # Feature documentation
│   ├── index.md               # Documentation index
│   ├── infrastructure.md      # Infrastructure setup
│   ├── configuration.md       # Configuration management
│   └── project-layout.md      # This file
├── project/                    # Project instance data
│   ├── config.yaml            # Project configuration
│   ├── vector-store.jsonl     # Vector embeddings (git-friendly)
│   ├── graph.cypher           # Graph relationships (git-friendly)
│   ├── summary.md             # Project summary
│   ├── logs/                  # System logs
│   │   ├── system.log         # System event log
│   │   └── metrics.json       # Metrics data
│   ├── memory/                # Memory storage
│   │   ├── embeddings/        # Vector embeddings
│   │   ├── summaries/         # Generated summaries
│   │   └── snapshots/         # Memory snapshots
│   └── code/                  # Code snapshots
│       ├── snapshots/         # Timestamped code snapshots
│       ├── summaries/         # Code summaries
│       └── metadata/          # Code metadata
└── src/                       # Source code (future phases)
    ├── ContextMemoryStore.Api/
    ├── ContextMemoryStore.Core/
    ├── ContextMemoryStore.Infrastructure/
    └── tests/
```

## Directory Descriptions

### Root Directory
- **README.md**: Main project documentation and setup instructions
- **CLAUDE.md**: Instructions for Claude Code assistant
- **LICENSE**: MIT License file
- **.gitignore**: Git ignore patterns for the project
- **docker-compose.yml**: Docker services configuration
- **.mcp.json**: Model Context Protocol server configuration

### Configuration Directory (`config/`)
Contains service-specific configuration files:
- **qdrant.yaml**: Qdrant vector database configuration
- **neo4j.conf**: Neo4j graph database configuration
- **prometheus.yml**: Prometheus metrics collection configuration
- **grafana/**: Grafana monitoring configurations
  - **dashboards/**: Dashboard definitions and provisioning
  - **datasources/**: Data source configurations

### Documentation Directory (`docs/`)
Contains feature documentation and guides:
- **index.md**: Main documentation index with feature overview
- **infrastructure.md**: Docker infrastructure setup and management
- **configuration.md**: Configuration management and options
- **project-layout.md**: Directory structure and file organization

### Project Instance Directory (`project/`)
Contains data for a single project instance:

#### Core Files
- **config.yaml**: Project-specific configuration
- **vector-store.jsonl**: Vector embeddings in JSONL format (git-friendly)
- **graph.cypher**: Graph relationships in Cypher format (git-friendly)
- **summary.md**: Auto-generated project summary

#### Logs Directory (`logs/`)
- **system.log**: System events and operations log
- **metrics.json**: Performance and usage metrics

#### Memory Directory (`memory/`)
- **embeddings/**: Vector embeddings and related data
- **summaries/**: Generated summaries and abstracts
- **snapshots/**: Memory state snapshots

#### Code Directory (`code/`)
- **snapshots/**: Timestamped code snapshots
- **summaries/**: Code architecture and change summaries
- **metadata/**: Code metadata and dependency information

### Source Code Directory (`src/`)
Will contain the .NET 9 implementation (future phases):
- **ContextMemoryStore.Api/**: ASP.NET Core Web API
- **ContextMemoryStore.Core/**: Core business logic
- **ContextMemoryStore.Infrastructure/**: Data access and external services
- **tests/**: Unit and integration tests

## File Formats

### Git-Friendly Formats
All data files use git-friendly formats for version control:

- **JSONL**: Vector embeddings (one JSON object per line)
- **Cypher**: Graph relationships (plain text queries)
- **Markdown**: Summaries and documentation
- **YAML**: Configuration files
- **Plain text**: Logs and metadata

### Example Files

#### Vector Store (`vector-store.jsonl`)
```jsonl
{"id": "doc-1", "vector": [0.1, 0.2, 0.3], "metadata": {"source": "file.txt"}}
{"id": "doc-2", "vector": [0.4, 0.5, 0.6], "metadata": {"source": "file.md"}}
```

#### Graph Store (`graph.cypher`)
```cypher
CREATE (d:Document {id: "doc-1", title: "Example Document"})
CREATE (c:Concept {id: "concept-1", name: "Example Concept"})
CREATE (d)-[:CONTAINS]->(c)
```

#### Project Summary (`summary.md`)
```markdown
# Project Summary

## Statistics
- Documents: 150
- Vectors: 1,500
- Relationships: 300

## Recent Activity
- Last ingestion: 2025-07-06T17:00:00Z
- Last query: 2025-07-06T17:05:00Z
```

## Data Flow

1. **Ingestion**: Documents → Processing → Vector Store + Graph Store
2. **Storage**: Memory → Git-friendly files → Version control
3. **Retrieval**: Query → Vector search + Graph traversal → Context assembly
4. **Persistence**: Memory state → Snapshots → Git commits

## Git Integration

The project structure is designed for git integration:

- **Tracked files**: Configuration, data files, summaries
- **Ignored files**: Temporary files, logs, caches
- **Commit strategy**: Automatic commits on memory state changes
- **Branching**: Separate branches for memory snapshots

## File Naming Conventions

- **Configuration**: `config.yaml`, `*.conf`
- **Data**: `*.jsonl`, `*.cypher`
- **Documentation**: `*.md`
- **Logs**: `*.log`, `*.json`
- **Snapshots**: `YYYY-MM-DD_HH-MM-SS_*`

## Backup and Recovery

- **Vector data**: Backed up to `vector-store.jsonl`
- **Graph data**: Backed up to `graph.cypher`
- **Configuration**: Tracked in git
- **Memory state**: Snapshotted on demand
- **Full recovery**: Restore from git + reload into services

## Scalability Considerations

- **Multiple projects**: Each project has its own `project/` directory
- **Large datasets**: Files can be split and compressed
- **Version control**: Git LFS for large binary files
- **Distribution**: Projects can be distributed across instances