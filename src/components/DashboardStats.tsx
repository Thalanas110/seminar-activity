import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Trophy, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Stats {
  totalSeminarHours: number;
  totalActivityHours: number;
  seminarCount: number;
  activityCount: number;
}

const DashboardStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalSeminarHours: 0,
    totalActivityHours: 0,
    seminarCount: 0,
    activityCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      // Fetch seminar stats
      const { data: seminarData, error: seminarError } = await supabase
        .from('seminar_hours')
        .select('hours_attended')
        .eq('user_id', user?.id);

      // Fetch activity stats
      const { data: activityData, error: activityError } = await supabase
        .from('activity_hours')
        .select('hours_attended')
        .eq('user_id', user?.id);

      if (seminarError) throw seminarError;
      if (activityError) throw activityError;

      const totalSeminarHours = seminarData?.reduce((sum, item) => sum + Number(item.hours_attended), 0) || 0;
      const totalActivityHours = activityData?.reduce((sum, item) => sum + Number(item.hours_attended), 0) || 0;

      setStats({
        totalSeminarHours,
        totalActivityHours,
        seminarCount: seminarData?.length || 0,
        activityCount: activityData?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalHours = stats.totalSeminarHours + stats.totalActivityHours;
  const totalEntries = stats.seminarCount + stats.activityCount;

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass border-primary/20">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="glass border-primary/20 card-hover">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          <Clock className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{totalHours.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">Combined hours logged</p>
        </CardContent>
      </Card>

      <Card className="glass border-primary/20 card-hover">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Seminar Hours</CardTitle>
          <GraduationCap className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{stats.totalSeminarHours.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">{stats.seminarCount} seminars attended</p>
        </CardContent>
      </Card>

      <Card className="glass border-primary/20 card-hover">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Activity Hours</CardTitle>
          <Trophy className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent">{stats.totalActivityHours.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">{stats.activityCount} activities completed</p>
        </CardContent>
      </Card>

      <Card className="glass border-primary/20 card-hover">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{totalEntries}</div>
          <p className="text-xs text-muted-foreground">Records in your ledger</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;