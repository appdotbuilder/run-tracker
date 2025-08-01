
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { Activity, ActivityType, UpdateActivityInput } from '../../../server/src/schema';

interface EditActivityDialogProps {
  activity: Activity;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function EditActivityDialog({ activity, isOpen, onClose, onComplete }: EditActivityDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<UpdateActivityInput, 'id'>>({
    type: activity.type,
    distance_miles: activity.distance_miles,
    duration_hours: activity.duration_hours,
    duration_minutes: activity.duration_minutes,
    duration_seconds: activity.duration_seconds,
    activity_date: activity.activity_date
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
    if (formData.distance_miles && formData.distance_miles <= 0) {
      setError('Distance must be greater than 0');
      setIsLoading(false);
      return;
    }

    const totalDuration = (formData.duration_hours || 0) + (formData.duration_minutes || 0) + (formData.duration_seconds || 0);
    if (totalDuration === 0) {
      setError('Duration must be greater than 0');
      setIsLoading(false);
      return;
    }

    try {
      const updateData: UpdateActivityInput = {
        id: activity.id,
        ...formData
      };
      
      await trpc.updateActivity.mutate(updateData);
      onComplete();
      onClose();
    } catch (error) {
      console.error('Failed to update activity:', error);
      setError('Failed to update activity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Activity Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Activity Type</Label>
              <Select
                value={formData.type || 'run'}
                onValueChange={(value: ActivityType) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="run">🏃‍♀️ Run</SelectItem>
                  <SelectItem value="walk">🚶‍♀️ Walk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Distance */}
            <div className="space-y-2">
              <Label htmlFor="distance">Distance (miles)</Label>
              <Input
                id="distance"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.distance_miles || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({
                    ...prev,
                    distance_miles: parseFloat(e.target.value) || undefined
                  }))
                }
                placeholder="3.1"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duration</Label>
            <Card className="p-4">
              <CardContent className="p-0">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hours" className="text-sm text-gray-600">Hours</Label>
                    <Input
                      id="hours"
                      type="number"
                      min="0"
                      max="23"
                      value={formData.duration_hours || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev) => ({
                          ...prev,
                          duration_hours: parseInt(e.target.value) || undefined
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minutes" className="text-sm text-gray-600">Minutes</Label>
                    <Input
                      id="minutes"
                      type="number"
                      min="0"
                      max="59"
                      value={formData.duration_minutes || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev) => ({
                          ...prev,
                          duration_minutes: parseInt(e.target.value) || undefined
                        }))
                      }
                      placeholder="30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seconds" className="text-sm text-gray-600">Seconds</Label>
                    <Input
                      id="seconds"
                      type="number"
                      min="0"
                      max="59"
                      value={formData.duration_seconds || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev) => ({
                          ...prev,
                          duration_seconds: parseInt(e.target.value) || undefined
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Activity Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.activity_date ? formatDateForInput(formData.activity_date) : ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({
                  ...prev,
                  activity_date: e.target.value ? new Date(e.target.value) : undefined
                }))
              }
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
