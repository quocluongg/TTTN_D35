"use client";

import React from "react";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { Heading } from "@/components/Heading";
import { Text } from "@/components/Text";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useModal } from "@/modals/useModal";
import { ConfirmModal } from "@/modals/ConfirmModals";
import { notifySuccess, notifyInfo } from "@/components/Notify";
import { useCurrentUser } from "@/hooks/useAuth";
import { Terminal, Shield, Zap, Sparkles, Sliders, Layers } from "lucide-react";

export default function Home() {
  const { data: user } = useCurrentUser();

  // Initialize custom confirm modal using our useModal bridge
  const confirmModal = useModal(ConfirmModal);

  const handleTestModal = () => {
    confirmModal.show({
      title: "Test Action Confirmation",
      content: "Are you sure you want to test the boilerplate's modal bridge and promise integration?",
      labels: { cancel: "Cancel", action: "Confirm" },
      async: true,
      onAction: async () => {
        // Mock a backend response delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        notifySuccess("Action confirmed successfully! The modal bridge transitions smoothly.");
      },
    });
  };

  return (
    <PublicLayout>
      <div className="relative isolate overflow-hidden min-h-[85vh] flex flex-col justify-center">
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        {/* Hero Section */}
        <div className="mx-auto max-w-5xl px-6 pt-10 pb-16 text-center lg:pt-20">
          <div className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary font-medium mb-6 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next.js 16 Canary &bull; Tailwind CSS v4</span>
            </div>

            <Heading size="xl" className="tracking-tight text-foreground sm:text-6xl bg-gradient-to-b from-foreground via-foreground/90 to-foreground/75 bg-clip-text text-transparent">
              High-Performance Boilerplate
            </Heading>
            
            <Text className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              A premium, production-ready frontend framework leveraging the latest React 19 capabilities, Tailwind v4 styling engine, and robust state/modal pipelines.
            </Text>

            {user ? (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Text className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  Welcome back, {user.fullName}! (Role: {user.role})
                </Text>
              </div>
            ) : (
              <div className="mt-10 flex items-center justify-center gap-x-4">
                <Button onClick={handleTestModal} className="h-11 px-6 shadow-md transition-all duration-300 hover:scale-[1.02]">
                  Test Interactive Modal
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => notifyInfo("To see toast notification styles, click around!")}
                  className="h-11 px-6"
                >
                  Test Custom Toast
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mx-auto max-w-6xl px-6 pb-20">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all duration-300">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Zap className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-semibold">Turbo Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-muted-foreground">
                  Powered by Next.js 16 Canary and React 19 Server Components, featuring instant load times and optimal builds.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all duration-300">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-semibold">Tailwind CSS v4</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-muted-foreground">
                  Leverages the new high-performance CSS-first architecture with custom @theme custom variables for seamless theme syncing.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all duration-300">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <Shield className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-semibold">Authentication Ready</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-muted-foreground">
                  Built-in JWT cookies authentication middleware, custom React Hook Form validations, and router-level guards.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all duration-300">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Layers className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-semibold">NiceModal & Dialogs</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-muted-foreground">
                  A custom bridge hook (`useModal`) unifying ebay-nice-modal-react and Radix UI dialog animations smoothly.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all duration-300">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Terminal className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-semibold">TanStack Query v5</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-muted-foreground">
                  Advanced data-fetching pipeline configured with cache management, automatic token appending, and mock APIs.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all duration-300">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-semibold">Clean UI / Forms</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-muted-foreground">
                  Reusable, strongly typed Shadcn UI inputs (`InputField`, `PasswordField`, `TextareaField`) working with Zod.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
