// Test setup file
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// Set up axios mock adapter for tests
export const mock = new MockAdapter(axios);

// Clear all mocks after each test
afterEach(() => {
  mock.reset();
});

// Clean up after all tests
afterAll(() => {
  mock.restore();
});