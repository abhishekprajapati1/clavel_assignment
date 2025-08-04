"use client";

import { useEffect, useRef, ReactNode } from "react";

interface ScreenshotProtectionProps {
  children: ReactNode;
  onScreenshotAttempt: () => void;
}

export function ScreenshotProtection({
  children,
  onScreenshotAttempt,
}: ScreenshotProtectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      onScreenshotAttempt();
    };

    // Disable keyboard shortcuts for screenshots
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect common screenshot shortcuts
      const isPrintScreen = e.key === "PrintScreen";
      const isCtrlShiftI = e.ctrlKey && e.shiftKey && e.key === "I"; // Developer tools
      const isF12 = e.key === "F12"; // Developer tools
      const isCtrlShiftC = e.ctrlKey && e.shiftKey && e.key === "C"; // Developer tools
      const isCtrlU = e.ctrlKey && e.key === "u"; // View source
      const isCtrlS = e.ctrlKey && e.key === "s"; // Save page

      if (
        isPrintScreen ||
        isCtrlShiftI ||
        isF12 ||
        isCtrlShiftC ||
        isCtrlU ||
        isCtrlS
      ) {
        e.preventDefault();
        onScreenshotAttempt();
      }
    };

    // Detect visibility change (potential screenshot)
    let visibilityChangeTimeout: NodeJS.Timeout;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Clear any existing timeout
        if (visibilityChangeTimeout) {
          clearTimeout(visibilityChangeTimeout);
        }

        // Set a timeout to detect if the page becomes visible again quickly
        // This might indicate a screenshot was taken
        visibilityChangeTimeout = setTimeout(() => {
          if (!document.hidden) {
            onScreenshotAttempt();
          }
        }, 100);
      }
    };

    // Disable drag and drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      onScreenshotAttempt();
    };

    // Disable selection
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };

    // Add event listeners
    container.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    container.addEventListener("dragstart", handleDragStart);
    container.addEventListener("selectstart", handleSelectStart);

    // Disable text selection via CSS
    container.style.userSelect = "none";
    container.style.setProperty("-webkit-user-select", "none");
    container.style.setProperty("-moz-user-select", "none");
    container.style.setProperty("-ms-user-select", "none");

    // Disable image dragging
    const images = container.querySelectorAll("img");
    images.forEach((img) => {
      img.draggable = false;
      img.addEventListener("dragstart", handleDragStart);
    });

    // Cleanup function
    return () => {
      container.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      container.removeEventListener("dragstart", handleDragStart);
      container.removeEventListener("selectstart", handleSelectStart);

      if (visibilityChangeTimeout) {
        clearTimeout(visibilityChangeTimeout);
      }

      images.forEach((img) => {
        img.removeEventListener("dragstart", handleDragStart);
      });
    };
  }, [onScreenshotAttempt]);

  return (
    <div
      ref={containerRef}
      className="protected-content select-none blur-[2px]"
      style={{ userSelect: "none" }}
    >
      {children}
    </div>
  );
}
