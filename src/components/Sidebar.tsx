"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  MapPin,
  Layers,
  FolderTree,
  Users,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight
} from "lucide-react";

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  submenu?: NavItem[];
};

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />
  },
  {
    title: "Locations",
    href: "/locations",
    icon: <MapPin className="h-5 w-5" />
  },
  {
    title: "Activities",
    href: "/activities",
    icon: <Layers className="h-5 w-5" />
  },
  {
    title: "Categories",
    href: "/categories",
    icon: <FolderTree className="h-5 w-5" />
  },
  {
    title: "Users",
    href: "/users",
    icon: <Users className="h-5 w-5" />
  },
  {
    title: "Bookings",
    href: "/bookings",
    icon: <Calendar className="h-5 w-5" />
  },
  {
    title: "Reports",
    href: "/reports",
    icon: <BarChart3 className="h-5 w-5" />
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
    submenu: [
      {
        title: "API & AI Management",
        href: "/settings/api-ai",
        icon: <Settings className="h-4 w-4" />
      }
    ]
  }
];

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const pathname = usePathname();
  const { logout } = useAuth();
  
  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    
    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-background border rounded-md shadow-sm"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-background transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[70px]" : "w-[250px]",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            {!isCollapsed && (
              <span className="text-xl font-bold">Meshwar</span>
            )}
            {isCollapsed && (
              <span className="text-xl font-bold">M</span>
            )}
          </Link>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-1 rounded-md hover:bg-muted"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronRight className={cn("h-5 w-5 transition-transform", !isCollapsed && "rotate-180")} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.title}>
                {item.submenu ? (
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleSubmenu(item.title)}
                      className={cn(
                        "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-muted",
                        pathname.startsWith(item.href) && "bg-muted",
                        isCollapsed && "justify-center"
                      )}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.title}</span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              openSubmenu === item.title && "rotate-180"
                            )}
                          />
                        </>
                      )}
                    </button>
                    
                    {/* Submenu items */}
                    {(openSubmenu === item.title || (!isCollapsed && pathname.startsWith(item.href))) && (
                      <ul className={cn("ml-6 space-y-1", isCollapsed && "ml-0")}>
                        {item.submenu.map((subitem) => (
                          <li key={subitem.title}>
                            <Link
                              href={subitem.href}
                              className={cn(
                                "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-muted",
                                pathname === subitem.href && "bg-muted text-primary",
                                isCollapsed && "justify-center"
                              )}
                            >
                              <span className="mr-3">{subitem.icon}</span>
                              {!isCollapsed && <span>{subitem.title}</span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-muted",
                      pathname === item.href && "bg-muted text-primary",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <span className={cn("mr-3", isCollapsed && "mr-0")}>{item.icon}</span>
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Logout button */}
        <div className="border-t p-3">
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-destructive/10 hover:text-destructive",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
} 