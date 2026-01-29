import { PrismaClient, Asset, AssetAssetType, AssetOriginType, AssetContextId, AssetScopeId } from '@prisma/client';

const prisma = new PrismaClient();

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

// CRUD Operations for Assets

export async function addAsset<T extends ImageAssetMetadata | AudioAssetMetadata>(
  assetType: AssetAssetType,
  label: string,
  data: AssetData,
  origin: AssetOrigin,
  metadata: T,
  contextId: AssetContextId = AssetContextId.GLOBAL,
  scopeId: AssetScopeId = AssetScopeId.APP_CHAT
): Promise<AssetId> {
  try {
    const asset = await prisma.asset.create({
      data: {
        assetType,
        label,
        mimeType: data.mimeType,
        base64: data.base64,
        originType: origin.ot === 'user' ? AssetOriginType.USER : AssetOriginType.GENERATED,
        originSource: origin.source,
        originMedia: origin.ot === 'user' ? origin.media : undefined,
        originUrl: origin.ot === 'user' ? origin.url : undefined,
        originFileName: origin.ot === 'user' ? origin.fileName : undefined,
        originGeneratorName: origin.ot === 'generated' ? origin.generatorName : undefined,
        originPrompt: origin.ot === 'generated' ? origin.prompt : undefined,
        originParameters: origin.ot === 'generated' ? origin.parameters : undefined,
        originGeneratedAt: origin.ot === 'generated' && origin.generatedAt ? new Date(origin.generatedAt) : undefined,
        metadata: metadata as any,
        cache: {},
        contextId,
        scopeId,
      },
    });

    return asset.id;
  } catch (error) {
    console.error('addAsset: Error adding asset', error);
    throw error;
  }
}

export async function getAsset(id: AssetId): Promise<Asset | null> {
  try {
    return await prisma.asset.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('getAsset: Error getting asset', error);
    throw error;
  }
}

export async function getAssetsByType<T extends ImageAssetMetadata | AudioAssetMetadata>(
  assetType: AssetAssetType
): Promise<(Asset & { metadata: T })[]> {
  try {
    const assets = await prisma.asset.findMany({
      where: { assetType },
      orderBy: { createdAt: 'desc' },
    });

    return assets as (Asset & { metadata: T })[];
  } catch (error) {
    console.error('getAssetsByType: Error getting assets by type', error);
    throw error;
  }
}

export async function getAssetsByScopeAndType<T extends ImageAssetMetadata | AudioAssetMetadata>(
  assetType: AssetAssetType,
  contextId: AssetContextId,
  scopeId: AssetScopeId
): Promise<(Asset & { metadata: T })[]> {
  try {
    const assets = await prisma.asset.findMany({
      where: {
        assetType,
        contextId,
        scopeId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return assets as (Asset & { metadata: T })[];
  } catch (error) {
    console.error('getAssetsByScopeAndType: Error getting assets by scope and type', error);
    throw error;
  }
}

export async function updateAsset(id: AssetId, updates: Partial<Asset>): Promise<Asset> {
  try {
    return await prisma.asset.update({
      where: { id },
      data: updates,
    });
  } catch (error) {
    console.error('updateAsset: Error updating asset', error);
    throw error;
  }
}

export async function transferAssetContextScope(
  id: AssetId,
  contextId: AssetContextId,
  scopeId: AssetScopeId
): Promise<void> {
  try {
    await prisma.asset.update({
      where: { id },
      data: { contextId, scopeId },
    });
  } catch (error) {
    console.error('transferAssetContextScope: Error transferring asset context/scope', error);
    throw error;
  }
}

export async function deleteAsset(id: AssetId): Promise<void> {
  try {
    await prisma.asset.delete({
      where: { id },
    });
  } catch (error) {
    console.error('deleteAsset: Error deleting asset', error);
    throw error;
  }
}

export async function deleteAssets(ids: AssetId[]): Promise<void> {
  try {
    await prisma.asset.deleteMany({
      where: { id: { in: ids } },
    });
  } catch (error) {
    console.error('deleteAssets: Error deleting assets', error);
    throw error;
  }
}

export async function deleteAllScopedAssets(
  contextId: AssetContextId,
  scopeId: AssetScopeId
): Promise<{ count: number }> {
  try {
    const result = await prisma.asset.deleteMany({
      where: { contextId, scopeId },
    });
    return { count: result.count };
  } catch (error) {
    console.error('deleteAllScopedAssets: Error deleting scoped assets', error);
    throw error;
  }
}

export async function gcAssetsByScope(
  contextId: AssetContextId,
  scopeId: AssetScopeId,
  assetType: AssetAssetType | null,
  keepIds: AssetId[]
): Promise<{ count: number }> {
  try {
    // Get all asset IDs in the scope
    const whereClause: any = { contextId, scopeId };
    if (assetType !== null) {
      whereClause.assetType = assetType;
    }

    const allAssets = await prisma.asset.findMany({
      where: whereClause,
      select: { id: true },
    });

    const allAssetIds = allAssets.map((asset: { id: string }) => asset.id);
    const unreferencedAssetIds = keepIds.length ? allAssetIds.filter((id: string) => !keepIds.includes(id)) : allAssetIds;

    if (unreferencedAssetIds.length > 0) {
      const result = await prisma.asset.deleteMany({
        where: { id: { in: unreferencedAssetIds } },
      });
      return { count: result.count };
    }

    return { count: 0 };
  } catch (error) {
    console.error('gcAssetsByScope: Error during garbage collection', error);
    throw error;
  }
}
