import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 px-4 py-6 md:px-6 lg:pl-[calc(70px+1.5rem)] xl:pl-[calc(250px+1.5rem)]">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
} 