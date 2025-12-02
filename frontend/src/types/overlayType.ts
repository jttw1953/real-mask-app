
import overlayImageSrc from '../assets/random_overlay.jpeg';

export type Overlay = {
  id: number;
  ownerId: number;
  title: string;
  url: string;
};

// Default overlay that all users (authenticated and guest) can use
export const DEFAULT_OVERLAY: Overlay = {
  id: -1, // Negative ID to distinguish from user overlays
  ownerId: -1, // -1 indicates this is a system/default overlay
  title: 'Default Mask',
  url: overlayImageSrc,
};
