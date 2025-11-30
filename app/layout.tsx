import type { Metadata } from "next";
import"../styles/globals.css";

export const metadata: Metadata = {
  title: "Relationship Decision Engine",
  description: "Analyze and understand your relationships using AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
