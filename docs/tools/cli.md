# Tools CLI Commands

This document provides a guide for developers to use utility tools available in the `software-metrics-machine` project.

## JSON File Merger

### Merge Multiple JSON Files

```bash
./run-cli.sh tools json-merger --input-file-paths=file1.json,file2.json --output-path=merged.json
```

Merges multiple JSON files containing lists of objects, deduplicates entries by a unique key, and saves the result to a single output file.

| Option              | Description                         | Required | Example                  |
|---------------------|-------------------------------------|----------|--------------------------|
| input-file-paths    | Comma-separated list of JSON files to merge   | Yes      | `--input-file-paths=file1.json,file2.json,file3.json` |
| output-path         | Path where the merged JSON will be written    | Yes      | `--output-path=merged.json` |
| unique-key, -k      | Field name to use as unique key for deduplication | No | `--unique-key=id` or `-k id` |

**Default unique key**: `id`

### Usage Example

```bash
# Merge PR files with default unique key (id)
./run-cli.sh tools json-merger \
  --input-file-paths=prs_jan.json,prs_feb.json,prs_mar.json \
  --output-path=prs_q1.json

# Merge workflow files with custom unique key
./run-cli.sh tools json-merger \
  --input-file-paths=workflows_1.json,workflows_2.json \
  --output-path=workflows_all.json \
  --unique-key=run_id
```

### Notes

- Input files must contain JSON arrays (lists of objects)
- The tool will remove duplicate entries based on the specified unique key
- If an object doesn't have the specified unique key, it will still be included
- The output file will be created if it doesn't exist, or overwritten if it does
