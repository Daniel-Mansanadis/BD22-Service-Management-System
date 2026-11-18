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
    const inquiries = BD22_DB.get('inquiries') || [];
    const serviceRequests = BD22_DB.get('serviceRequests') || [];
    const projects = BD22_DB.get('projects') || [];
    const payments = BD22_DB.get('payments') || [];
    const warranties = BD22_DB.get('warranties') || [];
    const maintenance = BD22_DB.get('maintenance') || [];
    const inventory = BD22_DB.get('inventory') || [];

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
        if (p.status !== 'Paid') {
          const itemBal = p.balance !== undefined ? Number(p.balance) : Number(p.amount);
          bal += (itemBal || 0);
        }
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
      const notifs = BD22_DB.get('adminNotifications') || [];
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

    const inqs = BD22_DB.get('inquiries') || [];
    const srs = BD22_DB.get('serviceRequests') || [];

    // Merge both collections by reference code
    const combinedMap = new Map();
    inqs.forEach(i => {
      const ref = i.reference || i.reference_no;
      if (ref) combinedMap.set(ref, i);
    });
    srs.forEach(s => {
      const ref = s.reference || s.reference_no;
      if (ref) {
        if (combinedMap.has(ref)) {
          combinedMap.set(ref, { ...combinedMap.get(ref), ...s });
        } else {
          combinedMap.set(ref, s);
        }
      }
    });

    let items = Array.from(combinedMap.values());
    const query = (inquiryFilterInput?.value || '').toLowerCase().trim();
    const statusVal = inquiryStatusFilter?.value || 'All';

    if (query) {
      items = items.filter(i => 
        (i.customer || i.customer_name || '').toLowerCase().includes(query) ||
        (i.service || i.service_type || '').toLowerCase().includes(query) ||
        (i.reference || i.reference_no || '').toLowerCase().includes(query) ||
        (i.establishment_name || '').toLowerCase().includes(query) ||
        (i.site_address || '').toLowerCase().includes(query) ||
        (i.assignedStaff && i.assignedStaff.toLowerCase().includes(query))
      );
    }

    if (statusVal !== 'All') {
      items = items.filter(i => (i.status || 'Pending Review') === statusVal);
    }

    if (items.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2.5rem; color:#64748b;">No matching inquiries found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = items.map(item => {
      const ref = item.reference || item.reference_no || '';
      const badgeClass = getAdminStatusBadgeClass(item.status);
      const estLabel = item.establishment_name ? `<div style="font-size:0.8rem; color:#64748b; font-weight:normal; margin-top:0.15rem;">Site: ${item.establishment_name}</div>` : '';
      const displayDate = item.preferred_date || item.dateSubmitted || 'Recent';

      return `
        <tr data-ref="${ref}" style="cursor:pointer;">
          <td>
            <div style="font-weight: 700; color:#1e293b;">${item.customer || item.customer_name || 'Valued Customer'}</div>
            ${estLabel}
          </td>
          <td>
            <div style="font-weight: 600; color:#1e293b;">${item.service || item.service_type || 'General Inquiry'}</div>
            ${item.description ? `<div style="font-size:0.78rem; color:#64748b; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.description}</div>` : ''}
          </td>
          <td><span class="date-pill">${displayDate}</span></td>
          <td><span class="badge-status ${badgeClass}">${item.status || 'Pending Review'}</span></td>
          <td>${item.assignedStaff || 'Unassigned'}</td>
          <td style="color: #64748b;">${item.lastUpdate || 'Recent'}</td>
          <td><span class="row-action-arrow">›</span></td>
        </tr>
      `;
    }).join('');

    // Attach row click to open Full Service Request / Assessment Modal (displaying all inputs)
    tableBody.querySelectorAll('tr').forEach(row => {
      row.addEventListener('click', () => {
        const ref = row.getAttribute('data-ref');
        if (ref) openAdminServiceRequestModal(ref);
      });
    });
  }

  if (inquiryFilterInput) inquiryFilterInput.addEventListener('input', renderAdminInquiries);
  if (inquiryStatusFilter) inquiryStatusFilter.addEventListener('change', renderAdminInquiries);

  function openInquiryDetailModal(reference) {
    openAdminServiceRequestModal(reference);
  }

  // Save Inquiry Edits
  const saveInquiryBtn = document.getElementById('btnSaveInquiry');
  if (saveInquiryBtn) {
    saveInquiryBtn.addEventListener('click', async () => {
      const ref = inquiryModal.getAttribute('data-active-ref');
      if (!ref) return;

      const updatedService = document.getElementById('modalInqServiceSelect').value;
      const updatedStatus = document.getElementById('modalInqStatusSelect').value;
      const updatedStaff = document.getElementById('modalInqStaffSelect').value;
      const updatedNotes = document.getElementById('modalInqNotes').value;

      await BD22_DB.updateServiceRequest(ref, {
        service: updatedService,
        status: updatedStatus,
        assignedStaff: updatedStaff,
        trackingNote: updatedNotes
      });

      inquiryModal.classList.remove('active');
      showToast(`Inquiry ${ref} updated successfully!`);
      renderAdminInquiries();
      renderAdminServiceRequests();
      renderAdminDashboard();
    });
  }

  function getAdminStatusBadgeClass(status) {
    switch (status) {
      case 'Under Assessment':
        return 'badge-assessment';
      case 'Quotation Prepared':
        return 'badge-quotation';
      case 'Approved':
        return 'badge-approved';
      case 'Scheduled':
        return 'badge-scheduled';
      case 'In Progress':
        return 'badge-in-progress';
      case 'Completed':
        return 'badge-completed';
      case 'Urgent':
      case 'Cancelled':
        return 'badge-urgent';
      case 'Pending Review':
      default:
        return 'badge-pending';
    }
  }

  // =========================================================================
  // 3. SERVICE REQUESTS (Mockup 36 Enhanced)
  // =========================================================================
  const srSearchInput = document.getElementById('adminServiceReqSearch');
  const srStatusFilter = document.getElementById('adminServiceReqStatusFilter');
  const adminSrModal = document.getElementById('adminServiceRequestModal');

  function renderAdminServiceRequests() {
    const tableBody = document.getElementById('adminServiceRequestsTableBody');
    if (!tableBody) return;

    const srs = BD22_DB.get('serviceRequests') || [];
    const inqs = BD22_DB.get('inquiries') || [];

    // Combine both collections, ensuring all service requests are included
    const combinedMap = new Map();
    inqs.forEach(i => {
      const ref = i.reference || i.reference_no;
      if (ref && (ref.startsWith('BD22-REQ') || i.establishment_name || i.building_type)) {
        combinedMap.set(ref, i);
      }
    });
    srs.forEach(s => {
      const ref = s.reference || s.reference_no;
      if (ref) {
        if (combinedMap.has(ref)) {
          combinedMap.set(ref, { ...combinedMap.get(ref), ...s });
        } else {
          combinedMap.set(ref, s);
        }
      }
    });

    let list = Array.from(combinedMap.values());
    const searchVal = (srSearchInput?.value || '').toLowerCase().trim();
    const statusVal = srStatusFilter?.value || 'All';

    if (searchVal) {
      list = list.filter(item => 
        (item.reference || item.reference_no || '').toLowerCase().includes(searchVal) ||
        (item.customer || item.customer_name || '').toLowerCase().includes(searchVal) ||
        (item.establishment_name || '').toLowerCase().includes(searchVal) ||
        (item.service || item.service_type || '').toLowerCase().includes(searchVal) ||
        (item.site_address || '').toLowerCase().includes(searchVal) ||
        (item.assignedStaff && item.assignedStaff.toLowerCase().includes(searchVal))
      );
    }

    if (statusVal !== 'All') {
      list = list.filter(item => (item.status || 'Pending Review') === statusVal);
    }

    if (list.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 3rem 1.5rem; color:#64748b;">No matching service requests found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = list.map(item => {
      const ref = item.reference || item.reference_no || '';
      const badgeClass = getAdminStatusBadgeClass(item.status);
      const siteDisplay = item.establishment_name || 'Project Site';
      const addressShort = item.site_address ? `<div style="font-size:0.78rem; color:#64748b; margin-top:0.15rem;">${item.site_address}</div>` : '';
      const displayDate = item.preferred_date || item.dateSubmitted || 'Recent';
      const scopeSummary = item.description || item.notes || '';

      return `
        <tr data-sr-ref="${ref}" style="cursor:pointer;">
          <td class="ref-code">${ref}</td>
          <td>
            <div style="font-weight: 700; color:#1e293b;">${siteDisplay}</div>
            <div style="font-size: 0.82rem; color: #475569;">${item.customer || item.customer_name || 'Valued Customer'}</div>
            ${addressShort}
          </td>
          <td>
            <div style="font-weight: 600; color:#1e293b;">${item.service || item.service_type || 'Fire Protection'}</div>
            <div style="font-size: 0.8rem; color:#64748b; max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${scopeSummary}</div>
          </td>
          <td><span class="date-pill">${displayDate}</span></td>
          <td><span class="badge-status ${badgeClass}">${item.status || 'Pending Review'}</span></td>
          <td style="font-size:0.9rem; color:#334155;">${item.assignedStaff || 'Unassigned'}</td>
          <td>
            <button class="btn btn-outline btn-sm btn-open-sr" data-sr-ref="${ref}" style="padding:0.3rem 0.75rem; font-size:0.8rem;">
              Assess →
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tableBody.querySelectorAll('tr').forEach(row => {
      row.addEventListener('click', (e) => {
        const ref = row.getAttribute('data-sr-ref');
        if (ref) openAdminServiceRequestModal(ref);
      });
    });
  }

  if (srSearchInput) srSearchInput.addEventListener('input', renderAdminServiceRequests);
  if (srStatusFilter) srStatusFilter.addEventListener('change', renderAdminServiceRequests);

  function openAdminServiceRequestModal(reference) {
    if (!adminSrModal) return;

    const srs = BD22_DB.get('serviceRequests') || [];
    const inqs = BD22_DB.get('inquiries') || [];
    let item = srs.find(r => r.reference === reference || r.reference_no === reference);
    if (!item) {
      item = inqs.find(r => r.reference === reference || r.reference_no === reference);
    }
    if (!item) return;

    // Unpack notes if JSON string
    let meta = {};
    const rawNotes = item.notes || item.trackingNote || item.tracking_note || '';
    if (typeof rawNotes === 'string' && (rawNotes.startsWith('{') || rawNotes.startsWith('['))) {
      try {
        meta = JSON.parse(rawNotes);
      } catch (e) {}
    }
    const merged = { ...meta, ...item };

    // Dynamic Title
    const modalTitle = document.getElementById('adminSrModalTitle');
    if (modalTitle) {
      modalTitle.textContent = (merged.reference || '').startsWith('BD22-REQ') 
        ? `Assess & Manage Service Request: ${merged.reference}` 
        : `Assess & Manage Inquiry: ${merged.reference || 'INQ'}`;
    }

    // Header Summary
    const refEl = document.getElementById('adminSrRef');
    if (refEl) refEl.textContent = merged.reference || merged.reference_no || 'BD22-REQ';
    
    const custEl = document.getElementById('adminSrCustomer');
    if (custEl) custEl.textContent = merged.customer || merged.customer_name || 'Valued Customer';
    
    const dateEl = document.getElementById('adminSrDate');
    if (dateEl) dateEl.textContent = `Submitted: ${merged.dateSubmitted || merged.created_at || 'Recent'}`;
    
    const badge = document.getElementById('adminSrStatusBadge');
    if (badge) {
      const curStatus = merged.status || 'Pending Review';
      badge.textContent = curStatus;
      badge.className = 'badge-status ' + getAdminStatusBadgeClass(curStatus);
    }

    // Block 1: Service Scope & Customer Urgency
    const srvEl = document.getElementById('adminSrServiceType');
    if (srvEl) srvEl.textContent = merged.service || merged.service_type || merged.service_name || 'Fire Protection Service';
    
    const urgEl = document.getElementById('adminSrUrgency');
    if (urgEl) urgEl.textContent = merged.urgency || 'Standard';
    
    const prefEl = document.getElementById('adminSrPreferredTimeline');
    if (prefEl) {
      const pDate = merged.preferred_date || '';
      const pTime = merged.preferred_timeline || '';
      if (pDate && pTime) {
        prefEl.textContent = `${pDate} (${pTime})`;
      } else if (pDate) {
        prefEl.textContent = pDate;
      } else if (pTime) {
        prefEl.textContent = pTime;
      } else {
        prefEl.textContent = 'Standard Timeline';
      }
    }
    
    const descEl = document.getElementById('adminSrDescription');
    if (descEl) descEl.textContent = merged.description || merged.message || merged.trackingNote || 'Inspection and assessment requested.';

    // Block 2: Site Location & Building Specifications
    const estEl = document.getElementById('adminSrEstName');
    if (estEl) estEl.textContent = merged.establishment_name || merged.customer || 'Project Site';
    
    const bldgEl = document.getElementById('adminSrBuildingDetails');
    if (bldgEl) {
      const bType = merged.building_type || 'Commercial Facility';
      const bFloors = merged.floors ? ` • ${merged.floors}` : '';
      bldgEl.textContent = `${bType}${bFloors}`;
    }
    
    const addrEl = document.getElementById('adminSrSiteAddress');
    if (addrEl) addrEl.textContent = merged.site_address || (merged.city ? merged.city : 'Facility address on file');

    const mapsWrapper = document.getElementById('adminSrMapsLinkWrapper');
    const mapsLink = document.getElementById('adminSrMapsLink');
    if (mapsWrapper && mapsLink) {
      if (merged.google_maps_link) {
        mapsLink.href = merged.google_maps_link;
        mapsWrapper.style.display = 'block';
      } else {
        mapsWrapper.style.display = 'none';
      }
    }

    // Block 3: Site Contact Person
    const cNameEl = document.getElementById('adminSrContactName');
    if (cNameEl) cNameEl.textContent = merged.contact_name || merged.customer || 'Site Contact';
    
    const cPosEl = document.getElementById('adminSrContactPosition');
    if (cPosEl) cPosEl.textContent = merged.contact_position || 'Project Coordinator';
    
    const cPhoneEl = document.getElementById('adminSrContactPhone');
    if (cPhoneEl) cPhoneEl.textContent = merged.contact_phone || merged.phone || 'Phone on file';
    
    const cEmailEl = document.getElementById('adminSrContactEmail');
    if (cEmailEl) cEmailEl.textContent = merged.contact_email || merged.email || 'Email on file';

    // Block 4: Attachments & Concerns
    const attachList = document.getElementById('adminSrAttachmentsList');
    if (attachList) {
      if (merged.attachments && Array.isArray(merged.attachments) && merged.attachments.length > 0) {
        attachList.innerHTML = merged.attachments.map(att => `
          <span class="attachment-pill">
            ${att.type === 'floor_plan' ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:3px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:3px;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'} ${att.name} ${att.size ? '(' + Math.round(att.size / 1024) + ' KB)' : ''}
          </span>
        `).join('');
      } else {
        attachList.innerHTML = '<span style="font-size:0.85rem; color:#94a3b8;">No attachments provided by customer.</span>';
      }
    }

    const concernsWrapper = document.getElementById('adminSrConcernsWrapper');
    const concernsText = document.getElementById('adminSrOtherConcerns');
    if (concernsWrapper && concernsText) {
      if (merged.additional_concerns) {
        concernsText.textContent = merged.additional_concerns;
        concernsWrapper.style.display = 'block';
      } else {
        concernsWrapper.style.display = 'none';
      }
    }

    // Block 5: Technical Assessment Controls
    const selStatus = document.getElementById('adminSrStatusSelect');
    if (selStatus) selStatus.value = merged.status || 'Pending Review';

    const selStaff = document.getElementById('adminSrStaffSelect');
    if (selStaff) selStaff.value = merged.assignedStaff || merged.assigned_staff || 'M. Velasco';

    const confirmedDateInput = document.getElementById('adminSrConfirmedDate');
    if (confirmedDateInput) {
      confirmedDateInput.value = merged.confirmed_schedule || merged.scheduled_date || merged.preferred_date || '';
    }

    const quoteInput = document.getElementById('adminSrQuotationAmount');
    if (quoteInput) {
      quoteInput.value = merged.quotation_amount ? Number(merged.quotation_amount) : '';
    }

    const notesInput = document.getElementById('adminSrAssessmentNotes');
    if (notesInput) {
      notesInput.value = merged.assessment_notes || (typeof merged.notes === 'string' && !merged.notes.startsWith('{') ? merged.notes : '') || '';
    }

    adminSrModal.setAttribute('data-active-sr-ref', reference);
    adminSrModal.classList.add('active');
  }

  // Save Service Request Technical Assessment
  const saveSrBtn = document.getElementById('btnSaveServiceReqAssessment');
  if (saveSrBtn) {
    saveSrBtn.addEventListener('click', async () => {
      const ref = adminSrModal.getAttribute('data-active-sr-ref');
      if (!ref) return;

      saveSrBtn.disabled = true;
      saveSrBtn.textContent = 'Saving Assessment...';

      const updatedStatus = document.getElementById('adminSrStatusSelect').value;
      const updatedStaff = document.getElementById('adminSrStaffSelect').value;
      const confirmedDate = document.getElementById('adminSrConfirmedDate').value;
      const quotationAmount = document.getElementById('adminSrQuotationAmount').value;
      const assessmentNotes = document.getElementById('adminSrAssessmentNotes').value;

      await BD22_DB.updateServiceRequest(ref, {
        status: updatedStatus,
        assignedStaff: updatedStaff,
        confirmedSchedule: confirmedDate,
        quotationAmount: quotationAmount,
        assessmentNotes: assessmentNotes
      });

      adminSrModal.classList.remove('active');
      saveSrBtn.disabled = false;
      saveSrBtn.textContent = 'Save Assessment & Update Status';

      showToast(`Record ${ref} updated to "${updatedStatus}" successfully!`);
      renderAdminInquiries();
      renderAdminServiceRequests();
      renderAdminDashboard();
    });
  }

  // =========================================================================
  // 4. PROJECT MANAGEMENT (Mockups 37, 38, 39, 40 Enhanced)
  // =========================================================================
  const projectDetailModal = document.getElementById('adminProjectDetailModal');
  const newProjectModal = document.getElementById('adminNewProjectModal');
  const adminProjectSearch = document.getElementById('adminProjectSearch');
  const adminProjectStatusFilter = document.getElementById('adminProjectStatusFilter');

  let activeAdminProjectId = null;
  let newProjTasks = [];

  function resetNewProjectTasks() {
    newProjTasks = [
      { id: 't1', title: 'Site Inspection & Engineering Assessment', description: 'Comprehensive inspection of building architecture and fire riser network.', deadline: '', status: 'Pending', completed: false },
      { id: 't2', title: 'BFP Plan Compliance & Permit Verification', description: 'Permit verification and alignment with Fire Code of the Philippines (RA 9514).', deadline: '', status: 'Pending', completed: false },
      { id: 't3', title: 'Equipment Procurement & Delivery', description: 'UL/FM valves, risers, and delivery to installation site.', deadline: '', status: 'Pending', completed: false },
      { id: 't4', title: 'System Installation & Riser Piping', description: 'Mechanical installation, pipe cutting, threading, and bracket hanging.', deadline: '', status: 'Pending', completed: false },
      { id: 't5', title: 'Hydrostatic Pressure Test & Commissioning', description: '200 PSI hydrostatic pressure testing witnessed by engineer.', deadline: '', status: 'Pending', completed: false },
      { id: 't6', title: 'FSIC Certification & Official Turn-over', description: 'Final BFP clearance, warranty certification, and client sign-off.', deadline: '', status: 'Pending', completed: false }
    ];
    renderNewProjTasksList();
  }

  function renderNewProjTasksList() {
    const container = document.getElementById('newProjTasksList');
    if (!container) return;

    if (newProjTasks.length === 0) {
      container.innerHTML = '<div style="font-size:0.85rem; color:#94a3b8; text-align:center; padding:1.25rem; border:1px dashed #cbd5e1; border-radius:8px;">No custom milestones added yet. Use the inputs above to add milestones.</div>';
      return;
    }

    container.innerHTML = newProjTasks.map((t, idx) => `
      <div class="task-item-row" style="padding:0.75rem 1rem; margin-bottom:0.5rem; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; display:flex; justify-content:space-between; align-items:flex-start; gap:0.75rem;">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
            <span style="font-weight:700; color:#a61c14; font-size:0.85rem;">#${idx + 1}</span>
            <span style="font-size:0.9rem; color:#1e293b; font-weight:600;">${t.title}</span>
            <span class="badge-status ${t.completed ? 'badge-completed' : 'badge-pending'}" style="font-size:0.7rem; padding:0.15rem 0.55rem;">
              ${t.completed ? 'Completed' : 'Pending'}
            </span>
          </div>
          ${t.description ? `<div style="font-size:0.82rem; color:#64748b; margin-top:0.25rem; line-height:1.4;">${t.description}</div>` : ''}
        </div>
        <div style="display:flex; align-items:center; gap:0.6rem; flex-shrink:0;">
          ${t.deadline ? `<span class="date-pill" style="font-size:0.75rem;">Due: ${t.deadline}</span>` : '<span style="font-size:0.75rem; color:#94a3b8;">No date</span>'}
          <button type="button" class="btn btn-outline btn-sm btn-del-task" data-task-idx="${idx}" title="Remove Milestone" style="padding:0.2rem 0.5rem; font-size:0.8rem; color:#dc2626; border-color:#fca5a5;">
            &times; Remove
          </button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-del-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const idx = Number(btn.getAttribute('data-task-idx'));
        newProjTasks.splice(idx, 1);
        renderNewProjTasksList();
      });
    });
  }

  // Populate registered customer select dropdown strictly from database / registered accounts
  async function populateNewProjCustomerSelect() {
    const select = document.getElementById('newProjCustomerSelect');
    if (!select) return;

    let customers = [];
    if (typeof BD22_DB.fetchRegisteredCustomersFromDB === 'function') {
      customers = await BD22_DB.fetchRegisteredCustomersFromDB();
    }
    if (!customers || customers.length === 0) {
      customers = BD22_DB.getRegisteredCustomers() || [];
    }

    if (customers.length === 0) {
      select.innerHTML = `<option value="" disabled selected>No registered customer accounts found. Customer must register first.</option>`;
      const custInput = document.getElementById('newProjCustomer');
      const userIdInput = document.getElementById('newProjUserId');
      if (custInput) custInput.value = '';
      if (userIdInput) userIdInput.value = '';
      return;
    }

    select.innerHTML = `
      <option value="">-- Choose Registered Customer Account (Required) --</option>
      ${customers.map(c => `
        <option value="${c.user_id || ''}" data-name="${c.name || ''}" data-company="${c.company || ''}" data-email="${c.email || ''}">
          ${c.name}${c.company ? ' (' + c.company + ')' : ''} [${c.email || 'Registered Customer'}]
        </option>
      `).join('')}
    `;

    select.onchange = () => {
      const val = select.value;
      const custInput = document.getElementById('newProjCustomer');
      const userIdInput = document.getElementById('newProjUserId');

      select.style.borderColor = '';

      if (!val) {
        if (userIdInput) userIdInput.value = '';
        if (custInput) custInput.value = '';
      } else {
        const opt = select.selectedOptions[0];
        const comp = opt.getAttribute('data-company');
        const name = opt.getAttribute('data-name');
        const email = opt.getAttribute('data-email');
        if (custInput) custInput.value = comp || name || email || 'Commercial Client';
        if (userIdInput) userIdInput.value = val;
      }
    };
  }

  // Open New Project Modal
  const openNewProjBtn = document.getElementById('btnOpenNewProject');
  if (openNewProjBtn && newProjectModal) {
    openNewProjBtn.addEventListener('click', async () => {
      // Set project code preview
      const preview = document.getElementById('newProjCodePreview');
      if (preview) preview.textContent = BD22_DB.generateProjectCode();

      // Populate registered customers from DB
      await populateNewProjCustomerSelect();

      // Set default dates
      const startDateInput = document.getElementById('newProjStartDate');
      const targetDateInput = document.getElementById('newProjDate');
      const now = new Date();
      if (startDateInput && !startDateInput.value) {
        startDateInput.value = now.toISOString().split('T')[0];
      }
      if (targetDateInput && !targetDateInput.value) {
        const target = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
        targetDateInput.value = target.toISOString().split('T')[0];
      }

      // Slider listener
      const progSlider = document.getElementById('newProjProgress');
      const progVal = document.getElementById('newProjProgressVal');
      if (progSlider && progVal) {
        progSlider.value = 0;
        progVal.textContent = '0%';
        progSlider.oninput = () => {
          progVal.textContent = `${progSlider.value}%`;
        };
      }

      // Reset milestones
      resetNewProjectTasks();

      newProjectModal.classList.add('active');
    });
  }

  // Add Task / Milestone button in New Project Modal
  const btnAddProjTask = document.getElementById('btnAddProjTask');
  if (btnAddProjTask) {
    btnAddProjTask.addEventListener('click', (e) => {
      e.preventDefault();
      const titleInput = document.getElementById('newProjTaskTitle');
      const dateInput = document.getElementById('newProjTaskDeadline');
      const descInput = document.getElementById('newProjTaskDesc');
      const title = (titleInput?.value || '').trim();
      const deadline = dateInput?.value || '';
      const description = (descInput?.value || '').trim();

      if (!title) {
        showToast('Please enter a milestone title.');
        if (titleInput) titleInput.focus();
        return;
      }

      newProjTasks.push({
        id: 'ms-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        title,
        deadline,
        description,
        status: 'Pending',
        completed: false
      });

      if (titleInput) titleInput.value = '';
      if (dateInput) dateInput.value = '';
      if (descInput) descInput.value = '';
      renderNewProjTasksList();
      showToast(`Milestone "${title}" added.`);
    });
  }

  // Submit New Project Form
  const newProjectForm = document.getElementById('newProjectForm');
  if (newProjectForm) {
    newProjectForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const select = document.getElementById('newProjCustomerSelect');
      const userId = document.getElementById('newProjUserId')?.value || null;
      if (!userId) {
        showToast('Please select a valid registered customer account. Projects must be assigned to an existing registered customer.');
        if (select) {
          select.focus();
          select.style.borderColor = '#ef4444';
        }
        return;
      }

      const submitBtn = document.getElementById('btnSubmitNewProject');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Project & Billing...';
      }

      const name = document.getElementById('newProjName')?.value.trim() || 'Fire Protection Project';
      const customer = document.getElementById('newProjCustomer')?.value.trim() || 'Commercial Client';
      const startDate = document.getElementById('newProjStartDate')?.value || '';
      const targetDate = document.getElementById('newProjDate')?.value || '';
      const manager = document.getElementById('newProjManager')?.value || 'Engr. M. Velasco';
      const team = document.getElementById('newProjTeam')?.value || 'Team Alpha (Operations)';
      const status = document.getElementById('newProjStatus')?.value || 'Not Started';
      const budget = Number(document.getElementById('newProjBudget')?.value || 0);
      const progress = Number(document.getElementById('newProjProgress')?.value || 0);
      const description = document.getElementById('newProjDescription')?.value.trim() || '';
      const milestones = document.getElementById('newProjMilestones')?.value.trim() || '';
      const notes = document.getElementById('newProjNotes')?.value.trim() || '';

      const res = await BD22_DB.createProject({
        name,
        customer,
        user_id: userId,
        startDate,
        targetDate,
        manager,
        team,
        status,
        budget,
        progress,
        description,
        milestones,
        tasks: newProjTasks,
        notes
      });

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Project & Generate Invoice';
      }

      if (res && res.success) {
        newProjectModal.classList.remove('active');
        newProjectForm.reset();
        showToast(`Project ${res.project.project_code} created and linked Invoice ${res.invoice.invoice_no} generated!`);
        renderAdminProjects();
        renderAdminPayments();
        renderAdminDashboard();
      } else {
        showToast(`Project creation notice: ${res?.error || 'Saved to cache'}`);
      }
    });
  }

  // Render Projects Grid
  function renderAdminProjects() {
    const container = document.getElementById('adminProjectsGrid');
    if (!container) return;

    let projects = BD22_DB.get('projects') || [];
    const query = (adminProjectSearch?.value || '').toLowerCase().trim();
    const statusVal = adminProjectStatusFilter?.value || 'All';

    if (query) {
      projects = projects.filter(p => 
        (p.name || '').toLowerCase().includes(query) ||
        (p.project_code || p.id || '').toLowerCase().includes(query) ||
        (p.customer || p.customer_name || '').toLowerCase().includes(query) ||
        (p.project_manager || p.manager || '').toLowerCase().includes(query) ||
        (p.team || p.assigned_team || '').toLowerCase().includes(query)
      );
    }

    if (statusVal !== 'All') {
      projects = projects.filter(p => (p.status || 'In Progress') === statusVal);
    }

    if (projects.length === 0) {
      container.innerHTML = `
        <div style="grid-column:1 / -1; text-align:center; padding:3.5rem 1.5rem; color:#64748b; background:#ffffff; border-radius:12px; border:1px dashed #cbd5e1;">
          <h4 style="font-weight:700; color:#1e293b; margin-bottom:0.35rem;">No matching projects found</h4>
          <p style="font-size:0.9rem;">Adjust search filters or click "+ New Project" to create a new project with auto-billing.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = projects.map(proj => {
      const projCode = proj.project_code || proj.id || 'BD22-PRJ';
      let badgeClass = 'badge-in-progress';
      if (proj.status === 'Completed') badgeClass = 'badge-completed';
      else if (proj.status === 'Scheduled') badgeClass = 'badge-scheduled';
      else if (proj.status === 'Not Started') badgeClass = 'badge-not-started';
      else if (proj.status === 'On Hold') badgeClass = 'badge-on-hold';

      const budgetFormatted = Number(proj.budget || 0) > 0 ? `₱${Number(proj.budget).toLocaleString()}` : 'Pending Budget';

      let tasksSummary = '';
      if (Array.isArray(proj.tasks) && proj.tasks.length > 0) {
        const done = proj.tasks.filter(t => t.completed).length;
        tasksSummary = `<div style="font-size:0.8rem; color:#64748b; margin-top:0.35rem;">Milestones: <strong>${done} / ${proj.tasks.length} Completed</strong></div>`;
      }

      return `
        <div class="portal-project-card">
          <div class="project-card-header">
            <div>
              <span class="ref-code" style="font-size:0.75rem;">${projCode}</span>
              <h3 class="portal-project-card-title" style="margin-top:0.35rem;">${proj.name}</h3>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.35rem;">
              <span class="badge-status ${badgeClass}">${proj.status}</span>
            </div>
          </div>
          <p class="portal-project-subtitle">Client: <strong>${proj.customer || proj.customer_name}</strong></p>
          
          <div style="font-size:0.85rem; color:#475569; margin-bottom:0.75rem;">
            Lead: <strong>${proj.project_manager || proj.manager || 'Engr. M. Velasco'}</strong> • ${proj.team || proj.assigned_team || 'Team Alpha'}
          </div>

          <div class="progress-track">
            <div class="progress-fill" style="width: ${proj.progress || 0}%;"></div>
          </div>
          <div class="progress-info-row">
            <span>Target: ${proj.targetDate || proj.target_date || 'TBD'}</span>
            <span>${proj.progress || 0}%</span>
          </div>
          ${tasksSummary}

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.25rem; padding-top:0.75rem; border-top:1px solid #f1f5f9;">
            <span style="font-size:0.85rem; color:#475569;">Budget: <strong style="color:#1e293b;">${budgetFormatted}</strong></span>
            <button class="project-details-btn" data-proj-id="${projCode}">Details & Manage →</button>
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

  if (adminProjectSearch) adminProjectSearch.addEventListener('input', renderAdminProjects);
  if (adminProjectStatusFilter) adminProjectStatusFilter.addEventListener('change', renderAdminProjects);

  // Open Admin Project Detail & Management Modal
  function openAdminProjectDetail(pid) {
    const list = BD22_DB.get('projects') || [];
    const proj = list.find(p => (p.project_code || p.id) === pid || p.id === pid);
    if (!proj || !projectDetailModal) return;

    activeAdminProjectId = proj.project_code || proj.id;
    const projCode = proj.project_code || proj.id;

    // Header Info
    const nameEl = document.getElementById('modalProjName');
    if (nameEl) nameEl.textContent = proj.name;

    const codeEl = document.getElementById('modalProjCode');
    if (codeEl) codeEl.textContent = projCode;

    const custEl = document.getElementById('modalProjCustomer');
    if (custEl) custEl.textContent = proj.customer || proj.customer_name;

    const acctEl = document.getElementById('modalProjAccount');
    if (acctEl) {
      acctEl.textContent = proj.user_id ? 'Linked Customer Portal Account' : 'Direct Commercial Client';
    }

    const statBadge = document.getElementById('modalProjStatusBadge');
    if (statBadge) {
      statBadge.textContent = proj.status || 'In Progress';
      let badgeClass = 'badge-in-progress';
      if (proj.status === 'Completed') badgeClass = 'badge-completed';
      else if (proj.status === 'Scheduled') badgeClass = 'badge-scheduled';
      else if (proj.status === 'Not Started') badgeClass = 'badge-not-started';
      else if (proj.status === 'On Hold') badgeClass = 'badge-on-hold';
      statBadge.className = `badge-status ${badgeClass}`;
    }

    const startEl = document.getElementById('modalProjStart');
    if (startEl) startEl.textContent = proj.startDate || proj.start_date || 'Not set';

    const targetEl = document.getElementById('modalProjTarget');
    if (targetEl) targetEl.textContent = proj.targetDate || proj.target_date || 'TBD';

    const actualWrap = document.getElementById('modalProjActualWrap');
    const actualEl = document.getElementById('modalProjActual');
    if (actualWrap && actualEl) {
      if (proj.status === 'Completed' || proj.actualCompletionDate || proj.actual_completion_date) {
        actualEl.textContent = proj.actualCompletionDate || proj.actual_completion_date || 'Completed';
        actualWrap.style.display = 'block';
      } else {
        actualWrap.style.display = 'none';
      }
    }

    const mgrEl = document.getElementById('modalProjManager');
    if (mgrEl) mgrEl.textContent = proj.project_manager || proj.manager || 'Engr. M. Velasco';

    const teamEl = document.getElementById('modalProjTeam');
    if (teamEl) teamEl.textContent = proj.team || proj.assigned_team || 'Team Alpha (Operations)';

    const budgetEl = document.getElementById('modalProjBudget');
    if (budgetEl) budgetEl.textContent = `₱${Number(proj.budget || 0).toLocaleString()}`;

    // Linked Invoice Box
    const payments = BD22_DB.get('payments') || [];
    const inv = payments.find(p => 
      (p.project_id && (p.project_id === projCode || p.project_id === proj.id)) ||
      (p.project_code && (p.project_code === projCode || p.project_code === proj.id)) ||
      (p.invoice && p.invoice === proj.linkedInvoice) ||
      (p.invoice_no && p.invoice_no === proj.linkedInvoice) ||
      (p.project && p.project.toLowerCase() === proj.name.toLowerCase()) ||
      (p.project_name && p.project_name.toLowerCase() === proj.name.toLowerCase())
    );

    const invCodeEl = document.getElementById('modalProjInvoiceCode');
    const invStatusEl = document.getElementById('modalProjInvoiceStatus');
    const invBtn = document.getElementById('modalProjViewInvoiceBtn');

    if (inv) {
      if (invCodeEl) invCodeEl.textContent = inv.invoice || inv.invoice_no;
      if (invStatusEl) {
        invStatusEl.textContent = inv.status;
        invStatusEl.className = `badge-status badge-${inv.status.toLowerCase().replace(/\s+/g, '-')}`;
      }
      if (invBtn) {
        invBtn.onclick = () => {
          projectDetailModal.classList.remove('active');
          openAdminInvoiceModal(inv.invoice || inv.invoice_no);
        };
      }
    } else {
      if (invCodeEl) invCodeEl.textContent = proj.linkedInvoice || 'Pending Bill';
      if (invStatusEl) {
        invStatusEl.textContent = 'Unbilled';
        invStatusEl.className = 'badge-status badge-pending';
      }
      if (invBtn) {
        invBtn.onclick = () => {
          showToast('No separate invoice found for this project.');
        };
      }
    }

    // Progress
    const progValEl = document.getElementById('modalProjProgressVal');
    if (progValEl) progValEl.textContent = `${proj.progress || 0}%`;

    const progFillEl = document.getElementById('modalProjProgressFill');
    if (progFillEl) progFillEl.style.width = `${proj.progress || 0}%`;

    // Descriptions
    const descEl = document.getElementById('modalProjDescription');
    if (descEl) descEl.textContent = proj.description || 'Facility fire protection retrofit and code compliance.';

    const milesEl = document.getElementById('modalProjMilestones');
    if (milesEl) milesEl.textContent = proj.milestones || 'Turnkey engineering milestones on file.';

    // Interactive Milestones Checklist
    renderAdminProjTasksChecklist(proj);

    // Notes
    renderAdminProjNotes(proj);

    // Populate Edit Controls Form
    const editStatus = document.getElementById('editProjStatus');
    if (editStatus) editStatus.value = proj.status || 'In Progress';

    const editPriority = document.getElementById('editProjPriority');
    if (editPriority) editPriority.value = proj.priority || 'Medium';

    const editProgress = document.getElementById('editProjProgress');
    const editProgressDisplay = document.getElementById('editProjProgressDisplay');
    if (editProgress && editProgressDisplay) {
      editProgress.value = proj.progress || 0;
      editProgressDisplay.textContent = `${proj.progress || 0}%`;
      editProgress.oninput = () => {
        editProgressDisplay.textContent = `${editProgress.value}%`;
      };
    }

    const editBudget = document.getElementById('editProjBudget');
    if (editBudget) editBudget.value = proj.budget || 0;

    const editManager = document.getElementById('editProjManager');
    if (editManager) editManager.value = proj.project_manager || proj.manager || '';

    const editTarget = document.getElementById('editProjTargetDate');
    if (editTarget) editTarget.value = proj.target_date || proj.targetDate || '';

    const editActualGroup = document.getElementById('editProjActualDateGroup');
    const editActual = document.getElementById('editProjActualDate');
    if (editActual) editActual.value = proj.actual_completion_date || proj.actualCompletionDate || '';

    if (editStatus && editActualGroup) {
      editActualGroup.style.display = editStatus.value === 'Completed' ? 'block' : 'none';
      editStatus.onchange = () => {
        if (editStatus.value === 'Completed') {
          editActualGroup.style.display = 'block';
          if (editProgress) {
            editProgress.value = 100;
            if (editProgressDisplay) editProgressDisplay.textContent = '100%';
          }
          if (editActual && !editActual.value) {
            editActual.value = new Date().toISOString().split('T')[0];
          }
        } else {
          editActualGroup.style.display = 'none';
        }
      };
    }

    projectDetailModal.classList.add('active');
  }

  function renderAdminProjTasksChecklist(proj) {
    const container = document.getElementById('modalProjTasksContainer');
    if (!container) return;

    if (!Array.isArray(proj.tasks) || proj.tasks.length === 0) {
      container.innerHTML = '<div style="font-size:0.85rem; color:#94a3b8; padding:1rem; text-align:center; border:1px dashed #cbd5e1; border-radius:8px;">No structured milestone tasks recorded for this project.</div>';
      return;
    }

    container.innerHTML = proj.tasks.map((t, idx) => {
      const isDone = !!t.completed;
      const textStyle = isDone ? 'text-decoration: line-through; color: #64748b;' : 'font-weight: 600; color: #1e293b;';
      const deadlineBadge = t.deadline ? `<span class="date-pill" style="font-size:0.75rem;">Due: ${t.deadline}</span>` : '<span style="font-size:0.75rem; color:#94a3b8;">No date</span>';
      const statusBadge = isDone 
        ? `<span class="badge-status badge-completed" style="font-size:0.72rem; padding:0.15rem 0.55rem;">Completed</span>`
        : `<span class="badge-status badge-pending" style="font-size:0.72rem; padding:0.15rem 0.55rem;">Pending</span>`;

      return `
        <div class="task-item-row" style="background:${isDone ? '#f0fdf4' : '#ffffff'}; border-color:${isDone ? '#bbf7d0' : '#e2e8f0'}; padding:0.75rem 1rem; margin-bottom:0.5rem; border-radius:8px; display:block;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:0.6rem; flex-wrap:wrap;">
            <label style="display:flex; align-items:center; gap:0.6rem; cursor:pointer; flex:1; margin:0;">
              <input type="checkbox" class="proj-task-check" data-task-idx="${idx}" ${isDone ? 'checked' : ''} style="width:17px; height:17px; accent-color:#a61c14; cursor:pointer;">
              <span style="${textStyle}">${t.title}</span>
            </label>
            <div style="display:flex; align-items:center; gap:0.6rem;">
              ${deadlineBadge}
              ${statusBadge}
              <button type="button" class="btn btn-outline btn-sm btn-del-modal-task" data-task-idx="${idx}" title="Remove Milestone" style="padding:0.15rem 0.45rem; font-size:0.75rem; color:#dc2626; border-color:#fca5a5;">
                &times;
              </button>
            </div>
          </div>
          ${t.description ? `<div style="font-size:0.82rem; color:#64748b; margin-top:0.35rem; padding-left:1.6rem; line-height:1.4;">${t.description}</div>` : ''}
        </div>
      `;
    }).join('');

    // Toggle Task Checkbox
    container.querySelectorAll('.proj-task-check').forEach(chk => {
      chk.addEventListener('change', async (e) => {
        const idx = Number(chk.getAttribute('data-task-idx'));
        proj.tasks[idx].completed = e.target.checked;
        proj.tasks[idx].status = e.target.checked ? 'Completed' : 'Pending';

        // Auto-recalculate progress
        const total = proj.tasks.length;
        const done = proj.tasks.filter(t => t.completed).length;
        const computedProgress = total > 0 ? Math.round((done / total) * 100) : 0;

        proj.progress = computedProgress;

        // Update UI
        const progValEl = document.getElementById('modalProjProgressVal');
        const progFillEl = document.getElementById('modalProjProgressFill');
        const editProg = document.getElementById('editProjProgress');
        const editProgDisp = document.getElementById('editProjProgressDisplay');

        if (progValEl) progValEl.textContent = `${computedProgress}%`;
        if (progFillEl) progFillEl.style.width = `${computedProgress}%`;
        if (editProg) editProg.value = computedProgress;
        if (editProgDisp) editProgDisp.textContent = `${computedProgress}%`;

        await BD22_DB.updateProject(activeAdminProjectId, {
          tasks: proj.tasks,
          progress: computedProgress
        });

        renderAdminProjTasksChecklist(proj);
        renderAdminProjects();
        renderAdminDashboard();
      });
    });

    // Delete Task / Milestone
    container.querySelectorAll('.btn-del-modal-task').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const idx = Number(btn.getAttribute('data-task-idx'));
        proj.tasks.splice(idx, 1);

        const total = proj.tasks.length;
        const done = proj.tasks.filter(t => t.completed).length;
        const computedProgress = total > 0 ? Math.round((done / total) * 100) : 0;

        proj.progress = computedProgress;

        const progValEl = document.getElementById('modalProjProgressVal');
        const progFillEl = document.getElementById('modalProjProgressFill');
        if (progValEl) progValEl.textContent = `${computedProgress}%`;
        if (progFillEl) progFillEl.style.width = `${computedProgress}%`;

        await BD22_DB.updateProject(activeAdminProjectId, {
          tasks: proj.tasks,
          progress: computedProgress
        });

        renderAdminProjTasksChecklist(proj);
        renderAdminProjects();
        renderAdminDashboard();
        showToast('Milestone removed.');
      });
    });
  }

  // Add Task to existing project
  const btnModalAddTask = document.getElementById('modalProjBtnAddTask');
  if (btnModalAddTask) {
    btnModalAddTask.addEventListener('click', async () => {
      if (!activeAdminProjectId) return;
      const titleInput = document.getElementById('modalProjNewTaskTitle');
      const dateInput = document.getElementById('modalProjNewTaskDeadline');
      const descInput = document.getElementById('modalProjNewTaskDesc');
      const title = (titleInput?.value || '').trim();
      const deadline = dateInput?.value || '';
      const description = (descInput?.value || '').trim();

      if (!title) {
        showToast('Please enter a milestone title.');
        if (titleInput) titleInput.focus();
        return;
      }

      const list = BD22_DB.get('projects') || [];
      const proj = list.find(p => (p.project_code || p.id) === activeAdminProjectId);
      if (!proj) return;

      if (!Array.isArray(proj.tasks)) proj.tasks = [];
      proj.tasks.push({
        id: 'ms-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        title,
        deadline,
        description,
        status: 'Pending',
        completed: false
      });

      // Recalculate progress
      const total = proj.tasks.length;
      const done = proj.tasks.filter(t => t.completed).length;
      proj.progress = total > 0 ? Math.round((done / total) * 100) : 0;

      await BD22_DB.updateProject(activeAdminProjectId, { 
        tasks: proj.tasks,
        progress: proj.progress
      });

      if (titleInput) titleInput.value = '';
      if (dateInput) dateInput.value = '';
      if (descInput) descInput.value = '';

      renderAdminProjTasksChecklist(proj);
      renderAdminProjects();
      showToast(`Milestone "${title}" added to project.`);
    });
  }

  function renderAdminProjNotes(proj) {
    const notesEl = document.getElementById('modalProjNotesHistory');
    if (!notesEl) return;

    if (proj.notes) {
      notesEl.innerHTML = proj.notes.split('\n').map(l => l.trim()).filter(Boolean).map(line => `
        <div style="margin-bottom:0.4rem; padding-bottom:0.4rem; border-bottom:1px solid #e2e8f0;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${line}
        </div>
      `).join('') || 'No remarks on file.';
    } else {
      notesEl.innerHTML = '<div style="color:#94a3b8;">No remarks on file.</div>';
    }
  }

  // Add note to existing project
  const btnModalAddNote = document.getElementById('modalProjBtnAddNote');
  if (btnModalAddNote) {
    btnModalAddNote.addEventListener('click', async () => {
      if (!activeAdminProjectId) return;
      const noteInput = document.getElementById('modalProjNewNote');
      const text = (noteInput?.value || '').trim();
      if (!text) return;

      const list = BD22_DB.get('projects') || [];
      const proj = list.find(p => (p.project_code || p.id) === activeAdminProjectId);
      if (!proj) return;

      const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const newEntry = `[${timestamp} Admin Ops] ${text}`;
      const updatedNotes = proj.notes ? `${proj.notes}\n${newEntry}` : newEntry;
      proj.notes = updatedNotes;

      await BD22_DB.updateProject(activeAdminProjectId, { notes: updatedNotes });

      noteInput.value = '';
      renderAdminProjNotes(proj);
      showToast('Project note logged.');
    });
  }

  // Save Project Updates Form
  const btnSaveProjectUpdates = document.getElementById('btnSaveProjectUpdates');
  if (btnSaveProjectUpdates) {
    btnSaveProjectUpdates.addEventListener('click', async () => {
      if (!activeAdminProjectId) return;

      btnSaveProjectUpdates.disabled = true;
      btnSaveProjectUpdates.textContent = 'Saving...';

      const status = document.getElementById('editProjStatus')?.value || 'In Progress';
      const progress = Number(document.getElementById('editProjProgress')?.value || 0);
      const budget = Number(document.getElementById('editProjBudget')?.value || 0);
      const manager = document.getElementById('editProjManager')?.value || '';
      const targetDate = document.getElementById('editProjTargetDate')?.value || '';
      const actualCompletionDate = document.getElementById('editProjActualDate')?.value || '';

      await BD22_DB.updateProject(activeAdminProjectId, {
        status,
        progress,
        budget,
        manager,
        targetDate,
        actualCompletionDate
      });

      btnSaveProjectUpdates.disabled = false;
      btnSaveProjectUpdates.textContent = 'Save Project Updates';

      projectDetailModal.classList.remove('active');
      showToast(`Project ${activeAdminProjectId} updated successfully!`);
      renderAdminProjects();
      renderAdminPayments();
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
  // 6. PAYMENT & BILLING (Mockup 43 Enhanced)
  // =========================================================================
  const adminInvoiceModal = document.getElementById('adminInvoiceModal');
  const adminNewInvoiceModal = document.getElementById('adminNewInvoiceModal');
  const btnOpenNewInvoice = document.getElementById('btnOpenNewInvoice');
  const adminNewInvoiceForm = document.getElementById('adminNewInvoiceForm');
  const btnCancelNewInvoice = document.getElementById('btnCancelNewInvoice');
  const adminPaymentSearch = document.getElementById('adminPaymentSearch');
  const adminPaymentStatusFilter = document.getElementById('adminPaymentStatusFilter');
  let activeAdminInvoiceNo = null;

  async function populateNewInvoiceCustomerSelect() {
    const select = document.getElementById('newInvCustomerSelect');
    if (!select) return;

    let customers = [];
    if (typeof BD22_DB.fetchRegisteredCustomersFromDB === 'function') {
      customers = await BD22_DB.fetchRegisteredCustomersFromDB();
    }
    if (!customers || customers.length === 0) {
      customers = BD22_DB.getRegisteredCustomers() || [];
    }

    if (customers.length === 0) {
      select.innerHTML = '<option value="" disabled selected>No registered customers found</option>';
      return;
    }

    select.innerHTML = `
      <option value="">-- Choose Registered Customer Account (Required) --</option>
      ${customers.map(c => `
        <option value="${c.user_id || ''}" data-name="${c.name || ''}" data-company="${c.company || ''}" data-email="${c.email || ''}">
          ${c.name}${c.company ? ' (' + c.company + ')' : ''} [${c.email || 'Customer'}]
        </option>
      `).join('')}
    `;

    select.onchange = () => {
      const val = select.value;
      const uIdInput = document.getElementById('newInvUserId');
      const cNameInput = document.getElementById('newInvCustomerName');

      if (!val) {
        if (uIdInput) uIdInput.value = '';
        if (cNameInput) cNameInput.value = '';
      } else {
        const opt = select.selectedOptions[0];
        const comp = opt.getAttribute('data-company');
        const name = opt.getAttribute('data-name');
        const email = opt.getAttribute('data-email');
        if (uIdInput) uIdInput.value = val;
        if (cNameInput) cNameInput.value = comp || name || email || 'Commercial Client';
      }
    };
  }

  if (btnOpenNewInvoice && adminNewInvoiceModal) {
    btnOpenNewInvoice.addEventListener('click', async () => {
      await populateNewInvoiceCustomerSelect();

      const dueInput = document.getElementById('newInvDueDate');
      if (dueInput && !dueInput.value) {
        const target = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        dueInput.value = target.toISOString().split('T')[0];
      }

      adminNewInvoiceModal.classList.add('active');
    });
  }

  if (btnCancelNewInvoice && adminNewInvoiceModal) {
    btnCancelNewInvoice.addEventListener('click', () => {
      adminNewInvoiceModal.classList.remove('active');
    });
  }

  if (adminNewInvoiceForm) {
    adminNewInvoiceForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const userId = document.getElementById('newInvUserId')?.value || null;
      const customer = document.getElementById('newInvCustomerName')?.value || 'Commercial Client';
      const project = document.getElementById('newInvProject')?.value.trim() || 'Fire Protection Service';
      const amount = Number(document.getElementById('newInvAmount')?.value || 0);
      const dueDate = document.getElementById('newInvDueDate')?.value || '';
      const notes = document.getElementById('newInvNotes')?.value.trim() || '';

      if (!userId) {
        showToast('Please select a valid registered customer account.');
        const select = document.getElementById('newInvCustomerSelect');
        if (select) select.focus();
        return;
      }

      if (amount <= 0) {
        showToast('Please enter a valid invoice amount.');
        return;
      }

      const submitBtn = document.getElementById('btnSubmitNewInvoice');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Issuing Invoice...';
      }

      const res = await BD22_DB.createInvoice({
        customer,
        user_id: userId,
        project,
        amount,
        dueDate,
        notes
      });

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create & Issue Invoice';
      }

      if (res && res.success) {
        adminNewInvoiceModal.classList.remove('active');
        adminNewInvoiceForm.reset();
        showToast(`Invoice ${res.invoice.invoice_no} issued successfully for ${customer}!`);
        renderAdminPayments();
        renderAdminProjects();
        renderAdminDashboard();
      } else {
        showToast(`Invoice notice: ${res?.error || 'Saved'}`);
      }
    });
  }

  function renderAdminPayments() {
    const tableBody = document.getElementById('adminPaymentsTableBody');
    if (!tableBody) return;

    const list = BD22_DB.get('payments') || [];
    let billed = 0;
    let paid = 0;
    let balance = 0;
    let overdue = 0;

    list.forEach(p => {
      const totalAmt = Number(p.amount) || 0;
      const paidAmt = Number(p.amount_paid) || (p.status === 'Paid' ? totalAmt : 0);
      const balAmt = p.balance !== undefined ? Number(p.balance) : (p.status === 'Paid' ? 0 : Math.max(0, totalAmt - paidAmt));

      billed += totalAmt;
      paid += paidAmt;
      balance += (p.status === 'Paid' ? 0 : balAmt);

      if (p.status === 'Overdue') overdue++;
    });

    const statBilled = document.getElementById('adminPayStatBilled');
    const statPaid = document.getElementById('adminPayStatPaid');
    const statBal = document.getElementById('adminPayStatBalance');
    const statOverdue = document.getElementById('adminPayStatOverdue');

    if (statBilled) statBilled.textContent = `₱${billed.toLocaleString()}`;
    if (statPaid) statPaid.textContent = `₱${paid.toLocaleString()}`;
    if (statBal) statBal.textContent = `₱${balance.toLocaleString()}`;
    if (statOverdue) statOverdue.textContent = overdue;

    // Filter
    let filtered = [...list];
    const query = (adminPaymentSearch?.value || '').toLowerCase().trim();
    const statusVal = adminPaymentStatusFilter?.value || 'All';

    if (query) {
      filtered = filtered.filter(item => 
        (item.invoice || item.invoice_no || '').toLowerCase().includes(query) ||
        (item.customer || item.customer_name || '').toLowerCase().includes(query) ||
        (item.project || item.project_name || '').toLowerCase().includes(query) ||
        (item.payment_reference || '').toLowerCase().includes(query) ||
        (item.method_used || '').toLowerCase().includes(query)
      );
    }

    if (statusVal !== 'All') {
      filtered = filtered.filter(item => (item.status || 'Unpaid') === statusVal);
    }

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:3.5rem 1.5rem; color:#64748b;">No matching invoice or settlement records found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = filtered.map(item => {
      const invNum = item.invoice || item.invoice_no;
      const totalAmt = Number(item.amount) || 0;
      const paidAmt = Number(item.amount_paid) || (item.status === 'Paid' ? totalAmt : 0);
      const balAmt = item.balance !== undefined ? Number(item.balance) : (item.status === 'Paid' ? 0 : Math.max(0, totalAmt - paidAmt));

      let badgeClass = 'badge-unpaid';
      if (item.status === 'Paid') badgeClass = 'badge-completed';
      else if (item.status === 'Partial') badgeClass = 'badge-partial';
      else if (item.status === 'Overdue') badgeClass = 'badge-urgent';
      else badgeClass = 'badge-unpaid';

      return `
        <tr data-inv="${invNum}" style="cursor:pointer;">
          <td class="ref-code">${invNum}</td>
          <td>
            <div style="font-weight: 700; color:#1e293b;">${item.customer || item.customer_name || 'Client'}</div>
            ${item.user_id ? '<div style="font-size:0.75rem; color:#15803d; font-weight:600;">Customer Portal Linked</div>' : ''}
          </td>
          <td>
            <div style="font-weight: 600; color:#1e293b;">${item.project || item.project_name || 'Fire Protection'}</div>
            ${item.project_code ? `<div style="font-size:0.75rem; color:#64748b;">Ref: ${item.project_code}</div>` : ''}
          </td>
          <td><strong>₱${totalAmt.toLocaleString()}</strong></td>
          <td><span style="color:#15803d; font-weight:600;">₱${paidAmt.toLocaleString()}</span></td>
          <td><span style="color:#b91c14; font-weight:700;">₱${balAmt.toLocaleString()}</span></td>
          <td><span class="date-pill">${item.dueDate || item.due_date || 'TBD'}</span></td>
          <td><span class="badge-status ${badgeClass}">${item.status}</span></td>
          <td>
            <button class="btn btn-outline btn-sm btn-open-invoice" data-inv="${invNum}" style="padding:0.3rem 0.65rem; font-size:0.8rem;">
              Manage →
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tableBody.querySelectorAll('tr').forEach(row => {
      row.addEventListener('click', (e) => {
        const inv = row.getAttribute('data-inv');
        if (inv) openAdminInvoiceModal(inv);
      });
    });
  }

  if (adminPaymentSearch) adminPaymentSearch.addEventListener('input', renderAdminPayments);
  if (adminPaymentStatusFilter) adminPaymentStatusFilter.addEventListener('change', renderAdminPayments);

  // Open Admin Invoice & Settlement Modal
  function openAdminInvoiceModal(invoiceNo) {
    if (!adminInvoiceModal) return;

    const list = BD22_DB.get('payments') || [];
    const inv = list.find(p => (p.invoice === invoiceNo || p.invoice_no === invoiceNo || p.id === invoiceNo));
    if (!inv) return;

    activeAdminInvoiceNo = inv.invoice || inv.invoice_no;
    const invNum = inv.invoice || inv.invoice_no;

    const totalAmt = Number(inv.amount) || 0;
    const paidAmt = Number(inv.amount_paid) || (inv.status === 'Paid' ? totalAmt : 0);
    const balAmt = inv.balance !== undefined ? Number(inv.balance) : (inv.status === 'Paid' ? 0 : Math.max(0, totalAmt - paidAmt));

    // Summary Header
    const idBadge = document.getElementById('adminInvIdBadge');
    if (idBadge) idBadge.textContent = invNum;

    const custEl = document.getElementById('adminInvCustomer');
    if (custEl) custEl.textContent = inv.customer || inv.customer_name || 'Client';

    const projEl = document.getElementById('adminInvProject');
    if (projEl) projEl.textContent = inv.project || inv.project_name || 'Contract';

    const projCodeEl = document.getElementById('adminInvProjectCode');
    if (projCodeEl) projCodeEl.textContent = inv.project_code || inv.project_id || '';

    const dateEl = document.getElementById('adminInvDate');
    if (dateEl) dateEl.textContent = inv.invoiceDate || inv.invoice_date || 'Recent';

    const dueEl = document.getElementById('adminInvDueDate');
    if (dueEl) dueEl.textContent = inv.dueDate || inv.due_date || 'TBD';

    const badgeEl = document.getElementById('adminInvStatusBadge');
    if (badgeEl) {
      badgeEl.textContent = inv.status;
      badgeEl.className = `badge-status badge-${inv.status.toLowerCase().replace(/\s+/g, '-')}`;
    }

    // 4-Card Financial Metrics
    const totEl = document.getElementById('adminInvTotal');
    if (totEl) totEl.textContent = `₱${totalAmt.toLocaleString()}`;

    const paidEl = document.getElementById('adminInvPaid');
    if (paidEl) paidEl.textContent = `₱${paidAmt.toLocaleString()}`;

    const balEl = document.getElementById('adminInvBalance');
    if (balEl) balEl.textContent = `₱${balAmt.toLocaleString()}`;

    const statText = document.getElementById('adminInvStatusText');
    if (statText) statText.textContent = inv.status;

    // Billing Remarks
    const notesEl = document.getElementById('adminInvNotes');
    if (notesEl) {
      notesEl.textContent = inv.billing_notes || inv.notes || 'Contract invoice automatically linked to engineering project.';
    }

    // Payment History Table
    const histBody = document.getElementById('adminInvHistoryBody');
    if (histBody) {
      const history = Array.isArray(inv.payment_history) ? inv.payment_history : [];
      if (history.length === 0) {
        histBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:#94a3b8;">No settlement payments recorded yet.</td></tr>';
      } else {
        histBody.innerHTML = history.map(item => `
          <tr>
            <td><span class="date-pill">${item.date || 'Recent'}</span></td>
            <td><strong style="color:#15803d;">₱${Number(item.amount || 0).toLocaleString()}</strong></td>
            <td>${item.method || 'Bank Transfer'}</td>
            <td><span class="ref-code" style="font-size:0.75rem;">${item.reference || 'N/A'}</span></td>
            <td style="color:#64748b; font-size:0.8rem;">${item.notes || 'Settlement confirmed'}</td>
          </tr>
        `).join('');
      }
    }

    // Payment Form Pre-fill
    const payAmtInput = document.getElementById('adminRecordPayAmount');
    if (payAmtInput) {
      payAmtInput.value = balAmt > 0 ? balAmt : '';
      payAmtInput.max = balAmt > 0 ? balAmt : '';
    }

    const btnSetFull = document.getElementById('btnSetFullBalance');
    if (btnSetFull) {
      btnSetFull.onclick = () => {
        if (payAmtInput) payAmtInput.value = balAmt;
      };
    }

    const payDateInput = document.getElementById('adminRecordPayDate');
    if (payDateInput) payDateInput.value = new Date().toISOString().split('T')[0];

    const payRefInput = document.getElementById('adminRecordPayRef');
    if (payRefInput) payRefInput.value = 'TR-' + Date.now().toString().slice(-6);

    adminInvoiceModal.classList.add('active');
  }

  // Record Payment Settlement Form Submit
  const adminRecordPaymentForm = document.getElementById('adminRecordPaymentForm');
  if (adminRecordPaymentForm) {
    adminRecordPaymentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!activeAdminInvoiceNo) return;

      const submitBtn = document.getElementById('btnSubmitAdminPayment');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Recording Payment...';
      }

      const amount = Number(document.getElementById('adminRecordPayAmount')?.value || 0);
      const method = document.getElementById('adminRecordPayMethod')?.value || 'BDO Unibank Online Transfer';
      const reference = document.getElementById('adminRecordPayRef')?.value.trim() || '';
      const date = document.getElementById('adminRecordPayDate')?.value || '';
      const notes = document.getElementById('adminRecordPayNotes')?.value.trim() || 'Settlement recorded by Admin.';

      if (amount <= 0) {
        showToast('Please enter a valid payment amount.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirm Settlement';
        }
        return;
      }

      const res = await BD22_DB.recordPayment(activeAdminInvoiceNo, {
        amount,
        method,
        reference,
        date,
        notes
      });

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm Settlement';
      }

      if (res && res.success) {
        showToast(`Payment of ₱${amount.toLocaleString()} recorded for Invoice ${activeAdminInvoiceNo}!`);
        renderAdminPayments();
        renderAdminDashboard();
        renderAdminProjects();
        openAdminInvoiceModal(activeAdminInvoiceNo);
      } else {
        showToast(`Payment warning: ${res?.error || 'Could not record'}`);
      }
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
        <div class="timeline-check-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
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
