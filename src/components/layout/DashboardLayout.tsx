"use client";

import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { FirstTimeSetupDialog } from "@/components/FirstTimeSetupDialog";

export const DashboardLayout = () => {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasVisitedBefore = localStorage.getItem("hasVisitedBefore");
      if (!hasVisitedBefore) {
        setShowFirstTimeSetup(true);
      }
    }
  }, []);

  if (isMobile) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-50">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Abrir Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>
        <div className="flex flex-col h-full w-full overflow-auto p-4 pt-16">
          <Outlet />
        </div>
        {showFirstTimeSetup && (
          <FirstTimeSetupDialog
            open={showFirstTimeSetup}
            onOpenChange={setShowFirstTimeSetup}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <ResizablePanelGroup direction="horizontal" className="min-h-screen items-stretch">
        <ResizablePanel defaultSize={15} minSize={10} maxSize={20}>
          <Sidebar />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={85}>
          <div className="flex flex-col h-full overflow-auto p-4">
            <Outlet />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      {showFirstTimeSetup && (
        <FirstTimeSetupDialog
          open={showFirstTimeSetup}
          onOpenChange={setShowFirstTimeSetup}
        />
      )}
    </div>
  );
};