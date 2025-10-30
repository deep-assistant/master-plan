# Public Facts Database

A static website for hosting verified facts, statements, and hypotheses with multi-language support.

## Features

- Multi-language support (English, Russian, Spanish, French, German)
- Language selection with localStorage persistence
- Clear categorization: Facts, Statements, and Hypotheses
- Status indicators: Likely True, Likely False, Unclear
- Confirmations and refutations with references
- All content in public domain

## Structure

```
docs/
├── index.html          # Main listing page
├── styles.css          # Global styles
├── main.js             # Language selection logic
├── facts/              # Individual fact pages
│   ├── fact-001.html
│   ├── fact-002.html
│   └── hypothesis-001.html
└── README.md           # This file
```

## Adding New Facts

To add a new fact:

1. Create a new HTML file in the `facts/` directory
2. Use the existing fact pages as templates
3. Include all language versions in `lang-section` divs with appropriate `data-lang` attributes
4. Add confirmations and refutations with proper language badges
5. Update the main `index.html` to include the new fact in the listing

## Language Support

Each fact page should include:
- Statement in all supported languages
- Confirmations (links with language tags)
- Refutations (links with language tags)
- If no references exist in selected languages, show references in other languages with markers

## Data Format

Each fact should contain:
- Unique ID (e.g., `fact-001`, `hypothesis-001`)
- Status: `status-likely-true`, `status-likely-false`, or `status-unclear`
- Multi-language statements
- References with language tags
- Public domain license notice

## GitHub Pages

This site is designed to be hosted on GitHub Pages. To enable:

1. Go to repository Settings
2. Navigate to Pages section
3. Set source to "Deploy from a branch"
4. Select branch and `/docs` folder
5. Save

The site will be available at: `https://deep-assistant.github.io/master-plan/`

## Contributing

All content must be:
- Factually accurate with verifiable sources
- Available in public domain
- Properly cited with references
- Available in multiple languages when possible

## License

All content in this database is in the public domain.
