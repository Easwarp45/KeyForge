import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import obfuscator from 'vite-plugin-javascript-obfuscator';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    (obfuscator as any)({
      compact: true,
      controlFlowFlattening: false,
      deadCodeInjection: false,
      debugProtection: true,
      debugProtectionInterval: 4000,
      disableConsoleOutput: false,
      identifierNamesGenerator: 'hexadecimal',
      log: false,
      numbersToExpressions: true,
      renameGlobals: false,
      selfDefending: true,
      simplify: true,
      splitStrings: true,
      stringArray: true,
      stringArrayCallsTransform: true,
      stringArrayEncoding: ['rc4'],
      stringArrayThreshold: 0.75,
      unicodeEscapeSequence: false,
    }),
  ],
  build: {
    sourcemap: false, // Disable sourcemaps completely for security hardening
  },
});
