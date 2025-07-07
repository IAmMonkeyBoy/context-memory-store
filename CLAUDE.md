# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Context & Memory Management System for AI Coding Agents that provides containerized solutions for managing project-specific context and memory. The system is designed for local research and lab setups with full lifecycle control of context state.

## Architecture

The system uses a microservices architecture with:
- **Vector DB**: Qdrant for semantic memory via vector search
- **Graph DB**: Neo4j for relationship awareness
- **LLM API**: Ollama for both chat and embeddings with OpenAI-compatible interface
- **API Interface**: REST + MCP (Model Context Protocol) support
- **Runtime**: Docker Compose for local deployment
- **Monitoring**: Prometheus + Grafana
- **Persistence**: Git-based snapshots

## Key Components

### Core Services
- Context API (REST/MCP) - Main interface for agents
- Vector store using Qdrant for semantic search
- Graph store using Neo4j for relationship queries
- Ollama LLM API for chat and embeddings

### Data Management
- Each container instance maps 1:1 with a single project
- Memory state is snapshotted to GitHub on stop
- Configuration via `config.yaml`

### Project Structure
```
/project/
├── vector-store.jsonl    # Vector embeddings storage
├── graph.cypher         # Graph relationship data
├── summary.md          # Project summary
├── logs/               # System logs and metrics
├── config.yaml         # Configuration
├── code/              # Source code snapshots
├── memory/            # Memory storage
└── .git/              # Git repository
```

## API Endpoints

### Core Lifecycle
- `POST /start` - Initialize memory engine
- `POST /stop` - Serialize memory and commit to Git
- `GET /context` - Retrieve current memory snapshot
- `POST /ingest` - Ingest new document or artifact
- `GET /metrics` - Prometheus metrics endpoint

### Interface Support
- REST API via `/v1/...` endpoints
- MCP protocol support for structured tool calls
- OpenAI-compatible interface routing to Ollama

## Development Notes

### Configuration
- Default LLM API base: `http://host.docker.internal:11434/v1`
- Default chat model: `llama3`
- Default embedding model: `mxbai-embed-large`
- All services designed to run locally via Docker

### Security Model
- **PROOF OF CONCEPT ONLY**: This system is designed for local development, research, and laboratory environments only
- **NOT FOR PRODUCTION**: No security hardening, authentication, or encryption implemented
- **Default credentials intentionally simple**: Passwords like "contextmemory" are used for convenience in local development
- **No authentication by default**: All services run without authentication for ease of development
- **Services communicate via `host.docker.internal`**: Suitable for local Docker networking only
- **Isolated networks and minimal port exposure**: Basic isolation sufficient for local development

### Monitoring
- Prometheus metrics for memory size, request count, token usage
- Grafana dashboards for visualization
- System logs in `/project/logs/`

## Current State

### ✅ Phase 1 Completed: Project Foundation & Infrastructure Setup
- Complete Docker Compose infrastructure with all required services
- Project directory structure and configuration templates  
- Comprehensive documentation framework in `docs/` directory
- Service configurations for Qdrant, Neo4j, Ollama, Prometheus, Grafana

### 🚧 Next Phase: Service Integration Testing
When Phase 2 is approved, focus on:
1. Infrastructure verification and connectivity testing
2. Service health checks and validation
3. Basic smoke tests for all services

### Implementation Technology
- **Primary Language**: .NET 9 for all application code
- **OpenAI Integration**: Use OpenAI .NET SDK pointing to Ollama (not HttpClient)
- **Git Integration**: External to the store - focus on git-friendly file formats
- **File Formats**: JSONL, Cypher, Markdown, YAML for git compatibility

## Development Workflow

### Git Practices
- Always create a new branch before making changes
- Submit all changes via Pull Requests (PRs)
- Ensure branch names are descriptive of the changes being made
- We should not make changes to files in the main branch. If a change is necessary we should create a branch and then make the change.

### Project Phasing
- Each of the phases should be a discrete set of changes
- Each phase should be committed to GitHub in one or more pull requests
- Do not start on the next phase until I've accepted the current phase
- Do not start on the next phase until all PRs associated with the current phase have been accepted and merged
- Each feature should be documented in a file in the docs folder
- There should be an index that points at all features
- A phase isn't complete until the documentation is up to date

### Documentation Requirements
- All features must be documented in `docs/` directory
- Update `docs/index.md` with each new feature
- Phase completion requires up-to-date documentation