
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Heart, Clock, MapPin } from 'lucide-react';
import type { ActivityWithLikes, User } from '../../../server/src/schema';

interface ActivityTimelineProps {
  activities: ActivityWithLikes[];
  currentUser: User;
  onLike: (activityId: number, isLiked: boolean) => void;
}

export function ActivityTimeline({ activities, currentUser, onLike }: ActivityTimelineProps) {
  const formatDuration = (hours: number, minutes: number, seconds: number) => {
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    return parts.join(' ') || '0s';
  };

  const formatPace = (distance: number, hours: number, minutes: number, seconds: number) => {
    const totalMinutes = hours * 60 + minutes + seconds / 60;
    const paceMinutes = totalMinutes / distance;
    const paceMinutesFloor = Math.floor(paceMinutes);
    const paceSeconds = Math.round((paceMinutes - paceMinutesFloor) * 60);
    return `${paceMinutesFloor}:${paceSeconds.toString().padStart(2, '0')}/mi`;
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏃‍♀️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No activities yet!</h3>
        <p className="text-gray-600">
          Be the first to log an activity and inspire others to get moving!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity: ActivityWithLikes) => (
        <Card key={activity.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center space-x-3 mb-3">
                  <div className="text-2xl">
                    {activity.type === 'run' ? '🏃‍♀️' : '🚶‍♀️'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">
                        {activity.user_name}
                      </span>
                      <Badge variant={activity.type === 'run' ? 'default' : 'secondary'}>
                        {activity.type === 'run' ? 'Run' : 'Walk'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{activity.activity_date.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {activity.distance_miles.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">miles</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatDuration(activity.duration_hours, activity.duration_minutes, activity.duration_seconds)}
                      </div>
                      <div className="text-sm text-gray-600">duration</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 flex items-center justify-center">⚡</div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatPace(
                          activity.distance_miles,
                          activity.duration_hours,
                          activity.duration_minutes,
                          activity.duration_seconds
                        )}
                      </div>
                      <div className="text-sm text-gray-600">pace</div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={activity.user_has_liked ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onLike(activity.id, activity.user_has_liked)}
                      disabled={activity.user_id === currentUser.id}
                      className={activity.user_has_liked ? 'bg-red-500 hover:bg-red-600' : ''}
                    >
                      <Heart
                        className={`w-4 h-4 mr-1 ${
                          activity.user_has_liked ? 'fill-white' : ''
                        }`}
                      />
                      {activity.likes_count}
                    </Button>
                    {activity.user_id === currentUser.id && (
                      <Badge variant="outline" className="text-xs">
                        Your activity
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    Posted {activity.created_at.toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
