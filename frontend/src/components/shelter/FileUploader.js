import { useState, useRef, useCallback } from 'react';
import { shelterAPI } from '@/api';
import { Upload, X, Image, FileText, Camera, Trash2, Download, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function FileUploader({ entityType, entityId, fileType = 'photo', onUpload, maxFiles = 10, accept = 'image/*' }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState([]);
  const inputRef = useRef(null);

  const handleFileSelect = useCallback(async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;
    
    if (selectedFiles.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    
    for (const file of selectedFiles) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entity_type', entityType);
        formData.append('entity_id', entityId);
        formData.append('file_type', fileType);
        
        const res = await shelterAPI.uploadFile(formData);
        
        // Add preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setPreviews(prev => [...prev, { id: res.data.id, url: ev.target.result, name: file.name }]);
          };
          reader.readAsDataURL(file);
        } else {
          setPreviews(prev => [...prev, { id: res.data.id, url: null, name: file.name }]);
        }
        
        setFiles(prev => [...prev, res.data]);
        if (onUpload) onUpload(res.data);
        toast.success(`${file.name} uploaded`);
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }, [entityType, entityId, fileType, files.length, maxFiles, onUpload]);

  const handleRemove = async (fileId) => {
    try {
      await shelterAPI.deleteFile(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      setPreviews(prev => prev.filter(p => p.id !== fileId));
      toast.success('File removed');
    } catch (err) {
      toast.error('Failed to remove file');
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div 
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
          uploading ? 'border-slate-300 bg-slate-50' : 'border-slate-300 hover:border-shelter-primary hover:bg-shelter-primary/5'
        )}
      >
        <input ref={inputRef} type="file" multiple accept={accept} onChange={handleFileSelect} className="hidden" disabled={uploading} />
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-shelter-primary border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-sm text-slate-500">Uploading...</span>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Click to upload or drag and drop</p>
            <p className="text-xs text-slate-400 mt-1">Max {maxFiles} files, 10MB each</p>
          </>
        )}
      </div>

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {previews.map(preview => (
            <div key={preview.id} className="relative group">
              {preview.url ? (
                <img src={preview.url} alt={preview.name} className="w-full h-24 object-cover rounded-lg" />
              ) : (
                <div className="w-full h-24 bg-slate-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <button onClick={() => handleRemove(preview.id)} className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">{preview.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Photo gallery component for viewing uploaded photos
export function PhotoGallery({ entityType, entityId, onSetPrimary }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewFile, setViewFile] = useState(null);

  useState(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await shelterAPI.getEntityFiles(entityType, entityId);
      setFiles(res.data || []);
    } catch (e) {}
    setLoading(false);
  };

  const handleDownload = async (fileId, filename) => {
    try {
      const res = await shelterAPI.getFileDownload(fileId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Failed to download');
    }
  };

  if (loading) return <div className="py-4 text-center"><div className="w-6 h-6 border-2 border-shelter-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      {files.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">No files uploaded yet</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {files.map(file => (
            <div key={file.id} className="relative group">
              {file.content_type?.startsWith('image/') ? (
                <div className="w-full h-24 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Image className="w-8 h-8 text-slate-400" />
                </div>
              ) : (
                <div className="w-full h-24 bg-slate-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                <button onClick={() => handleDownload(file.id, file.filename)} className="p-1.5 bg-white text-slate-700 rounded hover:bg-slate-100">
                  <Download className="w-3 h-3" />
                </button>
                {onSetPrimary && file.file_type === 'photo' && (
                  <button onClick={() => onSetPrimary(file.id)} className="p-1.5 bg-shelter-primary text-white rounded hover:opacity-90">
                    <Camera className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">{file.filename}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
