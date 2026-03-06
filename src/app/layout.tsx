import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "AeroWard — Urban Air Intelligence Platform",
    description: "Hyper-local air quality intelligence platform for city administrators managing environmental crises in real time.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
