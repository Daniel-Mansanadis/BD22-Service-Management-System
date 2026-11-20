/**
 * BD22 FIRE SYSTEM & BUILDERS INC. - ADMIN OPERATIONS CONTROLLER
 * Faithfully powers Mockups 27 to 49 with live state synchronization
 */

// Helper to open private documents with short-lived expiring signed URLs (Problem 2 fix)
window.openSecureAttachment = async function(storagePath, fileName) {
  if (!storagePath) return;
  try {
    if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
      // If it's already an external signed URL
      window.open(storagePath, '_blank', 'noopener,noreferrer');
      return;
    }
    if (!window.supabaseClient) {
      alert('Secure storage client is initializing. Please try again.');
      return;
    }
    const { data, error } = await window.supabaseClient.storage
      .from('service-attachments')
      .createSignedUrl(storagePath, 300); // Expires in 300 seconds (5 minutes)

    if (error || !data?.signedUrl) {
      throw error || new Error('Could not create signed URL');
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  } catch (err) {
    console.error('Failed to generate expiring signed URL:', err);
    alert('Unable to load document: Link expired or permission denied.');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Navigation elements
  const navLinks = document.querySelectorAll('.admin-sidebar .sidebar-nav-link');
  const views = document.querySelectorAll('.portal-view');
  const topbarTitle = document.getElementById('topbarPageTitle');

  const titlesMap = {
    'admin-dashboard': 'Admin Dashboard',
    'admin-inquiries': 'Client Bookings',
    'admin-service-requests': 'Service Requests',
    'admin-projects': 'Project Management',
    'admin-inventory': 'Equipment & Inventory',
    'admin-payments': 'Payment & Billing',
    'admin-warranties': 'Warranty Tracking',
    'admin-maintenance': 'Maintenance Schedule',
    'admin-history': 'Service History',
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

  function updateAdminIdentityDisplay() {
    const user = BD22_DB.get('currentUser') || {};
    const prof = BD22_DB.get('adminProfile') || {};

    const adminName = user.full_name || user.name || prof.name || 'Engr. Ricardo Gomez';
    const adminEmail = user.email || prof.email || 'admin@bd22fire.com';

    const sidebarLabel = document.getElementById('adminSidebarUserName');
    if (sidebarLabel) sidebarLabel.textContent = adminName;

    const dropdownName = document.getElementById('adminDropdownUserName');
    if (dropdownName) dropdownName.textContent = adminName;

    const dropdownEmail = document.getElementById('adminDropdownUserEmail');
    if (dropdownEmail) dropdownEmail.textContent = adminEmail;

    const viewName = document.getElementById('viewAdminName');
    if (viewName) viewName.textContent = adminName;

    const viewFullName = document.getElementById('viewAdminFullName');
    if (viewFullName) viewFullName.textContent = adminName;
  }

  function switchAdminView(viewName) {
    if (!views.length) return;
    updateAdminIdentityDisplay();
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

  // Live database synchronization listener
  window.addEventListener('bd22_synced', () => {
    updateAdminIdentityDisplay();
    const cur = window.location.hash.replace('#', '') || 'admin-dashboard';
    if (cur === 'admin-profile') return;
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
    const stats = BD22_DB.adminDashboardStats || {};
    const statElements = {
      inquiries: 'adminStatInquiries',
      projects: 'adminStatProjects',
      users: 'adminStatUsers',
      warranties: 'adminStatWarranties',
      maintenance: 'adminStatMaint',
      inventory: 'adminStatInventory'
    };

    Object.entries(statElements).forEach(([key, elementId]) => {
      const element = document.getElementById(elementId);
      if (element) element.textContent = Number.isFinite(stats[key]) ? stats[key] : '—';
    });

    const statsStatus = document.getElementById('adminDashboardStatsStatus');
    if (statsStatus) {
      const hasUnavailableMetric = Object.keys(statElements).some(key => !Number.isFinite(stats[key]));
      statsStatus.hidden = !hasUnavailableMetric;
      statsStatus.textContent = hasUnavailableMetric
        ? 'Some dashboard totals are unavailable from Supabase. Check the connection and database permissions; unavailable totals are shown as —.'
        : '';
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
          const inquiry = combinedMap.get(ref);
          combinedMap.set(ref, {
            ...inquiry,
            ...s,
            user_id: s.user_id || inquiry.user_id || null,
            submission_source: inquiry.submission_source && inquiry.submission_source !== 'legacy_unknown'
              ? inquiry.submission_source
              : (s.submission_source || inquiry.submission_source || 'legacy_unknown')
          });
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
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2.5rem; color:#64748b;">No matching inquiries found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = items.map(item => {
      const ref = item.reference || item.reference_no || '';
      const badgeClass = getAdminStatusBadgeClass(item.status);
      const payStatus = item.payment_status || item.paymentStatus || 'Unpaid';
      const payBadgeClass = payStatus === 'Paid' ? 'badge-paid' : (payStatus === 'Partial' ? 'badge-partial' : 'badge-unpaid');
      const estLabel = item.establishment_name ? `<div style="font-size:0.8rem; color:#64748b; font-weight:normal; margin-top:0.15rem;">Site: ${item.establishment_name}</div>` : '';
      const displayDate = item.preferred_date || item.confirmed_schedule || item.dateSubmitted || 'Recent';
      const sourceDetails = {
        customer_account_verified: ['Verified customer account', 'inquiry-source-verified'],
        customer_account_unverified: ['Account - email unverified', 'inquiry-source-unverified'],
        public_visitor: ['Public visitor', 'inquiry-source-public'],
        signed_in_non_customer: ['Signed-in non-customer', 'inquiry-source-unverified'],
        legacy_unknown: ['Legacy - source unknown', 'inquiry-source-unknown']
      };
      const [sourceLabel, sourceClass] = sourceDetails[item.submission_source] ||
        (item.user_id
          ? ['Account linked - verification unknown', 'inquiry-source-unknown']
          : ['Source unavailable', 'inquiry-source-unknown']);

      return `
        <tr data-ref="${ref}" style="cursor:pointer;">
          <td>
            <div style="font-weight: 700; color:#1e293b;">${item.customer || item.customer_name || 'Valued Customer'}</div>
            ${estLabel}
          </td>
          <td><span class="inquiry-source-label ${sourceClass}">${sourceLabel}</span></td>
          <td>
            <div style="font-weight: 600; color:#1e293b;">${item.service || item.service_type || 'General Inquiry'}</div>
            ${item.description ? `<div style="font-size:0.78rem; color:#64748b; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.description}</div>` : ''}
          </td>
          <td><span class="client-booking-date">${displayDate}</span></td>
          <td><span class="badge-status client-booking-status ${badgeClass}">${item.status || 'Pending Review'}</span></td>
          <td><span class="badge-status ${payBadgeClass}">${payStatus}</span></td>
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

      saveInquiryBtn.disabled = true;
      try {
        const result = await BD22_DB.updateServiceRequest(ref, {
          service: updatedService,
          status: updatedStatus,
          assignedStaff: updatedStaff,
          trackingNote: updatedNotes
        });
        if (!result?.success) {
          showToast(`Unable to update inquiry: ${result?.error || 'Please try again.'}`, 'error');
          return;
        }

        inquiryModal.classList.remove('active');
        renderAdminInquiries();
        renderAdminServiceRequests();
        renderAdminDashboard();
        showToast(`Inquiry ${ref} updated successfully!`, 'success');
      } finally {
        saveInquiryBtn.disabled = false;
      }
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
      case 'Rejected':
        return 'badge-rejected';
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
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 3rem 1.5rem; color:#64748b;">No matching service requests found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = list.map(item => {
      const ref = item.reference || item.reference_no || '';
      const badgeClass = getAdminStatusBadgeClass(item.status);
      const payStatus = item.payment_status || item.paymentStatus || 'Unpaid';
      const payBadgeClass = payStatus === 'Paid' ? 'badge-paid' : (payStatus === 'Partial' ? 'badge-partial' : 'badge-unpaid');
      const siteDisplay = item.establishment_name || 'Project Site';
      const addressShort = item.site_address ? `<div style="font-size:0.78rem; color:#64748b; margin-top:0.15rem;">${item.site_address}</div>` : '';
      const displayDate = item.preferred_date || item.confirmed_schedule || item.dateSubmitted || 'Recent';
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
          <td><span class="badge-status ${payBadgeClass}">${payStatus}</span></td>
          <td style="font-size:0.9rem; color:#334155;">${item.assignedStaff || 'Unassigned'}</td>
          <td>
            <button class="btn btn-outline btn-sm btn-open-sr" data-sr-ref="${ref}" style="padding:0.3rem 0.75rem; font-size:0.8rem;">
              Assess
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

  let pendingSrAction = null;
  const confirmedDateInput = document.getElementById('adminSrConfirmedDate');
  const saveSrBtn = document.getElementById('btnSaveServiceReqAssessment');
  const btnApproveSr = document.getElementById('btnAdminApproveSr');
  const btnRejectSr = document.getElementById('btnAdminRejectSr');
  if (confirmedDateInput) {
    ['input', 'change'].forEach(eventName => {
      confirmedDateInput.addEventListener(eventName, () => confirmedDateInput.setCustomValidity(''));
    });
  }

  function setPendingSrAction(action) {
    pendingSrAction = action;
    if (btnApproveSr) btnApproveSr.setAttribute('aria-pressed', String(action === 'Approved'));
    if (btnRejectSr) btnRejectSr.setAttribute('aria-pressed', String(action === 'Rejected'));
    if (btnApproveSr) btnApproveSr.textContent = action === 'Approved' ? 'Approval Selected' : 'Approve Appointment';
    if (btnRejectSr) btnRejectSr.textContent = action === 'Rejected' ? 'Rejection Selected' : 'Reject Appointment';
    if (saveSrBtn) saveSrBtn.textContent = 'Save Assessment';
    showToast(`${action} selected. Enter the confirmed schedule date, then save the assessment.`);
  }

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

    const payStatus = merged.payment_status || merged.paymentStatus || 'Unpaid';
    const payBadge = document.getElementById('adminSrPaymentBadge');
    if (payBadge) {
      payBadge.textContent = payStatus;
      payBadge.className = 'badge-status ' + (payStatus === 'Paid' ? 'badge-paid' : (payStatus === 'Partial' ? 'badge-partial' : 'badge-unpaid'));
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

    // Block 4: Attachments & Concerns (Expiring signed URLs for private storage)
    const attachList = document.getElementById('adminSrAttachmentsList');
    if (attachList) {
      if (merged.attachments && Array.isArray(merged.attachments) && merged.attachments.length > 0) {
        attachList.innerHTML = merged.attachments.map(att => {
          const rawPath = att.path || att.storage_path || att.url || '';
          const safePath = rawPath.replace(/'/g, "\\'");
          const safeName = (att.name || 'Document').replace(/'/g, "\\'");
          const isFloorPlan = att.type === 'floor_plan';
          const iconSvg = isFloorPlan 
            ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:3px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
            : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:3px;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
          const clickAttr = safePath ? `style="cursor:pointer;" onclick="openSecureAttachment('${safePath}', '${safeName}')" title="View with secure expiring link"` : '';
          return `
          <span class="attachment-pill" ${clickAttr}>
            ${iconSvg} ${att.name || 'Attachment'} ${att.size ? '(' + Math.round(att.size / 1024) + ' KB)' : ''}
          </span>
        `;
        }).join('');
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

    // Block 5: Schedule Controls & Workflow Status
    const statusSelect = document.getElementById('adminSrStatusSelect');
    if (statusSelect) {
      statusSelect.value = merged.status || 'Pending Review';
    }
    if (confirmedDateInput) {
      confirmedDateInput.value = merged.confirmed_schedule || merged.scheduled_date || '';
    }
    pendingSrAction = null;
    if (btnApproveSr) {
      btnApproveSr.setAttribute('aria-pressed', 'false');
      btnApproveSr.disabled = false;
      btnApproveSr.textContent = 'Approve Appointment';
    }
    if (btnRejectSr) {
      btnRejectSr.setAttribute('aria-pressed', 'false');
      btnRejectSr.disabled = false;
      btnRejectSr.textContent = 'Reject Appointment';
    }

    adminSrModal.setAttribute('data-active-sr-ref', reference);
    adminSrModal.classList.add('active');
  }

  // Save the selected appointment action and confirmed schedule together.
  if (saveSrBtn) {
    saveSrBtn.addEventListener('click', async () => {
      const ref = adminSrModal.getAttribute('data-active-sr-ref');
      if (!ref) return;

      const statusSelect = document.getElementById('adminSrStatusSelect');
      const selectedStatus = statusSelect?.value || 'Pending Review';
      let confirmedDate = confirmedDateInput?.value || '';

      if (selectedStatus === 'Approved' && !confirmedDate) {
        const inqs = BD22_DB.get('inquiries') || [];
        const srs = BD22_DB.get('serviceRequests') || [];
        const item = inqs.find(i => i.reference === ref || i.reference_no === ref) ||
                     srs.find(s => s.reference === ref || s.reference_no === ref);
        confirmedDate = item?.preferred_date || new Date().toISOString().split('T')[0];
        if (confirmedDateInput) confirmedDateInput.value = confirmedDate;
      }

      saveSrBtn.disabled = true;
      saveSrBtn.textContent = 'Saving Assessment...';
      if (btnApproveSr) btnApproveSr.disabled = true;
      if (btnRejectSr) btnRejectSr.disabled = true;

      try {
        const updatedFields = {
          status: selectedStatus,
          confirmedSchedule: confirmedDate
        };

        const result = await BD22_DB.updateServiceRequest(ref, updatedFields);
        if (!result?.success) {
          showToast(`Unable to save assessment: ${result?.error || 'Please try again.'}`, 'error');
          return;
        }

        adminSrModal.classList.remove('active');
        renderAdminInquiries();
        renderAdminServiceRequests();
        renderAdminDashboard();
        showToast(`Appointment ${ref} updated to "${selectedStatus}" successfully!`, 'success');
      } catch (err) {
        console.error('Service request assessment save error:', err);
        showToast('Unable to save assessment. Please try again.', 'error');
      } finally {
        saveSrBtn.disabled = false;
        saveSrBtn.textContent = 'Save Assessment';
        if (btnApproveSr) btnApproveSr.disabled = false;
        if (btnRejectSr) btnRejectSr.disabled = false;
      }
    });
  }

  // Direct, immediate action: Approve Appointment button
  if (btnApproveSr) {
    btnApproveSr.addEventListener('click', async () => {
      const ref = adminSrModal.getAttribute('data-active-sr-ref');
      if (!ref) return;

      btnApproveSr.disabled = true;
      btnApproveSr.textContent = 'Approving...';

      let confirmedDate = confirmedDateInput?.value || '';
      if (!confirmedDate) {
        const inqs = BD22_DB.get('inquiries') || [];
        const srs = BD22_DB.get('serviceRequests') || [];
        const item = inqs.find(i => i.reference === ref || i.reference_no === ref) ||
                     srs.find(s => s.reference === ref || s.reference_no === ref);
        confirmedDate = item?.preferred_date || new Date().toISOString().split('T')[0];
        if (confirmedDateInput) confirmedDateInput.value = confirmedDate;
      }

      const res = await BD22_DB.updateServiceRequest(ref, {
        status: 'Approved',
        confirmedSchedule: confirmedDate
      });

      btnApproveSr.disabled = false;
      btnApproveSr.textContent = 'Approve Appointment';

      if (res?.success) {
        showToast(`Appointment ${ref} has been APPROVED! Confirmed for ${confirmedDate}.`, 'success');
        adminSrModal.classList.remove('active');
        renderAdminInquiries();
        renderAdminServiceRequests();
        renderAdminDashboard();
      } else {
        showToast(`Unable to approve appointment: ${res?.error || 'Please try again.'}`, 'error');
      }
    });
  }

  // Direct, immediate action: Reject Appointment button
  if (btnRejectSr) {
    btnRejectSr.addEventListener('click', async () => {
      const ref = adminSrModal.getAttribute('data-active-sr-ref');
      if (!ref) return;

      if (!confirm(`Are you sure you want to mark appointment ${ref} as Rejected?`)) return;

      btnRejectSr.disabled = true;
      btnRejectSr.textContent = 'Rejecting...';

      const res = await BD22_DB.updateServiceRequest(ref, {
        status: 'Rejected',
        confirmedSchedule: ''
      });

      btnRejectSr.disabled = false;
      btnRejectSr.textContent = 'Reject Appointment';

      if (res?.success) {
        showToast(`Appointment ${ref} marked as Rejected.`, 'info');
        adminSrModal.classList.remove('active');
        renderAdminInquiries();
        renderAdminServiceRequests();
        renderAdminDashboard();
      } else {
        showToast(`Unable to reject appointment: ${res?.error || 'Please try again.'}`, 'error');
      }
    });
  }

  const btnMarkSrPaid = document.getElementById('btnAdminMarkSrPaid');
  if (btnMarkSrPaid) {
    btnMarkSrPaid.onclick = async () => {
      const ref = adminSrModal.getAttribute('data-active-sr-ref');
      if (!ref) return;
      btnMarkSrPaid.disabled = true;
      btnMarkSrPaid.textContent = 'Updating...';
      const res = await BD22_DB.updateServiceRequest(ref, { payment_status: 'Paid' });
      btnMarkSrPaid.disabled = false;
      btnMarkSrPaid.textContent = 'Mark as Paid';
      if (res?.success) {
        showToast(`Appointment ${ref} marked as Paid!`, 'success');
        openAdminServiceRequestModal(ref);
        renderAdminInquiries();
        renderAdminServiceRequests();
      }
    };
  }

  const btnMarkSrUnpaid = document.getElementById('btnAdminMarkSrUnpaid');
  if (btnMarkSrUnpaid) {
    btnMarkSrUnpaid.onclick = async () => {
      const ref = adminSrModal.getAttribute('data-active-sr-ref');
      if (!ref) return;
      btnMarkSrUnpaid.disabled = true;
      btnMarkSrUnpaid.textContent = 'Updating...';
      const res = await BD22_DB.updateServiceRequest(ref, { payment_status: 'Unpaid' });
      btnMarkSrUnpaid.disabled = false;
      btnMarkSrUnpaid.textContent = 'Mark as Unpaid';
      if (res?.success) {
        showToast(`Appointment ${ref} marked as Unpaid.`, 'info');
        openAdminServiceRequestModal(ref);
        renderAdminInquiries();
        renderAdminServiceRequests();
      }
    };
  }

  // Delete All Bookings Action (Inquiries and Service Requests)
  const btnAdminDeleteAllBookings = document.getElementById('btnAdminDeleteAllBookings');
  if (btnAdminDeleteAllBookings) {
    btnAdminDeleteAllBookings.addEventListener('click', async () => {
      const inqs = BD22_DB.get('inquiries') || [];
      const srs = BD22_DB.get('serviceRequests') || [];
      const totalCount = inqs.length + srs.length;
      if (totalCount === 0) {
        showToast('There are no client bookings to delete.', 'info');
        return;
      }

      const confirmPurge = window.confirm(
        `Are you sure you want to permanently delete ALL client bookings and inquiries?\n\nThis will remove all inquiries and service requests from Admin Management, Dashboard stats, and the Customer Portal.\nUser accounts, customer profiles, and login credentials will NOT be affected.`
      );
      if (!confirmPurge) return;

      const originalText = btnAdminDeleteAllBookings.innerHTML;
      btnAdminDeleteAllBookings.disabled = true;
      btnAdminDeleteAllBookings.innerHTML = '<span>Deleting all bookings...</span>';

      const res = await BD22_DB.deleteAllBookings();
      btnAdminDeleteAllBookings.disabled = false;
      btnAdminDeleteAllBookings.innerHTML = originalText;

      if (res && res.success) {
        renderAdminInquiries();
        renderAdminServiceRequests();
        renderAdminDashboard();
        showToast('All client bookings have been permanently deleted.', 'success');
      } else {
        showToast(`Failed to delete all bookings: ${res?.error || 'Please try again.'}`, 'error');
      }
    });
  }

  // Delete Single Booking Action
  const btnAdminDeleteBooking = document.getElementById('btnAdminDeleteBooking');
  if (btnAdminDeleteBooking) {
    btnAdminDeleteBooking.addEventListener('click', async () => {
      const ref = adminSrModal?.getAttribute('data-active-sr-ref');
      if (!ref) return;

      const confirmDelete = window.confirm(
        `Are you sure you want to permanently delete booking ${ref}?\n\nThis booking will be removed from Admin Management, Dashboard metrics, and the Customer Portal.\nCustomer accounts will NOT be affected.`
      );
      if (!confirmDelete) return;

      const originalHtml = btnAdminDeleteBooking.innerHTML;
      btnAdminDeleteBooking.disabled = true;
      btnAdminDeleteBooking.innerHTML = '<span>Deleting...</span>';

      const res = await BD22_DB.deleteInquiry(ref);
      btnAdminDeleteBooking.disabled = false;
      btnAdminDeleteBooking.innerHTML = originalHtml;

      if (res && res.success) {
        if (adminSrModal) adminSrModal.classList.remove('active');
        if (inquiryModal) inquiryModal.classList.remove('active');
        renderAdminInquiries();
        renderAdminServiceRequests();
        renderAdminDashboard();
        showToast(`Booking ${ref} deleted permanently!`, 'success');
      } else {
        showToast(`Failed to delete booking: ${res?.error || 'Please try again.'}`, 'error');
      }
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
    newProjTasks = [];
    renderNewProjTasksList();
  }

  function renderNewProjTasksList() {
    const container = document.getElementById('newProjTasksList');
    if (!container) return;

    if (newProjTasks.length === 0) {
      container.innerHTML = '<div style="font-size:0.85rem; color:#94a3b8; text-align:center; padding:1.25rem; border:1px dashed #cbd5e1; border-radius:8px;">No milestones added yet.</div>';
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

  // Delete All Projects Action
  const btnAdminDeleteAllProjects = document.getElementById('btnAdminDeleteAllProjects');
  if (btnAdminDeleteAllProjects) {
    btnAdminDeleteAllProjects.addEventListener('click', async () => {
      const projects = BD22_DB.get('projects') || [];
      if (projects.length === 0) {
        showToast('There are no projects to delete.', 'info');
        return;
      }

      const confirmPurge = window.confirm(
        `Are you sure you want to permanently delete ALL ${projects.length} project(s)?\n\nThis will remove projects from Admin Management, Dashboard stats, and the Customer Portal.\nUser accounts, profiles, and login credentials will NOT be affected.`
      );
      if (!confirmPurge) return;

      const originalText = btnAdminDeleteAllProjects.innerHTML;
      btnAdminDeleteAllProjects.disabled = true;
      btnAdminDeleteAllProjects.innerHTML = '<span>Deleting all projects...</span>';

      const res = await BD22_DB.deleteAllProjects();
      btnAdminDeleteAllProjects.disabled = false;
      btnAdminDeleteAllProjects.innerHTML = originalText;

      if (res && res.success) {
        renderAdminProjects();
        renderAdminDashboard();
        renderAdminPayments();
        showToast('All projects have been permanently deleted.', 'success');
      } else {
        showToast(`Failed to delete all projects: ${res?.error || 'Please try again.'}`, 'error');
      }
    });
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
        showToast('Please select a valid registered customer account. Projects must be assigned to an existing registered customer.', 'error');
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
      const status = document.getElementById('newProjStatus')?.value || 'Not Started';
      const budget = Number(document.getElementById('newProjBudget')?.value || 0);
      const notes = document.getElementById('newProjNotes')?.value.trim() || '';

      if (startDate && targetDate && targetDate < startDate) {
        showToast('Target Completion Date cannot be earlier than Project Start Date.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Project & Generate Invoice';
        }
        return;
      }

      if (isNaN(budget) || budget < 0) {
        showToast('Project budget must be zero or a positive amount.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Project & Generate Invoice';
        }
        return;
      }

      const res = await BD22_DB.createProject({
        name,
        customer,
        user_id: userId,
        startDate,
        targetDate,
        status,
        budget,
        tasks: newProjTasks,
        notes
      });

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Project & Generate Invoice';
      }

      if (res && res.success) {
        // 1. Immediately close modal and reset state
        newProjectModal.classList.remove('active');
        newProjectForm.reset();
        resetNewProjectTasks();

        // 2. Refresh UI views
        renderAdminProjects();
        renderAdminPayments();
        renderAdminDashboard();

        // 3. Pop successful feedback in green
        if (res.cloudSync === false) {
          showToast(`Project ${res.project.project_code} created successfully! (Saved locally; cloud sync pending)`, 'success');
        } else {
          showToast(`Project ${res.project.project_code} created successfully and Invoice ${res.invoice.invoice_no} generated!`, 'success');
        }
      } else {
        // Keep modal open so user can adjust inputs, show failed feedback in red
        showToast(`Project creation failed: ${res?.error || 'Please try again.'}`, 'error');
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

    const allPayments = BD22_DB.get('payments') || [];

    container.innerHTML = projects.map(proj => {
      const projCode = proj.project_code || proj.id || 'BD22-PRJ';
      let badgeClass = 'badge-in-progress';
      if (proj.status === 'Completed') badgeClass = 'badge-completed';
      else if (proj.status === 'Scheduled') badgeClass = 'badge-scheduled';
      else if (proj.status === 'Not Started') badgeClass = 'badge-not-started';
      else if (proj.status === 'On Hold') badgeClass = 'badge-on-hold';

      // Billing & payment status lookup
      const inv = allPayments.find(p => 
        (p.project_id && (p.project_id === projCode || p.project_id === proj.id)) ||
        (p.project_code && (p.project_code === projCode || p.project_code === proj.id)) ||
        (p.invoice && p.invoice === (proj.linked_invoice || proj.linkedInvoice)) ||
        (p.invoice_no && p.invoice_no === (proj.linked_invoice || proj.linkedInvoice)) ||
        (p.project && p.project.toLowerCase() === proj.name.toLowerCase()) ||
        (p.project_name && p.project_name.toLowerCase() === proj.name.toLowerCase())
      );
      const isCompleted = proj.status === 'Completed';
      const payStatus = isCompleted ? 'Paid' : ((inv && inv.status) || proj.payment_status || proj.paymentStatus || 'Unpaid');
      let payBadgeClass = 'badge-unpaid';
      if (payStatus === 'Paid') payBadgeClass = 'badge-paid';
      else if (payStatus === 'Partial') payBadgeClass = 'badge-partial';

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
              <span class="badge-status ${payBadgeClass}" style="font-size:0.75rem;">${payStatus}</span>
            </div>
          </div>
          <p class="portal-project-subtitle">Client: <strong>${proj.customer || proj.customer_name}</strong></p>

          <div class="progress-track">
            <div class="progress-fill" style="width: ${proj.progress || 0}%;"></div>
          </div>
          <div class="progress-info-row">
            <span>Target: ${proj.targetDate || proj.target_date || 'TBD'}</span>
            <span>${proj.progress || 0}%</span>
          </div>
          ${tasksSummary}

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.25rem; padding-top:0.75rem; border-top:1px solid #f1f5f9;">
            <button type="button" class="btn btn-outline btn-sm project-details-btn" data-proj-id="${projCode}">Details & Manage</button>
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

    // Linked Invoice Box & Action Controls
    const payments = BD22_DB.get('payments') || [];
    const inv = payments.find(p => 
      (p.project_id && (p.project_id === projCode || p.project_id === proj.id)) ||
      (p.project_code && (p.project_code === projCode || p.project_code === proj.id)) ||
      (p.invoice && p.invoice === (proj.linked_invoice || proj.linkedInvoice)) ||
      (p.invoice_no && p.invoice_no === (proj.linked_invoice || proj.linkedInvoice)) ||
      (p.project && p.project.toLowerCase() === proj.name.toLowerCase()) ||
      (p.project_name && p.project_name.toLowerCase() === proj.name.toLowerCase())
    );

    const invBoxEl = document.getElementById('adminModalLinkedInvoiceBox');
    const invCodeEl = document.getElementById('modalProjInvoiceCode');
    const invStatusEl = document.getElementById('modalProjInvoiceStatus');

    const isCompleted = proj.status === 'Completed';
    const invStatus = isCompleted ? 'Paid' : ((inv && inv.status) || proj.payment_status || proj.paymentStatus || 'Unpaid');
    const invCodeText = (inv && (inv.invoice || inv.invoice_no)) || proj.linked_invoice || proj.linkedInvoice || 'Pending Bill';

    if (invCodeEl) invCodeEl.textContent = invCodeText;

    if (invStatusEl) {
      invStatusEl.textContent = invStatus;
      if (invStatus === 'Paid') invStatusEl.className = 'badge-status badge-paid';
      else if (invStatus === 'Partial') invStatusEl.className = 'badge-status badge-partial';
      else invStatusEl.className = 'badge-status badge-unpaid';
    }

    if (invBoxEl) {
      if (invStatus === 'Paid') {
        invBoxEl.style.background = '#f0fdf4';
        invBoxEl.style.border = '1.5px solid #bbf7d0';
      } else if (invStatus === 'Partial') {
        invBoxEl.style.background = '#fffbeb';
        invBoxEl.style.border = '1.5px solid #fde68a';
      } else {
        invBoxEl.style.background = '#fef2f2';
        invBoxEl.style.border = '1.5px solid #fee2e2';
      }
    }

    const budgetAmt = Number(proj.budget || (inv ? inv.amount : 0) || 0);
    const paidAmt = Number(isCompleted ? budgetAmt : (inv?.amount_paid !== undefined ? inv.amount_paid : (invStatus === 'Paid' ? budgetAmt : 0)));
    const balAmt = Number(isCompleted ? 0 : (inv?.balance !== undefined ? inv.balance : Math.max(0, budgetAmt - paidAmt)));

    const paidEl = document.getElementById('modalProjAmountPaid');
    if (paidEl) paidEl.textContent = `₱${paidAmt.toLocaleString()}`;

    const balEl = document.getElementById('modalProjBalance');
    if (balEl) {
      balEl.textContent = `₱${balAmt.toLocaleString()}`;
      balEl.style.color = balAmt > 0 ? '#dc2626' : '#15803d';
    }

    const paySelect = document.getElementById('adminModalProjPayStatusSelect');
    if (paySelect) {
      paySelect.value = invStatus;
      paySelect.onchange = async () => {
        const newPayStatus = paySelect.value;
        const res = await BD22_DB.setProjectPaymentStatus(activeAdminProjectId, newPayStatus);
        if (res?.success) {
          showToast(`Project payment status updated to "${newPayStatus}".`, 'success');
          openAdminProjectDetail(activeAdminProjectId);
          renderAdminProjects();
          renderAdminPayments();
        }
      };
    }

    const btnMarkProjPaid = document.getElementById('btnAdminMarkProjectPaid');
    if (btnMarkProjPaid) {
      btnMarkProjPaid.onclick = async () => {
        btnMarkProjPaid.disabled = true;
        btnMarkProjPaid.textContent = 'Updating...';
        const res = await BD22_DB.setProjectPaymentStatus(activeAdminProjectId, 'Paid');
        btnMarkProjPaid.disabled = false;
        btnMarkProjPaid.textContent = 'Mark as Paid';
        if (res?.success) {
          showToast(`Project marked as PAID!`, 'success');
          openAdminProjectDetail(activeAdminProjectId);
          renderAdminProjects();
          renderAdminPayments();
        }
      };
    }

    // Project Maintenance Scheduling Action
    const btnMaintSched = document.getElementById('btnAdminScheduleProjectMaintenance');
    if (btnMaintSched) {
      btnMaintSched.onclick = () => {
        projectDetailModal.classList.remove('active');
        openAdminNewMaintenanceModal(projCode);
      };
    }

    // Descriptions
    const descEl = document.getElementById('modalProjDescription');
    if (descEl) descEl.textContent = proj.description || 'Facility fire protection retrofit and code compliance.';

    const milesEl = document.getElementById('modalProjMilestones');
    if (milesEl) milesEl.textContent = proj.milestones || 'Turnkey engineering milestones on file.';

    // Interactive Milestones Checklist
    renderAdminProjTasksChecklist(proj);

    // Notes
    renderAdminProjNotes(proj);

    // Setup Project Status Action Buttons (Not Started, In Progress, On Hold, Completed)
    const statusActionGroup = document.getElementById('adminProjStatusActionGroup');
    if (statusActionGroup) {
      const statusButtons = statusActionGroup.querySelectorAll('.btn-proj-status');
      statusButtons.forEach(btn => {
        const btnStatus = btn.getAttribute('data-status');
        const isActive = (proj.status || 'In Progress') === btnStatus;

        if (isActive) {
          if (btnStatus === 'Completed') {
            btn.className = 'btn btn-sm btn-proj-status active';
            btn.style.cssText = 'padding:0.4rem 0.95rem; font-size:0.82rem; background:#15803d; color:#ffffff; border:1.5px solid #166534; font-weight:700; box-shadow:0 0 0 2px rgba(21,128,61,0.25); cursor:default;';
          } else if (btnStatus === 'In Progress') {
            btn.className = 'btn btn-sm btn-proj-status active';
            btn.style.cssText = 'padding:0.4rem 0.95rem; font-size:0.82rem; background:#0284c7; color:#ffffff; border:1.5px solid #0369a1; font-weight:700; box-shadow:0 0 0 2px rgba(2,132,199,0.25); cursor:default;';
          } else if (btnStatus === 'On Hold') {
            btn.className = 'btn btn-sm btn-proj-status active';
            btn.style.cssText = 'padding:0.4rem 0.95rem; font-size:0.82rem; background:#d97706; color:#ffffff; border:1.5px solid #b45309; font-weight:700; box-shadow:0 0 0 2px rgba(217,119,6,0.25); cursor:default;';
          } else {
            btn.className = 'btn btn-sm btn-proj-status active';
            btn.style.cssText = 'padding:0.4rem 0.95rem; font-size:0.82rem; background:#64748b; color:#ffffff; border:1.5px solid #475569; font-weight:700; box-shadow:0 0 0 2px rgba(100,116,139,0.25); cursor:default;';
          }
        } else {
          if (btnStatus === 'Completed') {
            btn.className = 'btn btn-sm btn-outline btn-proj-status';
            btn.style.cssText = 'padding:0.4rem 0.85rem; font-size:0.82rem; background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; font-weight:600; cursor:pointer;';
          } else if (btnStatus === 'In Progress') {
            btn.className = 'btn btn-sm btn-outline btn-proj-status';
            btn.style.cssText = 'padding:0.4rem 0.85rem; font-size:0.82rem; background:#f0f9ff; color:#0369a1; border:1px solid #bae6fd; font-weight:600; cursor:pointer;';
          } else if (btnStatus === 'On Hold') {
            btn.className = 'btn btn-sm btn-outline btn-proj-status';
            btn.style.cssText = 'padding:0.4rem 0.85rem; font-size:0.82rem; background:#fffbeb; color:#b45309; border:1px solid #fde68a; font-weight:600; cursor:pointer;';
          } else {
            btn.className = 'btn btn-sm btn-outline btn-proj-status';
            btn.style.cssText = 'padding:0.4rem 0.85rem; font-size:0.82rem; background:#f8fafc; color:#475569; border:1px solid #cbd5e1; font-weight:600; cursor:pointer;';
          }
        }

        btn.onclick = async () => {
          if (btnStatus === proj.status) {
            showToast(`Project is already marked as "${btnStatus}".`);
            return;
          }

          const originalText = btn.textContent;
          btn.disabled = true;
          btn.textContent = 'Updating...';

          const res = await BD22_DB.setProjectStatus(activeAdminProjectId, btnStatus);
          btn.disabled = false;
          btn.textContent = originalText;

          if (res && res.success) {
            if (btnStatus === 'Completed') {
              showToast('Project marked as Completed! Warranty tracking, Maintenance schedule, and Service history have been automatically generated.');
            } else {
              showToast(`Project status updated to "${btnStatus}".`);
            }
            openAdminProjectDetail(activeAdminProjectId);
            renderAdminProjects();
            renderAdminDashboard();
            renderAdminPayments();
          } else {
            showToast(`Status update notice: ${res?.error || 'Unable to update status'}`);
          }
        };
      });
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
        const editProg = document.getElementById('editProjProgress');
        const editProgDisp = document.getElementById('editProjProgressDisplay');

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
      showToast('Project note logged.', 'info');
    });
  }

  // Delete single project permanently
  const btnAdminDeleteProject = document.getElementById('btnAdminDeleteProject');
  if (btnAdminDeleteProject) {
    btnAdminDeleteProject.addEventListener('click', async () => {
      if (!activeAdminProjectId) return;
      const confirmDelete = window.confirm(
        `Are you sure you want to permanently delete project ${activeAdminProjectId}?\n\nThis project will be removed from Admin Management, Dashboard metrics, and the Customer Portal.\nAssociated customer accounts will NOT be affected.`
      );
      if (!confirmDelete) return;

      const originalHtml = btnAdminDeleteProject.innerHTML;
      btnAdminDeleteProject.disabled = true;
      btnAdminDeleteProject.innerHTML = '<span>Deleting...</span>';

      const res = await BD22_DB.deleteProject(activeAdminProjectId);
      btnAdminDeleteProject.disabled = false;
      btnAdminDeleteProject.innerHTML = originalHtml;

      if (res && res.success) {
        projectDetailModal.classList.remove('active');
        renderAdminProjects();
        renderAdminDashboard();
        renderAdminPayments();
        showToast(`Project ${activeAdminProjectId} deleted successfully!`, 'success');
      } else {
        showToast(`Failed to delete project: ${res?.error || 'Please try again.'}`, 'error');
      }
    });
  }



  // =========================================================================
  // 5. EQUIPMENT & INVENTORY WITH STEPPER (Mockups 41 & 42)
  // =========================================================================
  const equipmentModal = document.getElementById('adminEquipmentModal');
  const equipmentForm = document.getElementById('equipmentForm');
  const addEquipmentBtn = document.getElementById('btnAddEquipment');
  const equipmentModalTitle = equipmentModal?.querySelector('.modal-title');
  const saveEquipmentBtn = document.getElementById('btnSaveEquipment');

  function renderAdminInventory() {
    const tableBody = document.getElementById('adminInventoryTableBody');
    if (!tableBody) return;

    const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
    const list = BD22_DB.get('inventory') || [];
    tableBody.innerHTML = list.map(item => {
      let stockBadge = 'badge-completed';
      if (item.stockStatus === 'Low Stock') stockBadge = 'badge-urgent';

      return `
        <tr data-eq-id="${escapeHtml(item.id)}">
          <td>
            <div style="font-weight:700;">${escapeHtml(item.name)}</div>
            <button type="button" class="btn btn-outline btn-sm edit-eq-btn" data-edit-eq-id="${escapeHtml(item.id)}" style="margin-top:0.4rem;">Edit</button>
          </td>
          <td>${escapeHtml(item.type)}</td>
          <td><strong>${escapeHtml(item.quantity)}</strong></td>
          <td>${escapeHtml(item.nextMaintenance || 'Not scheduled')}</td>
          <td><span class="badge-status inventory-stock-status ${stockBadge}">${escapeHtml(item.stockStatus)}</span></td>
        </tr>
      `;
    }).join('');

    tableBody.querySelectorAll('.edit-eq-btn').forEach(button => {
      button.addEventListener('click', () => {
        const eqId = button.getAttribute('data-edit-eq-id');
        if (eqId) openEquipmentModal(eqId);
      });
    });
  }

  let currentEquipmentId = null;
  let currentStepperQuantity = 1;
  let currentEquipmentProject = 'General Stock';

  function openNewEquipmentModal() {
    if (!equipmentModal || !equipmentForm) return;
    currentEquipmentId = null;
    currentEquipmentProject = 'General Stock';
    currentStepperQuantity = 1;
    equipmentForm.reset();
    document.getElementById('stepperValue').textContent = currentStepperQuantity;
    if (equipmentModalTitle) equipmentModalTitle.textContent = 'Add Equipment to Inventory';
    if (saveEquipmentBtn) saveEquipmentBtn.textContent = 'Add Equipment';
    equipmentModal.classList.add('active');
  }

  function openEquipmentModal(eqId) {
    const list = BD22_DB.get('inventory') || [];
    const eq = list.find(i => i.id === eqId);
    if (!eq || !equipmentModal) return;

    currentEquipmentId = eqId;
    currentEquipmentProject = eq.customerProject || 'General Stock';
    currentStepperQuantity = Number(eq.quantity) || 0;

    document.getElementById('modalEqName').value = eq.name;
    const categorySelect = document.getElementById('modalEqType');
    if (![...categorySelect.options].some(option => option.value === eq.type)) {
      categorySelect.add(new Option(eq.type, eq.type));
    }
    categorySelect.value = eq.type;
    const maintenanceDate = String(eq.nextMaintenance || '');
    const parsedDate = new Date(maintenanceDate);
    const parsedMaintenanceDate = /^\d{4}-\d{2}-\d{2}/.test(maintenanceDate)
      ? maintenanceDate.slice(0, 10)
      : (maintenanceDate && !Number.isNaN(parsedDate.getTime())
        ? `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`
        : '');
    document.getElementById('modalEqMaintenance').value = parsedMaintenanceDate;
    document.getElementById('stepperValue').textContent = currentStepperQuantity;
    if (equipmentModalTitle) equipmentModalTitle.textContent = 'Equipment Inventory & Stock';
    if (saveEquipmentBtn) saveEquipmentBtn.textContent = 'Save Inventory';

    equipmentModal.classList.add('active');
  }

  if (addEquipmentBtn) {
    addEquipmentBtn.addEventListener('click', openNewEquipmentModal);
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
  if (saveEquipmentBtn) {
    saveEquipmentBtn.addEventListener('click', async () => {
      if (!equipmentForm || !equipmentForm.reportValidity()) return;

      const name = document.getElementById('modalEqName').value.trim();
      const type = document.getElementById('modalEqType').value;
      const nextMaintenance = document.getElementById('modalEqMaintenance').value.trim();
      const isNewEquipment = !currentEquipmentId;
      const originalText = saveEquipmentBtn.textContent;
      saveEquipmentBtn.disabled = true;
      saveEquipmentBtn.textContent = isNewEquipment ? 'Adding...' : 'Saving...';

      try {
        const equipmentId = currentEquipmentId || `eq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const result = await BD22_DB.saveEquipment({
          id: equipmentId,
          isNew: isNewEquipment,
          name,
          type,
          customerProject: currentEquipmentProject,
          nextMaintenance,
          quantity: currentStepperQuantity
        });

        if (!result.success) {
          throw new Error(result.error || 'Unable to save inventory item.');
        }

        equipmentModal.classList.remove('active');
        renderAdminInventory();
        renderAdminDashboard();
        showToast(isNewEquipment ? 'Equipment added to inventory successfully!' : 'Inventory record updated successfully!', 'success');
      } catch (error) {
        console.error('Unable to save equipment:', error);
        showToast(`Unable to save equipment: ${error.message || 'Please try again.'}`, 'error');
      } finally {
        saveEquipmentBtn.disabled = false;
        saveEquipmentBtn.textContent = originalText;
      }
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
        showToast('Please select a valid registered customer account.', 'error');
        const select = document.getElementById('newInvCustomerSelect');
        if (select) select.focus();
        return;
      }

      if (amount <= 0) {
        showToast('Please enter a valid invoice amount.', 'error');
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
        renderAdminPayments();
        renderAdminProjects();
        renderAdminDashboard();
        showToast(`Invoice ${res.invoice.invoice_no} issued successfully for ${customer}!`, 'success');
      } else {
        showToast(`Invoice creation failed: ${res?.error || 'Unable to save invoice'}`, 'error');
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
            ${(item.billing_notes || item.notes) ? `
              <div style="font-size:0.75rem; color:#64748b; margin-top:0.2rem; max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                Remarks: ${item.billing_notes || item.notes}
              </div>
            ` : ''}
          </td>
          <td><strong>₱${totalAmt.toLocaleString()}</strong></td>
          <td><span style="color:#15803d; font-weight:600;">₱${paidAmt.toLocaleString()}</span></td>
          <td><span style="color:#b91c14; font-weight:700;">₱${balAmt.toLocaleString()}</span></td>
          <td><span class="payment-due-date">${item.dueDate || item.due_date || 'TBD'}</span></td>
          <td><span class="badge-status payment-status ${badgeClass}">${item.status}</span></td>
          <td>
            <button class="btn btn-outline btn-sm btn-open-invoice" data-inv="${invNum}" style="padding:0.3rem 0.65rem; font-size:0.8rem;">
              Manage
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

    // Payment Form Setup
    const payAmtInput = document.getElementById('adminRecordPayAmount');
    if (payAmtInput) {
      payAmtInput.removeAttribute('max');
      payAmtInput.setAttribute('step', 'any');
      payAmtInput.value = '';
      payAmtInput.placeholder = balAmt > 0 ? `Remaining balance: ₱${balAmt.toLocaleString()}` : 'Enter amount received';
    }

    const payDateInput = document.getElementById('adminRecordPayDate');
    if (payDateInput) payDateInput.value = new Date().toISOString().split('T')[0];

    adminInvoiceModal.classList.add('active');
  }

  // Record Payment Settlement Form Submit
  const adminRecordPaymentForm = document.getElementById('adminRecordPaymentForm');
  if (adminRecordPaymentForm) {
    adminRecordPaymentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!activeAdminInvoiceNo) return;

      const submitBtn = document.getElementById('btnPostAdminPayment') || document.getElementById('btnSubmitAdminPayment');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting Settlement...';
      }

      const amount = Number(document.getElementById('adminRecordPayAmount')?.value || 0);
      const method = document.getElementById('adminRecordPayMethod')?.value || 'BDO Unibank Online Transfer';
      const date = document.getElementById('adminRecordPayDate')?.value || '';

      if (amount <= 0) {
        showToast('Please enter a valid payment amount.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Post Payment Settlement & Update Balance';
        }
        return;
      }

      const res = await BD22_DB.recordPayment(activeAdminInvoiceNo, {
        amount,
        method,
        date
      });

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Post Payment Settlement & Update Balance';
      }

      if (res && res.success) {
        adminInvoiceModal.classList.remove('active');
        renderAdminPayments();
        renderAdminDashboard();
        renderAdminProjects();
        showToast(`Payment of ₱${amount.toLocaleString()} recorded successfully for Invoice ${activeAdminInvoiceNo}! Status: ${res.invoice.status}.`, 'success');
      } else {
        showToast(`Payment recording failed: ${res?.error || 'Could not record'}`, 'error');
      }
    });
  }

  // Delete All Payments & Invoices Action
  const btnAdminDeleteAllPayments = document.getElementById('btnAdminDeleteAllPayments');
  if (btnAdminDeleteAllPayments) {
    btnAdminDeleteAllPayments.addEventListener('click', async () => {
      const payments = BD22_DB.get('payments') || [];
      if (payments.length === 0) {
        showToast('There are no invoices or billing records to delete.', 'info');
        return;
      }

      const confirmPurge = window.confirm(
        `Are you sure you want to permanently delete ALL ${payments.length} invoice(s) and billing records?\n\nThis will remove invoices from Payment & Billing, Dashboard metrics, and the Customer Portal.\nCustomer accounts and profiles will NOT be affected.`
      );
      if (!confirmPurge) return;

      const originalText = btnAdminDeleteAllPayments.innerHTML;
      btnAdminDeleteAllPayments.disabled = true;
      btnAdminDeleteAllPayments.innerHTML = '<span>Deleting all invoices...</span>';

      const res = await BD22_DB.deleteAllPayments();
      btnAdminDeleteAllPayments.disabled = false;
      btnAdminDeleteAllPayments.innerHTML = originalText;

      if (res && res.success) {
        renderAdminPayments();
        renderAdminDashboard();
        showToast('All invoices and billing records have been permanently deleted.', 'success');
      } else {
        showToast(`Failed to delete all invoices: ${res?.error || 'Please try again.'}`, 'error');
      }
    });
  }

  // Delete Single Invoice Action
  const btnAdminDeleteInvoice = document.getElementById('btnAdminDeleteInvoice');
  if (btnAdminDeleteInvoice) {
    btnAdminDeleteInvoice.addEventListener('click', async () => {
      if (!activeAdminInvoiceNo) return;

      const confirmDelete = window.confirm(
        `Are you sure you want to permanently delete invoice ${activeAdminInvoiceNo}?\n\nThis invoice will be removed from Payment & Billing, Dashboard metrics, and the Customer Portal.\nCustomer accounts will NOT be affected.`
      );
      if (!confirmDelete) return;

      const originalHtml = btnAdminDeleteInvoice.innerHTML;
      btnAdminDeleteInvoice.disabled = true;
      btnAdminDeleteInvoice.innerHTML = '<span>Deleting...</span>';

      const res = await BD22_DB.deletePayment(activeAdminInvoiceNo);
      btnAdminDeleteInvoice.disabled = false;
      btnAdminDeleteInvoice.innerHTML = originalHtml;

      if (res && res.success) {
        if (adminInvoiceModal) adminInvoiceModal.classList.remove('active');
        renderAdminPayments();
        renderAdminDashboard();
        showToast(`Invoice ${activeAdminInvoiceNo} deleted successfully!`, 'success');
      } else {
        showToast(`Failed to delete invoice: ${res?.error || 'Please try again.'}`, 'error');
      }
    });
  }

  // =========================================================================
  // 7. WARRANTY TRACKING (Mockup 44)
  // =========================================================================
  function renderAdminWarranties(filter = 'Active') {
    const container = document.getElementById('adminWarrantiesList');
    if (!container) return;

    let list = BD22_DB.get('warranties') || [];
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

    let list = BD22_DB.get('maintenance') || [];
    if (filter === 'Overdue') list = list.filter(m => m.status === 'Overdue');
    if (filter === 'Due') list = list.filter(m => m.status === 'Due');
    if (filter === 'Upcoming') list = list.filter(m => m.status === 'Upcoming' || m.status === 'Scheduled');

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1.5rem; color: #64748b; background: #ffffff; border-radius: 8px; border: 1px dashed #cbd5e1;">
          No maintenance visits scheduled in "${filter}" status. Click "+ Schedule Maintenance" to add an inspection schedule.
        </div>
      `;
      return;
    }

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

  // Manual Maintenance Modal Controls & Scheduling
  const newMaintModal = document.getElementById('adminNewMaintenanceModal');
  const newMaintForm = document.getElementById('adminNewMaintenanceForm');
  const btnOpenNewMaint = document.getElementById('btnAdminOpenNewMaintenanceModal');

  function openAdminNewMaintenanceModal(preselectedProjCode = null) {
    if (!newMaintModal) return;

    // Populate projects dropdown
    const projSelect = document.getElementById('adminMaintProjSelect');
    if (projSelect) {
      const projects = BD22_DB.get('projects') || [];
      if (projects.length === 0) {
        projSelect.innerHTML = '<option value="">No projects found. Please create a project first.</option>';
      } else {
        projSelect.innerHTML = '<option value="">-- Choose Project & Customer --</option>' +
          projects.map(p => {
            const pCode = p.project_code || p.id;
            const pName = p.name || 'Fire Protection Project';
            const pCust = p.customer || p.customer_name || 'Client';
            const isSelected = preselectedProjCode && (pCode === preselectedProjCode || p.id === preselectedProjCode);
            return `<option value="${pCode}" ${isSelected ? 'selected' : ''}>${pCode}: ${pName} (${pCust})</option>`;
          }).join('');
      }
    }

    const titleInput = document.getElementById('adminMaintTitle');
    const dateInput = document.getElementById('adminMaintDate');

    if (dateInput && !dateInput.value) {
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      dateInput.value = nextMonth.toISOString().split('T')[0];
    }

    if (preselectedProjCode) {
      const projects = BD22_DB.get('projects') || [];
      const p = projects.find(x => (x.project_code || x.id) === preselectedProjCode || x.id === preselectedProjCode);
      if (titleInput && (!titleInput.value || titleInput.value.trim() === '')) {
        titleInput.value = `Quarterly Inspection - ${p ? p.name : 'Fire Protection System'}`;
      }
    } else {
      if (titleInput) titleInput.value = '';
    }

    newMaintModal.classList.add('active');
  }

  if (btnOpenNewMaint) {
    btnOpenNewMaint.addEventListener('click', () => {
      openAdminNewMaintenanceModal();
    });
  }

  if (newMaintForm) {
    newMaintForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const projCode = document.getElementById('adminMaintProjSelect')?.value;
      const title = document.getElementById('adminMaintTitle')?.value.trim();
      const schedDate = document.getElementById('adminMaintDate')?.value;

      if (!projCode) {
        showToast('Please select a project for this maintenance schedule.', 'error');
        return;
      }
      if (!title || !schedDate) {
        showToast('Please provide a title and scheduled maintenance date.', 'error');
        return;
      }

      const submitBtn = document.getElementById('btnSubmitNewMaintenance');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving Schedule...';
      }

      const res = await BD22_DB.createMaintenanceSchedule({
        project_code: projCode,
        title: title,
        scheduledDate: schedDate
      });

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Maintenance Schedule';
      }

      if (res && res.success) {
        newMaintModal.classList.remove('active');
        newMaintForm.reset();
        renderAdminMaintenance();
        renderAdminDashboard();
        showToast(`Maintenance schedule created successfully for project ${projCode}!`, 'success');
      } else {
        showToast(`Error creating schedule: ${res?.error || 'Database operation failed'}`, 'error');
      }
    });
  }

  // =========================================================================
  // 9. SERVICE HISTORY (Mockup 46)
  // =========================================================================
  function renderAdminHistory() {
    const container = document.getElementById('adminHistoryTimeline');
    if (!container) return;

    const history = BD22_DB.get('serviceHistory') || [];
    const allProjects = BD22_DB.get('projects') || [];
    const warranties = BD22_DB.get('warranties') || [];
    const completedProjects = allProjects.filter(p => p.status === 'Completed');

    const combinedHistory = [...history];
    completedProjects.forEach(p => {
      const pCode = p.project_code || p.id;
      const alreadyPresent = combinedHistory.some(h => 
        (h.project_code && h.project_code === pCode) ||
        (h.title && h.title.includes(pCode)) ||
        (h.project_id && (h.project_id === pCode || h.project_id === p.id))
      );
      if (!alreadyPresent) {
        const completionDate = p.actual_completion_date || p.actualCompletionDate || p.start_date || 'Completed';
        const budget = Number(p.budget || p.amount || 0);
        combinedHistory.unshift({
          id: 'hist-' + (p.db_id || pCode),
          project_code: pCode,
          project_id: pCode,
          title: `Project Commissioning & Turnover: ${p.name} (${pCode})`,
          description: p.description || 'Fire protection system installation, testing, and operational turnover completed.',
          date: formatDate(completionDate),
          service_date: completionDate,
          total_cost: budget,
          payment_status: 'Paid',
          equipment_installed: p.name || 'Fire Protection Equipment',
          badge: 'Completed',
          logged_by: p.project_manager || p.manager || 'Operations Lead',
          warranty_note: '1-Year Warranty Given'
        });
      }
    });

    if (combinedHistory.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #64748b;">
          No company service history records logged yet.
        </div>
      `;
      return;
    }

    container.innerHTML = combinedHistory.map(item => {
      const projCode = item.project_code || item.project_id || '';
      const matchingWarr = warranties.find(w => 
        (projCode && (w.project_code === projCode || w.project_id === projCode)) ||
        (item.title && w.system_covered && item.title.includes(w.system_covered))
      );
      const isCompleted = item.status === 'Completed' || item.badge === 'Completed' || item.activity_type === 'Project Turnover' || item.activityType === 'Project Turnover' || (item.title && (item.title.includes('Turnover') || item.title.includes('Commissioning')));
      const payStatus = isCompleted ? 'Paid' : (item.payment_status || 'Paid');
      const payBadgeClass = payStatus === 'Paid' ? 'badge-paid' : (payStatus === 'Partial' ? 'badge-partial' : 'badge-unpaid');
      const cleanDesc = (item.description || '').replace(/Payment Status:\s*Unpaid/gi, 'Payment Status: Paid');
      const costText = item.total_cost ? ` • Cost: ₱${Number(item.total_cost).toLocaleString()}` : '';
      const warrInfo = matchingWarr
        ? `<div style="margin-top:0.35rem; display:inline-flex; align-items:center; gap:0.4rem; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:6px; padding:0.25rem 0.6rem; font-size:0.8rem; font-weight:700; color:#065f46;">
             <span>✓ 1-Year Comprehensive Warranty (Expires: ${matchingWarr.expiryDate || matchingWarr.expiry_date} • ${matchingWarr.status})</span>
           </div>`
        : `<div style="margin-top:0.35rem; display:inline-flex; align-items:center; gap:0.4rem; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:6px; padding:0.25rem 0.6rem; font-size:0.8rem; font-weight:700; color:#065f46;">
             <span>✓ 1-Year Comprehensive Warranty given</span>
           </div>`;

      return `
        <div class="timeline-item" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:1.25rem; margin-bottom:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem;">
            <div>
              ${projCode ? `<span class="ref-code" style="font-size:0.75rem;">${projCode}</span>` : ''}
              <div class="timeline-text" style="font-size:1rem; font-weight:700; color:#1e293b; margin-top:0.2rem;">
                ${item.title || item.eventType}
              </div>
            </div>
            <div style="display:flex; gap:0.4rem; align-items:center;">
              <span class="badge-status badge-completed">${item.badge || 'Completed'}</span>
              <span class="badge-status ${payBadgeClass}">${payStatus}</span>
            </div>
          </div>
          <p style="font-size:0.9rem; color:#475569; margin:0.5rem 0; line-height:1.5;">${cleanDesc}</p>
          <div style="font-size: 0.82rem; color: #64748b; margin-top: 0.25rem;">
            Completed: <strong>${item.date}</strong>${costText} • Performed by: ${item.logged_by || item.performedBy || 'Admin Operations'}
          </div>
          ${warrInfo}
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // 11. PROFILE & SETTINGS
  // =========================================================================
  const profileForm = document.getElementById('adminEditProfileForm');
  const btnSaveProfile = document.getElementById('btnSaveProfile');

  function renderAdminProfileView() {
    const prof = BD22_DB.get('adminProfile') || {};
    const user = BD22_DB.get('currentUser') || {};

    const adminName = prof.name || user.full_name || user.name || 'Engr. Roberto Dela Cruz';
    const adminEmail = prof.email || user.email || 'admin@bd22fire.com';
    const adminPhone = prof.phone || user.phone || '+63 917 555 8899';
    const nameParts = adminName.trim().split(/\s+/);
    const adminFname = prof.firstName || user.first_name || nameParts[0] || 'Roberto';
    const adminLname = prof.lastName || user.last_name || nameParts.slice(1).join(' ') || 'Dela Cruz';

    const fnInput = document.getElementById('editAdminFirstName');
    const lnInput = document.getElementById('editAdminLastName');
    const phInput = document.getElementById('editAdminPhone');
    const emInput = document.getElementById('editAdminEmail');

    if (fnInput) fnInput.value = adminFname;
    if (lnInput) lnInput.value = adminLname;
    if (phInput) phInput.value = adminPhone;
    if (emInput) emInput.value = adminEmail;
  }

  // Real-time input sanitization for admin profile
  const adminFirstInput = document.getElementById('editAdminFirstName');
  if (adminFirstInput) {
    adminFirstInput.addEventListener('input', () => {
      if (/\d/.test(adminFirstInput.value)) {
        adminFirstInput.value = adminFirstInput.value.replace(/\d/g, '');
        const hint = document.getElementById('editAdminFirstNameHint');
        if (hint) {
          hint.style.display = 'block';
          setTimeout(() => { if (hint) hint.style.display = 'none'; }, 3500);
        }
      }
    });
  }

  const adminLastInput = document.getElementById('editAdminLastName');
  if (adminLastInput) {
    adminLastInput.addEventListener('input', () => {
      if (/\d/.test(adminLastInput.value)) {
        adminLastInput.value = adminLastInput.value.replace(/\d/g, '');
        const hint = document.getElementById('editAdminLastNameHint');
        if (hint) {
          hint.style.display = 'block';
          setTimeout(() => { if (hint) hint.style.display = 'none'; }, 3500);
        }
      }
    });
  }

  const adminPhoneInput = document.getElementById('editAdminPhone');
  if (adminPhoneInput) {
    adminPhoneInput.addEventListener('input', () => {
      if (/[a-zA-Z]/.test(adminPhoneInput.value)) {
        adminPhoneInput.value = adminPhoneInput.value.replace(/[a-zA-Z]/g, '');
        const hint = document.getElementById('editAdminPhoneHint');
        if (hint) {
          hint.style.display = 'block';
          setTimeout(() => { if (hint) hint.style.display = 'none'; }, 3500);
        }
      }
    });
  }

  if (profileForm && btnSaveProfile) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!profileForm.reportValidity()) return;

      const firstName = document.getElementById('editAdminFirstName').value.trim();
      const lastName = document.getElementById('editAdminLastName').value.trim();
      const phone = document.getElementById('editAdminPhone').value.trim();
      const email = document.getElementById('editAdminEmail').value.trim();

      if (!firstName || !lastName || !phone || !email) {
        showToast('Please fill in all profile fields.', 'error');
        return;
      }

      if (/\d/.test(firstName)) {
        showToast('First Name cannot contain numbers. Please use letters only.', 'error');
        return;
      }
      if (/\d/.test(lastName)) {
        showToast('Last Name cannot contain numbers. Please use letters only.', 'error');
        return;
      }
      const nameRegex = /^[a-zA-Z\u00C0-\u024F\s.\-']+$/;
      if (!nameRegex.test(firstName) || firstName.replace(/[^a-zA-Z\u00C0-\u024F]/g, '').length < 2) {
        showToast('Please enter a valid First Name (at least 2 letters, no numbers).', 'error');
        return;
      }
      if (!nameRegex.test(lastName) || lastName.replace(/[^a-zA-Z\u00C0-\u024F]/g, '').length < 2) {
        showToast('Please enter a valid Last Name (at least 2 letters, no numbers).', 'error');
        return;
      }

      if (/[a-zA-Z]/.test(phone)) {
        showToast('Phone number cannot contain letters.', 'error');
        return;
      }
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        showToast('Please enter a valid phone number (between 7 and 15 digits).', 'error');
        return;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
      }

      const originalLabel = btnSaveProfile.textContent;
      btnSaveProfile.disabled = true;
      btnSaveProfile.textContent = 'Saving...';

      try {
        const result = await BD22_DB.saveProfile({
          firstName,
          lastName,
          phone,
          email
        });

        if (!result?.success) {
          showToast(`Unable to save profile: ${result?.error || 'Please try again.'}`, 'error');
          return;
        }

        showToast(result.emailConfirmationRequired
          ? 'Profile saved. Confirm the email change using the link sent to your email.'
          : 'Admin profile updated successfully!');
        renderAdminProfileView();
      } catch (error) {
        console.error('Save admin profile error:', error);
        showToast(`Unable to save profile: ${error.message || 'Please try again.'}`, 'error');
      } finally {
        btnSaveProfile.disabled = false;
        btnSaveProfile.textContent = originalLabel;
      }
    });
  }

  // Select the initial view after all view-specific controls are initialized.
  const initialHash = window.location.hash.replace('#', '') || 'admin-dashboard';
  if (titlesMap[initialHash]) {
    switchAdminView(initialHash);
  } else {
    switchAdminView('admin-dashboard');
  }
});
