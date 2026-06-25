import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Operations Command Centre — Shining Overseas",
  description: "Internal CRM for lead pipeline management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Toaster position="top-right" toastOptions={{ style: { fontFamily: "Inter, sans-serif", fontSize: "13px" } }} />
        {children}
      </body>
    </html>
  );
}
