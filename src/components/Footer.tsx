export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t py-4 px-6 lg:pl-[calc(70px+1.5rem)] xl:pl-[calc(250px+1.5rem)]">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-muted-foreground">
          © {currentYear} Meshwar Admin. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
            Privacy Policy
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
            Terms of Service
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
            Help Center
          </a>
        </div>
      </div>
    </footer>
  );
} 