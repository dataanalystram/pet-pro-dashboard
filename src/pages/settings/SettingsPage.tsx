import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Building, Clock, Bell, Shield, Save } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const defaultSettings = {
  business_name: 'PetDash Pro',
  phone: '+1 (555) 123-4567',
  tagline: 'Professional Pet Care Services',
  description: 'We provide top-quality grooming, training, and boarding services for your beloved pets.',
  address_line1: '123 Pet Street',
  city: 'San Francisco',
  state: 'CA',
  postal_code: '94105',
  business_hours: {
    monday: { is_open: true, start: '09:00', end: '17:00' },
    tuesday: { is_open: true, start: '09:00', end: '17:00' },
    wednesday: { is_open: true, start: '09:00', end: '17:00' },
    thursday: { is_open: true, start: '09:00', end: '17:00' },
    friday: { is_open: true, start: '09:00', end: '17:00' },
    saturday: { is_open: true, start: '10:00', end: '14:00' },
    sunday: { is_open: false, start: '09:00', end: '17:00' },
  } as Record<string, any>,
  is_accepting_bookings: true,
  auto_accept_bookings: false,
  max_daily_bookings: 10,
  booking_lead_time_hours: 24,
  cancellation_window_hours: 24,
  notification_preferences: { email: true, push: true, sms: false } as Record<string, boolean>,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [saving, setSaving] = useState(false);

  const update = (field: string, value: any) => setSettings((s) => ({ ...s, [field]: value }));

  const updateHours = (day: string, field: string, value: any) => {
    setSettings((s) => ({
      ...s,
      business_hours: { ...s.business_hours, [day]: { ...s.business_hours?.[day], [field]: value } },
    }));
  };

  const save = () => { setSaving(true); setTimeout(() => { setSaving(false); toast.success('Settings saved'); }, 500); };

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-semibold">Settings</h1>

      <Tabs defaultValue="business">
        <TabsList className="bg-muted flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="business" className="text-xs sm:text-sm"><Building className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Business</span></TabsTrigger>
          <TabsTrigger value="hours" className="text-xs sm:text-sm"><Clock className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Hours</span></TabsTrigger>
          <TabsTrigger value="booking" className="text-xs sm:text-sm"><Shield className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Booking</span></TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm"><Bell className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Notifications</span></TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Business Information</CardTitle>
              <CardDescription>Update your business profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Business Name</Label><Input value={settings.business_name} onChange={(e) => update('business_name', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Phone</Label><Input value={settings.phone} onChange={(e) => update('phone', e.target.value)} /></div>
              </div>
              <div className="space-y-1.5"><Label>Tagline</Label><Input value={settings.tagline} onChange={(e) => update('tagline', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea value={settings.description} onChange={(e) => update('description', e.target.value)} rows={3} /></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Address</Label><Input value={settings.address_line1} onChange={(e) => update('address_line1', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>City</Label><Input value={settings.city} onChange={(e) => update('city', e.target.value)} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>State</Label><Input value={settings.state} onChange={(e) => update('state', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Postal Code</Label><Input value={settings.postal_code} onChange={(e) => update('postal_code', e.target.value)} /></div>
              </div>
              <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Business Hours</CardTitle>
              <CardDescription>Set your operating hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DAYS.map((day) => {
                const hours = settings.business_hours?.[day] || {};
                return (
                  <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2 border-b last:border-0">
                    <div className="w-24"><p className="text-sm font-medium capitalize">{day}</p></div>
                    <Switch checked={hours.is_open !== false} onCheckedChange={(v) => updateHours(day, 'is_open', v)} />
                    {hours.is_open !== false ? (
                      <div className="flex items-center gap-2">
                        <Input type="time" value={hours.start || '09:00'} onChange={(e) => updateHours(day, 'start', e.target.value)} className="w-28 h-9" />
                        <span className="text-sm text-muted-foreground">to</span>
                        <Input type="time" value={hours.end || '17:00'} onChange={(e) => updateHours(day, 'end', e.target.value)} className="w-28 h-9" />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Closed</span>
                    )}
                  </div>
                );
              })}
              <Button onClick={save} disabled={saving} className="mt-4"><Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Hours'}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="booking" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Booking Preferences</CardTitle>
              <CardDescription>Control how bookings work</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div><p className="text-sm font-medium">Accept Bookings</p><p className="text-xs text-muted-foreground">Toggle accepting new bookings</p></div>
                <Switch checked={settings.is_accepting_bookings} onCheckedChange={(v) => update('is_accepting_bookings', v)} />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div><p className="text-sm font-medium">Auto-Accept Bookings</p><p className="text-xs text-muted-foreground">Automatically confirm new bookings</p></div>
                <Switch checked={settings.auto_accept_bookings} onCheckedChange={(v) => update('auto_accept_bookings', v)} />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5"><Label>Max Daily Bookings</Label><Input type="number" value={settings.max_daily_bookings} onChange={(e) => update('max_daily_bookings', parseInt(e.target.value))} /></div>
                <div className="space-y-1.5"><Label>Lead Time (hours)</Label><Input type="number" value={settings.booking_lead_time_hours} onChange={(e) => update('booking_lead_time_hours', parseInt(e.target.value))} /></div>
                <div className="space-y-1.5"><Label>Cancel Window (hours)</Label><Input type="number" value={settings.cancellation_window_hours} onChange={(e) => update('cancellation_window_hours', parseInt(e.target.value))} /></div>
              </div>
              <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Preferences'}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Notification Preferences</CardTitle>
              <CardDescription>Control how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {['email', 'push', 'sms'].map((type) => (
                <div key={type} className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="text-sm font-medium capitalize">{type} Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive notifications via {type}</p>
                  </div>
                  <Switch
                    checked={settings.notification_preferences?.[type] ?? true}
                    onCheckedChange={(v) => setSettings(s => ({ ...s, notification_preferences: { ...s.notification_preferences, [type]: v } }))}
                  />
                </div>
              ))}
              <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Preferences'}</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
