"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Download, Lock, Crown } from "lucide-react";
import { toast } from "react-hot-toast";
import { useDownloadTemplate } from "@/lib/api";
import { usePremiumAccess } from "./screenshot-protection";

interface PremiumDownloadButtonProps {
  templateId: string;
  templateTitle: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
  showTooltip?: boolean;
  children?: React.ReactNode;
}

export default function PremiumDownloadButton({
  templateId,
  templateTitle,
  variant = "default",
  size = "default",
  className = "",
  showTooltip = true,
  children,
}: PremiumDownloadButtonProps) {
  const router = useRouter();
  const { user, loading, hasPremiumAccess, canDownload } = usePremiumAccess();
  const downloadTemplate = useDownloadTemplate();

  const handleDownload = async () => {
    if (!user) {
      toast.error("Please sign in to download templates");
      router.push("/signin");
      return;
    }

    if (!canDownload) {
      // Redirect non-premium users to payment page
      router.push("/payment");
      return;
    }

    try {
      await downloadTemplate.mutateAsync({ templateId, templateTitle });
    } catch (error) {
      // Check if it's a payment required error
      const axiosError = error as any;
      if (axiosError.response?.status === 402) {
        router.push("/payment");
      }
      // Other errors are handled by the mutation
    }
  };

  const getButtonContent = () => {
    if (loading) {
      return (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
          Loading...
        </>
      );
    }

    if (downloadTemplate.isPending) {
      return (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
          Downloading...
        </>
      );
    }

    if (!user) {
      return (
        <>
          <Lock className="w-4 h-4 mr-2" />
          Sign In to Download
        </>
      );
    }

    if (!canDownload) {
      return (
        <>
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to Download
        </>
      );
    }

    return (
      <>
        <Download className="w-4 h-4 mr-2" />
        {children || "Download"}
      </>
    );
  };

  const getButtonVariant = () => {
    if (!user) {
      return "outline";
    }
    if (!canDownload) {
      return "outline";
    }
    return variant;
  };

  const getTooltipContent = () => {
    if (loading) return "Loading...";
    if (!user) return "Sign in to download templates";
    if (!canDownload) return "Click to upgrade to premium";
    return "Download this template";
  };

  const button = (
    <Button
      onClick={handleDownload}
      variant={getButtonVariant()}
      size={size}
      className={`${className} ${
        !user
          ? "border-gray-300 text-gray-600 hover:bg-gray-50"
          : !canDownload
            ? "border-orange-300 text-orange-600 hover:bg-orange-50"
            : ""
      }`}
      disabled={loading || downloadTemplate.isPending}
    >
      {getButtonContent()}
    </Button>
  );

  if (!showTooltip) {
    return button;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Bulk download component for multiple templates
interface BulkDownloadButtonProps {
  templateIds: string[];
  className?: string;
  children?: React.ReactNode;
}

export function BulkDownloadButton({
  templateIds,
  className = "",
  children,
}: BulkDownloadButtonProps) {
  const router = useRouter();
  const { user, hasPremiumAccess, canDownload } = usePremiumAccess();
  const downloadTemplate = useDownloadTemplate();

  const handleBulkDownload = async () => {
    if (!user) {
      toast.error("Please sign in to download templates");
      router.push("/signin");
      return;
    }

    if (!canDownload) {
      router.push("/payment");
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const templateId of templateIds) {
      try {
        await downloadTemplate.mutateAsync({
          templateId,
          templateTitle: `template_${templateId}`,
        });
        successCount++;

        // Small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Download error for template ${templateId}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Downloaded ${successCount} template(s) successfully!`);
    }
    if (failCount > 0) {
      toast.error(`Failed to download ${failCount} template(s)`);
    }
  };

  return (
    <Button
      onClick={handleBulkDownload}
      variant={canDownload ? "default" : "outline"}
      className={`${className} ${
        !canDownload
          ? "border-orange-300 text-orange-600 hover:bg-orange-50"
          : ""
      }`}
      disabled={downloadTemplate.isPending || templateIds.length === 0}
    >
      {downloadTemplate.isPending ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
          Downloading...
        </>
      ) : !canDownload ? (
        <>
          <Crown className="w-4 h-4 mr-2" />
          {children || `Upgrade to Download (${templateIds.length})`}
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          {children || `Download Selected (${templateIds.length})`}
        </>
      )}
    </Button>
  );
}
