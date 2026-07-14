"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-muted/50 border-t border-border mt-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and branding */}
          <div className="space-y-4 md:col-span-2">
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
              Boilerplate
            </span>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              A premium, high-performance Next.js starter template leveraging Tailwind CSS v4, Radix UI, TanStack Query, and Axios.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Terms */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>
            &copy; {new Date().getFullYear()} Boilerplate. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
