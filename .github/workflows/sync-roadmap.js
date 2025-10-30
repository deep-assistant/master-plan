#!/usr/bin/env node

/**
 * Sync Master Plan Roadmap Script
 *
 * This script automatically updates the roadmap section in README.md
 * by synchronizing checkbox states with actual GitHub issue states.
 *
 * Features:
 * - Updates checkboxes: [ ] for open issues, [x] for closed issues
 * - Preserves the existing roadmap structure and formatting
 * - Works with issues from multiple repositories
 */

const fs = require('fs');
const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ORG_NAME = 'deep-assistant';

/**
 * Fetch data from GitHub API
 */
function fetchGitHub(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Master-Plan-Sync-Bot',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`GitHub API error: ${res.statusCode} - ${data}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Get issue state (open/closed) from GitHub
 */
async function getIssueState(repo, issueNumber) {
  try {
    const issue = await fetchGitHub(`/repos/${ORG_NAME}/${repo}/issues/${issueNumber}`);
    return issue.state === 'closed' ? 'closed' : 'open';
  } catch (error) {
    console.error(`Error fetching issue ${repo}#${issueNumber}:`, error.message);
    return 'open'; // Default to open if we can't fetch
  }
}

/**
 * Parse issue reference from markdown link
 * Returns: { repo: string, number: number } or null
 */
function parseIssueLink(line) {
  // Match patterns like:
  // - **Link:** [#46](https://github.com/deep-assistant/telegram-bot/issues/46)
  // - **Link:** [#10](https://github.com/deep-assistant/master-plan/issues/10)
  const linkPattern = /\[#(\d+)\]\(https:\/\/github\.com\/deep-assistant\/([^\/]+)\/issues\/\d+\)/;
  const match = line.match(linkPattern);

  if (match) {
    return {
      repo: match[2],
      number: parseInt(match[1], 10)
    };
  }

  return null;
}

/**
 * Update checkbox state in a task line
 */
function updateCheckbox(line, isClosed) {
  const checkbox = isClosed ? '[x]' : '[ ]';
  // Replace existing checkbox at the start of the line
  return line.replace(/^(\s*)-\s*\[([ x])\]/, `$1- ${checkbox}`);
}

/**
 * Main sync function
 */
async function syncRoadmap() {
  console.log('🚀 Starting roadmap sync...');

  // Read README.md
  const readmePath = 'README.md';
  let content = fs.readFileSync(readmePath, 'utf8');
  const lines = content.split('\n');

  let updated = false;
  let currentIssue = null;

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line contains an issue link
    const issueRef = parseIssueLink(line);
    if (issueRef) {
      currentIssue = issueRef;
      console.log(`📋 Found issue reference: ${issueRef.repo}#${issueRef.number}`);
    }

    // Check if this is a task line with a checkbox and we have a current issue
    if (currentIssue && line.match(/^\s*-\s*\[([ x])\]/)) {
      // Get the actual state from GitHub
      const state = await getIssueState(currentIssue.repo, currentIssue.number);
      const isClosed = state === 'closed';

      // Update the checkbox if needed
      const newLine = updateCheckbox(line, isClosed);
      if (newLine !== line) {
        console.log(`✅ Updating ${currentIssue.repo}#${currentIssue.number}: ${state}`);
        lines[i] = newLine;
        updated = true;
      }

      // Reset current issue after processing its task line
      currentIssue = null;
    }
  }

  // Write back if updated
  if (updated) {
    fs.writeFileSync(readmePath, lines.join('\n'), 'utf8');
    console.log('✨ Roadmap successfully updated!');
  } else {
    console.log('✓ Roadmap is already up to date!');
  }

  return updated;
}

// Run the sync
syncRoadmap().catch(error => {
  console.error('❌ Error syncing roadmap:', error);
  process.exit(1);
});
