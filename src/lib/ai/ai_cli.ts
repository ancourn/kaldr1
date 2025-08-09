#!/usr/bin/env node

import { Command } from 'commander';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import Table from 'cli-table3';
import { WebSocket } from 'ws';

// Types
interface AIConfig {
  apiUrl: string;
  wsUrl: string;
  apiKey?: string;
  timeout: number;
}

interface AIQueryRequest {
  query: string;
  context?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface AIQueryResponse {
  response: string;
  confidence: number;
  model: string;
  processingTime: number;
  timestamp: string;
}

interface ContractAnalysisRequest {
  contractAddress: string;
  sourceCode?: string;
  analysisType: 'security' | 'performance' | 'optimization' | 'all';
}

interface ContractAnalysisResponse {
  vulnerabilities: Vulnerability[];
  optimizations: Optimization[];
  riskScore: number;
  gasEstimates: GasEstimate[];
  recommendations: string[];
}

interface Vulnerability {
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  line?: number;
  recommendation: string;
}

interface Optimization {
  type: string;
  description: string;
  estimatedGasSaving: number;
  priority: 'high' | 'medium' | 'low';
}

interface GasEstimate {
  function: string;
  currentGas: number;
  optimizedGas: number;
  savingPercentage: number;
}

interface PredictionRequest {
  type: 'risk' | 'throughput' | 'anomaly' | 'gas';
  timeframe: '1h' | '24h' | '7d' | '30d';
  data?: any;
}

interface PredictionResponse {
  predictions: Prediction[];
  confidence: number;
  model: string;
  timeframe: string;
  timestamp: string;
}

interface Prediction {
  timestamp: string;
  value: number;
  confidence: number;
  metadata?: any;
}

interface AnomalyQueryRequest {
  type: 'transaction' | 'contract' | 'network';
  timeframe: '1h' | '24h' | '7d' | '30d';
  threshold?: number;
}

interface AnomalyQueryResponse {
  anomalies: Anomaly[];
  totalAnomalies: number;
  severityDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface Anomaly {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  timestamp: string;
  metadata: any;
}

interface ModelInfo {
  id: string;
  name: string;
  type: 'transformer' | 'neural_network' | 'ensemble' | 'random_forest';
  version: string;
  status: 'active' | 'training' | 'inactive';
  accuracy: number;
  lastTrained: string;
  description: string;
}

interface ModelMetrics {
  modelId: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  latency: number;
  throughput: number;
  timestamp: string;
}

// CLI Class
class AICLI {
  private program: Command;
  private config: AIConfig;
  private configPath: string;
  private wsConnections: Map<string, WebSocket> = new Map();

  constructor() {
    this.program = new Command();
    this.configPath = path.join(process.cwd(), 'ai-config.json');
    this.config = { apiUrl: 'http://localhost:3001', wsUrl: 'ws://localhost:3001', timeout: 30000 };
    this.setupCommands();
  }

  private setupCommands() {
    this.program
      .name('kaldrix-ai')
      .description('KALDRIX AI Intelligence Layer CLI Tool')
      .version('1.0.0');

    // Configuration commands
    this.program
      .command('config')
      .description('Manage AI configuration')
      .option('--set <key=value>', 'Set configuration value')
      .option('--show', 'Show current configuration')
      .option('--init', 'Initialize configuration file')
      .action(this.handleConfig.bind(this));

    // AI Query commands
    this.program
      .command('query')
      .description('Ask AI a question about the blockchain')
      .requiredOption('--text <query>', 'Query text')
      .option('--context <context>', 'Additional context')
      .option('--model <model>', 'Model to use')
      .option('--temperature <number>', 'Temperature (0-1)', '0.7')
      .option('--max-tokens <number>', 'Maximum tokens', '500')
      .option('--stream', 'Stream response in real-time')
      .action(this.handleQuery.bind(this));

    // Contract analysis commands
    this.program
      .command('analyze-contract')
      .description('Analyze smart contract for vulnerabilities and optimizations')
      .requiredOption('--address <address>', 'Contract address')
      .option('--source <file>', 'Source code file path')
      .option('--type <type>', 'Analysis type (security|performance|optimization|all)', 'all')
      .option('--output <file>', 'Output file for results')
      .action(this.handleAnalyzeContract.bind(this));

    // Prediction commands
    this.program
      .command('predict')
      .description('Get AI predictions for various metrics')
      .requiredOption('--type <type>', 'Prediction type (risk|throughput|anomaly|gas)')
      .requiredOption('--timeframe <timeframe>', 'Timeframe (1h|24h|7d|30d)')
      .option('--data <file>', 'Input data file')
      .option('--output <file>', 'Output file for results')
      .action(this.handlePredict.bind(this));

    // Anomaly detection commands
    this.program
      .command('detect-anomalies')
      .description('Detect anomalies in blockchain data')
      .requiredOption('--type <type>', 'Anomaly type (transaction|contract|network)')
      .requiredOption('--timeframe <timeframe>', 'Timeframe (1h|24h|7d|30d)')
      .option('--threshold <number>', 'Detection threshold', '0.8')
      .option('--output <file>', 'Output file for results')
      .action(this.handleDetectAnomalies.bind(this));

    // Model management commands
    this.program
      .command('list-models')
      .description('List available AI models')
      .option('--type <type>', 'Filter by model type')
      .option('--status <status>', 'Filter by status')
      .action(this.handleListModels.bind(this));

    this.program
      .command('model-info')
      .description('Get detailed information about a specific model')
      .requiredOption('--id <modelId>', 'Model ID')
      .action(this.handleModelInfo.bind(this));

    this.program
      .command('model-metrics')
      .description('Get performance metrics for a model')
      .requiredOption('--id <modelId>', 'Model ID')
      .option('--timeframe <timeframe>', 'Timeframe for metrics', '24h')
      .action(this.handleModelMetrics.bind(this));

    // Real-time monitoring commands
    this.program
      .command('monitor')
      .description('Start real-time monitoring of AI predictions')
      .requiredOption('--type <type>', 'Monitoring type (risk|throughput|anomaly|all)')
      .option('--interval <seconds>', 'Update interval in seconds', '5')
      .option('--threshold <number>', 'Alert threshold', '0.8')
      .action(this.handleMonitor.bind(this));

    // Status and health commands
    this.program
      .command('status')
      .description('Show AI service status and health')
      .action(this.handleStatus.bind(this));

    this.program
      .command('health')
      .description('Check AI service health')
      .action(this.handleHealth.bind(this));

    // Analytics commands
    this.program
      .command('analytics')
      .description('Generate AI analytics report')
      .requiredOption('--type <type>', 'Report type (performance|security|usage|all)')
      .option('--timeframe <timeframe>', 'Timeframe for report', '24h')
      .option('--output <file>', 'Output file for report')
      .action(this.handleAnalytics.bind(this));
  }

  async run() {
    try {
      await this.loadConfig();
      await this.program.parseAsync(process.argv);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  }

  private async loadConfig() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(configData);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(chalk.yellow('Warning: Could not load AI config file'));
      }
    }
  }

  private async saveConfig() {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
      console.log(chalk.green('AI configuration saved successfully'));
    } catch (error) {
      console.error(chalk.red('Failed to save AI configuration:'), error.message);
    }
  }

  private async makeRequest(endpoint: string, data: any, method: 'GET' | 'POST' = 'POST') {
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const url = `${this.config.apiUrl}${endpoint}`;
      const response = await axios({
        method,
        url,
        data: method === 'POST' ? data : undefined,
        params: method === 'GET' ? data : undefined,
        headers,
        timeout: this.config.timeout,
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`API Error: ${error.response.status} - ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        throw new Error('Network Error: Unable to connect to AI service');
      } else {
        throw new Error(`Request Error: ${error.message}`);
      }
    }
  }

  private createWebSocketConnection(endpoint: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${this.config.wsUrl}${endpoint}`);
      
      ws.on('open', () => {
        resolve(ws);
      });

      ws.on('error', (error) => {
        reject(new Error(`WebSocket Error: ${error.message}`));
      });

      ws.on('close', () => {
        this.wsConnections.delete(endpoint);
      });
    });
  }

  // Command Handlers
  private async handleConfig(options: any) {
    if (options.init) {
      const defaultConfig: AIConfig = {
        apiUrl: 'http://localhost:3001',
        wsUrl: 'ws://localhost:3001',
        timeout: 30000,
      };
      await fs.writeFile(this.configPath, JSON.stringify(defaultConfig, null, 2));
      console.log(chalk.green('AI configuration file initialized'));
      return;
    }

    if (options.show) {
      console.log(chalk.blue('Current AI Configuration:'));
      console.log(JSON.stringify(this.config, null, 2));
      return;
    }

    if (options.set) {
      const [key, value] = options.set.split('=');
      if (key && value) {
        if (key === 'timeout') {
          (this.config as any)[key] = parseInt(value);
        } else {
          (this.config as any)[key] = value;
        }
        await this.saveConfig();
        console.log(chalk.green(`Set ${key} = ${value}`));
      } else {
        console.error(chalk.red('Invalid format. Use --set key=value'));
      }
      return;
    }

    console.log(chalk.blue('AI Configuration Options:'));
    console.log('  --init                    Initialize AI configuration file');
    console.log('  --show                    Show current AI configuration');
    console.log('  --set key=value           Set AI configuration value');
  }

  private async handleQuery(options: any) {
    try {
      console.log(chalk.blue('Querying AI...'));
      console.log(`Query: ${options.text}`);

      const request: AIQueryRequest = {
        query: options.text,
        context: options.context,
        model: options.model,
        temperature: parseFloat(options.temperature),
        maxTokens: parseInt(options.maxTokens),
      };

      if (options.stream) {
        const ws = await this.createWebSocketConnection('/ws/query');
        ws.send(JSON.stringify(request));

        ws.on('message', (data) => {
          const response = JSON.parse(data.toString());
          if (response.type === 'response') {
            process.stdout.write(response.content);
          } else if (response.type === 'complete') {
            console.log(chalk.green('\n\nQuery completed successfully'));
            ws.close();
          } else if (response.type === 'error') {
            console.error(chalk.red('\nError:'), response.message);
            ws.close();
          }
        });
      } else {
        const response = await this.makeRequest('/api/query', request);
        console.log(chalk.green('AI Response:'));
        console.log(response.response);
        console.log(chalk.gray(`\nModel: ${response.model} | Confidence: ${response.confidence} | Time: ${response.processingTime}ms`));
      }
    } catch (error) {
      console.error(chalk.red('Query failed:'), error.message);
    }
  }

  private async handleAnalyzeContract(options: any) {
    try {
      console.log(chalk.blue('Analyzing contract...'));
      console.log(`Address: ${options.address}`);

      let sourceCode;
      if (options.source) {
        sourceCode = await fs.readFile(options.source, 'utf-8');
      }

      const request: ContractAnalysisRequest = {
        contractAddress: options.address,
        sourceCode,
        analysisType: options.type,
      };

      const response = await this.makeRequest('/api/analyze-contract', request);
      
      if (options.output) {
        await fs.writeFile(options.output, JSON.stringify(response, null, 2));
        console.log(chalk.green(`Analysis saved to ${options.output}`));
      } else {
        this.displayContractAnalysis(response);
      }
    } catch (error) {
      console.error(chalk.red('Contract analysis failed:'), error.message);
    }
  }

  private displayContractAnalysis(response: ContractAnalysisResponse) {
    console.log(chalk.blue('\n=== Contract Analysis Results ==='));
    
    console.log(chalk.yellow(`\nRisk Score: ${response.riskScore}/10`));
    
    console.log(chalk.red('\nVulnerabilities:'));
    const vulnTable = new Table({
      head: ['Severity', 'Type', 'Description', 'Line'],
      colWidths: [10, 20, 40, 10],
    });
    
    response.vulnerabilities.forEach(vuln => {
      vulnTable.push([
        vuln.severity,
        vuln.type,
        vuln.description.substring(0, 37) + '...',
        vuln.line?.toString() || 'N/A',
      ]);
    });
    
    console.log(vulnTable.toString());
    
    console.log(chalk.green('\nOptimizations:'));
    const optTable = new Table({
      head: ['Type', 'Gas Saving', 'Priority'],
      colWidths: [30, 15, 10],
    });
    
    response.optimizations.forEach(opt => {
      optTable.push([
        opt.type,
        `${opt.estimatedGasSaving} gas`,
        opt.priority,
      ]);
    });
    
    console.log(optTable.toString());
    
    console.log(chalk.cyan('\nRecommendations:'));
    response.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }

  private async handlePredict(options: any) {
    try {
      console.log(chalk.blue('Generating predictions...'));
      console.log(`Type: ${options.type} | Timeframe: ${options.timeframe}`);

      let data;
      if (options.data) {
        const dataContent = await fs.readFile(options.data, 'utf-8');
        data = JSON.parse(dataContent);
      }

      const request: PredictionRequest = {
        type: options.type,
        timeframe: options.timeframe,
        data,
      };

      const response = await this.makeRequest('/api/predict', request);
      
      if (options.output) {
        await fs.writeFile(options.output, JSON.stringify(response, null, 2));
        console.log(chalk.green(`Predictions saved to ${options.output}`));
      } else {
        this.displayPredictions(response);
      }
    } catch (error) {
      console.error(chalk.red('Prediction failed:'), error.message);
    }
  }

  private displayPredictions(response: PredictionResponse) {
    console.log(chalk.blue('\n=== Prediction Results ==='));
    console.log(chalk.gray(`Model: ${response.model} | Confidence: ${response.confidence} | Timeframe: ${response.timeframe}`));
    
    const table = new Table({
      head: ['Timestamp', 'Value', 'Confidence'],
      colWidths: [25, 15, 15],
    });
    
    response.predictions.forEach(pred => {
      table.push([
        pred.timestamp,
        pred.value.toFixed(2),
        `${(pred.confidence * 100).toFixed(1)}%`,
      ]);
    });
    
    console.log(table.toString());
  }

  private async handleDetectAnomalies(options: any) {
    try {
      console.log(chalk.blue('Detecting anomalies...'));
      console.log(`Type: ${options.type} | Timeframe: ${options.timeframe}`);

      const request: AnomalyQueryRequest = {
        type: options.type,
        timeframe: options.timeframe,
        threshold: parseFloat(options.threshold),
      };

      const response = await this.makeRequest('/api/detect-anomalies', request);
      
      if (options.output) {
        await fs.writeFile(options.output, JSON.stringify(response, null, 2));
        console.log(chalk.green(`Anomaly detection results saved to ${options.output}`));
      } else {
        this.displayAnomalies(response);
      }
    } catch (error) {
      console.error(chalk.red('Anomaly detection failed:'), error.message);
    }
  }

  private displayAnomalies(response: AnomalyQueryResponse) {
    console.log(chalk.blue('\n=== Anomaly Detection Results ==='));
    console.log(chalk.yellow(`Total Anomalies: ${response.totalAnomalies}`));
    
    console.log(chalk.red('\nSeverity Distribution:'));
    const dist = response.severityDistribution;
    console.log(`Critical: ${dist.critical} | High: ${dist.high} | Medium: ${dist.medium} | Low: ${dist.low}`);
    
    console.log(chalk.red('\nDetected Anomalies:'));
    const table = new Table({
      head: ['ID', 'Type', 'Severity', 'Timestamp', 'Description'],
      colWidths: [15, 15, 10, 25, 35],
    });
    
    response.anomalies.forEach(anomaly => {
      table.push([
        anomaly.id,
        anomaly.type,
        anomaly.severity,
        anomaly.timestamp,
        anomaly.description.substring(0, 32) + '...',
      ]);
    });
    
    console.log(table.toString());
  }

  private async handleListModels(options: any) {
    try {
      console.log(chalk.blue('Listing AI models...'));

      const params: any = {};
      if (options.type) params.type = options.type;
      if (options.status) params.status = options.status;

      const response = await this.makeRequest('/api/models', params, 'GET');
      
      const table = new Table({
        head: ['ID', 'Name', 'Type', 'Version', 'Status', 'Accuracy', 'Last Trained'],
        colWidths: [15, 20, 15, 10, 10, 10, 20],
      });
      
      response.models.forEach((model: ModelInfo) => {
        table.push([
          model.id,
          model.name,
          model.type,
          model.version,
          model.status,
          `${(model.accuracy * 100).toFixed(1)}%`,
          new Date(model.lastTrained).toLocaleDateString(),
        ]);
      });
      
      console.log(table.toString());
    } catch (error) {
      console.error(chalk.red('Failed to list models:'), error.message);
    }
  }

  private async handleModelInfo(options: any) {
    try {
      console.log(chalk.blue(`Getting model info for: ${options.id}`));

      const response = await this.makeRequest(`/api/models/${options.id}`, {}, 'GET');
      
      console.log(chalk.blue('\n=== Model Information ==='));
      console.log(`ID: ${response.id}`);
      console.log(`Name: ${response.name}`);
      console.log(`Type: ${response.type}`);
      console.log(`Version: ${response.version}`);
      console.log(`Status: ${response.status}`);
      console.log(`Accuracy: ${(response.accuracy * 100).toFixed(1)}%`);
      console.log(`Last Trained: ${new Date(response.lastTrained).toLocaleString()}`);
      console.log(`\nDescription: ${response.description}`);
      
      if (response.parameters) {
        console.log(chalk.yellow('\nParameters:'));
        Object.entries(response.parameters).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }
    } catch (error) {
      console.error(chalk.red('Failed to get model info:'), error.message);
    }
  }

  private async handleModelMetrics(options: any) {
    try {
      console.log(chalk.blue(`Getting metrics for model: ${options.id}`));

      const response = await this.makeRequest(`/api/models/${options.id}/metrics`, { timeframe: options.timeframe }, 'GET');
      
      console.log(chalk.blue('\n=== Model Performance Metrics ==='));
      console.log(`Model ID: ${response.modelId}`);
      console.log(`Timeframe: ${options.timeframe}`);
      console.log(`Timestamp: ${new Date(response.timestamp).toLocaleString()}`);
      
      console.log(chalk.yellow('\nPerformance Metrics:'));
      const table = new Table({
        head: ['Metric', 'Value'],
        colWidths: [15, 15],
      });
      
      table.push(['Accuracy', `${(response.accuracy * 100).toFixed(2)}%`]);
      table.push(['Precision', `${(response.precision * 100).toFixed(2)}%`]);
      table.push(['Recall', `${(response.recall * 100).toFixed(2)}%`]);
      table.push(['F1 Score', `${(response.f1Score * 100).toFixed(2)}%`]);
      table.push(['Latency', `${response.latency.toFixed(2)}ms`]);
      table.push(['Throughput', `${response.throughput.toFixed(2)}/s`]);
      
      console.log(table.toString());
    } catch (error) {
      console.error(chalk.red('Failed to get model metrics:'), error.message);
    }
  }

  private async handleMonitor(options: any) {
    try {
      console.log(chalk.blue(`Starting real-time monitoring...`));
      console.log(`Type: ${options.type} | Interval: ${options.interval}s | Threshold: ${options.threshold}`);

      const ws = await this.createWebSocketConnection('/ws/monitor');
      
      const monitorConfig = {
        type: options.type,
        interval: parseInt(options.interval),
        threshold: parseFloat(options.threshold),
      };
      
      ws.send(JSON.stringify(monitorConfig));

      ws.on('message', (data) => {
        const response = JSON.parse(data.toString());
        
        if (response.type === 'update') {
          console.log(chalk.blue(`\n[${new Date().toLocaleTimeString()}] Update:`));
          console.log(`Type: ${response.data.type}`);
          console.log(`Value: ${response.data.value}`);
          console.log(`Confidence: ${response.data.confidence}`);
          
          if (response.data.alert) {
            console.log(chalk.red(`🚨 ALERT: ${response.data.alert}`));
          }
        } else if (response.type === 'error') {
          console.error(chalk.red('Monitor Error:'), response.message);
          ws.close();
        }
      });

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\nStopping monitoring...'));
        ws.close();
        process.exit(0);
      });

      console.log(chalk.green('Monitoring started. Press Ctrl+C to stop.'));
    } catch (error) {
      console.error(chalk.red('Failed to start monitoring:'), error.message);
    }
  }

  private async handleStatus() {
    try {
      console.log(chalk.blue('Getting AI service status...'));

      const response = await this.makeRequest('/api/status', {}, 'GET');
      
      console.log(chalk.blue('\n=== AI Service Status ==='));
      console.log(`Status: ${response.status}`);
      console.log(`Version: ${response.version}`);
      console.log(`Uptime: ${response.uptime}`);
      console.log(`Last Update: ${new Date(response.lastUpdate).toLocaleString()}`);
      
      console.log(chalk.yellow('\nActive Models:'));
      response.activeModels.forEach((model: string) => {
        console.log(`  - ${model}`);
      });
      
      console.log(chalk.green('\nSystem Metrics:'));
      console.log(`CPU Usage: ${response.systemMetrics.cpu}%`);
      console.log(`Memory Usage: ${response.systemMetrics.memory}%`);
      console.log(`Active Connections: ${response.systemMetrics.connections}`);
      console.log(`Requests/min: ${response.systemMetrics.requestsPerMinute}`);
    } catch (error) {
      console.error(chalk.red('Failed to get status:'), error.message);
    }
  }

  private async handleHealth() {
    try {
      console.log(chalk.blue('Checking AI service health...'));

      const response = await this.makeRequest('/api/health', {}, 'GET');
      
      if (response.healthy) {
        console.log(chalk.green('✅ AI Service is healthy'));
        console.log(`Response Time: ${response.responseTime}ms`);
        console.log(`Status: ${response.status}`);
        
        if (response.checks) {
          console.log(chalk.yellow('\nHealth Checks:'));
          response.checks.forEach((check: any) => {
            const status = check.healthy ? chalk.green('✅') : chalk.red('❌');
            console.log(`  ${status} ${check.name}: ${check.message}`);
          });
        }
      } else {
        console.log(chalk.red('❌ AI Service is unhealthy'));
        console.log(`Status: ${response.status}`);
        console.log(`Error: ${response.error}`);
      }
    } catch (error) {
      console.error(chalk.red('Health check failed:'), error.message);
    }
  }

  private async handleAnalytics(options: any) {
    try {
      console.log(chalk.blue('Generating analytics report...'));
      console.log(`Type: ${options.type} | Timeframe: ${options.timeframe}`);

      const response = await this.makeRequest('/api/analytics', {
        type: options.type,
        timeframe: options.timeframe,
      });
      
      if (options.output) {
        await fs.writeFile(options.output, JSON.stringify(response, null, 2));
        console.log(chalk.green(`Analytics report saved to ${options.output}`));
      } else {
        this.displayAnalytics(response);
      }
    } catch (error) {
      console.error(chalk.red('Analytics generation failed:'), error.message);
    }
  }

  private displayAnalytics(response: any) {
    console.log(chalk.blue('\n=== Analytics Report ==='));
    console.log(`Report Type: ${response.type}`);
    console.log(`Timeframe: ${response.timeframe}`);
    console.log(`Generated: ${new Date(response.generatedAt).toLocaleString()}`);
    
    if (response.summary) {
      console.log(chalk.yellow('\nSummary:'));
      Object.entries(response.summary).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    }
    
    if (response.metrics) {
      console.log(chalk.green('\nMetrics:'));
      const table = new Table({
        head: ['Metric', 'Value', 'Change'],
        colWidths: [20, 15, 15],
      });
      
      response.metrics.forEach((metric: any) => {
        const change = metric.change >= 0 ? `+${metric.change}%` : `${metric.change}%`;
        table.push([metric.name, metric.value, change]);
      });
      
      console.log(table.toString());
    }
    
    if (response.insights) {
      console.log(chalk.cyan('\nInsights:'));
      response.insights.forEach((insight: string, index: number) => {
        console.log(`${index + 1}. ${insight}`);
      });
    }
    
    if (response.recommendations) {
      console.log(chalk.magenta('\nRecommendations:'));
      response.recommendations.forEach((rec: string, index: number) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
  }
}

// Main execution
if (require.main === module) {
  const cli = new AICLI();
  cli.run().catch(console.error);
}

export default AICLI;