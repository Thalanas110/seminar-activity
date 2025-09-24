-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('proof-documents', 'proof-documents', false);

-- Create seminar_hours table
CREATE TABLE public.seminar_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  seminar_name TEXT NOT NULL,
  hours_attended DECIMAL(4,2) NOT NULL CHECK (hours_attended > 0),
  proof_file_path TEXT,
  proof_file_name TEXT,
  proof_file_size INTEGER,
  proof_file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity_hours table
CREATE TABLE public.activity_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_name TEXT NOT NULL,
  hours_attended DECIMAL(4,2) NOT NULL CHECK (hours_attended > 0),
  proof_file_path TEXT,
  proof_file_name TEXT,
  proof_file_size INTEGER,
  proof_file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.seminar_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_hours ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for seminar_hours
CREATE POLICY "Users can view their own seminar hours" 
ON public.seminar_hours 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own seminar hours" 
ON public.seminar_hours 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own seminar hours" 
ON public.seminar_hours 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own seminar hours" 
ON public.seminar_hours 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for activity_hours
CREATE POLICY "Users can view their own activity hours" 
ON public.activity_hours 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activity hours" 
ON public.activity_hours 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity hours" 
ON public.activity_hours 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity hours" 
ON public.activity_hours 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage policies for proof documents
CREATE POLICY "Users can view their own proof documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'proof-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own proof documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'proof-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own proof documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'proof-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own proof documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'proof-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_seminar_hours_updated_at
BEFORE UPDATE ON public.seminar_hours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activity_hours_updated_at
BEFORE UPDATE ON public.activity_hours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();