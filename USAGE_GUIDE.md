# Dictionary of Meanings - Usage Guide

## Quick Start

The Dictionary of Meanings system allows you to represent facts in a language-independent way and generate expressions in multiple languages, styles, and complexity levels.

## Core Workflow

### 1. Define Meanings

Create entries in the meaning database:

```json
{
  "id": "meaning:run",
  "name": "run",
  "type": "COMPOSITE",
  "category": "EVENT",
  "submeanings": [
    {"target_meaning_id": "meaning:move", "relation_type": "IS_A"},
    {"target_meaning_id": "meaning:fast", "relation_type": "HAS_PROPERTY"},
    {"target_meaning_id": "meaning:legs", "relation_type": "REQUIRES"}
  ]
}
```

### 2. Add Language Mappings

Map meanings to expressions in different languages:

```json
{
  "meaning_id": "meaning:run",
  "language_code": "eng",
  "expressions": [
    {"text": "run", "phonetic": "rʌn", "formality": "NEUTRAL"},
    {"text": "jog", "phonetic": "dʒɑɡ", "formality": "NEUTRAL"},
    {"text": "sprint", "phonetic": "sprɪnt", "formality": "NEUTRAL"}
  ]
}
```

### 3. Create Replacement Patterns

Define templates for generating phrases:

```json
{
  "id": "pattern:simple-action",
  "input_meanings": [
    {"position": 0, "meaning_category": "THING", "role": "AGENT"},
    {"position": 1, "meaning_category": "EVENT", "role": "PATIENT"}
  ],
  "output_template": {
    "structure": "{0} {1}",
    "transformations": [
      {"type": "ARTICLE", "target_position": 0},
      {"type": "CONJUGATE", "target_position": 1}
    ]
  },
  "style": {"complexity": "SIMPLE", "audience": "GENERAL"}
}
```

### 4. Represent Facts

Store facts using meaning IDs:

```json
{
  "id": "fact:cat-runs-quickly",
  "predicate_meaning_id": "meaning:run",
  "arguments": [
    {"role": "AGENT", "meaning_id": "meaning:cat", "determiner": "DEFINITE"}
  ],
  "modifiers": [
    {"type": "INTENSIFICATION", "meaning_id": "meaning:quick"}
  ]
}
```

### 5. Generate Expressions

Use the fact + pattern + language mappings to generate text:

```python
def generate_expression(fact, pattern, language_code, user_profile=None):
    # 1. Extract meanings from fact
    meanings = extract_meanings(fact, pattern)

    # 2. Get expressions for each meaning in target language
    expressions = []
    for meaning_id in meanings:
        expr = get_expression(meaning_id, language_code,
                             formality=pattern.style.formality,
                             user_profile=user_profile)
        expressions.append(expr)

    # 3. Apply pattern template
    result = apply_template(pattern.output_template, expressions)

    # 4. Apply transformations (conjugation, articles, etc.)
    result = apply_transformations(result, pattern.output_template.transformations)

    return result
```

Result:
```
English (simple): "The cat runs quickly"
English (formal): "The feline exhibits rapid locomotion"
English (child): "The cat goes fast"
Spanish: "El gato corre rápidamente"
French: "Le chat court rapidement"
Russian: "Кот быстро бежит"
Japanese: "猫が速く走る"
IPA: "ðə kæt rʌnz ˈkwɪkli"
```

## Use Cases

### Translation Without Neural Networks

Traditional approach:
- Requires parallel corpora
- Needs training for each language pair
- Black box behavior
- Inconsistent results

Dictionary of Meanings approach:
- No training data needed
- Add new language by providing mappings
- Interpretable process
- Consistent translations
- Controllable style

Example:
```python
fact = load_fact("fact:cat-runs-quickly")

# Generate in all languages
for lang in ["eng", "spa", "fra", "rus", "jpn"]:
    text = generate_expression(fact, simple_pattern, lang)
    print(f"{lang}: {text}")
```

### Personalized Communication

Adapt expression to user's vocabulary:

```python
user_profile = {
    "known_meanings": ["meaning:cat", "meaning:move", "meaning:fast"],
    "preferred_complexity": "SIMPLE",
    "preferred_formality": "INFORMAL"
}

# Will use simpler synonyms for unknown meanings
text = generate_expression(fact, pattern, "eng", user_profile)
# Output: "The cat goes fast" (instead of "runs quickly")
```

### Multi-Style Generation

Generate same fact in different styles:

```python
fact = load_fact("fact:cat-runs-quickly")

styles = {
    "simple": simple_pattern,
    "formal": formal_pattern,
    "child": child_pattern,
    "literary": literary_pattern,
    "technical": technical_pattern
}

for style_name, pattern in styles.items():
    text = generate_expression(fact, pattern, "eng")
    print(f"{style_name}: {text}")

# Output:
# simple: "The cat runs quickly"
# formal: "The feline exhibits rapid locomotion"
# child: "The cat goes fast"
# literary: "The nimble feline darts swiftly"
# technical: "The domestic feline demonstrates rapid bipedal locomotion"
```

### Semantic Search

Find facts by meaning:

```python
# Find all facts about running
facts = search_facts(predicate="meaning:run")

# Find all facts involving cats
facts = search_facts(has_meaning="meaning:cat")

# Find all facts with 'fast' property
facts = search_facts(has_modifier="meaning:fast")

# Semantic similarity search
similar_facts = search_facts(similar_to="meaning:run", threshold=0.8)
# Returns facts about: jog, sprint, dash, hurry, etc.
```

### Meaning Decomposition

Understand word components:

```python
meaning = load_meaning("meaning:run")

def show_decomposition(meaning, depth=0):
    indent = "  " * depth
    print(f"{indent}{meaning.name} ({meaning.category})")

    for relation in meaning.submeanings:
        sub = load_meaning(relation.target_meaning_id)
        print(f"{indent}  └─ {relation.relation_type}: {sub.name}")
        if sub.type == "COMPOSITE":
            show_decomposition(sub, depth + 2)

show_decomposition(meaning)

# Output:
# run (EVENT)
#   └─ IS_A: move
#     └─ PART_OF: change-position
#     └─ REQUIRES: entity
#   └─ HAS_PROPERTY: fast
#   └─ REQUIRES: legs
#     └─ IS_A: body-part
```

### Knowledge Base Queries

Reason over facts using type system:

```python
# Inference: if X runs, and run requires legs, then X has legs
fact = load_fact("fact:cat-runs-quickly")
predicate = load_meaning(fact.predicate_meaning_id)

for relation in predicate.submeanings:
    if relation.relation_type == "REQUIRES":
        required = load_meaning(relation.target_meaning_id)
        print(f"Inference: cats have {required.name}")

# Output: "Inference: cats have legs"
```

## Advanced Features

### Context-Aware Generation

Adjust expression based on context:

```python
context = {
    "previous_mentions": ["meaning:cat"],  # Cat already mentioned
    "shared_knowledge": ["meaning:pet"],    # User knows about pets
    "formality_level": "INFORMAL"
}

# Will use pronouns for previously mentioned entities
text = generate_expression(fact, pattern, "eng", context=context)
# Output: "It runs quickly" (instead of "The cat runs quickly")
```

### Multilingual IPA Representation

Unified pronunciation representation:

```python
fact = load_fact("fact:cat-runs-quickly")

# Generate IPA representation
ipa = generate_ipa(fact)
print(f"IPA: {ipa}")
# Output: "ðə kæt rʌnz ˈkwɪkli"

# Can be used for:
# - Text-to-speech systems
# - Language learning
# - Cross-language pronunciation guide
# - Universal phonetic notation
```

### Dynamic Complexity Adjustment

Automatically adjust complexity:

```python
def explain_to_audience(fact, audience_level):
    if audience_level == "expert":
        pattern = technical_pattern
    elif audience_level == "general":
        pattern = simple_pattern
    elif audience_level == "child":
        pattern = child_pattern

    text = generate_expression(fact, pattern, "eng")

    # Add definitions for complex meanings
    if audience_level != "expert":
        text = add_inline_definitions(text, audience_level)

    return text

# For different audiences:
print(explain_to_audience(fact, "expert"))
# "The feline exhibits rapid locomotion"

print(explain_to_audience(fact, "general"))
# "The cat runs quickly"

print(explain_to_audience(fact, "child"))
# "The cat goes fast (run = go very fast using legs)"
```

### Batch Translation

Translate multiple facts efficiently:

```python
facts = [
    load_fact("fact:cat-runs-quickly"),
    load_fact("fact:dog-barks-loudly"),
    load_fact("fact:bird-flies-high")
]

# Translate all facts to multiple languages
for fact in facts:
    print(f"\nFact: {fact.id}")
    for lang in ["eng", "spa", "fra"]:
        text = generate_expression(fact, simple_pattern, lang)
        print(f"  {lang}: {text}")
```

## Integration Examples

### Web API

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/generate', methods=['POST'])
def generate():
    fact_id = request.json['fact_id']
    language = request.json.get('language', 'eng')
    style = request.json.get('style', 'simple')

    fact = load_fact(fact_id)
    pattern = load_pattern(style)

    text = generate_expression(fact, pattern, language)

    return jsonify({
        'fact_id': fact_id,
        'language': language,
        'style': style,
        'text': text
    })
```

### Command Line Tool

```bash
# Generate expression
$ meanings generate --fact "cat-runs-quickly" --lang eng --style simple
The cat runs quickly

# Translate to multiple languages
$ meanings translate --fact "cat-runs-quickly" --langs eng,spa,fra
eng: The cat runs quickly
spa: El gato corre rápidamente
fra: Le chat court rapidement

# Search facts
$ meanings search --predicate run
Found 5 facts about 'run'

# Decompose meaning
$ meanings decompose --meaning run
run (EVENT)
  ├─ IS_A: move
  ├─ HAS_PROPERTY: fast
  └─ REQUIRES: legs
```

### JavaScript Library

```javascript
import { MeaningDictionary } from 'meaning-dictionary';

const dict = new MeaningDictionary();

// Load fact
const fact = dict.loadFact('fact:cat-runs-quickly');

// Generate in multiple styles
const styles = ['simple', 'formal', 'child', 'literary'];
for (const style of styles) {
  const text = dict.generate(fact, { language: 'eng', style });
  console.log(`${style}: ${text}`);
}

// Personalize for user
const userProfile = {
  knownMeanings: ['meaning:cat', 'meaning:move', 'meaning:fast'],
  complexity: 'SIMPLE'
};
const personalizedText = dict.generate(fact, {
  language: 'eng',
  style: 'simple',
  userProfile
});
```

## Best Practices

### 1. Meaning Granularity

**Too coarse:**
```json
{"id": "meaning:communicate", "type": "PRIMITIVE"}
```

**Too fine:**
```json
{"id": "meaning:speak-loudly-in-angry-tone-to-adult", "type": "PRIMITIVE"}
```

**Appropriate:**
```json
{
  "id": "meaning:speak",
  "type": "COMPOSITE",
  "submeanings": [
    {"target_meaning_id": "meaning:communicate", "relation_type": "IS_A"},
    {"target_meaning_id": "meaning:voice", "relation_type": "REQUIRES"}
  ]
}
```

### 2. Semantic Primitives

Aim for ~500-1000 primitive meanings that cover most concepts:
- Basic actions: move, change, cause, perceive, feel, think, say
- Basic properties: big, small, good, bad, hard, soft, hot, cold
- Basic things: person, animal, plant, object, place, time
- Basic relations: part-of, type-of, cause, location, possession

### 3. Language Mappings

Provide multiple expressions with appropriate metadata:

```json
{
  "meaning_id": "meaning:run",
  "language_code": "eng",
  "expressions": [
    {"text": "run", "frequency": 10, "formality": "NEUTRAL"},
    {"text": "jog", "frequency": 6, "context_constraints": ["slower, for exercise"]},
    {"text": "sprint", "frequency": 5, "context_constraints": ["very fast, short distance"]},
    {"text": "dash", "frequency": 4, "register": ["LITERARY"]},
    {"text": "scamper", "frequency": 3, "context_constraints": ["quick, light steps"]}
  ]
}
```

### 4. Pattern Design

Create patterns for common syntactic structures:
- Subject-Verb: `{agent} {action}`
- Subject-Verb-Object: `{agent} {action} {patient}`
- Subject-Verb-Manner: `{agent} {action} {manner}`
- Subject-Copula-Property: `{entity} is {property}`

### 5. Error Handling

Handle missing data gracefully:

```python
def get_expression(meaning_id, language_code, **kwargs):
    # Try to get expression in requested language
    expr = db.get_expression(meaning_id, language_code)

    if not expr:
        # Fallback 1: Try English
        expr = db.get_expression(meaning_id, 'eng')

    if not expr:
        # Fallback 2: Use meaning name with note
        meaning = db.get_meaning(meaning_id)
        expr = f"[{meaning.name}]"

    return expr
```

## Performance Optimization

### Caching

```python
from functools import lru_cache

@lru_cache(maxsize=10000)
def get_meaning(meaning_id):
    return db.load_meaning(meaning_id)

@lru_cache(maxsize=50000)
def get_expression(meaning_id, language_code):
    return db.load_expression(meaning_id, language_code)
```

### Precomputation

```python
# Precompute common phrases
common_facts = load_common_facts()
for fact in common_facts:
    for lang in ["eng", "spa", "fra", "rus", "jpn"]:
        for style in ["simple", "formal", "child"]:
            text = generate_expression(fact, style, lang)
            cache.set(f"{fact.id}:{lang}:{style}", text)
```

### Indexing

```sql
-- Index for meaning relationships
CREATE INDEX idx_submeanings ON meaning_relations(source_id, relation_type);

-- Index for language lookups
CREATE INDEX idx_language_mapping ON language_mappings(meaning_id, language_code);

-- Index for semantic search
CREATE INDEX idx_meaning_category ON meanings(category, type);
```

## Next Steps

1. **Expand Meaning Database**: Add more primitive and composite meanings
2. **Add More Languages**: Create language mappings for additional languages
3. **Create More Patterns**: Cover more syntactic structures and styles
4. **Build Tools**: Create editors, validators, and testing tools
5. **Integrate with Applications**: Use in translation, communication, and learning apps

## Resources

- **Specification**: See `DICTIONARY_OF_MEANINGS.md` for detailed architecture
- **Schemas**: JSON schemas in `schemas/` directory
- **Examples**: Sample data in `examples/` directory
- **Contributing**: Guidelines for adding new meanings and mappings
