# PR Review Extractor

A TypeScript tool that extracts PR review comments from GitHub repositories and generates actionable review checklists based on recurring patterns.

## Features

- 🔍 Extracts all review comments from closed/merged PRs
- 📊 Analyzes comment patterns and categorizes them (bugs, performance, security, style, etc.)
- 📝 Generates review checklists based on frequently mentioned issues
- 🎯 Prioritizes items by severity and frequency
- 📄 Exports to multiple formats (Markdown, JSON, YAML)

## Installation

```bash
npm install
npm run build
```

## Setup

1. Create a GitHub Personal Access Token with `repo` scope (or `public_repo` for public repos only)
2. Copy `.env.example` to `.env` and add your token:
   ```
   GITHUB_TOKEN=your_github_personal_access_token_here
   ```

## Usage

### Command Line

```bash
# Basic usage
npm run build
node dist/cli/index.js extract -o owner -r repo

# With options
node dist/cli/index.js extract \
  -o facebook \
  -r react \
  --max-prs 100 \
  --since 2024-01-01 \
  --format markdown \
  --output ./checklists/react-checklist

# Test connection
node dist/cli/index.js test -o owner -r repo
```

### Options

- `-o, --owner <owner>`: Repository owner (required)
- `-r, --repo <repo>`: Repository name (required)
- `-t, --token <token>`: GitHub token (or use GITHUB_TOKEN env var)
- `-m, --max-prs <number>`: Maximum number of PRs to analyze
- `-s, --state <state>`: PR state: open, closed, or all (default: closed)
- `--since <date>`: Only include PRs created after this date (YYYY-MM-DD)
- `-f, --format <format>`: Output format: json, markdown, or yaml (default: markdown)
- `--output <path>`: Output file path (default: ./output/checklist)

### Programmatic Usage

```typescript
import { PRExtractor, ChecklistGenerator, ChecklistFormatter } from './src';

const extractor = new PRExtractor({
  owner: 'facebook',
  repo: 'react',
  token: process.env.GITHUB_TOKEN!,
  maxPRs: 100
});

const data = await extractor.extract();
const generator = new ChecklistGenerator();
const checklist = generator.generate(data, 'facebook/react');

const formatter = new ChecklistFormatter();
await formatter.saveAsMarkdown(checklist, './checklist.md');
```

## Output Example

The tool generates checklists organized by category:

```markdown
# PR Review Checklist

## Performance

1. 🟡 **Avoid unnecessary re-renders** (15 occurrences)
2. 🔴 **Consider memoizing expensive calculations** (8 occurrences)

## Security

1. 🔴 **Sanitize user input to prevent XSS** (12 occurrences)
2. 🟡 **Validate API responses** (6 occurrences)
```

## Development

```bash
# Run in development mode
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format
```

## License

ISC