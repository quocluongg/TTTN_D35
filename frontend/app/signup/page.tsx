import React from "react";
import { Heading } from "@/components/Heading";
import { Text } from "@/components/Text";
import SignUpForm from "./SignUpForm";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Column: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <SignUpForm />
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
            Join Our Platform
          </Heading>
          <Text className="text-muted-foreground text-sm leading-relaxed">
            Create an account to start testing components, building pages, and exploring state and routing integration in Next.js 16.
          </Text>
        </div>
      </div>
    </div>
  );
}
