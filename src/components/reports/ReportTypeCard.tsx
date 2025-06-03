import { LucideIcon, ChevronRight } from "lucide-react";

interface ReportTypeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}

export default function ReportTypeCard({ title, description, icon: Icon, onClick }: ReportTypeCardProps) {
  return (
    <div 
      className="border rounded-lg p-6 bg-card hover:border-primary cursor-pointer transition-all"
      onClick={onClick}
    >
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      
      <div className="mt-4 text-sm text-primary flex items-center">
        <span>Generate Report</span>
        <ChevronRight className="h-4 w-4 ml-1" />
      </div>
    </div>
  );
} 