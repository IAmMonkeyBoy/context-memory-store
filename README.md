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
| **Embedding Model** | [mxbai-embed-large](https://ollama.com/library/mxbai-embed-large) | Native Ollama support |
| **Chat Model**    | e.g. `llama3` via Ollama | Easy to run, configurable |
| **API Interface** | REST + [MCP](https://github.com/modelcontextprotocol) | Supports external orchestration |
| **Runtime**       | [Docker Compose](https://docs.docker.com/compose/) | Local dev simplicity |
| **Monitoring**    | [Prometheus](https://prometheus.io/) + [Grafana](https://grafana.com/) | Container dashboards |

---

## ⚙️ Deployment

Each project instance is deployed via Docker Compose.

Key config values are defined in `config.yaml`:
```yaml
llm_api_base: http://host.docker.internal:11434/v1
chat_model: llama3
embedding_model: mxbai-embed-large
vector_store_path: /project/vector-store.jsonl
graph_store_path: /project/graph.cypher
```

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

- **Local Development Focus**: This system is designed for local development and research use only
- No authentication by default (suitable for local-only deployment)
- Ollama + services assumed to be local (`host.docker.internal`)
- Minimized blast radius via port binding and isolated networks
- For guidance on enabling authentication, refer to the [Authentication Setup Documentation](#).

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

## 📦 Future Enhancements (Optional)

- Context reflection and auto-summarization
- Model auto-selection or load balancing
- Remote syncing via GitHub Actions
- Web UI for browsing vector/graph memory

---