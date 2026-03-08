import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { useServices, useInsert, useUpdate, useDelete } from '@/hooks/use-supabase-data';
import ServiceCard from './ServiceCard';
import ServiceFormDialog, { ServiceFormData } from './ServiceFormDialog';
import ServicePreview from './ServicePreview';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'grooming', label: 'Grooming' }, { value: 'dental', label: 'Dental' },
  { value: 'medical', label: 'Medical' }, { value: 'walking', label: 'Walking' },
  { value: 'boarding', label: 'Boarding' }, { value: 'training', label: 'Training' },
  { value: 'sitting', label: 'Pet Sitting' }, { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'featured', label: 'Featured' },
];

export default function ServicesPage() {
  const { data: services = [], isLoading } = useServices();
  const insertService = useInsert('services');
  const updateService = useUpdate('services');
  const deleteService = useDelete('services');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewService, setPreviewService] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return services.filter((s: any) => {
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.tags && s.tags.some((t: string) => t.toLowerCase().includes(search.toLowerCase()))) ||
        (s.short_description && s.short_description.toLowerCase().includes(search.toLowerCase()));
      const matchCategory = categoryFilter === 'all' || s.category === categoryFilter;
      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && s.is_active) ||
        (statusFilter === 'inactive' && !s.is_active) ||
        (statusFilter === 'featured' && s.featured);
      return matchSearch && matchCategory && matchStatus;
    });
  }, [services, search, categoryFilter, statusFilter]);

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (s: any) => { setEditing(s); setDialogOpen(true); };
  const openPreview = (s: any) => { setPreviewService(s); setPreviewOpen(true); };

  const handleSave = (form: ServiceFormData) => {
    const payload: Record<string, any> = {
      name: form.name, category: form.category,
      short_description: form.short_description || null,
      description: form.short_description || null,
      long_description: form.long_description || null,
      base_price: parseFloat(form.base_price),
      price_from: form.price_from ? parseFloat(form.price_from) : null,
      price_type: form.price_type,
      currency: form.currency,
      tax_rate: parseFloat(form.tax_rate) || 0,
      tax_inclusive: form.tax_inclusive,
      duration_minutes: parseInt(form.duration_minutes),
      buffer_minutes: parseInt(form.buffer_minutes) || 0,
      max_bookings_per_day: parseInt(form.max_bookings_per_day) || 10,
      pet_types_accepted: form.pet_types_accepted,
      vaccination_required: form.vaccination_required,
      age_restrictions: form.age_restrictions || null,
      breed_restrictions: form.breed_restrictions,
      weight_limit_kg: form.weight_limit_kg ? parseFloat(form.weight_limit_kg) : null,
      cover_image_url: form.cover_image_url || null,
      gallery_urls: form.gallery_urls,
      preparation_notes: form.preparation_notes || null,
      aftercare_notes: form.aftercare_notes || null,
      cancellation_policy: form.cancellation_policy || null,
      highlights: form.highlights,
      tags: form.tags,
      is_active: form.is_active,
      featured: form.featured,
      custom_pet_types: form.custom_pet_types,
      service_addons: form.service_addons,
      deposit_required: form.deposit_required,
      deposit_amount: form.deposit_amount ? parseFloat(form.deposit_amount) : null,
      deposit_type: form.deposit_type,
      available_days: form.available_days,
      available_time_start: form.available_time_start,
      available_time_end: form.available_time_end,
      min_advance_hours: parseInt(form.min_advance_hours) || 24,
      service_location: form.service_location,
      service_area_km: form.service_area_km ? parseFloat(form.service_area_km) : null,
      pet_size_pricing: form.pet_size_pricing ? {
        small: form.pet_size_pricing.small ? parseFloat(form.pet_size_pricing.small) : null,
        medium: form.pet_size_pricing.medium ? parseFloat(form.pet_size_pricing.medium) : null,
        large: form.pet_size_pricing.large ? parseFloat(form.pet_size_pricing.large) : null,
        xl: form.pet_size_pricing.xl ? parseFloat(form.pet_size_pricing.xl) : null,
      } : null,
      terms_conditions: form.terms_conditions || null,
      faq: form.faq,
      group_discount_percent: parseFloat(form.group_discount_percent) || 0,
      difficulty_level: form.difficulty_level,
    };

    if (editing) {
      updateService.mutate({ id: editing.id, ...payload }, {
        onSuccess: () => { toast.success('Service updated'); setDialogOpen(false); },
      });
    } else {
      insertService.mutate(payload, {
        onSuccess: () => { toast.success('Service created'); setDialogOpen(false); },
      });
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this service?')) return;
    deleteService.mutate(id, { onSuccess: () => toast.success('Service deleted') });
  };

  const handleDuplicate = (s: any) => {
    const { id, created_at, updated_at, total_bookings, ...rest } = s;
    insertService.mutate({ ...rest, name: `${s.name} (Copy)`, is_active: false }, {
      onSuccess: () => toast.success('Service duplicated'),
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading services...</div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Services</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} service{filtered.length !== 1 ? 's' : ''}
            {services.length !== filtered.length && ` of ${services.length} total`}
          </p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> New Service</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search services, tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
          <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No services found</p>
          <p className="text-sm mt-1">
            {search || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first service to get started'}
          </p>
          {!search && categoryFilter === 'all' && statusFilter === 'all' && (
            <Button onClick={openAdd} className="mt-4"><Plus className="w-4 h-4 mr-2" /> Create Service</Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s: any) => (
            <ServiceCard
              key={s.id}
              service={s}
              onEdit={() => openEdit(s)}
              onDelete={() => handleDelete(s.id)}
              onPreview={() => openPreview(s)}
              onDuplicate={() => handleDuplicate(s)}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <ServiceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSave={handleSave}
        saving={insertService.isPending || updateService.isPending}
      />

      {/* Preview */}
      <ServicePreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        service={previewService}
      />
    </div>
  );
}
