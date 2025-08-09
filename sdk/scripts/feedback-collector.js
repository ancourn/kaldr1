#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk').default;
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const program = new Command();

program
  .name('feedback-collector')
  .description('Collect and manage SDK developer feedback')
  .option('--collect', 'Collect feedback from developers')
  .option('--show', 'Show collected feedback')
  .option('--export <format>', 'Export feedback in format (json, csv, markdown)', 'json')
  .option('--analyze', 'Analyze feedback data')
  .option('--report', 'Generate feedback report')
  .option('--clear', 'Clear all feedback data')
  .option('--sdk <type>', 'Filter by SDK type (rust, typescript, all)', 'all')
  .parse();

const options = program.opts();

const PROJECT_ROOT = path.dirname(__dirname);
const FEEDBACK_DIR = path.join(PROJECT_ROOT, 'feedback');
const FEEDBACK_FILE = path.join(FEEDBACK_DIR, 'feedback.json');
const ANALYSIS_FILE = path.join(FEEDBACK_DIR, 'analysis.json');
const REPORT_FILE = path.join(FEEDBACK_DIR, 'report.md');

async function ensureFeedbackDir() {
  await fs.ensureDir(FEEDBACK_DIR);
  
  if (!await fs.pathExists(FEEDBACK_FILE)) {
    await fs.writeJson(FEEDBACK_FILE, [], { spaces: 2 });
  }
}

async function collectFeedback() {
  console.log(chalk.yellow('📝 Collecting SDK developer feedback...'));
  
  const questions = [
    {
      name: 'sdk_type',
      type: 'list',
      message: 'Which SDK are you providing feedback for?',
      choices: ['Rust SDK', 'TypeScript SDK', 'Both SDKs'],
      default: 'TypeScript SDK'
    },
    {
      name: 'usage_duration',
      type: 'list',
      message: 'How long have you been using the SDK?',
      choices: ['Less than a week', '1-4 weeks', '1-3 months', '3-6 months', 'More than 6 months'],
      default: '1-4 weeks'
    },
    {
      name: 'overall_satisfaction',
      type: 'list',
      message: 'Overall satisfaction with the SDK?',
      choices: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'],
      default: 'Satisfied'
    },
    {
      name: 'ease_of_use',
      type: 'list',
      message: 'How easy is the SDK to use?',
      choices: ['Very Easy', 'Easy', 'Neutral', 'Difficult', 'Very Difficult'],
      default: 'Easy'
    },
    {
      name: 'documentation_quality',
      type: 'list',
      message: 'How would you rate the documentation quality?',
      choices: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'],
      default: 'Good'
    },
    {
      name: 'performance',
      type: 'list',
      message: 'How would you rate the SDK performance?',
      choices: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'],
      default: 'Good'
    },
    {
      name: 'reliability',
      type: 'list',
      message: 'How reliable is the SDK?',
      choices: ['Very Reliable', 'Reliable', 'Neutral', 'Unreliable', 'Very Unreliable'],
      default: 'Reliable'
    },
    {
      name: 'features',
      type: 'checkbox',
      message: 'Which features do you use most? (Select all that apply)',
      choices: [
        'Health Check API',
        'Chat Completion',
        'Image Generation',
        'Web Search',
        'Error Handling',
        'Authentication',
        'Type Safety',
        'Async Support'
      ],
      default: ['Health Check API', 'Chat Completion']
    },
    {
      name: 'strengths',
      type: 'input',
      message: 'What do you like most about the SDK?',
      validate: input => input.trim().length > 0 || 'Please provide at least one strength'
    },
    {
      name: 'improvements',
      type: 'input',
      message: 'What would you like to see improved?',
      validate: input => input.trim().length > 0 || 'Please provide at least one improvement suggestion'
    },
    {
      name: 'bugs',
      type: 'input',
      message: 'Have you encountered any bugs? Please describe:',
      default: 'No bugs encountered'
    },
    {
      name: 'recommendation',
      type: 'list',
      message: 'Would you recommend this SDK to others?',
      choices: ['Definitely', 'Probably', 'Maybe', 'Probably Not', 'Definitely Not'],
      default: 'Probably'
    },
    {
      name: 'additional_comments',
      type: 'input',
      message: 'Any additional comments or suggestions?',
      default: 'No additional comments'
    },
    {
      name: 'email',
      type: 'input',
      message: 'Email (optional, for follow-up questions):',
      default: ''
    }
  ];

  // Simple interactive feedback collection (non-interactive mode)
  console.log(chalk.blue('📋 Feedback Questions:'));
  console.log(chalk.gray('Please answer the following questions about your SDK experience:'));
  console.log('');

  const feedback = {
    id: generateFeedbackId(),
    timestamp: new Date().toISOString(),
    git_commit: getCurrentGitCommit(),
    git_branch: getCurrentGitBranch(),
    answers: {}
  };

  // For simplicity, we'll use a basic approach
  // In a real implementation, you might use a proper CLI prompt library
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  for (const question of questions) {
    const answer = await askQuestion(rl, question);
    feedback.answers[question.name] = answer;
  }

  rl.close();

  // Save feedback
  await saveFeedback(feedback);
  
  console.log('');
  console.log(chalk.green('✅ Thank you for your feedback!'));
  console.log(chalk.gray(`Feedback ID: ${feedback.id}`));
}

function askQuestion(rl, question) {
  return new Promise((resolve) => {
    const prompt = `${question.message}\n`;
    
    if (question.type === 'list') {
      console.log(prompt);
      question.choices.forEach((choice, index) => {
        console.log(`  ${index + 1}. ${choice}`);
      });
      console.log('');
      
      rl.question(`Your choice (1-${question.choices.length}): `, (answer) => {
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < question.choices.length) {
          resolve(question.choices[index]);
        } else {
          resolve(question.default);
        }
      });
    } else if (question.type === 'checkbox') {
      console.log(prompt);
      question.choices.forEach((choice, index) => {
        console.log(`  ${index + 1}. ${choice}`);
      });
      console.log('');
      
      rl.question('Select numbers (comma-separated): ', (answer) => {
        const selected = answer.split(',').map(num => {
          const index = parseInt(num.trim()) - 1;
          return index >= 0 && index < question.choices.length ? question.choices[index] : null;
        }).filter(Boolean);
        
        resolve(selected.length > 0 ? selected : question.default);
      });
    } else {
      rl.question(`${prompt} (${question.default}): `, (answer) => {
        resolve(answer.trim() || question.default);
      });
    }
  });
}

function generateFeedbackId() {
  return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getCurrentGitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

function getCurrentGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

async function saveFeedback(feedback) {
  await ensureFeedbackDir();
  
  const existingFeedback = await fs.readJson(FEEDBACK_FILE);
  existingFeedback.push(feedback);
  
  await fs.writeJson(FEEDBACK_FILE, existingFeedback, { spaces: 2 });
}

async function showFeedback() {
  await ensureFeedbackDir();
  
  const feedback = await fs.readJson(FEEDBACK_FILE);
  
  if (feedback.length === 0) {
    console.log(chalk.yellow('ℹ️  No feedback collected yet.'));
    return;
  }
  
  console.log(chalk.blue('📊 Collected Feedback:'));
  console.log(chalk.gray(`Total feedback entries: ${feedback.length}`));
  console.log('');
  
  feedback.forEach((entry, index) => {
    console.log(chalk.cyan(`Feedback #${index + 1} (${entry.id})`));
    console.log(chalk.gray(`  Timestamp: ${entry.timestamp}`));
    console.log(chalk.gray(`  SDK Type: ${entry.answers.sdk_type}`));
    console.log(chalk.gray(`  Satisfaction: ${entry.answers.overall_satisfaction}`));
    console.log(chalk.gray(`  Recommendation: ${entry.answers.recommendation}`));
    console.log('');
  });
}

async function exportFeedback(format) {
  await ensureFeedbackDir();
  
  const feedback = await fs.readJson(FEEDBACK_FILE);
  
  if (feedback.length === 0) {
    console.log(chalk.yellow('ℹ️  No feedback to export.'));
    return;
  }
  
  const timestamp = new Date().toISOString().split('T')[0];
  const exportFile = path.join(FEEDBACK_DIR, `feedback_export_${timestamp}.${format}`);
  
  switch (format) {
    case 'json':
      await fs.writeJson(exportFile, feedback, { spaces: 2 });
      break;
      
    case 'csv':
      const csvHeader = 'ID,Timestamp,SDK Type,Usage Duration,Overall Satisfaction,Ease of Use,Documentation Quality,Performance,Reliability,Features,Strengths,Improvements,Bugs,Recommendation,Email\n';
      const csvRows = feedback.map(entry => {
        return [
          entry.id,
          entry.timestamp,
          entry.answers.sdk_type,
          entry.answers.usage_duration,
          entry.answers.overall_satisfaction,
          entry.answers.ease_of_use,
          entry.answers.documentation_quality,
          entry.answers.performance,
          entry.answers.reliability,
          Array.isArray(entry.answers.features) ? entry.answers.features.join(';') : entry.answers.features,
          `"${entry.answers.strengths.replace(/"/g, '""')}"`,
          `"${entry.answers.improvements.replace(/"/g, '""')}"`,
          `"${entry.answers.bugs.replace(/"/g, '""')}"`,
          entry.answers.recommendation,
          entry.answers.email
        ].join(',');
      });
      
      await fs.writeFile(exportFile, csvHeader + csvRows.join('\n'));
      break;
      
    case 'markdown':
      let markdown = '# SDK Feedback Export\n\n';
      markdown += `Generated on: ${new Date().toISOString()}\n`;
      markdown += `Total entries: ${feedback.length}\n\n`;
      
      feedback.forEach((entry, index) => {
        markdown += `## Feedback #${index + 1}\n\n`;
        markdown += `- **ID**: ${entry.id}\n`;
        markdown += `- **Timestamp**: ${entry.timestamp}\n`;
        markdown += `- **SDK Type**: ${entry.answers.sdk_type}\n`;
        markdown += `- **Usage Duration**: ${entry.answers.usage_duration}\n`;
        markdown += `- **Overall Satisfaction**: ${entry.answers.overall_satisfaction}\n`;
        markdown += `- **Ease of Use**: ${entry.answers.ease_of_use}\n`;
        markdown += `- **Documentation Quality**: ${entry.answers.documentation_quality}\n`;
        markdown += `- **Performance**: ${entry.answers.performance}\n`;
        markdown += `- **Reliability**: ${entry.answers.reliability}\n`;
        markdown += `- **Features**: ${Array.isArray(entry.answers.features) ? entry.answers.features.join(', ') : entry.answers.features}\n`;
        markdown += `- **Strengths**: ${entry.answers.strengths}\n`;
        markdown += `- **Improvements**: ${entry.answers.improvements}\n`;
        markdown += `- **Bugs**: ${entry.answers.bugs}\n`;
        markdown += `- **Recommendation**: ${entry.answers.recommendation}\n`;
        markdown += `- **Email**: ${entry.answers.email || 'N/A'}\n\n`;
      });
      
      await fs.writeFile(exportFile, markdown);
      break;
      
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
  
  console.log(chalk.green(`✅ Feedback exported to: ${exportFile}`));
}

async function analyzeFeedback() {
  await ensureFeedbackDir();
  
  const feedback = await fs.readJson(FEEDBACK_FILE);
  
  if (feedback.length === 0) {
    console.log(chalk.yellow('ℹ️  No feedback to analyze.'));
    return;
  }
  
  const analysis = {
    total_entries: feedback.length,
    analysis_date: new Date().toISOString(),
    sdk_types: {},
    satisfaction_ratings: {},
    ease_of_use_ratings: {},
    documentation_ratings: {},
    performance_ratings: {},
    reliability_ratings: {},
    recommendation_rates: {},
    common_features: {},
    common_strengths: [],
    common_improvements: [],
    common_bugs: [],
    usage_durations: {}
  };
  
  // Analyze each feedback entry
  feedback.forEach(entry => {
    const answers = entry.answers;
    
    // SDK types
    analysis.sdk_types[answers.sdk_type] = (analysis.sdk_types[answers.sdk_type] || 0) + 1;
    
    // Ratings
    analysis.satisfaction_ratings[answers.overall_satisfaction] = (analysis.satisfaction_ratings[answers.overall_satisfaction] || 0) + 1;
    analysis.ease_of_use_ratings[answers.ease_of_use] = (analysis.ease_of_use_ratings[answers.ease_of_use] || 0) + 1;
    analysis.documentation_ratings[answers.documentation_quality] = (analysis.documentation_ratings[answers.documentation_quality] || 0) + 1;
    analysis.performance_ratings[answers.performance] = (analysis.performance_ratings[answers.performance] || 0) + 1;
    analysis.reliability_ratings[answers.reliability] = (analysis.reliability_ratings[answers.reliability] || 0) + 1;
    analysis.recommendation_rates[answers.recommendation] = (analysis.recommendation_rates[answers.recommendation] || 0) + 1;
    
    // Usage durations
    analysis.usage_durations[answers.usage_duration] = (analysis.usage_durations[answers.usage_duration] || 0) + 1;
    
    // Features
    const features = Array.isArray(answers.features) ? answers.features : [answers.features];
    features.forEach(feature => {
      analysis.common_features[feature] = (analysis.common_features[feature] || 0) + 1;
    });
    
    // Text feedback
    analysis.common_strengths.push(answers.strengths);
    analysis.common_improvements.push(answers.improvements);
    if (answers.bugs && answers.bugs !== 'No bugs encountered') {
      analysis.common_bugs.push(answers.bugs);
    }
  });
  
  // Sort features by usage
  analysis.common_features = Object.entries(analysis.common_features)
    .sort(([,a], [,b]) => b - a)
    .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});
  
  await fs.writeJson(ANALYSIS_FILE, analysis, { spaces: 2 });
  
  console.log(chalk.green('✅ Feedback analysis completed'));
  console.log(chalk.gray(`Analysis saved to: ${ANALYSIS_FILE}`));
  
  // Show summary
  console.log('');
  console.log(chalk.blue('📊 Analysis Summary:'));
  console.log(chalk.gray(`   Total feedback entries: ${analysis.total_entries}`));
  console.log(chalk.gray(`   Most used SDK: ${Object.keys(analysis.sdk_types).reduce((a, b) => analysis.sdk_types[a] > analysis.sdk_types[b] ? a : b)}`));
  console.log(chalk.gray(`   Satisfaction rate: ${Math.round((analysis.satisfaction_ratings['Very Satisfied'] + analysis.satisfaction_ratings['Satisfied']) / analysis.total_entries * 100)}%`));
  console.log(chalk.gray(`   Recommendation rate: ${Math.round((analysis.recommendation_rates['Definitely'] + analysis.recommendation_rates['Probably']) / analysis.total_entries * 100)}%`));
}

async function generateReport() {
  await ensureFeedbackDir();
  
  if (!await fs.pathExists(ANALYSIS_FILE)) {
    console.log(chalk.yellow('ℹ️  No analysis data found. Run analysis first.'));
    return;
  }
  
  const analysis = await fs.readJson(ANALYSIS_FILE);
  
  let report = '# SDK Developer Feedback Report\n\n';
  report += `Generated on: ${analysis.analysis_date}\n`;
  report += `Total feedback entries: ${analysis.total_entries}\n\n`;
  
  // Executive Summary
  report += '## Executive Summary\n\n';
  const satisfactionRate = Math.round((analysis.satisfaction_ratings['Very Satisfied'] + analysis.satisfaction_ratings['Satisfied']) / analysis.total_entries * 100);
  const recommendationRate = Math.round((analysis.recommendation_rates['Definitely'] + analysis.recommendation_rates['Probably']) / analysis.total_entries * 100);
  
  report += `- **Overall Satisfaction Rate**: ${satisfactionRate}%\n`;
  report += `- **Recommendation Rate**: ${recommendationRate}%\n`;
  report += `- **Most Popular SDK**: ${Object.keys(analysis.sdk_types).reduce((a, b) => analysis.sdk_types[a] > analysis.sdk_types[b] ? a : b)}\n\n`;
  
  // SDK Usage
  report += '## SDK Usage Distribution\n\n';
  Object.entries(analysis.sdk_types).forEach(([sdk, count]) => {
    const percentage = Math.round(count / analysis.total_entries * 100);
    report += `- **${sdk}**: ${count} users (${percentage}%)\n`;
  });
  report += '\n';
  
  // Satisfaction Ratings
  report += '## Satisfaction Ratings\n\n';
  Object.entries(analysis.satisfaction_ratings).forEach(([rating, count]) => {
    const percentage = Math.round(count / analysis.total_entries * 100);
    report += `- **${rating}**: ${count} (${percentage}%)\n`;
  });
  report += '\n';
  
  // Feature Usage
  report += '## Most Used Features\n\n';
  Object.entries(analysis.common_features).forEach(([feature, count]) => {
    const percentage = Math.round(count / analysis.total_entries * 100);
    report += `${percentage}% - ${feature}\n`;
  });
  report += '\n';
  
  // Common Strengths
  report += '## Common Strengths\n\n';
  report += 'Developers frequently mentioned these strengths:\n\n';
  analysis.common_strengths.slice(0, 5).forEach(strength => {
    report += `- ${strength}\n`;
  });
  report += '\n';
  
  // Common Improvements
  report += '## Requested Improvements\n\n';
  report += 'Developers suggested these improvements:\n\n';
  analysis.common_improvements.slice(0, 5).forEach(improvement => {
    report += `- ${improvement}\n`;
  });
  report += '\n';
  
  // Common Bugs
  if (analysis.common_bugs.length > 0) {
    report += '## Common Bugs\n\n';
    report += 'Developers reported these bugs:\n\n';
    analysis.common_bugs.slice(0, 5).forEach(bug => {
      report += `- ${bug}\n`;
    });
    report += '\n';
  }
  
  // Recommendations
  report += '## Recommendations\n\n';
  Object.entries(analysis.recommendation_rates).forEach(([rating, count]) => {
    const percentage = Math.round(count / analysis.total_entries * 100);
    report += `- **${rating}**: ${count} (${percentage}%)\n`;
  });
  report += '\n';
  
  // Next Steps
  report += '## Next Steps\n\n';
  report += 'Based on this feedback, we recommend:\n\n';
  report += '1. Focus on improving documentation quality\n';
  report += '2. Address the most commonly reported bugs\n';
  report += '3. Implement the most requested improvements\n';
  report += '4. Continue to enhance the most-used features\n';
  report += '5. Monitor satisfaction rates over time\n\n';
  
  report += '---\n';
  report += '🤖 Generated with [Claude Code](https://claude.ai/code)\n';
  
  await fs.writeFile(REPORT_FILE, report);
  
  console.log(chalk.green('✅ Feedback report generated'));
  console.log(chalk.gray(`Report saved to: ${REPORT_FILE}`));
}

async function clearFeedback() {
  await ensureFeedbackDir();
  
  const feedback = await fs.readJson(FEEDBACK_FILE);
  
  if (feedback.length === 0) {
    console.log(chalk.yellow('ℹ️  No feedback to clear.'));
    return;
  }
  
  console.log(chalk.yellow('⚠️  This will permanently delete all feedback data.'));
  console.log(chalk.gray(`Total feedback entries to delete: ${feedback.length}`));
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
    rl.close();
    
    if (answer.toLowerCase() === 'yes') {
      fs.writeJson(FEEDBACK_FILE, [], { spaces: 2 })
        .then(() => {
          console.log(chalk.green('✅ All feedback data cleared.'));
        })
        .catch(error => {
          console.error(chalk.red(`❌ Failed to clear feedback: ${error.message}`));
        });
    } else {
      console.log(chalk.blue('ℹ️  Feedback data not cleared.'));
    }
  });
}

async function main() {
  console.log(chalk.cyan('📝 KALDRIX SDK Feedback Collector'));
  console.log(chalk.cyan('================================='));
  
  await ensureFeedbackDir();
  
  try {
    if (options.collect) {
      await collectFeedback();
    } else if (options.show) {
      await showFeedback();
    } else if (options.export) {
      await exportFeedback(options.export);
    } else if (options.analyze) {
      await analyzeFeedback();
    } else if (options.report) {
      await generateReport();
    } else if (options.clear) {
      await clearFeedback();
    } else {
      console.log(chalk.blue('📋 Available Commands:'));
      console.log(chalk.gray('   --collect      Collect feedback from developers'));
      console.log(chalk.gray('   --show         Show collected feedback'));
      console.log(chalk.gray('   --export       Export feedback (json, csv, markdown)'));
      console.log(chalk.gray('   --analyze      Analyze feedback data'));
      console.log(chalk.gray('   --report       Generate feedback report'));
      console.log(chalk.gray('   --clear        Clear all feedback data'));
      console.log('');
      console.log(chalk.blue('📋 Examples:'));
      console.log(chalk.gray('   node feedback-collector.js --collect'));
      console.log(chalk.gray('   node feedback-collector.js --show'));
      console.log(chalk.gray('   node feedback-collector.js --export csv'));
      console.log(chalk.gray('   node feedback-collector.js --analyze'));
      console.log(chalk.gray('   node feedback-collector.js --report'));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Feedback collection failed: ${error.message}`));
    process.exit(1);
  }
}

main();