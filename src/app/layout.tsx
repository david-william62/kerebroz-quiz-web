import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ektha Tech Quiz — CSE Department",
  description: "Technical quiz competition by the CSE Department. Test your knowledge and compete for the top spot!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
