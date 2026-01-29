// Migration layer: Re-export from new Asset system to maintain DBlob compatibility
// This file provides backward compatibility for existing code using DBlob functions

export {
  // Image operations (now using Asset system)
  addDBImageAsset,
  getImageAsset,
  getImageAssetAsBlobURL,
  gcDBImageAssets,
} from '~/common/stores/assets/assets.portability';

export {
  // Generic operations (now using Asset system)
  deleteDBAsset,
  transferDBAssetContextScope,
  gcDBAssetsByScope,
  getDBAsset,
} from '~/common/stores/assets/assets.portability';

// Note: useDBAsset and useDBAssetsByScopeAndType are not directly exported from assets.portability
// They can be imported directly from assets.client if needed

// Re-export enums for compatibility
export {
  DBlobAssetType,
} from '~/common/stores/assets/assets.portability';

// Note: DBlobMimeType is not exported from assets.portability
// It can be defined here if needed for compatibility
export const DBlobMimeType = {
  IMG_PNG: 'image/png',
  IMG_JPEG: 'image/jpeg',
  IMG_WEBP: 'image/webp',
  AUDIO_MPEG: 'audio/mpeg',
  AUDIO_WAV: 'audio/wav',
} as const;

// Re-export types for compatibility
export type {
  DBlobAssetId,
  DBlobDBContextId,
  DBlobDBScopeId,
} from '~/common/stores/assets/assets.portability';

// Define missing types for compatibility
export type DBlobDBAsset = any; // This would need to be properly typed based on Asset schema
export type DBlobImageAsset = any; // This would need to be properly typed based on Asset schema
