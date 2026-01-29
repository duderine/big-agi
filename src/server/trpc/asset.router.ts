import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/trpc/trpc.server';

import {
  addAsset,
  getAsset,
  getAssetsByType,
  getAssetsByScopeAndType,
  updateAsset,
  transferAssetContextScope,
  deleteAsset,
  deleteAssets,
  deleteAllScopedAssets,
  gcAssetsByScope,
  type AssetId,
  type AssetData,
  type UserOrigin,
  type GeneratedOrigin,
  type AssetOrigin,
  type ImageAssetMetadata,
  type AudioAssetMetadata,
} from '~/server/services/asset.service';
import { AssetAssetType, AssetContextId, AssetScopeId } from '@prisma/client';

// Zod schemas for validation
const AssetDataSchema = z.object({
  mimeType: z.string(),
  base64: z.string(),
});

const UserOriginSchema = z.object({
  ot: z.literal('user'),
  source: z.string(),
  media: z.string().optional(),
  url: z.string().optional(),
  fileName: z.string().optional(),
});

const GeneratedOriginSchema = z.object({
  ot: z.literal('generated'),
  source: z.string(),
  generatorName: z.string(),
  prompt: z.string(),
  parameters: z.record(z.any()),
  generatedAt: z.string().optional(),
});

const AssetOriginSchema = z.union([UserOriginSchema, GeneratedOriginSchema]);

const ImageAssetMetadataSchema = z.object({
  width: z.number(),
  height: z.number(),
  averageColor: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
});

const AudioAssetMetadataSchema = z.object({
  duration: z.number(),
  sampleRate: z.number(),
  bitrate: z.number().optional(),
  channels: z.number().optional(),
});

export const assetRouter = createTRPCRouter({
  // Add a new asset
  addAsset: protectedProcedure
    .input(z.object({
      assetType: z.nativeEnum(AssetAssetType),
      label: z.string(),
      data: AssetDataSchema,
      origin: AssetOriginSchema,
      metadata: z.union([ImageAssetMetadataSchema, AudioAssetMetadataSchema]),
      contextId: z.nativeEnum(AssetContextId).optional(),
      scopeId: z.nativeEnum(AssetScopeId).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const assetId = await addAsset(
          input.assetType,
          input.label,
          input.data,
          input.origin,
          input.metadata,
          input.contextId,
          input.scopeId
        );
        return { success: true, assetId };
      } catch (error) {
        console.error('addAsset mutation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add asset',
        });
      }
    }),

  // Get a single asset by ID
  getAsset: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const asset = await getAsset(input.id);
        if (!asset) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Asset not found',
          });
        }
        return asset;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('getAsset query error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get asset',
        });
      }
    }),

  // Get all assets by type
  getAssetsByType: protectedProcedure
    .input(z.object({
      assetType: z.nativeEnum(AssetAssetType),
    }))
    .query(async ({ input }) => {
      try {
        return await getAssetsByType(input.assetType);
      } catch (error) {
        console.error('getAssetsByType query error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get assets by type',
        });
      }
    }),

  // Get assets by scope and type
  getAssetsByScopeAndType: protectedProcedure
    .input(z.object({
      assetType: z.nativeEnum(AssetAssetType),
      contextId: z.nativeEnum(AssetContextId),
      scopeId: z.nativeEnum(AssetScopeId),
    }))
    .query(async ({ input }) => {
      try {
        return await getAssetsByScopeAndType(
          input.assetType,
          input.contextId,
          input.scopeId
        );
      } catch (error) {
        console.error('getAssetsByScopeAndType query error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get assets by scope and type',
        });
      }
    }),

  // Update an asset
  updateAsset: protectedProcedure
    .input(z.object({
      id: z.string(),
      updates: z.record(z.any()),
    }))
    .mutation(async ({ input }) => {
      try {
        return await updateAsset(input.id, input.updates);
      } catch (error) {
        console.error('updateAsset mutation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update asset',
        });
      }
    }),

  // Transfer asset context/scope
  transferAssetContextScope: protectedProcedure
    .input(z.object({
      id: z.string(),
      contextId: z.nativeEnum(AssetContextId),
      scopeId: z.nativeEnum(AssetScopeId),
    }))
    .mutation(async ({ input }) => {
      try {
        await transferAssetContextScope(input.id, input.contextId, input.scopeId);
        return { success: true };
      } catch (error) {
        console.error('transferAssetContextScope mutation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to transfer asset context/scope',
        });
      }
    }),

  // Delete a single asset
  deleteAsset: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await deleteAsset(input.id);
        return { success: true };
      } catch (error) {
        console.error('deleteAsset mutation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete asset',
        });
      }
    }),

  // Delete multiple assets
  deleteAssets: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      try {
        await deleteAssets(input.ids);
        return { success: true };
      } catch (error) {
        console.error('deleteAssets mutation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete assets',
        });
      }
    }),

  // Delete all scoped assets
  deleteAllScopedAssets: protectedProcedure
    .input(z.object({
      contextId: z.nativeEnum(AssetContextId),
      scopeId: z.nativeEnum(AssetScopeId),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await deleteAllScopedAssets(input.contextId, input.scopeId);
        return { success: true, deletedCount: result.count };
      } catch (error) {
        console.error('deleteAllScopedAssets mutation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete scoped assets',
        });
      }
    }),

  // Garbage collect assets by scope
  gcAssetsByScope: protectedProcedure
    .input(z.object({
      contextId: z.nativeEnum(AssetContextId),
      scopeId: z.nativeEnum(AssetScopeId),
      assetType: z.nativeEnum(AssetAssetType).nullable().optional(),
      keepIds: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await gcAssetsByScope(
          input.contextId,
          input.scopeId,
          input.assetType || null,
          input.keepIds
        );
        return { success: true, deletedCount: result.count };
      } catch (error) {
        console.error('gcAssetsByScope mutation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to garbage collect assets',
        });
      }
    }),
});
