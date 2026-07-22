import React, { useState } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, RefreshCw } from 'lucide-react';
import { storageService } from '@buyqk/firebase';

interface Props {
  uid: string;
  initialUrl?: string;
  onUploadSuccess: (url: string) => void;
}

export const ProfilePhotoUploader: React.FC<Props> = ({ uid, initialUrl, onUploadSuccess }) => {
  const [preview, setPreview] = useState<string>(initialUrl || '');
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be smaller than 10MB.');
      return;
    }

    setError('');
    setUploading(true);
    setProgress(20);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setPreview(base64);
        setProgress(60);

        // Upload to Firebase Storage via storageService
        const filePath = `profile_pictures/${uid}_${Date.now()}.jpg`;
        const downloadUrl = await storageService.uploadBase64(filePath, base64);

        setProgress(100);
        setUploading(false);
        onUploadSuccess(downloadUrl);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error("Upload photo error:", err);
      setError(err.message || 'Failed uploading photo. Please try again.');
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 font-sans">
      <div className="relative group">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-yellow-500/50 shadow-gold-glow bg-slate-900 flex items-center justify-center relative">
          {preview ? (
            <img src={preview} alt="Profile preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-slate-500">
              <ImageIcon className="w-8 h-8 text-slate-400" />
              <span className="text-[10px] uppercase font-bold">Photo</span>
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 p-2">
              <RefreshCw className="w-6 h-6 text-yellow-500 animate-spin" />
              <span className="text-[10px] text-yellow-400 font-bold">{progress}%</span>
            </div>
          )}
        </div>

        <label className="absolute -bottom-2 -right-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 p-2 rounded-xl shadow-lg cursor-pointer transition-transform hover:scale-110 border border-yellow-300">
          <Upload className="w-4 h-4" />
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
        </label>
      </div>

      <p className="text-[11px] text-slate-400 font-medium text-center">
        Mandatory &bull; JPG or PNG format (Max 10MB)
      </p>

      {error && (
        <p className="text-xs text-red-400 font-semibold text-center">{error}</p>
      )}

      {preview && !uploading && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
          <CheckCircle className="w-3.5 h-3.5" /> Photo Uploaded
        </div>
      )}
    </div>
  );
};
