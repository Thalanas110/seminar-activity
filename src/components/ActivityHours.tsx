import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, FileText, Image, Trash2, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ActivityHour {
  id: string;
  activity_name: string;
  hours_attended: number;
  proof_file_path: string | null;
  proof_file_name: string | null;
  proof_file_type: string | null;
  proof_file_size: number | null;
  created_at: string;
}

const ActivityHours = () => {
  const [activities, setActivities] = useState<ActivityHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activityName, setActivityName] = useState('');
  const [hoursAttended, setHoursAttended] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_hours')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to load activities.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (100KB max)
      if (file.size > 100 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 100KB.",
          variant: "destructive",
        });
        return;
      }
      
      // Check file type (images and PDFs only)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select an image (JPEG, PNG, WebP) or PDF file.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      let proofFilePath = null;
      let proofFileName = null;
      let proofFileType = null;
      let proofFileSize = null;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('proof-documents')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        proofFilePath = fileName;
        proofFileName = selectedFile.name;
        proofFileType = selectedFile.type;
        proofFileSize = selectedFile.size;
      }

      // Insert activity record
      const { error } = await supabase
        .from('activity_hours')
        .insert({
          user_id: user.id,
          activity_name: activityName,
          hours_attended: parseFloat(hoursAttended),
          proof_file_path: proofFilePath,
          proof_file_name: proofFileName,
          proof_file_type: proofFileType,
          proof_file_size: proofFileSize,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Activity hours added successfully.",
        variant: "default",
      });

      // Reset form
      setActivityName('');
      setHoursAttended('');
      setSelectedFile(null);
      setIsDialogOpen(false);
      
      // Refresh data
      fetchActivities();
    } catch (error) {
      console.error('Error adding activity:', error);
      toast({
        title: "Error",
        description: "Failed to add activity hours.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('proof-documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file.",
        variant: "destructive",
      });
    }
  };

  const deleteActivity = async (id: string, filePath: string | null) => {
    try {
      // Delete file if exists
      if (filePath) {
        await supabase.storage
          .from('proof-documents')
          .remove([filePath]);
      }

      // Delete record
      const { error } = await supabase
        .from('activity_hours')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Activity record deleted successfully.",
        variant: "default",
      });

      fetchActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: "Error",
        description: "Failed to delete activity.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="glass border-primary/20">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass border-primary/20">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                Activity Hours
              </CardTitle>
              <CardDescription>
                Track your professional activity participation and achievements
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Activity
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-primary/20">
                <DialogHeader>
                  <DialogTitle>Add Activity Hours</DialogTitle>
                  <DialogDescription>
                    Record your activity participation with proof of completion
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="activity-name">Activity Name</Label>
                    <Input
                      id="activity-name"
                      value={activityName}
                      onChange={(e) => setActivityName(e.target.value)}
                      placeholder="Enter activity name"
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours">Hours Attended</Label>
                    <Input
                      id="hours"
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={hoursAttended}
                      onChange={(e) => setHoursAttended(e.target.value)}
                      placeholder="Enter hours (e.g., 2.5)"
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proof">Proof of Completion (max 100KB)</Label>
                    <Input
                      id="proof"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      className="bg-background/50"
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)}KB)
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="secondary" disabled={submitting}>
                      {submitting ? 'Adding...' : 'Add Activity'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No activities recorded yet.</p>
              <p className="text-sm">Add your first activity to get started!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity Name</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.activity_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-accent text-accent">{activity.hours_attended}h</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(activity.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      {activity.proof_file_path ? (
                        <div className="flex items-center gap-2">
                          {activity.proof_file_type?.startsWith('image/') ? (
                            <Image className="w-4 h-4 text-accent" />
                          ) : (
                            <FileText className="w-4 h-4 text-accent" />
                          )}
                          <span className="text-sm">{activity.proof_file_name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No file</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {activity.proof_file_path && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadFile(activity.proof_file_path!, activity.proof_file_name!)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteActivity(activity.id, activity.proof_file_path)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityHours;