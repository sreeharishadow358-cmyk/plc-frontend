"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { App, ConfigProvider, theme } from "antd";
import { useThemeStore } from "../store/themeStore";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  const { theme: currentTheme, setTheme } = useThemeStore();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [setTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          algorithm: currentTheme === 'light' ? theme.defaultAlgorithm : theme.darkAlgorithm,
          token: {
            colorPrimary: "#06b6d4", /* Cyan/Electric Blue Industrial Accent */
            colorBgBase: currentTheme === 'light' ? "#ffffff" : "#0f172a",
            colorBgContainer: currentTheme === 'light' ? "#f8fafc" : "#1e293b",
            colorBorder: currentTheme === 'light' ? "#cbd5e1" : "#334155",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
          },
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
