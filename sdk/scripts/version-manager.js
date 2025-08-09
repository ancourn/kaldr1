#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk').default;
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const semver = require('semver');

const program = new Command();

program
  .name('version-manager')
  .description('Manage semantic versioning for KALDRIX SDKs')
  .option('--bump <type>', 'Version bump type (major, minor, patch, prerelease)', 'patch')
  .option('--pre-release <tag>', 'Prerelease tag (alpha, beta, rc)', '')
  .option('--from-api', 'Get version from OpenAPI specification')
  .option('--current', 'Show current version')
  .option('--validate', 'Validate current version')
  .option('--update-packages', 'Update package.json files with new version')
  .option('--commit', 'Commit version changes')
  .option('--tag', 'Create git tag for new version')
  .parse();

const options = program.opts();

const PROJECT_ROOT = path.dirname(__dirname);
const OPENAPI_FILE = path.join(PROJECT_ROOT, '..', 'openapi.yaml');

async function getCurrentVersion() {
  try {
    // Try to get version from package.json first
    const packageJsonPath = path.join(PROJECT_ROOT, '..', 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      if (packageJson.version) {
        return packageJson.version;
      }
    }
    
    // Fall back to OpenAPI spec
    return await getAPIVersion();
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Could not determine current version, using default'));
    return '1.0.0';
  }
}

async function getAPIVersion() {
  try {
    const openapiContent = await fs.readFile(OPENAPI_FILE, 'utf8');
    const versionMatch = openapiContent.match(/^version:\s*(.+)$/m);
    return versionMatch ? versionMatch[1].trim() : '1.0.0';
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Could not read API version, using default'));
    return '1.0.0';
  }
}

function getGitInfo() {
  try {
    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const branchName = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const isClean = execSync('git status --porcelain', { encoding: 'utf8' }).trim() === '';
    
    return { commitHash, branchName, isClean };
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Could not get git info, using defaults'));
    return { commitHash: 'unknown', branchName: 'unknown', isClean: false };
  }
}

function bumpVersion(currentVersion, bumpType, preReleaseTag = '') {
  let newVersion = currentVersion;
  
  try {
    switch (bumpType) {
      case 'major':
        newVersion = semver.inc(currentVersion, 'major');
        break;
      case 'minor':
        newVersion = semver.inc(currentVersion, 'minor');
        break;
      case 'patch':
        newVersion = semver.inc(currentVersion, 'patch');
        break;
      case 'prerelease':
        newVersion = semver.inc(currentVersion, 'prerelease', preReleaseTag || 'alpha');
        break;
      default:
        throw new Error(`Invalid bump type: ${bumpType}`);
    }
    
    // Add prerelease tag if specified
    if (preReleaseTag && bumpType !== 'prerelease') {
      newVersion = semver.inc(newVersion, 'prerelease', preReleaseTag);
    }
    
    return newVersion;
  } catch (error) {
    throw new Error(`Failed to bump version: ${error.message}`);
  }
}

async function updatePackageFiles(newVersion) {
  console.log(chalk.blue('📦 Updating package files...'));
  
  const filesToUpdate = [
    path.join(PROJECT_ROOT, '..', 'package.json'),
    path.join(PROJECT_ROOT, 'typescript-client', 'package.json'),
    path.join(PROJECT_ROOT, 'rust-client', 'Cargo.toml'),
  ];
  
  for (const filePath of filesToUpdate) {
    try {
      if (!await fs.pathExists(filePath)) {
        console.log(chalk.yellow(`⚠️  File not found: ${filePath}`));
        continue;
      }
      
      if (filePath.endsWith('package.json')) {
        const packageJson = await fs.readJson(filePath);
        packageJson.version = newVersion;
        await fs.writeJson(filePath, packageJson, { spaces: 2 });
        console.log(chalk.green(`✅ Updated ${filePath}`));
      } else if (filePath.endsWith('Cargo.toml')) {
        let content = await fs.readFile(filePath, 'utf8');
        content = content.replace(/^version = ".*"/m, `version = "${newVersion}"`);
        await fs.writeFile(filePath, content);
        console.log(chalk.green(`✅ Updated ${filePath}`));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Failed to update ${filePath}: ${error.message}`));
    }
  }
}

async function updateOpenAPIVersion(newVersion) {
  try {
    if (!await fs.pathExists(OPENAPI_FILE)) {
      console.log(chalk.yellow(`⚠️  OpenAPI file not found: ${OPENAPI_FILE}`));
      return;
    }
    
    let content = await fs.readFile(OPENAPI_FILE, 'utf8');
    content = content.replace(/^version:\s*.+$/m, `version: ${newVersion}`);
    await fs.writeFile(OPENAPI_FILE, content);
    console.log(chalk.green(`✅ Updated OpenAPI version to ${newVersion}`));
  } catch (error) {
    console.error(chalk.red(`❌ Failed to update OpenAPI version: ${error.message}`));
  }
}

async function commitVersionChanges(newVersion) {
  try {
    const gitInfo = getGitInfo();
    
    if (!gitInfo.isClean) {
      console.warn(chalk.yellow('⚠️  Working directory is not clean, skipping commit'));
      return;
    }
    
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "chore: bump version to ${newVersion}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"`, { stdio: 'inherit' });
    
    console.log(chalk.green(`✅ Committed version changes`));
  } catch (error) {
    console.error(chalk.red(`❌ Failed to commit changes: ${error.message}`));
  }
}

async function createGitTag(newVersion) {
  try {
    const tagName = `v${newVersion}`;
    execSync(`git tag -a ${tagName} -m "Version ${newVersion}"`, { stdio: 'inherit' });
    console.log(chalk.green(`✅ Created git tag: ${tagName}`));
  } catch (error) {
    console.error(chalk.red(`❌ Failed to create git tag: ${error.message}`));
  }
}

async function validateVersion(version) {
  try {
    if (!semver.valid(version)) {
      throw new Error(`Invalid semantic version: ${version}`);
    }
    
    console.log(chalk.green(`✅ Version ${version} is valid`));
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ Version validation failed: ${error.message}`));
    return false;
  }
}

async function showVersionInfo() {
  const currentVersion = await getCurrentVersion();
  const apiVersion = await getAPIVersion();
  const gitInfo = getGitInfo();
  
  console.log(chalk.blue('📋 Version Information:'));
  console.log(chalk.gray(`   Current Version: ${currentVersion}`));
  console.log(chalk.gray(`   API Version: ${apiVersion}`));
  console.log(chalk.gray(`   Git Branch: ${gitInfo.branchName}`));
  console.log(chalk.gray(`   Git Commit: ${gitInfo.commitHash}`));
  console.log(chalk.gray(`   Working Directory: ${gitInfo.isClean ? 'Clean' : 'Dirty'}`));
  
  // Show available bump options
  console.log('');
  console.log(chalk.blue('🔄 Available Version Bumps:'));
  console.log(chalk.gray(`   Major: ${semver.inc(currentVersion, 'major')}`));
  console.log(chalk.gray(`   Minor: ${semver.inc(currentVersion, 'minor')}`));
  console.log(chalk.gray(`   Patch: ${semver.inc(currentVersion, 'patch')}`));
  console.log(chalk.gray(`   Prerelease: ${semver.inc(currentVersion, 'prerelease', 'alpha')}`));
}

async function main() {
  console.log(chalk.cyan('🏷️  KALDRIX Version Manager'));
  console.log(chalk.cyan('========================='));
  
  try {
    if (options.current) {
      const version = await getCurrentVersion();
      console.log(version);
      return;
    }
    
    if (options.validate) {
      const version = options.fromApi ? await getAPIVersion() : await getCurrentVersion();
      await validateVersion(version);
      return;
    }
    
    if (options.bump) {
      const currentVersion = options.fromApi ? await getAPIVersion() : await getCurrentVersion();
      const newVersion = bumpVersion(currentVersion, options.bump, options.preRelease);
      
      console.log(chalk.blue('📋 Version Bump:'));
      console.log(chalk.gray(`   Current: ${currentVersion}`));
      console.log(chalk.gray(`   New: ${newVersion}`));
      console.log(chalk.gray(`   Bump Type: ${options.bump}`));
      if (options.preRelease) {
        console.log(chalk.gray(`   Prerelease Tag: ${options.preRelease}`));
      }
      
      if (options.updatePackages) {
        await updatePackageFiles(newVersion);
      }
      
      if (options.fromApi) {
        await updateOpenAPIVersion(newVersion);
      }
      
      if (options.commit) {
        await commitVersionChanges(newVersion);
      }
      
      if (options.tag) {
        await createGitTag(newVersion);
      }
      
      console.log('');
      console.log(chalk.green(`🎉 Version bumped to ${newVersion}`));
      return;
    }
    
    // Default behavior: show version info
    await showVersionInfo();
    
  } catch (error) {
    console.error(chalk.red(`❌ Version management failed: ${error.message}`));
    process.exit(1);
  }
}

main();