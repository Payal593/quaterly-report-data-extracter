import "./globals.css";
import { Inter } from "next/font/google";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "FinScope | Financial Fundamentals",
  description: "Explore financial fundamentals of Indian listed companies.",
};

const themeScript = `
  (() => {
    try {
      const savedTheme = localStorage.getItem("finscope-theme");
      const theme = savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch (_) {}
  })();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.variable}>
        {children}
        <Footer />
      </body>
    </html>
  );
}
