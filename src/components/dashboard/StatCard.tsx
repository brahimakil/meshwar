import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
  iconClassName
}: StatCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-5", className)}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          
          {trend && (
            <p className={cn(
              "flex items-center text-xs mt-1",
              trend.isPositive ? "text-green-500" : "text-red-500"
            )}>
              <span className="mr-1">
                {trend.isPositive ? "↑" : "↓"}
              </span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </p>
          )}
        </div>
        
        <div className={cn(
          "p-2 rounded-md",
          iconClassName || "bg-primary/10"
        )}>
          <Icon className={cn("h-5 w-5", iconClassName ? "text-white" : "text-primary")} />
        </div>
      </div>
    </div>
  );
} 