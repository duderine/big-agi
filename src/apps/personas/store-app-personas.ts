import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { agiUuid } from '~/common/util/idUtils';
import { useShallow } from 'zustand/react/shallow';
import type { DLLMId } from '~/common/stores/llms/llms.types';
import type { DModelParameterValues } from '~/common/stores/llms/llms.parameters';


// constraint the max number of saved prompts, to stay below localStorage quota
const MAX_SAVED_PROMPTS = 100;


/**
 * Rich Persona store - supports full persona configuration with model selection,
 * custom parameters, images, and metadata.
 */
export interface SimplePersona {
  id: string;
  name: string; // Required name for the persona
  description?: string; // Optional description of the persona
  systemPrompt: string; // The system prompt is very important and required
  creationDate: string; // ISO string format
  updatedDate?: string; // ISO string format for updates
  pictureUrl?: string; // Optional picture URL or base64 image
  category?: string; // Category for organizing personas
  
  // LLM configuration specific to this persona
  llmId?: DLLMId; // Specific model for this persona
  llmParameters?: DModelParameterValues; // Custom parameters (temperature, etc.)
  
  // source material (for personas created from text/youtube)
  inputProvenance?: SimplePersonaProvenance;
  inputText?: string;
  
  // metadata
  llmLabel?: string; // Label of the LLM used to create this persona
  isFavorite?: boolean; // Favorite flag
  usageCount?: number; // Track how often this persona is used
}

export type SimplePersonaProvenance = {
  type: 'youtube';
  url: string;
  title?: string;
  thumbnailUrl?: string;
} | {
  type: 'text';
} | {
  type: 'manual';
};


interface AppPersonasStore {

  // state
  simplePersonas: SimplePersona[];

  // actions
  prependSimplePersona: (systemPrompt: string, inputText: string, inputProvenance?: SimplePersonaProvenance, llmLabel?: string) => void;
  addPersona: (persona: Omit<SimplePersona, 'id' | 'creationDate'>) => SimplePersona;
  updatePersona: (id: string, updates: Partial<Omit<SimplePersona, 'id' | 'creationDate'>>) => void;
  deleteSimplePersona: (id: string) => void;
  deleteSimplePersonas: (ids: Set<string>) => void;
  toggleFavorite: (id: string) => void;
  incrementUsage: (id: string) => void;
  reorderPersonas: (orderedIds: string[]) => void;

}

/**
 * Rich Personas Store - supports full persona management with images,
 * model selection, custom parameters, and organization.
 */
const useAppPersonasStore = create<AppPersonasStore>()(persist(
  (_set, _get) => ({

    simplePersonas: [],

    prependSimplePersona: (systemPrompt: string, inputText: string, inputProvenance?: SimplePersonaProvenance, llmLabel?: string) =>
      _set(state => {
        const newPersona: SimplePersona = {
          id: agiUuid('persona-simple'),
          name: 'New Persona',
          systemPrompt,
          creationDate: new Date().toISOString(),
          updatedDate: new Date().toISOString(),
          inputProvenance,
          inputText: inputProvenance?.type === 'youtube' ? '' : inputText,
          llmLabel,
          category: 'Created',
          isFavorite: false,
          usageCount: 0,
        };
        return {
          simplePersonas: [
            newPersona,
            ...state.simplePersonas.slice(0, MAX_SAVED_PROMPTS - 1),
          ],
        };
      }),

    addPersona: (personaData: Omit<SimplePersona, 'id' | 'creationDate'>) => {
      const newPersona: SimplePersona = {
        ...personaData,
        id: agiUuid('persona-simple'),
        creationDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        isFavorite: personaData.isFavorite ?? false,
        usageCount: personaData.usageCount ?? 0,
      };
      _set(state => ({
        simplePersonas: [
          newPersona,
          ...state.simplePersonas.slice(0, MAX_SAVED_PROMPTS - 1),
        ],
      }));
      return newPersona;
    },

    updatePersona: (id: string, updates: Partial<Omit<SimplePersona, 'id' | 'creationDate'>>) =>
      _set(state => ({
        simplePersonas: state.simplePersonas.map(persona =>
          persona.id === id
            ? { ...persona, ...updates, updatedDate: new Date().toISOString() }
            : persona
        ),
      })),

    deleteSimplePersona: (simplePersonaId: string) =>
      _set(state => ({
        simplePersonas: state.simplePersonas.filter(persona => persona.id !== simplePersonaId),
      })),

    deleteSimplePersonas: (simplePersonaIds: Set<string>) =>
      _set(state => ({
        simplePersonas: state.simplePersonas.filter(persona => !simplePersonaIds.has(persona.id)),
      })),

    toggleFavorite: (id: string) =>
      _set(state => ({
        simplePersonas: state.simplePersonas.map(persona =>
          persona.id === id
            ? { ...persona, isFavorite: !persona.isFavorite }
            : persona
        ),
      })),

    incrementUsage: (id: string) =>
      _set(state => ({
        simplePersonas: state.simplePersonas.map(persona =>
          persona.id === id
            ? { ...persona, usageCount: (persona.usageCount || 0) + 1 }
            : persona
        ),
      })),

    reorderPersonas: (orderedIds: string[]) =>
      _set(state => {
        const personaMap = new Map(state.simplePersonas.map(p => [p.id, p]));
        const reordered = orderedIds
          .map(id => personaMap.get(id))
          .filter((p): p is SimplePersona => !!p);
        const remaining = state.simplePersonas.filter(p => !orderedIds.includes(p.id));
        return {
          simplePersonas: [...reordered, ...remaining],
        };
      }),

  }),
  {
    name: 'app-app-personas',
    version: 2, // Bumped version for schema changes
    migrate: (persistedState: any, version: number) => {
      if (version === 1) {
        // Migrate from v1 to v2 - add new fields with defaults
        const personas = persistedState?.simplePersonas || [];
        return {
          simplePersonas: personas.map((p: any) => ({
            ...p,
            name: p.name || 'Unnamed Persona',
            isFavorite: p.isFavorite ?? false,
            usageCount: p.usageCount ?? 0,
            category: p.category || 'Legacy',
          })),
        };
      }
      return persistedState;
    },
  },
));


export function useSimplePersonas() {
  const simplePersonas = useAppPersonasStore(useShallow(state => state.simplePersonas));
  const favorites = simplePersonas.filter(p => p.isFavorite);
  const regular = simplePersonas.filter(p => !p.isFavorite);
  return { simplePersonas, favorites, regular };
}

export function useSimplePersona(simplePersonaId: string | null) {
  const simplePersona = useAppPersonasStore(useShallow(state => {
    if (!simplePersonaId) return null;
    return state.simplePersonas.find(persona => persona.id === simplePersonaId) ?? null;
  }));
  return { simplePersona };
}

export function usePersonaActions() {
  return useAppPersonasStore(useShallow(state => ({
    addPersona: state.addPersona,
    updatePersona: state.updatePersona,
    deleteSimplePersona: state.deleteSimplePersona,
    deleteSimplePersonas: state.deleteSimplePersonas,
    toggleFavorite: state.toggleFavorite,
    incrementUsage: state.incrementUsage,
    reorderPersonas: state.reorderPersonas,
    prependSimplePersona: state.prependSimplePersona,
  })));
}

// Legacy exports for backward compatibility
export function prependSimplePersona(systemPrompt: string, inputText: string, inputProvenance?: SimplePersonaProvenance, llmLabel?: string) {
  useAppPersonasStore.getState().prependSimplePersona(systemPrompt, inputText, inputProvenance, llmLabel);
}

export function deleteSimplePersona(simplePersonaId: string) {
  useAppPersonasStore.getState().deleteSimplePersona(simplePersonaId);
}

export function deleteSimplePersonas(simplePersonaIds: Set<string>) {
  useAppPersonasStore.getState().deleteSimplePersonas(simplePersonaIds);
}

export function addPersona(persona: Omit<SimplePersona, 'id' | 'creationDate'>) {
  return useAppPersonasStore.getState().addPersona(persona);
}

export function updatePersona(id: string, updates: Partial<Omit<SimplePersona, 'id' | 'creationDate'>>) {
  useAppPersonasStore.getState().updatePersona(id, updates);
}

export function toggleFavoritePersona(id: string) {
  useAppPersonasStore.getState().toggleFavorite(id);
}

export function incrementPersonaUsage(id: string) {
  useAppPersonasStore.getState().incrementUsage(id);
}
