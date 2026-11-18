/**
 * BD22 FIRE SYSTEM & BUILDERS INC. - CUSTOMER PORTAL CONTROLLER
 * Authoritative Supabase Database-Driven Customer Portal
 */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation tabs
  const navLinks = document.querySelectorAll('.customer-sidebar .sidebar-nav-link');
  const views = document.querySelectorAll('.portal-view');
  const topbarTitle = document.getElementById('topbarPageTitle');

  // Mobile sidebar drawer
  const mobileToggle = document.getElementById('mobileSidebarToggle');
  const sidebar = document.querySelector('.customer-sidebar') || document.querySelector('.sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');

  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('mobile-open');
      if (backdrop) backdrop.classList.toggle('active');
    });
  }

  if (backdrop && sidebar) {
    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      backdrop.classList.remove('active');
    });
  }

  const titlesMap = {
    'overview': 'Overview',
    'inquiries': 'My Inquiries',
    'projects': 'Services & Projects',
    'payments': 'Payments',
    'warranty': 'Warranty',
    'maintenance': 'Maintenance',
    'history': 'Service History',
    'messages': 'Messages',
    'settings': 'Account Settings'
  };

  function switchView(viewName) {
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

    // Refresh specific view data
    if (viewName === 'overview') renderOverview();
    if (viewName === 'inquiries') renderInquiries();
    if (viewName === 'projects') renderProjects();
    if (viewName === 'payments') renderPayments();
    if (viewName === 'warranty') renderWarranties('Active');
    if (viewName === 'maintenance') renderMaintenance('All');
    if (viewName === 'history') renderHistory();
    if (viewName === 'messages') renderMessages();
    if (viewName === 'settings') renderSettings();

    // Close mobile drawer upon view switch
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');

    // Update URL hash
    window.location.hash = viewName;
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-view');
      if (target) switchView(target);
    });
  });

  // Handle URL hash on load
  const initialHash = window.location.hash.replace('#', '') || 'overview';
  if (titlesMap[initialHash]) {
    switchView(initialHash);
  } else {
    switchView('overview');
  }

  // Live database synchronization listener
  window.addEventListener('bd22_synced', () => {
    updateCustomerDisplay();
    const cur = window.location.hash.replace('#', '') || 'overview';
    if (titlesMap[cur]) {
      switchView(cur);
    }
  });

  function updateCustomerDisplay() {
    const user = BD22_DB.get('currentUser');
    const nameEl = document.getElementById('sidebarCustomerName');
    const emailEl = document.getElementById('sidebarCustomerEmail');
    const menuHeaderEl = document.getElementById('topbarUserMenuHeader');
    const greetingCustName = document.getElementById('greetingCustName');
    const greetingCustCompany = document.getElementById('greetingCustCompany');

    if (!user || typeof user !== 'object' || !user.id) {
      if (nameEl) nameEl.textContent = 'Customer Account';
      if (emailEl) emailEl.textContent = '';
      return;
    }

    const displayName = user.full_name || user.name || 'Customer';
    const displayEmail = user.email || '';
    const displayCompany = user.company || 'Facility Operations';

    if (nameEl) nameEl.textContent = displayName;
    if (emailEl) emailEl.textContent = displayEmail;
    if (menuHeaderEl) {
      menuHeaderEl.innerHTML = `${displayName}<div style="font-size:0.8rem; font-weight:500; color:#64748b;">${displayCompany}</div>`;
    }
    if (greetingCustName) greetingCustName.textContent = displayName;
    if (greetingCustCompany) greetingCustCompany.textContent = displayCompany;
  }

  updateCustomerDisplay();

  // User menu dropdown toggle
  const userAvatar = document.getElementById('userAvatarBtn');
  const userMenu = document.getElementById('userMenuDropdown');
  if (userAvatar && userMenu) {
    userAvatar.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenu.classList.toggle('active');
    });
    document.addEventListener('click', () => {
      userMenu.classList.remove('active');
    });
  }

  // =========================================================================
  // VIEW 1: OVERVIEW (Mockup 13)
  // =========================================================================
  function renderOverview() {
    updateCustomerDisplay();
    const projects = BD22_DB.get('projects') || [];
    const inquiries = BD22_DB.get('inquiries') || [];
    const serviceRequests = BD22_DB.get('serviceRequests') || [];
    const payments = BD22_DB.get('payments') || [];
    const warranties = BD22_DB.get('warranties') || [];
    const maintenance = BD22_DB.get('maintenance') || [];

    // Combine requests & inquiries for customer view
    const allRequests = [...serviceRequests, ...inquiries];

    // Stats
    const activeProjectsCount = projects.filter(p => p.status === 'In Progress').length;
    const pendingInqCount = allRequests.filter(i => 
      i.status === 'Pending Review' || 
      i.status === 'Under Assessment' || 
      i.status === 'Under Review' || 
      i.status === 'Quotation Prepared'
    ).length;
    const activeWarrCount = warranties.filter(w => w.status === 'Active').length;
    
    // Balance
    let balance = 0;
    payments.forEach(p => {
      if (p.status !== 'Paid') {
        const itemBal = p.balance !== undefined ? Number(p.balance) : Number(p.amount);
        balance += (itemBal || 0);
      }
    });

    const elProj = document.getElementById('statActiveProjects');
    const elInq = document.getElementById('statPendingInquiries');
    const elBal = document.getElementById('statOutstandingBalance');
    const elWarr = document.getElementById('statActiveWarranties');

    if (elProj) elProj.textContent = activeProjectsCount;
    if (elInq) elInq.textContent = pendingInqCount;
    if (elBal) elBal.textContent = '₱' + balance.toLocaleString();
    if (elWarr) elWarr.textContent = activeWarrCount;

    // Dynamically populate Recent Activity widget
    const activityContainer = document.getElementById('overviewActivityList');
    if (activityContainer) {
      const recentItems = allRequests.slice(0, 4);
      if (recentItems.length > 0) {
        activityContainer.innerHTML = recentItems.map(item => {
          let dot = 'dot-blue';
          if (item.status === 'Pending Review') dot = 'dot-red';
          else if (item.status === 'Under Assessment' || item.status === 'Quotation Prepared') dot = 'dot-yellow';
          else if (item.status === 'Scheduled' || item.status === 'Approved') dot = 'dot-blue';
          else if (item.status === 'In Progress') dot = 'dot-yellow';
          else if (item.status === 'Completed') dot = 'dot-green';

          const siteLabel = item.establishment_name ? ` • Site: ${item.establishment_name}` : '';
          return `
            <div class="activity-item">
              <div class="activity-dot ${dot}"></div>
              <div class="activity-body">
                <span class="activity-title">${item.service} (${item.reference}) — ${item.status}</span>
                <span class="activity-time">${item.dateSubmitted || 'Recent'}${siteLabel} • Assigned: ${item.assignedStaff || 'Awaiting Staff Assignment'}</span>
              </div>
            </div>
          `;
        }).join('');
      } else {
        activityContainer.innerHTML = `
          <div style="text-align: center; padding: 2.5rem 1rem; color: #64748b; font-size: 0.95rem;">
            No recent activity recorded yet. Submit an inquiry or request service to get started.
          </div>
        `;
      }
    }

    // Dynamically populate Priority Action Items widget
    const actionContainer = document.getElementById('overviewPriorityActionList');
    if (actionContainer) {
      const actionItems = [];

      // 1. Pending, unpaid, or overdue invoices
      payments.forEach(p => {
        if (p.status !== 'Paid') {
          const itemBal = p.balance !== undefined ? Number(p.balance) : Number(p.amount);
          actionItems.push({
            dot: 'dot-red',
            title: `Outstanding Invoice ${p.invoice || p.invoice_no} (₱${itemBal.toLocaleString()})`,
            time: `Status: ${p.status} • Due: ${p.dueDate || 'Immediate'}`
          });
        }
      });

      // 2. Expiring warranties
      warranties.forEach(w => {
        if (w.status === 'Expiring Soon') {
          actionItems.push({
            dot: 'dot-yellow',
            title: `Warranty Expiring: ${w.title}`,
            time: `Expires on: ${w.expiryDate || 'Soon'} • Ref: ${w.ref}`
          });
        }
      });

      // 3. Due or overdue maintenance
      maintenance.forEach(m => {
        if (m.status === 'Overdue' || m.status === 'Due') {
          actionItems.push({
            dot: 'dot-blue',
            title: `Maintenance Required: ${m.title}`,
            time: `Scheduled: ${m.scheduledDate} • Technician: ${m.technician || 'Engineering Team'}`
          });
        }
      });

      if (actionItems.length > 0) {
        actionContainer.innerHTML = actionItems.slice(0, 4).map(item => `
          <div class="activity-item">
            <div class="activity-dot ${item.dot}"></div>
            <div class="activity-body">
              <span class="activity-title">${item.title}</span>
              <span class="activity-time">${item.time}</span>
            </div>
          </div>
        `).join('');
      } else {
        actionContainer.innerHTML = `
          <div style="text-align: center; padding: 2.5rem 1rem; color: #15803d; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
            <img src="assets/images/icons/check-inline.svg" alt="" style="width: 18px; height: 18px;"> All systems and accounts in good standing. No urgent action required.
          </div>
        `;
      }
    }
  }

  // =========================================================================
  // VIEW 2: MY INQUIRIES & SERVICE REQUESTS (Mockup 15)
  // =========================================================================
  const inqSearchInput = document.getElementById('customerInquirySearch');
  const inqStatusFilter = document.getElementById('customerInquiryStatusFilter');

  function getCustomerStatusBadgeClass(status) {
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

  function renderInquiries() {
    const tbody = document.getElementById('customerInquiriesTableBody');
    if (!tbody) return;

    const inquiries = BD22_DB.get('inquiries') || [];
    const serviceRequests = BD22_DB.get('serviceRequests') || [];

    // Combine both collections, deduplicating by reference code
    const combinedMap = new Map();
    serviceRequests.forEach(sr => combinedMap.set(sr.reference, sr));
    inquiries.forEach(inq => {
      if (!combinedMap.has(inq.reference)) {
        combinedMap.set(inq.reference, inq);
      }
    });

    const allRecords = Array.from(combinedMap.values());
    const searchVal = (inqSearchInput?.value || '').toLowerCase().trim();
    const statusVal = inqStatusFilter?.value || 'All';

    const filtered = allRecords.filter(item => {
      const matchesSearch = (item.reference || '').toLowerCase().includes(searchVal) ||
                            (item.service || '').toLowerCase().includes(searchVal) ||
                            (item.establishment_name || '').toLowerCase().includes(searchVal) ||
                            (item.site_address || '').toLowerCase().includes(searchVal) ||
                            (item.description || item.trackingNote || '').toLowerCase().includes(searchVal);
      const matchesStatus = statusVal === 'All' || item.status === statusVal;
      return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding: 3.5rem 1.5rem; color: #64748b;">
            <img src="assets/images/empty/empty-inquiries.svg" class="empty-state-img" alt="No Inquiries">
            <strong>No service requests or inquiries found</strong>
            <p style="margin-top:0.25rem; font-size:0.85rem;">Click "+ Request Service" to submit your facility specifications.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(item => {
      const badgeClass = getCustomerStatusBadgeClass(item.status);
      const siteName = item.establishment_name || item.customer || 'Facility Site';
      const buildingInfo = item.building_type ? ` • ${item.building_type}` : '';
      const displayDate = item.preferred_date || item.dateSubmitted;

      return `
        <tr data-ref="${item.reference}">
          <td class="ref-code">${item.reference}</td>
          <td>
            <div style="font-weight: 700; color:#1e293b;">${item.service}</div>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.15rem;">${siteName}${buildingInfo}</div>
          </td>
          <td><span class="date-pill">${displayDate}</span></td>
          <td><span class="badge-status ${badgeClass}">${item.status}</span></td>
          <td>${item.assignedStaff || 'Awaiting Staff Assignment'}</td>
          <td style="color: #64748b;">${item.lastUpdate || 'Just now'}</td>
          <td><span class="row-action-arrow">›</span></td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('tr').forEach(row => {
      row.addEventListener('click', () => {
        const ref = row.getAttribute('data-ref');
        const item = allRecords.find(i => i.reference === ref);
        if (item) openInquiryDetailModal(item);
      });
    });
  }

  if (inqSearchInput) inqSearchInput.addEventListener('input', renderInquiries);
  if (inqStatusFilter) inqStatusFilter.addEventListener('change', renderInquiries);

  const custInqModal = document.getElementById('custInquiryDetailModal');
  function openInquiryDetailModal(item) {
    if (!custInqModal) return;

    // Header
    const refEl = document.getElementById('custInqRef');
    if (refEl) refEl.textContent = item.reference;
    
    const dateSubEl = document.getElementById('custInqDateSubmitted');
    if (dateSubEl) dateSubEl.textContent = `Submitted: ${item.dateSubmitted || 'Recent'}`;
    
    const badge = document.getElementById('custInqStatus');
    if (badge) {
      badge.textContent = item.status;
      badge.className = 'badge-status ' + getCustomerStatusBadgeClass(item.status);
    }

    // Section 1: Service Info
    const srvEl = document.getElementById('custInqService');
    if (srvEl) srvEl.textContent = item.service || item.service_name || 'General Inquiry';
    
    const urgEl = document.getElementById('custInqUrgency');
    if (urgEl) urgEl.textContent = item.urgency || 'Standard (Within 5 days)';
    
    const prefEl = document.getElementById('custInqPreferredDate');
    if (prefEl) prefEl.textContent = item.preferred_date ? `${item.preferred_date} (${item.preferred_timeline || 'Business hours'})` : (item.preferred_timeline || 'Pending schedule');
    
    const descEl = document.getElementById('custInqDescription');
    if (descEl) descEl.textContent = item.description || item.message || item.trackingNote || 'Inspection and assessment requested.';

    // Section 2 & 3: Site & Location
    const estEl = document.getElementById('custInqEstName');
    if (estEl) estEl.textContent = item.establishment_name || item.customer || 'Facility Site';
    
    const bldgEl = document.getElementById('custInqBuildingDetails');
    if (bldgEl) {
      const buildingTxt = `${item.building_type || 'Commercial Facility'}${item.floors ? ' • ' + item.floors : ''}`;
      bldgEl.textContent = buildingTxt;
    }
    
    const addrEl = document.getElementById('custInqSiteAddress');
    if (addrEl) addrEl.textContent = item.site_address || 'Address provided during technician dispatch.';

    const mapsWrapper = document.getElementById('custInqMapsLinkWrapper');
    const mapsLink = document.getElementById('custInqMapsLink');
    if (mapsWrapper && mapsLink) {
      if (item.google_maps_link) {
        mapsLink.href = item.google_maps_link;
        mapsWrapper.style.display = 'block';
      } else {
        mapsWrapper.style.display = 'none';
      }
    }

    // Section 4: Contact Person
    const cNameEl = document.getElementById('custInqContactName');
    if (cNameEl) cNameEl.textContent = item.contact_name || item.customer;
    
    const cPosEl = document.getElementById('custInqContactPosition');
    if (cPosEl) cPosEl.textContent = item.contact_position || 'Facility Coordinator';
    
    const cPhoneEl = document.getElementById('custInqContactPhone');
    if (cPhoneEl) cPhoneEl.textContent = item.contact_phone || item.phone || 'Phone on file';
    
    const cEmailEl = document.getElementById('custInqContactEmail');
    if (cEmailEl) cEmailEl.textContent = item.contact_email || item.email || 'Email on file';

    // Section 5: Attachments & Concerns
    const attachList = document.getElementById('custInqAttachmentsList');
    if (attachList) {
      if (item.attachments && item.attachments.length > 0) {
        attachList.innerHTML = item.attachments.map(att => `
          <span class="attachment-pill">
            ${att.type === 'floor_plan' ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:3px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:3px;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'} ${att.name} ${att.size ? '(' + Math.round(att.size / 1024) + ' KB)' : ''}
          </span>
        `).join('');
      } else {
        attachList.innerHTML = '<span style="font-size:0.85rem; color:#94a3b8;">No attachments provided with this request.</span>';
      }
    }

    const concernsWrapper = document.getElementById('custInqConcernsWrapper');
    const concernsText = document.getElementById('custInqOtherConcerns');
    if (concernsWrapper && concernsText) {
      if (item.additional_concerns) {
        concernsText.textContent = item.additional_concerns;
        concernsWrapper.style.display = 'block';
      } else {
        concernsWrapper.style.display = 'none';
      }
    }

    // Section 6: Engineering Operations Assessment
    const staffEl = document.getElementById('custInqStaff');
    if (staffEl) staffEl.textContent = item.assignedStaff || 'Awaiting Staff Assignment';
    
    const schedEl = document.getElementById('custInqConfirmedDate');
    if (schedEl) schedEl.textContent = item.confirmed_schedule || 'Pending Engineering Confirmation';
    
    const quoteWrapper = document.getElementById('custInqQuotationWrapper');
    const quoteEl = document.getElementById('custInqQuotation');
    if (quoteWrapper && quoteEl) {
      if (item.quotation_amount && Number(item.quotation_amount) > 0) {
        quoteEl.textContent = '₱' + Number(item.quotation_amount).toLocaleString();
        quoteWrapper.style.display = 'block';
      } else {
        quoteWrapper.style.display = 'none';
      }
    }

    const notesEl = document.getElementById('custInqNotes');
    if (notesEl) {
      notesEl.textContent = item.assessment_notes || item.trackingNote || 'Our service team is reviewing site requirements and will coordinate the next activity.';
    }

    custInqModal.classList.add('active');
  }

  // =========================================================================
  // VIEW 3: SERVICES & PROJECTS (Mockups 16 & 17 Enhanced)
  // =========================================================================
  const custProjModal = document.getElementById('custProjectDetailModal');

  function renderProjects() {
    const grid = document.getElementById('customerProjectsGrid');
    if (!grid) return;

    const projects = BD22_DB.get('projects') || [];

    if (projects.length === 0) {
      grid.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1.5rem; background: #ffffff; border-radius: 12px; border: 1px dashed #cbd5e1;">
          <img src="assets/images/empty/empty-projects.svg" class="empty-state-img" alt="No Active Projects">
          <h4 style="font-weight: 700; color: #1e293b; margin-bottom: 0.35rem;">No Active Projects</h4>
          <p style="color: #64748b; font-size: 0.9rem;">You do not have any ongoing installations or retrofits yet. Submit a service request to initiate a project.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = projects.map(p => {
      let badgeClass = 'badge-in-progress';
      if (p.status === 'Completed') badgeClass = 'badge-completed';
      else if (p.status === 'Scheduled') badgeClass = 'badge-scheduled';
      else if (p.status === 'Not Started') badgeClass = 'badge-not-started';
      else if (p.status === 'On Hold') badgeClass = 'badge-on-hold';

      const projCode = p.project_code || p.id || 'BD22-PRJ';
      const budgetFormatted = Number(p.budget || 0) > 0 ? `₱${Number(p.budget).toLocaleString()}` : 'Quotation Pending';

      // Milestone counts
      let tasksCountText = '';
      if (Array.isArray(p.tasks) && p.tasks.length > 0) {
        const completedCount = p.tasks.filter(t => t.completed).length;
        tasksCountText = `<div style="font-size:0.8rem; color:#64748b; margin-top:0.35rem;">Milestones: <strong>${completedCount} / ${p.tasks.length} completed</strong></div>`;
      }

      return `
        <div class="portal-project-card">
          <div class="project-card-header">
            <div>
              <span class="ref-code" style="font-size:0.75rem;">${projCode}</span>
              <h3 class="portal-project-card-title" style="margin-top:0.35rem;">${p.name}</h3>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.35rem;">
              <span class="badge-status ${badgeClass}">${p.status}</span>
            </div>
          </div>
          <p class="portal-project-subtitle">Assigned Lead: <strong>${p.project_manager || p.manager || 'Engr. M. Velasco'}</strong> (${p.team || p.assigned_team || 'Team Alpha'})</p>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${p.progress || 0}%;"></div>
          </div>
          <div class="progress-info-row">
            <span>Target completion: ${p.targetDate || p.target_date || 'TBD'}</span>
            <span>${p.progress || 0}%</span>
          </div>
          ${tasksCountText}
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.25rem; padding-top:0.75rem; border-top:1px solid #f1f5f9;">
            <span style="font-size:0.85rem; color:#475569;">Contract: <strong style="color:#1e293b;">${budgetFormatted}</strong></span>
            <button class="project-details-btn" data-proj-id="${projCode}">Details →</button>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.project-details-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.getAttribute('data-proj-id');
        const proj = projects.find(p => (p.project_code || p.id) === pid);
        if (proj && custProjModal) {
          openCustProjectDetailModal(proj);
        }
      });
    });
  }

  function openCustProjectDetailModal(proj) {
    if (!custProjModal) return;

    const projCode = proj.project_code || proj.id || 'BD22-PRJ';
    const titleEl = document.getElementById('custProjTitle');
    if (titleEl) titleEl.textContent = proj.name;

    const codeEl = document.getElementById('custProjCode');
    if (codeEl) codeEl.textContent = projCode;

    const dateEl = document.getElementById('custProjDate');
    if (dateEl) dateEl.textContent = proj.targetDate || proj.target_date || 'TBD';

    const managerTeamEl = document.getElementById('custProjManagerTeam');
    if (managerTeamEl) {
      managerTeamEl.textContent = `${proj.project_manager || proj.manager || 'Engr. M. Velasco'} • ${proj.team || proj.assigned_team || 'Team Alpha'}`;
    }

    const statusBadge = document.getElementById('custProjBadge');
    if (statusBadge) {
      statusBadge.textContent = proj.status || 'In Progress';
      let badgeClass = 'badge-in-progress';
      if (proj.status === 'Completed') badgeClass = 'badge-completed';
      else if (proj.status === 'Scheduled') badgeClass = 'badge-scheduled';
      else if (proj.status === 'Not Started') badgeClass = 'badge-not-started';
      else if (proj.status === 'On Hold') badgeClass = 'badge-on-hold';
      statusBadge.className = `badge-status ${badgeClass}`;
    }

    const progFill = document.getElementById('custProjProgressFill');
    if (progFill) progFill.style.width = `${proj.progress || 0}%`;

    const progText = document.getElementById('custProjProgressText');
    if (progText) progText.textContent = `${proj.progress || 0}% Complete`;

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

    const invCodeEl = document.getElementById('custProjInvoiceCode');
    const invStatusEl = document.getElementById('custProjInvoiceStatus');
    const invTotalEl = document.getElementById('custProjInvoiceTotal');
    const invPaidEl = document.getElementById('custProjInvoicePaid');
    const invBalEl = document.getElementById('custProjInvoiceBalance');
    const invBtn = document.getElementById('custProjBtnGoToPayments');

    if (inv) {
      const curBal = inv.balance !== undefined ? Number(inv.balance) : (inv.status === 'Paid' ? 0 : Number(inv.amount));
      if (invCodeEl) invCodeEl.textContent = inv.invoice || inv.invoice_no;
      if (invStatusEl) {
        invStatusEl.textContent = inv.status;
        invStatusEl.className = `badge-status badge-${inv.status.toLowerCase().replace(/\s+/g, '-')}`;
      }
      if (invTotalEl) invTotalEl.textContent = `₱${Number(inv.amount).toLocaleString()}`;
      if (invPaidEl) invPaidEl.textContent = `₱${Number(inv.amount_paid || 0).toLocaleString()}`;
      if (invBalEl) invBalEl.textContent = `₱${curBal.toLocaleString()}`;
    } else {
      if (invCodeEl) invCodeEl.textContent = 'Pending Invoice';
      if (invStatusEl) {
        invStatusEl.textContent = 'Unbilled';
        invStatusEl.className = 'badge-status badge-pending';
      }
      if (invTotalEl) invTotalEl.textContent = `₱${Number(proj.budget || 0).toLocaleString()}`;
      if (invPaidEl) invPaidEl.textContent = '₱0';
      if (invBalEl) invBalEl.textContent = `₱${Number(proj.budget || 0).toLocaleString()}`;
    }

    if (invBtn) {
      invBtn.onclick = () => {
        custProjModal.classList.remove('active');
        switchView('payments');
      };
    }

    // Description & Scope
    const descEl = document.getElementById('custProjDescription');
    if (descEl) descEl.textContent = proj.description || proj.milestones || 'Project scope on file.';

    // Tasks / Milestones Checklist
    const tasksContainer = document.getElementById('custProjTasksList');
    if (tasksContainer) {
      if (Array.isArray(proj.tasks) && proj.tasks.length > 0) {
        tasksContainer.innerHTML = proj.tasks.map(t => {
          const isDone = !!t.completed;
          const checkIcon = isDone 
            ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
            : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>`;
          const textStyle = isDone ? 'text-decoration: line-through; color: #64748b;' : 'font-weight: 600; color: #1e293b;';
          const deadlinePill = t.deadline ? `<span class="date-pill" style="font-size:0.75rem;">Target: ${t.deadline}</span>` : '<span style="font-size:0.75rem; color:#94a3b8;">No date</span>';
          const statusBadge = isDone 
            ? `<span class="badge-status badge-completed" style="font-size:0.72rem; padding:0.15rem 0.55rem;">Completed</span>`
            : `<span class="badge-status badge-pending" style="font-size:0.72rem; padding:0.15rem 0.55rem;">Pending</span>`;

          return `
            <div class="task-item-row" style="background:${isDone ? '#f0fdf4' : '#ffffff'}; border-color:${isDone ? '#bbf7d0' : '#e2e8f0'}; display:block; padding:0.75rem 1rem; margin-bottom:0.5rem; border-radius:8px;">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:0.6rem; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:0.6rem;">
                  ${checkIcon}
                  <span style="${textStyle}">${t.title}</span>
                </div>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  ${deadlinePill}
                  ${statusBadge}
                </div>
              </div>
              ${t.description ? `<div style="margin-top:0.35rem; padding-left:1.6rem; font-size:0.82rem; color:#64748b; line-height:1.4;">${t.description}</div>` : ''}
            </div>
          `;
        }).join('');
      } else {
        tasksContainer.innerHTML = `
          <div style="font-size:0.9rem; color:#475569; line-height:1.6; padding:0.5rem 0;">
            ${proj.milestones || 'Standard project sequence: engineering review, procurement, installation, hydrostatic pressure test, and BFP turnover.'}
          </div>
        `;
      }
    }

    // Notes
    const notesEl = document.getElementById('custProjNotesHistory');
    if (notesEl) {
      if (proj.notes) {
        notesEl.innerHTML = proj.notes.split('\n').map(line => line.trim()).filter(Boolean).map(line => `
          <div style="margin-bottom:0.4rem; padding-bottom:0.4rem; border-bottom:1px solid #e2e8f0;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${line}
          </div>
        `).join('') || 'No updates logged yet.';
      } else {
        notesEl.textContent = 'No updates logged yet.';
      }
    }

    custProjModal.classList.add('active');
  }

  // =========================================================================
  // VIEW 4: PAYMENTS (Mockups 18, 19, 20 Enhanced)
  // =========================================================================
  const paymentModal = document.getElementById('paymentModal');
  let selectedInvoice = null;

  function renderPayments() {
    const tbody = document.getElementById('customerPaymentsTableBody');
    if (!tbody) return;

    const payments = BD22_DB.get('payments') || [];
    let billed = 0;
    let paid = 0;
    let balance = 0;
    let overdue = 0;

    payments.forEach(p => {
      const totalAmt = Number(p.amount) || 0;
      const paidAmt = Number(p.amount_paid) || (p.status === 'Paid' ? totalAmt : 0);
      const balAmt = p.balance !== undefined ? Number(p.balance) : (p.status === 'Paid' ? 0 : Math.max(0, totalAmt - paidAmt));

      billed += totalAmt;
      paid += paidAmt;
      balance += (p.status === 'Paid' ? 0 : balAmt);

      if (p.status === 'Overdue') overdue++;
    });

    const elBilled = document.getElementById('payStatBilled');
    const elPaid = document.getElementById('payStatPaid');
    const elBal = document.getElementById('payStatBalance');
    const elOverdue = document.getElementById('payStatOverdue');

    if (elBilled) elBilled.textContent = '₱' + billed.toLocaleString();
    if (elPaid) elPaid.textContent = '₱' + paid.toLocaleString();
    if (elBal) elBal.textContent = '₱' + balance.toLocaleString();
    if (elOverdue) elOverdue.textContent = overdue;

    if (payments.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding: 3.5rem 1.5rem; color: #64748b;">
            <img src="assets/images/empty/empty-payments.svg" class="empty-state-img" alt="No Billing Records">
            <strong style="display:block; margin-top:0.5rem; font-size:1.05rem; color:#1e293b;">No billing or invoice records found</strong>
            <p style="margin-top:0.25rem; font-size:0.85rem;">Invoices will be automatically posted here when projects are created and milestones reached.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = payments.map(p => {
      const invNum = p.invoice || p.invoice_no;
      const totalAmt = Number(p.amount) || 0;
      const paidAmt = Number(p.amount_paid) || (p.status === 'Paid' ? totalAmt : 0);
      const balAmt = p.balance !== undefined ? Number(p.balance) : (p.status === 'Paid' ? 0 : Math.max(0, totalAmt - paidAmt));

      let badgeClass = 'badge-unpaid';
      if (p.status === 'Paid') badgeClass = 'badge-completed';
      else if (p.status === 'Partial') badgeClass = 'badge-partial';
      else if (p.status === 'Overdue') badgeClass = 'badge-urgent';
      else badgeClass = 'badge-unpaid';

      return `
        <tr>
          <td class="ref-code">${invNum}</td>
          <td>
            <div style="font-weight: 700; color:#1e293b;">${p.project || p.project_name || 'Fire Protection Contract'}</div>
            ${p.project_code ? `<div style="font-size:0.75rem; color:#64748b;">Ref: ${p.project_code}</div>` : ''}
          </td>
          <td><strong>₱${totalAmt.toLocaleString()}</strong></td>
          <td><span style="color:#15803d; font-weight:600;">₱${paidAmt.toLocaleString()}</span></td>
          <td><span style="color:#b91c14; font-weight:700;">₱${balAmt.toLocaleString()}</span></td>
          <td><span class="date-pill">${p.dueDate || p.due_date || 'TBD'}</span></td>
          <td><span class="badge-status ${badgeClass}">${p.status}</span></td>
          <td>
            ${(balAmt > 0 && p.status !== 'Paid') ? `
              <button class="btn btn-primary-red btn-sm btn-pay-now" data-inv="${invNum}">Pay / Settle</button>
            ` : '<span style="color:#15803d; font-weight:700;">Settled</span>'}
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-pay-now').forEach(btn => {
      btn.addEventListener('click', () => {
        const inv = btn.getAttribute('data-inv');
        const p = payments.find(item => (item.invoice === inv || item.invoice_no === inv));
        if (p && paymentModal) {
          selectedInvoice = p;
          const totalAmt = Number(p.amount) || 0;
          const paidAmt = Number(p.amount_paid) || (p.status === 'Paid' ? totalAmt : 0);
          const balAmt = p.balance !== undefined ? Number(p.balance) : (p.status === 'Paid' ? 0 : Math.max(0, totalAmt - paidAmt));

          document.getElementById('payModalInvoice').textContent = p.invoice || p.invoice_no;
          document.getElementById('payModalProject').textContent = p.project || p.project_name || 'Project Contract';
          
          const statusBadge = document.getElementById('payModalStatusBadge');
          if (statusBadge) {
            statusBadge.textContent = p.status;
            statusBadge.className = `badge-status badge-${p.status.toLowerCase().replace(/\s+/g, '-')}`;
          }

          document.getElementById('payModalTotal').textContent = '₱' + totalAmt.toLocaleString();
          document.getElementById('payModalPaid').textContent = '₱' + paidAmt.toLocaleString();
          document.getElementById('payModalBalance').textContent = '₱' + balAmt.toLocaleString();

          const payAmtInput = document.getElementById('payAmount');
          if (payAmtInput) {
            payAmtInput.value = balAmt;
            payAmtInput.max = balAmt;
          }

          const btnFull = document.getElementById('btnPayFullBalance');
          if (btnFull) {
            btnFull.onclick = () => {
              if (payAmtInput) payAmtInput.value = balAmt;
            };
          }

          const refInput = document.getElementById('payRef');
          if (refInput) refInput.value = '';

          paymentModal.classList.add('active');
        }
      });
    });
  }

  // Payment form submission
  const paymentConfirmForm = document.getElementById('paymentConfirmForm');
  if (paymentConfirmForm) {
    paymentConfirmForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!selectedInvoice) return;

      const submitBtn = document.getElementById('btnSubmitPayment');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing Settlement...';
      }

      const invCode = selectedInvoice.invoice || selectedInvoice.invoice_no;
      const method = document.getElementById('payMethod') ? document.getElementById('payMethod').value : 'Bank Transfer';
      const refNo = document.getElementById('payRef') ? document.getElementById('payRef').value : '';
      const payAmountVal = Number(document.getElementById('payAmount')?.value || 0);

      if (payAmountVal <= 0) {
        showToast('Please enter a valid settlement amount.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirm Payment Settlement';
        }
        return;
      }

      const res = await BD22_DB.payInvoice(invCode, method, refNo, payAmountVal);

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm Payment Settlement';
      }

      if (res && res.success) {
        paymentModal.classList.remove('active');
        showToast(`Payment of ₱${payAmountVal.toLocaleString()} for Invoice ${invCode} recorded successfully!`);
        renderPayments();
        renderOverview();
        renderProjects();
      } else {
        showToast(`Payment settlement warning: ${res?.error || 'Please try again.'}`);
      }
    });
  }

  // =========================================================================
  // VIEW 5: WARRANTY (Mockups 21 & 22)
  // =========================================================================
  const warrantyModal = document.getElementById('warrantyModal');

  function renderWarranties(filter = 'Active') {
    const container = document.getElementById('customerWarrantiesList');
    if (!container) return;

    let list = BD22_DB.get('warranties') || [];
    if (filter !== 'All') {
      list = list.filter(w => w.status === filter);
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding: 3.5rem 1.5rem; color: #64748b; background: #ffffff; border-radius: 12px; border: 1px dashed #cbd5e1;">
          <img src="assets/images/empty/empty-warranty.svg" class="empty-state-img" alt="No Warranties">
          <strong>No warranties in "${filter}" status.</strong>
          <p style="margin-top:0.25rem; font-size:0.85rem;">System warranty certificates and coverage terms will appear here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(item => {
      let badgeClass = 'badge-completed';
      if (item.status === 'Expiring Soon') badgeClass = 'badge-pending';
      if (item.status === 'Expired') badgeClass = 'badge-urgent';

      return `
        <div class="portal-row-card">
          <div>
            <div class="row-card-title">${item.title} <span style="font-size:0.9rem; color:#64748b; font-weight:500;">(${item.ref})</span></div>
            <div class="row-card-subtitle">Installed: ${item.installDate} • Expires: <strong>${item.expiryDate}</strong></div>
          </div>
          <div style="display:flex; align-items:center; gap:1.25rem;">
            <span class="badge-status ${badgeClass}">${item.status}</span>
            <button class="btn btn-outline btn-sm view-warr-btn" data-warr-ref="${item.ref}">View Coverage →</button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.view-warr-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const ref = btn.getAttribute('data-warr-ref');
        const item = list.find(w => w.ref === ref);
        if (item && warrantyModal) {
          document.getElementById('modalWarrTitle').textContent = item.title;
          document.getElementById('modalWarrRef').textContent = item.ref;
          document.getElementById('modalWarrInstall').textContent = item.installDate;
          document.getElementById('modalWarrExpiry').textContent = item.expiryDate;
          document.getElementById('modalWarrCoverage').textContent = item.coverage;
          
          const badge = document.getElementById('modalWarrStatus');
          badge.textContent = item.status;
          badge.className = 'badge-status ' + (item.status === 'Expired' ? 'badge-urgent' : (item.status === 'Expiring Soon' ? 'badge-pending' : 'badge-completed'));

          warrantyModal.classList.add('active');
        }
      });
    });
  }

  // Warranty tab buttons
  const warrTabs = document.querySelectorAll('#customerWarrantyTabs .tab-btn');
  warrTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      warrTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderWarranties(tab.getAttribute('data-tab'));
    });
  });

  // =========================================================================
  // VIEW 6: MAINTENANCE (Mockup 23)
  // =========================================================================
  function renderMaintenance(filter = 'All') {
    const container = document.getElementById('customerMaintenanceList');
    if (!container) return;

    let list = BD22_DB.get('maintenance') || [];
    if (filter === 'Overdue') list = list.filter(m => m.status === 'Overdue');
    if (filter === 'Due') list = list.filter(m => m.status === 'Due');
    if (filter === 'Upcoming') list = list.filter(m => m.status === 'Upcoming' || m.status === 'Scheduled');

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding: 3.5rem 1.5rem; color: #64748b; background: #ffffff; border-radius: 12px; border: 1px dashed #cbd5e1;">
          <img src="assets/images/empty/empty-maintenance.svg" class="empty-state-img" alt="No Maintenance Scheduled">
          <strong>No maintenance visits scheduled (${filter})</strong>
          <p style="margin-top:0.25rem; font-size:0.85rem;">Preventative maintenance schedules and inspections will be displayed here once booked.</p>
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
            <div class="row-card-subtitle">Location: <strong>${item.customer}</strong> • Technician: <strong>${item.technician || 'Engineering Team'}</strong></div>
            <div style="font-size:0.85rem; color:#64748b; margin-top:0.35rem;">Scheduled Date: <strong>${item.scheduledDate}</strong></div>
          </div>
          <span class="badge-status ${badgeClass}">${item.status}</span>
        </div>
      `;
    }).join('');
  }

  const maintTabs = document.querySelectorAll('#customerMaintTabs .tab-btn');
  maintTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      maintTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderMaintenance(tab.getAttribute('data-tab'));
    });
  });

  // =========================================================================
  // VIEW 7: SERVICE HISTORY (Mockup 24)
  // =========================================================================
  function renderHistory() {
    const container = document.getElementById('customerHistoryTimeline');
    if (!container) return;

    const history = BD22_DB.get('serviceHistory') || [];
    if (history.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3.5rem 1.5rem; color: #64748b; background: #ffffff; border-radius: 12px; border: 1px dashed #cbd5e1;">
          <img src="assets/images/empty/empty-history.svg" class="empty-state-img" alt="No Service History">
          <strong>No completed service history records logged yet</strong>
          <p style="margin-top:0.25rem; font-size:0.85rem;">Completed installations and inspection certificates will be recorded here.</p>
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
            ${item.date} • <span class="badge-status badge-completed" style="font-size: 0.75rem; padding: 0.15rem 0.5rem;">${item.badge || 'Verified'}</span> • Inspector: ${item.performedBy || item.loggedBy || 'Senior Inspector'}
          </div>
        </div>
      </div>
    `).join('');
  }

  // =========================================================================
  // VIEW 8: MESSAGES (Mockup 25)
  // =========================================================================
  function renderMessages() {
    const container = document.getElementById('customerMessagesList');
    if (!container) return;

    const msgs = BD22_DB.get('customerMessages') || [];

    if (msgs.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3.5rem 1.5rem; color: #64748b; background: #ffffff; border-radius: 12px; border: 1px dashed #cbd5e1;">
          <img src="assets/images/empty/empty-messages.svg" class="empty-state-img" alt="No Messages">
          <strong>Your inbox is empty</strong>
          <p style="margin-top:0.25rem; font-size:0.85rem;">System notices and communications from BD22 dispatch will appear here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = msgs.map(m => `
      <div class="message-item">
        <div class="message-body">
          <span class="message-title">${m.title}</span>
          <span class="message-desc">${m.desc || m.description || ''}</span>
        </div>
        <span class="badge-status badge-neutral">${m.time || 'Notice'}</span>
      </div>
    `).join('');
  }

  // =========================================================================
  // VIEW 9: ACCOUNT SETTINGS (Mockup 26)
  // =========================================================================
  function renderSettings() {
    const user = BD22_DB.get('currentUser');
    if (user && typeof user === 'object') {
      const elName = document.getElementById('settingName');
      const elComp = document.getElementById('settingCompany');
      const elEmail = document.getElementById('settingEmail');
      const elPhone = document.getElementById('settingPhone');

      if (elName) elName.value = user.full_name || user.name || '';
      if (elComp) elComp.value = user.company || '';
      if (elEmail) elEmail.value = user.email || '';
      if (elPhone) elPhone.value = user.phone || '';

      const pSms = document.getElementById('prefSms');
      const pEmail = document.getElementById('prefEmail');
      const pWarr = document.getElementById('prefWarranty');
      if (pSms && user.pref_sms !== undefined) pSms.checked = Boolean(Number(user.pref_sms));
      if (pEmail && user.pref_email !== undefined) pEmail.checked = Boolean(Number(user.pref_email));
      if (pWarr && user.pref_warranty !== undefined) pWarr.checked = Boolean(Number(user.pref_warranty));
    }
  }

  const settingsForm = document.getElementById('customerSettingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentUser = BD22_DB.get('currentUser') || {};
      const updatedUser = {
        ...currentUser,
        role: 'customer',
        name: document.getElementById('settingName').value.trim(),
        full_name: document.getElementById('settingName').value.trim(),
        company: document.getElementById('settingCompany').value.trim(),
        email: document.getElementById('settingEmail').value.trim(),
        phone: document.getElementById('settingPhone').value.trim(),
        prefSms: document.getElementById('prefSms') ? document.getElementById('prefSms').checked : true,
        prefEmail: document.getElementById('prefEmail') ? document.getElementById('prefEmail').checked : true,
        prefWarranty: document.getElementById('prefWarranty') ? document.getElementById('prefWarranty').checked : true
      };
      BD22_DB.set('currentUser', updatedUser);
      updateCustomerDisplay();
      await BD22_DB.saveProfile(updatedUser);
      showToast('Profile and dispatch preferences updated!');
    });
  }

  // =========================================================================
  // MODAL: + NEW SERVICE REQUEST (Mockup 14 Enhanced)
  // =========================================================================
  const newServiceModal = document.getElementById('newServiceModal');
  const btnOpenService = document.getElementById('btnOpenNewServiceModal');
  const newServiceForm = document.getElementById('customerNewServiceForm');
  const submitBtn = document.getElementById('btnSubmitServiceReq');

  function populateContactFromProfile(force = false) {
    const user = BD22_DB.get('currentUser') || {};
    const nameField = document.getElementById('custReqContactName');
    const phoneField = document.getElementById('custReqContactPhone');
    const emailField = document.getElementById('custReqContactEmail');
    const posField = document.getElementById('custReqContactPosition');

    if (nameField && (force || !nameField.value.trim())) {
      nameField.value = user.full_name || user.name || '';
    }
    if (phoneField && (force || !phoneField.value.trim())) {
      phoneField.value = user.phone || '+63 917 555 0123';
    }
    if (emailField && (force || !emailField.value.trim())) {
      emailField.value = user.email || '';
    }
    if (posField && (force || !posField.value.trim())) {
      posField.value = user.company ? `${user.company} Coordinator` : 'Property Coordinator';
    }
  }

  // Set default preferred date to +3 days from now, min today
  const dateInput = document.getElementById('custReqPreferredDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    if (!dateInput.value) {
      const defDate = new Date();
      defDate.setDate(defDate.getDate() + 3);
      dateInput.value = defDate.toISOString().split('T')[0];
    }
  }

  // Remove error pulse on user interaction
  ['custReqServiceType', 'custReqPreferredDate', 'custReqDescription', 'custReqEstName',
   'custReqBuildingType', 'custReqFloors', 'custReqSiteAddress', 'custReqContactName',
   'custReqContactPosition', 'custReqContactPhone', 'custReqContactEmail'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => el.classList.remove('input-error-pulse'));
      el.addEventListener('change', () => el.classList.remove('input-error-pulse'));
    }
  });

  // File list preview trackers
  let currentUploadedFiles = [];
  const photosInput = document.getElementById('custReqPhotos');
  const photosList = document.getElementById('photosFileList');
  const floorPlanInput = document.getElementById('custReqFloorPlan');
  const floorPlanList = document.getElementById('floorPlanFileList');

  if (photosInput && photosList) {
    photosInput.addEventListener('change', () => {
      photosList.innerHTML = '';
      Array.from(photosInput.files).forEach(f => {
        currentUploadedFiles.push({ name: f.name, size: f.size, type: 'photo' });
        const pill = document.createElement('span');
        pill.className = 'attachment-pill';
        pill.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:3px;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> ${f.name} (${Math.round(f.size / 1024)} KB)`;
        photosList.appendChild(pill);
      });
    });
  }

  if (floorPlanInput && floorPlanList) {
    floorPlanInput.addEventListener('change', () => {
      floorPlanList.innerHTML = '';
      Array.from(floorPlanInput.files).forEach(f => {
        currentUploadedFiles.push({ name: f.name, size: f.size, type: 'floor_plan' });
        const pill = document.createElement('span');
        pill.className = 'attachment-pill';
        pill.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:3px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> ${f.name} (${Math.round(f.size / 1024)} KB)`;
        floorPlanList.appendChild(pill);
      });
    });
  }

  if (btnOpenService && newServiceModal) {
    btnOpenService.addEventListener('click', () => {
      populateContactFromProfile();
      const errBanner = document.getElementById('serviceReqFormError');
      if (errBanner) {
        errBanner.style.display = 'none';
        errBanner.textContent = '';
      }
      document.querySelectorAll('#newServiceModal .input-error-pulse').forEach(el => {
        el.classList.remove('input-error-pulse');
      });
      newServiceModal.classList.add('active');
    });
  }

  let isSubmittingService = false;

  async function validateAndSubmitServiceForm(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isSubmittingService) return;

    const errBanner = document.getElementById('serviceReqFormError');
    if (errBanner) {
      errBanner.style.display = 'none';
      errBanner.textContent = '';
    }

    // Remove any previous error highlight
    document.querySelectorAll('#newServiceModal .input-error-pulse').forEach(el => {
      el.classList.remove('input-error-pulse');
    });

    function failValidation(elementId, message) {
      const el = document.getElementById(elementId);
      if (errBanner) {
        errBanner.style.display = 'block';
        errBanner.textContent = message;
      }
      showToast(message);
      if (el) {
        el.classList.add('input-error-pulse');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => el.focus(), 300);
      }
      return false;
    }

    // 1. Service Type
    const srvTypeEl = document.getElementById('custReqServiceType');
    const srvType = srvTypeEl?.value || '';
    if (!srvType) {
      return failValidation('custReqServiceType', 'Please select a Fire Protection Service Type.');
    }

    // 2. Urgency
    const urgency = document.getElementById('custReqUrgency')?.value || 'Standard';

    // 3. Preferred Date
    const prefDateEl = document.getElementById('custReqPreferredDate');
    let preferredDate = prefDateEl?.value || '';
    if (!preferredDate) {
      const def = new Date();
      def.setDate(def.getDate() + 3);
      preferredDate = def.toISOString().split('T')[0];
      if (prefDateEl) prefDateEl.value = preferredDate;
    }

    // 4. Preferred Timeframe
    const preferredTimeframe = document.getElementById('custReqPreferredTimeframe')?.value || 'Anytime during business hours';

    // 5. Description
    const descEl = document.getElementById('custReqDescription');
    const description = descEl?.value ? descEl.value.trim() : '';
    if (!description) {
      return failValidation('custReqDescription', 'Please describe the scope of work or problem symptoms.');
    }

    // 6. Establishment Name
    const estEl = document.getElementById('custReqEstName');
    const estName = estEl?.value ? estEl.value.trim() : '';
    if (!estName) {
      return failValidation('custReqEstName', 'Please provide the Establishment / Building Name.');
    }

    // 7. Building Type
    const bldgEl = document.getElementById('custReqBuildingType');
    const buildingType = bldgEl?.value || '';
    if (!buildingType) {
      return failValidation('custReqBuildingType', 'Please select the Building Type.');
    }

    // 8. Floors
    const floorsEl = document.getElementById('custReqFloors');
    const floors = floorsEl?.value ? floorsEl.value.trim() : '';
    if (!floors) {
      return failValidation('custReqFloors', 'Please specify the number of floors or levels.');
    }

    // 9. Site Address
    const addrEl = document.getElementById('custReqSiteAddress');
    const siteAddress = addrEl?.value ? addrEl.value.trim() : '';
    if (!siteAddress) {
      return failValidation('custReqSiteAddress', 'Please provide the complete site address.');
    }

    // 10. Maps Link
    const mapsLink = document.getElementById('custReqMapsLink')?.value ? document.getElementById('custReqMapsLink').value.trim() : '';

    // 11. Contact Name
    const contactNameEl = document.getElementById('custReqContactName');
    const contactName = contactNameEl?.value ? contactNameEl.value.trim() : '';
    if (!contactName) {
      return failValidation('custReqContactName', 'Please enter the on-site Contact Person Name.');
    }

    // 12. Contact Position
    const contactPosEl = document.getElementById('custReqContactPosition');
    const contactPosition = contactPosEl?.value ? contactPosEl.value.trim() : 'Property Coordinator';

    // 13. Contact Phone
    const phoneEl = document.getElementById('custReqContactPhone');
    const contactPhone = phoneEl?.value ? phoneEl.value.trim() : '';
    if (!contactPhone) {
      return failValidation('custReqContactPhone', 'Please enter a contact mobile or telephone number.');
    }

    // 14. Contact Email
    const emailEl = document.getElementById('custReqContactEmail');
    const contactEmail = emailEl?.value ? emailEl.value.trim() : '';
    if (!contactEmail) {
      return failValidation('custReqContactEmail', 'Please enter a contact email address.');
    }

    // 15. Other Concerns
    const otherConcerns = document.getElementById('custReqOtherConcerns')?.value ? document.getElementById('custReqOtherConcerns').value.trim() : '';

    // All validation passed: begin submission
    isSubmittingService = true;
    const btn = document.getElementById('btnSubmitServiceReq');
    if (btn) {
      btn.disabled = true;
      btn.className = 'btn btn-primary-red btn-submit-service btn-submitting';
      btn.innerHTML = `
        <svg class="btn-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        Submitting Request...
      `;
    }

    try {
      const ref = await BD22_DB.addServiceRequest({
        service_type: srvType,
        urgency: urgency,
        preferred_date: preferredDate,
        preferred_timeline: preferredTimeframe,
        description: description,
        establishment_name: estName,
        building_type: buildingType,
        floors: floors,
        site_address: siteAddress,
        google_maps_link: mapsLink,
        contact_name: contactName,
        contact_position: contactPosition,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        attachments: [...currentUploadedFiles],
        additional_concerns: otherConcerns
      });

      // Show positive completion feedback on button
      if (btn) {
        btn.className = 'btn btn-primary-red btn-submit-service btn-success';
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Request Submitted!
        `;
      }

      await new Promise(resolve => setTimeout(resolve, 600));

      // Close modal & reset form
      newServiceModal.classList.remove('active');
      newServiceForm.reset();
      currentUploadedFiles = [];
      if (photosList) photosList.innerHTML = '';
      if (floorPlanList) floorPlanList.innerHTML = '';

      if (btn) {
        btn.disabled = false;
        btn.className = 'btn btn-primary-red btn-submit-service';
        btn.innerHTML = 'Submit Request';
      }

      // Display Success Confirmation Modal
      const successModal = document.getElementById('serviceReqSuccessModal');
      if (successModal) {
        const refDisplay = document.getElementById('successModalRef');
        if (refDisplay) refDisplay.textContent = ref;
        
        const statusDisplay = document.getElementById('successModalStatus');
        if (statusDisplay) statusDisplay.textContent = 'Pending Review';
        
        const siteDisplay = document.getElementById('successModalSite');
        if (siteDisplay) siteDisplay.textContent = `${estName} (${buildingType})`;
        
        const dateDisplay = document.getElementById('successModalDate');
        if (dateDisplay) dateDisplay.textContent = `${preferredDate} • ${preferredTimeframe}`;

        successModal.classList.add('active');
      }

      showToast(`Service request queued: ${ref}`);

      if (typeof renderOverview === 'function') renderOverview();
      if (typeof renderInquiries === 'function') renderInquiries();

    } catch (err) {
      console.error('Service request submission error:', err);
      if (btn) {
        btn.disabled = false;
        btn.className = 'btn btn-primary-red btn-submit-service';
        btn.innerHTML = 'Submit Request';
      }
      if (errBanner) {
        errBanner.style.display = 'block';
        errBanner.textContent = 'Unable to complete service request submission. Please check all required fields and try again.';
      }
      showToast('Failed to submit service request. Please try again.');
    } finally {
      isSubmittingService = false;
    }
  }

  // Bind to BOTH form submit AND button click
  if (newServiceForm) {
    newServiceForm.addEventListener('submit', validateAndSubmitServiceForm);
  }
  if (submitBtn) {
    submitBtn.addEventListener('click', validateAndSubmitServiceForm);
  }

  const btnGoToInq = document.getElementById('btnGoToInquiries');
  if (btnGoToInq) {
    btnGoToInq.addEventListener('click', () => {
      const successModal = document.getElementById('serviceReqSuccessModal');
      if (successModal) successModal.classList.remove('active');
      switchView('inquiries');
    });
  }
});
