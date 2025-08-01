
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { ActivityForm } from '@/components/ActivityForm';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { UserActivities } from '@/components/UserActivities';
import type { User, ActivityWithLikes } from '../../server/src/schema';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activities, setActivities] = useState<ActivityWithLikes[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Auth form state
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: ''
  });

  // Load activities when user changes
  const loadActivities = useCallback(async () => {
    if (!user) return;
    
    try {
      const result = await trpc.getAllActivities.query({ currentUserId: user.id });
      setActivities(result);
    } catch (error) {
      console.error('Failed to load activities:', error);
      setError('Failed to load activities');
    }
  }, [user]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await trpc.loginUser.mutate({
        email: authForm.email,
        password: authForm.password
      });
      
      if (result) {
        setUser(result);
        setAuthForm({ email: '', password: '', name: '' });
      } else {
        setError('Invalid credentials');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await trpc.createUser.mutate({
        email: authForm.email,
        password: authForm.password,
        name: authForm.name
      });
      
      setUser(result);
      setAuthForm({ email: '', password: '', name: '' });
    } catch (error) {
      console.error('Registration failed:', error);
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActivities([]);
    setError(null);
  };

  const handleActivityCreated = useCallback(async () => {
    await loadActivities();
  }, [loadActivities]);

  const handleActivityLike = async (activityId: number, isLiked: boolean) => {
    if (!user) return;
    
    try {
      if (isLiked) {
        await trpc.unlikeActivity.mutate({
          activity_id: activityId,
          user_id: user.id
        });
      } else {
        await trpc.likeActivity.mutate({
          activity_id: activityId,
          user_id: user.id
        });
      }
      
      // Update local state
      setActivities((prev: ActivityWithLikes[]) =>
        prev.map((activity: ActivityWithLikes) =>
          activity.id === activityId
            ? {
                ...activity,
                likes_count: isLiked ? activity.likes_count - 1 : activity.likes_count + 1,
                user_has_liked: !isLiked
              }
            : activity
        )
      );
    } catch (error) {
      console.error('Failed to update like:', error);
      setError('Failed to update like');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              🏃‍♀️ Activity Tracker
            </CardTitle>
            <p className="text-gray-600">Track your runs and walks</p>
          </CardHeader>
          <CardContent>
            <Tabs value={authMode} onValueChange={(value: string) => setAuthMode(value as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={authForm.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAuthForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={authForm.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAuthForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    required
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <Input
                    placeholder="Full Name"
                    value={authForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAuthForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={authForm.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAuthForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password (min 6 characters)"
                    value={authForm.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAuthForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    required
                    minLength={6}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Register'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            {error && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🏃‍♀️</span>
            <h1 className="text-xl font-bold text-gray-900">Activity Tracker</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {user.name}!</span>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="log">Log Activity</TabsTrigger>
            <TabsTrigger value="my-activities">My Activities</TabsTrigger>
          </TabsList>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <TabsContent value="dashboard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📊</span>
                  <span>Activity Timeline</span>
                </CardTitle>
                <p className="text-gray-600">
                  See what everyone's been up to! Like activities to show your support.
                </p>
              </CardHeader>
              <CardContent>
                <ActivityTimeline
                  activities={activities}
                  currentUser={user}
                  onLike={handleActivityLike}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="log">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>➕</span>
                  <span>Log New Activity</span>
                </CardTitle>
                <p className="text-gray-600">
                  Record your latest run or walk to share with the community.
                </p>
              </CardHeader>
              <CardContent>
                <ActivityForm
                  userId={user.id}
                  onActivityCreated={handleActivityCreated}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-activities">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📋</span>
                  <span>My Activities</span>
                </CardTitle>
                <p className="text-gray-600">
                  View and manage all your recorded activities.
                </p>
              </CardHeader>
              <CardContent>
                <UserActivities
                  userId={user.id}
                  currentUser={user}
                  onActivityUpdated={handleActivityCreated}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
