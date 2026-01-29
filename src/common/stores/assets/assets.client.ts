import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiQuery } from '~/common/util/trpc.client';

// Types matching the original DBlob types
export type AssetId = string;
export type AssetData = {
  mimeType: string;
  base64: string;
};

export type UserOrigin = {
  ot: 'user';
  source: string;
  media?: string;
  url?: string;
  fileName?: string;
};

export type GeneratedOrigin = {
  ot: 'generated';
  source: string;
  generatorName: string;
  prompt: string;
  parameters: { [key: string]: any };
  generatedAt?: string;
};

export type AssetOrigin = UserOrigin | GeneratedOrigin;

export interface ImageAssetMetadata {
  width: number;
  height: number;
  averageColor?: string;
  author?: string;
  tags?: string[];
  description?: string;
}

export interface AudioAssetMetadata {
  duration: number;
  sampleRate: number;
  bitrate?: number;
  channels?: number;
}

// Type guards
export function isUserOrigin(origin: any): origin is UserOrigin {
  return origin && typeof origin === 'object' && origin.ot === 'user';
}

export function isGeneratedOrigin(origin: any): origin is GeneratedOrigin {
  return origin && typeof origin === 'object' && origin.ot === 'generated';
}

// Client-side hooks for asset operations

export function useAddAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      assetType: 'IMAGE' | 'AUDIO';
      label: string;
      data: AssetData;
      origin: AssetOrigin;
      metadata: ImageAssetMetadata | AudioAssetMetadata;
      contextId?: 'GLOBAL';
      scopeId?: 'APP_CHAT' | 'APP_DRAW' | 'ATTACHMENT_DRAFTS';
    }) => {
      const result = await apiQuery.assets.addAsset.mutate(params);
      return result.assetId;
    },
    onSuccess: (assetId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      return assetId;
    },
    onError: (error) => {
      console.error('Failed to add asset:', error);
    },
  });
}

export function useGetAsset(assetId: AssetId) {
  return useQuery({
    queryKey: ['assets', 'get', assetId],
    queryFn: () => apiQuery.assets.getAsset.query({ id: assetId }),
    enabled: !!assetId,
  });
}

export function useGetAssetsByType(assetType: 'IMAGE' | 'AUDIO') {
  return useQuery({
    queryKey: ['assets', 'byType', assetType],
    queryFn: () => apiQuery.assets.getAssetsByType.query({ assetType }),
  });
}

export function useGetAssetsByScopeAndType(
  assetType: 'IMAGE' | 'AUDIO',
  contextId: 'GLOBAL' = 'GLOBAL',
  scopeId: 'APP_CHAT' | 'APP_DRAW' | 'ATTACHMENT_DRAFTS' = 'APP_CHAT'
) {
  return useQuery({
    queryKey: ['assets', 'byScopeAndType', assetType, contextId, scopeId],
    queryFn: () => apiQuery.assets.getAssetsByScopeAndType.query({ 
      assetType, 
      contextId, 
      scopeId 
    }),
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      id: AssetId;
      updates: any;
    }) => {
      return await apiQuery.assets.updateAsset.mutate(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (error) => {
      console.error('Failed to update asset:', error);
    },
  });
}

export function useTransferAssetContextScope() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      id: AssetId;
      contextId: 'GLOBAL';
      scopeId: 'APP_CHAT' | 'APP_DRAW' | 'ATTACHMENT_DRAFTS';
    }) => {
      return await apiQuery.assets.transferAssetContextScope.mutate(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (error) => {
      console.error('Failed to transfer asset context/scope:', error);
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (assetId: AssetId) => {
      return await apiQuery.assets.deleteAsset.mutate({ id: assetId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (error) => {
      console.error('Failed to delete asset:', error);
    },
  });
}

export function useDeleteAssets() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (assetIds: AssetId[]) => {
      return await apiQuery.assets.deleteAssets.mutate({ ids: assetIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (error: any) => {
      console.error('Failed to delete assets:', error);
    },
  });
}

export function useDeleteAllScopedAssets() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      contextId: 'GLOBAL';
      scopeId: 'APP_CHAT' | 'APP_DRAW' | 'ATTACHMENT_DRAFTS';
    }) => {
      return await apiQuery.assets.deleteAllScopedAssets.mutate(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (error: any) => {
      console.error('Failed to delete scoped assets:', error);
    },
  });
}

export function useGcAssetsByScope() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      contextId: 'GLOBAL';
      scopeId: 'APP_CHAT' | 'APP_DRAW' | 'ATTACHMENT_DRAFTS';
      assetType?: 'IMAGE' | 'AUDIO' | null;
      keepIds: AssetId[];
    }) => {
      return await apiQuery.assets.gcAssetsByScope.mutate({
        contextId: params.contextId,
        scopeId: params.scopeId,
        assetType: params.assetType || null,
        keepIds: params.keepIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (error: any) => {
      console.error('Failed to garbage collect assets:', error);
    },
  });
}
