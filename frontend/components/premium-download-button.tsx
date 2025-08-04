"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Lock,
  Crown,
  AlertCircle,
  CheckCircle,
  Camera,
} from "lucide-react";
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
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const handleDownload = async () => {
    if (!user) {
      toast.error("Please sign in to download templates");
      router.push("/signin");
      return;
    }

    if (!canDownload) {
      setShowUpgradeDialog(true);
      return;
    }

    try {
      await downloadTemplate.mutateAsync({ templateId, templateTitle });
    } catch (error) {
      // Check if it's a payment required error
      const axiosError = error as any;
      if (axiosError.response?.status === 402) {
        setShowUpgradeDialog(true);
      }
      // Other errors are handled by the mutation
    }
  };

  const handleUpgrade = () => {
    setShowUpgradeDialog(false);
    router.push("/payment");
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
    if (!user || !canDownload) {
      return "outline";
    }
    return variant;
  };

  const getTooltipContent = () => {
    if (loading) return "Loading...";
    if (!user) return "Sign in to download templates";
    if (!canDownload) return "Premium access required for downloads";
    return "Download this template";
  };

  const button = (
    <Button
      onClick={handleDownload}
      variant={getButtonVariant()}
      size={size}
      className={`${className} ${
        !user || !canDownload
          ? "border-orange-300 text-orange-600 hover:bg-orange-50"
          : ""
      }`}
      disabled={loading || downloadTemplate.isPending}
    >
      {getButtonContent()}
    </Button>
  );

  if (!showTooltip) {
    return (
      <>
        {button}
        <UpgradeDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          onUpgrade={handleUpgrade}
          templateTitle={templateTitle}
        />
      </>
    );
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipContent()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        onUpgrade={handleUpgrade}
        templateTitle={templateTitle}
      />
    </>
  );
}

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade: () => void;
  templateTitle: string;
}

function UpgradeDialog({
  open,
  onOpenChange,
  onUpgrade,
  templateTitle,
}: UpgradeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-6 h-6 text-orange-500" />
            <DialogTitle>Premium Access Required</DialogTitle>
          </div>
          <DialogDescription>
            To download "{templateTitle}" and other templates, upgrade to
            premium
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-gray-800 mb-3">
              Premium Features Include:
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span>Unlimited template downloads</span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <Camera className="w-4 h-4" />
                <span>Screenshot access for all templates</span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <Crown className="w-4 h-4" />
                <span>Priority customer support</span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span>Commercial use license</span>
              </div>
            </div>
          </div>

          <div className="text-center bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span className="text-lg font-semibold">Premium Access</span>
            </div>
            <p className="text-3xl font-bold text-green-600 mb-1">$9.99</p>
            <p className="text-sm text-gray-600">
              One-time payment • No subscription
            </p>
          </div>

          <div className="space-y-2">
            <Button onClick={onUpgrade} className="w-full" size="lg">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs text-gray-500">
              🔒 Secure payment powered by Stripe
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
              <span>💳 All Cards Accepted</span>
              <span>🛡️ Money Back Guarantee</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const handleBulkDownload = async () => {
    if (!user) {
      toast.error("Please sign in to download templates");
      router.push("/signin");
      return;
    }

    if (!canDownload) {
      setShowUpgradeDialog(true);
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
    <>
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

      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        onUpgrade={() => {
          setShowUpgradeDialog(false);
          router.push("/payment");
        }}
        templateTitle={`${templateIds.length} templates`}
      />
    </>
  );
}
