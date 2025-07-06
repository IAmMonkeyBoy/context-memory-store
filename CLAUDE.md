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
- No authentication by default (local development focused)
- Services communicate via `host.docker.internal`
- Isolated networks and minimal port exposure

### Monitoring
- Prometheus metrics for memory size, request count, token usage
- Grafana dashboards for visualization
- System logs in `/project/logs/`

## Current State

This appears to be a specification/design document repository with:
- Comprehensive README.md with full system architecture
- MIT License
- No implementation code yet (early stage project)

When implementing this system, focus on:
1. Docker Compose setup for service orchestration
2. REST API implementation with OpenAI-compatible endpoints
3. Integration with Qdrant, Neo4j, and Ollama
4. MCP protocol support for agent integration
5. Git-based state persistence and snapshotting