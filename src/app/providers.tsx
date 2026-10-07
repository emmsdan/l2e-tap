"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { L2EProvider } from "@/lib/l2e";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <L2EProvider>
        <TooltipProvider delayDuration={150}>
          {children}
          <Toaster richColors position="bottom-right" />
        </TooltipProvider>
      </L2EProvider>
    </QueryClientProvider>
  );
}
