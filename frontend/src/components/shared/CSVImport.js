import { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { importAPI } from '@/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CSVImport({ collection, productType, fieldMapping, sampleCSV, onComplete, onClose }) {
  const [step, setStep] = useState('upload'); // upload | preview | importing | done
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef(null);

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) { setError('CSV must have headers and at least one row'); return; }
    const hdrs = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    setHeaders(hdrs);
    const parsed = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const obj = {};
      hdrs.forEach((h, idx) => {
        const mappedKey = fieldMapping?.[h.toLowerCase()] || fieldMapping?.[h] || h.toLowerCase().replace(/\s+/g, '_');
        let val = vals[idx] || '';
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (!isNaN(val) && val !== '') val = Number(val);
        obj[mappedKey] = val;
      });
      parsed.push(obj);
    }
    setRows(parsed);
    setStep('preview');
    setError('');
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => parseCSV(ev.target.result);
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setStep('importing');
    try {
      const { data } = await importAPI.csv(collection, rows, productType);
      setImportResult(data);
      setStep('done');
      toast.success(`Successfully imported ${data.count} records`);
      if (onComplete) onComplete(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Import failed');
      setStep('preview');
      toast.error('Import failed');
    }
  };

  const downloadSample = () => {
    if (!sampleCSV) return;
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${collection}_sample.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Import CSV Data</h2>
            <p className="text-sm text-slate-500">Upload a CSV file to bulk import records</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6">
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700">Click to upload or drag & drop</p>
                <p className="text-xs text-slate-400 mt-1">CSV files only (.csv)</p>
                <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
              </div>
              {sampleCSV && (
                <button onClick={downloadSample} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Download className="w-4 h-4" /> Download sample CSV template
                </button>
              )}
              {error && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{error}</p>}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-slate-900">{rows.length} records ready to import</span>
              </div>
              {error && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{error}</p>}
              <div className="max-h-[300px] overflow-auto border rounded-xl">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>{headers.slice(0, 6).map(h => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.slice(0, 10).map((r, i) => (
                      <tr key={i}>{headers.slice(0, 6).map(h => {
                        const key = fieldMapping?.[h.toLowerCase()] || fieldMapping?.[h] || h.toLowerCase().replace(/\s+/g, '_');
                        return <td key={h} className="px-3 py-2 text-slate-600 truncate max-w-[150px]">{String(r[key] ?? '')}</td>;
                      })}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 10 && <p className="text-xs text-slate-400">Showing first 10 of {rows.length} rows</p>}
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setStep('upload'); setRows([]); }} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Back</button>
                <button onClick={handleImport} className="px-6 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700">Import {rows.length} Records</button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="py-12 text-center">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-medium text-slate-700">Importing {rows.length} records...</p>
            </div>
          )}

          {step === 'done' && (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-lg font-bold text-slate-900">Import Complete!</p>
              <p className="text-sm text-slate-500 mt-1">{importResult?.count || rows.length} records imported successfully</p>
              <button onClick={onClose} className="mt-6 px-6 py-2 rounded-lg text-sm font-bold bg-green-600 text-white hover:bg-green-700">Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
