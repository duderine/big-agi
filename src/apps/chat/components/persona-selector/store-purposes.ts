import { create } from 'zustand';
import { persist } from 'zustand/middleware';


interface PurposeStore {

  // state - kept for compatibility but no longer used
  hiddenPurposeIDs: string[];

  // actions - no-op since we only have Custom persona now
  toggleHiddenPurposeId: (purposeId: string) => void;

}


export const usePurposeStore = create<PurposeStore>()(
  persist(
    (set) => ({

      // default state - empty since we removed all default personas
      hiddenPurposeIDs: [],

      toggleHiddenPurposeId: () => {
        // No-op - only Custom persona exists now, nothing to hide/show
      },

    }),
    {
      name: 'app-purpose',
      version: 3,

      migrate: (state: any, fromVersion: number): PurposeStore => {
        // Reset to empty since we removed all default personas
        return {
          hiddenPurposeIDs: [],
          toggleHiddenPurposeId: () => {},
        };
      },
    }),
);
