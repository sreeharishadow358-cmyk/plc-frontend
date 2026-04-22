import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "PLC·AI — Mitsubishi GX Works3 Logic Generator",
  description: "AI-powered Mitsubishi PLC ladder logic generator for GX Works3",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
