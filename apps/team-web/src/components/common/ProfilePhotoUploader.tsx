import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { db, storage } from '@buyqk/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

interface Props {
  uid: string;
  initialUrl?: string;
  onUploadSuccess: (url: string) => void;
}

/** Resize + compress the image to max 400px / 0.82 quality JPEG before uploading */
const compressImage = (file: File, maxPx = 400, quality = 0.82): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxPx || height > maxPx) {
          if (width > height) {
            height = Math.round((height * maxPx) / width);
            width = maxPx;
          } else {
            width = Math.round((width * maxPx) / height);
            height = maxPx;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas ctx unavailable')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('toBlob failed')),
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Image load error'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
};

export const ProfilePhotoUploader: React.FC<Props> = ({ uid, initialUrl, onUploadSuccess }) => {
  const [preview, setPreview] = useState<string>(initialUrl || '');
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setError('');
    setUploading(true);
    setProgress(10);

    try {
      // Step 1: Compress image
      const blob = await compressImage(file);
      setProgress(30);

      // Step 2: Show local preview immediately
      const localPreview = URL.createObjectURL(blob);
      setPreview(localPreview);
      setProgress(50);

      // Step 3: Upload compressed blob to Firebase Storage using the app's storage instance
      const filePath = `profile_pictures/${uid}_${Date.now()}.jpg`;
      const sRef = storageRef(storage, filePath);

      await uploadBytes(sRef, blob, { contentType: 'image/jpeg' });
      setProgress(80);

      const downloadUrl = await getDownloadURL(sRef);
      setProgress(95);

      // Step 4: Update Firestore user doc with the real download URL
      // Use setDoc with merge:true so it works even if the doc doesn't exist yet
      if (uid && uid !== 'temp') {
        await setDoc(doc(db, 'users', uid), { photoUrl: downloadUrl }, { merge: true });
      }

      setProgress(100);
      setUploading(false);
      setPreview(downloadUrl);
      onUploadSuccess(downloadUrl);

    } catch (err: any) {
      console.error('Upload photo error:', err);
      setError('Photo upload failed — check internet connection and try again.');
      setUploading(false);
      setProgress(0);
      // Reset input so user can try again
      if (inputRef.current) inputRef.current.value = '';
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
            <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center gap-2 p-2">
              <RefreshCw className="w-6 h-6 text-yellow-500 animate-spin" />
              <span className="text-[10px] text-yellow-400 font-bold">{progress}%</span>
              <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        <label className="absolute -bottom-2 -right-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 p-2 rounded-xl shadow-lg cursor-pointer transition-transform hover:scale-110 border border-yellow-300">
          <Upload className="w-4 h-4" />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>

      <p className="text-[11px] text-slate-400 font-medium text-center">
        JPG or PNG (auto-compressed) — tap the ↑ button
      </p>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {preview && !uploading && progress === 100 && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
          <CheckCircle className="w-3.5 h-3.5" /> Photo Saved ✓
        </div>
      )}
    </div>
  );
};
