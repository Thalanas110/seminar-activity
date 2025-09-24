import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, FileText, Image, Trash2, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SeminarHour {
  id: string;
  seminar_name: string;
  hours_attended: number;
  proof_file_path: string | null;
  proof_file_name: string | null;
  proof_file_type: string | null;
  proof_file_size: number | null;
  created_at: string;
}

const SeminarHours = () => {
  const [seminars, setSeminars] = useState<SeminarHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [seminarName, setSeminarName] = useState('');
  const [hoursAttended, setHoursAttended] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchSeminars();
    }
  }, [user]);

  const fetchSeminars = async () => {
    try {
      const { data, error } = await supabase
        .from('seminar_hours')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSeminars(data || []);
    } catch (error) {
      console.error('Error fetching seminars:', error);
      toast({
        title: "Error",
        description: "Failed to load seminars.",
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

      // Insert seminar record
      const { error } = await supabase
        .from('seminar_hours')
        .insert({
          user_id: user.id,
          seminar_name: seminarName,
          hours_attended: parseFloat(hoursAttended),
          proof_file_path: proofFilePath,
          proof_file_name: proofFileName,
          proof_file_type: proofFileType,
          proof_file_size: proofFileSize,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Seminar hours added successfully.",
        variant: "default",
      });

      // Reset form
      setSeminarName('');
      setHoursAttended('');
      setSelectedFile(null);
      setIsDialogOpen(false);
      
      // Refresh data
      fetchSeminars();
    } catch (error) {
      console.error('Error adding seminar:', error);
      toast({
        title: "Error",
        description: "Failed to add seminar hours.",
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

  const deleteSeminar = async (id: string, filePath: string | null) => {
    try {
      // Delete file if exists
      if (filePath) {
        await supabase.storage
          .from('proof-documents')
          .remove([filePath]);
      }

      // Delete record
      const { error } = await supabase
        .from('seminar_hours')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Seminar record deleted successfully.",
        variant: "default",
      });

      fetchSeminars();
    } catch (error) {
      console.error('Error deleting seminar:', error);
      toast({
        title: "Error",
        description: "Failed to delete seminar.",
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
                <Calendar className="w-5 h-5 text-primary" />
                Seminar Hours
              </CardTitle>
              <CardDescription>
                Track your professional seminar attendance and certificates
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Seminar
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-primary/20">
                <DialogHeader>
                  <DialogTitle>Add Seminar Hours</DialogTitle>
                  <DialogDescription>
                    Record your seminar attendance with proof of completion
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="seminar-name">Seminar Name</Label>
                    <Input
                      id="seminar-name"
                      value={seminarName}
                      onChange={(e) => setSeminarName(e.target.value)}
                      placeholder="Enter seminar name"
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
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Adding...' : 'Add Seminar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {seminars.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No seminars recorded yet.</p>
              <p className="text-sm">Add your first seminar to get started!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seminar Name</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seminars.map((seminar) => (
                  <TableRow key={seminar.id}>
                    <TableCell className="font-medium">{seminar.seminar_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{seminar.hours_attended}h</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(seminar.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      {seminar.proof_file_path ? (
                        <div className="flex items-center gap-2">
                          {seminar.proof_file_type?.startsWith('image/') ? (
                            <Image className="w-4 h-4 text-primary" />
                          ) : (
                            <FileText className="w-4 h-4 text-primary" />
                          )}
                          <span className="text-sm">{seminar.proof_file_name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No file</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {seminar.proof_file_path && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadFile(seminar.proof_file_path!, seminar.proof_file_name!)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSeminar(seminar.id, seminar.proof_file_path)}
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

export default SeminarHours;