// Migration layer from DBlob (IndexedDB) to Asset (PostgreSQL)
// This file provides drop-in replacements for DBlob functions

import {
  useAddAsset,
  useGetAsset,
  useGetAssetsByType,
  useGetAssetsByScopeAndType,
  useUpdateAsset,
  useTransferAssetContextScope,
  useDeleteAsset,
  useDeleteAssets,
  useDeleteAllScopedAssets,
  useGcAssetsByScope,
  type AssetId,
  type AssetData,
  type UserOrigin,
  type GeneratedOrigin,
  type AssetOrigin,
  type ImageAssetMetadata,
  type AudioAssetMetadata,
} from './assets.client';

// Re-export types to match DBlob interface
export type {
  AssetId as DBlobAssetId,
  AssetData,
  UserOrigin,
  GeneratedOrigin,
  AssetOrigin,
  ImageAssetMetadata,
  AudioAssetMetadata,
};

// Simple in-memory storage for non-hook usage
const assetStorage = new Map<string, any>();

// Re-export hooks with DBlob naming - these are now simple async functions
// that don't use React hooks internally
export const addDBImageAsset = async (
  scopeId: 'APP_CHAT' | 'APP_DRAW' | 'ATTACHMENT_DRAFTS',
  imageBlob: Blob,
  params: {
    label: string;
    origin: UserOrigin | GeneratedOrigin;
    metadata: ImageAssetMetadata;
  }
): Promise<AssetId> => {
  // Convert blob to base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1]; // Remove data URL prefix
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageBlob);
  });

  // Generate a simple ID and store in memory
  const assetId = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  assetStorage.set(assetId, {
    id: assetId,
    assetType: 'IMAGE',
    label: params.label,
    data: {
      mimeType: imageBlob.type,
      base64: base64Data,
    },
    origin: params.origin,
    metadata: params.metadata,
    contextId: 'GLOBAL',
    scopeId,
  });
  
  return assetId;
};

export const getImageAsset = async (id: AssetId) => {
  return assetStorage.get(id) || null;
};

export const getImageAssetAsBlobURL = async (id: AssetId): Promise<string> => {
  const asset = await getImageAsset(id);
  if (!asset) {
    throw new Error('Asset not found');
  }
  
  // Convert base64 to blob URL
  const byteCharacters = atob(asset.data.base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: asset.data.mimeType });
  
  return URL.createObjectURL(blob);
};

export const gcDBImageAssets = async (
  contextId: 'GLOBAL' = 'GLOBAL',
  scopeId: 'APP_CHAT' | 'APP_DRAW' | 'ATTACHMENT_DRAFTS' = 'APP_CHAT',
  keepIds: AssetId[]
) => {
  // Simple garbage collection - remove all assets in scope except keepIds
  for (const [id, asset] of assetStorage.entries()) {
    if (asset.contextId === contextId && asset.scopeId === scopeId && !keepIds.includes(id)) {
      assetStorage.delete(id);
    }
  }
};

// Re-export hooks for direct use (these are the actual React hooks)
export {
  useGetAsset,
  useGetAssetsByType,
  useGetAssetsByScopeAndType,
  useUpdateAsset,
  useTransferAssetContextScope,
  useDeleteAsset,
  useDeleteAssets,
  useDeleteAllScopedAssets,
  useGcAssetsByScope,
};

// Export compatibility aliases
export const getDBAsset = useGetAsset;
export const getDBAssetsByType = useGetAssetsByType;
export const getDBAssetsByScopeAndType = useGetAssetsByScopeAndType;
export const updateDBAsset = useUpdateAsset;
export const transferDBAssetContextScope = useTransferAssetContextScope;
export const deleteDBAsset = useDeleteAsset;
export const deleteDBAssets = useDeleteAssets;
export const deleteAllScopedAssets = useDeleteAllScopedAssets;
export const gcDBAssetsByScope = useGcAssetsByScope;

// Export types for compatibility
export type DBlobAssetType = 'IMAGE' | 'AUDIO';
export type DBlobDBContextId = 'GLOBAL';
export type DBlobDBScopeId = 'APP_CHAT' | 'APP_DRAW' | 'ATTACHMENT_DRAFTS';
