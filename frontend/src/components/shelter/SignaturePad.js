import { useState, useRef } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { cn } from '@/lib/utils';

export default function SignaturePad({ onSave, onCancel, title = 'Sign Here' }) {
  const sigPad = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    if (sigPad.current) {
      sigPad.current.clear();
      setIsEmpty(true);
    }
  };

  const handleSave = () => {
    if (sigPad.current && !sigPad.current.isEmpty()) {
      const dataUrl = sigPad.current.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const handleEnd = () => {
    if (sigPad.current) {
      setIsEmpty(sigPad.current.isEmpty());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-slate-700">{title}</h4>
        <button onClick={handleClear} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <RotateCcw className="w-3 h-3" /> Clear
        </button>
      </div>
      
      <div className="border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden">
        <SignatureCanvas
          ref={sigPad}
          canvasProps={{
            className: 'w-full h-40 touch-none',
            style: { width: '100%', height: '160px' }
          }}
          backgroundColor="white"
          penColor="#1e293b"
          onEnd={handleEnd}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">Draw your signature above</p>
        <div className="flex gap-2">
          {onCancel && (
            <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancel
            </button>
          )}
          <button 
            onClick={handleSave} 
            disabled={isEmpty}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-1',
              isEmpty ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-shelter-primary text-white hover:opacity-90'
            )}
          >
            <Check className="w-4 h-4" /> Save Signature
          </button>
        </div>
      </div>
    </div>
  );
}
