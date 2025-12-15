# json2csv Pro

Extended version of json2csv with additional controls for real-world workflows.

## Pro features
- Custom CSV delimiters (`--delimiter ';'`)
- All features from the open-source version
- Offline usage
- No telemetry

## Usage

From a file:
```bash
node json2csv-pro.js input.json --delimiter ';' > output.csv
```

From stdin:
```bash
cat input.json | node json2csv-pro.js --delimiter ';' > output.csv
```

## Notes
- Nested objects become dot keys: `user.profile.name`
- Arrays of primitives become joined strings with `|`
- Arrays of objects become indexed columns: `items[0].id`
