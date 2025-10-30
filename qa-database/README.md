# Public Question and Answer Database

A public domain question and answer database for training AI models and providing educational resources.

## Overview

This database is designed to:
- Store questions and answers in a structured, machine-readable format
- Support both automated entry creation and teacher/expert verification
- Enable AI models to retrieve answers from a knowledge base
- Provide training data for future AI model development
- Maintain all content in the public domain (CC0-1.0 license)

## Database Structure

The database consists of:

- **`database.json`** - The main Q&A database file
- **`schema.json`** - JSON Schema definition for validation
- **`LICENSE`** - CC0 1.0 Universal Public Domain Dedication

## Schema

Each Q&A entry contains:

- **id**: Unique identifier for the entry
- **question**: The question text
- **answer**: The answer text
- **category**: Category ID for organization
- **tags**: Array of tags for searchability
- **source**: How the entry was created (`automated`, `teacher-reviewed`, `community`)
- **verified**: Boolean indicating expert verification
- **created/updated**: Timestamps for tracking
- **metadata**: Additional information including:
  - difficulty level (beginner, intermediate, advanced)
  - language (ISO 639-1 code)
  - references and citations

## Categories

The database is organized into categories:

- **General Knowledge** - General knowledge questions
- **AI & Machine Learning** - Questions about AI, ML, and related topics
- **Programming** - Programming languages, algorithms, and development
- **Deep Assistant** - Questions about the Deep Assistant project

Additional categories can be added as needed.

## Usage

### Reading the Database

The database can be read and parsed by any programming language that supports JSON:

```javascript
// JavaScript/Node.js example
const database = require('./database.json');
const entries = database.entries;

// Find an answer by question keyword
const result = entries.find(e =>
  e.question.toLowerCase().includes('machine learning')
);
```

```python
# Python example
import json

with open('database.json', 'r') as f:
    database = json.load(f)

entries = database['entries']

# Find verified entries
verified_entries = [e for e in entries if e.get('verified', False)]
```

### Adding Entries

There are two main ways to add entries:

#### 1. Manual Addition

Edit `database.json` directly, following the schema structure:

```json
{
  "id": "qa-XXX",
  "question": "Your question here?",
  "answer": "Your answer here.",
  "category": "category-id",
  "tags": ["tag1", "tag2"],
  "source": "automated",
  "verified": false,
  "created": "2025-10-30T00:00:00Z",
  "updated": "2025-10-30T00:00:00Z",
  "metadata": {
    "difficulty": "beginner",
    "language": "en",
    "references": []
  }
}
```

#### 2. Using the Management Script

Use the provided `manage.js` script for automated operations:

```bash
# Add a new Q&A entry
node manage.js add \
  --question "What is Node.js?" \
  --answer "Node.js is a JavaScript runtime built on Chrome's V8 engine." \
  --category "programming" \
  --tags "nodejs,javascript,runtime"

# Validate the database against schema
node manage.js validate

# Search for entries
node manage.js search --query "machine learning"

# Export to different formats
node manage.js export --format csv
```

## Workflow for Teacher Verification

1. **Automated Entry Creation**: Entries can be automatically generated and added with `verified: false`
2. **Teacher Review**: A teacher or expert reviews the entry for accuracy
3. **Verification**: If approved, the entry is updated with `verified: true` and `source: "teacher-reviewed"`
4. **Continuous Improvement**: Entries can be updated and improved over time

## Integration with AI Models

This database can be integrated into AI systems to:

1. **Answer Lookup**: Search for existing answers before generating new ones
2. **Training Data**: Use verified Q&A pairs for fine-tuning models
3. **Quality Validation**: Compare generated answers against verified entries
4. **Knowledge Base**: Build a retrieval-augmented generation (RAG) system

Example integration flow:

```
User Question → Search Database → Match Found?
  ├─ Yes → Return verified answer
  └─ No  → Generate with AI → Add to database (unverified)
```

## Data Format and Interoperability

The database uses JSON format for maximum compatibility and portability:

- **Human-readable**: Can be edited with any text editor
- **Machine-readable**: Easy to parse in any programming language
- **Version controlled**: Works seamlessly with Git
- **Portable**: Single file that can be easily shared and synchronized

## License

All content in this database is dedicated to the public domain under the [CC0 1.0 Universal Public Domain Dedication](https://creativecommons.org/publicdomain/zero/1.0/).

You are free to:
- Use the database for any purpose
- Modify and adapt the content
- Distribute and share the database
- Use it commercially
- Use it for AI training

No attribution is required, though it is appreciated.

## Contributing

We welcome contributions to expand and improve this database:

1. **Add New Entries**: Submit well-researched Q&A pairs
2. **Verify Entries**: Review and verify existing automated entries
3. **Improve Answers**: Enhance clarity and accuracy of existing answers
4. **Add Categories**: Propose new categories for better organization
5. **Report Issues**: Flag incorrect or outdated information

All contributions must be original work or in the public domain.

## Validation

Validate the database structure against the schema:

```bash
# Using Node.js with AJV
npm install ajv ajv-formats
node manage.js validate

# Using Python with jsonschema
pip install jsonschema
python validate.py
```

## Statistics

Current database statistics:
- **Total Entries**: 5
- **Categories**: 4
- **Verified Entries**: 5 (100%)
- **Languages**: English (en)

## Future Development

Planned improvements:
- Multi-language support (Russian, Spanish, etc.)
- Advanced search capabilities with fuzzy matching
- API endpoint for programmatic access
- Automated quality scoring
- Community contribution platform
- Integration with Deep Assistant services

## Contact

For questions, suggestions, or contributions:
- **Repository**: [deep-assistant/master-plan](https://github.com/deep-assistant/master-plan)
- **Issues**: [GitHub Issues](https://github.com/deep-assistant/master-plan/issues/23)
- **Discussions**: [GitHub Discussions](https://github.com/deep-assistant/master-plan/discussions)
