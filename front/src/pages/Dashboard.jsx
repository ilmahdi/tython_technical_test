import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  UserPlus,
  CalendarPlus,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { dashboardService } from '../services/dashboard.service.js';
import { appointmentService } from '../services/appointment.service.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setLoading(true);
    setError('');
    try {
      const [statsData, appointmentsData] = await Promise.all([
        dashboardService.getStats(),
        appointmentService.getAppointments(),
      ]);
      setStats(statsData);
      setRecentAppointments(appointmentsData.slice(0, 5));
    } catch (err) {
      setError(err.message || 'Failed to load clinic dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const [statsData, appointmentsData] = await Promise.all([
          dashboardService.getStats(),
          appointmentService.getAppointments(),
        ]);
        if (active) {
          setStats(statsData);
          setRecentAppointments(appointmentsData.slice(0, 5));
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to load clinic dashboard statistics.');
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      active = false;
    };
  }, []);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Clinic Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time status of clinic capacity, patients, and upcoming appointment schedules
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={loading}
            className="flex-1 sm:flex-initial"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link to="/appointments" className="flex-1 sm:flex-initial">
            <Button size="sm" className="w-full">
              <CalendarPlus className="w-4 h-4 mr-1.5" /> Book Appointment
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Required KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Active Patients
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              {loading ? '...' : stats?.totalPatients ?? 0}
            </div>
            <Link
              to="/patients"
              className="inline-flex items-center text-xs font-semibold text-cyan-600 hover:text-cyan-700 mt-2"
            >
              View directory <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">
              Today's Appointments
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              {loading ? '...' : stats?.todayAppointments ?? 0}
            </div>
            <p className="text-xs text-slate-400 mt-2">Scheduled for today</p>
          </CardContent>
        </Card>

        {/* Pending Appointments */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">
              Pending Approvals
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600 tracking-tight">
              {loading ? '...' : stats?.pendingAppointments ?? 0}
            </div>
            <Link
              to="/appointments"
              className="inline-flex items-center text-xs font-semibold text-amber-600 hover:text-amber-700 mt-2"
            >
              Review queue <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </CardContent>
        </Card>

        {/* Confirmed Appointments */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">
              Confirmed Visits
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 tracking-tight">
              {loading ? '...' : stats?.confirmedAppointments ?? 0}
            </div>
            <p className="text-xs text-slate-400 mt-2">Active confirmed consultations</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Shortcuts & Upcoming Schedule Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Appointments Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Chronological clinic schedule preview</p>
              </div>
              <Link to="/appointments">
                <Button variant="ghost" size="sm">
                  View All <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-sm text-slate-400">Loading appointments...</div>
              ) : recentAppointments.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">No appointments scheduled</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date &amp; Time</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead className="hidden sm:table-cell">Reason</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAppointments.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium whitespace-nowrap text-slate-900 text-xs sm:text-sm">
                          {formatDateTime(app.appointmentDate)}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-800 text-xs sm:text-sm">{app.patientName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{app.patientCin}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell max-w-[200px] truncate text-slate-600 text-xs sm:text-sm">
                          {app.reason}
                        </TableCell>
                        <TableCell>
                          <Badge variant={app.status} className="capitalize text-[11px]">
                            {app.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Operations Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Clinical Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/patients" className="block">
                <div className="p-3.5 rounded-xl border border-slate-200/80 hover:border-cyan-300 hover:bg-cyan-50/50 transition-all flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Register Patient</h4>
                    <p className="text-xs text-slate-500">Create new patient file with CIN</p>
                  </div>
                </div>
              </Link>

              <Link to="/appointments" className="block">
                <div className="p-3.5 rounded-xl border border-slate-200/80 hover:border-cyan-300 hover:bg-cyan-50/50 transition-all flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                    <CalendarPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Schedule Visit</h4>
                    <p className="text-xs text-slate-500">Enforces 30-min window conflict rule</p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-50/70 via-white to-teal-50/50 border border-teal-200/80 shadow-sm">
            <CardContent className="p-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-100/80 text-teal-800 text-xs font-semibold mb-3 border border-teal-200/60">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> 30-Min Rule Engine Active
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">
                Conflict Prevention Active
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                The backend ensures that confirmed patient visits maintain a strict 30-minute separation window to prevent clinic scheduling overlap.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
