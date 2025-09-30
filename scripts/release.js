#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Manual Version Release Script
 * Requires explicit version input, validates it, and creates release
 */

// Parse arguments
const newVersion = process.argv[2];
const isHotfix = process.argv.includes('--hotfix');

// Validation: Version is required
if (!newVersion) {
  console.error('\n❌ Error: Version number required\n');
  console.error('Usage: npm run release <version>');
  console.error('       npm run release:hotfix <version>\n');
  console.error('Examples:');
  console.error('  npm run release 1.2.0');
  console.error('  npm run release:hotfix 1.1.1\n');
  process.exit(1);
}

// Simple semver validation regex
const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
if (!semverRegex.test(newVersion)) {
  console.error(`\n❌ Error: Invalid version format "${newVersion}"\n`);
  console.error('Version must follow semver format: MAJOR.MINOR.PATCH');
  console.error('Examples: 1.0.0, 1.2.3, 2.0.0-beta.1\n');
  process.exit(1);
}

// Read current version
const packagePath = path.join(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const currentVersion = pkg.version;

// Compare versions (basic comparison)
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(p => parseInt(p.split('-')[0]));
  const parts2 = v2.split('.').map(p => parseInt(p.split('-')[0]));

  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  return 0;
}

if (compareVersions(newVersion, currentVersion) <= 0) {
  console.error(`\n❌ Error: New version ${newVersion} must be greater than current ${currentVersion}\n`);
  process.exit(1);
}

// Check git working directory is clean
try {
  const status = execSync('git status --porcelain').toString();
  if (status.trim() !== '') {
    console.error('\n❌ Error: Git working directory not clean\n');
    console.error('Please commit or stash your changes before releasing.\n');
    process.exit(1);
  }
} catch (error) {
  console.error('\n❌ Error: Failed to check git status\n');
  process.exit(1);
}

// Check branch requirements
try {
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

  if (!isHotfix && currentBranch !== 'development') {
    console.error(`\n❌ Error: Must be on 'development' branch for normal releases\n`);
    console.error(`Currently on: ${currentBranch}\n`);
    console.error('Run: git checkout development\n');
    process.exit(1);
  }

  if (isHotfix && !currentBranch.startsWith('hotfix/')) {
    console.error(`\n❌ Error: Hotfix releases must be on a hotfix/* branch\n`);
    console.error(`Currently on: ${currentBranch}\n`);
    console.error('Run: git checkout -b hotfix/your-fix-name\n');
    process.exit(1);
  }

  console.log('\n📦 Release Information');
  console.log('─'.repeat(50));
  console.log(`Current version: ${currentVersion}`);
  console.log(`New version:     ${newVersion}`);
  console.log(`Branch:          ${currentBranch}`);
  console.log(`Type:            ${isHotfix ? 'Hotfix' : 'Normal Release'}`);
  console.log('─'.repeat(50));
  console.log('');

} catch (error) {
  console.error('\n❌ Error: Failed to check git branch\n');
  process.exit(1);
}

// Update package.json
console.log('📝 Updating package.json...');
pkg.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
console.log('✓ Updated package.json');

// Generate changelog
console.log('📝 Generating CHANGELOG...');
try {
  execSync('node scripts/generate-changelog.js', { stdio: 'inherit' });
  console.log('✓ Generated CHANGELOG.md');
} catch (error) {
  console.error('⚠️  Warning: Could not generate changelog');
}

// Git operations
console.log('📝 Creating git commit and tag...');
try {
  execSync('git add package.json CHANGELOG.md', { stdio: 'inherit' });
  execSync(`git commit -m "chore(release): ${newVersion}"`, { stdio: 'inherit' });
  execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, { stdio: 'inherit' });
  console.log(`✓ Created commit and tag v${newVersion}`);
} catch (error) {
  console.error('\n❌ Error: Git operations failed\n');
  console.error('Rolling back package.json...');
  pkg.version = currentVersion;
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
  process.exit(1);
}

// Success message
console.log('\n');
console.log('═'.repeat(50));
console.log('🎉 Release v' + newVersion + ' ready!');
console.log('═'.repeat(50));
console.log('');
console.log('Next steps:');
console.log('  1. Push the tag to trigger deployment:');
console.log(`     git push origin v${newVersion}`);
console.log('');
console.log('  2. Or push with commits:');
console.log('     git push --follow-tags');
console.log('');
console.log('This will trigger:');
console.log('  ✓ Production deployment to Firebase');
console.log('  ✓ GitHub Release creation');
console.log('');

if (isHotfix) {
  console.log('📌 Hotfix Reminder:');
  console.log('  After deployment, merge this hotfix back to development:');
  console.log('  git checkout development');
  console.log(`  git merge hotfix/your-fix-name`);
  console.log('  git push');
  console.log('');
}