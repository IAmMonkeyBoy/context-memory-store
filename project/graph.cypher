// Context Memory Store - Graph Relationships
// This file contains Cypher queries that define the graph structure
// Each query creates nodes and relationships for the context memory system

// Example relationship structure (remove these comments in production):
// CREATE (d:Document {id: "doc-1", title: "Example Document", created: datetime()})
// CREATE (c:Concept {id: "concept-1", name: "Example Concept"})
// CREATE (d)-[:CONTAINS]->(c)

// Schema constraints (uncomment when needed):
// CREATE CONSTRAINT doc_id IF NOT EXISTS FOR (d:Document) REQUIRE d.id IS UNIQUE;
// CREATE CONSTRAINT concept_id IF NOT EXISTS FOR (c:Concept) REQUIRE c.id IS UNIQUE;

// Indexes for performance (uncomment when needed):
// CREATE INDEX doc_title IF NOT EXISTS FOR (d:Document) ON (d.title);
// CREATE INDEX concept_name IF NOT EXISTS FOR (c:Concept) ON (c.name);