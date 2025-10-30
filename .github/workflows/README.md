# GitHub Actions Workflows

This directory contains automated workflows for the master-plan repository.

## Sync Roadmap Workflow

**File:** `sync-roadmap.yml`

### Purpose

Automatically synchronizes the roadmap section in `README.md` with the actual state of GitHub issues across the deep-assistant organization.

### How It Works

1. **Triggers:**
   - Runs daily at 00:00 UTC (scheduled)
   - Can be manually triggered from the Actions tab
   - Automatically runs when issues are opened, closed, reopened, edited, or deleted

2. **Process:**
   - Scans `README.md` for issue references in the roadmap section
   - Fetches current state of each issue from GitHub API
   - Updates checkboxes: `[ ]` for open issues, `[x]` for closed issues
   - Commits changes if any updates are detected

3. **Script:** `sync-roadmap.js`
   - Node.js script that performs the actual synchronization
   - Parses markdown to find issue links
   - Uses GitHub API to check issue states
   - Preserves existing roadmap structure and formatting

### Manual Execution

You can manually trigger this workflow from the GitHub Actions tab:

1. Go to the repository's Actions tab
2. Select "Sync Master Plan Roadmap" workflow
3. Click "Run workflow" button

### Configuration

The workflow requires:
- `contents: write` permission to commit changes
- `issues: read` permission to fetch issue states
- `GITHUB_TOKEN` secret (automatically provided by GitHub Actions)

### Maintenance

To update the roadmap structure or add new issues:
1. Manually edit the `README.md` file
2. Add issue references in the format: `[#123](https://github.com/deep-assistant/repo-name/issues/123)`
3. The workflow will automatically sync checkbox states on the next run
