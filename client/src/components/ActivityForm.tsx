
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { CreateActivityInput, ActivityType } from '../../../server/src/schema';

interface ActivityFormProps {
  userId: number;
  onActivityCreated: () => void;
}

export function ActivityForm({ userId, onActivityCreated }: ActivityFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CreateActivityInput>({
    user_id: userId,
    type: 'run',
    distance_miles: 0,
    duration_hours: 0,
    duration_minutes: 0,
    duration_seconds: 0,
    activity_date: new Date()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    // Validation
    if (formData.distance_miles <= 0) {
      setError('Distance must be greater than 0');
      setIsLoading(false);
      return;
    }

    if (formData.duration_hours === 0 && formData.duration_minutes === 0 && formData.duration_seconds === 0) {
      setError('Duration must be greater than 0');
      setIsLoading(false);
      return;
    }

    try {
      await trpc.createActivity.mutate(formData);
      
      // Reset form
      setFormData({
        user_id: userId,
        type: 'run',
        distance_miles: 0,
        duration_hours: 0,
        duration_minutes: 0,
        duration_seconds: 0,
        activity_date: new Date()
      });
      
      setSuccess(true);
      onActivityCreated();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to create activity:', error);
      setError('Failed to create activity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="max-w-2xl mx-auto">
      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <AlertDescription className="text-green-700">
            🎉 Activity logged successfully! Great job!
          </AlertDescription>
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
                setFormData((prev: CreateActivityInput) => ({ ...prev, type: value }))
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
                setFormData((prev: CreateActivityInput) => ({
                  ...prev,
                  distance_miles: parseFloat(e.target.value) || 0
                }))
              }
              placeholder="3.1"
              required
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
                    value={formData.duration_hours}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateActivityInput) => ({
                        ...prev,
                        duration_hours: parseInt(e.target.value) || 0
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
                    value={formData.duration_minutes}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateActivityInput) => ({
                        ...prev,
                        duration_minutes: parseInt(e.target.value) || 0
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
                    value={formData.duration_seconds}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateActivityInput) => ({
                        ...prev,
                        duration_seconds: parseInt(e.target.value) || 0
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
            value={formatDateForInput(formData.activity_date)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateActivityInput) => ({
                ...prev,
                activity_date: new Date(e.target.value)
              }))
            }
            required
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full" size="lg">
          {isLoading ? 'Logging Activity...' : '🚀 Log Activity'}
        </Button>
      </form>
    </div>
  );
}
