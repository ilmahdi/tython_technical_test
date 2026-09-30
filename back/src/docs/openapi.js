/**
 * OpenAPI 3.0.3 Specification for ClinicFlow API
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ClinicFlow REST API',
    version: '1.0.0',
    description:
      'Official interactive API documentation for ClinicFlow — Patient & Appointment Management PERN stack application. Enforces layered security, JWT authentication, role guards (admin/staff), database pagination, and a strict 30-minute appointment conflict engine.',
    contact: {
      name: 'ClinicFlow Engineering Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:1314',
      description: 'Local Backend API Server',
    },
    {
      url: 'http://localhost:1313',
      description: 'Frontend Proxied Endpoint (/api)',
    },
  ],
  tags: [
    { name: 'Auth', description: 'User authentication and profile inspection' },
    { name: 'Patients', description: 'Patient dossiers, national IDs (CIN), search, and CRUD' },
    { name: 'Appointments', description: 'Consultation scheduling and 30-minute conflict prevention engine' },
    { name: 'Dashboard', description: 'Clinic capacity and real-time operational KPI metrics' },
    { name: 'Health', description: 'Service health status' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from `/api/auth/login`.',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Resource not found' },
              details: { type: 'array', items: { type: 'object' }, nullable: true },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Dr. Sarah Smith' },
          email: { type: 'string', format: 'email', example: 'dr.sarah@clinicflow.local' },
          role: { type: 'string', enum: ['admin', 'staff'], example: 'staff' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Patient: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string', example: 'Amine El Amrani' },
          cin: { type: 'string', example: 'AB123456' },
          phone: { type: 'string', example: '+212612345678' },
          birthDate: { type: 'string', format: 'date', example: '1988-04-12' },
          address: { type: 'string', example: '124 Boulevard Mohammed V, Casablanca', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Appointment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          patientId: { type: 'string', format: 'uuid' },
          appointmentDate: { type: 'string', format: 'date-time', example: '2026-10-01T10:00:00.000Z' },
          status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'], example: 'confirmed' },
          reason: { type: 'string', example: 'Cardiology Consultation' },
          notes: { type: 'string', example: 'ECG required', nullable: true },
          createdBy: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Check API server health',
        responses: {
          200: {
            description: 'API is healthy and operational',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in with credentials',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@clinicflow.local' },
                  password: { type: 'string', format: 'password', example: 'Admin123!' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful. Returns JWT token and user profile.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error (missing or malformed email/password)' },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current authenticated user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Returns profile details of the currently logged-in user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthenticated or missing/expired JWT token' },
        },
      },
    },
    '/api/patients': {
      get: {
        tags: ['Patients'],
        summary: 'List patients with database pagination & search',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Query against fullName or CIN' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 }, description: 'Items per page' },
        ],
        responses: {
          200: {
            description: 'Paginated list of active patients',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        patients: { type: 'array', items: { $ref: '#/components/schemas/Patient' } },
                        pagination: {
                          type: 'object',
                          properties: {
                            page: { type: 'integer', example: 1 },
                            limit: { type: 'integer', example: 10 },
                            total: { type: 'integer', example: 45 },
                            totalPages: { type: 'integer', example: 5 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Patients'],
        summary: 'Register a new patient',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'cin', 'phone', 'birthDate'],
                properties: {
                  fullName: { type: 'string', example: 'Fatima Zahra Mansouri' },
                  cin: { type: 'string', example: 'BK987654' },
                  phone: { type: 'string', example: '+212623456789' },
                  birthDate: { type: 'string', format: 'date', example: '1995-09-23' },
                  address: { type: 'string', example: '45 Rue Hassan II, Rabat' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Patient registered successfully' },
          400: { description: 'Invalid input or validation error' },
          409: { description: 'Patient with this national CIN already exists' },
        },
      },
    },
    '/api/patients/{id}': {
      get: {
        tags: ['Patients'],
        summary: 'Get patient profile & chronological appointment history',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Returns patient profile and appointment list' },
          404: { description: 'Patient not found' },
        },
      },
      put: {
        tags: ['Patients'],
        summary: 'Update patient dossier',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fullName: { type: 'string' },
                  cin: { type: 'string' },
                  phone: { type: 'string' },
                  birthDate: { type: 'string', format: 'date' },
                  address: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Patient updated successfully' },
          404: { description: 'Patient not found' },
          409: { description: 'CIN already registered by another patient' },
        },
      },
      delete: {
        tags: ['Patients'],
        summary: 'Soft-delete a patient (Admin Only)',
        description: 'Restricted to users with role "admin". Performs soft-deletion by setting deleted_at.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Patient deleted successfully' },
          403: { description: 'Forbidden: Admin access required' },
          404: { description: 'Patient not found' },
        },
      },
    },
    '/api/appointments': {
      get: {
        tags: ['Appointments'],
        summary: 'List appointments with date & status filters',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Filter by date (YYYY-MM-DD)' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'] } },
        ],
        responses: {
          200: { description: 'Filtered appointments list' },
        },
      },
      post: {
        tags: ['Appointments'],
        summary: 'Schedule a new appointment (Enforces 30-Minute Conflict Engine)',
        description:
          'Enforces the critical 30-minute business rule: A patient cannot have two confirmed appointments within ±30 minutes. Protected against race conditions using row-level database transactions.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['patientId', 'appointmentDate', 'reason'],
                properties: {
                  patientId: { type: 'string', format: 'uuid' },
                  appointmentDate: { type: 'string', format: 'date-time', example: '2026-10-02T14:00:00.000Z' },
                  status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
                  reason: { type: 'string', example: 'Dermatology consultation' },
                  notes: { type: 'string', example: 'Patch test required' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Appointment scheduled successfully' },
          400: { description: 'Validation error' },
          404: { description: 'Patient not found' },
          409: { description: 'Conflict: Patient already has a confirmed appointment within 30 minutes' },
        },
      },
    },
    '/api/appointments/{id}/status': {
      patch: {
        tags: ['Appointments'],
        summary: 'Update appointment status (30-Minute Rule Guarded)',
        description: 'When transitioning to "confirmed", the 30-minute window conflict check is automatically evaluated.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Status updated successfully' },
          404: { description: 'Appointment not found' },
          409: { description: 'Conflict: Cannot confirm appointment due to 30-minute scheduling collision' },
        },
      },
    },
    '/api/dashboard/stats': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get real-time clinic KPI statistics',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Returns the 4 core clinic KPIs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        totalPatients: { type: 'integer', example: 29 },
                        todayAppointments: { type: 'integer', example: 5 },
                        pendingAppointments: { type: 'integer', example: 7 },
                        confirmedAppointments: { type: 'integer', example: 42 },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
  },
};
