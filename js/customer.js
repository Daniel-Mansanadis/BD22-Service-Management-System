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
    'overview': 'Dashboard',
    'inquiries': 'My Appointments',
    'projects': 'Services & Projects',
    'history': 'Service History',
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
    const target = link.getAttribute('data-view');
    if (titlesMap[target]) link.textContent = titlesMap[target];

    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (target) switchView(target);
    });
  });

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
      const displayCustomer = item.customer || item.customer_name || 'Valued Customer';
      const displaySchedule = (item.preferred_date && item.preferred_timeline)
        ? `${item.preferred_date} (${item.preferred_timeline})`
        : (item.preferred_date || item.confirmed_schedule || item.dateSubmitted || 'Pending Schedule');

      return `
        <tr data-ref="${item.reference}">
          <td class="ref-code">${item.reference}</td>
          <td><div style="font-weight: 600; color:#1e293b;">${displayCustomer}</div></td>
          <td>
            <div style="font-weight: 700; color:#1e293b;">${item.service || item.service_name || 'Fire Protection Service'}</div>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.15rem;">${siteName}${buildingInfo}</div>
          </td>
          <td><span class="date-pill">${displaySchedule}</span></td>
          <td><span class="badge-status ${badgeClass}">${item.status}</span></td>
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

    const custEl = document.getElementById('custInqCustomerName');
    if (custEl) custEl.textContent = item.customer || item.customer_name || 'Valued Customer';
    
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
    if (prefEl) prefEl.textContent = item.preferred_date || 'Pending schedule';
    
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

    const allProjects = BD22_DB.get('projects') || [];
    // Only display active or ongoing projects (Completed projects transition into Service History)
    const projects = allProjects.filter(p => p.status !== 'Completed');

    if (projects.length === 0) {
      grid.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1.5rem; background: #ffffff; border-radius: 12px; border: 1px dashed #cbd5e1;">
          <img src="assets/images/empty/empty-projects.svg" class="empty-state-img" alt="No Active Projects">
          <h4 style="font-weight: 700; color: #1e293b; margin-bottom: 0.35rem;">No Active Projects</h4>
          <p style="color: #64748b; font-size: 0.9rem;">You do not have any ongoing installations or retrofits. Completed projects are archived under Service History.</p>
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
      // Billing & payment status lookup
      const payments = BD22_DB.get('payments') || [];
      const inv = payments.find(pay => 
        (pay.project_id && (pay.project_id === p.db_id || String(pay.project_id) === String(p.db_id))) ||
        (pay.project_id && (pay.project_id === projCode || pay.project_id === p.id)) ||
        (pay.project_code && (pay.project_code === projCode || pay.project_code === p.id)) ||
        (pay.invoice && pay.invoice === (p.linked_invoice || p.linkedInvoice)) ||
        (pay.invoice_no && pay.invoice_no === (p.linked_invoice || p.linkedInvoice)) ||
        (pay.project && pay.project.toLowerCase() === p.name.toLowerCase()) ||
        (pay.project_name && pay.project_name.toLowerCase() === p.name.toLowerCase())
      );
      const isCompleted = p.status === 'Completed';
      const payStatus = isCompleted ? 'Paid' : ((inv && inv.status) || p.payment_status || p.paymentStatus || 'Unpaid');
      let payBadgeClass = 'badge-unpaid';
      if (payStatus === 'Paid') payBadgeClass = 'badge-paid';
      else if (payStatus === 'Partial') payBadgeClass = 'badge-partial';

      const budget = Number(p.budget || inv?.amount || 0);
      const paid = Number(isCompleted ? budget : (inv?.amount_paid !== undefined ? inv.amount_paid : (payStatus === 'Paid' ? budget : 0)));
      const balance = Number(isCompleted ? 0 : (inv?.balance !== undefined ? inv.balance : Math.max(0, budget - paid)));

      // Milestone counts & latest updates
      let tasksList = p.tasks;
      if (typeof tasksList === 'string' && (tasksList.startsWith('[') || tasksList.startsWith('{'))) {
        try { tasksList = JSON.parse(tasksList); } catch(e) { tasksList = []; }
      }
      let tasksCountText = '';
      if (Array.isArray(tasksList) && tasksList.length > 0) {
        const completedCount = tasksList.filter(t => t.completed).length;
        tasksCountText = `<div style="font-size:0.8rem; color:#64748b; margin-top:0.35rem;">Milestones: <strong>${completedCount} / ${tasksList.length} completed</strong></div>`;
      }

      let latestRemarkHtml = '';
      if (p.notes && typeof p.notes === 'string') {
        const noteLines = p.notes.split('\n').map(l => l.trim()).filter(Boolean);
        if (noteLines.length > 0) {
          const latest = noteLines[noteLines.length - 1];
          latestRemarkHtml = `
            <div style="font-size:0.78rem; color:#0369a1; background:#f0f9ff; padding:0.3rem 0.6rem; border-radius:6px; margin-top:0.45rem; border-left:3px solid #0284c7; line-height:1.4;">
              <strong>Latest Update:</strong> ${latest}
            </div>
          `;
        }
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
              <span class="badge-status ${payBadgeClass}" style="font-size:0.75rem;">${payStatus}</span>
            </div>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${p.progress || 0}%;"></div>
          </div>
          <div class="progress-info-row">
            <span>Target completion: ${p.targetDate || p.target_date || 'TBD'}</span>
            <span>${p.progress || 0}%</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem; font-size:0.82rem; background:#f8fafc; padding:0.4rem 0.65rem; border-radius:6px;">
            <span>Budget: <strong style="color:#1e293b;">₱${budget.toLocaleString()}</strong></span>
            <span>Paid: <strong style="color:#15803d;">₱${paid.toLocaleString()}</strong></span>
            <span>Balance: <strong style="color:${balance > 0 ? '#dc2626' : '#15803d'};">₱${balance.toLocaleString()}</strong></span>
          </div>
          ${tasksCountText}
          ${latestRemarkHtml}
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.25rem; padding-top:0.75rem; border-top:1px solid #f1f5f9;">
            <button type="button" class="btn btn-outline btn-sm project-details-btn" data-proj-id="${projCode}">Details</button>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.project-details-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.getAttribute('data-proj-id');
        const proj = allProjects.find(p => (p.project_code || p.id) === pid);
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
    const startDateEl = document.getElementById('custProjStartDate');
    if (startDateEl) startDateEl.textContent = proj.startDate || proj.start_date || 'Not set';

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

    // Linked Invoice Box
    const payments = BD22_DB.get('payments') || [];
    const inv = payments.find(p => 
      (p.project_id && (String(p.project_id) === String(proj.db_id))) ||
      (p.project_id && (p.project_id === projCode || p.project_id === proj.id)) ||
      (p.project_code && (p.project_code === projCode || p.project_code === proj.id)) ||
      (p.invoice && p.invoice === (proj.linked_invoice || proj.linkedInvoice)) ||
      (p.invoice_no && p.invoice_no === (proj.linked_invoice || proj.linkedInvoice)) ||
      (p.project && p.project.toLowerCase() === proj.name.toLowerCase()) ||
      (p.project_name && p.project_name.toLowerCase() === proj.name.toLowerCase())
    );

    const invoiceBoxEl = document.getElementById('custProjInvoiceBox');
    const invoiceTitleEl = document.getElementById('custProjInvoiceBoxTitle');
    const invCodeEl = document.getElementById('custProjInvoiceCode');
    const invStatusEl = document.getElementById('custProjInvoiceStatus');
    const invPaidEl = document.getElementById('custProjInvoicePaid');
    const invBalEl = document.getElementById('custProjInvoiceBalance');
    const invBtn = document.getElementById('custProjBtnGoToPayments');

    const isCompleted = proj.status === 'Completed';
    const curStatus = isCompleted ? 'Paid' : (inv ? inv.status : (proj.payment_status || proj.paymentStatus || ''));
    const totalAmt = inv ? Number(inv.amount || 0) : Number(proj.budget || 0);
    const paidAmt = isCompleted ? totalAmt : (inv ? (Number(inv.amount_paid) || (curStatus === 'Paid' ? totalAmt : 0)) : (curStatus === 'Paid' ? totalAmt : 0));
    const balAmt = isCompleted ? 0 : (inv ? (inv.balance !== undefined ? Number(inv.balance) : (curStatus === 'Paid' ? 0 : Math.max(0, totalAmt - paidAmt))) : (curStatus === 'Paid' ? 0 : totalAmt));
    const invCodeText = (inv && (inv.invoice || inv.invoice_no)) || proj.linked_invoice || proj.linkedInvoice || 'BD22-INV-PENDING';

    if (invCodeEl) invCodeEl.textContent = invCodeText;
    if (invPaidEl) invPaidEl.textContent = `₱${paidAmt.toLocaleString()}`;
    if (invBalEl) invBalEl.textContent = `₱${balAmt.toLocaleString()}`;

    if (invStatusEl) {
      invStatusEl.textContent = curStatus;
      if (curStatus === 'Paid') invStatusEl.className = 'badge-status badge-paid';
      else if (curStatus === 'Partial') invStatusEl.className = 'badge-status badge-partial';
      else invStatusEl.className = 'badge-status badge-unpaid';
    }

    if (invoiceBoxEl) {
      invoiceBoxEl.style.display = inv ? 'flex' : 'none';
      if (curStatus === 'Paid') {
        invoiceBoxEl.style.background = '#f0fdf4';
        invoiceBoxEl.style.border = '1.5px solid #bbf7d0';
      } else if (curStatus === 'Partial') {
        invoiceBoxEl.style.background = '#fffbeb';
        invoiceBoxEl.style.border = '1.5px solid #fde68a';
      } else {
        invoiceBoxEl.style.background = '#fef2f2';
        invoiceBoxEl.style.border = '1.5px solid #fee2e2';
      }
    }

    const warranties = BD22_DB.get('warranties') || [];
    const warranty = warranties.find(w => String(w.project_id) === String(proj.db_id) || w.project_id === proj.id || w.project_id === projCode || w.project_code === projCode);
    const warrantySection = document.getElementById('custProjectWarrantySection');
    const warrantyDetails = document.getElementById('custProjectWarrantyDetails');
    if (warrantySection && warrantyDetails) {
      warrantySection.style.display = warranty ? '' : 'none';
      if (warranty) warrantyDetails.textContent = `${warranty.system_covered || warranty.title || 'Project warranty'} — ${warranty.status || 'Status on file'}; ${warranty.install_date || warranty.start_date || 'Start date not provided'} to ${warranty.expiry_date || warranty.end_date || 'End date not provided'}. ${warranty.coverage_summary || ''}`;
    }

    const schedules = (BD22_DB.get('maintenance') || []).filter(m => String(m.project_id) === String(proj.db_id) || m.project_id === proj.id || m.project_id === projCode || m.project_code === projCode);
    const maintenanceSection = document.getElementById('custProjectMaintenanceSection');
    const maintenanceDetails = document.getElementById('custProjectMaintenanceDetails');
    if (maintenanceSection && maintenanceDetails) {
      maintenanceSection.style.display = (schedules.length || proj.maintenance_details) ? '' : 'none';
      maintenanceDetails.textContent = [proj.maintenance_details || '', ...schedules.map(m => `${m.service_type || m.title || 'Maintenance'} — ${m.scheduled_date || m.date || 'Date not set'} (${m.status || 'Scheduled'})${m.notes ? `: ${m.notes}` : ''}`)].filter(Boolean).join('\n');
      maintenanceDetails.style.whiteSpace = 'pre-line';
    }

    if (invoiceTitleEl) {
      if (curStatus === 'Paid') {
        invoiceTitleEl.style.color = '#15803d';
        invoiceTitleEl.textContent = 'Contract Billing & Settlement (Settled in Full)';
      } else if (curStatus === 'Partial') {
        invoiceTitleEl.style.color = '#b45309';
        invoiceTitleEl.textContent = 'Contract Billing & Settlement (Partially Settled)';
      } else {
        invoiceTitleEl.style.color = '#991b1b';
        invoiceTitleEl.textContent = 'Contract Billing & Settlement (Pending Settlement)';
      }
    }

    if (invBtn) {
      if (curStatus === 'Paid') {
        invBtn.style.display = 'none';
      } else {
        invBtn.style.display = '';
        invBtn.textContent = 'View Billing & Settle';
        invBtn.onclick = () => {
          custProjModal.classList.remove('active');
          switchView('payments');
        };
      }
    }

    // Description & Scope
    const descEl = document.getElementById('custProjDescription');
    if (descEl) descEl.textContent = [proj.description, proj.scope_of_work || proj.milestones].filter(Boolean).join('\nScope: ') || 'No project description or scope has been added.';
    if (descEl) descEl.style.whiteSpace = 'pre-line';

    // Tasks / Milestones Checklist
    const tasksContainer = document.getElementById('custProjTasksList');
    if (tasksContainer) {
      let tasksList = proj.tasks;
      if (typeof tasksList === 'string' && (tasksList.startsWith('[') || tasksList.startsWith('{'))) {
        try { tasksList = JSON.parse(tasksList); } catch(e) { tasksList = []; }
      }

      if (Array.isArray(tasksList) && tasksList.length > 0) {
        tasksContainer.innerHTML = tasksList.map(t => {
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
          <div style="font-size:0.9rem; color:#64748b; line-height:1.6; padding:0.75rem; text-align:center; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px;">
            No milestones have been added yet.
          </div>
        `;
      }
    }

    // Project Updates & Operations Remarks
    const notesEl = document.getElementById('custProjNotesHistory');
    if (notesEl) {
      if (proj.notes && proj.notes.trim()) {
        notesEl.innerHTML = proj.notes.split('\n').map(line => line.trim()).filter(Boolean).map(line => `
          <div style="margin-bottom:0.5rem; padding-bottom:0.5rem; border-bottom:1px solid #e2e8f0; font-size:0.88rem; color:#1e293b; display:flex; align-items:flex-start; gap:0.5rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a61c14" stroke-width="2" style="vertical-align:middle; margin-top:3px; flex-shrink:0;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <div style="line-height:1.5;">${line}</div>
          </div>
        `).join('') || 'No remarks on file.';
      } else {
        notesEl.innerHTML = '<div style="color:#94a3b8; font-style:italic;">No remarks on file.</div>';
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
          <td colspan="7" style="text-align:center; padding: 3.5rem 1.5rem; color: #64748b;">
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
      if (p.status === 'Paid') badgeClass = 'badge-paid';
      else if (p.status === 'Partial') badgeClass = 'badge-partial';
      else if (p.status === 'Overdue') badgeClass = 'badge-urgent';
      else badgeClass = 'badge-unpaid';

      return `
        <tr>
          <td class="ref-code">${invNum}</td>
          <td>
            <div style="font-weight: 700; color:#1e293b;">${p.project || p.project_name || 'Fire Protection Contract'}</div>
            ${p.project_code ? `<div style="font-size:0.75rem; color:#64748b;">Ref: ${p.project_code}</div>` : ''}
            ${(p.billing_notes || p.notes) ? `
              <div style="font-size:0.78rem; color:#0369a1; background:#f0f9ff; padding:0.25rem 0.55rem; border-radius:6px; margin-top:0.35rem; border-left:3px solid #0284c7; max-width:320px;">
                <strong>Accounting Remarks:</strong> ${p.billing_notes || p.notes}
              </div>
            ` : ''}
          </td>
          <td><strong>₱${totalAmt.toLocaleString()}</strong></td>
          <td><span style="color:#15803d; font-weight:600;">₱${paidAmt.toLocaleString()}</span></td>
          <td><span style="color:#b91c14; font-weight:700;">₱${balAmt.toLocaleString()}</span></td>
          <td><span class="date-pill">${p.dueDate || p.due_date || 'TBD'}</span></td>
          <td><span class="badge-status ${badgeClass}">${p.status}</span></td>
        </tr>
      `;
    }).join('');
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

      if (isNaN(payAmountVal) || payAmountVal <= 0) {
        showToast('Please enter a valid settlement amount greater than zero.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirm Payment Settlement';
        }
        return;
      }

      if (!refNo || refNo.trim().length < 3) {
        showToast('Please enter a valid transaction reference number (at least 3 characters).', 'error');
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
        renderPayments();
        renderOverview();
        renderProjects();
        showToast(`Payment of ₱${payAmountVal.toLocaleString()} for Invoice ${invCode} recorded successfully!`, 'success');
      } else {
        showToast(`Payment settlement warning: ${res?.error || 'Please try again.'}`, 'error');
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
            <button class="btn btn-outline btn-sm view-warr-btn" data-warr-ref="${item.ref}">View Coverage</button>
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
    const allProjects = BD22_DB.get('projects') || [];
    const warranties = BD22_DB.get('warranties') || [];
    const completedProjects = allProjects.filter(p => p.status === 'Completed');

    // Combine history items and completed projects, preventing duplicates
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
        <div style="text-align: center; padding: 3.5rem 1.5rem; color: #64748b; background: #ffffff; border-radius: 12px; border: 1px dashed #cbd5e1;">
          <img src="assets/images/empty/empty-history.svg" class="empty-state-img" alt="No Service History">
          <strong>No completed service history records logged yet</strong>
          <p style="margin-top:0.25rem; font-size:0.85rem;">Completed installations and inspection certificates will be recorded here.</p>
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

      const isCompleted = item.status === 'Completed' || item.badge === 'Completed' || item.activity_type === 'Project Turnover' || item.activityType === 'Project Turnover' || (item.title && item.title.includes('Project Commissioning & Turnover'));
      const payStatus = isCompleted ? 'Paid' : (item.payment_status || 'Paid');
      const payBadgeClass = payStatus === 'Paid' ? 'badge-paid' : (payStatus === 'Partial' ? 'badge-partial' : 'badge-unpaid');
      const cleanDesc = (item.description || '').replace(/Payment Status:\s*Unpaid/gi, 'Payment Status: Paid');
      const totalCostText = item.total_cost ? ` • Cost: ₱${Number(item.total_cost).toLocaleString()}` : '';
      const warrInfo = matchingWarr 
        ? `<div style="margin-top:0.45rem; display:inline-flex; align-items:center; gap:0.4rem; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:6px; padding:0.3rem 0.65rem; font-size:0.8rem; font-weight:700; color:#065f46;">
             <span>✓ 1-Year Comprehensive Warranty given (Valid until ${matchingWarr.expiryDate || matchingWarr.expiry_date} • ${matchingWarr.status})</span>
           </div>`
        : `<div style="margin-top:0.45rem; display:inline-flex; align-items:center; gap:0.4rem; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:6px; padding:0.3rem 0.65rem; font-size:0.8rem; font-weight:700; color:#065f46;">
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
            Completed: <strong>${item.date}</strong>${totalCostText} • Verified by: ${item.logged_by || item.performedBy || 'Admin Operations'}
          </div>
          ${warrInfo}
        </div>
      `;
    }).join('');
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

    }
  }

  const settingsForm = document.getElementById('customerSettingsForm');
  if (settingsForm) {
    const sNameInput = document.getElementById('settingName');
    const sPhoneInput = document.getElementById('settingPhone');
    if (sNameInput) {
      sNameInput.addEventListener('input', () => {
        if (/\d/.test(sNameInput.value)) {
          sNameInput.value = sNameInput.value.replace(/\d/g, '');
          const hint = document.getElementById('settingNameHint');
          if (hint) {
            hint.style.display = 'block';
            setTimeout(() => { if (hint) hint.style.display = 'none'; }, 3500);
          }
        }
      });
    }
    if (sPhoneInput) {
      sPhoneInput.addEventListener('input', () => {
        if (/[a-zA-Z]/.test(sPhoneInput.value)) {
          sPhoneInput.value = sPhoneInput.value.replace(/[a-zA-Z]/g, '');
          const hint = document.getElementById('settingPhoneHint');
          if (hint) {
            hint.style.display = 'block';
            setTimeout(() => { if (hint) hint.style.display = 'none'; }, 3500);
          }
        }
      });
    }

    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const sName = document.getElementById('settingName').value.trim();
      const sCompany = document.getElementById('settingCompany').value.trim();
      const sEmail = document.getElementById('settingEmail').value.trim();
      const sPhone = document.getElementById('settingPhone').value.trim();

      if (!sName || !sCompany || !sEmail || !sPhone) {
        showToast('Please fill in all required profile settings fields.', 'error');
        return;
      }

      if (/\d/.test(sName)) {
        showToast('Contact Person Name cannot contain numbers. Please use letters only.', 'error');
        return;
      }
      const nameValidRegex = /^[a-zA-Z\u00C0-\u024F\s.\-']+$/;
      if (!nameValidRegex.test(sName) || sName.replace(/[^a-zA-Z\u00C0-\u024F]/g, '').length < 2) {
        showToast('Please enter a valid Contact Person Name (at least 2 letters, no numbers).', 'error');
        return;
      }

      if (sCompany.length < 2) {
        showToast('Company / Facility name must be at least 2 characters.', 'error');
        return;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(sEmail)) {
        showToast('Please enter a valid email address.', 'error');
        return;
      }

      if (/[a-zA-Z]/.test(sPhone)) {
        showToast('Mobile phone number cannot contain letters.', 'error');
        return;
      }
      const phoneDigits = sPhone.replace(/\D/g, '');
      if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        showToast('Please enter a valid phone number (7 to 15 digits).', 'error');
        return;
      }

      const currentUser = BD22_DB.get('currentUser') || {};
      const updatedUser = {
        ...currentUser,
        role: 'customer',
        name: sName,
        full_name: sName,
        company: sCompany,
        email: sEmail,
        phone: sPhone
      };
      const result = await BD22_DB.saveProfile(updatedUser);
      if (!result.success) {
        showToast(`Unable to save profile: ${result.error || 'Please try again.'}`, 'error');
        return;
      }

      updateCustomerDisplay();
      showToast(result.emailConfirmationRequired
        ? 'Profile saved. Confirm the email change using the link sent to your email.'
        : 'Profile updated!');
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

  // Real-time input listeners for modal service request
  const reqContactNameInput = document.getElementById('custReqContactName');
  if (reqContactNameInput) {
    reqContactNameInput.addEventListener('input', () => {
      if (/\d/.test(reqContactNameInput.value)) {
        reqContactNameInput.value = reqContactNameInput.value.replace(/\d/g, '');
        const hint = document.getElementById('custReqContactNameHint');
        if (hint) {
          hint.style.display = 'block';
          setTimeout(() => { if (hint) hint.style.display = 'none'; }, 3500);
        }
      }
    });
  }

  const reqContactPhoneInput = document.getElementById('custReqContactPhone');
  if (reqContactPhoneInput) {
    reqContactPhoneInput.addEventListener('input', () => {
      if (/[a-zA-Z]/.test(reqContactPhoneInput.value)) {
        reqContactPhoneInput.value = reqContactPhoneInput.value.replace(/[a-zA-Z]/g, '');
        const hint = document.getElementById('custReqContactPhoneHint');
        if (hint) {
          hint.style.display = 'block';
          setTimeout(() => { if (hint) hint.style.display = 'none'; }, 3500);
        }
      }
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
    const todayStr = new Date().toISOString().split('T')[0];
    if (preferredDate < todayStr) {
      return failValidation('custReqPreferredDate', 'Preferred target date cannot be in the past.');
    }

    // 4. Description
    const descEl = document.getElementById('custReqDescription');
    const description = descEl?.value ? descEl.value.trim() : '';
    if (!description) {
      return failValidation('custReqDescription', 'Please describe the scope of work or problem symptoms.');
    }

    // 5. Establishment Name
    const estEl = document.getElementById('custReqEstName');
    const estName = estEl?.value ? estEl.value.trim() : '';
    if (!estName) {
      return failValidation('custReqEstName', 'Please provide the Establishment / Building Name.');
    }

    // 6. Building Type
    const bldgEl = document.getElementById('custReqBuildingType');
    const buildingType = bldgEl?.value || '';
    if (!buildingType) {
      return failValidation('custReqBuildingType', 'Please select the Building Type.');
    }

    // 7. Floors
    const floorsEl = document.getElementById('custReqFloors');
    const floors = floorsEl?.value ? floorsEl.value.trim() : '';
    if (!floors) {
      return failValidation('custReqFloors', 'Please specify the number of floors or levels.');
    }

    // 8. Site Address
    const addrEl = document.getElementById('custReqSiteAddress');
    const siteAddress = addrEl?.value ? addrEl.value.trim() : '';
    if (!siteAddress) {
      return failValidation('custReqSiteAddress', 'Please provide the complete site address.');
    }

    // 9. Maps Link
    const mapsLink = document.getElementById('custReqMapsLink')?.value ? document.getElementById('custReqMapsLink').value.trim() : '';

    // 10. Contact Name
    const contactNameEl = document.getElementById('custReqContactName');
    const contactName = contactNameEl?.value ? contactNameEl.value.trim() : '';
    if (!contactName) {
      return failValidation('custReqContactName', 'Please enter the on-site Contact Person Name.');
    }
    if (/\d/.test(contactName)) {
      return failValidation('custReqContactName', 'Contact Person Name cannot contain numbers. Please use letters only.');
    }
    const nameValidRegex = /^[a-zA-Z\u00C0-\u024F\s.\-']+$/;
    if (!nameValidRegex.test(contactName) || contactName.replace(/[^a-zA-Z\u00C0-\u024F]/g, '').length < 2) {
      return failValidation('custReqContactName', 'Please enter a valid Contact Person Name (at least 2 letters, no numbers).');
    }

    // 11. Contact Position
    const contactPosEl = document.getElementById('custReqContactPosition');
    const contactPosition = contactPosEl?.value ? contactPosEl.value.trim() : 'Property Coordinator';

    // 12. Contact Phone
    const phoneEl = document.getElementById('custReqContactPhone');
    const contactPhone = phoneEl?.value ? phoneEl.value.trim() : '';
    if (!contactPhone) {
      return failValidation('custReqContactPhone', 'Please enter a contact mobile or telephone number.');
    }
    if (/[a-zA-Z]/.test(contactPhone)) {
      return failValidation('custReqContactPhone', 'Contact mobile number cannot contain letters.');
    }
    const cleanPhoneDigits = contactPhone.replace(/\D/g, '');
    if (cleanPhoneDigits.length < 7 || cleanPhoneDigits.length > 15) {
      return failValidation('custReqContactPhone', 'Please enter a valid contact phone number (7 to 15 digits).');
    }

    // 13. Contact Email
    const emailEl = document.getElementById('custReqContactEmail');
    const contactEmail = emailEl?.value ? emailEl.value.trim() : '';
    if (!contactEmail) {
      return failValidation('custReqContactEmail', 'Please enter a contact email address.');
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(contactEmail)) {
      return failValidation('custReqContactEmail', 'Please enter a valid contact email address (e.g. contact@company.com).');
    }

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
        description: description,
        establishment_name: estName,
        building_type: buildingType,
        floors: floors,
        site_address: siteAddress,
        google_maps_link: mapsLink,
        contact_name: contactName,
        contact_position: contactPosition,
        contact_phone: contactPhone,
        contact_email: contactEmail
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
        if (dateDisplay) dateDisplay.textContent = preferredDate;

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

  // Bind form submit listener (guarded against duplicate submissions)
  if (newServiceForm) {
    newServiceForm.addEventListener('submit', validateAndSubmitServiceForm);
  }

  const btnGoToInq = document.getElementById('btnGoToInquiries');
  if (btnGoToInq) {
    btnGoToInq.addEventListener('click', () => {
      const successModal = document.getElementById('serviceReqSuccessModal');
      if (successModal) successModal.classList.remove('active');
      switchView('inquiries');
    });
  }

  // Initialize the view after all render dependencies have been initialized.
  const initialHash = window.location.hash.replace('#', '') || 'overview';
  switchView(titlesMap[initialHash] ? initialHash : 'overview');
});
