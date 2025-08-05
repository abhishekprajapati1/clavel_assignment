"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ProtectedImage from "./protected-image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Crown,
  Lock,
  Download,
  Eye,
  Calendar,
  User,
  Camera,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import PremiumDownloadButton from "./premium-download-button";
import { usePremiumAccess } from "./screenshot-protection";

interface Template {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  can_download?: boolean;
  can_screenshot?: boolean;
  access_level?: string;
}

interface TemplateCardProps {
  template: Template;
  variant?: "grid" | "list";
  showActions?: boolean;
  showUploader?: boolean;
  enableScreenshotProtection?: boolean;
  className?: string;
  onTemplateClick?: (template: Template) => void;
}

export default function TemplateCard({
  template,
  variant = "grid",
  showActions = true,
  showUploader = true,
  enableScreenshotProtection = true,
  className = "",
  onTemplateClick,
}: TemplateCardProps) {
  const router = useRouter();
  const { user, hasPremiumAccess, canDownload, canScreenshot } =
    usePremiumAccess();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const lastToastRef = useRef<number>(0);

  const handleTemplateClick = () => {
    if (onTemplateClick) {
      onTemplateClick(template);
    } else {
      setIsPreviewOpen(true);
    }
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      toast.error("Please sign in to preview templates");
      router.push("/signin");
      return;
    }

    // Always allow preview, but it will be blurred for non-premium users
    setIsPreviewOpen(true);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    // Prevent right-click for non-premium users
    if (!hasPremiumAccess && enableScreenshotProtection) {
      e.preventDefault();
      e.stopPropagation();

      // Debounce toast messages (prevent multiple toasts within 2 seconds)
      const now = Date.now();
      if (now - lastToastRef.current > 2000) {
        toast.error(
          "Right-click disabled. Upgrade to premium for full access.",
        );
        lastToastRef.current = now;
      }

      return false;
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const getImageUrl = () => {
    if (template.image_url.startsWith("http")) {
      return template.image_url;
    }
    // Use protected file serving route - return just the API path
    const filename = template.image_url.split("/").pop(); // Extract filename from path
    return `/api/templates/uploads/${filename}`;
  };

  const getPremiumIndicator = () => {
    if (!user) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Sign In Required
        </Badge>
      );
    }

    if (hasPremiumAccess) {
      return (
        <Badge className="bg-green-600 hover:bg-green-700 flex items-center gap-1">
          <Crown className="w-3 h-3" />
          Full Access
        </Badge>
      );
    }

    return (
      <Badge
        variant="destructive"
        className="bg-orange-600 hover:bg-orange-700 flex items-center gap-1"
      >
        <Lock className="w-3 h-3" />
        Premium Required
      </Badge>
    );
  };

  const cardContent = (
    <Card
      className={`group hover:shadow-lg transition-all duration-200 cursor-pointer ${className} ${
        !hasPremiumAccess && enableScreenshotProtection
          ? "border-orange-200 hover:border-orange-300"
          : "hover:border-blue-300"
      }`}
      onClick={handleTemplateClick}
      onContextMenu={handleContextMenu}
      data-allow-context-menu={hasPremiumAccess ? "true" : undefined}
      data-template-card="true"
    >
      <CardHeader className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              {template.title}
            </CardTitle>
            {template.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {template.description}
              </CardDescription>
            )}
          </div>
          {getPremiumIndicator()}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        {/* Template Image */}
        <div
          className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 mb-4"
          onContextMenu={handleContextMenu}
          data-allow-context-menu={hasPremiumAccess ? "true" : undefined}
        >
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {imageError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <AlertTriangle className="w-8 h-8 mb-2" />
              <span className="text-sm">Failed to load image</span>
            </div>
          ) : (
            <ProtectedImage
              src={getImageUrl()}
              alt={template.title}
              fill
              className={`object-cover transition-all duration-200 ${
                imageLoading ? "opacity-0" : "opacity-100"
              } ${
                !hasPremiumAccess && enableScreenshotProtection
                  ? "group-hover:scale-105 filter blur-[0.5px]"
                  : "group-hover:scale-105"
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}

          {/* Premium Badge for Free Users */}
          {!hasPremiumAccess && enableScreenshotProtection && (
            <div className="absolute top-2 right-2">
              <Badge
                variant="secondary"
                className="text-xs bg-orange-100 text-orange-800"
              >
                Premium
              </Badge>
            </div>
          )}
        </div>

        {/* Template Info */}
        <div className="space-y-3">
          {showUploader && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>By {template.uploaded_by}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Created {formatDate(template.created_at)}</span>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handlePreview}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>

              <PremiumDownloadButton
                templateId={template.id}
                templateTitle={template.title}
                variant="outline"
                size="sm"
                className="flex-1"
                showTooltip={false}
              >
                Download
              </PremiumDownloadButton>
            </div>
          )}

          {/* Access Status */}
          {user && (
            <div className="text-xs text-gray-500 flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-3">
                <span
                  className={`flex items-center gap-1 ${canDownload ? "text-green-600" : "text-red-500"}`}
                >
                  <Download className="w-3 h-3" />
                  {canDownload ? "Can Download" : "No Download"}
                </span>
                <span
                  className={`flex items-center gap-1 ${canScreenshot ? "text-green-600" : "text-red-500"}`}
                >
                  <Camera className="w-3 h-3" />
                  {canScreenshot ? "Can Screenshot" : "No Screenshot"}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {cardContent}

      {/* Template Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">{template.title}</DialogTitle>
                {template.description && (
                  <DialogDescription className="mt-1">
                    {template.description}
                  </DialogDescription>
                )}
              </div>
              {getPremiumIndicator()}
            </div>
          </DialogHeader>

          <div className="relative">
            <div
              className="relative aspect-video rounded-lg overflow-hidden bg-gray-100"
              data-allow-context-menu={hasPremiumAccess ? "true" : undefined}
            >
              {!imageError ? (
                <ProtectedImage
                  src={getImageUrl()}
                  alt={template.title}
                  fill
                  className={`object-contain ${
                    !hasPremiumAccess && enableScreenshotProtection
                      ? "filter blur-[1px]"
                      : ""
                  }`}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <AlertTriangle className="w-12 h-12 mb-2" />
                  <span>Failed to load template image</span>
                </div>
              )}

              {/* Premium overlay for preview */}
              {!hasPremiumAccess && enableScreenshotProtection && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10">
                  <div className="bg-white rounded-lg p-4 text-center shadow-lg">
                    <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-sm font-medium mb-2">Premium Preview</p>
                    <p className="text-xs text-gray-600 mb-3">
                      Upgrade to see full quality
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsPreviewOpen(false);
                        router.push("/payment");
                      }}
                    >
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-gray-600">
              <div>Created by {template.uploaded_by}</div>
              <div>Created on {formatDate(template.created_at)}</div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setIsPreviewOpen(false)} variant="outline">
                Close
              </Button>
              <PremiumDownloadButton
                templateId={template.id}
                templateTitle={template.title}
                showTooltip={false}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Grid variant component
export function TemplateGrid({
  templates,
  loading = false,
  enableScreenshotProtection = true,
  className = "",
  onTemplateClick,
}: {
  templates: Template[];
  loading?: boolean;
  enableScreenshotProtection?: boolean;
  className?: string;
  onTemplateClick?: (template: Template) => void;
}) {
  if (loading) {
    return (
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <AlertTriangle className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          No Templates Found
        </h3>
        <p className="text-gray-500">
          There are no templates available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
    >
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          enableScreenshotProtection={enableScreenshotProtection}
          onTemplateClick={onTemplateClick}
        />
      ))}
    </div>
  );
}
