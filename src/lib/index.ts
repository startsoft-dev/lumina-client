/**
 * Barrel exports for library utilities in @startsoft/lumina
 */

// API Client
export { default as api, configureApi } from './axios';

// Storage & Events adapters
export { storage, createWebStorage } from './storage';
export { events, createWebEvents } from './events';

// Utilities
export { extractPaginationFromHeaders } from './pagination';
export { cn } from './utils';

// Cogent.js Query Builder (optional)
export { Query, loadCogent } from './cogent';
