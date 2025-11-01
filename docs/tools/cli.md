# Utility Tools CLI Commands

This document provides a guide for utility tools available in the CLI.

## JSON File Merger

### Merge Multiple JSON Files

```bash
./run-cli.sh tools json-merger --input-file-paths=file1.json,file2.json,file3.json --output-path=merged.json
```

Merges multiple JSON files containing lists of objects, deduplicates them by a unique key, and saves to an output file.

| Option              | Description                                      | Example                                      |
|---------------------|--------------------------------------------------|----------------------------------------------|
| input-file-paths    | Comma-separated list of JSON files to merge      | `--input-file-paths=file1.json,file2.json`  |
| output-path         | Path where merged JSON will be written           | `--output-path=merged.json`                  |
| unique-key, -k      | Field name to use as unique key for deduplication (default: id) | `--unique-key=id` or `-k id`    |

### Use Cases

This tool is particularly useful when:
- You have fetched data in multiple batches and want to combine them
- You need to deduplicate records across multiple files
- You're working with large datasets split across multiple JSON files

### Example

```bash
# Merge pull request data from different time periods
./run-cli.sh tools json-merger \
  --input-file-paths=prs-jan.json,prs-feb.json,prs-mar.json \
  --output-path=prs-q1.json \
  --unique-key=id
```
