import { useState, useEffect, useCallback } from "react";

interface UseImageFallbackOptions {
  enableRotation?: boolean;
  rotationInterval?: number;
  fallbackSrc?: string;
}

export function useImageFallback({
  enableRotation = false,
  rotationInterval = 10000,
  fallbackSrc = "/items/image-not-found-icon.png",
}: UseImageFallbackOptions = {}) {
  const [currentImagePack, setCurrentImagePack] = useState<"default" | "sphax">(
    "default",
  );
  const [hasError, setHasError] = useState(false);
  const [triedBothPacks, setTriedBothPacks] = useState(false);

  // Handle image pack rotation - only if no errors and rotation enabled
  useEffect(() => {
    if (!enableRotation || hasError || triedBothPacks) return;

    const interval = setInterval(() => {
      setCurrentImagePack((prev) => (prev === "default" ? "sphax" : "default"));
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [enableRotation, rotationInterval, hasError, triedBothPacks]);

  // Only reset error state when image pack changes if we haven't tried both packs yet
  useEffect(() => {
    if (!triedBothPacks) {
      setHasError(false);
    }
  }, [currentImagePack, triedBothPacks]);

  const handleImageError = useCallback(() => {
    if (currentImagePack === "sphax" && !hasError) {
      // Try default pack first
      setCurrentImagePack("default");
    } else {
      // We've tried both packs, use fallback image and stop rotation
      setHasError(true);
      setTriedBothPacks(true);
    }
  }, [currentImagePack, hasError]);

  const getImageSrc = useCallback(
    (originalSrc: string) => {
      if (hasError) {
        return fallbackSrc;
      }
      return originalSrc;
    },
    [hasError, fallbackSrc],
  );

  const resetError = useCallback(() => {
    setHasError(false);
    setTriedBothPacks(false);
    setCurrentImagePack("default");
  }, []);

  return {
    currentImagePack,
    hasError,
    handleImageError,
    getImageSrc,
    resetError,
  };
}
