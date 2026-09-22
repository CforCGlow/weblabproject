import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata = { title: "SEU LigaPro - Football Management System", description: "SEU LigaPro league portal for fixtures, clubs and players" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
