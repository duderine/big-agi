// Migration layer: Re-export from new Asset system to maintain DBlob compatibility
// This file provides backward compatibility for existing code using DBlob functions

export {
  // Image operations (now using Asset system)
  addDBImageAsset,
  getImageAsset,
  getImageAssetAsBlobURL,
  gcDBImageAssets,
} from '~/common/stores/assets/assets.portability';

// Stub functions for non-React contexts - avoid using React hooks outside components
const deleteDBAsset = async (id: string) => {
  console.log('[deleteDBAsset] Stub - would delete asset:', id);
};

const transferDBAssetContextScope = async (id: string, contextId: 'GLOBAL', scopeId: 'APP_CHAT' | 'APP_DRAW' | 'ATTACHMENT_DRAFTS') => {
  console.log('[transferDBAssetContextScope] Stub - would transfer asset:', id, contextId, scopeId);
};

const gcDBAssetsByScope = async (
  contextId: 'GLOBAL',
  scopeId: 'APP_CHAT' | 'APP_DRAW' | 'ATTACHMENT_DRAFTS',
  assetType: 'IMAGE' | 'AUDIO' | null,
  keepIds: string[]
) => {
  console.log('[gcDBAssetsByScope] Stub - would GC assets in scope:', scopeId);
};

const getDBAsset = async (id: string) => {
  console.log('[getDBAsset] Stub - would get asset:', id);
  return null;
};

export {
  deleteDBAsset,
  transferDBAssetContextScope,
  gcDBAssetsByScope,
  getDBAsset,
};

// Note: useDBAsset and useDBAssetsByScopeAndType are not directly exported from assets.portability
// They can be imported directly from assets.client if needed

export {
  useGetAsset as useDBAsset,
  useGetAssetsByScopeAndType as useDBAssetsByScopeAndType,
} from '~/common/stores/assets/assets.client';

// Re-export enums for compatibility
export type {
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

// Define missing types for compatibility
export type DBlobDBAsset = any; // This would need to be properly typed based on Asset schema
export type DBlobImageAsset = any; // This would need to be properly typed based on Asset schema

// Re-export types from assets.portability for compatibility
export type DBlobAssetId = string;
export type DBlobDBContextId = 'GLOBAL';
export type DBlobDBScopeId = 'APP_CHAT' | 'APP_DRAW' | 'ATTACHMENT_DRAFTS';
