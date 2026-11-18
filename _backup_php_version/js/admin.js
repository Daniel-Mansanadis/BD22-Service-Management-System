/**
 * BD22 FIRE SYSTEM & BUILDERS INC. - ADMIN OPERATIONS CONTROLLER
 * Faithfully powers Mockups 27 to 49 with live state synchronization
 */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation elements
  const navLinks = document.querySelectorAll('.admin-sidebar .sidebar-nav-link');
  const views = document.querySelectorAll('.portal-view');
  const topbarTitle = document.getElementById('topbarPageTitle');

  const titlesMap = {
    'admin-dashboard': 'Admin Dashboard',
    'admin-inquiries': 'Customer Inquiries',
    'admin-service-requests': 'Service Requests',
    'admin-projects': 'Project Management',
    'admin-inventory': 'Equipment & Inventory',
    'admin-payments': 'Payment & Billing',
    'admin-warranties': 'Warranty Tracking',
    'admin-maintenance': 'Maintenance Schedule',
    'admin-history': 'Service History',
    'admin-notifications': 'System Notifications',
    'admin-profile': 'Profile & Settings'
  };

  // Mobile sidebar drawer
  const adminMobileToggle = document.getElementById('adminMobileSidebarToggle');
  const adminSidebar = document.querySelector('.admin-sidebar') || document.querySelector('.sidebar');
  const adminBackdrop = document.getElementById('adminSidebarBackdrop');

  if (adminMobileToggle && adminSidebar) {
    adminMobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      adminSidebar.classList.toggle('mobile-open');
      if (adminBackdrop) adminBackdrop.classList.toggle('active');
    });
  }

  if (adminBackdrop && adminSidebar) {
    adminBackdrop.addEventListener('click', () => {
      adminSidebar.classList.remove('mobile-open');
      adminBackdrop.classList.remove('active');
    });
  }

  function switchAdminView(viewName) {
    if (!views.length) return;
    views.forEach(v => {
      const match = v.id === `view-${viewName}`;
      v.classList.toggle('active', match);
    });

    navLinks.forEach(link => {
      const target = link.getAttribute('data-view');
      link.classList.toggle('active', target === viewName);
    });

    if (topbarTitle && titlesMap[viewName]) {
      topbarTitle.textContent = titlesMap[viewName];
    }

    // Refresh view specific components
    if (viewName === 'admin-dashboard') renderAdminDashboard();
    if (viewName === 'admin-inquiries') renderAdminInquiries();
    if (viewName === 'admin-service-requests') renderAdminServiceRequests();
    if (viewName === 'admin-projects') renderAdminProjects();
    if (viewName === 'admin-inventory') renderAdminInventory();
    if (viewName === 'admin-payments') renderAdminPayments();
    if (viewName === 'admin-warranties') renderAdminWarranties('Active');
    if (viewName === 'admin-maintenance') renderAdminMaintenance('All');
    if (viewName === 'admin-history') renderAdminHistory();
    if (viewName === 'admin-notifications') renderAdminNotifications();
    if (viewName === 'admin-profile') renderAdminProfileView();

    // Close mobile drawer on view switch
    if (adminSidebar) adminSidebar.classList.remove('mobile-open');
    if (adminBackdrop) adminBackdrop.classList.remove('active');

    window.location.hash = viewName;
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-view');
      if (target) switchAdminView(target);
    });
  });

  // Handle URL hash on load
  const initialHash = window.location.hash.replace('#', '') || 'admin-dashboard';
  if (titlesMap[initialHash]) {
    switchAdminView(initialHash);
  } else {
    switchAdminView('admin-dashboard');
  }

  // Live database synchronization listener
  window.addEventListener('bd22_synced', () => {
    const cur = window.location.hash.replace('#', '') || 'admin-dashboard';
    if (titlesMap[cur]) {
      switchAdminView(cur);
    }
  });

  // User avatar toggle
  const adminAvatar = document.getElementById('adminAvatarBtn');
  const adminUserMenu = document.getElementById('adminUserMenu');
  if (adminAvatar && adminUserMenu) {
    adminAvatar.addEventListener('click', (e) => {
      e.stopPropagation();
      adminUserMenu.classList.toggle('active');
    });
    document.addEventListener('click', () => {
      adminUserMenu.classList.remove('active');
    });
  }

  // =========================================================================
  // 1. ADMIN DASHBOARD (Mockup 27)
  // =========================================================================
  function renderAdminDashboard() {
    const inquiries = BD22_DB.get('inquiries');
    const serviceRequests = BD22_DB.get('serviceRequests');
    const projects = BD22_DB.get('projects');
    const payments = BD22_DB.get('payments');
    const warranties = BD22_DB.get('warranties');
    const maintenance = BD22_DB.get('maintenance');
    const inventory = BD22_DB.get('inventory');

    // Stats
    const elInq = document.getElementById('adminStatInquiries');
    if (elInq) elInq.textContent = inquiries.length;

    const elSrv = document.getElementById('adminStatServiceReqs');
    if (elSrv) elSrv.textContent = serviceRequests.length;

    const elProj = document.getElementById('adminStatProjects');
    if (elProj) elProj.textContent = projects.filter(p => p.status === 'In Progress').length;

    const elBal = document.getElementById('adminStatBalance');
    if (elBal) {
      let bal = 0;
      payments.forEach(p => {
        if (p.status === 'Partial' || p.status === 'Overdue') bal += Number(p.amount) || 0;
      });
      elBal.textContent = bal >= 1000 ? `₱${(bal / 1000).toFixed(1)}K` : `₱${bal.toLocaleString()}`;
    }

    const elWarr = document.getElementById('adminStatWarranties');
    if (elWarr) elWarr.textContent = warranties.filter(w => w.status === 'Active').length;

    const elMaint = document.getElementById('adminStatMaint');
    if (elMaint) elMaint.textContent = maintenance.filter(m => m.status === 'Overdue' || m.status === 'Due').length;

    const elInv = document.getElementById('adminStatInventory');
    if (elInv) {
      let count = 0;
      inventory.forEach(i => count += (Number(i.quantity) || 0));
      elInv.textContent = count;
    }

    // Priority alerts list
    const alertsContainer = document.getElementById('adminPriorityAlertsList');
    if (alertsContainer) {
      const notifs = BD22_DB.get('adminNotifications');
      alertsContainer.innerHTML = notifs.map(n => {
        let colorClass = 'blue';
        if (n.status === 'Overdue' || n.title.toLowerCase().includes('overdue')) colorClass = 'red';
        else if (n.title.toLowerCase().includes('expiring') || n.title.toLowerCase().includes('assignment')) colorClass = 'yellow';
        
        return `
          <div class="priority-item ${colorClass}">
            <div class="priority-title">${n.title}</div>
            <div class="priority-desc">System trigger • Requires operations dispatch</div>
          </div>
        `;
      }).join('');
    }
  }

  // =========================================================================
  // 2. CUSTOMER INQUIRIES & DROPDOWNS (Mockups 30, 31, 32, 33, 34, 35)
  // =========================================================================
  const inquiryModal = document.getElementById('adminInquiryModal');
  const inquiryFilterInput = document.getElementById('adminInquirySearch');
  const inquiryStatusFilter = document.getElementById('adminInquiryStatusFilter');

  function renderAdminInquiries() {
    const tableBody = document.getElementById('adminInquiriesTableBody');
    if (!tableBody) return;

    let items = BD22_DB.get('inquiries');
    const query = (inquiryFilterInput?.value || '').toLowerCase().trim();
    const statusVal = inquiryStatusFilter?.value || 'All';

    if (query) {
      items = items.filter(i => 
        i.customer.toLowerCase().includes(query) ||
        i.service.toLowerCase().includes(query) ||
        i.reference.toLowerCase().includes(query) ||
        (i.assignedStaff && i.assignedStaff.toLowerCase().includes(query))
      );
    }

    if (statusVal !== 'All') {
      items = items.filter(i => i.status === statusVal);
    }

    if (items.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2.5rem; color:#64748b;">No matching inquiries found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = items.map(item => {
      let badgeClass = 'badge-pending';
      if (item.status === 'Scheduled') badgeClass = 'badge-scheduled';
      if (item.status === 'In Progress') badgeClass = 'badge-in-progress';
      if (item.status === 'Completed') badgeClass = 'badge-completed';
      if (item.status === 'Cancelled') badgeClass = 'badge-urgent';

      return `
        <tr data-ref="${item.reference}">
          <td style="font-weight: 700;">${item.customer}</td>
          <td>${item.service}</td>
          <td><span class="date-pill">${item.dateSubmitted}</span></td>
          <td><span class="badge-status ${badgeClass}">${item.status}</span></td>
          <td>${item.assignedStaff || 'Unassigned'}</td>
          <td style="color: #64748b;">${item.lastUpdate}</td>
          <td><span class="row-action-arrow">›</span></td>
        </tr>
      `;
    }).join('');

    // Attach row click to open Inquiry Modal (Mockups 30-32)
    tableBody.querySelectorAll('tr').forEach(row => {
      row.addEventListener('click', () => {
        const ref = row.getAttribute('data-ref');
        if (ref) openInquiryDetailModal(ref);
      });
    });
  }

  if (inquiryFilterInput) inquiryFilterInput.addEventListener('input', renderAdminInquiries);
  if (inquiryStatusFilter) inquiryStatusFilter.addEventListener('change', renderAdminInquiries);

  function openInquiryDetailModal(reference) {
    const list = BD22_DB.get('inquiries');
    const inq = list.find(i => i.reference === reference);
    if (!inq || !inquiryModal) return;

    document.getElementById('modalInqRef').textContent = inq.reference;
    document.getElementById('modalInqCustomer').textContent = inq.customer;
    document.getElementById('modalInqEmail').textContent = inq.email || 'customer@example.com';
    document.getElementById('modalInqPhone').textContent = inq.phone || '+63 917 000 0000';
    document.getElementById('modalInqDate').textContent = inq.dateSubmitted;
    document.getElementById('modalInqNotes').value = inq.trackingNote || '';

    // Mockup 30 dropdown: Service
    const selService = document.getElementById('modalInqServiceSelect');
    if (selService) selService.value = inq.service;

    // Mockup 31 dropdown: Status
    const selStatus = document.getElementById('modalInqStatusSelect');
    if (selStatus) selStatus.value = inq.status;

    // Mockup 32 dropdown: Assigned Staff
    const selStaff = document.getElementById('modalInqStaffSelect');
    if (selStaff) selStaff.value = inq.assignedStaff || 'M. Velasco';

    // Store active ref on modal
    inquiryModal.setAttribute('data-active-ref', reference);
    inquiryModal.classList.add('active');
  }

  // Save Inquiry Edits
  const saveInquiryBtn = document.getElementById('btnSaveInquiry');
  if (saveInquiryBtn) {
    saveInquiryBtn.addEventListener('click', () => {
      const ref = inquiryModal.getAttribute('data-active-ref');
      if (!ref) return;

      const updatedService = document.getElementById('modalInqServiceSelect').value;
      const updatedStatus = document.getElementById('modalInqStatusSelect').value;
      const updatedStaff = document.getElementById('modalInqStaffSelect').value;
      const updatedNotes = document.getElementById('modalInqNotes').value;

      BD22_DB.updateInquiry(ref, {
        service: updatedService,
        status: updatedStatus,
        assignedStaff: updatedStaff,
        trackingNote: updatedNotes
      });

      inquiryModal.classList.remove('active');
      showToast(`Inquiry ${ref} updated successfully!`);
      renderAdminInquiries();
      renderAdminDashboard();
    });
  }

  // =========================================================================
  // 3. SERVICE REQUESTS (Mockup 36)
  // =========================================================================
  function renderAdminServiceRequests() {
    const tableBody = document.getElementById('adminServiceRequestsTableBody');
    if (!tableBody) return;

    const list = BD22_DB.get('serviceRequests');
    tableBody.innerHTML = list.map(item => {
      let badgeClass = 'badge-pending';
      if (item.status === 'Urgent') badgeClass = 'badge-urgent';
      if (item.status === 'Scheduled') badgeClass = 'badge-scheduled';
      if (item.status === 'In Progress') badgeClass = 'badge-in-progress';
      if (item.status === 'Completed') badgeClass = 'badge-completed';

      return `
        <tr>
          <td style="font-weight: 700;">${item.customer}</td>
          <td>${item.service}</td>
          <td><span class="date-pill">${item.dateSubmitted}</span></td>
          <td><span class="badge-status ${badgeClass}">${item.status}</span></td>
          <td>${item.assignedStaff}</td>
          <td style="color: #64748b;">${item.lastUpdate}</td>
          <td><span class="row-action-arrow">›</span></td>
        </tr>
      `;
    }).join('');
  }

  // =========================================================================
  // 4. PROJECT MANAGEMENT (Mockups 37, 38, 39, 40)
  // =========================================================================
  const projectDetailModal = document.getElementById('adminProjectDetailModal');
  const newProjectModal = document.getElementById('adminNewProjectModal');

  function renderAdminProjects() {
    const container = document.getElementById('adminProjectsGrid');
    if (!container) return;

    const projects = BD22_DB.get('projects');
    container.innerHTML = projects.map(proj => {
      let badgeClass = 'badge-in-progress';
      if (proj.status === 'Completed') badgeClass = 'badge-completed';
      if (proj.status === 'Scheduled') badgeClass = 'badge-scheduled';

      return `
        <div class="portal-project-card">
          <div class="project-card-header">
            <h3 class="portal-project-card-title">${proj.name}</h3>
            <span class="badge-status ${badgeClass}">${proj.status}</span>
          </div>
          <p class="portal-project-subtitle">${proj.customer}</p>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${proj.progress}%;"></div>
          </div>
          <div class="progress-info-row">
            <span>Target completion: ${proj.targetDate}</span>
            <span>${proj.progress}%</span>
          </div>
          <div style="font-size: 0.95rem; color: #475569; margin-bottom: 1.5rem; line-height: 1.5;">
            ${proj.milestones}
          </div>
          <div style="display:flex; justify-content: space-between; align-items:center; margin-top:auto;">
            <span style="font-size: 0.85rem; color: #64748b;">Assigned: <strong>${proj.team || 'Ramos Fire Systems'}</strong></span>
            <button class="project-details-btn" data-proj-id="${proj.id}">Details →</button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.project-details-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.getAttribute('data-proj-id');
        openAdminProjectDetail(pid);
      });
    });
  }

  function openAdminProjectDetail(pid) {
    const list = BD22_DB.get('projects');
    const proj = list.find(p => p.id === pid);
    if (!proj || !projectDetailModal) return;

    document.getElementById('modalProjName').textContent = proj.name;
    document.getElementById('modalProjCustomer').textContent = proj.customer;
    document.getElementById('modalProjTarget').textContent = proj.targetDate;
    document.getElementById('modalProjProgressVal').textContent = `${proj.progress}%`;
    document.getElementById('modalProjProgressFill').style.width = `${proj.progress}%`;
    document.getElementById('modalProjMilestones').textContent = proj.milestones;
    document.getElementById('modalProjTeam').textContent = proj.team || 'Ramos Fire Systems';

    projectDetailModal.classList.add('active');
  }

  // Open New Project Modal (Mockup 39)
  const openNewProjBtn = document.getElementById('btnOpenNewProject');
  if (openNewProjBtn && newProjectModal) {
    openNewProjBtn.addEventListener('click', () => {
      newProjectModal.classList.add('active');
    });
  }

  // Create New Project Form Submit
  const newProjectForm = document.getElementById('newProjectForm');
  if (newProjectForm) {
    newProjectForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('newProjName').value;
      const customer = document.getElementById('newProjCustomer').value;
      const targetDate = document.getElementById('newProjDate').value;
      const milestones = document.getElementById('newProjMilestones').value;

      const list = BD22_DB.get('projects');
      list.push({
        id: 'proj-' + Date.now(),
        name,
        customer,
        team: 'Team Alpha (Operations)',
        progress: 10,
        targetDate: targetDate || 'Dec 30, 2026',
        status: 'In Progress',
        milestones: milestones || 'Project kickoff, engineering inspection, procurement, and site preparation.'
      });
      BD22_DB.set('projects', list);

      await BD22_DB.createProject({ name, customer, targetDate, milestones });

      newProjectModal.classList.remove('active');
      newProjectForm.reset();
      showToast(`New project "${name}" created!`);
      renderAdminProjects();
      renderAdminDashboard();
    });
  }

  // =========================================================================
  // 5. EQUIPMENT & INVENTORY WITH STEPPER (Mockups 41 & 42)
  // =========================================================================
  const equipmentModal = document.getElementById('adminEquipmentModal');

  function renderAdminInventory() {
    const tableBody = document.getElementById('adminInventoryTableBody');
    if (!tableBody) return;

    const list = BD22_DB.get('inventory');
    tableBody.innerHTML = list.map(item => {
      let stockBadge = 'badge-completed';
      if (item.stockStatus === 'Low Stock') stockBadge = 'badge-urgent';

      return `
        <tr data-eq-id="${item.id}">
          <td style="font-weight: 700;">${item.name}</td>
          <td>${item.type}</td>
          <td><strong>${item.quantity}</strong></td>
          <td>${item.customerProject}</td>
          <td><span class="badge-status ${item.serviceStatus === 'Due' ? 'badge-urgent' : 'badge-completed'}">${item.serviceStatus}</span></td>
          <td><span class="date-pill">${item.nextMaintenance}</span></td>
          <td><span class="badge-status ${stockBadge}">${item.stockStatus}</span></td>
          <td><button class="btn btn-outline btn-sm edit-eq-btn">Edit</button></td>
        </tr>
      `;
    }).join('');

    tableBody.querySelectorAll('tr').forEach(row => {
      row.addEventListener('click', (e) => {
        const eqId = row.getAttribute('data-eq-id');
        if (eqId) openEquipmentModal(eqId);
      });
    });
  }

  let currentEquipmentId = null;
  let currentStepperQuantity = 1;

  function openEquipmentModal(eqId) {
    const list = BD22_DB.get('inventory');
    const eq = list.find(i => i.id === eqId);
    if (!eq || !equipmentModal) return;

    currentEquipmentId = eqId;
    currentStepperQuantity = eq.quantity || 1;

    document.getElementById('modalEqName').value = eq.name;
    document.getElementById('modalEqType').value = eq.type;
    document.getElementById('modalEqProject').value = eq.customerProject;
    document.getElementById('modalEqMaintenance').value = eq.nextMaintenance;
    document.getElementById('stepperValue').textContent = currentStepperQuantity;

    equipmentModal.classList.add('active');
  }

  // Stepper handlers (+ and -) Mockup 42
  const stepperMinusBtn = document.getElementById('stepperMinus');
  const stepperPlusBtn = document.getElementById('stepperPlus');
  const stepperDisplay = document.getElementById('stepperValue');

  if (stepperMinusBtn) {
    stepperMinusBtn.addEventListener('click', () => {
      if (currentStepperQuantity > 0) {
        currentStepperQuantity--;
        stepperDisplay.textContent = currentStepperQuantity;
      }
    });
  }

  if (stepperPlusBtn) {
    stepperPlusBtn.addEventListener('click', () => {
      currentStepperQuantity++;
      stepperDisplay.textContent = currentStepperQuantity;
    });
  }

  // Save Equipment Changes
  const saveEquipmentBtn = document.getElementById('btnSaveEquipment');
  if (saveEquipmentBtn) {
    saveEquipmentBtn.addEventListener('click', async () => {
      if (!currentEquipmentId) return;

      const name = document.getElementById('modalEqName').value;
      const type = document.getElementById('modalEqType').value;
      const customerProject = document.getElementById('modalEqProject').value;
      const nextMaintenance = document.getElementById('modalEqMaintenance').value;

      const list = BD22_DB.get('inventory');
      const idx = list.findIndex(i => i.id === currentEquipmentId);
      if (idx !== -1) {
        list[idx].name = name;
        list[idx].type = type;
        list[idx].customerProject = customerProject;
        list[idx].nextMaintenance = nextMaintenance;
        list[idx].quantity = currentStepperQuantity;
        list[idx].stockStatus = currentStepperQuantity <= 2 ? 'Low Stock' : 'Available';
        BD22_DB.set('inventory', list);
      }

      await BD22_DB.saveEquipment({
        id: currentEquipmentId,
        name,
        type,
        customerProject,
        nextMaintenance,
        quantity: currentStepperQuantity
      });

      equipmentModal.classList.remove('active');
      showToast('Inventory record updated!');
      renderAdminInventory();
      renderAdminDashboard();
    });
  }

  // =========================================================================
  // 6. PAYMENT & BILLING (Mockup 43)
  // =========================================================================
  function renderAdminPayments() {
    const tableBody = document.getElementById('adminPaymentsTableBody');
    if (!tableBody) return;

    const list = BD22_DB.get('payments');
    tableBody.innerHTML = list.map(item => {
      let badgeClass = 'badge-completed';
      if (item.status === 'Partial') badgeClass = 'badge-pending';
      if (item.status === 'Overdue') badgeClass = 'badge-urgent';

      return `
        <tr>
          <td class="ref-code">${item.invoice}</td>
          <td style="font-weight: 700;">${item.customer}</td>
          <td>${item.project}</td>
          <td><strong>₱${item.amount.toLocaleString()}</strong></td>
          <td><span class="date-pill">${item.dueDate}</span></td>
          <td><span class="badge-status ${badgeClass}">${item.status}</span></td>
          <td>
            ${item.status !== 'Paid' ? `
              <button class="btn btn-primary btn-sm mark-paid-btn" data-inv="${item.invoice}">Mark Paid</button>
            ` : '<span style="color:#15803d; font-weight:700;">Settled</span>'}
          </td>
        </tr>
      `;
    }).join('');

    tableBody.querySelectorAll('.mark-paid-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const inv = btn.getAttribute('data-inv');
        BD22_DB.payInvoice(inv);
        showToast(`Invoice ${inv} marked as settled!`);
        renderAdminPayments();
        renderAdminDashboard();
      });
    });
  }

  // =========================================================================
  // 7. WARRANTY TRACKING (Mockup 44)
  // =========================================================================
  function renderAdminWarranties(filter = 'Active') {
    const container = document.getElementById('adminWarrantiesList');
    if (!container) return;

    let list = BD22_DB.get('warranties');
    if (filter !== 'All') {
      list = list.filter(w => w.status === filter);
    }

    if (list.length === 0) {
      container.innerHTML = `<div style="padding: 2rem; text-align: center; color: #64748b;">No warranties in "${filter}" status.</div>`;
      return;
    }

    container.innerHTML = list.map(item => {
      let badgeClass = 'badge-completed';
      if (item.status === 'Expiring Soon') badgeClass = 'badge-pending';
      if (item.status === 'Expired') badgeClass = 'badge-urgent';

      return `
        <div class="portal-row-card">
          <div>
            <div class="row-card-title">${item.title} <span style="font-size: 0.9rem; font-weight: 500; color:#64748b;">(${item.ref})</span></div>
            <div class="row-card-subtitle">Client: <strong>${item.customer}</strong> • Coverage: ${item.coverage}</div>
            <div style="font-size: 0.85rem; color:#64748b; margin-top: 0.4rem;">
              Installed: ${item.installDate} • Expires: <strong>${item.expiryDate}</strong>
            </div>
          </div>
          <span class="badge-status ${badgeClass}">${item.status}</span>
        </div>
      `;
    }).join('');
  }

  // Warranty tab switching
  const warrantyTabs = document.querySelectorAll('#adminWarrantyTabs .tab-btn');
  warrantyTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      warrantyTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderAdminWarranties(tab.getAttribute('data-tab'));
    });
  });

  // =========================================================================
  // 8. MAINTENANCE SCHEDULE (Mockup 45)
  // =========================================================================
  function renderAdminMaintenance(filter = 'All') {
    const container = document.getElementById('adminMaintenanceList');
    if (!container) return;

    let list = BD22_DB.get('maintenance');
    if (filter === 'Overdue') list = list.filter(m => m.status === 'Overdue');
    if (filter === 'Due') list = list.filter(m => m.status === 'Due');
    if (filter === 'Upcoming') list = list.filter(m => m.status === 'Upcoming');

    container.innerHTML = list.map(item => {
      let badgeClass = 'badge-scheduled';
      if (item.status === 'Overdue') badgeClass = 'badge-urgent';
      if (item.status === 'Due') badgeClass = 'badge-pending';

      return `
        <div class="portal-row-card">
          <div>
            <div class="row-card-title">${item.title}</div>
            <div class="row-card-subtitle">Location: <strong>${item.customer}</strong> • Technician: <strong>${item.technician}</strong></div>
            <div style="font-size: 0.85rem; color:#64748b; margin-top: 0.35rem;">Scheduled Date: <strong>${item.scheduledDate}</strong></div>
          </div>
          <span class="badge-status ${badgeClass}">${item.status}</span>
        </div>
      `;
    }).join('');
  }

  // Maintenance tab switching
  const maintTabs = document.querySelectorAll('#adminMaintTabs .tab-btn');
  maintTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      maintTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderAdminMaintenance(tab.getAttribute('data-tab'));
    });
  });

  // =========================================================================
  // 9. SERVICE HISTORY (Mockup 46)
  // =========================================================================
  function renderAdminHistory() {
    const container = document.getElementById('adminHistoryTimeline');
    if (!container) return;

    const history = BD22_DB.get('serviceHistory') || [];
    if (history.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #64748b;">
          No company service history records logged yet.
        </div>
      `;
      return;
    }

    container.innerHTML = history.map(item => `
      <div class="timeline-item">
        <div class="timeline-check-icon">✓</div>
        <div>
          <div class="timeline-text"><strong>${item.title || item.eventType}</strong> — ${item.description || ''}</div>
          <div style="font-size: 0.85rem; color: #64748b; margin-top: 0.25rem;">
            ${item.date} • <span class="badge-status badge-completed" style="font-size: 0.75rem; padding: 0.15rem 0.5rem;">${item.badge || 'Verified'}</span> • Logged by: ${item.performedBy || item.loggedBy || 'Operations Lead'}
          </div>
        </div>
      </div>
    `).join('');
  }

  // =========================================================================
  // 10. SYSTEM NOTIFICATIONS (Mockup 47)
  // =========================================================================
  function renderAdminNotifications() {
    const container = document.getElementById('adminNotificationsList');
    if (!container) return;

    const notifs = BD22_DB.get('adminNotifications');
    container.innerHTML = notifs.map(n => {
      let badgeClass = 'badge-neutral';
      if (n.status === 'Overdue') badgeClass = 'badge-urgent';
      if (n.status === 'New') badgeClass = 'badge-pending';

      return `
        <div class="message-item">
          <div class="message-body">
            <span class="message-title">${n.title}</span>
            <span class="message-desc">System notification • Auto generated from BD22 dispatch monitor</span>
          </div>
          <span class="badge-status ${badgeClass}">${n.status}</span>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // 11. PROFILE & SETTINGS: VIEW & EDIT TOGGLE (Mockups 48 & 49)
  // =========================================================================
  const profileViewCard = document.getElementById('adminProfileViewMode');
  const profileEditCard = document.getElementById('adminProfileEditMode');
  const btnEditProfile = document.getElementById('btnToggleProfileEdit');
  const btnSaveProfile = document.getElementById('btnSaveProfile');
  const btnCancelProfile = document.getElementById('btnCancelProfile');

  function renderAdminProfileView() {
    const prof = BD22_DB.get('adminProfile') || {};
    const user = BD22_DB.get('currentUser') || {};

    const adminName = user.full_name || user.name || prof.name || 'Engr. Roberto Dela Cruz';
    const adminEmail = user.email || prof.email || 'admin@bd22fire.com';
    const adminPhone = user.phone || prof.phone || '+63 917 555 8899';
    const adminFname = user.first_name || prof.firstName || 'Roberto';
    const adminLname = user.last_name || prof.lastName || 'Dela Cruz';

    // Populate View Mode
    const nameEl = document.getElementById('viewAdminName');
    const roleEl = document.getElementById('viewAdminRole');
    const phoneEl = document.getElementById('viewAdminPhone');
    const emailEl = document.getElementById('viewAdminEmail');
    const dateEl = document.getElementById('viewAdminDate');

    if (nameEl) nameEl.textContent = adminName;
    if (roleEl) roleEl.textContent = 'SYSTEM ADMINISTRATOR';
    if (phoneEl) phoneEl.textContent = adminPhone;
    if (emailEl) emailEl.textContent = adminEmail;
    if (dateEl) dateEl.textContent = prof.createdDate || 'Oct 2026';

    // Populate Edit Mode fields
    const fnInput = document.getElementById('editAdminFirstName');
    const lnInput = document.getElementById('editAdminLastName');
    const phInput = document.getElementById('editAdminPhone');
    const emInput = document.getElementById('editAdminEmail');

    if (fnInput) fnInput.value = adminFname;
    if (lnInput) lnInput.value = adminLname;
    if (phInput) phInput.value = adminPhone;
    if (emInput) emInput.value = adminEmail;

    // Show View Mode by default
    if (profileViewCard && profileEditCard) {
      profileViewCard.style.display = 'block';
      profileEditCard.style.display = 'none';
    }
  }

  if (btnEditProfile) {
    btnEditProfile.addEventListener('click', () => {
      if (profileViewCard && profileEditCard) {
        profileViewCard.style.display = 'none';
        profileEditCard.style.display = 'block';
      }
    });
  }

  if (btnCancelProfile) {
    btnCancelProfile.addEventListener('click', () => {
      if (profileViewCard && profileEditCard) {
        profileViewCard.style.display = 'block';
        profileEditCard.style.display = 'none';
      }
    });
  }

  if (btnSaveProfile) {
    btnSaveProfile.addEventListener('click', async (e) => {
      e.preventDefault();
      const fn = document.getElementById('editAdminFirstName').value.trim();
      const ln = document.getElementById('editAdminLastName').value.trim();
      const ph = document.getElementById('editAdminPhone').value.trim();
      const em = document.getElementById('editAdminEmail').value.trim();

      const updated = {
        name: `${fn} ${ln}`,
        firstName: fn,
        lastName: ln,
        phone: ph,
        email: em,
        createdDate: 'August 1, 2026',
        role: 'ADMIN'
      };

      BD22_DB.set('adminProfile', updated);
      await BD22_DB.saveProfile({ firstName: fn, lastName: ln, phone: ph, email: em });
      showToast('Admin profile updated successfully!');
      renderAdminProfileView();
    });
  }
});
