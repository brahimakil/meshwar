import { formatDistanceToNow } from 'date-fns';
import { Users, MapPin, CalendarCheck } from 'lucide-react';

interface ActivityItemProps {
  id: string;
  type: 'user' | 'activity' | 'location';
  title: string;
  description: string;
  createdAt: Date;
}

export default function ActivityItem({
  type,
  title,
  description,
  createdAt
}: ActivityItemProps) {
  const getIcon = () => {
    switch (type) {
      case 'user':
        return <Users className="h-5 w-5 text-blue-500" />;
      case 'location':
        return <MapPin className="h-5 w-5 text-orange-500" />;
      case 'activity':
        return <CalendarCheck className="h-5 w-5 text-green-500" />;
      default:
        return <Users className="h-5 w-5 text-primary" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'user':
        return 'New user registered';
      case 'location':
        return 'New location added';
      case 'activity':
        return 'New activity created';
      default:
        return 'New item';
    }
  };

  return (
    <div className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
        {getIcon()}
      </div>
      <div>
        <p className="text-sm font-medium">{getTitle()}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(createdAt, { addSuffix: true })}
        </p>
      </div>
    </div>
  );
} 