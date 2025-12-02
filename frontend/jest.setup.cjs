require('@testing-library/jest-dom');
require('whatwg-fetch');

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

global.fetch = require('node-fetch');

global.alert = jest.fn();
global.confirm = jest.fn(() => true);

global.importMetaEnv = {
  VITE_SUPABASE_URL:
    process.env.VITE_SUPABASE_URL || 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key',
};

Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: global.importMetaEnv,
    },
  },
  writable: true,
  configurable: true,
});

const originalError = console.error;
console.error = (...args) => {
  if (
    (args[0] instanceof Error &&
      args[0].message &&
      args[0].message.includes('Not implemented: navigation')) ||
    (typeof args[0] === 'string' &&
      args[0].includes('Not implemented: navigation')) ||
    (typeof args[0] === 'string' &&
      args[0].includes('Not implemented: window.alert'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Limit the DOM output in error messages to make test output more readable
process.env.DEBUG_PRINT_LIMIT = '1000';

process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';