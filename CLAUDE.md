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
- Default embedding model: `mxbai-embed-large` (1024 dimensions)
- All services designed to run locally via Docker
- Neo4j with APOC plugin for extended graph procedures
- External Ollama service architecture (not containerized)

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

### Testing Framework
- Comprehensive testing infrastructure with multiple validation levels
- Scripts: `test.sh`, `scripts/health-check.sh`, `scripts/validate-services.sh`, `scripts/comprehensive-service-tests.sh`
- Documentation in `docs/testing.md`, `docs/comprehensive-testing.md`, `docs/service-validation.md`
- 100% functional test coverage achieved

### API Design & Documentation
- Complete API design specification in `docs/api-design.md`
- Dual-interface architecture: REST API + MCP protocol support
- OpenAPI 3.0 specification for all endpoints
- Implementation roadmap with phased approach
- Local development focus with realistic performance targets

## Current State

### ✅ Phase 1 Completed: Project Foundation & Infrastructure Setup
- Complete Docker Compose infrastructure with all required services
- Project directory structure and configuration templates  
- Comprehensive documentation framework in `docs/` directory
- Service configurations for Qdrant, Neo4j, Ollama, Prometheus, Grafana

### ✅ Phase 2 Completed: Service Integration Testing & Validation
- Enhanced infrastructure testing and validation framework (Issue #16)
- Neo4j APOC procedures validation and metrics integration (Issue #17)  
- Comprehensive service functionality testing with 100% coverage (Issue #18)
- Configuration management improvements and consolidation (Issue #19)
- Complete documentation and validation procedures (Issue #20)

**Phase 2 Achievements:**
- Complete testing framework with 4 validation levels
- 436+ APOC procedures validated and working
- 100% functional test coverage across all services
- Comprehensive troubleshooting and diagnostic procedures
- Service validation workflows documented for future phases
- Configuration management consolidated and documented

### ✅ Phase 3 Completed: API Design & OpenAPI Specification
- Complete API design and documentation (Issue #36)
- OpenAPI specification for all REST endpoints
- REST API and MCP protocol integration design
- Implementation roadmap with clear phase boundaries
- Dual-interface architecture (REST + MCP) specification

**Phase 3 Achievements:**
- Comprehensive API design documentation in `docs/api-design.md`
- Core REST API endpoints specified for Phase 4 implementation
- MCP protocol integration moved to near-term roadmap (Phase 4-6)
- Performance targets adjusted for local development environment
- Clear separation of immediate scope vs future enhancements
- OpenAPI 3.0 specification structure defined

### ✅ Phase 4 Completed: .NET 9 Solution Structure
- Complete .NET 9 project structure and dependencies (Issues #42, #43)
- Core, API, and Infrastructure project organization with Clean Architecture
- Domain entities and interfaces implementation (Issue #44)
- Docker integration and configuration setup (Issue #45)
- Comprehensive configuration management system (Issue #46)
- Method-focused testing infrastructure and health checks (Issue #47)
- Issue triage and blocking assessment completed (Issue #48)
- Phase completion documentation and validation (Issue #49)

**Phase 4 Achievements:**
- Complete .NET 9 solution with Clean Architecture pattern
- Comprehensive configuration system with validation
- Method-focused testing infrastructure with 60+ tests
- Docker Compose integration with .NET API service
- Health monitoring and diagnostic endpoints
- Issue triage confirming no blocking issues for Phase 5
- Documentation of testing methodology and known limitations

### ✅ Phase 5 Completed: Core API Foundation
Phase 5 has been successfully completed with all objectives achieved:
1. ✅ Implementation of core REST API endpoints
2. ✅ Health check and lifecycle endpoint functionality
3. ✅ Configuration and metrics endpoints
4. ✅ Integration with existing service interfaces
5. ✅ API versioning and OpenAPI documentation
6. ✅ Comprehensive integration testing framework (85% success rate)
7. ✅ Performance benchmarking and system validation
8. ✅ Complete documentation and final validation
9. ✅ Phase 6 preparation and transition materials

**Phase 5 Achievements:**
- Complete .NET 9 API implementation with clean architecture
- Advanced health monitoring with caching, scoring, and trend analysis
- Comprehensive metrics collection and Prometheus integration
- Integration testing framework with Testcontainers
- 100% unit test coverage (31/31 tests passing)
- 85% integration test success rate under comprehensive scenarios
- Performance and load testing capabilities
- Complete documentation and troubleshooting guides

### ✅ Phase 6 Completed: Enhanced Ollama Integration
Phase 6 has been successfully completed with all objectives achieved:
1. ✅ Enhanced OllamaLLMService with OpenAI .NET SDK v2.2.0
2. ✅ Streaming chat completion support with IAsyncEnumerable patterns
3. ✅ Advanced resilience patterns (Polly retry policies, circuit breaker)
4. ✅ Real-time streaming analysis endpoint with Server-Sent Events
5. ✅ Performance optimizations (connection pooling, batch processing, caching)
6. ✅ Comprehensive error handling and observability improvements

**Phase 6 Achievements:**
- Complete LLM service redesign with streaming capabilities
- Server-Sent Events implementation for real-time analysis
- Polly-based resilience patterns with exponential backoff
- Advanced caching and connection pooling optimizations
- Enhanced HTTP client configuration with lifetime management
- 100% unit test coverage maintained (31/31 tests passing)
- Performance improvements: 80% reduction in API calls via batch processing
- Complete documentation and troubleshooting guides

### 🔄 Phase 7: Web User Interface Development (In Progress)
Phase 7 focuses on creating a comprehensive web-based user interface that provides complete system management and monitoring capabilities.

**Phase 7 Objectives:**
1. **Frontend Infrastructure & Basic Layout** (Issues #79-82)
   - React 18 + TypeScript + Vite setup with Material-UI
   - .NET API static file serving integration
   - TypeScript API client generation from OpenAPI
   - Application shell with responsive navigation

2. **System Monitoring Dashboard** (Issues #83-86)
   - Real-time health status dashboard with service monitoring
   - Prometheus metrics visualization with interactive charts
   - Comprehensive diagnostics interface with troubleshooting
   - Server-Sent Events integration for live updates

3. **Memory & Document Management** (Issues #87-90)
   - Document upload interface with drag-and-drop batch processing
   - Advanced search and document browser with semantic filtering
   - Context retrieval and relationship visualization
   - Memory analytics dashboard with usage insights

4. **Advanced Features & Real-time Analysis** (Issues #91-94)
   - Streaming analysis interface with SSE integration
   - Project lifecycle management with configuration control
   - Advanced configuration management system
   - Performance optimization and monitoring interface

5. **Documentation, Testing & Deployment** (Issues #95-98)
   - Comprehensive testing infrastructure (unit, integration, E2E)
   - User documentation and interactive help system
   - Component library with Storybook documentation
   - Production deployment pipeline with CI/CD automation

**Current Implementation Status:**
- Complete design specification documented in `docs/web-ui-design.md`
- 20 GitHub issues created covering all development phases (Issues #79-98)
- React-based frontend with Material-UI component library
- Real-time features using Server-Sent Events for live updates
- Integration with existing REST API and streaming endpoints
- Comprehensive testing strategy with 80%+ coverage target

### Implementation Technology
- **Primary Language**: .NET 9 for all application code
- **OpenAI Integration**: Use OpenAI .NET SDK pointing to Ollama (not HttpClient)
- **Web UI Technology**: React 18 + TypeScript + Vite + Material-UI v5
- **API Integration**: Generated TypeScript client from OpenAPI specification
- **Real-time Features**: Server-Sent Events for live updates and streaming
- **Git Integration**: External to the store - focus on git-friendly file formats
- **File Formats**: JSONL, Cypher, Markdown, YAML for git compatibility

## Future Enhancements

### Post-Phase 7 Advanced Features
- Advanced model management and auto-selection
- Enhanced analytics and performance monitoring beyond basic metrics
- Model load balancing and failover capabilities
- Context reflection and auto-summarization
- Remote syncing via GitHub Actions
- MCP (Model Context Protocol) integration
- Multi-tenant and enterprise features

### Data Format Specifications
- Git-friendly file format definitions
- JSONL, Cypher, and Markdown format specifications
- Data persistence and serialization standards
- Enhanced export/import capabilities

## Development Workflow

### Git Practices
- Always create a new branch before making changes
- Submit all changes via Pull Requests (PRs)
- Ensure branch names are descriptive of the changes being made
- We should not make changes to files in the main branch. If a change is necessary we should create a branch and then make the change.
- When you start working on any code change that will lead to a new branch and eventually a pull request, create and push the branch and create the pull request as a draft.
- Once you've gotten to the point where you think you've completed the changes and have pushed up all of the code, please take the pr out of draft state

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

## Workflow Memories

- When updating CLAUDE.md, please review and update README.md to ensure that it remains up to date as well
- If you are assigned to work on a GitHub issue, all pull requests related to that issue must be linked.
- you should make sure your code builds and the tests you've created run as expected before you push a commit