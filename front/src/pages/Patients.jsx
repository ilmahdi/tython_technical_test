import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { patientService } from '../services/patient.service.js';
import { useAuth } from '../hooks/useAuth.js';
import { Card, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Dialog } from '../components/ui/dialog.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';

export default function Patients() {
  const { isAdmin } = useAuth();
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    cin: '',
    phone: '',
    birthDate: '',
    address: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchPatients = useCallback(async (page = 1, searchQuery = '', showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const data = await patientService.getPatients({
        page,
        limit: 10,
        search: searchQuery,
      });
      setPatients(data.patients);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message || 'Failed to fetch patients list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    patientService
      .getPatients({ page: 1, limit: 10, search })
      .then((data) => {
        if (active) {
          setPatients(data.patients);
          setPagination(data.pagination);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Failed to fetch patients list.');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [search]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const openAddModal = () => {
    setFormData({
      fullName: '',
      cin: '',
      phone: '',
      birthDate: '',
      address: '',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      fullName: patient.fullName,
      cin: patient.cin,
      phone: patient.phone,
      birthDate: patient.birthDate,
      address: patient.address || '',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (patient) => {
    setSelectedPatient(patient);
    setIsDeleteModalOpen(true);
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await patientService.createPatient(formData);
      setIsAddModalOpen(false);
      setSuccessMsg('Patient registered successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchPatients(1, search);
    } catch (err) {
      setFormError(err.message || 'Error creating patient.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await patientService.updatePatient(selectedPatient.id, formData);
      setIsEditModalOpen(false);
      setSuccessMsg('Patient updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchPatients(pagination.page, search);
    } catch (err) {
      setFormError(err.message || 'Error updating patient.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePatient = async () => {
    setFormLoading(true);
    try {
      await patientService.deletePatient(selectedPatient.id);
      setIsDeleteModalOpen(false);
      setSuccessMsg('Patient record deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchPatients(pagination.page, search);
    } catch (err) {
      setError(err.message || 'Error deleting patient.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Title & Register Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Patient Registry
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage clinical dossiers, national IDs (CIN), and patient appointment histories
          </p>
        </div>

        <Button onClick={openAddModal} className="w-full sm:w-auto">
          <UserPlus className="w-4 h-4 mr-1.5" /> Register Patient
        </Button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Input Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <Input
              type="text"
              placeholder="Search by full name or CIN..."
              className="pl-10"
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Patient Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-sm text-slate-400">Loading patient records...</div>
          ) : patients.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
              <Users className="w-10 h-10 text-slate-300" />
              <span>No patients found matching your search.</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>National CIN</TableHead>
                  <TableHead className="hidden sm:table-cell">Phone</TableHead>
                  <TableHead className="hidden md:table-cell">Birth Date</TableHead>
                  <TableHead className="hidden lg:table-cell">Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-semibold text-slate-900 text-xs sm:text-sm">
                      <Link
                        to={`/patients/${patient.id}`}
                        className="hover:text-cyan-600 transition-colors"
                      >
                        {patient.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                        {patient.cin}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-slate-600 text-xs sm:text-sm">{patient.phone}</TableCell>
                    <TableCell className="hidden md:table-cell text-slate-600 text-xs sm:text-sm">{patient.birthDate}</TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[200px] truncate text-slate-500 text-xs">
                      {patient.address || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/patients/${patient.id}`}>
                          <Button variant="ghost" size="icon" title="View Dossier">
                            <Eye className="w-4 h-4 text-cyan-600" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(patient)}
                          title="Edit Patient"
                        >
                          <Edit2 className="w-4 h-4 text-slate-600" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteModal(patient)}
                            title="Delete Patient (Admin Only)"
                            className="hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-100">
            <span className="text-xs text-slate-500 text-center sm:text-left">
              Showing page <strong className="text-slate-700">{pagination.page}</strong> of{' '}
              <strong className="text-slate-700">{pagination.totalPages}</strong> ({pagination.total} total patients)
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchPatients(pagination.page - 1, search)}
                className="flex-1 sm:flex-initial"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => fetchPatients(pagination.page + 1, search)}
                className="flex-1 sm:flex-initial"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Patient Modal */}
      <Dialog
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Patient"
        description="Create a unique patient dossier with valid national identification"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {formError}
          </div>
        )}
        <form onSubmit={handleCreatePatient} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Full Name *
            </label>
            <Input
              required
              placeholder="e.g. Amine El Amrani"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                CIN (National ID) *
              </label>
              <Input
                required
                placeholder="e.g. AB123456"
                value={formData.cin}
                onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Phone Number *
              </label>
              <Input
                required
                placeholder="+212612345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Birth Date *
            </label>
            <Input
              type="date"
              required
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Residential Address (Optional)
            </label>
            <Input
              placeholder="Street, City, Postal Code"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              Save Patient Dossier
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Patient Modal */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Patient Information"
        description="Update personal or contact information for this patient dossier"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {formError}
          </div>
        )}
        <form onSubmit={handleUpdatePatient} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Full Name *
            </label>
            <Input
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                CIN (National ID) *
              </label>
              <Input
                required
                value={formData.cin}
                onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Phone Number *
              </label>
              <Input
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Birth Date *
            </label>
            <Input
              type="date"
              required
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Residential Address
            </label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              Update Patient
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Patient Confirmation Modal (Admin only) */}
      <Dialog
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Patient Removal"
        description="Are you sure you want to soft-delete this patient dossier?"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs">
            ⚠️ <strong>Admin Action:</strong> The dossier for <strong>{selectedPatient?.fullName}</strong> (CIN: {selectedPatient?.cin}) will be soft-deleted. Historical appointments will be archived.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={formLoading}
              onClick={handleDeletePatient}
            >
              Delete Dossier
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
