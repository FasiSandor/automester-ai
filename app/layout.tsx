import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
 title: "AutoMester AI", description: "AI autódiagnosztika, hibakódok és alkatrészkeresés",
 manifest: "/manifest.webmanifest", appleWebApp: { capable: true, title: "AutoMester" }
};
export const viewport: Viewport = { themeColor: "#0b0f14", width: "device-width", initialScale: 1 };
export default function RootLayout({children}:{children:React.ReactNode}) {
 return <html lang="hu"><body>{children}</body></html>;
}
