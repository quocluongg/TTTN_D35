import React from "react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/shared/components/Navbar";
import Footer from "@/shared/components/Footer";

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen">
      {/* navbar */}
      <Navbar />

      {/* content */}
      <main className={cn("container mx-auto mt-14")}>{children}</main>

      {/* footer */}
      <Footer />
    </div>
  );
};

export default PublicLayout;
