import { create } from 'zustand'

/**
 * Preview Store — lets admins/coaches "see as" a specific client.
 * Dashboard components call useEffectiveUser() which returns the preview
 * client's profile when preview mode is active, otherwise the real user.
 */
export const usePreviewStore = create((set) => ({
  previewClient: null, // Full profile object of the client being previewed

  startPreview: (clientProfile) => set({ previewClient: clientProfile }),
  exitPreview: () => set({ previewClient: null }),
}))
