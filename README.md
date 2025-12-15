# json2csv

A predictable CLI to flatten JSON into CSV. Built for API responses, logs, and anything else that refuses to behave.

## Why this exists

If you’ve ever:
- Exported JSON from an API and needed it in Excel
- Shared data with someone who does not speak JSON
- Debugged deeply nested payloads
- Used a random online JSON-to-CSV site you didn’t trust

This tool is for you.

`json2csv` turns messy, nested JSON into a clean, scriptable CSV you can use anywhere.

## Install

### npm
```bash
npm install -g json2csv
```

## Usage

From a file:
```bash
json2csv input.json > output.csv
```

From stdin:
```bash
cat input.json | json2csv > output.csv
```

From an API:
```bash
curl -s https://api.example.com/data | json2csv > data.csv
```

## Flattening rules

- Nested objects become dot-notation columns  
  `user.profile.name`

- Arrays of primitives are joined with `|`  
  `tags → "a|b|c"`

- Arrays of objects become indexed columns  
  `items[0].id`, `items[1].id`

- Empty or missing values are preserved as empty cells

- Column order is stable and alphabetical

## Example

### Input
```json
{
  "id": 1,
  "user": { "profile": { "name": "Tim" } },
  "tags": ["x", "y"],
  "items": [
    { "sku": "A1", "qty": 2 },
    { "sku": "B2", "qty": 1 }
  ]
}
```

### Output
```csv
id,items[0].qty,items[0].sku,items[1].qty,items[1].sku,tags,user.profile.name
1,2,A1,1,B2,x|y,Tim
```

## Design goals

- Predictable output
- Safe for scripts and CI
- No config files
- No external services
- No telemetry

## License

MIT
