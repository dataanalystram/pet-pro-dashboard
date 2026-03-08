import { useState, useEffect } from 'react';
import { vetAPI } from '@/api';
import { Receipt, DollarSign, Clock, CheckCircle, Plus, Search, Filter, Eye, CreditCard, Printer, Send, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-50 text-blue-700',
  paid: 'bg-green-50 text-green-700',
  partial: 'bg-amber-50 text-amber-700',
  overdue: 'bg-red-50 text-red-700',
  cancelled: 'bg-red-50 text-red-600',
};

const EMPTY_INVOICE = {
  client_id: '', patient_id: '', invoice_date: new Date().toISOString().split('T')[0],
  due_date: '', line_items: [{ description: '', quantity: 1, unit_price: 0 }],
  tax_rate: 23, notes: '', status: 'draft',
};

export default function VetBilling() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_INVOICE });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const [inv, cl, pt] = await Promise.all([vetAPI.getInvoices(), vetAPI.getClients(), vetAPI.getPatients()]);
      setInvoices(inv.data);
      setClients(cl.data);
      setPatients(pt.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const total = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const paid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0);
  const outstanding = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + (i.balance_due || i.total || 0), 0);

  const filtered = invoices.filter(i => {
    if (filter !== 'all' && i.status !== filter) return false;
    if (search && !i.invoice_number?.toLowerCase().includes(search.toLowerCase()) && !i.client_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const addLineItem = () => setForm(f => ({ ...f, line_items: [...f.line_items, { description: '', quantity: 1, unit_price: 0 }] }));
  const removeLineItem = (idx) => setForm(f => ({ ...f, line_items: f.line_items.filter((_, i) => i !== idx) }));
  const updateLineItem = (idx, field, value) => setForm(f => ({ ...f, line_items: f.line_items.map((item, i) => i === idx ? { ...item, [field]: value } : item) }));

  const subtotal = form.line_items.reduce((s, item) => s + (item.quantity * item.unit_price), 0);
  const tax = subtotal * (form.tax_rate / 100);
  const invoiceTotal = subtotal + tax;

  const handleCreate = async () => {
    if (!form.client_id) { toast.error('Select a client'); return; }
    setSaving(true);
    try {
      await vetAPI.createInvoice({ ...form, subtotal, tax_amount: tax, total: invoiceTotal, balance_due: invoiceTotal });
      toast.success('Invoice created');
      setShowCreate(false);
      setForm({ ...EMPTY_INVOICE });
      fetchData();
    } catch { toast.error('Failed to create invoice'); }
    setSaving(false);
  };

  const markPaid = async (inv) => {
    try {
      await vetAPI.createInvoice({ ...inv, status: 'paid', balance_due: 0, payment_date: new Date().toISOString() });
      toast.success('Marked as paid');
      fetchData();
    } catch { toast.error('Failed'); }
  };

  const clientPatients = form.client_id ? patients.filter(p => p.client_id === form.client_id) : patients;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing & Invoices</h1>
          <p className="text-sm text-slate-500">{invoices.length} invoices</p>
        </div>
        <button onClick={() => { setForm({ ...EMPTY_INVOICE }); setShowCreate(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-vet-primary text-white rounded-lg font-medium text-sm hover:bg-vet-secondary shadow-sm">
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5"><div className="flex items-center gap-2 mb-2"><Receipt className="w-5 h-5 text-vet-primary" /><span className="text-sm text-slate-500">Total Invoiced</span></div><p className="text-2xl font-bold">\u20AC{total.toFixed(2)}</p></div>
        <div className="bg-white rounded-xl border p-5"><div className="flex items-center gap-2 mb-2"><CheckCircle className="w-5 h-5 text-green-600" /><span className="text-sm text-slate-500">Paid</span></div><p className="text-2xl font-bold text-green-600">\u20AC{paid.toFixed(2)}</p></div>
        <div className="bg-white rounded-xl border p-5"><div className="flex items-center gap-2 mb-2"><Clock className="w-5 h-5 text-amber-600" /><span className="text-sm text-slate-500">Outstanding</span></div><p className="text-2xl font-bold text-amber-600">\u20AC{outstanding.toFixed(2)}</p></div>
        <div className="bg-white rounded-xl border p-5"><div className="flex items-center gap-2 mb-2"><FileText className="w-5 h-5 text-blue-600" /><span className="text-sm text-slate-500">This Month</span></div><p className="text-2xl font-bold">{invoices.filter(i => i.invoice_date?.startsWith(new Date().toISOString().slice(0,7))).length}</p></div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..." className="w-full pl-9 pr-4 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vet-primary/20" />
        </div>
        {['all','draft','sent','paid','overdue'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn('px-3 py-2 rounded-lg text-xs font-medium capitalize', filter === f ? 'bg-vet-primary text-white' : 'bg-white border text-slate-600 hover:bg-slate-50')}>{f}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b"><tr>
            <th className="text-left px-5 py-3 font-semibold text-slate-600">Invoice</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-600">Client</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-600">Date</th>
            <th className="text-right px-5 py-3 font-semibold text-slate-600">Total</th>
            <th className="text-right px-5 py-3 font-semibold text-slate-600">Balance</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-600">Status</th>
            <th className="text-right px-5 py-3 font-semibold text-slate-600">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(inv => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">{inv.invoice_number || inv.id?.slice(0,8)}</td>
                <td className="px-5 py-3 text-slate-600">{inv.client_name || '-'}</td>
                <td className="px-5 py-3 text-slate-500">{inv.invoice_date}</td>
                <td className="px-5 py-3 text-right font-semibold">\u20AC{(inv.total || 0).toFixed(2)}</td>
                <td className="px-5 py-3 text-right">{(inv.balance_due || 0) > 0 ? <span className="text-amber-600 font-semibold">\u20AC{(inv.balance_due||0).toFixed(2)}</span> : <span className="text-green-600">Paid</span>}</td>
                <td className="px-5 py-3"><span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', STATUS_COLORS[inv.status] || STATUS_COLORS.draft)}>{inv.status}</span></td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setShowDetail(inv)} className="p-1.5 rounded hover:bg-slate-100" title="View"><Eye className="w-4 h-4 text-slate-500" /></button>
                    {inv.status !== 'paid' && <button onClick={() => markPaid(inv)} className="p-1.5 rounded hover:bg-green-50" title="Mark Paid"><CreditCard className="w-4 h-4 text-green-600" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-16 text-center text-sm text-slate-400">No invoices found</div>}
      </div>

      {/* Create Invoice Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Invoice" subtitle="Create a new invoice" width="max-w-2xl">
        <div className="space-y-4">
          <FormRow>
            <FormSelect label="Client" required options={[{ value: '', label: 'Select client...' }, ...clients.map(c => ({ value: c.id, label: `${c.first_name} ${c.last_name}` }))]} value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} />
            <FormSelect label="Patient" options={[{ value: '', label: 'Select patient...' }, ...clientPatients.map(p => ({ value: p.id, label: `${p.name} (${p.species})` }))]} value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} />
          </FormRow>
          <FormRow>
            <FormInput label="Invoice Date" type="date" value={form.invoice_date} onChange={e => setForm(f => ({ ...f, invoice_date: e.target.value }))} />
            <FormInput label="Due Date" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
          </FormRow>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Line Items</label>
            {form.line_items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input value={item.description} onChange={e => updateLineItem(idx, 'description', e.target.value)} placeholder="Description" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                <input type="number" value={item.quantity} onChange={e => updateLineItem(idx, 'quantity', parseInt(e.target.value) || 0)} className="w-20 px-3 py-2 border rounded-lg text-sm text-center" />
                <input type="number" step="0.01" value={item.unit_price} onChange={e => updateLineItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} className="w-28 px-3 py-2 border rounded-lg text-sm text-right" placeholder="Price" />
                <span className="w-24 text-sm font-medium text-right">\u20AC{(item.quantity * item.unit_price).toFixed(2)}</span>
                {form.line_items.length > 1 && <button onClick={() => removeLineItem(idx)} className="p-1.5 rounded hover:bg-red-50"><X className="w-4 h-4 text-red-500" /></button>}
              </div>
            ))}
            <button onClick={addLineItem} className="text-sm text-vet-primary font-medium hover:underline">+ Add Line Item</button>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-medium">\u20AC{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-slate-500">VAT</span>
              <div className="flex items-center gap-2">
                <input type="number" value={form.tax_rate} onChange={e => setForm(f => ({ ...f, tax_rate: parseFloat(e.target.value) || 0 }))} className="w-16 px-2 py-1 border rounded text-sm text-right" />%
                <span className="font-medium">\u20AC{tax.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between text-base font-bold border-t pt-2"><span>Total</span><span>\u20AC{invoiceTotal.toFixed(2)}</span></div>
          </div>

          <FormTextarea label="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Payment terms, additional notes..." />

          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 border hover:bg-slate-50">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-vet-primary text-white hover:bg-vet-secondary disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </div>
      </SlidePanel>

      {/* Detail Panel */}
      <SlidePanel isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={`Invoice ${showDetail?.invoice_number || ''}`} subtitle={showDetail?.client_name} width="max-w-xl">
        {showDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Date:</span> <span className="font-medium">{showDetail.invoice_date}</span></div>
              <div><span className="text-slate-500">Status:</span> <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[showDetail.status])}>{showDetail.status}</span></div>
              <div><span className="text-slate-500">Patient:</span> <span className="font-medium">{showDetail.patient_name || '-'}</span></div>
              <div><span className="text-slate-500">Total:</span> <span className="font-bold">\u20AC{(showDetail.total||0).toFixed(2)}</span></div>
            </div>
            {showDetail.line_items?.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50"><tr><th className="text-left px-4 py-2">Item</th><th className="text-center px-4 py-2">Qty</th><th className="text-right px-4 py-2">Price</th><th className="text-right px-4 py-2">Total</th></tr></thead>
                  <tbody className="divide-y">
                    {showDetail.line_items.map((item, i) => (
                      <tr key={i}><td className="px-4 py-2">{item.description}</td><td className="px-4 py-2 text-center">{item.quantity}</td><td className="px-4 py-2 text-right">\u20AC{(item.unit_price||0).toFixed(2)}</td><td className="px-4 py-2 text-right font-medium">\u20AC{((item.quantity||0)*(item.unit_price||0)).toFixed(2)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {showDetail.status !== 'paid' && (
              <button onClick={() => { markPaid(showDetail); setShowDetail(null); }} className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4" /> Record Payment
              </button>
            )}
          </div>
        )}
      </SlidePanel>
    </div>
  );
}
