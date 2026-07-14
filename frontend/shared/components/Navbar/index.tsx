"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  LogOut,
  Settings,
  Sun,
  Moon,
  LayoutDashboard,
  Loader2,
} from "lucide-react";

// Import authentication hooks
import { useCurrentUser, useLogout } from "@/hooks/useAuth";

export function Navbar() {
  const { theme, setTheme } = useTheme();

  // Get current user information from React Query
  const { data: user, isLoading } = useCurrentUser();

  // Get logout function
  const logout = useLogout();

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-background/80 backdrop-blur-md border-b border-border fixed w-full top-0 z-50 shadow-sm transition-colors duration-300">
      {/* --- LEFT: LOGO & MENU --- */}
      <div className="flex items-center space-x-6">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            Boilerplate
          </span>
        </Link>

        <ul className="hidden md:flex items-center space-x-6 text-sm font-medium text-muted-foreground">
          <li>
            <Link
              href="/"
              className="hover:text-foreground transition-colors duration-200"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/about"
              className="hover:text-foreground transition-colors duration-200"
            >
              About
            </Link>
          </li>
        </ul>
      </div>

      {/* --- RIGHT: ACTIONS --- */}
      <div className="flex items-center space-x-3">
        {/* Theme toggle icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-full text-muted-foreground hover:text-foreground"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Authentication flow */}
        {isLoading ? (
          <div className="flex items-center justify-center w-9 h-9">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : user ? (
          /* Logged-in view: Avatar dropdown */
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full hover:bg-muted ml-2 focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatar} alt={user?.fullName} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {user?.fullName
                      ? user.fullName.charAt(0).toUpperCase()
                      : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none truncate">
                    {user.fullName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Dashboard redirection link */}
              <DropdownMenuItem asChild>
                <Link
                  href={user.role === "admin" ? "/admin" : "/"}
                  className="cursor-pointer w-full flex items-center"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Dashboard</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/profile"
                  className="cursor-pointer w-full flex items-center"
                >
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  className="cursor-pointer w-full flex items-center"
                >
                  <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          /* Unauthenticated view: Login/Register buttons */
          <div className="flex items-center space-x-2 ml-2">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-sm font-semibold"
              >
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="text-sm font-semibold shadow-sm">
                Register
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
