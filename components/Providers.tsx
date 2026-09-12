"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Bootstrap's JS (dropdowns, modals) needs to attach on the client only.
    // @ts-expect-error -- bootstrap's bundle has no type declarations
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
    import("aos").then((AOS) => {
      AOS.init({ duration: 500, once: true, disable: "mobile" });
    });
  }, []);

  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "0.65rem",
            background: "#12213D",
            color: "#fff",
            fontFamily: "Sora, sans-serif",
            fontSize: "0.9rem",
          },
        }}
      />
    </SessionProvider>
  );
}
