#!/usr/bin/env node

/**
 * Q&A Database Management Script
 *
 * This script provides utilities for managing the Q&A database:
 * - Adding new entries
 * - Validating against schema
 * - Searching entries
 * - Exporting to different formats
 *
 * Usage:
 *   node manage.js validate
 *   node manage.js add --question "..." --answer "..." --category "..."
 *   node manage.js search --query "keyword"
 *   node manage.js export --format csv
 */

const fs = require('fs');
const path = require('path');

// File paths
const DB_FILE = path.join(__dirname, 'database.json');
const SCHEMA_FILE = path.join(__dirname, 'schema.json');

// Load database
function loadDatabase() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading database:', error.message);
    process.exit(1);
  }
}

// Save database
function saveDatabase(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2) + '\n', 'utf8');
    console.log('Database saved successfully');
  } catch (error) {
    console.error('Error saving database:', error.message);
    process.exit(1);
  }
}

// Generate unique ID
function generateId(db) {
  const existingIds = db.entries.map(e => e.id);
  let counter = 1;
  let newId;

  do {
    newId = `qa-${String(counter).padStart(3, '0')}`;
    counter++;
  } while (existingIds.includes(newId));

  return newId;
}

// Get current ISO timestamp
function getTimestamp() {
  return new Date().toISOString();
}

// Validate database against schema
function validate() {
  console.log('Validating database against schema...');

  const db = loadDatabase();

  // Basic validation checks
  let errors = [];

  // Check required fields
  if (!db.version) errors.push('Missing version field');
  if (!db.metadata) errors.push('Missing metadata field');
  if (!db.entries) errors.push('Missing entries field');

  // Validate entries
  db.entries.forEach((entry, index) => {
    if (!entry.id) errors.push(`Entry ${index}: Missing id`);
    if (!entry.question) errors.push(`Entry ${index}: Missing question`);
    if (!entry.answer) errors.push(`Entry ${index}: Missing answer`);

    // Check for duplicate IDs
    const duplicates = db.entries.filter(e => e.id === entry.id);
    if (duplicates.length > 1) {
      errors.push(`Duplicate ID found: ${entry.id}`);
    }
  });

  if (errors.length > 0) {
    console.error('Validation errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log('✓ Database is valid');
  console.log(`  Total entries: ${db.entries.length}`);
  console.log(`  Categories: ${db.categories.length}`);
  console.log(`  Verified entries: ${db.entries.filter(e => e.verified).length}`);
}

// Add new entry
function addEntry(args) {
  const db = loadDatabase();

  // Parse arguments
  const question = args['--question'];
  const answer = args['--answer'];
  const category = args['--category'] || 'general';
  const tags = args['--tags'] ? args['--tags'].split(',').map(t => t.trim()) : [];
  const source = args['--source'] || 'automated';
  const verified = args['--verified'] === 'true';
  const difficulty = args['--difficulty'] || 'beginner';
  const language = args['--language'] || 'en';

  if (!question || !answer) {
    console.error('Error: --question and --answer are required');
    process.exit(1);
  }

  // Create new entry
  const newEntry = {
    id: generateId(db),
    question,
    answer,
    category,
    tags,
    source,
    verified,
    created: getTimestamp(),
    updated: getTimestamp(),
    metadata: {
      difficulty,
      language,
      references: []
    }
  };

  // Add to database
  db.entries.push(newEntry);
  db.metadata.updated = getTimestamp();

  // Save
  saveDatabase(db);
  console.log(`✓ Added entry with ID: ${newEntry.id}`);
}

// Search entries
function search(args) {
  const db = loadDatabase();
  const query = (args['--query'] || '').toLowerCase();
  const category = args['--category'];
  const verified = args['--verified'];

  let results = db.entries;

  // Filter by query
  if (query) {
    results = results.filter(e =>
      e.question.toLowerCase().includes(query) ||
      e.answer.toLowerCase().includes(query) ||
      e.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Filter by category
  if (category) {
    results = results.filter(e => e.category === category);
  }

  // Filter by verified status
  if (verified !== undefined) {
    const verifiedBool = verified === 'true';
    results = results.filter(e => e.verified === verifiedBool);
  }

  // Display results
  console.log(`Found ${results.length} entries:\n`);
  results.forEach(entry => {
    console.log(`[${entry.id}] ${entry.question}`);
    console.log(`  Category: ${entry.category}`);
    console.log(`  Verified: ${entry.verified ? 'Yes' : 'No'}`);
    console.log(`  Tags: ${entry.tags.join(', ')}`);
    console.log(`  Answer: ${entry.answer.substring(0, 100)}${entry.answer.length > 100 ? '...' : ''}`);
    console.log('');
  });
}

// Export database
function exportData(args) {
  const db = loadDatabase();
  const format = args['--format'] || 'json';
  const output = args['--output'] || `export.${format}`;

  switch (format) {
    case 'json':
      fs.writeFileSync(output, JSON.stringify(db, null, 2), 'utf8');
      break;

    case 'csv':
      let csv = 'ID,Question,Answer,Category,Tags,Verified,Source,Created\n';
      db.entries.forEach(e => {
        const row = [
          e.id,
          `"${e.question.replace(/"/g, '""')}"`,
          `"${e.answer.replace(/"/g, '""')}"`,
          e.category,
          `"${e.tags.join(', ')}"`,
          e.verified,
          e.source,
          e.created
        ].join(',');
        csv += row + '\n';
      });
      fs.writeFileSync(output, csv, 'utf8');
      break;

    case 'markdown':
      let md = `# Q&A Database Export\n\n`;
      md += `Generated: ${getTimestamp()}\n\n`;
      db.categories.forEach(cat => {
        const entries = db.entries.filter(e => e.category === cat.id);
        if (entries.length === 0) return;

        md += `## ${cat.name}\n\n`;
        entries.forEach(e => {
          md += `### ${e.question}\n\n`;
          md += `${e.answer}\n\n`;
          md += `*Tags: ${e.tags.join(', ')}*\n`;
          md += `*Verified: ${e.verified ? 'Yes' : 'No'}*\n\n`;
          md += '---\n\n';
        });
      });
      fs.writeFileSync(output, md, 'utf8');
      break;

    default:
      console.error(`Unknown format: ${format}`);
      process.exit(1);
  }

  console.log(`✓ Exported to ${output}`);
}

// Show statistics
function stats() {
  const db = loadDatabase();

  console.log('Database Statistics:\n');
  console.log(`Version: ${db.version}`);
  console.log(`Title: ${db.metadata.title}`);
  console.log(`License: ${db.metadata.license}`);
  console.log(`Last Updated: ${db.metadata.updated}\n`);

  console.log(`Total Entries: ${db.entries.length}`);
  console.log(`Verified Entries: ${db.entries.filter(e => e.verified).length}`);
  console.log(`Unverified Entries: ${db.entries.filter(e => !e.verified).length}\n`);

  console.log('Entries by Category:');
  db.categories.forEach(cat => {
    const count = db.entries.filter(e => e.category === cat.id).length;
    console.log(`  ${cat.name}: ${count}`);
  });

  console.log('\nEntries by Source:');
  const sources = {};
  db.entries.forEach(e => {
    sources[e.source] = (sources[e.source] || 0) + 1;
  });
  Object.entries(sources).forEach(([source, count]) => {
    console.log(`  ${source}: ${count}`);
  });

  console.log('\nEntries by Difficulty:');
  const difficulties = {};
  db.entries.forEach(e => {
    const diff = e.metadata?.difficulty || 'unknown';
    difficulties[diff] = (difficulties[diff] || 0) + 1;
  });
  Object.entries(difficulties).forEach(([diff, count]) => {
    console.log(`  ${diff}: ${count}`);
  });
}

// Show help
function showHelp() {
  console.log(`
Q&A Database Management Script

Usage:
  node manage.js <command> [options]

Commands:
  validate              Validate database against schema
  add                   Add new Q&A entry
  search                Search for entries
  export                Export database to different formats
  stats                 Show database statistics
  help                  Show this help message

Options for 'add':
  --question <text>     Question text (required)
  --answer <text>       Answer text (required)
  --category <id>       Category ID (default: general)
  --tags <tags>         Comma-separated tags
  --source <source>     Source type (default: automated)
  --verified <bool>     Verified status (default: false)
  --difficulty <level>  Difficulty level (default: beginner)
  --language <code>     Language code (default: en)

Options for 'search':
  --query <text>        Search query
  --category <id>       Filter by category
  --verified <bool>     Filter by verified status

Options for 'export':
  --format <format>     Export format: json, csv, markdown (default: json)
  --output <file>       Output file path

Examples:
  node manage.js validate
  node manage.js add --question "What is AI?" --answer "Artificial Intelligence..." --category "ai-ml"
  node manage.js search --query "machine learning" --verified true
  node manage.js export --format csv --output qa-export.csv
  node manage.js stats
`);
}

// Parse command line arguments
function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i].startsWith('--')) {
      const key = process.argv[i];
      const value = process.argv[i + 1];
      args[key] = value;
      i++;
    }
  }
  return args;
}

// Main
function main() {
  const command = process.argv[2];
  const args = parseArgs();

  switch (command) {
    case 'validate':
      validate();
      break;
    case 'add':
      addEntry(args);
      break;
    case 'search':
      search(args);
      break;
    case 'export':
      exportData(args);
      break;
    case 'stats':
      stats();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  loadDatabase,
  saveDatabase,
  validate,
  addEntry,
  search,
  exportData,
  stats
};
