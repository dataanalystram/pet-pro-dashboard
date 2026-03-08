import { useState, useEffect } from 'react';
import { settingsAPI } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Building, Clock, Bell, Shield, Save } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function SettingsPage() {
  const { refreshProvider } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsAPI.get().then(({ data }) => {
      setSettings(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const update = (field, value) => setSettings((s) => ({ ...s, [field]: value }));

  const updateHours = (day, field, value) => {
    setSettings((s) => ({
      ...s,
      business_hours: {
        ...s.business_hours,
        [day]: { ...s.business_hours?.[day], [field]: value },
      },
    }));
  };

  const save = async (fields) => {
    setSaving(true);
    try {
      const payload = {};
      fields.forEach((f) => { payload[f] = settings[f]; });
      const { data } = await settingsAPI.update(payload);
      setSettings(data);
      await refreshProvider();
      toast.success('Settings saved');
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="space-y-4" data-testid="settings-skeleton">
      <Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" />
    </div>
  );

  if (!settings) return null;

  return (
    <div className="space-y-6" data-testid="settings-page">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>

      <Tabs defaultValue="business" data-testid="settings-tabs">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="business"><Building className="w-4 h-4 mr-1.5" /> Business</TabsTrigger>
          <TabsTrigger value="hours"><Clock className="w-4 h-4 mr-1.5" /> Hours</TabsTrigger>
          <TabsTrigger value="booking"><Shield className="w-4 h-4 mr-1.5" /> Booking</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1.5" /> Notifications</TabsTrigger>
        </TabsList>

        {/* Business Info */}
        <TabsContent value="business" className="mt-4">
          <Card className="border-slate-200" data-testid="business-settings">
            <CardHeader>
              <CardTitle className="text-base">Business Information</CardTitle>
              <CardDescription>Update your business profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Business Name</Label>
                  <Input value={settings.business_name || ''} onChange={(e) => update('business_name', e.target.value)} data-testid="settings-business-name" /></div>
                <div className="space-y-1.5"><Label>Phone</Label>
                  <Input value={settings.phone || ''} onChange={(e) => update('phone', e.target.value)} /></div>
              </div>
              <div className="space-y-1.5"><Label>Tagline</Label>
                <Input value={settings.tagline || ''} onChange={(e) => update('tagline', e.target.value)} placeholder="Short description for customers" /></div>
              <div className="space-y-1.5"><Label>Description</Label>
                <Textarea value={settings.description || ''} onChange={(e) => update('description', e.target.value)} rows={3} /></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Address</Label>
                  <Input value={settings.address_line1 || ''} onChange={(e) => update('address_line1', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>City</Label>
                  <Input value={settings.city || ''} onChange={(e) => update('city', e.target.value)} /></div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>State/County</Label>
                  <Input value={settings.state || ''} onChange={(e) => update('state', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Postal Code</Label>
                  <Input value={settings.postal_code || ''} onChange={(e) => update('postal_code', e.target.value)} /></div>
              </div>
              <Button onClick={() => save(['business_name', 'phone', 'tagline', 'description', 'address_line1', 'city', 'state', 'postal_code'])} className="bg-provider-primary hover:bg-blue-700" disabled={saving} data-testid="save-business-btn">
                <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Hours */}
        <TabsContent value="hours" className="mt-4">
          <Card className="border-slate-200" data-testid="hours-settings">
            <CardHeader>
              <CardTitle className="text-base">Business Hours</CardTitle>
              <CardDescription>Set your operating hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DAYS.map((day) => {
                const hours = settings.business_hours?.[day] || {};
                return (
                  <div key={day} className="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0">
                    <div className="w-24">
                      <p className="text-sm font-medium text-slate-900 capitalize">{day}</p>
                    </div>
                    <Switch checked={hours.is_open !== false} onCheckedChange={(v) => updateHours(day, 'is_open', v)} />
                    {hours.is_open !== false ? (
                      <div className="flex items-center gap-2">
                        <Input type="time" value={hours.start || '09:00'} onChange={(e) => updateHours(day, 'start', e.target.value)} className="w-28 h-9" />
                        <span className="text-sm text-slate-400">to</span>
                        <Input type="time" value={hours.end || '17:00'} onChange={(e) => updateHours(day, 'end', e.target.value)} className="w-28 h-9" />
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">Closed</span>
                    )}
                  </div>
                );
              })}
              <Button onClick={() => save(['business_hours'])} className="bg-provider-primary hover:bg-blue-700 mt-4" disabled={saving} data-testid="save-hours-btn">
                <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Hours'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Settings */}
        <TabsContent value="booking" className="mt-4">
          <Card className="border-slate-200" data-testid="booking-settings">
            <CardHeader>
              <CardTitle className="text-base">Booking Preferences</CardTitle>
              <CardDescription>Control how bookings work</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div><p className="text-sm font-medium text-slate-900">Accept Bookings</p><p className="text-xs text-slate-500">Toggle accepting new bookings</p></div>
                <Switch checked={settings.is_accepting_bookings ?? true} onCheckedChange={(v) => update('is_accepting_bookings', v)} />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div><p className="text-sm font-medium text-slate-900">Auto-Accept Bookings</p><p className="text-xs text-slate-500">Automatically confirm new bookings</p></div>
                <Switch checked={settings.auto_accept_bookings ?? false} onCheckedChange={(v) => update('auto_accept_bookings', v)} />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1.5"><Label>Max Daily Bookings</Label>
                  <Input type="number" value={settings.max_daily_bookings || 10} onChange={(e) => update('max_daily_bookings', parseInt(e.target.value))} /></div>
                <div className="space-y-1.5"><Label>Lead Time (hours)</Label>
                  <Input type="number" value={settings.booking_lead_time_hours || 24} onChange={(e) => update('booking_lead_time_hours', parseInt(e.target.value))} /></div>
                <div className="space-y-1.5"><Label>Cancel Window (hours)</Label>
                  <Input type="number" value={settings.cancellation_window_hours || 24} onChange={(e) => update('cancellation_window_hours', parseInt(e.target.value))} /></div>
              </div>
              <Button onClick={() => save(['is_accepting_bookings', 'auto_accept_bookings', 'max_daily_bookings', 'booking_lead_time_hours', 'cancellation_window_hours'])} className="bg-provider-primary hover:bg-blue-700" disabled={saving} data-testid="save-booking-btn">
                <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="border-slate-200" data-testid="notification-settings">
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
              <CardDescription>Control how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {['email', 'push', 'sms'].map((type) => (
                <div key={type} className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-900 capitalize">{type} Notifications</p>
                    <p className="text-xs text-slate-500">Receive notifications via {type}</p>
                  </div>
                  <Switch
                    checked={settings.notification_preferences?.[type] ?? true}
                    onCheckedChange={(v) => setSettings(s => ({
                      ...s,
                      notification_preferences: { ...s.notification_preferences, [type]: v },
                    }))}
                  />
                </div>
              ))}
              <Button onClick={() => save(['notification_preferences'])} className="bg-provider-primary hover:bg-blue-700" disabled={saving} data-testid="save-notif-btn">
                <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
