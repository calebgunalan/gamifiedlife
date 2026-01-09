import { Link, useLocation } from "react-router-dom";
import { Home, Scroll, Trophy, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/quests", icon: Scroll, label: "Quests" },
  { path: "/log-activity", icon: Trophy, label: "Log" },
  { path: "/insights", icon: BarChart3, label: "Insights" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-transform",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-xs font-medium",
                isActive && "text-primary"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
