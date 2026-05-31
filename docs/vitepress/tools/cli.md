# Utility Tools CLI Commands

This document provides a guide for utility tools available in the CLI.

## JSON File Merger

### Merge Multiple JSON Files

```bash
smm tools json-merge --output merged.json --pretty
```

Merges JSON files from the current directory into a single output file.

| Option              | Description                                      | Example                                      |
|---------------------|--------------------------------------------------|----------------------------------------------|
| input               | Input pattern (current implementation reads local JSON files in current directory) | `--input *.json` |
| output              | Output path                                      | `--output merged.json`                        |
| pretty              | Pretty-print output JSON                         | `--pretty`                                    |

### Use Cases

This tool is particularly useful when:
- You have multiple JSON snapshots and want one merged artifact
- You want to quickly inspect combined provider outputs

### Example

```bash
# Merge JSON files in the current directory
smm tools json-merge --output merged.json --pretty
```
