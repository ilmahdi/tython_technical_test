-- ==========================================
-- ClinicFlow Seed Data
-- ==========================================

-- 1. Insert Users (Password: Admin123! for admin, Staff123! for staff)
-- Hash: $2b$10$87wJhZdR68YLHVI502RoAuLdHrVbB6iXjeWXPVTc/oUehcY7Aflkq (Admin123!)
-- Hash: $2b$10$FU5Vci/WNqwAD6PTj.6V.uS1fvq4l8/KcngAbanfYoZPCo4H4/vYC (Staff123!)

INSERT INTO users (id, name, email, password_hash, role) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Admin Director', 'admin@clinicflow.local', '$2b$10$87wJhZdR68YLHVI502RoAuLdHrVbB6iXjeWXPVTc/oUehcY7Aflkq', 'admin'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Dr. Sarah Smith', 'dr.sarah@clinicflow.local', '$2b$10$FU5Vci/WNqwAD6PTj.6V.uS1fvq4l8/KcngAbanfYoZPCo4H4/vYC', 'staff'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Nurse John Doe', 'nurse.john@clinicflow.local', '$2b$10$FU5Vci/WNqwAD6PTj.6V.uS1fvq4l8/KcngAbanfYoZPCo4H4/vYC', 'staff')
ON CONFLICT (email) DO NOTHING;

-- 2. Insert 5 Patients
INSERT INTO patients (id, full_name, cin, phone, birth_date, address) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Amine El Amrani', 'AB123456', '+212612345678', '1988-04-12', '124 Boulevard Mohammed V, Casablanca'),
    ('22222222-2222-2222-2222-222222222222', 'Fatima Zahra Mansouri', 'BK987654', '+212623456789', '1995-09-23', '45 Rue Hassan II, Rabat'),
    ('33333333-3333-3333-3333-333333333333', 'Karim Benjelloun', 'CD456789', '+212634567890', '1976-11-05', '88 Avenue des FAR, Fes'),
    ('44444444-4444-4444-4444-444444444444', 'Yasmine Alami', 'EE112233', '+212645678901', '2001-02-18', '12 Rue Ibn Battouta, Tangier'),
    ('55555555-5555-5555-5555-555555555555', 'Omar Chraibi', 'GH556677', '+212656789012', '1982-07-30', '73 Boulevard Zerktouni, Marrakech')
ON CONFLICT (cin) DO NOTHING;

-- 3. Insert 10 Appointments (mix of pending, confirmed, cancelled)
INSERT INTO appointments (id, patient_id, appointment_date, status, reason, notes, created_by) VALUES
    ('aa111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', CURRENT_TIMESTAMP + INTERVAL '1 hour', 'confirmed', 'Routine Health Checkup', 'Patient requested morning slot', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
    ('aa222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', CURRENT_TIMESTAMP + INTERVAL '3 days', 'pending', 'Follow-up blood test review', 'Check cholesterol levels', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'),
    ('aa333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', CURRENT_TIMESTAMP + INTERVAL '2 hours', 'confirmed', 'Cardiology Consultation', 'ECG required', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
    ('aa444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', CURRENT_TIMESTAMP - INTERVAL '1 day', 'cancelled', 'Migraine Examination', 'Cancelled by patient due to emergency', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'),
    ('aa555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', CURRENT_TIMESTAMP + INTERVAL '4 hours', 'pending', 'Diabetes Management Review', 'Bring glucose logbook', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('aa666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', CURRENT_TIMESTAMP + INTERVAL '1 day', 'confirmed', 'Dietary Consultation', 'First nutritional session', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
    ('aa777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', CURRENT_TIMESTAMP + INTERVAL '5 hours', 'confirmed', 'Dermatology Assessment', 'Skin allergy patch test', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
    ('aa888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', CURRENT_TIMESTAMP - INTERVAL '2 days', 'cancelled', 'General Physical', 'Rescheduled to next month', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'),
    ('aa999999-9999-9999-9999-999999999999', '55555555-5555-5555-5555-555555555555', CURRENT_TIMESTAMP + INTERVAL '30 minutes', 'pending', 'Orthopedic Knee Pain Check', 'Knee discomfort when walking', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('aa000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', CURRENT_TIMESTAMP + INTERVAL '5 days', 'confirmed', 'Follow-up X-Ray Analysis', 'Review MRI and X-ray results', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22')
ON CONFLICT (id) DO NOTHING;
