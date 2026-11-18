/**
 * BD22 FIRE SYSTEM & BUILDERS INC.
 * Core State & Supabase Cloud Integration Layer
 * 100% Serverless Architecture — No Local XAMPP/PHP Runtime Required
 */

function formatDate(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

const BD22_DB = {
  _syncInterval: null,
  _realtimeChannel: null,
  _isSyncing: false,
  _isInitializing: false,
  adminDashboardStats: {},

  _getRaw(key) {
    try {
      const data = localStorage.getItem(`bd22_${key}`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  // Initialize clean data structures in localStorage
  init() {
    if (this._isInitializing) return;
    this._isInitializing = true;

    try {
      const CURRENT_VERSION = '5.0-billing-reconciled';
      if (localStorage.getItem('bd22_db_version') !== CURRENT_VERSION) {
        // Safe upgrade: preserve any existing user records (like 'Springkler' project)
        const existingProjects = this._getRaw('projects');
        const existingInquiries = this._getRaw('inquiries');
        const existingSR = this._getRaw('serviceRequests');
        const existingPayments = this._getRaw('payments');

        localStorage.setItem('bd22_db_version', CURRENT_VERSION);

        if (existingProjects.length > 0) this.set('projects', existingProjects);
        if (existingInquiries.length > 0) this.set('inquiries', existingInquiries);
        if (existingSR.length > 0) this.set('serviceRequests', existingSR);
        if (existingPayments.length > 0) this.set('payments', existingPayments);
      }

      if (!localStorage.getItem('bd22_initialized')) {
      const initialData = {
        inquiries: [],
        serviceRequests: [],
        projects: [
          {
            id: 'BD22-PRJ-2026-001',
            project_code: 'BD22-PRJ-2026-001',
            name: 'Apex Facility Fire Riser Retrofit',
            customer: 'Apex Testing Solutions Ltd.',
            customer_name: 'Apex Testing Solutions Ltd.',
            user_id: null,
            team: 'Team Alpha (Operations)',
            assigned_team: 'Team Alpha (Operations)',
            manager: 'Engr. M. Velasco',
            project_manager: 'Engr. M. Velasco',
            startDate: 'Aug 10, 2026',
            start_date: '2026-08-10',
            targetDate: 'Dec 17, 2026',
            target_date: '2026-12-17',
            actualCompletionDate: 'Dec 15, 2026',
            actual_completion_date: '2026-12-15',
            progress: 100,
            status: 'Completed',
            priority: 'Standard',
            budget: 450000,
            description: 'Full retrofit and pressure upgrading of 4-inch fire sprinkler riser piping and check valve assemblies across 4 warehouse levels.',
            milestones: 'Phase 1 Survey, Phase 2 Pipe Fabrication, Phase 3 BFP Hydro-test, and Final Commissioning.',
            tasks: [
              { id: 't1', title: 'Engineering site survey & hydraulic calcs', description: 'Hydraulic calculations and site mapping', deadline: 'Aug 25, 2026', status: 'Completed', completed: true },
              { id: 't2', title: 'BFP permit submission and approval', description: 'Permit application with local fire bureau', deadline: 'Sep 15, 2026', status: 'Completed', completed: true },
              { id: 't3', title: 'Riser pipe installation & check valves', description: 'Installation of 4-inch black steel schedule 40 piping', deadline: 'Nov 10, 2026', status: 'Completed', completed: true },
              { id: 't4', title: 'Hydrostatic pressure test & certification', description: '200 PSI hydrostatic pressure test and BFP sign-off', deadline: 'Dec 15, 2026', status: 'Completed', completed: true }
            ],
            notes: 'System turnover complete. BFP compliance inspection passed with zero non-conformances.',
            attachments: [],
            linkedInvoice: 'BD22-INV-2026-001'
          },
          {
            id: 'BD22-PRJ-2026-002',
            project_code: 'BD22-PRJ-2026-002',
            name: 'Central Tower Alarm Upgrade',
            customer: 'Meridian Property Group',
            customer_name: 'Meridian Property Group',
            user_id: null,
            team: 'Team Beta (Suppression)',
            assigned_team: 'Team Beta (Suppression)',
            manager: 'Engr. J. Ramos',
            project_manager: 'Engr. J. Ramos',
            startDate: 'Sep 01, 2026',
            start_date: '2026-09-01',
            targetDate: 'Oct 15, 2026',
            target_date: '2026-10-15',
            actualCompletionDate: '',
            actual_completion_date: null,
            progress: 90,
            status: 'In Progress',
            priority: 'Standard',
            budget: 280000,
            description: 'Commercial high-rise addressable fire alarm panel replacement, installation of multi-criteria smoke detectors, and BFP integration test.',
            milestones: 'Milestone 4 of 4: Final BFP inspection run and smoke detection verification.',
            tasks: [
              { id: 't1', title: 'Addressable control panel mounting', description: 'Mounting and power supply installation', deadline: 'Sep 10, 2026', status: 'Completed', completed: true },
              { id: 't2', title: 'Optical detector loop wiring (Floors 1-12)', description: 'Loop wiring and end-of-line resistors', deadline: 'Sep 28, 2026', status: 'Completed', completed: true },
              { id: 't3', title: 'Strobe horn annunciator calibration', description: 'Sound decibel level testing and strobe sync', deadline: 'Oct 05, 2026', status: 'Completed', completed: true },
              { id: 't4', title: 'Final BFP mock inspection & turn-over', description: 'Joint testing with BFP inspectors', deadline: 'Oct 15, 2026', status: 'In Progress', completed: false }
            ],
            notes: 'Loop 2 smoke sensors verified. Final BFP testing scheduled for next week.',
            attachments: [],
            linkedInvoice: 'BD22-INV-2026-002'
          }
        ],
        payments: [
          {
            id: 'BD22-INV-2026-001',
            invoice: 'BD22-INV-2026-001',
            invoice_no: 'BD22-INV-2026-001',
            project: 'Apex Facility Fire Riser Retrofit',
            project_name: 'Apex Facility Fire Riser Retrofit',
            project_id: 'BD22-PRJ-2026-001',
            project_code: 'BD22-PRJ-2026-001',
            customer: 'Apex Testing Solutions Ltd.',
            customer_name: 'Apex Testing Solutions Ltd.',
            user_id: null,
            amount: 450000,
            amount_paid: 450000,
            balance: 0,
            dueDate: 'Dec 17, 2026',
            due_date: '2026-12-17',
            invoiceDate: 'Aug 10, 2026',
            invoice_date: '2026-08-10',
            status: 'Paid',
            method_used: 'BDO Unibank Online Transfer',
            payment_reference: 'TR-BDO-992144',
            payment_history: [
              { date: 'Aug 15, 2026', amount: 225000, method: 'BDO Unibank Online Transfer', reference: 'TR-BDO-88102', notes: '50% Mobilization Downpayment', confirmed_by: 'Admin Operations', confirmed_at: '2026-08-15T10:00:00Z' },
              { date: 'Dec 16, 2026', amount: 225000, method: 'BDO Unibank Online Transfer', reference: 'TR-BDO-992144', notes: 'Final Turnover Settlement', confirmed_by: 'Admin Operations', confirmed_at: '2026-12-16T14:30:00Z' }
            ],
            billing_notes: 'Full contract settlement received. Official receipt issued.'
          },
          {
            id: 'BD22-INV-2026-002',
            invoice: 'BD22-INV-2026-002',
            invoice_no: 'BD22-INV-2026-002',
            project: 'Central Tower Alarm Upgrade',
            project_name: 'Central Tower Alarm Upgrade',
            project_id: 'BD22-PRJ-2026-002',
            project_code: 'BD22-PRJ-2026-002',
            customer: 'Meridian Property Group',
            customer_name: 'Meridian Property Group',
            user_id: null,
            amount: 280000,
            amount_paid: 140000,
            balance: 140000,
            dueDate: 'Oct 15, 2026',
            due_date: '2026-10-15',
            invoiceDate: 'Sep 01, 2026',
            invoice_date: '2026-09-01',
            status: 'Partial',
            method_used: 'BPI Corporate Direct Deposit',
            payment_reference: 'BPI-DEP-44910',
            payment_history: [
              { date: 'Sep 05, 2026', amount: 140000, method: 'BPI Corporate Direct Deposit', reference: 'BPI-DEP-44910', notes: '50% Advance Downpayment', confirmed_by: 'Admin Operations', confirmed_at: '2026-09-05T09:15:00Z' }
            ],
            billing_notes: 'Remaining 50% balance payable upon final BFP certification.'
          }
        ],
        registeredCustomers: [],
        inventory: [],
        warranties: [],
        maintenance: [],
        serviceHistory: [],
        customerMessages: [],
        adminNotifications: [],
        currentUser: null,
        adminProfile: {
          name: 'BD22 Operations',
          firstName: 'Operations',
          lastName: 'Manager',
          phone: '+63 917 555 0199',
          email: 'admin@bd22fire.com',
          createdDate: 'August 1, 2026',
          role: 'ADMIN'
        }
      };

      for (const [key, value] of Object.entries(initialData)) {
        if (localStorage.getItem(`bd22_${key}`) === null) {
          localStorage.setItem(`bd22_${key}`, JSON.stringify(value));
        }
      }
      localStorage.setItem('bd22_initialized', 'true');
    }

    // Always run project and billing synchronization & reconciliation
    this.reconcileProjectsAndPayments();
    } finally {
      this._isInitializing = false;
    }
  },

  // Clear all cached user session data
  clearUserData() {
    const userKeys = [
      'currentUser', 'inquiries', 'serviceRequests', 'projects',
      'payments', 'warranties', 'maintenance', 'serviceHistory',
      'customerMessages', 'adminNotifications', 'inventory', 'registeredCustomers',
      'registeredUserCount'
    ];
    userKeys.forEach(k => {
      localStorage.removeItem(`bd22_${k}`);
    });
    localStorage.removeItem('bd22_role');
    localStorage.removeItem('bd22_initialized');
  },

  get(key) {
    this.init();
    const data = localStorage.getItem(`bd22_${key}`);
    try {
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  set(key, val) {
    localStorage.setItem(`bd22_${key}`, JSON.stringify(val));
  },

  // Authoritative Synchronization with Supabase PostgreSQL
  async sync() {
    if (!window.supabaseClient) {
      console.warn('Supabase client not yet initialized.');
      return;
    }
    if (this._isSyncing) return;
    this._isSyncing = true;

    try {
      // 1. Get current Supabase Auth session
      const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
      const isPortalPage = window.location.pathname.includes('customer-portal.html') || window.location.pathname.includes('admin.html');

      if (!session || !session.user) {
        if (isPortalPage) {
          this.clearUserData();
          window.location.href = 'login.html';
          return;
        }
        this.set('currentUser', null);
        window.dispatchEvent(new CustomEvent('bd22_synced'));
        return;
      }

      // 2. Fetch User Profile from public.profiles
      const { data: profile, error: profileErr } = await window.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const userRole = profile?.role || session.user.user_metadata?.role || 'customer';
      const userFullName = profile?.full_name || session.user.user_metadata?.full_name || session.user.email.split('@')[0];
      const userCompany = profile?.company || session.user.user_metadata?.company || 'Facility Operations';
      const userPhone = profile?.phone || session.user.user_metadata?.phone || '';

      const currentUser = {
        id: session.user.id,
        role: userRole,
        email: profile?.email || session.user.email,
        full_name: userFullName,
        name: userFullName,
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        company: userCompany,
        phone: userPhone,
        pref_sms: profile?.pref_sms ?? true,
        pref_email: profile?.pref_email ?? true,
        pref_warranty: profile?.pref_warranty ?? true
      };

      const prevUser = this.get('currentUser');
      if (prevUser && prevUser.id && prevUser.id !== currentUser.id) {
        this.set('currentUser', currentUser);
      } else {
        this.set('currentUser', currentUser);
      }

      // 3. Security Role Gate
      if (window.location.pathname.includes('admin.html') && userRole !== 'admin') {
        window.location.href = 'customer-portal.html';
        return;
      }

      // Admin Profile Setup
      if (userRole === 'admin') {
        const nameParts = userFullName.split(' ');
        this.set('adminProfile', {
          name: userFullName,
          firstName: profile?.first_name || nameParts[0] || 'Admin',
          lastName: profile?.last_name || nameParts.slice(1).join(' ') || 'Operations',
          phone: userPhone || '+63 917 555 0199',
          email: profile?.email || session.user.email,
          createdDate: formatDate(profile?.created_at || session.user.created_at),
          role: 'ADMIN'
        });
      }

      // 4. Fetch Core Business Data via Supabase Client (Protected by PostgreSQL RLS)
      const [
        { data: inqRows },
        { data: srRows },
        { data: projRows },
        { data: payRows },
        { data: warrRows },
        { data: maintRows },
        { data: histRows }
      ] = await Promise.all([
        window.supabaseClient.from('inquiries').select('*').order('id', { ascending: false }),
        window.supabaseClient.from('service_requests').select('*').order('id', { ascending: false }),
        window.supabaseClient.from('projects').select('*').order('id', { ascending: false }),
        window.supabaseClient.from('payments').select('*').order('id', { ascending: false }),
        window.supabaseClient.from('warranties').select('*').order('id', { ascending: true }),
        window.supabaseClient.from('maintenance_schedules').select('*').order('scheduled_date', { ascending: true }),
        window.supabaseClient.from('service_history').select('*').order('service_date', { ascending: false })
      ]);

      // Map inquiries
      if (inqRows && Array.isArray(inqRows)) {
        const mappedInquiries = inqRows.map(r => {
          let meta = {};
          if (r.tracking_note && (r.tracking_note.startsWith('{') || r.tracking_note.startsWith('['))) {
            try {
              meta = JSON.parse(r.tracking_note);
            } catch (e) {}
          }
          return {
            ...meta,
            ...r,
            user_id: r.auth_user_id || r.user_id || null,
            reference: r.reference_no,
            customer: r.customer_name,
            service: r.service_name,
            assignedStaff: r.assigned_staff || 'Awaiting Staff Assignment',
            trackingNote: r.tracking_note || '',
            dateSubmitted: formatDate(r.created_at),
            lastUpdate: formatDate(r.last_update || r.created_at)
          };
        });
        const currentLocalInq = this.get('inquiries') || [];
        const remoteInqRefs = new Set(mappedInquiries.map(r => r.reference || r.reference_no));
        const uncommittedLocalInq = currentLocalInq.filter(r => !remoteInqRefs.has(r.reference || r.reference_no));
        this.set('inquiries', [...uncommittedLocalInq, ...mappedInquiries]);
      }

      // Map service requests
      if (srRows && Array.isArray(srRows)) {
        const mappedSr = srRows.map(r => {
          let meta = {};
          if (r.notes && (r.notes.startsWith('{') || r.notes.startsWith('['))) {
            try {
              meta = JSON.parse(r.notes);
            } catch (e) {
              meta = { description: r.notes };
            }
          } else {
            meta = { description: r.notes || '' };
          }

          const status = r.status || meta.extended_status || 'Pending Review';

          return {
            ...r,
            reference: r.reference_no,
            customer: r.customer_name,
            service: r.service_type,
            status: status,
            urgency: meta.urgency || r.urgency || 'Standard',
            establishment_name: r.establishment_name || meta.establishment_name || 'Site Facility',
            building_type: r.building_type || meta.building_type || 'Commercial Office',
            floors: r.floors || meta.floors || 'Standard Multi-Floor',
            site_address: r.site_address || meta.site_address || 'Facility Site Location',
            google_maps_link: r.google_maps_link || meta.google_maps_link || '',
            contact_name: r.contact_name || meta.contact_name || r.customer_name,
            contact_phone: r.contact_phone || meta.contact_phone || '',
            contact_email: r.contact_email || meta.contact_email || '',
            contact_position: r.contact_position || meta.contact_position || 'Site Coordinator',
            description: r.description || meta.description || r.notes || '',
            preferred_timeline: r.preferred_timeline || meta.preferred_timeline || '',
            preferred_date: r.preferred_date ? formatDate(r.preferred_date) : (meta.preferred_date || ''),
            additional_concerns: r.additional_concerns || meta.additional_concerns || '',
            attachments: r.attachments || meta.attachments || [],
            confirmed_schedule: r.scheduled_date ? formatDate(r.scheduled_date) : (meta.confirmed_schedule || ''),
            quotation_amount: Number(r.quotation_amount || meta.quotation_amount || 0),
            assessment_notes: r.assessment_notes || meta.assessment_notes || '',
            assignedStaff: r.assigned_staff || 'Awaiting Staff Assignment',
            dateSubmitted: formatDate(r.created_at),
            lastUpdate: formatDate(r.last_update || r.created_at)
          };
        });
        const currentLocalSr = this.get('serviceRequests') || [];
        const remoteSrRefs = new Set(mappedSr.map(r => r.reference || r.reference_no));
        const uncommittedLocalSr = currentLocalSr.filter(r => !remoteSrRefs.has(r.reference || r.reference_no));
        this.set('serviceRequests', [...uncommittedLocalSr, ...mappedSr]);

        // Keep inquiries in sync with all service requests so all user inputs exist in both views
        const mergedInqsMap = new Map();
        (this.get('inquiries') || []).forEach(inq => {
          const ref = inq.reference || inq.reference_no;
          if (ref) mergedInqsMap.set(ref, inq);
        });
        (this.get('serviceRequests') || []).forEach(sr => {
          const ref = sr.reference || sr.reference_no;
          if (ref) {
            if (mergedInqsMap.has(ref)) {
              const inquiry = mergedInqsMap.get(ref);
              mergedInqsMap.set(ref, {
                ...inquiry,
                ...sr,
                user_id: sr.user_id || inquiry.user_id || null,
                submission_source: inquiry.submission_source && inquiry.submission_source !== 'legacy_unknown'
                  ? inquiry.submission_source
                  : (sr.submission_source || inquiry.submission_source || 'legacy_unknown')
              });
            } else {
              mergedInqsMap.set(ref, sr);
            }
          }
        });
        this.set('inquiries', Array.from(mergedInqsMap.values()));
      }

      // Map projects
      if (projRows && Array.isArray(projRows)) {
        const mappedProjects = projRows.map(r => {
          let tasks = [];
          if (r.tasks) {
            try { tasks = typeof r.tasks === 'string' ? JSON.parse(r.tasks) : r.tasks; } catch(e){ tasks = []; }
          }
          let attachments = [];
          if (r.attachments) {
            try { attachments = typeof r.attachments === 'string' ? JSON.parse(r.attachments) : r.attachments; } catch(e){ attachments = []; }
          }

          return {
            ...r,
            db_id: r.id,
            id: r.project_code || ('proj-' + r.id),
            project_code: r.project_code || ('proj-' + r.id),
            customer: r.customer_name,
            customer_name: r.customer_name,
            team: r.assigned_team || 'Team Alpha (Operations)',
            assigned_team: r.assigned_team || 'Team Alpha (Operations)',
            manager: r.project_manager || 'Engr. M. Velasco',
            project_manager: r.project_manager || 'Engr. M. Velasco',
            startDate: r.start_date ? formatDate(r.start_date) : '',
            start_date: r.start_date || '',
            targetDate: r.target_date ? formatDate(r.target_date) : '',
            target_date: r.target_date || '',
            actualCompletionDate: r.actual_completion_date ? formatDate(r.actual_completion_date) : '',
            actual_completion_date: r.actual_completion_date || '',
            priority: r.priority || 'Medium',
            budget: Number(r.budget) || 0,
            progress: Number(r.progress) || 0,
            status: r.status || 'Not Started',
            payment_status: r.payment_status || 'Unpaid',
            paymentStatus: r.payment_status || 'Unpaid',
            linkedInvoice: r.linked_invoice || '',
            linked_invoice: r.linked_invoice || '',
            tasks: Array.isArray(tasks) ? tasks : [],
            attachments: Array.isArray(attachments) ? attachments : [],
            notes: r.notes || '',
            milestones: r.milestones || ''
          };
        });

        const currentLocalProjects = this.get('projects') || [];
        const remoteProjCodes = new Set(mappedProjects.map(p => p.project_code || p.id));
        const uncommittedProj = currentLocalProjects.filter(p => !remoteProjCodes.has(p.project_code || p.id));
        const combinedProj = [...uncommittedProj, ...mappedProjects];

        // Isolate customer views: customers only see their assigned projects
        if (userRole === 'customer') {
          const cId = (currentUser.id || '').toLowerCase().trim();
          const cEmail = (currentUser.email || '').toLowerCase().trim();
          const cName = (currentUser.full_name || currentUser.name || '').toLowerCase().trim();
          const cComp = (currentUser.company || '').toLowerCase().trim();

          const userProj = combinedProj.filter(p => {
            const pUid = (p.user_id || '').toLowerCase().trim();
            if (pUid && cId && pUid === cId) return true;

            const pCust = (p.customer || p.customer_name || '').toLowerCase().trim();
            if (!pCust) return false;

            if (cEmail && (pCust === cEmail || pCust.includes(cEmail))) return true;
            if (cComp && cComp !== 'facility operations' && pCust === cComp) return true;

            if (cName && cName.length > 3) {
              if (pCust === cName || pCust.includes(cName)) return true;
            } else if (cName) {
              const nameRegex = new RegExp(`\\b${cName}\\b`, 'i');
              if (nameRegex.test(pCust)) return true;
            }

            return false;
          });
          this.set('projects', userProj);
        } else {
          this.set('projects', combinedProj);
        }
      }

      // Map payments (Client Invoices)
      if (payRows && Array.isArray(payRows)) {
        const mappedPayments = payRows.map(r => {
          let history = [];
          if (r.payment_history) {
            try { history = typeof r.payment_history === 'string' ? JSON.parse(r.payment_history) : r.payment_history; } catch(e){ history = []; }
          }
          const amt = Number(r.amount) || 0;
          const rawStatus = r.status || 'Pending';
          let calcStatus = rawStatus === 'Pending' ? 'Unpaid' : rawStatus;
          const paid = Array.isArray(history) && history.length > 0
            ? history.reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0)
            : Number(r.amount_paid !== undefined && r.amount_paid !== null ? r.amount_paid : (calcStatus === 'Paid' ? amt : 0));
          const totalCents = Math.max(0, Math.round(amt * 100));
          const paidCents = Math.max(0, Math.round(paid * 100));
          const balanceCents = Math.max(0, totalCents - paidCents);
          const bal = balanceCents / 100;

          if (totalCents > 0) {
            if (paidCents >= totalCents) calcStatus = 'Paid';
            else if (paidCents > 0) calcStatus = 'Partial';
            else calcStatus = 'Unpaid';
          }

          return {
            ...r,
            id: r.invoice_no || ('inv-' + r.id),
            invoice: r.invoice_no,
            invoice_no: r.invoice_no,
            project: r.project_name || 'Fire Safety Compliance Service',
            project_name: r.project_name || 'Fire Safety Compliance Service',
            project_id: r.project_id || null,
            project_code: r.project_code || '',
            projectCode: r.project_code || '',
            customer: r.customer_name,
            customer_name: r.customer_name,
            user_id: r.user_id || null,
            assignedStaff: 'Operations Accounting',
            amount: amt,
            amount_paid: paid,
            balance: bal,
            dueDate: r.due_date ? formatDate(r.due_date) : '',
            due_date: r.due_date || '',
            invoiceDate: r.invoice_date ? formatDate(r.invoice_date) : formatDate(r.created_at),
            invoice_date: r.invoice_date || '',
            lastUpdate: formatDate(r.last_update || r.created_at),
            status: calcStatus,
            payment_history: Array.isArray(history) ? history : [],
            billing_notes: r.billing_notes || ''
          };
        });

        const currentLocalPayments = this.get('payments') || [];
        const remoteInvNos = new Set(mappedPayments.map(p => p.invoice || p.invoice_no));
        const uncommittedPay = currentLocalPayments.filter(p => !remoteInvNos.has(p.invoice || p.invoice_no));
        const combinedPayments = [...uncommittedPay, ...mappedPayments];

        // Isolate customer views: customers only see invoices assigned to their account
        if (userRole === 'customer') {
          const cId = (currentUser.id || '').toLowerCase().trim();
          const cEmail = (currentUser.email || '').toLowerCase().trim();
          const cName = (currentUser.full_name || currentUser.name || '').toLowerCase().trim();
          const cComp = (currentUser.company || '').toLowerCase().trim();

          const userPayments = combinedPayments.filter(p => {
            const pUid = (p.user_id || '').toLowerCase().trim();
            if (pUid && cId && pUid === cId) return true;

            const pCust = (p.customer || p.customer_name || '').toLowerCase().trim();
            if (!pCust) return false;

            if (cEmail && (pCust === cEmail || pCust.includes(cEmail))) return true;
            if (cComp && cComp !== 'facility operations' && pCust === cComp) return true;

            if (cName && cName.length > 3) {
              if (pCust === cName || pCust.includes(cName)) return true;
            } else if (cName) {
              const nameRegex = new RegExp(`\\b${cName}\\b`, 'i');
              if (nameRegex.test(pCust)) return true;
            }

            return false;
          });
          this.set('payments', userPayments);
        } else {
          this.set('payments', combinedPayments);
        }
      }

      // Map warranties
      if (warrRows) {
        const today = new Date();
        const mappedWarr = warrRows.map(r => {
          let calcStatus = r.status || 'Active';
          if (r.expiry_date) {
            const exp = new Date(r.expiry_date);
            const daysLeft = (exp - today) / (1000 * 60 * 60 * 24);
            if (daysLeft < 0) calcStatus = 'Expired';
            else if (daysLeft <= 60) calcStatus = 'Expiring Soon';
          }
          return {
            ...r,
            ref: r.warranty_code,
            title: r.system_covered || 'Fire Protection System',
            customer: r.customer_name,
            customer_name: r.customer_name,
            systemCovered: r.system_covered,
            system_covered: r.system_covered,
            coverage: r.coverage_summary || '1-Year Comprehensive Fire Protection System Warranty',
            coverage_summary: r.coverage_summary || '1-Year Comprehensive Fire Protection System Warranty',
            installDate: formatDate(r.install_date),
            install_date: r.install_date,
            expiryDate: formatDate(r.expiry_date),
            expiry_date: r.expiry_date,
            status: calcStatus
          };
        });

        if (userRole === 'customer') {
          const cId = (currentUser.id || '').toLowerCase().trim();
          const cEmail = (currentUser.email || '').toLowerCase().trim();
          const cName = (currentUser.full_name || currentUser.name || '').toLowerCase().trim();
          const cComp = (currentUser.company || '').toLowerCase().trim();

          const userWarr = mappedWarr.filter(w => {
            const wUid = (w.user_id || '').toLowerCase().trim();
            if (wUid && cId && wUid === cId) return true;
            const wCust = (w.customer || w.customer_name || '').toLowerCase().trim();
            if (!wCust) return false;
            if (cEmail && (wCust === cEmail || wCust.includes(cEmail))) return true;
            if (cComp && cComp !== 'facility operations' && (wCust === cComp || wCust.includes(cComp))) return true;
            if (cName && (wCust === cName || wCust.includes(cName))) return true;
            return false;
          });
          this.set('warranties', userWarr);
        } else {
          this.set('warranties', mappedWarr);
        }
      }

      // Map maintenance
      if (maintRows) {
        const mappedMaint = maintRows.map(r => ({
          ...r,
          id: r.maintenance_code,
          maintenance_code: r.maintenance_code,
          title: r.service_type || 'Preventive Maintenance',
          customer: r.customer_name,
          customer_name: r.customer_name,
          service: r.service_type,
          service_type: r.service_type,
          technician: r.technician || 'Engineering Team',
          scheduledDate: formatDate(r.scheduled_date),
          scheduled_date: r.scheduled_date
        }));

        if (userRole === 'customer') {
          const cId = (currentUser.id || '').toLowerCase().trim();
          const cEmail = (currentUser.email || '').toLowerCase().trim();
          const cName = (currentUser.full_name || currentUser.name || '').toLowerCase().trim();
          const cComp = (currentUser.company || '').toLowerCase().trim();

          const userMaint = mappedMaint.filter(m => {
            const mUid = (m.user_id || '').toLowerCase().trim();
            if (mUid && cId && mUid === cId) return true;
            const mCust = (m.customer || m.customer_name || '').toLowerCase().trim();
            if (!mCust) return false;
            if (cEmail && (mCust === cEmail || mCust.includes(cEmail))) return true;
            if (cComp && cComp !== 'facility operations' && (mCust === cComp || mCust.includes(cComp))) return true;
            if (cName && (mCust === cName || mCust.includes(cName))) return true;
            return false;
          });
          this.set('maintenance', userMaint);
        } else {
          this.set('maintenance', mappedMaint);
        }
      }

      // Map service history
      if (histRows) {
        const mappedHist = histRows.map(r => ({
          ...r,
          title: r.title || r.activity_type || 'Service Inspection',
          description: r.description || 'System inspection and service logged.',
          badge: r.badge || 'Completed',
          date: formatDate(r.service_date),
          service_date: r.service_date,
          performedBy: r.logged_by || 'Admin Operations',
          loggedBy: r.logged_by || 'Admin Operations',
          eventType: r.activity_type,
          activityType: r.activity_type
        }));
        this.set('serviceHistory', mappedHist);
      }

      // Role-specific notifications and messages
      if (userRole === 'admin') {
        const today = new Date().toISOString().slice(0, 10);
        const [
          { data: notifRows },
          { data: invRows },
          { data: profileRows },
          inquiryCountResult,
          projectCountResult,
          userCountResult,
          warrantyCountResult,
          maintenanceCountResult,
          inventoryCountResult
        ] = await Promise.all([
          window.supabaseClient.from('admin_notifications').select('*').order('id', { ascending: false }),
          window.supabaseClient.from('inventory_items').select('*').order('id', { ascending: true }),
          window.supabaseClient.from('profiles').select('id, full_name, email, company, role'),
          window.supabaseClient.from('inquiries').select('id', { count: 'exact', head: true }),
          window.supabaseClient.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'In Progress'),
          window.supabaseClient.from('profiles').select('id', { count: 'exact', head: true }),
          window.supabaseClient.from('warranties').select('id', { count: 'exact', head: true })
            .eq('status', 'Active').or(`expiry_date.is.null,expiry_date.gte.${today}`),
          window.supabaseClient.from('maintenance_schedules').select('id', { count: 'exact', head: true })
            .in('status', ['Due', 'Overdue']),
          window.supabaseClient.from('inventory_items').select('id', { count: 'exact', head: true })
        ]);

        if (profileRows) {
          this.set('registeredCustomers', profileRows.filter(profile => profile.role === 'customer'));
        }

        const dashboardMetricResults = {
          inquiries: inquiryCountResult,
          projects: projectCountResult,
          users: userCountResult,
          warranties: warrantyCountResult,
          maintenance: maintenanceCountResult,
          inventory: inventoryCountResult
        };
        const dashboardStats = {};
        Object.entries(dashboardMetricResults).forEach(([metric, result]) => {
          if (result.error) {
            console.error(`Unable to load admin dashboard ${metric} count from Supabase:`, result.error);
            dashboardStats[metric] = null;
          } else {
            dashboardStats[metric] = result.count ?? 0;
          }
        });
        this.adminDashboardStats = dashboardStats;

        if (notifRows) {
          const mappedNotifs = notifRows.map(r => ({
            ...r,
            time: formatDate(r.created_at)
          }));
          this.set('adminNotifications', mappedNotifs);
        }

        if (invRows) {
          const mappedInv = invRows.map(r => ({
            ...r,
            id: r.item_code,
            type: r.item_type,
            customerProject: r.customer_project,
            serviceStatus: r.service_status,
            nextMaintenance: r.next_maintenance,
            stockStatus: (Number(r.quantity) <= 2) ? 'Low Stock' : 'Available'
          }));
          this.set('inventory', mappedInv);
        }
      } else {
        const { data: msgRows } = await window.supabaseClient
          .from('customer_messages')
          .select('*')
          .order('id', { ascending: false });

        if (msgRows) {
          const mappedMsgs = msgRows.map(r => ({
            ...r,
            date: formatDate(r.created_at),
            read: !!r.is_read
          }));
          this.set('customerMessages', mappedMsgs);
        }
      }

      // Reconcile projects and invoices on every sync
      this.reconcileProjectsAndPayments();

      // Dispatch UI update event
      window.dispatchEvent(new CustomEvent('bd22_synced'));
    } catch (err) {
      console.error('Supabase database sync error:', err);
      window.dispatchEvent(new CustomEvent('bd22_synced'));
    } finally {
      this._isSyncing = false;
    }
  },

  // Setup Supabase Realtime Channels for Instant Sync
  setupRealtime() {
    if (this._realtimeChannel || !window.supabaseClient) return;

    try {
      this._realtimeChannel = window.supabaseClient
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          this.sync();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('BD22 Realtime Synchronization Active.');
          }
        });
    } catch (e) {
      console.warn('Realtime channel setup notice:', e);
    }
  },

  // Setup Cross-Window Storage Event Synchronizer
  setupStorageSync() {
    if (this._storageSyncActive) return;
    this._storageSyncActive = true;
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('bd22_')) {
        this.sync();
      }
    });
  },

  // Fallback Polling Loop
  startAutoSync(intervalMs = 10000) {
    if (this._syncInterval) clearInterval(this._syncInterval);
    this._syncInterval = setInterval(() => {
      this.sync();
    }, intervalMs);
    this.setupRealtime();
    this.setupStorageSync();
  },

  // 1. Submit Inquiry (Universal: Guests & Authenticated Customers)
  async addInquiry(newRecord) {
    if (!window.supabaseClient) {
      throw new Error('Inquiry service is unavailable.');
    }

    const payload = {
      customer_name: newRecord.customer || newRecord.customer_name || 'Guest Visitor',
      email: newRecord.email,
      phone: newRecord.phone || '',
      service_name: newRecord.service || newRecord.service_name || 'General Inquiry',
      message: newRecord.message || ''
    };

    const { data, error } = await window.supabaseClient
      .rpc('submit_public_inquiry', payload);

    if (error) {
      console.error('Error submitting inquiry to Supabase:', error);
      throw new Error(error.message || 'Inquiry submission failed.');
    }

    const finalRef = data?.reference_no;
    if (typeof finalRef !== 'string' || !finalRef.trim()) {
      throw new Error('Inquiry was saved without a reference number.');
    }

    await this.sync();
    return finalRef.trim();
  },

  // Reference generator for Service Requests: BD22-REQ-YYYY-NNN
  generateServiceRequestRef() {
    const year = new Date().getFullYear();
    const existing = this.get('serviceRequests') || [];
    const prefix = `BD22-REQ-${year}-`;
    let maxNum = 0;
    existing.forEach(r => {
      const ref = r.reference || r.reference_no || '';
      if (ref.startsWith(prefix)) {
        const numPart = parseInt(ref.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
      }
    });
    // If local array is fresh or has 0 items, use a random 4-digit code to prevent collisions
    if (maxNum === 0) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      return `${prefix}${rand}`;
    }
    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  },

  // 2. Submit Comprehensive Service Request (5 Sections)
  async addServiceRequest(reqData) {
    const refCode = reqData.reference || this.generateServiceRequestRef();
    const user = this.get('currentUser') || {};
    const customerDisplayName = user.full_name || user.name || reqData.customer_name || reqData.customer || reqData.contact_name || (user.email ? user.email.split('@')[0] : 'Valued Customer');
    
    // Structured JSON metadata packing all 5 sections
    const metaPayload = {
      establishment_name: reqData.establishment_name || reqData.establishmentName || 'Site Facility',
      building_type: reqData.building_type || reqData.buildingType || 'Commercial',
      floors: reqData.floors || 'Standard',
      site_address: reqData.site_address || reqData.siteAddress || '',
      google_maps_link: reqData.google_maps_link || reqData.mapsLink || '',
      contact_name: reqData.contact_name || reqData.contactName || (user.full_name || 'Site Contact'),
      contact_phone: reqData.contact_phone || reqData.contactPhone || '',
      contact_email: reqData.contact_email || reqData.contactEmail || '',
      contact_position: reqData.contact_position || reqData.contactPosition || 'Property Coordinator',
      description: reqData.description || reqData.notes || '',
      urgency: reqData.urgency || 'Standard',
      preferred_timeline: reqData.preferred_timeline || reqData.preferredTimeframe || '',
      preferred_date: reqData.preferred_date || reqData.preferredDate || '',
      additional_concerns: reqData.additional_concerns || reqData.otherConcerns || '',
      attachments: reqData.attachments || [],
      extended_status: 'Pending Review',
      confirmed_schedule: '',
      quotation_amount: 0,
      assessment_notes: 'Service request queued for engineering review.'
    };

    let finalRef = refCode;
    if (window.supabaseClient) {
      try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        
        // Clean urgency and status for Supabase table check constraints
        let cleanUrgency = 'Standard';
        if (reqData.urgency === 'Urgent' || reqData.urgency === 'Priority') cleanUrgency = 'Urgent';
        else if (reqData.urgency === 'Emergency') cleanUrgency = 'Emergency / Urgent';
        else if (reqData.urgency === 'Routine Maintenance') cleanUrgency = 'Scheduled';
        else if (reqData.urgency) cleanUrgency = reqData.urgency;

        const payload = {
          reference_no: refCode,
          customer_name: customerDisplayName,
          service_type: reqData.service_type || reqData.serviceType || 'Fire Protection Service',
          urgency: cleanUrgency,
          status: 'Pending Review',
          description: metaPayload.description || '',
          preferred_timeline: metaPayload.preferred_timeline || '',
          preferred_date: metaPayload.preferred_date || null,
          establishment_name: metaPayload.establishment_name || '',
          building_type: metaPayload.building_type || '',
          floors: metaPayload.floors || '',
          site_address: metaPayload.site_address || '',
          google_maps_link: metaPayload.google_maps_link || '',
          contact_name: metaPayload.contact_name || customerDisplayName,
          contact_phone: metaPayload.contact_phone || '',
          contact_email: metaPayload.contact_email || (user.email || ''),
          contact_position: metaPayload.contact_position || 'Property Coordinator',
          attachments: metaPayload.attachments || [],
          additional_concerns: metaPayload.additional_concerns || '',
          notes: JSON.stringify(metaPayload)
        };

        if (session?.user?.id) {
          payload.user_id = session.user.id;
        }

        const { data, error } = await window.supabaseClient
          .from('service_requests')
          .insert(payload)
          .select()
          .single();

        if (error) {
          console.warn('Supabase service_requests insert note (local fallback active):', error.message || error);
        } else if (data?.reference_no) {
          finalRef = data.reference_no;
        }

        // Mirror insert to inquiries table in Supabase so both tables hold the record
        try {
          await window.supabaseClient.from('inquiries').insert({
            reference_no: finalRef,
            user_id: session?.user?.id || null,
            customer_name: customerDisplayName,
            email: reqData.contact_email || user.email || '',
            phone: reqData.contact_phone || user.phone || '',
            service_name: reqData.service_type || reqData.serviceType || 'Fire Protection Service',
            message: metaPayload.description || 'Service request submitted from Customer Portal.',
            status: 'Pending Review',
            tracking_note: JSON.stringify(metaPayload)
          });
        } catch (inqDbErr) {
          console.warn('Supabase inquiries mirror insert note:', inqDbErr);
        }
      } catch (err) {
        console.warn('Supabase service_requests network warning (persisted locally):', err);
      }
    }

    // Update local cache immediately
    const existingList = this.get('serviceRequests') || [];
    const localRecord = {
      reference: finalRef,
      reference_no: finalRef,
      customer: customerDisplayName,
      customer_name: customerDisplayName,
      service: reqData.service_type || reqData.serviceType || 'Fire Protection Service',
      service_type: reqData.service_type || reqData.serviceType || 'Fire Protection Service',
      status: 'Pending Review',
      ...metaPayload,
      assignedStaff: 'Awaiting Staff Assignment',
      dateSubmitted: formatDate(new Date()),
      lastUpdate: 'Just now'
    };
    
    this.set('serviceRequests', [localRecord, ...existingList.filter(item => (item.reference || item.reference_no) !== finalRef)]);

    // Mirror to inquiries collection so it is immediately visible in Customer Inquiries as well
    const existingInqs = this.get('inquiries') || [];
    const inqMirror = {
      reference: finalRef,
      reference_no: finalRef,
      customer: customerDisplayName,
      customer_name: customerDisplayName,
      service: localRecord.service,
      service_name: localRecord.service_type,
      status: 'Pending Review',
      email: localRecord.contact_email || user.email || '',
      phone: localRecord.contact_phone || user.phone || '',
      trackingNote: `Site: ${localRecord.establishment_name || 'Project Site'} • Preferred: ${localRecord.preferred_date || 'Target Date'}`,
      message: localRecord.description || '',
      dateSubmitted: localRecord.dateSubmitted,
      lastUpdate: 'Just now',
      ...metaPayload
    };
    this.set('inquiries', [inqMirror, ...existingInqs.filter(i => (i.reference || i.reference_no) !== finalRef)]);
    
    try {
      await this.sync();
      window.dispatchEvent(new CustomEvent('bd22_synced'));
    } catch (syncErr) {
      console.warn('Sync post-insert notice:', syncErr);
    }

    return finalRef;
  },

  // 2b. Update Service Request (Admin Technical Assessment, Schedule Confirmation, Quotation, Status)
  async updateServiceRequest(reference, updatedFields) {
    try {
      const currentList = this.get('serviceRequests') || [];
      const currentInqs = this.get('inquiries') || [];
      const item = currentList.find(r => r.reference === reference || r.reference_no === reference) ||
                   currentInqs.find(i => i.reference === reference || i.reference_no === reference);
      
      const newStatus = updatedFields.status || item?.status || 'Pending Review';
      const assignedStaff = updatedFields.assignedStaff || item?.assignedStaff || 'M. Velasco';
      const hasConfirmedDate = Object.prototype.hasOwnProperty.call(updatedFields, 'confirmedSchedule') ||
        Object.prototype.hasOwnProperty.call(updatedFields, 'confirmed_schedule');
      const confirmedDate = hasConfirmedDate
        ? (Object.prototype.hasOwnProperty.call(updatedFields, 'confirmedSchedule')
          ? updatedFields.confirmedSchedule
          : updatedFields.confirmed_schedule)
        : (item?.confirmed_schedule || item?.scheduled_date || '');
      const quotationAmt = Number(updatedFields.quotationAmount || updatedFields.quotation_amount || item?.quotation_amount || 0);
      const assessmentNotes = updatedFields.assessmentNotes || updatedFields.assessment_notes || item?.assessment_notes || updatedFields.trackingNote || '';

      // Prepare updated metadata
      let meta = {};
      if (item) {
        meta = {
          establishment_name: item.establishment_name || 'Project Facility',
          building_type: item.building_type || 'Commercial',
          floors: item.floors || '',
          site_address: item.site_address || '',
          google_maps_link: item.google_maps_link || '',
          contact_name: item.contact_name || item.customer,
          contact_phone: item.contact_phone || '',
          contact_email: item.contact_email || '',
          contact_position: item.contact_position || '',
          description: item.description || '',
          urgency: item.urgency || 'Standard',
          preferred_timeline: item.preferred_timeline || '',
          preferred_date: item.preferred_date || '',
          additional_concerns: item.additional_concerns || '',
          attachments: item.attachments || []
        };
      }

      meta.extended_status = newStatus;
      meta.confirmed_schedule = confirmedDate;
      meta.quotation_amount = quotationAmt;
      meta.assessment_notes = assessmentNotes;

      const updates = {
        last_update: new Date().toISOString(),
        assigned_staff: assignedStaff,
        status: newStatus,
        quotation_amount: quotationAmt,
        scheduled_date: confirmedDate ? confirmedDate : null,
        assessment_notes: assessmentNotes,
        notes: JSON.stringify(meta)
      };

      if (window.supabaseClient) {
        try {
          await window.supabaseClient
            .from('service_requests')
            .update(updates)
            .eq('reference_no', reference);
        } catch (srErr) {
          console.warn('Supabase service_requests update notice:', srErr);
        }

        try {
          await window.supabaseClient
            .from('inquiries')
            .update({
              status: newStatus,
              assigned_staff: assignedStaff,
              response_notes: assessmentNotes,
              last_update: new Date().toISOString(),
              tracking_note: JSON.stringify(meta)
            })
            .eq('reference_no', reference);
        } catch (inqErr) {
          console.warn('Supabase inquiries update notice:', inqErr);
        }
      }

      // If user_id exists on item, send customer notification message
      if (item?.user_id && window.supabaseClient) {
        let notifMsg = `Your service request ${reference} at ${item.establishment_name || 'site'} status has been updated to "${newStatus}".`;
        if (newStatus === 'Approved') {
          notifMsg = `Your appointment (${reference}) has been APPROVED! Confirmed schedule: ${confirmedDate || 'Pending schedule'}. Assigned Lead: ${assignedStaff}.`;
        } else if (newStatus === 'Rejected') {
          notifMsg = `Your appointment request (${reference}) could not be approved at this time. Please contact BD22 operations for alternative scheduling.`;
        } else if (newStatus === 'Scheduled' && confirmedDate) {
          notifMsg = `Your service request ${reference} is officially scheduled for ${confirmedDate}. Assigned Lead Engineer: ${assignedStaff}.`;
        } else if (newStatus === 'Completed') {
          notifMsg = `Your service appointment (${reference}) at ${item.establishment_name || 'site'} has been completed by ${assignedStaff}.`;
        } else if (newStatus === 'Quotation Prepared') {
          notifMsg = `Quotation prepared for ${reference}: ₱${quotationAmt.toLocaleString()}. Our operations lead will coordinate your review.`;
        }
        
        try {
          await window.supabaseClient.from('customer_messages').insert({
            user_id: item.user_id,
            title: `Service Request Update: ${newStatus}`,
            description: notifMsg
          });
        } catch (mErr) {
          console.warn('Error inserting customer notification:', mErr);
        }
      }

      // Update local storage for serviceRequests
      let foundInSr = false;
      const updatedSrList = currentList.map(r => {
        if (r.reference === reference || r.reference_no === reference) {
          foundInSr = true;
          return {
            ...r,
            ...meta,
            status: newStatus,
            assignedStaff: assignedStaff,
            confirmed_schedule: confirmedDate,
            quotation_amount: quotationAmt,
            assessment_notes: assessmentNotes,
            lastUpdate: 'Just now'
          };
        }
        return r;
      });
      if (!foundInSr && item) {
        updatedSrList.unshift({
          ...item,
          ...meta,
          status: newStatus,
          assignedStaff: assignedStaff,
          confirmed_schedule: confirmedDate,
          quotation_amount: quotationAmt,
          assessment_notes: assessmentNotes,
          lastUpdate: 'Just now'
        });
      }
      this.set('serviceRequests', updatedSrList);

      // Update local storage for inquiries
      let foundInInq = false;
      const updatedInqList = currentInqs.map(i => {
        if (i.reference === reference || i.reference_no === reference) {
          foundInInq = true;
          return {
            ...i,
            ...meta,
            status: newStatus,
            assignedStaff: assignedStaff,
            confirmed_schedule: confirmedDate,
            quotation_amount: quotationAmt,
            assessment_notes: assessmentNotes,
            lastUpdate: 'Just now'
          };
        }
        return i;
      });
      if (!foundInInq && item) {
        updatedInqList.unshift({
          ...item,
          ...meta,
          status: newStatus,
          assignedStaff: assignedStaff,
          confirmed_schedule: confirmedDate,
          quotation_amount: quotationAmt,
          assessment_notes: assessmentNotes,
          lastUpdate: 'Just now'
        });
      }
      this.set('inquiries', updatedInqList);

      await this.sync();
      window.dispatchEvent(new CustomEvent('bd22_synced'));
      return { success: true };
    } catch (err) {
      console.error('Service request update error:', err);
      return { success: false, error: err };
    }
  },

  // 3. Update Inquiry (Admin Review / Assignment)
  async updateInquiry(reference, updatedFields) {
    try {
      return await this.updateServiceRequest(reference, updatedFields);
    } catch (err) {
      console.error('Inquiry update error:', err);
      return { success: false, error: err.message || err };
    }
  },

  // Reference generator for Projects: BD22-PRJ-YYYY-NNN
  generateProjectCode() {
    const year = new Date().getFullYear();
    const existing = this.get('projects') || [];
    const prefix = `BD22-PRJ-${year}-`;
    let maxNum = 0;
    existing.forEach(p => {
      const code = p.project_code || p.id || '';
      if (code.startsWith(prefix)) {
        const numPart = parseInt(code.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
      }
    });
    if (maxNum === 0) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      return `${prefix}${rand}`;
    }
    return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
  },

  // Reference generator for Invoices: BD22-INV-YYYY-NNN
  generateInvoiceCode() {
    const year = new Date().getFullYear();
    const existing = this.get('payments') || [];
    const prefix = `BD22-INV-${year}-`;
    let maxNum = 0;
    existing.forEach(p => {
      const code = p.invoice_no || p.invoice || '';
      if (code.startsWith(prefix)) {
        const numPart = parseInt(code.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
      }
    });
    if (maxNum === 0) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      return `${prefix}${rand}`;
    }
    return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
  },

  // 3c. Automatic Project & Payment/Billing Reconciliation
  reconcileProjectsAndPayments() {
    const projects = this.get('projects') || [];
    const payments = this.get('payments') || [];
    let projectsUpdated = false;
    let paymentsUpdated = false;

    // 1. Reconcile existing projects to ensure they have valid project codes and linked invoices
    projects.forEach(proj => {
      // If project code is missing or temporary (e.g., 'proj-12345'), assign formal BD22-PRJ-YYYY-NNN code
      if (!proj.project_code || proj.project_code.startsWith('proj-') || (proj.id && String(proj.id).startsWith('proj-'))) {
        const properCode = this.generateProjectCode();
        proj.project_code = properCode;
        if (!proj.id || String(proj.id).startsWith('proj-')) proj.id = properCode;
        projectsUpdated = true;
      }

      const projCode = proj.project_code || proj.id;
      const projName = proj.name || proj.title || 'Fire Protection Project';
      const customer = proj.customer || proj.customer_name || 'Commercial Client';
      const budget = Number(proj.budget || proj.amount || 0);
      proj.budget = budget;

      // Check if an invoice exists for this project in payments
      const existingInv = payments.find(p => 
        (p.project_id && proj.db_id && String(p.project_id) === String(proj.db_id)) ||
        (p.project_id && (p.project_id === projCode || p.project_id === proj.id)) ||
        (p.project_code && (p.project_code === projCode || p.project_code === proj.id)) ||
        (p.invoice && p.invoice === (proj.linked_invoice || proj.linkedInvoice)) ||
        (p.invoice_no && p.invoice_no === (proj.linked_invoice || proj.linkedInvoice)) ||
        (p.project && p.project.trim().toLowerCase() === projName.trim().toLowerCase()) ||
        (p.project_name && p.project_name.trim().toLowerCase() === projName.trim().toLowerCase())
      );

      if (!existingInv && proj.create_invoice === true) {
        // Automatic generation of linked invoice for existing projects (including "Springkler")
        const invCode = this.generateInvoiceCode();
        const newInvoice = {
          id: invCode,
          invoice: invCode,
          invoice_no: invCode,
          project: projName,
          project_name: projName,
          project_id: proj.db_id || projCode,
          project_code: projCode,
          customer: customer,
          customer_name: customer,
          user_id: proj.user_id || null,
          amount: budget,
          amount_paid: 0,
          balance: budget,
          dueDate: proj.targetDate || proj.target_date || formatDate(new Date(Date.now() + 30*24*60*60*1000)),
          due_date: proj.targetDate || proj.target_date || null,
          invoiceDate: formatDate(new Date()),
          invoice_date: new Date().toISOString().split('T')[0],
          status: 'Unpaid',
          payment_history: [],
          billing_notes: `Contract invoice automatically reconciled and linked to Project ${projCode} (${projName}).`,
          created_at: new Date().toISOString()
        };

        payments.unshift(newInvoice);
        proj.linkedInvoice = invCode;
        projectsUpdated = true;
        paymentsUpdated = true;
      } else if (existingInv) {
        // Ensure two-way linkage
        if (proj.linkedInvoice !== (existingInv.invoice || existingInv.invoice_no) ||
            proj.linked_invoice !== (existingInv.invoice || existingInv.invoice_no)) {
          proj.linkedInvoice = existingInv.invoice || existingInv.invoice_no;
          proj.linked_invoice = existingInv.invoice || existingInv.invoice_no;
          projectsUpdated = true;
        }
        if (!existingInv.project_code || !existingInv.project_id) {
          existingInv.project_code = existingInv.project_code || projCode;
          existingInv.project_id = existingInv.project_id || proj.db_id || projCode;
          paymentsUpdated = true;
        }
        if (!existingInv.user_id && proj.user_id) {
          existingInv.user_id = proj.user_id;
          paymentsUpdated = true;
        }
        if (!proj.user_id && existingInv.user_id) {
          proj.user_id = existingInv.user_id;
          projectsUpdated = true;
        }
        // Authoritative reconciliation: synchronize project's payment status with invoice
        if (proj.payment_status !== existingInv.status || proj.paymentStatus !== existingInv.status) {
          proj.payment_status = existingInv.status;
          proj.paymentStatus = existingInv.status;
          projectsUpdated = true;
        }

        // Warranty terms are entered by an administrator for the specific project.
      }
    });

    // 2. Reconcile all invoices: enforce payment status and calculation rules
    payments.forEach(inv => {
      const totalAmt = Number(inv.amount || 0);
      const history = Array.isArray(inv.payment_history) ? inv.payment_history : [];

      let confirmedPaidCents = 0;
      if (history.length > 0) {
        confirmedPaidCents = history.reduce((sum, t) => sum + Math.round((Number(t.amount) || 0) * 100), 0);
      } else if (Number(inv.amount_paid) > 0) {
        confirmedPaidCents = Math.round(Number(inv.amount_paid) * 100);
      } else if (inv.status === 'Paid') {
        confirmedPaidCents = Math.round(totalAmt * 100);
      }

      const totalCents = Math.max(0, Math.round(totalAmt * 100));
      confirmedPaidCents = Math.min(totalCents, Math.max(0, confirmedPaidCents));
      const confirmedPaid = confirmedPaidCents / 100;
      const balanceCents = Math.max(0, totalCents - confirmedPaidCents);
      inv.amount = totalAmt;
      inv.amount_paid = confirmedPaid;
      inv.balance = balanceCents / 100;

      if (totalCents > 0 && balanceCents === 0) {
        inv.status = 'Paid';
      } else if (confirmedPaidCents > 0) {
        inv.status = 'Partial';
      } else {
        inv.status = 'Unpaid';
        inv.balance = totalCents / 100;
      }
    });

    if (projectsUpdated) this.set('projects', projects);
    if (paymentsUpdated) this.set('payments', payments);
  },

  // Get Registered Customers directly from Database/Profiles
  async fetchRegisteredCustomersFromDB() {
    if (window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from('profiles')
          .select('id, full_name, company, email, phone, role')
          .neq('role', 'admin');

        if (!error && Array.isArray(data)) {
          this.set('registeredCustomers', data);
        }
      } catch (e) {
        console.warn('Could not fetch profiles from DB:', e);
      }
    }
    return this.getRegisteredCustomers();
  },

  getRegisteredCustomers() {
    const raw = this.get('registeredCustomers') || [];
    const customerMap = new Map();

    raw.forEach(p => {
      const uid = p.id || p.user_id;
      // Exclude placeholder/dummy test IDs
      if (uid && !String(uid).startsWith('usr-cust-')) {
        customerMap.set(uid, {
          user_id: uid,
          id: uid,
          name: p.full_name || p.name || (p.email ? p.email.split('@')[0] : 'Customer'),
          company: p.company || p.full_name || p.name || 'Customer Account',
          email: p.email || '',
          phone: p.phone || ''
        });
      }
    });

    // Check current user if logged in as customer
    const cur = this.get('currentUser');
    if (cur && cur.id && cur.role === 'customer' && !String(cur.id).startsWith('usr-cust-')) {
      if (!customerMap.has(cur.id)) {
        customerMap.set(cur.id, {
          user_id: cur.id,
          id: cur.id,
          name: cur.full_name || cur.name || cur.email,
          company: cur.company || cur.full_name || 'Customer Account',
          email: cur.email || '',
          phone: cur.phone || ''
        });
      }
    }

    // Extract customers from service requests
    const srs = this.get('serviceRequests') || [];
    srs.forEach(sr => {
      const uid = sr.user_id || sr.userId;
      if (uid && !customerMap.has(uid) && !String(uid).startsWith('usr-cust-')) {
        customerMap.set(uid, {
          user_id: uid,
          id: uid,
          name: sr.contact_person || sr.contactPerson || sr.customer || (sr.email ? sr.email.split('@')[0] : 'Customer'),
          company: sr.establishment_name || sr.establishmentName || sr.company || 'Customer Facility',
          email: sr.email || '',
          phone: sr.phone || sr.phone_number || ''
        });
      }
    });

    // Extract customers from inquiries
    const inqs = this.get('inquiries') || [];
    inqs.forEach(inq => {
      const uid = inq.user_id;
      if (uid && !customerMap.has(uid) && !String(uid).startsWith('usr-cust-')) {
        customerMap.set(uid, {
          user_id: uid,
          id: uid,
          name: inq.customer_name || inq.name || (inq.email ? inq.email.split('@')[0] : 'Customer'),
          company: inq.company || inq.customer_name || 'Customer Account',
          email: inq.email || '',
          phone: inq.phone || ''
        });
      }
    });

    return Array.from(customerMap.values());
  },

  // 4. Record Invoice Payment (Admin & Customer Settlement)
  async recordPayment(invoiceNo, paymentData) {
    try {
      const list = this.get('payments') || [];
      const item = list.find(p => p.invoice === invoiceNo || p.invoice_no === invoiceNo || p.id === invoiceNo);
      if (!item) return { success: false, error: 'Invoice not found' };

      const paymentAmount = Number(paymentData.amount);
      const payAmtCents = Number.isFinite(paymentAmount) ? Math.round(paymentAmount * 100) : 0;
      if (payAmtCents <= 0) return { success: false, error: 'Payment amount must be greater than zero.' };

      const payAmt = payAmtCents / 100;
      const totalAmt = Number(item.amount || 0);
      const totalCents = Math.max(0, Math.round(totalAmt * 100));
      if (totalCents <= 0) return { success: false, error: 'Invoice total must be greater than zero.' };

      const prevHistory = Array.isArray(item.payment_history) ? item.payment_history : [];
      const recordedPaid = item.amount_paid !== undefined && item.amount_paid !== null
        ? item.amount_paid
        : (item.status === 'Paid' ? totalAmt : totalAmt - Number(item.balance ?? totalAmt));
      const previousPaidCents = prevHistory.length > 0
        ? prevHistory.reduce((sum, transaction) => sum + Math.round((Number(transaction.amount) || 0) * 100), 0)
        : Math.round(Number(recordedPaid) * 100);
      const newPaidCents = Math.max(0, previousPaidCents) + payAmtCents;
      const remainingCents = Math.max(0, totalCents - Math.max(0, previousPaidCents));
      if (payAmtCents > remainingCents) {
        return { success: false, error: 'Payment amount cannot exceed the remaining invoice balance.' };
      }

      const newPaid = newPaidCents / 100;
      const newBalance = Math.max(0, totalCents - newPaidCents) / 100;
      const newStatus = newBalance === 0 ? 'Paid' : newPaidCents > 0 ? 'Partial' : 'Unpaid';

      const transaction = {
        date: paymentData.date || formatDate(new Date()),
        amount: payAmt,
        method: paymentData.method || 'BDO Unibank Online Transfer',
        reference: paymentData.reference || ('TR-' + Date.now().toString().slice(-6)),
        notes: (paymentData.notes || '').trim() || 'Payment recorded.',
        confirmed_by: paymentData.confirmed_by || 'Admin Operations',
        confirmed_at: new Date().toISOString()
      };

      const updatedHistory = [...prevHistory, transaction];

      const updatedInvoice = {
        ...item,
        amount_paid: newPaid,
        balance: newBalance,
        status: newStatus,
        method_used: transaction.method,
        payment_reference: transaction.reference,
        payment_history: updatedHistory,
        lastUpdate: 'Just now'
      };

      // Update in Supabase
      if (window.supabaseClient) {
        try {
          const { error: upErr } = await window.supabaseClient
            .from('payments')
            .update({
              amount_paid: newPaid,
              balance: newBalance,
              status: newStatus,
              method_used: transaction.method,
              payment_reference: transaction.reference,
              payment_history: updatedHistory,
              last_update: new Date().toISOString()
            })
            .eq('invoice_no', item.invoice_no || item.invoice);

          if (upErr) {
            throw upErr;
          }
        } catch (err) {
          console.error('Supabase payment update failed:', err);
          return { success: false, error: err.message || 'Could not save the payment update.' };
        }

        if (item.user_id) {
          const { error: messageError } = await window.supabaseClient.from('customer_messages').insert({
            user_id: item.user_id,
            title: `Payment Settlement Update: ${item.invoice_no || item.invoice} (${newStatus})`,
            description: `A payment of ₱${payAmt.toLocaleString()} via ${transaction.method} has been recorded. Remaining balance: ₱${newBalance.toLocaleString()}. Status: ${newStatus}.`
          });
          if (messageError) console.warn('Customer payment notification warning:', messageError);
        }
      }

      // Update local storage for payments and projects
      const localProjects = this.get('projects') || [];
      const updatedProjects = localProjects.map(proj => {
        const pCode = proj.project_code || proj.id;
        const isMatch = (item.project_id && proj.db_id && String(item.project_id) === String(proj.db_id)) ||
                        (item.project_code && (pCode === item.project_code || proj.id === item.project_code)) ||
                        (item.project_id && (pCode === item.project_id || proj.id === item.project_id)) ||
                        (proj.linkedInvoice && (proj.linkedInvoice === (item.invoice_no || item.invoice))) ||
                        (proj.name && item.project_name && proj.name.trim().toLowerCase() === item.project_name.trim().toLowerCase()) ||
                        (proj.name && item.project && proj.name.trim().toLowerCase() === item.project.trim().toLowerCase());
        if (isMatch) {
          return {
            ...proj,
            payment_status: newStatus,
            paymentStatus: newStatus,
            linkedInvoice: item.invoice_no || item.invoice,
            linked_invoice: item.invoice_no || item.invoice
          };
        }
        return proj;
      });
      this.set('projects', updatedProjects);

      if (item.user_id) {
        const currentMsgs = this.get('customerMessages') || [];
        const newMsg = {
          id: 'msg-' + Date.now(),
          user_id: item.user_id,
          title: `Payment Settlement Update: ${item.invoice_no || item.invoice} (${newStatus})`,
          description: `A payment of ₱${payAmt.toLocaleString()} via ${transaction.method} has been recorded. Remaining balance: ₱${newBalance.toLocaleString()}. Status: ${newStatus}.`,
          desc: `A payment of ₱${payAmt.toLocaleString()} via ${transaction.method} has been recorded. Remaining balance: ₱${newBalance.toLocaleString()}. Status: ${newStatus}.`,
          time: 'Just now',
          created_at: new Date().toISOString()
        };
        this.set('customerMessages', [newMsg, ...currentMsgs]);
      }

      const updatedList = list.map(p => (p.invoice === invoiceNo || p.invoice_no === invoiceNo || p.id === invoiceNo) ? updatedInvoice : p);
      this.set('payments', updatedList);

      // Requirement 4: If invoice is marked as Paid in Full, check if linked project is Completed.
      // If Completed, automatically generate the 1-Year Warranty!
      if (newStatus === 'Paid') {
        const matchingProj = updatedProjects.find(p => (
          (item.project_code && (p.project_code === item.project_code || p.id === item.project_code)) ||
          (item.project_id && (p.project_code === item.project_id || p.id === item.project_id)) ||
          (p.linkedInvoice && (p.linkedInvoice === (item.invoice_no || item.invoice))) ||
          (p.linked_invoice && (p.linked_invoice === (item.invoice_no || item.invoice))) ||
          (p.name && item.project_name && p.name.trim().toLowerCase() === item.project_name.trim().toLowerCase()) ||
          (p.name && item.project && p.name.trim().toLowerCase() === item.project.trim().toLowerCase())
        ));

        if (matchingProj && matchingProj.status === 'Completed') {
          await this.createProjectWarranty(matchingProj);
        }
      }

      this.reconcileProjectsAndPayments();
      localStorage.setItem('bd22_last_sync_timestamp', Date.now().toString());
      window.dispatchEvent(new CustomEvent('bd22_synced'));

      return { success: true, invoice: updatedInvoice };
    } catch (err) {
      console.error('Record payment error:', err);
      return { success: false, error: err.message || err };
    }
  },

  // Pay Invoice shortcut for customer portal modal
  async payInvoice(invoiceNum, method = 'Bank Transfer', refNo = '', customAmount = null) {
    const list = this.get('payments') || [];
    const item = list.find(p => p.invoice === invoiceNum || p.invoice_no === invoiceNum || p.id === invoiceNum);
    const amountToPay = customAmount !== null ? Number(customAmount) : (item ? Number(item.balance) : 0);
    return await this.recordPayment(invoiceNum, {
      amount: amountToPay,
      method: method,
      reference: refNo || ('PAY-' + Date.now().toString().slice(-6)),
      notes: 'Customer portal electronic payment settlement.'
    });
  },

  // 5. Create Enhanced Project (Admin) with Automatic Invoice Generation
  async createProject(projData) {
    try {
      const userId = projData.user_id;
      if (!userId || typeof userId !== 'string' || !userId.trim()) {
        return { success: false, error: 'A valid registered customer account must be assigned.' };
      }

      const registered = this.getRegisteredCustomers();
      const customerRecord = registered.find(c => c.user_id === userId || c.id === userId);
      const customerName = customerRecord 
        ? (customerRecord.company || customerRecord.name) 
        : (projData.customer || 'Commercial Client');

      const projCode = projData.project_code || this.generateProjectCode();
      const invCode = this.generateInvoiceCode();
      const budgetAmt = Number(projData.budget || projData.amount || 0);

      // Clean milestones tasks
      const formattedTasks = Array.isArray(projData.tasks) ? projData.tasks.map((t, idx) => ({
        id: t.id || ('m-' + (idx + 1) + '-' + Date.now()),
        title: (t.title || '').trim(),
        description: (t.description || t.deliverable || '').trim(),
        deadline: t.deadline || '',
        status: t.completed ? 'Completed' : (t.status || 'Pending'),
        completed: !!t.completed
      })) : [];

      const projectRecord = {
        id: projCode,
        project_code: projCode,
        name: projData.name || projData.title,
        customer: customerName,
        customer_name: customerName,
        user_id: userId,
        db_id: null,
        description: projData.description || '',
        startDate: projData.startDate || formatDate(new Date()),
        start_date: projData.startDate || new Date().toISOString().split('T')[0],
        targetDate: projData.targetDate || '',
        target_date: projData.targetDate || null,
        actualCompletionDate: '',
        actual_completion_date: null,
        manager: projData.manager || 'Engr. M. Velasco',
        project_manager: projData.manager || 'Engr. M. Velasco',
        team: projData.team || 'Team Alpha (Operations)',
        assigned_team: projData.team || 'Team Alpha (Operations)',
        status: projData.status || 'In Progress',
        priority: 'Standard',
        budget: budgetAmt,
        payment_status: 'Unpaid',
        paymentStatus: 'Unpaid',
        progress: Number(projData.progress) || 0,
        milestones: projData.milestones || '',
        tasks: formattedTasks,
        notes: projData.notes || '',
        attachments: Array.isArray(projData.attachments) ? projData.attachments : [],
        linkedInvoice: invCode,
        linked_invoice: invCode,
        created_at: new Date().toISOString()
      };

      // Automatically generated linked invoice with status UNPAID
      const invoiceRecord = {
        id: invCode,
        invoice: invCode,
        invoice_no: invCode,
        project: projectRecord.name,
        project_name: projectRecord.name,
        project_id: null,
        project_code: projCode,
        customer: customerName,
        customer_name: customerName,
        user_id: userId,
        amount: budgetAmt,
        amount_paid: 0,
        balance: budgetAmt,
        dueDate: projData.targetDate || formatDate(new Date(Date.now() + 30*24*60*60*1000)),
        due_date: projData.targetDate || null,
        invoiceDate: formatDate(new Date()),
        invoice_date: new Date().toISOString().split('T')[0],
        status: 'Unpaid',
        payment_history: [],
        billing_notes: '',
        lastUpdate: 'Just now',
        created_at: new Date().toISOString()
      };

      // Insert the project first so the invoice can reference its database ID.
      let createdProjectId = null;
      if (window.supabaseClient) {
        try {
          let { data: insertedProject, error: pErr } = await window.supabaseClient
            .from('projects')
            .insert({
              project_code: projCode,
              name: projectRecord.name,
              customer_name: projectRecord.customer_name,
              user_id: projectRecord.user_id,
              description: projectRecord.description,
              start_date: projectRecord.start_date,
              target_date: projectRecord.target_date,
              project_manager: projectRecord.manager,
              assigned_team: projectRecord.team,
              status: projectRecord.status,
              priority: 'Medium',
              budget: projectRecord.budget,
              agreed_cost: projectRecord.budget,
              scope_of_work: projData.milestones || '',
              progress: projectRecord.progress,
              milestones: projectRecord.milestones,
              tasks: projectRecord.tasks,
              notes: projectRecord.notes,
              attachments: projectRecord.attachments
            })
            .select('id')
            .single();

          if (pErr) {
            console.warn('Full projects insert failed, trying a V4-compatible insert:', pErr.message);
            const missingAttachmentsColumn = pErr.code === 'PGRST204'
              && /attachments/i.test(pErr.message || '');
            if (missingAttachmentsColumn && projectRecord.attachments.length > 0) {
              throw new Error('Supabase is missing the projects.attachments column. Apply database/supabase_migration_v7_project_attachments.sql before creating projects with attachments.');
            }

            const baseProjectResult = await window.supabaseClient
              .from('projects')
              .insert({
                project_code: projCode,
                name: projectRecord.name,
                customer_name: projectRecord.customer_name,
                user_id: projectRecord.user_id,
                description: projectRecord.description,
                start_date: projectRecord.start_date,
                target_date: projectRecord.target_date || null,
                project_manager: projectRecord.manager,
                assigned_team: projectRecord.team || 'Operations Team',
                status: projectRecord.status || 'In Progress',
                priority: 'Medium',
                budget: projectRecord.budget,
                progress: projectRecord.progress || 0,
                milestones: projectRecord.milestones || '',
                tasks: projectRecord.tasks,
                notes: projectRecord.notes,
                ...(missingAttachmentsColumn ? {} : { attachments: projectRecord.attachments })
              })
              .select('id')
              .single();
            if (baseProjectResult.error) throw baseProjectResult.error;
            insertedProject = baseProjectResult.data;
          }

          projectRecord.db_id = insertedProject?.id || null;
          if (projectRecord.db_id === null) {
            throw new Error('The project was created without a database ID, so its invoice cannot be linked.');
          }
          createdProjectId = projectRecord.db_id;
          invoiceRecord.project_id = projectRecord.db_id;

          const { error: payErr } = await window.supabaseClient
            .from('payments')
            .insert({
              invoice_no: invCode,
              project_id: projectRecord.db_id,
              project_name: invoiceRecord.project_name,
              customer_name: invoiceRecord.customer_name,
              user_id: invoiceRecord.user_id,
              amount: invoiceRecord.amount,
              amount_paid: 0,
              balance: invoiceRecord.balance,
              due_date: invoiceRecord.due_date,
              invoice_date: invoiceRecord.invoice_date,
              status: 'Unpaid',
              billing_notes: invoiceRecord.billing_notes,
              payment_history: []
            });

          if (payErr) {
            console.warn('Full payments insert failed, trying base schema fallback:', payErr.message);
            const { error: payBaseErr } = await window.supabaseClient
              .from('payments')
              .insert({
                invoice_no: invCode,
                project_id: projectRecord.db_id,
                customer_name: invoiceRecord.customer_name,
                user_id: invoiceRecord.user_id,
                amount: invoiceRecord.amount,
                due_date: invoiceRecord.due_date || null,
                status: 'Pending',
                method_used: 'Bank Transfer / Pending Settlement'
              });
            if (payBaseErr) throw payBaseErr;
          }
        } catch (err) {
          if (createdProjectId) {
            const { error: rollbackError } = await window.supabaseClient
              .from('projects')
              .delete()
              .eq('id', createdProjectId);
            if (rollbackError) console.error('Could not roll back project after invoice creation failed:', rollbackError);
          }
          console.error('Project and invoice creation failed:', err);
          return { success: false, error: err.message || 'Could not save the project and its invoice.' };
        }
      }

      // Update local storage
      const existingProjects = this.get('projects') || [];
      this.set('projects', [projectRecord, ...existingProjects.filter(p => (p.project_code || p.id) !== projCode)]);

      const existingPayments = this.get('payments') || [];
      invoiceRecord.project_id = projectRecord.db_id || projCode;
      this.set('payments', [invoiceRecord, ...existingPayments.filter(p => (p.invoice_no || p.invoice) !== invCode)]);

      // Notify customer if user_id is assigned
      if (projectRecord.user_id && window.supabaseClient) {
        try {
          await window.supabaseClient.from('customer_messages').insert({
            user_id: projectRecord.user_id,
            title: `New Project Assigned: ${projectRecord.name}`,
            description: `Engineering Project ${projCode} has been assigned to your facility. Target turn-over: ${projectRecord.targetDate}. Invoice ${invCode} for ₱${budgetAmt.toLocaleString()} is available in your billing statements.`
          });
        } catch (e) {
          console.warn('Customer project assignment notification warning:', e);
        }
      }

      // Reconcile and dispatch sync
      this.reconcileProjectsAndPayments();
      window.dispatchEvent(new CustomEvent('bd22_synced'));

      return { success: true, project: projectRecord, invoice: invoiceRecord };
    } catch (err) {
      console.error('Create project error:', err);
      return { success: false, error: err.message || err };
    }
  },

  // 5c. Create Client Invoice Directly (Admin Billing Monitor)
  async createInvoice(invData) {
    try {
      const invCode = this.generateInvoiceCode();
      const amount = Number(invData.amount || 0);
      const customer = invData.customer || invData.customer_name || 'Commercial Client';
      const userId = invData.user_id || null;
      const projectName = invData.project || invData.project_name || 'Fire Protection Engineering Contract';
      const dueDate = invData.dueDate || invData.due_date || new Date().toISOString().split('T')[0];
      const notes = invData.notes || invData.billing_notes || 'Contract billing statement.';

      const invoiceRecord = {
        id: invCode,
        invoice: invCode,
        invoice_no: invCode,
        project: projectName,
        project_name: projectName,
        customer: customer,
        customer_name: customer,
        user_id: userId,
        amount: amount,
        amount_paid: 0,
        balance: amount,
        dueDate: formatDate(dueDate),
        due_date: dueDate,
        invoiceDate: formatDate(new Date()),
        invoice_date: new Date().toISOString().split('T')[0],
        status: 'Unpaid',
        payment_history: [],
        billing_notes: notes,
        lastUpdate: 'Just now',
        created_at: new Date().toISOString()
      };

      // Resilient insert into Supabase
      if (window.supabaseClient) {
        try {
          const { error: fullErr } = await window.supabaseClient
            .from('payments')
            .insert({
              invoice_no: invCode,
              customer_name: customer,
              project_name: projectName,
              user_id: userId,
              amount: amount,
              amount_paid: 0,
              balance: amount,
              due_date: dueDate,
              invoice_date: invoiceRecord.invoice_date,
              status: 'Unpaid',
              billing_notes: notes,
              payment_history: []
            });

          if (fullErr) {
            console.warn('Full invoice insert failed, falling back to base schema:', fullErr.message);
            const { error: baseErr } = await window.supabaseClient
              .from('payments')
              .insert({
                invoice_no: invCode,
                customer_name: customer,
                user_id: userId,
                amount: amount,
                due_date: dueDate,
                status: 'Pending',
                method_used: 'Bank Transfer / Pending Settlement'
              });
            if (baseErr) console.warn('Base invoice insert warning:', baseErr);
          }
        } catch (e) {
          console.warn('Network sync notice during invoice creation:', e);
        }
      }

      // Store in localStorage
      const existing = this.get('payments') || [];
      this.set('payments', [invoiceRecord, ...existing.filter(p => (p.invoice_no || p.invoice) !== invCode)]);

      // If customer has user_id, send customer message notification
      if (userId && window.supabaseClient) {
        try {
          await window.supabaseClient.from('customer_messages').insert({
            user_id: userId,
            title: `New Invoice Issued: ${invCode}`,
            description: `A new billing statement ${invCode} for ₱${amount.toLocaleString()} has been issued for "${projectName}". Due date: ${dueDate}.`
          });
        } catch (e) {}
      }

      this.reconcileProjectsAndPayments();
      window.dispatchEvent(new CustomEvent('bd22_synced'));

      return { success: true, invoice: invoiceRecord };
    } catch (err) {
      console.error('Create invoice error:', err);
      return { success: false, error: err.message || err };
    }
  },

  // 5b. Update Existing Project (Admin)
  async updateProject(projId, updateData) {
    try {
      const list = this.get('projects') || [];
      const item = list.find(p => p.id === projId || p.project_code === projId);
      if (!item) return { success: false, error: 'Project not found' };

      const newStatus = updateData.status || item.status || 'In Progress';
      let newProgress = Number(updateData.progress !== undefined ? updateData.progress : item.progress);
      let actualDate = updateData.actualCompletionDate || item.actualCompletionDate || '';

      if (newStatus === 'Completed') {
        newProgress = 100;
        if (!actualDate) actualDate = formatDate(new Date());
      }

      // Format tasks if provided
      let updatedTasks = item.tasks || [];
      if (Array.isArray(updateData.tasks)) {
        updatedTasks = updateData.tasks.map((t, idx) => ({
          id: t.id || ('m-' + (idx + 1) + '-' + Date.now()),
          title: (t.title || '').trim(),
          description: (t.description || t.deliverable || '').trim(),
          deadline: t.deadline || '',
          status: t.completed ? 'Completed' : (t.status || 'Pending'),
          completed: !!t.completed
        }));
      }

      const updated = {
        ...item,
        name: updateData.name || item.name,
        customer: updateData.customer || item.customer,
        customer_name: updateData.customer || item.customer_name,
        user_id: updateData.user_id !== undefined ? updateData.user_id : item.user_id,
        description: updateData.description !== undefined ? updateData.description : item.description,
        manager: updateData.manager || item.manager,
        project_manager: updateData.manager || item.project_manager,
        team: updateData.team || item.team,
        assigned_team: updateData.team || item.assigned_team,
        status: newStatus,
        priority: 'Standard',
        budget: updateData.budget !== undefined ? Number(updateData.budget) : item.budget,
        progress: newProgress,
        targetDate: updateData.targetDate || item.targetDate,
        target_date: updateData.targetDate || item.target_date,
        actualCompletionDate: actualDate,
        actual_completion_date: actualDate,
        milestones: updateData.milestones !== undefined ? updateData.milestones : item.milestones,
        tasks: updatedTasks,
        notes: updateData.notes !== undefined ? updateData.notes : (item.notes || ''),
        lastUpdate: 'Just now'
      };

      // Update in Supabase
      if (window.supabaseClient) {
        try {
          await window.supabaseClient
            .from('projects')
            .update({
              name: updated.name,
              customer_name: updated.customer_name,
              user_id: updated.user_id,
              description: updated.description,
              status: updated.status,
              progress: updated.progress,
              project_manager: updated.manager,
              assigned_team: updated.team,
              budget: updated.budget,
              target_date: updated.target_date,
              actual_completion_date: updated.actual_completion_date,
              tasks: Array.isArray(updated.tasks) ? updated.tasks : (typeof updated.tasks === 'string' ? JSON.parse(updated.tasks) : []),
              notes: updated.notes
            })
            .eq('project_code', item.project_code || item.id);
        } catch (err) {
          console.warn('Supabase updateProject warning:', err);
        }
      }

      const updatedList = list.map(p => (p.id === projId || p.project_code === projId) ? updated : p);
      this.set('projects', updatedList);
      this.reconcileProjectsAndPayments();
      window.dispatchEvent(new CustomEvent('bd22_synced'));

      return { success: true, project: updated };
    } catch (err) {
      console.error('Update project error:', err);
      return { success: false, error: err.message || err };
    }
  },

  // Set Project Status & Trigger Automated Turnover Integrations
  async setProjectStatus(projId, newStatus) {
    try {
      const list = this.get('projects') || [];
      const item = list.find(p => (p.project_code || p.id) === projId);
      if (!item) return { success: false, error: 'Project not found' };

      const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const todayIso = new Date().toISOString().split('T')[0];

      let computedProgress = item.progress || 0;
      let actualDate = item.actual_completion_date || item.actualCompletionDate || '';
      let updatedTasks = Array.isArray(item.tasks) ? [...item.tasks] : [];
      let updatedNotes = item.notes || '';

      if (newStatus === 'Completed') {
        computedProgress = 100;
        actualDate = todayIso;
        // Mark all milestones as completed
        updatedTasks = updatedTasks.map(t => ({
          ...t,
          completed: true,
          status: 'Completed'
        }));
        const completionRemark = `[${timestamp} Admin Ops] Project officially marked as Completed, commissioned, and safety verified.`;
        updatedNotes = updatedNotes ? `${updatedNotes}\n${completionRemark}` : completionRemark;
      } else if (newStatus === 'Not Started') {
        if (computedProgress === 100) computedProgress = 0;
      }

      const updatedProject = {
        ...item,
        status: newStatus,
        progress: computedProgress,
        actualCompletionDate: actualDate,
        actual_completion_date: actualDate,
        tasks: updatedTasks,
        notes: updatedNotes,
        lastUpdate: 'Just now'
      };

      // 1. Update Project in Supabase
      if (window.supabaseClient) {
        try {
          await window.supabaseClient
            .from('projects')
            .update({
              status: newStatus,
              progress: computedProgress,
              actual_completion_date: actualDate || null,
              tasks: updatedTasks,
              notes: updatedNotes,
              updated_at: new Date().toISOString()
            })
            .eq('project_code', item.project_code || item.id);
        } catch (e) {
          console.warn('Supabase setProjectStatus warning:', e);
        }
      }

      // Update local projects
      const updatedList = list.map(p => (p.project_code || p.id) === projId ? updatedProject : p);
      this.set('projects', updatedList);

      // Requirement 4: When the project is marked as Completed AND its invoice is Paid,
      // automatically add the project to Warranty Tracking with a 1-year warranty.
      if (newStatus === 'Completed') {
        const payments = this.get('payments') || [];
        const inv = payments.find(p => 
          (p.project_id && (p.project_id === updatedProject.project_code || p.project_id === updatedProject.id)) ||
          (p.project_code && (p.project_code === updatedProject.project_code || p.project_code === updatedProject.id)) ||
          (p.invoice && p.invoice === (updatedProject.linked_invoice || updatedProject.linkedInvoice)) ||
          (p.invoice_no && p.invoice_no === (updatedProject.linked_invoice || updatedProject.linkedInvoice)) ||
          (p.project && p.project.trim().toLowerCase() === updatedProject.name.trim().toLowerCase()) ||
          (p.project_name && p.project_name.trim().toLowerCase() === updatedProject.name.trim().toLowerCase())
        );

        const isPaid = (inv && inv.status === 'Paid') || updatedProject.payment_status === 'Paid';
        if (isPaid) {
          await this.createProjectWarranty(updatedProject);
        }

        // Add service history entry for completion
        await this.logProjectCompletionHistory(updatedProject, isPaid);
      }

      this.reconcileProjectsAndPayments();
      window.dispatchEvent(new CustomEvent('bd22_synced'));
      return { success: true, project: updatedProject };
    } catch (err) {
      console.error('Error setting project status:', err);
      return { success: false, error: err.message || err };
    }
  },

  // 5c. Automatic 1-Year Warranty Generation (When Project is Completed AND Paid)
  async createProjectWarranty(proj) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const customerName = proj.customer_name || proj.customer || 'Commercial Client';
      const projCode = proj.project_code || proj.id || 'BD22-PRJ';
      const projName = proj.name || 'Fire Protection Project';

      const existingWarr = this.get('warranties') || [];
      const hasWarr = existingWarr.some(w => (
        (w.system_covered && w.system_covered.trim().toLowerCase() === projName.trim().toLowerCase()) ||
        (w.systemCovered && w.systemCovered.trim().toLowerCase() === projName.trim().toLowerCase()) ||
        (w.title && w.title.trim().toLowerCase() === projName.trim().toLowerCase())
      ));

      if (hasWarr) return { success: true, message: 'Warranty already registered.' };

      const year = new Date().getFullYear();
      let maxNum = 0;
      existingWarr.forEach(w => {
        const code = w.warranty_code || w.ref || '';
        if (code.startsWith(`BD22-WAR-${year}-`)) {
          const numPart = parseInt(code.replace(`BD22-WAR-${year}-`, ''), 10);
          if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
        }
      });
      const warCode = maxNum === 0 ? `BD22-WAR-${year}-${Math.floor(1000 + Math.random() * 9000)}` : `BD22-WAR-${year}-${String(maxNum + 1).padStart(3, '0')}`;

      // Resolve integer project_id if available
      let intProjId = null;
      if (typeof proj.id === 'number') intProjId = proj.id;

      const warrRecord = {
        id: warCode,
        warranty_code: warCode,
        ref: warCode,
        user_id: proj.user_id || null,
        project_id: intProjId,
        customer: customerName,
        customer_name: customerName,
        title: projName,
        system_covered: projName,
        systemCovered: projName,
        installDate: formatDate(today),
        install_date: today,
        expiryDate: formatDate(expiryDate),
        expiry_date: expiryDate,
        coverage: `1-Year Comprehensive Fire Protection System Warranty & BFP Compliance Coverage for ${projName}`,
        coverage_summary: `1-Year Comprehensive Fire Protection System Warranty & BFP Compliance Coverage for ${projName}`,
        status: 'Active',
        created_at: new Date().toISOString()
      };

      if (window.supabaseClient) {
        try {
          await window.supabaseClient.from('warranties').insert({
            warranty_code: warCode,
            user_id: proj.user_id || null,
            customer_name: customerName,
            system_covered: projName,
            install_date: today,
            expiry_date: expiryDate,
            status: 'Active',
            coverage_summary: warrRecord.coverage_summary
          });

          if (proj.user_id) {
            await window.supabaseClient.from('customer_messages').insert({
              user_id: proj.user_id,
              title: `1-Year Warranty Activated: ${projName}`,
              description: `Congratulations! Official 1-Year System Warranty certificate (${warCode}) has been issued for "${projName}". Coverage is active and valid until ${expiryDate}.`
            });
          }
        } catch (e) {
          console.warn('Supabase warranty insert warning:', e);
        }
      }

      this.set('warranties', [warrRecord, ...existingWarr]);
      localStorage.setItem('bd22_last_sync_timestamp', Date.now().toString());
      window.dispatchEvent(new CustomEvent('bd22_synced'));
      return { success: true, warranty: warrRecord };
    } catch (err) {
      console.error('Error creating project warranty:', err);
      return { success: false, error: err.message || err };
    }
  },

  // Log Project Completion in Service History
  async logProjectCompletionHistory(proj, isPaid) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const customerName = proj.customer_name || proj.customer || 'Commercial Client';
      const projCode = proj.project_code || proj.id || 'BD22-PRJ';
      const projName = proj.name || 'Fire Protection Project';
      const manager = proj.project_manager || proj.manager || 'Engr. M. Velasco';

      const existingHist = this.get('serviceHistory') || [];
      const hasHist = existingHist.some(h => (
        h.title && h.title.includes(projName) && (h.activity_type === 'Project Turnover' || h.eventType === 'Project Turnover')
      ));

      if (hasHist) return;

      const histRecord = {
        id: 'hist-' + Date.now(),
        user_id: proj.user_id || null,
        activity_type: 'Project Turnover',
        activityType: 'Project Turnover',
        eventType: 'Project Turnover',
        title: `Project Commissioning & Turnover: ${projName}`,
        description: `Fire protection system installation, pressure testing, and operational turnover completed for ${customerName} (${projCode}).${isPaid ? ' 1-Year Comprehensive Warranty activated.' : ' Final invoice settlement pending for warranty certificate activation.'}`,
        date: formatDate(today),
        service_date: today,
        badge: 'Completed',
        logged_by: manager,
        performedBy: manager,
        created_at: new Date().toISOString()
      };

      if (window.supabaseClient) {
        try {
          await window.supabaseClient.from('service_history').insert({
            user_id: proj.user_id || null,
            activity_type: 'Project Turnover',
            title: histRecord.title,
            description: histRecord.description,
            service_date: today,
            badge: 'Completed',
            logged_by: manager
          });
        } catch (e) {
          console.warn('Auto-service_history insert warning:', e);
        }
      }

      this.set('serviceHistory', [histRecord, ...existingHist]);
    } catch (e) {
      console.warn('Error logging project completion history:', e);
    }
  },

  // 5d. Manual Maintenance Schedule Creation (Admin)
  async createMaintenanceSchedule(maintData) {
    try {
      const year = new Date().getFullYear();
      const existingMaint = this.get('maintenance') || [];
      let maxNum = 0;
      existingMaint.forEach(m => {
        const code = m.maintenance_code || m.id || '';
        if (code.startsWith(`BD22-MNT-${year}-`)) {
          const numPart = parseInt(code.replace(`BD22-MNT-${year}-`, ''), 10);
          if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
        }
      });
      const mntCode = maxNum === 0 ? `BD22-MNT-${year}-${Math.floor(1000 + Math.random() * 9000)}` : `BD22-MNT-${year}-${String(maxNum + 1).padStart(3, '0')}`;

      let project = null;
      if (maintData.project_code || maintData.projectId || maintData.project_id) {
        const pCode = maintData.project_code || maintData.projectId || maintData.project_id;
        const projects = this.get('projects') || [];
        project = projects.find(p => (p.project_code || p.id) === pCode || p.id === pCode || p.db_id === pCode);
      }

      const schedDate = maintData.scheduled_date || maintData.scheduledDate || new Date().toISOString().split('T')[0];
      const customerName = maintData.customer_name || maintData.customer || project?.customer || project?.customer_name || 'Commercial Client';
      const serviceTitle = maintData.title || maintData.service_type || 'Preventive Maintenance';
      const technician = maintData.technician || 'Unassigned';
      const notes = maintData.notes || '';
      const userId = maintData.user_id || project?.user_id || null;

      let intProjId = null;
      if (typeof maintData.project_id === 'number') {
        intProjId = maintData.project_id;
      } else if (typeof project?.db_id === 'number') {
        intProjId = project.db_id;
      } else if (typeof project?.id === 'number') {
        intProjId = project.id;
      }

      const maintRecord = {
        id: mntCode,
        maintenance_code: mntCode,
        user_id: userId,
        project_id: intProjId,
        customer: customerName,
        customer_name: customerName,
        title: serviceTitle,
        service: serviceTitle,
        service_type: serviceTitle,
        scheduledDate: formatDate(schedDate),
        scheduled_date: schedDate,
        technician: technician,
        status: 'Scheduled',
        notes: notes,
        created_at: new Date().toISOString()
      };

      if (window.supabaseClient) {
        try {
          await window.supabaseClient.from('maintenance_schedules').insert({
            maintenance_code: mntCode,
            user_id: userId,
            project_id: intProjId,
            customer_name: customerName,
            service_type: serviceTitle,
            scheduled_date: schedDate,
            status: 'Scheduled',
            technician: technician,
            notes: notes
          });

          if (userId) {
            await window.supabaseClient.from('customer_messages').insert({
              user_id: userId,
              title: `Maintenance Scheduled: ${serviceTitle}`,
              description: `Preventative maintenance has been scheduled for ${customerName} on ${schedDate}.`
            });
          }
        } catch (e) {
          console.warn('Supabase maintenance_schedules insert warning:', e);
        }
      }

      this.set('maintenance', [maintRecord, ...existingMaint]);
      localStorage.setItem('bd22_last_sync_timestamp', Date.now().toString());
      window.dispatchEvent(new CustomEvent('bd22_synced'));
      return { success: true, schedule: maintRecord };
    } catch (err) {
      console.error('Error creating maintenance schedule:', err);
      return { success: false, error: err.message || err };
    }
  },

  // 6. Save Equipment / Inventory Item (Admin)
  async saveEquipment(eqData) {
    try {
      if (!window.supabaseClient) {
        throw new Error('Inventory service is unavailable. Please try again later.');
      }

      const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('Your session has expired. Sign in again before saving inventory.');

      const payload = {
        item_code: eqData.id || eqData.item_code,
        name: eqData.name,
        item_type: eqData.type || eqData.item_type || 'Component',
        quantity: Number(eqData.quantity) || 0,
        customer_project: eqData.customerProject || eqData.customer_project || 'General Stock',
        service_status: eqData.serviceStatus || eqData.service_status || 'Current',
        next_maintenance: eqData.nextMaintenance || eqData.next_maintenance || null,
        stock_status: (Number(eqData.quantity) <= 2) ? 'Low Stock' : 'Available',
        updated_at: new Date().toISOString()
      };

      const inventoryTable = window.supabaseClient.from('inventory_items');
      const { data, error } = eqData.isNew
        ? await inventoryTable.insert(payload).select().single()
        : await inventoryTable.update(payload).eq('item_code', payload.item_code).select().single();

      if (error) throw error;

      const savedItem = {
        ...data,
        id: data.item_code,
        type: data.item_type,
        customerProject: data.customer_project,
        serviceStatus: data.service_status,
        nextMaintenance: data.next_maintenance,
        stockStatus: Number(data.quantity) <= 2 ? 'Low Stock' : 'Available'
      };
      const inventory = this.get('inventory') || [];
      const existingIndex = inventory.findIndex(item => item.id === savedItem.id);
      if (existingIndex === -1) {
        inventory.push(savedItem);
      } else {
        inventory[existingIndex] = savedItem;
      }
      this.set('inventory', inventory);

      await this.sync();
      return { success: true, data: savedItem };
    } catch (err) {
      console.error('Save inventory error:', err);
      return { success: false, error: err.message };
    }
  },

  // 7. Save Profile (Customer / Admin Settings)
  async saveProfile(profData) {
    try {
      if (!window.supabaseClient) throw new Error('The profile service is unavailable. Please try again.');

      const { data: sessionData, error: sessionError } = await window.supabaseClient.auth.getSession();
      if (sessionError) throw sessionError;
      const session = sessionData?.session;
      if (!session || !session.user) return { success: false, error: 'Not authenticated' };

      const fullName = profData.full_name || profData.name || ((profData.firstName || '') + ' ' + (profData.lastName || '')).trim();
      if (fullName && /\d/.test(fullName)) {
        return { success: false, error: 'Full name cannot contain numbers. Please use letters only.' };
      }
      if (profData.firstName && /\d/.test(profData.firstName)) {
        return { success: false, error: 'First name cannot contain numbers. Please use letters only.' };
      }
      if (profData.lastName && /\d/.test(profData.lastName)) {
        return { success: false, error: 'Last name cannot contain numbers. Please use letters only.' };
      }
      if (profData.phone && /[a-zA-Z]/.test(profData.phone)) {
        return { success: false, error: 'Phone number cannot contain letters.' };
      }

      const email = (profData.email || session.user.email || '').trim();
      let emailConfirmationRequired = false;

      if (email && email.toLowerCase() !== session.user.email.toLowerCase()) {
        const { data: authData, error: authError } = await window.supabaseClient.auth.updateUser({ email });
        if (authError) throw authError;
        emailConfirmationRequired = authData.user?.email?.toLowerCase() !== email.toLowerCase();
      }

      const updates = {
        full_name: fullName,
        company: profData.company || 'Facility Operations',
        phone: profData.phone || '',
        pref_sms: profData.pref_sms ?? true,
        pref_email: profData.pref_email ?? true,
        pref_warranty: profData.pref_warranty ?? true,
        updated_at: new Date().toISOString()
      };

      if (profData.firstName !== undefined) updates.first_name = profData.firstName;
      if (profData.lastName !== undefined) updates.last_name = profData.lastName;
      if (email) updates.email = email;

      const { data, error } = await window.supabaseClient
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id)
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('No profile was updated. Check that you are signed in and try again.');

      const currentUser = {
        ...(this.get('currentUser') || {}),
        id: session.user.id,
        role: data.role || session.user.user_metadata?.role || 'customer',
        email: data.email || email || session.user.email,
        full_name: data.full_name,
        name: data.full_name,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        company: data.company || '',
        phone: data.phone || ''
      };
      this.set('currentUser', currentUser);

      if (currentUser.role === 'admin') {
        const previousProfile = this.get('adminProfile') || {};
        this.set('adminProfile', {
          ...previousProfile,
          name: data.full_name,
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          phone: data.phone || '',
          email: data.email || email || session.user.email,
          createdDate: formatDate(data.created_at || session.user.created_at),
          role: 'ADMIN'
        });
      }

      return { success: true, data, emailConfirmationRequired };
    } catch (err) {
      console.error('Save profile error:', err);
      return { success: false, error: err.message };
    }
  },

  // 8. Sign Out
  async logout() {
    if (window.supabaseClient) {
      try {
        await window.supabaseClient.auth.signOut();
      } catch (e) {
        console.warn('SignOut error:', e);
      }
    }
    this.clearUserData();
    window.location.href = 'login.html';
  }
};

// UI Feedback Toast Helper
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  const icon = document.createElement('span');
  icon.style.cssText = 'display:inline-flex; align-items:center; color:#a61c14;';
  icon.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><circle cx="6" cy="6" r="5"/></svg>';
  const messageText = document.createElement('span');
  messageText.textContent = message;
  toast.append(icon, messageText);
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Global modal dismiss helper
function setupModalDismiss() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
    const closeBtns = modal.querySelectorAll('.modal-close-btn, .btn-modal-close');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modal.classList.remove('active');
      });
    });
  });

  // Explicitly attach logout handler to all sign-out buttons and links
  const signoutTargets = ['adminSignOutBtn', 'customerSignOutBtn'];
  signoutTargets.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        BD22_DB.logout();
      });
    }
  });
  document.querySelectorAll('a[href*="login.html"]').forEach(link => {
    if (link.textContent.toLowerCase().includes('sign out') || link.textContent.toLowerCase().includes('logout')) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        BD22_DB.logout();
      });
    }
  });
}

// Initialize on DOM load and start Supabase synchronization
document.addEventListener('DOMContentLoaded', () => {
  BD22_DB.init();
  setupModalDismiss();
  BD22_DB.sync();
  BD22_DB.startAutoSync(10000);
});
