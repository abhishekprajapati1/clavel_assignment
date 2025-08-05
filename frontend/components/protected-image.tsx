"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { AlertTriangle } from "lucide-react";
import api from "@/lib/api";

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
  const blobUrlRef = useRef<string>("");

  useEffect(() => {
    let isCancelled = false;

    const fetchImage = async () => {
      try {
        setLoading(true);
        setError(false);

        // If it's already a blob URL or external URL, use it directly
        if (src.startsWith("blob:") || src.startsWith("http://") || src.startsWith("https://")) {
          if (!isCancelled) {
            setImageSrc(src);
            setLoading(false);
          }
          return;
        }

        // Fetch the protected image
        const response = await api.get(src, {
          responseType: "blob",
          headers: {
            Accept: "image/*",
          },
        });

        if (!isCancelled) {
          // Create blob URL
          const blob = new Blob([response.data]);
          const blobUrl = URL.createObjectURL(blob);

          // Clean up previous blob URL
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
          }

          blobUrlRef.current = blobUrl;
          setImageSrc(blobUrl);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch protected image:", err);
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
    setLoading(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setError(true);
    setLoading(false);
    onError?.();
  };

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        style={fill ? undefined : { width, height }}
      >
        <AlertTriangle className="w-8 h-8 mb-2" />
        <span className="text-sm">Failed to load image</span>
      </div>
    );
  }

  if (loading || !imageSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={fill ? undefined : { width, height }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Use Next.js Image component with the blob URL
  if (fill) {
    return (
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className={className}
        onLoad={handleImageLoad}
        onError={handleImageError}
        priority={priority}
        sizes={sizes}
      />
    );
  }

  return (
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
    />
  );
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
        if (src.startsWith("blob:") || src.startsWith("http://") || src.startsWith("https://")) {
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
