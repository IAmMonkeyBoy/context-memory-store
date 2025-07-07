# Memory Directory

This directory contains the memory storage for the Context Memory Store system.

## Structure

- `embeddings/` - Vector embeddings and related data
- `summaries/` - Generated summaries and abstracts
- `snapshots/` - Memory state snapshots

## Usage

The memory directory is managed automatically by the Context Memory Store system. Files in this directory are created and updated as documents are ingested and processed.

## File Formats

All files in this directory use git-friendly formats:
- Text files for summaries and metadata
- JSONL for structured data
- Markdown for documentation

## Backup and Recovery

The memory state is automatically backed up when the system is stopped. The entire memory directory can be committed to git for version control and recovery.