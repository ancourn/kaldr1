// MARK: - Common Test Configuration

// Test environment configuration
export const testConfig = {
  // General settings
  timeout: 30000, // 30 seconds default timeout
  retries: 3, // Number of retries for failed tests
  parallel: true, // Run tests in parallel when possible
  
  // Network settings
  network: {
    defaultNetwork: 'testnet',
    rpcTimeout: 10000, // 10 seconds
    blockTimeout: 30000, // 30 seconds
    gasLimit: 21000,
    gasPrice: 'auto'
  },
  
  // Wallet settings
  wallet: {
    defaultName: 'Test Wallet',
    encryptionEnabled: true,
    backupRequired: true,
    maxWallets: 10
  },
  
  // Transaction settings
  transaction: {
    defaultAmount: 100.0,
    minAmount: 0.001,
    maxAmount: 1000000.0,
    confirmationsRequired: 1,
    maxRetries: 3
  },
  
  // Performance settings
  performance: {
    maxExecutionTime: 5000, // 5 seconds
    maxMemoryUsage: 100, // 100 MB
    maxCpuUsage: 80, // 80%
    sampleSize: 100 // Number of samples for performance tests
  },
  
  // Coverage settings
  coverage: {
    enabled: true,
    threshold: 90, // 90% coverage required
    reportFormat: ['lcov', 'html'],
    exclude: [
      '**/node_modules/**',
      '**/test/**',
      '**/dist/**',
      '**/build/**'
    ]
  },
  
  // Reporting settings
  reporting: {
    format: ['junit', 'html', 'console'],
    outputDir: './test-reports',
    screenshots: true,
    videos: false,
    verbose: false
  }
};

// Test categories configuration
export const testCategories = {
  unit: {
    name: 'Unit Tests',
    description: 'Individual component tests',
    timeout: 10000,
    parallel: true,
    coverage: true
  },
  
  integration: {
    name: 'Integration Tests',
    description: 'Component interaction tests',
    timeout: 30000,
    parallel: false,
    coverage: true
  },
  
  ui: {
    name: 'UI Tests',
    description: 'User interface tests',
    timeout: 60000,
    parallel: false,
    coverage: false,
    screenshots: true
  },
  
  performance: {
    name: 'Performance Tests',
    description: 'Performance and load tests',
    timeout: 120000,
    parallel: false,
    coverage: false,
    metrics: true
  },
  
  security: {
    name: 'Security Tests',
    description: 'Security vulnerability tests',
    timeout: 60000,
    parallel: false,
    coverage: false
  },
  
  e2e: {
    name: 'End-to-End Tests',
    description: 'Complete user flow tests',
    timeout: 120000,
    parallel: false,
    coverage: false,
    screenshots: true
  }
};

// Test environment types
export const testEnvironments = {
  development: {
    name: 'Development',
    network: 'devnet',
    debug: true,
    verbose: true,
    mockData: true
  },
  
  testing: {
    name: 'Testing',
    network: 'testnet',
    debug: false,
    verbose: false,
    mockData: false
  },
  
  staging: {
    name: 'Staging',
    network: 'testnet',
    debug: false,
    verbose: false,
    mockData: false
  },
  
  production: {
    name: 'Production',
    network: 'mainnet',
    debug: false,
    verbose: false,
    mockData: false
  }
};

// Test data configuration
export const testDataConfig = {
  wallets: {
    count: 3,
    defaultBalance: 1000.0,
    names: ['Main Wallet', 'Savings Wallet', 'Trading Wallet']
  },
  
  transactions: {
    count: 10,
    amountRange: [0.1, 1000.0],
    statuses: ['pending', 'confirmed', 'failed'],
    types: ['send', 'receive', 'contract']
  },
  
  networks: {
    mainnet: {
      id: 'mainnet',
      name: 'KALDRIX Mainnet',
      rpcUrl: 'https://mainnet.kaldrix.network',
      chainId: 1,
      symbol: 'KALD'
    },
    
    testnet: {
      id: 'testnet',
      name: 'KALDRIX Testnet',
      rpcUrl: 'https://testnet.kaldrix.network',
      chainId: 2,
      symbol: 'tKALD'
    },
    
    devnet: {
      id: 'devnet',
      name: 'KALDRIX Devnet',
      rpcUrl: 'https://devnet.kaldrix.network',
      chainId: 3,
      symbol: 'dKALD'
    }
  },
  
  tokens: {
    native: {
      symbol: 'KALD',
      name: 'KALDRIX',
      decimals: 18
    },
    
    stablecoins: [
      {
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        address: '0x1111111111111111111111111111111111111111'
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0x2222222222222222222222222222222222222222'
      }
    ]
  }
};

// Performance test configuration
export const performanceTestConfig = {
  thresholds: {
    startupTime: 3000, // 3 seconds
    transactionTime: 5000, // 5 seconds
    syncTime: 60000, // 1 minute
    memoryUsage: 100, // 100 MB
    cpuUsage: 80, // 80%
    networkLatency: 1000, // 1 second
    batteryUsage: 5 // 5%
  },
  
  loadTesting: {
    concurrentUsers: 100,
    duration: 300, // 5 minutes
    rampUp: 60, // 1 minute
    thinkTime: 1000 // 1 second
  },
  
  stressTesting: {
    maxUsers: 1000,
    duration: 600, // 10 minutes
    errorRate: 0.01 // 1% error rate threshold
  }
};

// Security test configuration
export const securityTestConfig = {
  vulnerabilities: {
    sqlInjection: true,
    xss: true,
    csrf: true,
    authBypass: true,
    dataExposure: true,
    insecureDeserialization: true,
    ssrf: true,
    fileInclusion: true
  },
  
  authentication: {
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    
    sessionTimeout: 1800, // 30 minutes
    maxLoginAttempts: 5,
    lockoutDuration: 900 // 15 minutes
  },
  
  encryption: {
    algorithm: 'AES-256-GCM',
    keyLength: 256,
    ivLength: 96,
    tagLength: 128
  }
};

// UI test configuration
export const uiTestConfig = {
  devices: {
    mobile: {
      width: 375,
      height: 667,
      userAgent: 'Mobile Test Agent'
    },
    
    tablet: {
      width: 768,
      height: 1024,
      userAgent: 'Tablet Test Agent'
    },
    
    desktop: {
      width: 1920,
      height: 1080,
      userAgent: 'Desktop Test Agent'
    }
  },
  
  browsers: {
    chrome: {
      name: 'Chrome',
      version: 'latest'
    },
    
    firefox: {
      name: 'Firefox',
      version: 'latest'
    },
    
    safari: {
      name: 'Safari',
      version: 'latest'
    }
  },
  
  viewports: [
    { width: 320, height: 480 }, // Mobile small
    { width: 375, height: 667 }, // Mobile medium
    { width: 414, height: 736 }, // Mobile large
    { width: 768, height: 1024 }, // Tablet
    { width: 1024, height: 768 }, // Tablet landscape
    { width: 1366, height: 768 }, // Desktop small
    { width: 1920, height: 1080 }  // Desktop large
  ]
};

// CI/CD configuration
export const cicdConfig = {
  pipelines: {
    pullRequest: {
      runTests: true,
      runLinting: true,
      runSecurity: true,
      runPerformance: false,
      generateReports: true
    },
    
    merge: {
      runTests: true,
      runLinting: true,
      runSecurity: true,
      runPerformance: true,
      generateReports: true,
      deploy: false
    },
    
    release: {
      runTests: true,
      runLinting: true,
      runSecurity: true,
      runPerformance: true,
      generateReports: true,
      deploy: true
    }
  },
  
  notifications: {
    slack: {
      enabled: true,
      webhook: process.env.SLACK_WEBHOOK_URL,
      channel: '#testing'
    },
    
    email: {
      enabled: true,
      recipients: ['team@kaldrix.network'],
      template: 'test-results'
    }
  }
};

// Test reporting configuration
export const reportingConfig = {
  formats: {
    junit: {
      enabled: true,
      outputFile: 'test-results/junit.xml'
    },
    
    html: {
      enabled: true,
      outputDir: 'test-results/html',
      theme: 'default'
    },
    
    json: {
      enabled: true,
      outputFile: 'test-results/results.json'
    },
    
    console: {
      enabled: true,
      verbose: false,
      colors: true
    }
  },
  
  metrics: {
    coverage: {
      enabled: true,
      threshold: 90,
      outputFile: 'test-results/coverage.json'
    },
    
    performance: {
      enabled: true,
      outputFile: 'test-results/performance.json'
    },
    
    security: {
      enabled: true,
      outputFile: 'test-results/security.json'
    }
  },
  
  artifacts: {
    screenshots: {
      enabled: true,
      outputDir: 'test-results/screenshots'
    },
    
    videos: {
      enabled: false,
      outputDir: 'test-results/videos'
    },
    
    logs: {
      enabled: true,
      outputDir: 'test-results/logs'
    }
  }
};

// Test utilities configuration
export const utilsConfig = {
  mockData: {
    enabled: true,
    refreshInterval: 3600, // 1 hour
    seed: 'kaldrix-test-seed'
  },
  
  cleanup: {
    enabled: true,
    cleanupAfterTest: true,
    cleanupAfterSuite: true
  },
  
  debugging: {
    enabled: process.env.NODE_ENV === 'development',
    breakOnError: false,
    detailedErrors: true
  }
};

// Export all configurations
export default {
  config: testConfig,
  categories: testCategories,
  environments: testEnvironments,
  data: testDataConfig,
  performance: performanceTestConfig,
  security: securityTestConfig,
  ui: uiTestConfig,
  cicd: cicdConfig,
  reporting: reportingConfig,
  utils: utilsConfig
};