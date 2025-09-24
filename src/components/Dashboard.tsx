import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Trophy, LogOut, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SeminarHours from '@/components/SeminarHours';
import ActivityHours from '@/components/ActivityHours';
import DashboardStats from '@/components/DashboardStats';
import backgroundImage from '@/assets/background.jpg';

const Dashboard = () => {
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background/95 backdrop-blur-sm" />
      
      <div className="relative z-10 container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Hours Ledger System
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Track your professional development hours.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card/50 backdrop-blur-sm border border-primary/20">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="seminars"
              className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground"
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Seminars
            </TabsTrigger>
            <TabsTrigger 
              value="activities"
              className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Activities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DashboardStats />
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="glass border-primary/20 card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    Seminar Hours
                  </CardTitle>
                  <CardDescription>
                    Track your professional seminar attendance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="default" 
                    className="w-full gap-2"
                    onClick={() => setActiveTab('seminars')}
                  >
                    <Plus className="w-4 h-4" />
                    View Seminars
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass border-primary/20 card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-accent" />
                    Activity Hours
                  </CardTitle>
                  <CardDescription>
                    Log your professional activity participation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="secondary" 
                    className="w-full gap-2"
                    onClick={() => setActiveTab('activities')}
                  >
                    <Plus className="w-4 h-4" />
                    View Activities
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="seminars">
            <SeminarHours />
          </TabsContent>

          <TabsContent value="activities">
            <ActivityHours />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;