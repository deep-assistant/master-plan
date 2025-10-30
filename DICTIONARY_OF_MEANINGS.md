# Dictionary of Meanings - Specification

## Overview

The Dictionary of Meanings is a formal type system for representing semantic meanings that enables language-independent fact representation, cross-language translation, and flexible phrase generation in multiple styles, dialects, and complexity levels.

## Core Concepts

### 1. Formal Type System

The system is based on a hierarchical type system where:

- **Meaning** (or **Type**): A fundamental semantic unit representing a single concept
- **Submeaning** (or **Subtype**): A more specific or component meaning derived from a parent meaning
- **Primitive Meaning**: An atomic, indivisible semantic unit (semantic prime)
- **Composite Meaning**: A meaning composed of multiple submeanings

This approach is inspired by:
- Semantic decomposition (breaking complex meanings into semantic primitives)
- Type theory (nested functions with defined input/output types)
- Ontological semantics (formal concept definitions and relationships)
- ConceptNet and WordNet (semantic networks and lexical databases)

### 2. Meaning Decomposition

Each meaning can be recursively decomposed into submeanings:

```
Meaning: "Run"
├── Submeaning: "Move"
│   ├── Submeaning: "Change Position"
│   └── Submeaning: "Use Legs"
└── Submeaning: "Fast"
    └── Submeaning: "Speed > Walking"
```

This decomposition continues until semantic primitives are reached.

## Architecture Components

### 1. Meaning Database

A structured database containing:

#### Core Schema

```
Meaning {
  id: UUID
  name: String
  type: MeaningType (PRIMITIVE | COMPOSITE)
  category: OntologicalCategory (EVENT | STATE | PLACE | AMOUNT | THING | PROPERTY)
  submeanings: Array<MeaningRelation>
  metadata: {
    complexity: Number
    frequency: Number
    domain: Array<String>
  }
}

MeaningRelation {
  target_meaning_id: UUID
  relation_type: RelationType (IS_A | PART_OF | HAS_PROPERTY | CAUSES | REQUIRES)
  weight: Number (0.0 - 1.0)
}
```

### 2. Language Translation System

Maps meanings to expressions in different languages:

#### Translation Schema

```
LanguageMapping {
  meaning_id: UUID
  language_code: String (ISO 639-3)
  expressions: Array<Expression>
}

Expression {
  text: String
  phonetic: String (IPA - International Phonetic Alphabet)
  formality: FormalityLevel (VERY_FORMAL | FORMAL | NEUTRAL | INFORMAL | VERY_INFORMAL)
  register: Array<Register> (TECHNICAL | LITERARY | COLLOQUIAL | SLANG)
  frequency: Number
  context_constraints: Array<String>
}
```

### 3. Replacement Patterns

Templates for converting meanings to phrases:

#### Pattern Schema

```
ReplacementPattern {
  id: UUID
  name: String
  input_meanings: Array<MeaningSlot>
  output_template: Template
  language_code: String
  style: StyleDescriptor
  constraints: Array<Constraint>
}

MeaningSlot {
  position: Number
  meaning_category: OntologicalCategory
  role: SemanticRole (AGENT | PATIENT | INSTRUMENT | LOCATION | TIME)
}

Template {
  structure: String (with placeholders: {0}, {1}, etc.)
  transformations: Array<Transformation>
}

Transformation {
  type: TransformationType (INFLECT | CONJUGATE | PLURALIZE | CASE)
  parameters: Map<String, Any>
}

StyleDescriptor {
  register: Register
  formality: FormalityLevel
  complexity: ComplexityLevel (SIMPLE | INTERMEDIATE | ADVANCED)
  verbosity: VerbosityLevel (CONCISE | MODERATE | ELABORATE)
  audience: AudienceType (CHILD | GENERAL | EXPERT)
}
```

### 4. Fact Representation System

Facts are represented as structured meaning combinations:

```
Fact {
  id: UUID
  predicate_meaning_id: UUID
  arguments: Array<FactArgument>
  modifiers: Array<FactModifier>
  temporal: TemporalInfo
  modal: ModalInfo
  truth_value: Number (0.0 - 1.0)
}

FactArgument {
  role: SemanticRole
  meaning_id: UUID
  value: Any (for concrete instances)
}

FactModifier {
  type: ModifierType (NEGATION | INTENSIFICATION | ASPECT)
  meaning_id: UUID
}
```

## Key Features

### 1. Language-Independent Representation

Facts are stored using meaning IDs, independent of any specific language:

```
Example Fact: "The cat runs quickly"

Represented as:
{
  predicate_meaning_id: "meaning:run",
  arguments: [
    {role: AGENT, meaning_id: "meaning:cat", determiner: DEFINITE}
  ],
  modifiers: [
    {type: MANNER, meaning_id: "meaning:quick"}
  ]
}
```

### 2. Multi-Language Translation

The same fact can be translated to any language without neural networks:

```
English: "The cat runs quickly"
Spanish: "El gato corre rápidamente"
French: "Le chat court rapidement"
Russian: "Кошка быстро бежит"
Japanese: "猫が速く走る"
IPA: [ðə kæt rʌnz ˈkwɪkli]
```

All translations are generated from the same meaning-based representation using language-specific mapping tables.

### 3. Style and Complexity Variation

A single fact can be expressed in multiple styles:

```
Fact: [meaning:run(agent:meaning:cat, manner:meaning:quick)]

Expressions:
- Formal/Technical: "The feline exhibits rapid locomotion"
- Standard: "The cat runs quickly"
- Simple (child): "The cat goes fast"
- Literary: "The nimble feline darts swiftly"
- Concise: "Cat runs fast"
- Elaborate: "The small domestic feline creature moves its legs in a swift running motion"
```

### 4. Personalized Vocabulary

Expressions can be tailored to individual users:

```
User Vocabulary Profile:
- known_meanings: Set<UUID>
- preferred_complexity: ComplexityLevel
- preferred_formality: FormalityLevel

Expression Generation:
1. Check meaning IDs against user's known_meanings
2. If unknown meaning found:
   - Substitute with known synonym, OR
   - Decompose into known submeanings, OR
   - Add definition/explanation
3. Apply user's style preferences
```

### 5. Semantic Search and Reasoning

The type system enables powerful semantic operations:

```
Operations:
- Find all submeanings of X
- Find all meanings containing submeaning Y
- Calculate semantic distance between meanings
- Find meanings with similar decomposition patterns
- Reason about meaning relationships (if A is-a B, and B has-property C, then A has-property C)
```

## Implementation Considerations

### Data Storage

- **Graph Database** (e.g., Neo4j, ArangoDB): Natural fit for meaning relationships
- **Document Database** (e.g., MongoDB): Flexible schema for meanings and patterns
- **Relational Database** (e.g., PostgreSQL): Strong consistency for language mappings
- **Hybrid Approach**: Graph for meanings, relational for translations

### Performance Optimization

1. **Caching**: Frequently used meaning decompositions and translations
2. **Indexing**: Meaning IDs, language codes, semantic roles
3. **Precomputation**: Common phrase patterns for each language
4. **Lazy Loading**: Load submeanings only when needed

### Extensibility

1. **Open Schema**: Allow custom ontological categories and relation types
2. **Plugin System**: Language-specific modules for morphology and syntax
3. **Crowdsourcing**: Community contributions for language mappings
4. **Version Control**: Track changes to meanings and relationships over time

## Use Cases

### 1. Machine Translation

Traditional translation: Text → Neural Network → Text

Meaning-based translation: Text → Meanings → Text
- More interpretable
- No training data needed for new language pairs
- Consistent translations
- Controllable style and formality

### 2. Simplified Communication

Generate age-appropriate or expertise-appropriate explanations:
- Medical reports for patients vs. doctors
- Technical documentation for beginners vs. experts
- News articles for children vs. adults

### 3. Language Learning

- Show meaning decomposition to understand word components
- Generate practice sentences at appropriate complexity level
- Provide translations in learner's native language
- Demonstrate how same meaning expressed differently across languages

### 4. Accessibility

- Generate simplified versions of complex texts
- Provide definitions using only known vocabulary
- Adjust reading level for cognitive disabilities
- Support multiple modalities (text, speech, sign language via meaning representation)

### 5. Knowledge Base Construction

- Store facts in language-independent format
- Query facts semantically rather than textually
- Reason over facts using type system relationships
- Integrate knowledge from multiple languages

## Future Enhancements

### 1. Multimodal Meanings

Extend beyond text to include:
- Visual representations (images, diagrams)
- Auditory representations (sounds, music)
- Gestural representations (sign language, body language)
- Tactile representations (for accessibility)

### 2. Context-Aware Generation

Consider discourse context:
- Previous statements in conversation
- Shared knowledge between speaker and listener
- Physical and social context
- Pragmatic implications

### 3. Emotional and Attitudinal Dimensions

Add layers for:
- Emotional valence (positive, negative, neutral)
- Speaker attitude (certain, uncertain, ironic, emphatic)
- Social relationships (power dynamics, familiarity)

### 4. Temporal and Historical Evolution

Track how meanings change over time:
- Historical usage patterns
- Semantic drift and shift
- Etymology and meaning origin
- Dialectal variations

### 5. Integration with Neural Systems

Hybrid approach:
- Use meaning system for interpretable core
- Use neural networks for ambiguity resolution
- Use embeddings to suggest meaning relationships
- Train models on meaning-annotated data

## Related Work and References

### Academic Foundations

1. **Semantic Primitives**: Wierzbicka's Natural Semantic Metalanguage (NSM)
2. **Formal Semantics**: Montague Grammar, Type Theory
3. **Ontology**: Conceptual Semantics, Ontological Semantics
4. **Lexical Resources**: WordNet, ConceptNet, FrameNet, BabelNet

### Similar Projects

1. **ConceptNet**: Open multilingual semantic network
2. **WordNet**: Lexical database with semantic relations
3. **Universal Dependencies**: Cross-linguistic grammatical relations
4. **Abstract Meaning Representation (AMR)**: Semantic representation for sentences
5. **Interlingua**: Language-independent meaning representation for translation

### Key Differences

This system emphasizes:
- User-personalized vocabulary adaptation
- Explicit style and complexity control
- Recursive type decomposition
- Direct generation without neural networks
- Integration of IPA for pronunciation-based unified representation

## Conclusion

The Dictionary of Meanings provides a principled, extensible foundation for language-independent semantic representation. By combining formal type theory, semantic decomposition, and flexible generation patterns, it enables powerful applications in translation, communication, accessibility, and knowledge management while remaining interpretable and controllable.
