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

// Re-export hooks with DBlob naming
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
  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1]; // Remove data URL prefix
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageBlob);
  });

  const addAssetMutation = useAddAsset();
  
  return new Promise((resolve, reject) => {
    addAssetMutation.mutate(
      {
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
      },
      {
        onSuccess: (assetId) => resolve(assetId),
        onError: (error) => reject(error),
      }
    );
  });
};

export const getImageAsset = async (id: AssetId) => {
  const getAssetQuery = useGetAsset(id);
  return getAssetQuery.data;
};

export const getImageAssetAsBlobURL = async (id: AssetId): Promise<string> => {
  const asset = await getImageAsset(id);
  if (!asset) {
    throw new Error('Asset not found');
  }
  
  // Convert base64 to blob URL
  const byteCharacters = atob(asset.base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: asset.mimeType });
  
  return URL.createObjectURL(blob);
};

export const gcDBImageAssets = async (
  contextId: 'GLOBAL' = 'GLOBAL',
  scopeId: 'APP_CHAT' | 'APP_DRAW' | 'ATTACHMENT_DRAFTS' = 'APP_CHAT',
  keepIds: AssetId[]
) => {
  const gcMutation = useGcAssetsByScope();
  
  return new Promise((resolve, reject) => {
    gcMutation.mutate(
      {
        contextId,
        scopeId,
        assetType: 'IMAGE',
        keepIds,
      },
      {
        onSuccess: (result) => resolve(result),
        onError: (error) => reject(error),
      }
    );
  });
};

// Re-export hooks for direct use
export {
  useGetAsset as getDBAsset,
  useGetAssetsByType as getDBAssetsByType,
  useGetAssetsByScopeAndType as getDBAssetsByScopeAndType,
  useUpdateAsset as updateDBAsset,
  useTransferAssetContextScope as transferDBAssetContextScope,
  useDeleteAsset as deleteDBAsset,
  useDeleteAssets as deleteDBAssets,
  useDeleteAllScopedAssets as deleteAllScopedAssets,
  useGcAssetsByScope as gcDBAssetsByScope,
};

// Export types for compatibility
export type DBlobAssetType = 'IMAGE' | 'AUDIO';
export type DBlobDBContextId = 'GLOBAL';
export type DBlobDBScopeId = 'APP_CHAT' | 'APP_DRAW' | 'ATTACHMENT_DRAFTS';
