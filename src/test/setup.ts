import '@testing-library/jest-dom/vitest'
// fake-indexeddb/auto installs a spec-compliant in-memory IndexedDB onto
// globalThis — jsdom ships none, and src/lib/idb.ts is built directly on it.
import 'fake-indexeddb/auto'
