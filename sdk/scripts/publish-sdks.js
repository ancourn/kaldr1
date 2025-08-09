#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk').default;
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const program = new Command();

program
  .name('publish-sdks')
  .description('Publish KALDRIX SDKs to package registries')
  .option('--rust', 'Publish Rust SDK only')
  .option('--typescript', 'Publish TypeScript SDK only')
  .option('--all', 'Publish both Rust and TypeScript SDKs')
  .option('--dry-run', 'Dry run (do not actually publish)')
  .option('--pre-release', 'Publish as pre-release version')
  .option('--version <version>', 'Override version to publish')
  .option('--tag <tag>', 'Publish tag (e.g., next, latest, beta)')
  .parse();

const options = program.opts();

const PROJECT_ROOT = path.dirname(__dirname);
const OPENAPI_FILE = path.join(PROJECT_ROOT, '..', 'openapi.yaml');

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

async function getGitInfo() {
  try {
    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const branchName = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const runNumber = process.env.GITHUB_RUN_NUMBER || '0';
    
    return { commitHash, branchName, runNumber };
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Could not get git info, using defaults'));
    return { commitHash: 'unknown', branchName: 'unknown', runNumber: '0' };
  }
}

function generateVersion(apiVersion, gitInfo, isPreRelease = false) {
  if (options.version) {
    return options.version;
  }
  
  const { commitHash, branchName, runNumber } = gitInfo;
  
  if (isPreRelease) {
    if (branchName === 'main' || branchName === 'master') {
      return `${apiVersion}-rc.${runNumber}`;
    } else {
      const safeBranchName = branchName.replace(/[^a-zA-Z0-9.-]/g, '-');
      return `${apiVersion}-${safeBranchName}.${runNumber}`;
    }
  }
  
  return apiVersion;
}

async function publishTypeScriptSDK(version, tag = 'latest', isDryRun = false) {
  console.log(chalk.yellow('📦 Publishing TypeScript SDK...'));
  
  const tsDir = path.join(PROJECT_ROOT, 'typescript-client');
  
  try {
    // Check if we're in the right directory
    if (!await fs.pathExists(path.join(tsDir, 'package.json'))) {
      throw new Error('TypeScript SDK package.json not found');
    }
    
    // Update package.json version
    const packageJson = await fs.readJson(path.join(tsDir, 'package.json'));
    packageJson.version = version;
    await fs.writeJson(path.join(tsDir, 'package.json'), packageJson, { spaces: 2 });
    
    console.log(chalk.blue(`📋 Version updated to: ${version}`));
    console.log(chalk.blue(`📋 Publish tag: ${tag}`));
    
    if (isDryRun) {
      console.log(chalk.green('✅ Dry run - would publish to npm'));
      return true;
    }
    
    // Install dependencies
    execSync('npm install', { cwd: tsDir, stdio: 'inherit' });
    
    // Build the package
    execSync('npm run build', { cwd: tsDir, stdio: 'inherit' });
    
    // Publish to npm
    const publishCommand = `npm publish --access public --tag ${tag}`;
    execSync(publishCommand, { cwd: tsDir, stdio: 'inherit' });
    
    console.log(chalk.green('✅ TypeScript SDK published successfully!'));
    return true;
    
  } catch (error) {
    console.error(chalk.red(`❌ TypeScript SDK publishing failed: ${error.message}`));
    return false;
  }
}

async function publishRustSDK(version, isDryRun = false) {
  console.log(chalk.yellow('🦀 Publishing Rust SDK...'));
  
  const rustDir = path.join(PROJECT_ROOT, 'rust-client');
  
  try {
    // Check if we're in the right directory
    if (!await fs.pathExists(path.join(rustDir, 'Cargo.toml'))) {
      throw new Error('Rust SDK Cargo.toml not found');
    }
    
    // Update Cargo.toml version
    const cargoToml = await fs.readFile(path.join(rustDir, 'Cargo.toml'), 'utf8');
    const updatedCargoToml = cargoToml.replace(/^version = ".*"/m, `version = "${version}"`);
    await fs.writeFile(path.join(rustDir, 'Cargo.toml'), updatedCargoToml);
    
    console.log(chalk.blue(`📋 Version updated to: ${version}`));
    
    if (isDryRun) {
      console.log(chalk.green('✅ Dry run - would publish to crates.io'));
      return true;
    }
    
    // Check if cargo is available
    try {
      execSync('cargo --version', { stdio: 'ignore' });
    } catch (error) {
      throw new Error('Cargo is not available');
    }
    
    // Publish to crates.io
    execSync('cargo publish', { cwd: rustDir, stdio: 'inherit' });
    
    console.log(chalk.green('✅ Rust SDK published successfully!'));
    return true;
    
  } catch (error) {
    console.error(chalk.red(`❌ Rust SDK publishing failed: ${error.message}`));
    return false;
  }
}

async function validateEnvironment() {
  const requiredEnvVars = [];
  
  if (options.typescript || options.all) {
    requiredEnvVars.push('NPM_TOKEN');
  }
  
  if (options.rust || options.all) {
    requiredEnvVars.push('CARGO_REGISTRY_TOKEN');
  }
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(chalk.red(`❌ Missing environment variables: ${missingVars.join(', ')}`));
    console.error(chalk.yellow('💡 Set these variables in your environment or GitHub secrets'));
    return false;
  }
  
  return true;
}

async function main() {
  console.log(chalk.cyan('🚀 KALDRIX SDK Publisher'));
  console.log(chalk.cyan('======================='));
  
  // Validate environment
  if (!options.dryRun && !await validateEnvironment()) {
    process.exit(1);
  }
  
  const publishRust = options.rust || options.all;
  const publishTypeScript = options.typescript || options.all;
  
  if (!publishRust && !publishTypeScript) {
    console.log(chalk.yellow('📋 No SDK specified, publishing both...'));
    options.all = true;
    return main();
  }
  
  try {
    // Get version information
    const apiVersion = await getAPIVersion();
    const gitInfo = await getGitInfo();
    const version = generateVersion(apiVersion, gitInfo, options.preRelease);
    const tag = options.tag || (options.preRelease ? 'next' : 'latest');
    
    console.log(chalk.blue('📋 Publish Configuration:'));
    console.log(chalk.gray(`   API Version: ${apiVersion}`));
    console.log(chalk.gray(`   Publish Version: ${version}`));
    console.log(chalk.gray(`   Tag: ${tag}`));
    console.log(chalk.gray(`   Pre-release: ${options.preRelease}`));
    console.log(chalk.gray(`   Dry run: ${options.dryRun}`));
    console.log('');
    
    const results = {};
    
    // Publish TypeScript SDK
    if (publishTypeScript) {
      results.typescript = await publishTypeScriptSDK(version, tag, options.dryRun);
    }
    
    // Publish Rust SDK
    if (publishRust) {
      results.rust = await publishRustSDK(version, options.dryRun);
    }
    
    // Summary
    console.log('');
    console.log(chalk.blue('📊 Publish Summary:'));
    
    if (publishTypeScript) {
      const status = results.typescript ? chalk.green('✅ Success') : chalk.red('❌ Failed');
      console.log(chalk.gray(`   TypeScript SDK: ${status}`));
    }
    
    if (publishRust) {
      const status = results.rust ? chalk.green('✅ Success') : chalk.red('❌ Failed');
      console.log(chalk.gray(`   Rust SDK: ${status}`));
    }
    
    const allSuccess = Object.values(results).every(success => success);
    
    if (allSuccess) {
      console.log('');
      console.log(chalk.green('🎉 All SDKs published successfully!'));
      
      if (!options.dryRun) {
        console.log('');
        console.log(chalk.blue('📚 Next steps:'));
        console.log(chalk.gray('   1. Verify packages are available on registries'));
        console.log(chalk.gray('   2. Update documentation with new version'));
        console.log(chalk.gray('   3. Notify users about the new release'));
        console.log(chalk.gray('   4. Monitor for any issues'));
      }
    } else {
      console.log('');
      console.log(chalk.red('❌ Some SDKs failed to publish'));
      process.exit(1);
    }
    
  } catch (error) {
    console.error(chalk.red(`❌ Publishing failed: ${error.message}`));
    process.exit(1);
  }
}

main();