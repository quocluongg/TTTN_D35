import React from "react";
import PublicLayout from "@/shared/layouts/PublicLayout";
import SignUpForm from "./SignUpForm";

export default function SignUpPage() {
  return (
    <PublicLayout fullWidth>
      <div className="w-full bg-[#F2F2F2] dark:bg-zinc-950 min-h-[calc(100vh-60px)] flex items-center justify-center py-16 lg:py-24 px-4 transition-colors duration-300">
        <SignUpForm />
      </div>
    </PublicLayout>
  );
}
