import "./globals.css";

export const metadata = {
  title: "FinScope | Financial Fundamentals",
  description: "Explore financial fundamentals of Indian listed companies.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
