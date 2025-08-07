// Legacy Tests Setup
import 'jest-environment-jsdom';

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Prisma for legacy tests
jest.mock('@/lib/db', () => ({
  db: {
    participant: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    rewardTransaction: {
      create: jest.fn(),
      update: jest.fn(),
    },
    successMetrics: {
      create: jest.fn(),
    },
    goalProgress: {
      upsert: jest.fn(),
    },
  },
}));

// Mock Date for consistent testing
const mockDate = new Date('2024-01-01T00:00:00.000Z');
global.Date = class extends Date {
  constructor() {
    super();
    return mockDate;
  }
  
  static now() {
    return mockDate.getTime();
  }
};