// Core CRUD operations
export { createModpack, updateModpack, deleteModpack } from "./core";

// Query and search operations
export { getModpacks, getModpackById, getFeaturedModpacks } from "./queries";

// Version management
export {
  getModpackGroups,
  getModpackVersions,
  getExistingModpackNames,
  getLatestModpackVersion,
  suggestNextVersion,
} from "./versions";

// File upload and processing
export { uploadModpack } from "./upload";

// Download operations
export { downloadModpack, downloadLatestModpack } from "./download";

// Future exports ready for Phase 2:
// export { extractModMetadata, parseNeoForgeToml } from "./parsers";
export {
  generateChangelog,
  compareModpackVersions,
  getModpackChangelog,
  regenerateAndStoreChangelog,
} from "./changelog";
