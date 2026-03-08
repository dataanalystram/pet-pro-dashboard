import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SlidePanel({ isOpen, onClose, title, subtitle, children, width = 'max-w-lg' }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 transition-opacity" onClick={onClose} />
      <div className={cn(
        'fixed right-0 top-0 h-full z-50 bg-white shadow-2xl transition-transform duration-300 overflow-hidden flex flex-col w-full',
        width
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </>
  );
}
