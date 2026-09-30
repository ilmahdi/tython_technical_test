import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Phone,
  CreditCard,
  MapPin,
  CalendarPlus,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { patientService } from '../services/patient.service.js';
import { appointmentService } from '../services/appointment.service.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Dialog } from '../components/ui/dialog.jsx';
import { Input } from '../components/ui/input.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';

export default function PatientDetails() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Book appointment modal state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookFormData, setBookFormData] = useState({
    appointmentDate: '',
    status: 'pending',
    reason: '',
    notes: '',
  });
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError] = useState('');

  const fetchPatientDetails = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const data = await patientService.getPatientById(id);
      setPatient(data);
    } catch (err) {
      setError(err.message || 'Failed to load patient dossier.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const data = await patientService.getPatientById(id);
        if (active) {
          setPatient(data);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to load patient dossier.');
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [id]);

  const openBookModal = () => {
    // Default to tomorrow at 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const localIso = tomorrow.toISOString().slice(0, 16);

    setBookFormData({
      appointmentDate: localIso,
      status: 'pending',
      reason: '',
      notes: '',
    });
    setBookError('');
    setIsBookModalOpen(true);
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setBookError('');
    setBookLoading(true);
    try {
      await appointmentService.createAppointment({
        patientId: patient.id,
        appointmentDate: new Date(bookFormData.appointmentDate).toISOString(),
        status: bookFormData.status,
        reason: bookFormData.reason,
        notes: bookFormData.notes,
      });

      setIsBookModalOpen(false);
      setSuccessMsg('Appointment booked successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchPatientDetails();
    } catch (err) {
      setBookError(err.message || 'Error booking appointment.');
    } finally {
      setBookLoading(false);
    }
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

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-slate-400 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading patient profile &amp; clinical history...</span>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="space-y-4">
        <Link to="/patients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Patient Registry
          </Button>
        </Link>
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
          <div>
            <h3 className="font-semibold text-rose-900">Unable to load dossier</h3>
            <p className="text-xs text-rose-700 mt-0.5">{error || 'Patient not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/patients">
            <Button variant="outline" size="icon" title="Back to Patients">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {patient.fullName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                CIN: {patient.cin}
              </span>
              <span className="text-xs text-slate-400">&bull; Registered dossier</span>
            </div>
          </div>
        </div>

        <Button onClick={openBookModal} className="w-full sm:w-auto">
          <CalendarPlus className="w-4 h-4 mr-1.5" /> Book Appointment
        </Button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Patient Profile Card Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase">National CIN</span>
            <p className="font-semibold text-slate-800 font-mono text-sm">{patient.cin}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase">Contact Phone</span>
            <p className="font-semibold text-slate-800 text-sm">{patient.phone}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase">Date of Birth</span>
            <p className="font-semibold text-slate-800 text-sm">{patient.birthDate}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-400 uppercase">Address</span>
            <p className="font-semibold text-slate-800 text-sm truncate">
              {patient.address || 'No address provided'}
            </p>
          </div>
        </Card>
      </div>

      {/* Chronological Appointment History Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 sm:p-6">
          <div>
            <CardTitle className="text-lg">Appointment History</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete chronological medical consultations for this patient
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 self-start sm:self-auto">
            {patient.appointments?.length || 0} Visits Recorded
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {!patient.appointments || patient.appointments.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
              <Clock className="w-10 h-10 text-slate-300" />
              <span>No appointment history recorded for this patient.</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Reason for Consultation</TableHead>
                  <TableHead className="hidden lg:table-cell">Clinical Notes</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Scheduled By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patient.appointments.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium text-slate-900 whitespace-nowrap text-xs sm:text-sm">
                      {formatDateTime(app.appointmentDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={app.status} className="capitalize text-[11px]">
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-medium text-slate-800 max-w-[200px] text-xs sm:text-sm">
                      {app.reason}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-slate-500 text-xs max-w-[200px] truncate">
                      {app.notes || '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right text-xs text-slate-500">
                      <div className="font-medium text-slate-700">{app.createdByName || 'Staff'}</div>
                      <div className="text-[10px] text-slate-400">{app.createdByEmail}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Book Appointment Modal */}
      <Dialog
        open={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title={`Schedule Visit for ${patient.fullName}`}
        description="Enforces the 30-minute conflict rule against confirmed slots"
      >
        {bookError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>{bookError}</div>
          </div>
        )}
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Appointment Date &amp; Time *
            </label>
            <Input
              type="datetime-local"
              required
              value={bookFormData.appointmentDate}
              onChange={(e) =>
                setBookFormData({ ...bookFormData, appointmentDate: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Initial Status *
            </label>
            <select
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              value={bookFormData.status}
              onChange={(e) => setBookFormData({ ...bookFormData, status: e.target.value })}
            >
              <option value="pending">Pending Approval</option>
              <option value="confirmed">Confirmed (Checks 30-min window)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Consultation Reason *
            </label>
            <Input
              required
              placeholder="e.g. Routine Examination, Blood Pressure Check"
              value={bookFormData.reason}
              onChange={(e) => setBookFormData({ ...bookFormData, reason: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Clinical Notes (Optional)
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              rows={3}
              placeholder="Symptoms, special requests, patient instructions..."
              value={bookFormData.notes}
              onChange={(e) => setBookFormData({ ...bookFormData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsBookModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={bookLoading}>
              Schedule Appointment
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
