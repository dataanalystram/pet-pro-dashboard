import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarDays, Users, PawPrint, DollarSign, Clock, TrendingUp } from "lucide-react";

const stats = [
  { title: "Today's Appointments", value: "12", change: "+3 from yesterday", changeType: "positive" as const, icon: CalendarDays, iconBg: "bg-primary" },
  { title: "Active Clients", value: "248", change: "+18 this month", changeType: "positive" as const, icon: Users, iconBg: "bg-secondary" },
  { title: "Pets Registered", value: "412", change: "+7 this week", changeType: "positive" as const, icon: PawPrint, iconBg: "bg-info" },
  { title: "Monthly Revenue", value: "$8,420", change: "+12% vs last month", changeType: "positive" as const, icon: DollarSign, iconBg: "bg-success" },
];

const upcomingAppointments = [
  { id: 1, pet: "Bella", owner: "Sarah M.", service: "Grooming", time: "9:00 AM", status: "confirmed" },
  { id: 2, pet: "Max", owner: "John D.", service: "Vet Checkup", time: "10:30 AM", status: "confirmed" },
  { id: 3, pet: "Luna", owner: "Emily R.", service: "Boarding", time: "11:00 AM", status: "pending" },
  { id: 4, pet: "Charlie", owner: "Mike P.", service: "Training", time: "1:00 PM", status: "confirmed" },
  { id: 5, pet: "Daisy", owner: "Anna K.", service: "Grooming", time: "2:30 PM", status: "pending" },
];

const recentActivity = [
  { id: 1, text: "New booking from Sarah M. for Bella", time: "5 min ago" },
  { id: 2, text: "Payment received from John D. — $85", time: "22 min ago" },
  { id: 3, text: "Luna's vaccination record updated", time: "1 hr ago" },
  { id: 4, text: "New client registered: Mike P.", time: "2 hrs ago" },
  { id: 5, text: "Grooming session completed for Rocky", time: "3 hrs ago" },
];

const statusColor: Record<string, string> = {
  confirmed: "bg-success text-success-foreground",
  pending: "bg-warning text-warning-foreground",
};

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-heading font-bold">Welcome back! 🐾</h1>
          <p className="text-muted-foreground text-sm mt-1">Here's what's happening with your pet services today.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StatCard key={s.title} {...s} />
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Appointments */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Upcoming Appointments
                </CardTitle>
                <Badge variant="secondary" className="font-body">{upcomingAppointments.length} today</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                          {apt.pet[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{apt.pet}</p>
                        <p className="text-xs text-muted-foreground">{apt.owner} · {apt.service}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{apt.time}</span>
                      <Badge className={`text-xs ${statusColor[apt.status]}`}>
                        {apt.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-secondary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div>
                      <p className="text-sm">{item.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
