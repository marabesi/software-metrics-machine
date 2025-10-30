# Tools and Utilities

This section documents utility tools provided by Software Metrics Machine to help with data management and processing.

## Available Tools

### JSON File Merger

The JSON File Merger is a utility that helps you combine multiple JSON files containing similar data structures. This is particularly useful when you've fetched data in chunks (e.g., by date ranges) and need to consolidate them into a single file.

**Use Cases:**
- Merge pull request data fetched across different time periods
- Combine workflow run data from multiple fetch operations
- Consolidate any JSON data with similar structure

**Features:**
- Automatic deduplication based on a unique key
- Support for custom unique key fields
- Handles large files efficiently

## CLI Commands

For detailed CLI command documentation, see [Tools CLI Commands](./tools/cli.md).

## When to Use

The tools provided here are particularly useful when:

1. You're working with rate-limited APIs and need to fetch data in chunks
2. You want to consolidate historical data from multiple sources
3. You need to remove duplicate entries from combined datasets
4. You're preparing data for analysis in the dashboard
