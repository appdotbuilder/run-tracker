
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Clock, MapPin, Trash2, Edit } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { EditActivityDialog } from '@/components/EditActivityDialog';
import type { Activity, User } from '../../../server/src/schema';

interface UserActivitiesProps {
  userId: number;
  currentUser: User;
  onActivityUpdated: () => void;
}

export function UserActivities({ userId, currentUser, onActivityUpdated }: UserActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const loadUserActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getUserActivities.query({ user_id: userId });
      setActivities(result);
    } catch (error) {
      console.error('Failed to load user activities:', error);
      setError('Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserActivities();
  }, [loadUserActivities]);

  const handleDelete = async (activityId: number) => {
    try {
      await trpc.deleteActivity.mutate({
        id: activityId,
        user_id: currentUser.id
      });
      
      setActivities((prev: Activity[]) => 
        prev.filter((activity: Activity) => activity.id !== activityId)
      );
      onActivityUpdated();
    } catch (error) {
      console.error('Failed to delete activity:', error);
      setError('Failed to delete activity');
    }
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
  };

  const handleEditComplete = () => {
    setEditingActivity(null);
    loadUserActivities();
    onActivityUpdated();
  };

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

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-2xl mb-2">⏳</div>
        <p className="text-gray-600">Loading your activities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-2xl mb-2">❌</div>
        <p className="text-red-600">{error}</p>
        <Button onClick={loadUserActivities} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No activities yet!</h3>
        <p className="text-gray-600">
          Start logging your runs and walks to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity: Activity) => (
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

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(activity)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Activity</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this activity? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(activity.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    Created {activity.created_at.toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {editingActivity && (
        <EditActivityDialog
          activity={editingActivity}
          isOpen={!!editingActivity}
          onClose={() => setEditingActivity(null)}
          onComplete={handleEditComplete}
        />
      )}
    </div>
  );
}
