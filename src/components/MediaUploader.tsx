import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MediaUploaderProps {
  bucket: string;
  folder?: string;
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  accept?: string;
  className?: string;
  single?: boolean;
}

export default function MediaUploader({
  bucket, folder = '', value, onChange, maxFiles = 10, accept = 'image/*,.gif', className, single = false,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (single && fileArray.length > 1) fileArray.length = 1;
    if (!single && value.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of fileArray) {
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} exceeds 5MB limit`); continue; }
      const ext = file.name.split('.').pop();
      const path = `${folder ? folder + '/' : ''}${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file);
      if (error) { toast.error(`Upload failed: ${error.message}`); continue; }
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
      newUrls.push(publicUrl);
    }
    if (newUrls.length > 0) {
      onChange(single ? newUrls : [...value, ...newUrls]);
    }
    setUploading(false);
  }, [bucket, folder, value, onChange, maxFiles, single]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  const removeUrl = (url: string) => {
    onChange(value.filter(u => u !== url));
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          dragOver ? 'border-primary bg-accent/50' : 'border-border hover:border-primary/50 hover:bg-accent/30',
          uploading && 'pointer-events-none opacity-60'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={!single}
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="w-8 h-8" />
            <span className="text-sm font-medium">Drop files here or click to browse</span>
            <span className="text-xs">Images & GIFs up to 5MB</span>
          </div>
        )}
      </div>

      {value.length > 0 && (
        <div className={cn('grid gap-2', single ? 'grid-cols-1' : 'grid-cols-3 sm:grid-cols-4')}>
          {value.map((url) => (
            <div key={url} className="relative group rounded-lg overflow-hidden border bg-muted aspect-square">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={(e) => { e.stopPropagation(); removeUrl(url); }}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
