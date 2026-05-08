import React from "react";
import { useParams } from "react-router-dom";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

import { InstanceProvider } from "@/contexts/InstanceContext";

interface LayoutProps {
  children: React.ReactNode;
}

function InstanceLayout({ children }: LayoutProps) {
  const { instanceId } = useParams<{ instanceId: string }>();

  return (
    <InstanceProvider>
      <div className="flex h-screen flex-col">
        <Header instanceId={instanceId} />

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <ScrollArea className="mr-2 min-h-0 py-6 md:w-64">
            <div className="flex h-full">
              <Sidebar />
            </div>
          </ScrollArea>
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex min-h-full flex-col">
              <div className="my-2 flex min-h-0 flex-1 flex-col gap-2 pl-2 pr-4">{children}</div>
              <Footer />
            </div>
          </ScrollArea>
        </div>
      </div>
    </InstanceProvider>
  );
}

export { InstanceLayout };
