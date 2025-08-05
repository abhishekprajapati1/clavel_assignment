"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { Shield, Crown } from "lucide-react";
import { usePremiumAccess } from "./screenshot-protection";

/**
 * DevToolsProtection Component
 *
 * Implements targeted protection for free users while allowing full access for premium users.
 *
 * DEBOUNCING SYSTEM:
 * - Uses refs (lastToastRef, lastDevToolsAttemptRef) to track last action timestamps
 * - Prevents multiple toast messages within 2-second windows
 * - Avoids annoying users with spam notifications
 * - Template cards handle their own right-click events to prevent conflicts
 *
 * EVENT HANDLING HIERARCHY:
 * 1. Template cards handle right-click with data-template-card="true"
 * 2. Global handler skips elements with data-allow-context-menu="true"
 * 3. Global handler checks for defaultPrevented to avoid conflicts
 * 4. Debouncing ensures only one toast per time window
 */
export default function DevToolsProtection() {
  const { user, hasPremiumAccess, loading } = usePremiumAccess();
  const [protectionActive, setProtectionActive] = useState(false);
  const lastToastRef = useRef<number>(0);
  const lastDevToolsAttemptRef = useRef<number>(0);

  const detectInitialDevTools = useCallback(() => {
    if (loading || !user || hasPremiumAccess) return;

    // Check if dev tools are already open on page load
    const threshold = 200;
    const isDevToolsOpen =
      window.outerHeight - window.innerHeight > threshold ||
      window.outerWidth - window.innerWidth > threshold;

    if (isDevToolsOpen) {
      // Show persistent warning for dev tools being open
      toast.error(
        "Developer tools detected. Please close them for the best experience.",
        {
          duration: 5000,
        },
      );

      // Apply visual feedback
      document.body.style.filter = "blur(2px)";
      document.body.style.pointerEvents = "none";

      // Create overlay with instructions
      const overlay = document.createElement("div");
      overlay.id = "devtools-warning-overlay";
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: system-ui, -apple-system, sans-serif;
      `;

      overlay.innerHTML = `
        <div style="text-align: center; padding: 2rem; background: #1f2937; border-radius: 0.5rem; max-width: 400px;">
          <h2 style="margin: 0 0 1rem 0; color: #f59e0b;">⚠️ Developer Tools Detected</h2>
          <p style="margin: 0 0 1.5rem 0; line-height: 1.5;">
            Please close the developer tools to continue using the application.
            This helps protect our content and ensures the best user experience.
          </p>
          <p style="margin: 0; font-size: 0.875rem; color: #9ca3af;">
            Premium users have unrestricted access to developer tools.
          </p>
        </div>
      `;

      document.body.appendChild(overlay);

      // Check periodically if dev tools are closed
      const checkClosed = setInterval(() => {
        const stillOpen =
          window.outerHeight - window.innerHeight > threshold ||
          window.outerWidth - window.innerWidth > threshold;

        if (!stillOpen) {
          // Dev tools closed, remove restrictions
          document.body.style.filter = "";
          document.body.style.pointerEvents = "";
          const existingOverlay = document.getElementById(
            "devtools-warning-overlay",
          );
          if (existingOverlay) {
            existingOverlay.remove();
          }
          clearInterval(checkClosed);
          toast.success("Thank you! You can now use the application normally.");
        }
      }, 1000);
    }
  }, [loading, user, hasPremiumAccess]);

  const handleDevToolsAttempt = useCallback(() => {
    if (loading || !user) return;

    if (!hasPremiumAccess) {
      const now = Date.now();

      // Debounce dev tools attempts (prevent multiple triggers within 2 seconds)
      if (now - lastDevToolsAttemptRef.current > 2000) {
        setProtectionActive(true);
        toast.error(
          "Developer tools disabled. Upgrade to premium for full access.",
        );
        lastDevToolsAttemptRef.current = now;

        // Hide indicator after 3 seconds
        setTimeout(() => {
          setProtectionActive(false);
        }, 3000);
      }
    }
  }, [loading, user, hasPremiumAccess]);

  const blockDevTools = useCallback(
    (e: KeyboardEvent) => {
      if (loading || !user || hasPremiumAccess) return;

      // Block common dev tools shortcuts
      const isF12 = e.key === "F12";
      const isCtrlShiftI =
        (e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I";
      const isCtrlShiftC =
        (e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C";
      const isCtrlShiftJ =
        (e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "J";
      const isCtrlU = (e.ctrlKey || e.metaKey) && e.key === "u";
      const isCtrlShiftK =
        (e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "K";
      const isCtrlShiftE =
        (e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "E";

      if (
        isF12 ||
        isCtrlShiftI ||
        isCtrlShiftC ||
        isCtrlShiftJ ||
        isCtrlU ||
        isCtrlShiftK ||
        isCtrlShiftE
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleDevToolsAttempt();
        return false;
      }
    },
    [loading, user, hasPremiumAccess, handleDevToolsAttempt],
  );

  // Dev tools detection method 1: Window size detection
  const detectConsoleDevtools = useCallback(() => {
    if (loading || !user || hasPremiumAccess) return;

    const threshold = 200;
    const devtools = {
      open: false,
      orientation: null as string | null,
    };

    const detector = () => {
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtools.open) {
          devtools.open = true;
          handleDevToolsAttempt();

          // Blur the page temporarily
          document.body.style.filter = "blur(5px)";
          setTimeout(() => {
            document.body.style.filter = "";
          }, 2000);
        }
      } else {
        devtools.open = false;
      }
    };

    return detector;
  }, [loading, user, hasPremiumAccess, handleDevToolsAttempt]);

  // Dev tools detection method 2: Console timing
  const detectConsoleAccess = useCallback(() => {
    if (loading || !user || hasPremiumAccess) return;

    let devtoolsOpen = false;

    const element = document.createElement("div");
    Object.defineProperty(element, "id", {
      get: function () {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          handleDevToolsAttempt();

          // Visual feedback
          document.body.style.filter = "blur(3px)";
          setTimeout(() => {
            document.body.style.filter = "";
          }, 1500);
        }
        return "devtools-detector";
      },
    });

    // Trigger the getter when console is accessed
    setInterval(() => {
      if (loading || !user || hasPremiumAccess) return;
      console.clear();
      console.log(element);
      devtoolsOpen = false;
    }, 1000);
  }, [loading, user, hasPremiumAccess, handleDevToolsAttempt]);

  // Disable right-click globally for free users
  const handleGlobalContextMenu = useCallback(
    (e: MouseEvent) => {
      if (loading || !user || hasPremiumAccess) return;

      // Check if event was already prevented (by template card or other specific handlers)
      if (e.defaultPrevented) return;

      // Only block if not already handled by a specific component
      const target = e.target as HTMLElement;

      // Check for allow-list elements
      if (target.closest('[data-allow-context-menu="true"]')) return;

      // Check if this is within a template card (let template card handle it)
      if (target.closest('[data-template-card="true"]')) return;

      e.preventDefault();

      const now = Date.now();

      // Debounce toast messages (prevent multiple toasts within 2 seconds)
      if (now - lastToastRef.current > 2000) {
        toast.error(
          "Right-click disabled. Upgrade to premium for full access.",
        );
        lastToastRef.current = now;
      }

      return false;
    },
    [loading, user, hasPremiumAccess],
  );

  useEffect(() => {
    if (loading) return;

    // Detect if dev tools are already open on page load
    setTimeout(() => {
      detectInitialDevTools();
    }, 1000);

    // Add keyboard event listener
    document.addEventListener("keydown", blockDevTools, true);

    // Add context menu listener
    document.addEventListener("contextmenu", handleGlobalContextMenu, true);

    // Set up dev tools detection for free users
    let resizeDetector: (() => void) | undefined;
    let resizeInterval: NodeJS.Timeout | undefined;

    if (user && !hasPremiumAccess) {
      // Method 1: Window resize detection
      resizeDetector = detectConsoleDevtools();
      if (resizeDetector) {
        resizeInterval = setInterval(resizeDetector, 500);
      }

      // Method 2: Console access detection (delayed to avoid initial trigger)
      setTimeout(() => {
        detectConsoleAccess();
      }, 2000);

      // Disable text selection for free users
      document.body.style.userSelect = "none";
      document.body.style.setProperty("-webkit-user-select", "none");
      document.body.style.setProperty("-ms-user-select", "none");
      document.body.style.setProperty("-moz-user-select", "none");

      // Add CSS to disable highlighting
      const style = document.createElement("style");
      style.textContent = `
        .no-select {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }
      `;
      document.head.appendChild(style);
      document.body.classList.add("no-select");

      return () => {
        document.head.removeChild(style);
        document.body.classList.remove("no-select");
      };
    }

    // Cleanup function
    return () => {
      document.removeEventListener("keydown", blockDevTools, true);
      document.removeEventListener(
        "contextmenu",
        handleGlobalContextMenu,
        true,
      );

      if (resizeInterval) {
        clearInterval(resizeInterval);
      }

      // Restore text selection
      document.body.style.userSelect = "";
      document.body.style.setProperty("-webkit-user-select", "");
      document.body.style.setProperty("-ms-user-select", "");
      document.body.style.setProperty("-moz-user-select", "");
    };
  }, [
    loading,
    user,
    hasPremiumAccess,
    blockDevTools,
    handleGlobalContextMenu,
    detectConsoleDevtools,
    detectConsoleAccess,
    detectInitialDevTools,
  ]);

  // Render protection indicator for free users
  if (!user || loading) return null;

  return (
    <>
      {/* Protection Active Indicator */}
      {protectionActive && !hasPremiumAccess && (
        <div className="fixed top-20 right-4 z-[60] animate-in fade-in slide-in-from-right-2">
          <div className="bg-orange-100 border border-orange-300 rounded-lg p-3 shadow-lg max-w-sm">
            <div className="flex items-center gap-2 text-orange-800">
              <Shield className="w-5 h-5" />
              <div>
                <p className="font-medium text-sm">Protection Active</p>
                <p className="text-xs text-orange-600">
                  Developer tools blocked for free users
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Status Indicator */}
      {user && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              hasPremiumAccess
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-orange-100 text-orange-800 border border-orange-300"
            }`}
          >
            <div className="flex items-center gap-1">
              {hasPremiumAccess ? (
                <>
                  <Crown className="w-3 h-3" />
                  <span>Premium</span>
                </>
              ) : (
                <>
                  <Shield className="w-3 h-3" />
                  <span>Protected</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Hook to temporarily allow context menu for specific components
export function useAllowContextMenu() {
  const setAllowContextMenu = useCallback(
    (element: HTMLElement | null, allow: boolean) => {
      if (element) {
        if (allow) {
          element.setAttribute("data-allow-context-menu", "true");
        } else {
          element.removeAttribute("data-allow-context-menu");
        }
      }
    },
    [],
  );

  return setAllowContextMenu;
}

// HOC to protect specific pages
export function withDevToolsProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: { level?: "basic" | "strict" } = {},
) {
  return function ProtectedComponent(props: P) {
    return (
      <>
        <DevToolsProtection />
        <WrappedComponent {...props} />
      </>
    );
  };
}
