"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { AlertTriangle, Crown, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import api from "@/lib/api";
import { usePremiumAccess } from "./screenshot-protection";

interface ProtectedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
  sizes?: string;
}

export default function ProtectedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = "",
  onLoad,
  onError,
  priority = false,
  sizes,
}: ProtectedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isPremiumQuality, setIsPremiumQuality] = useState<boolean>(true);
  const blobUrlRef = useRef<string>("");
  const { hasPremiumAccess } = usePremiumAccess();

  useEffect(() => {
    let isCancelled = false;

    const fetchImage = async () => {
      try {
        console.log("🖼️ ProtectedImage: Starting to fetch image:", src);
        setLoading(true);
        setError(false);

        // If it's already a blob URL or external URL, use it directly
        if (
          src.startsWith("blob:") ||
          src.startsWith("http://") ||
          src.startsWith("https://")
        ) {
          console.log("🖼️ ProtectedImage: Using direct URL:", src);
          if (!isCancelled) {
            setImageSrc(src);
            setLoading(false);
          }
          return;
        }

        console.log(
          "🖼️ ProtectedImage: Fetching protected image from API:",
          src,
        );

        // Fetch the protected image
        const response = await api.get(src, {
          responseType: "blob",
          headers: {
            Accept: "image/*",
          },
        });

        console.log("🖼️ ProtectedImage: Response received:", {
          status: response.status,
          headers: response.headers,
          dataSize: response.data?.size || "unknown",
        });

        if (!isCancelled) {
          // Check image quality from response headers
          const premiumQuality =
            response.headers["x-premium-quality"] === "true";
          setIsPremiumQuality(premiumQuality);

          console.log("🖼️ ProtectedImage: Premium quality:", premiumQuality);

          // Create blob URL
          const blob = new Blob([response.data]);
          const blobUrl = URL.createObjectURL(blob);

          console.log(
            "🖼️ ProtectedImage: Created blob URL:",
            blobUrl,
            "Blob size:",
            blob.size,
          );

          // Clean up previous blob URL
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
          }

          blobUrlRef.current = blobUrl;
          setImageSrc(blobUrl);
          setLoading(false);

          console.log("🖼️ ProtectedImage: Image source set successfully");
        }
      } catch (err) {
        console.error("🚨 ProtectedImage: Failed to fetch protected image:", {
          src,
          error: err,
          message: err instanceof Error ? err.message : "Unknown error",
          status: (err as any)?.response?.status,
          statusText: (err as any)?.response?.statusText,
        });
        if (!isCancelled) {
          setError(true);
          setLoading(false);
          onError?.();
        }
      }
    };

    fetchImage();

    // Cleanup function
    return () => {
      isCancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = "";
      }
    };
  }, [src, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  const handleImageLoad = () => {
    console.log("✅ ProtectedImage: Image loaded successfully:", src);
    setLoading(false);
    onLoad?.();
  };

  const handleImageError = () => {
    console.error("❌ ProtectedImage: Image failed to load:", src);
    setError(true);
    setLoading(false);
    onError?.();
  };

  if (error) {
    console.log("🖼️ ProtectedImage: Rendering error state for:", src);
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        style={fill ? undefined : { width, height }}
      >
        <AlertTriangle className="w-8 h-8 mb-2" />
        <span className="text-sm">Failed to load image</span>
        <span className="text-xs mt-1 text-center px-2">{src}</span>
      </div>
    );
  }

  if (loading || !imageSrc) {
    console.log("🖼️ ProtectedImage: Rendering loading state:", {
      loading,
      imageSrc: !!imageSrc,
      src,
    });
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-100 ${className}`}
        style={fill ? undefined : { width, height }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="text-xs mt-2 text-gray-500">Loading...</span>
      </div>
    );
  }

  console.log("🖼️ ProtectedImage: Rendering image element:", {
    imageSrc,
    fill,
    width,
    height,
  });

  // Use Next.js Image component with the blob URL
  const imageElement = fill ? (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      className={className}
      onLoad={handleImageLoad}
      onError={handleImageError}
      priority={priority}
      sizes={sizes}
      unoptimized={imageSrc.startsWith("blob:")}
    />
  ) : (
    <Image
      src={imageSrc}
      alt={alt}
      width={width || 500}
      height={height || 300}
      className={className}
      onLoad={handleImageLoad}
      onError={handleImageError}
      priority={priority}
      sizes={sizes}
      unoptimized={imageSrc.startsWith("blob:")}
    />
  );

  // Only show quality indicator for non-premium users viewing degraded images
  if (!isPremiumQuality && !hasPremiumAccess) {
    return (
      <div className="relative size-full">
        {imageElement}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute top-2 right-2">
                <Badge
                  variant="secondary"
                  className="text-xs bg-orange-100 text-orange-800 cursor-help"
                >
                  <Info className="w-3 h-3 mr-1" />
                  Preview Quality
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p className="font-medium">Preview Quality</p>
                <p className="text-sm text-gray-600">
                  Upgrade to premium for full quality
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs text-yellow-600">
                  <Crown className="w-3 h-3" />
                  <span>Premium: Full Resolution</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return imageElement;
}

// Hook for preloading protected images
export function useProtectedImage(src: string) {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const preloadImage = async () => {
      try {
        setLoading(true);
        setError(null);

        // If it's already a blob URL or external URL, use it directly
        if (
          src.startsWith("blob:") ||
          src.startsWith("http://") ||
          src.startsWith("https://")
        ) {
          if (!isCancelled) {
            setImageUrl(src);
            setLoading(false);
          }
          return;
        }

        const response = await api.get(src, {
          responseType: "blob",
          headers: {
            Accept: "image/*",
          },
        });

        if (!isCancelled) {
          const blob = new Blob([response.data]);
          const blobUrl = URL.createObjectURL(blob);
          setImageUrl(blobUrl);
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Failed to load image");
          setLoading(false);
        }
      }
    };

    preloadImage();

    return () => {
      isCancelled = true;
    };
  }, [src]);

  return { imageUrl, loading, error };
}
