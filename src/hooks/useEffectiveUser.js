import { useAuthStore } from '../store/authStore'
import { usePreviewStore } from '../store/previewStore'

/**
 * Returns the "effective" user for dashboard pages.
 * If a coach has activated preview mode, returns the preview client's profile.
 * Otherwise returns the real logged-in user.
 * 
 * Usage: const user = useEffectiveUser()
 */
export function useEffectiveUser() {
  const realUser = useAuthStore((state) => state.user)
  const previewClient = usePreviewStore((state) => state.previewClient)
  return previewClient ?? realUser
}
