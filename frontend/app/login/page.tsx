import React from "react";
import { Heading } from "@/components/Heading";
import { Text } from "@/components/Text";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Column: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>

      {/* Right Column: Decorative Illustration / Branding */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-muted relative overflow-hidden p-12">
        {/* Abstract CSS Pattern */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-indigo-600/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative text-center max-w-md space-y-6 z-10">
          <Heading size="lg" className="text-foreground">
            Welcome back to the Platform
          </Heading>
          <Text className="text-muted-foreground text-sm leading-relaxed">
            Log in to access your dashboard, manage your account, and experience this high-performance Next.js starter template.
          </Text>
        </div>
      </div>
    </div>
  );
}
