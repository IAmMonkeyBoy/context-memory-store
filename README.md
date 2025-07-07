# Context & Memory Management System for AI Coding Agents

This project provides a containerized solution for managing project-specific context and memory in support of AI coding agents. It is designed for local research and lab setups, enabling easy inspection, reproducibility, and full lifecycle control of context state.

Each container instance maps 1:1 with a single project, and provides:
- Semantic memory via vector search
- Relationship awareness via a graph store
- OpenAI-compatible REST API interface for agents (including MCP support)
- GitHub-compatible snapshotting of memory state
- Lightweight monitoring via Prometheus + Grafana

---

## 🧱 Architecture Overview

```
          +-------------------------+
          |     Agent or MCP       |
          +-----------+------------+
                      |
        +-------------▼--------------+
        |    Context API (REST/MCP) |
        +-------------+--------------+
                      |
          +-----------+-----------+
          |                       |
 +-------------------+   +------------------+
 |   Vector DB       |   |   Graph DB       |
 |   (Qdrant)        |   |   (Neo4j)        |
 +-------------------+   +------------------+
          |
 +-------------------+
 |   Ollama LLM API  |  ← both chat + embeddings
 +-------------------+

Monitoring: Prometheus + Grafana
Persistence: Git-based snapshots
Runtime: Docker Compose
```

---

## 🚀 Project Goals

- Simplified context & memory orchestration for LLM agents
- Local-first, containerized execution
- Support for multiple concurrent project instances
- Snapshot on stop → stored to GitHub
- REST & MCP API access
- Modular, inspectable, extensible

---

## 🧰 Technology Decisions

| Component         | Selection             | Rationale / Link |
|------------------|------------------------|------------------|
| **Vector DB**     | [Qdrant](https://qdrant.tech) | High-perf, local, file-based |
| **Graph DB**      | [Neo4j Community](https://neo4j.com/download-center/#community) | Rich relationship queries |
| **LLM + Embedding** | [Ollama](https://ollama.com) | Local models with [OpenAI-compatible API](https://github.com/ollama/ollama/blob/main/docs/openai.md) |
| **Embedding Model** | [mxbai-embed-large](https://ollama.com/library/mxbai-embed-large) | Native Ollama support (768 dimensions) |
| **Chat Model**    | e.g. `llama3` via Ollama | Easy to run, configurable |
| **API Interface** | REST + [MCP](https://github.com/modelcontextprotocol) | Supports external orchestration |
| **Runtime**       | [Docker Compose](https://docs.docker.com/compose/) | Local dev simplicity |
| **Monitoring**    | [Prometheus](https://prometheus.io/) + [Grafana](https://grafana.com/) | Container dashboards |

---

## 🚀 Quick Start

### 1. Clone and Start Infrastructure
```bash
git clone <repository-url>
cd context-memory-store

# Start all services
docker-compose up -d

# Check service status
docker-compose ps
```

### 2. Install and Configure Ollama (External Service)
```bash
# Install Ollama on your host machine
# Visit: https://ollama.com/download

# Start Ollama service
ollama serve

# Pull required models
ollama pull llama3
ollama pull mxbai-embed-large
```

### 3. Access Services
- **Qdrant Web UI**: http://localhost:6333/dashboard
- **Neo4j Browser**: http://localhost:7474 (no authentication required)
- **Grafana Dashboard**: http://localhost:3000 (no authentication required)
- **Prometheus**: http://localhost:9090

### 4. Configure Your Project
Edit `project/config.yaml` to customize settings for your specific project.

## ⚙️ Configuration

Project-specific configuration is defined in `project/config.yaml`:
```yaml
project:
  name: "your-project"
  description: "Your project description"

llm:
  api_base: "http://host.docker.internal:11434/v1"
  chat_model: "llama3"
  embedding_model: "mxbai-embed-large"

vector_store:
  host: "localhost"
  port: 6333
  collection_name: "context-memory"
  backup_path: "/project/vector-store.jsonl"

graph_store:
  uri: "bolt://localhost:7687"
  username: "neo4j"
  password: "contextmemory"
  backup_path: "/project/graph.cypher"
```

For detailed configuration options, see [Configuration Documentation](docs/configuration.md).

---

## 📂 Project Layout

```
/project/
├── vector-store.jsonl
├── graph.cypher
├── summary.md
├── logs/
│   ├── system.log
│   └── metrics.json
├── config.yaml
├── code/
│   └── [source snapshot]
├── memory/
│   ├── embeddings/
│   └── summaries/
└── .git/
```

---

## 🔄 Lifecycle

| Command | Behavior |
|--------|----------|
| `POST /start` | Initialize memory engine |
| `POST /stop`  | Serialize memory, commit to Git |
| `GET /context` | Retrieve current memory snapshot |
| `POST /ingest` | Ingest new document or artifact |
| `GET /metrics` | Prometheus metrics endpoint |

---

## 📡 API Interfaces

### REST
- All endpoints exposed via `/v1/...`
- Embeddings and chat routed through OpenAI-compatible interface to Ollama

### MCP
- Implements `IMcpFunctionProvider`
- Agents can invoke memory tools via structured tool calls

---

## 🛡️ Security

⚠️ **PROOF OF CONCEPT ONLY**: This system intentionally uses insecure configurations for development ease.

- **Local Development Focus**: Designed exclusively for local development and research
- **Authentication Disabled**: All services (Neo4j, Grafana) configured without authentication
- **Unrestricted Access**: APOC procedures and admin privileges enabled for full functionality testing
- **Development Credentials**: Simple, default passwords used where authentication cannot be disabled

**📋 See [SECURITY.md](SECURITY.md) for complete documentation of intentional security decisions.**

🚫 **NOT SUITABLE FOR PRODUCTION** - See SECURITY.md for production migration guidelines.

---

## 📈 Monitoring

Prometheus scrapes internal metrics on memory size, request count, etc. Grafana visualizes memory growth, token usage, and embedding counts.

---

## 🔗 Useful References

- Ollama blog on embeddings: [ollama.com/blog/embedding-models](https://ollama.com/blog/embedding-models)
- Ollama OpenAI API support: [openai.md](https://github.com/ollama/ollama/blob/main/docs/openai.md)
- Qdrant Docker: [hub.docker.com/qdrant](https://hub.docker.com/r/qdrant/qdrant)
- Neo4j Community Docker: [hub.docker.com/neo4j](https://hub.docker.com/_/neo4j)
- Prometheus + Grafana setup: [Grafana docs](https://grafana.com/docs/grafana/latest/installation/docker/)

---

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Documentation Index](docs/index.md)** - Complete feature overview
- **[Infrastructure Setup](docs/infrastructure.md)** - Docker services and configuration
- **[API Design & OpenAPI Specification](docs/api-design.md)** - Complete API design, REST endpoints, MCP protocol integration
- **[Configuration Management](docs/configuration.md)** - Configuration options and examples
- **[Project Layout](docs/project-layout.md)** - Directory structure and file organization
- **[Testing Framework](docs/testing.md)** - Comprehensive testing and validation procedures

## 🔄 Development Status

### ✅ Phase 1: Project Foundation & Infrastructure Setup (Completed)
- Docker Compose with Qdrant, Neo4j, Ollama, Prometheus, Grafana
- Project directory structure and configuration templates
- Comprehensive documentation framework

### ✅ Phase 2: Service Integration Testing & Validation (Completed)
- Enhanced infrastructure testing and validation framework
- Neo4j APOC procedures validation and metrics integration
- Comprehensive service functionality testing with 100% coverage
- Configuration management improvements and consolidation
- Complete documentation and validation procedures

### ✅ Phase 3: API Design & OpenAPI Specification (Completed)
- Complete API design and documentation
- OpenAPI specification for all endpoints
- REST API and MCP protocol integration design
- Implementation roadmap with phased approach
- Local development focused performance targets

### 🚧 Phase 4: .NET 9 Solution Structure (Current)
- .NET 9 project structure and dependencies
- Core, API, and Infrastructure project organization
- Implementation of Phase 3 API design specifications

### 🚧 Upcoming Phases
- Phase 5: Core API Foundation
- Phase 6: OpenAI Integration  
- Phase 7: Vector Storage Integration
- Phase 8: Graph Storage Integration
- Phase 9: Memory Management Services
- Phase 10: Core Lifecycle API Implementation
- Phase 11: MCP Protocol Support (Near-term)
- Phase 12: Prometheus Metrics Integration
- Phase 13: Testing & Quality Assurance

## 📦 Future Enhancements

- Data Format Specifications (Git-friendly file formats)
- Context reflection and auto-summarization
- Model auto-selection or load balancing
- Remote syncing via GitHub Actions
- Web UI for browsing vector/graph memory

---