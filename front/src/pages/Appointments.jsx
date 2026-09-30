import React, { useState, useEffect, useCallback } from 'react';
import {
  Filter,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  CheckCircle2,
  CalendarCheck2,
  Calendar,
  Stethoscope,
} from 'lucide-react';
import { appointmentService } from '../services/appointment.service.js';
import { patientService } from '../services/patient.service.js';
import { Card, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Input } from '../components/ui/input.jsx';
import { Dialog } from '../components/ui/dialog.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    appointmentDate: '',
    status: 'pending',
    reason: '',
    notes: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Status updating state for individual rows
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const fetchAppointments = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const data = await appointmentService.getAppointments({
        date: dateFilter || undefined,
        status: statusFilter || undefined,
      });
      setAppointments(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch appointments.');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, statusFilter]);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const data = await appointmentService.getAppointments({
          date: dateFilter || undefined,
          status: statusFilter || undefined,
        });
        if (active) {
          setAppointments(data);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to fetch appointments.');
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [dateFilter, statusFilter]);

  const loadPatientsForBooking = async () => {
    try {
      const res = await patientService.getPatients({ limit: 100 });
      setPatients(res.patients);
      if (res.patients.length > 0 && !formData.patientId) {
        setFormData((prev) => ({ ...prev, patientId: res.patients[0].id }));
      }
    } catch (err) {
      console.error('Failed to load patient options', err);
    }
  };

  const openCreateModal = () => {
    loadPatientsForBooking();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const localIso = tomorrow.toISOString().slice(0, 16);

    setFormData({
      patientId: patients[0]?.id || '',
      appointmentDate: localIso,
      status: 'pending',
      reason: '',
      notes: '',
    });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await appointmentService.createAppointment({
        patientId: formData.patientId,
        appointmentDate: new Date(formData.appointmentDate).toISOString(),
        status: formData.status,
        reason: formData.reason,
        notes: formData.notes,
      });

      setIsCreateModalOpen(false);
      setSuccessMsg('Appointment scheduled successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchAppointments();
    } catch (err) {
      setFormError(err.message || 'Error booking appointment.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    setStatusUpdatingId(id);
    setError('');
    try {
      await appointmentService.updateStatus(id, newStatus);
      setSuccessMsg(`Appointment marked as ${newStatus}!`);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchAppointments();
    } catch (err) {
      setError(err.message || `Failed to update status to ${newStatus}.`);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const setFilterToday = () => {
    setDateFilter(new Date().toISOString().split('T')[0]);
  };

  const clearFilters = () => {
    setDateFilter('');
    setStatusFilter('');
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Appointment Schedule
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Book patient visits and manage consultations with automatic 30-minute conflict guarding
          </p>
        </div>

        <Button onClick={openCreateModal} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-1.5" /> Book Appointment
        </Button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Filters:
                </span>
              </div>

              {/* Status Filter */}
              <select
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full sm:w-auto"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Date Filter */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Input
                  type="date"
                  className="h-9 text-xs flex-1 sm:w-36"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
                <Button variant="outline" size="sm" onClick={setFilterToday} className="h-9 text-xs">
                  Today
                </Button>
              </div>

              {(dateFilter || statusFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-9 text-xs text-slate-500"
                >
                  Clear Filters
                </Button>
              )}
            </div>

            <span className="text-xs font-medium text-slate-400 text-left sm:text-right">
              Showing {appointments.length} appointments
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-sm text-slate-400">Loading appointments...</div>
          ) : appointments.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
              <CalendarCheck2 className="w-10 h-10 text-slate-300" />
              <span>No appointments found for the selected filters.</span>
            </div>
          ) : (
            <>
              {/* Mobile Card List View (< md: 768px) */}
              <div className="md:hidden divide-y divide-slate-100">
                {appointments.map((app) => {
                  const isUpdating = statusUpdatingId === app.id;
                  return (
                    <div key={app.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                      {/* Top Row: Date & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                          <Calendar className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                          <span>{formatDateTime(app.appointmentDate)}</span>
                        </div>
                        <Badge variant={app.status} className="capitalize text-[11px]">
                          {app.status}
                        </Badge>
                      </div>

                      {/* Patient & Reason */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">{app.patientName}</span>
                          <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {app.patientCin}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 flex items-start gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{app.reason}</span>
                        </p>
                        {app.notes && (
                          <p className="text-[11px] text-slate-400 italic pl-5">
                            Note: {app.notes}
                          </p>
                        )}
                      </div>

                      {/* Bottom Row: Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        {app.status !== 'confirmed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleStatusUpdate(app.id, 'confirmed')}
                            className="flex-1 h-8 text-xs text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100/70 border-emerald-200"
                            title="Confirm appointment (checks 30-min window)"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Confirm
                          </Button>
                        )}
                        {app.status !== 'cancelled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleStatusUpdate(app.id, 'cancelled')}
                            className="flex-1 h-8 text-xs text-rose-700 bg-rose-50/60 hover:bg-rose-100/70 border-rose-200"
                            title="Cancel appointment"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" /> Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (>= md: 768px) */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date &amp; Time</TableHead>
                      <TableHead>Patient Details</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((app) => {
                      const isUpdating = statusUpdatingId === app.id;
                      return (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium text-slate-900 whitespace-nowrap text-sm">
                            {formatDateTime(app.appointmentDate)}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-slate-800 text-sm">{app.patientName}</div>
                            <div className="text-xs font-mono text-slate-400">{app.patientCin}</div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-slate-700 text-sm">
                            {app.reason}
                          </TableCell>
                          <TableCell>
                            <Badge variant={app.status} className="capitalize text-xs">
                              {app.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate text-slate-500 text-xs">
                            {app.notes || '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {app.status !== 'confirmed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isUpdating}
                                  onClick={() => handleStatusUpdate(app.id, 'confirmed')}
                                  className="text-xs text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                                  title="Confirm appointment (checks 30-min window)"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Confirm
                                </Button>
                              )}
                              {app.status !== 'cancelled' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isUpdating}
                                  onClick={() => handleStatusUpdate(app.id, 'cancelled')}
                                  className="text-xs text-rose-700 hover:bg-rose-50 hover:border-rose-300"
                                  title="Cancel appointment"
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" /> Cancel
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Appointment Modal */}
      <Dialog
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Schedule New Appointment"
        description="Booking with automatic backend 30-minute conflict validation"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>{formError}</div>
          </div>
        )}

        <form onSubmit={handleCreateAppointment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Select Patient *
            </label>
            <select
              required
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} (CIN: {p.cin})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Appointment Date &amp; Time *
            </label>
            <Input
              type="datetime-local"
              required
              value={formData.appointmentDate}
              onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Initial Status *
            </label>
            <select
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed (Enforces 30-min window)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Reason for Visit *
            </label>
            <Input
              required
              placeholder="e.g. Cardiology checkup, Prescription renewal"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Clinical Notes (Optional)
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              rows={3}
              placeholder="Any preparatory instructions or special requests..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              Schedule Appointment
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
