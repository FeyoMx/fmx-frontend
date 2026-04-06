import React from "react";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LayoutProps {
  children: React.ReactNode;
}

function MainLayout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex min-h-[calc(100vh_-_56px)] flex-1 flex-col md:flex-row">
        <ScrollArea className="mr-2 py-6 md:w-64">
          <div className="flex h-full">
            <Sidebar />
          </div>
        </ScrollArea>
        <ScrollArea className="w-full">
          <div className="flex h-full flex-col">
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export { MainLayout };
