"use client";

import { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Toaster } from "@/components/ui/sonner";

// NEXT_PUBLIC_CONVEX_URL is populated by `npx convex dev` into .env.local.
// During first-time scaffolding (or if the env var hasn't been set yet) we
// fall back to a placeholder so the app still builds; useQuery / useMutation
// calls will fail at runtime until the real URL is supplied.
const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://placeholder.convex.cloud";

const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      {children}
      <Toaster richColors theme="dark" position="bottom-right" />
    </ConvexProvider>
  );
}
