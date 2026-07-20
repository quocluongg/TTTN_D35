import React from "react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/shared/components/Navbar";
import Footer from "@/shared/components/Footer";

interface PublicLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children, fullWidth = true }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F2F2F2] dark:bg-zinc-950">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className={cn("flex-1 pt-[60px]", fullWidth ? "w-full" : "container mx-auto px-4 md:px-6")}>
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PublicLayout;
