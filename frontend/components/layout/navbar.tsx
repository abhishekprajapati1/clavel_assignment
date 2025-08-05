"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  X,
  Home,
  Settings,
  User,
  LogOut,
  Crown,
  Shield,
  FileImage,
  CreditCard,
  Bell,
  Search,
} from "lucide-react";
import { useUserDetails, useSignOut } from "@/lib/api";
import { toast } from "react-hot-toast";

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/signin",
  "/signup",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/resend-verification",
];

// Helper function to check if current path is a public route
const isPublicRoute = (pathname: string): boolean => {
  return publicRoutes.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(route + "/") || pathname === route;
  });
};

interface NavbarProps {
  className?: string;
}

export function Navbar({ className = "" }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const {
    data: user,
    isLoading,
    isError,
  } = useUserDetails({
    enabled: !isPublicRoute(pathname),
  });
  const signOut = useSignOut();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = () => {
    signOut.mutate();
  };

  const getUserInitials = () => {
    if (!user) return "U";
    return `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();
  };

  const isActivePath = (path: string) => {
    return pathname === path;
  };

  // Don't show navbar on auth pages
  if (
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/resend-verification")
  ) {
    return null;
  }

  const navigationLinks =
    user?.role === "admin"
      ? [
          {
            name: "Dashboard",
            href: "/dashboard",
            icon: Home,
            description: "Template stats and overview",
          },
          {
            name: "Templates",
            href: "/templates",
            icon: FileImage,
            description: "Manage all templates",
          },
          {
            name: "Users",
            href: "/users",
            icon: User,
            description: "Manage registered users",
          },
        ]
      : [
          {
            name: "Templates",
            href: "/templates",
            icon: FileImage,
            description: "Browse template collection",
          },
        ];

  return (
    <nav
      className={`bg-white backdrop-blur-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 min-h-[4rem]">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="flex items-center space-x-3 group"
            >
              <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="text-white font-bold text-lg relative z-10 group-hover:scale-110 transition-transform duration-300">
                  T
                </span>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:via-purple-700 group-hover:to-blue-900 transition-all duration-300">
                  Templater
                </span>
                <div className="text-xs text-gray-500 -mt-1 group-hover:text-gray-600 transition-colors duration-300">
                  Template Manager
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {user && (
              <>
                {navigationLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`
                        group flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden
                        ${
                          isActivePath(link.href)
                            ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 shadow-md border border-blue-200"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:shadow-sm"
                        }
                      `}
                    >
                      <Icon
                        className={`w-4 h-4 mr-2 transition-transform duration-300 ${isActivePath(link.href) ? "text-blue-600" : "group-hover:scale-110"}`}
                      />
                      <span className="relative z-10">{link.name}</span>
                      {!isActivePath(link.href) && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      )}
                    </Link>
                  );
                })}
              </>
            )}
          </div>

          {/* User Menu and Actions */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full"></div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                {/* Notifications */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative group hover:bg-blue-50 transition-all duration-300"
                >
                  <Bell className="w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors duration-300 group-hover:scale-110" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg"></span>
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full animate-ping"></span>
                </Button>

                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full group"
                    >
                      <Avatar className="h-10 w-10 ring-2 ring-blue-100 group-hover:ring-blue-300 group-hover:ring-4 transition-all duration-300 group-hover:scale-105">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white text-sm font-semibold group-hover:from-blue-600 group-hover:to-purple-700 transition-all duration-300">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </p>
                          {user.is_premium && (
                            <Badge className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white text-xs shadow-lg animate-pulse">
                              <Crown className="w-3 h-3 mr-1 animate-bounce" />
                              Premium
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <div className="flex space-x-1">
                          <Badge
                            variant={
                              user.is_verified ? "default" : "destructive"
                            }
                            className="text-xs"
                          >
                            {user.is_verified ? "Verified" : "Unverified"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard"
                        className="flex items-center cursor-pointer"
                      >
                        <Home className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link
                        href="/settings"
                        className="flex items-center cursor-pointer"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>

                    {!user.is_premium && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/payment"
                          className="flex items-center cursor-pointer text-orange-600"
                        >
                          <Crown className="mr-2 h-4 w-4" />
                          <span>Upgrade to Premium</span>
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              // Not authenticated
              <div className="flex items-center space-x-2">
                <Button variant="ghost" onClick={() => router.push("/signin")}>
                  Sign In
                </Button>
                <Button onClick={() => router.push("/signup")}>Sign Up</Button>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && user && (
          <div className="md:hidden border-t border-gray-200 py-4 animate-in slide-in-from-top-5 duration-300">
            <div className="space-y-1">
              {navigationLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      group flex items-center px-4 py-3 text-base font-medium rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-sm
                      ${
                        isActivePath(link.href)
                          ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 shadow-md border-l-4 border-blue-500"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50"
                      }
                    `}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon
                      className={`w-5 h-5 mr-3 transition-transform duration-300 ${isActivePath(link.href) ? "text-blue-600" : "group-hover:scale-110"}`}
                    />
                    <div>
                      <div className="group-hover:translate-x-1 transition-transform duration-300">
                        {link.name}
                      </div>
                      <div className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                        {link.description}
                      </div>
                    </div>
                  </Link>
                );
              })}

              <div className="border-t border-gray-200 mt-4 pt-4">
                <Link
                  href="/settings"
                  className="group flex items-center px-4 py-3 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="w-5 h-5 mr-3 group-hover:scale-110 group-hover:rotate-90 transition-transform duration-300" />
                  <div>
                    <div className="group-hover:translate-x-1 transition-transform duration-300">
                      Settings
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                      Account and preferences
                    </div>
                  </div>
                </Link>

                {!user.is_premium && (
                  <Link
                    href="/payment"
                    className="group flex items-center px-4 py-3 text-base font-medium text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-md border border-orange-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Crown className="w-5 h-5 mr-3 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300 animate-pulse" />
                    <div>
                      <div className="group-hover:translate-x-1 transition-transform duration-300">
                        Upgrade to Premium
                      </div>
                      <div className="text-xs text-orange-500 group-hover:text-orange-600 transition-colors duration-300">
                        Unlock all features
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
