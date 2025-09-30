#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Generate CHANGELOG.md from git commits
 * Groups commits by type (feat, fix, chore, etc.)
 */

const CHANGELOG_PATH = path.join(__dirname, '../CHANGELOG.md');
const PACKAGE_PATH = path.join(__dirname, '../package.json');

// Read current version
const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));
const currentVersion = pkg.version;

// Get last tag (if exists)
let lastTag = '';
try {
  lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""').toString().trim();
} catch (error) {
  // No tags yet
}

// Get commits since last tag (or all if no tags)
const commitRange = lastTag ? `${lastTag}..HEAD` : 'HEAD';
let commits = [];
try {
  const log = execSync(`git log ${commitRange} --pretty=format:"%H|%s|%an|%ad" --date=short`, { encoding: 'utf8' });
  if (log.trim()) {
    commits = log.trim().split('\n').map(line => {
      const [hash, subject, author, date] = line.split('|');
      return { hash, subject, author, date };
    });
  }
} catch (error) {
  console.warn('Warning: Could not retrieve git commits');
}

// Parse commits by conventional commit type
const commitTypes = {
  feat: { title: '### ✨ Features', commits: [] },
  fix: { title: '### 🐛 Bug Fixes', commits: [] },
  perf: { title: '### ⚡ Performance', commits: [] },
  refactor: { title: '### ♻️  Refactoring', commits: [] },
  docs: { title: '### 📝 Documentation', commits: [] },
  style: { title: '### 💄 Styling', commits: [] },
  test: { title: '### ✅ Tests', commits: [] },
  build: { title: '### 🏗️  Build System', commits: [] },
  ci: { title: '### 👷 CI/CD', commits: [] },
  chore: { title: '### 🔧 Chore', commits: [] },
  other: { title: '### 📦 Other Changes', commits: [] },
};

// Categorize commits
commits.forEach(commit => {
  const match = commit.subject.match(/^(\w+)(\(.+\))?:\s*(.+)$/);
  if (match) {
    const [, type, scope, message] = match;
    const category = commitTypes[type] || commitTypes.other;
    category.commits.push({
      message: message.trim(),
      scope: scope ? scope.slice(1, -1) : null,
      hash: commit.hash.slice(0, 7),
    });
  } else {
    commitTypes.other.commits.push({
      message: commit.subject,
      hash: commit.hash.slice(0, 7),
    });
  }
});

// Generate changelog content for this version
let versionChangelog = `## [${currentVersion}] - ${new Date().toISOString().split('T')[0]}\n\n`;

let hasChanges = false;
Object.values(commitTypes).forEach(category => {
  if (category.commits.length > 0) {
    hasChanges = true;
    versionChangelog += `${category.title}\n\n`;
    category.commits.forEach(commit => {
      const scopeText = commit.scope ? `**${commit.scope}:** ` : '';
      versionChangelog += `- ${scopeText}${commit.message} ([${commit.hash}])\n`;
    });
    versionChangelog += '\n';
  }
});

if (!hasChanges) {
  versionChangelog += '- No significant changes\n\n';
}

// Read existing changelog or create new
let existingChangelog = '';
if (fs.existsSync(CHANGELOG_PATH)) {
  existingChangelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  // Remove header if it exists
  existingChangelog = existingChangelog.replace(/^#\s+Changelog\s*\n\n/, '');
}

// Combine new changes with existing
const fullChangelog = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

${versionChangelog}${existingChangelog}`;

// Write changelog
fs.writeFileSync(CHANGELOG_PATH, fullChangelog);

// Also create release-notes.md for GitHub release
const releaseNotes = versionChangelog.trim();
fs.writeFileSync(path.join(__dirname, '../release-notes.md'), releaseNotes);

console.log(`Generated changelog for version ${currentVersion}`);
console.log(`Found ${commits.length} commit(s) since ${lastTag || 'beginning'}`);