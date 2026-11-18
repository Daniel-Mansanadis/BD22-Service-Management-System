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
    const payments = BD22_DB.get('payments') || [];
    const warranties = BD22_DB.get('warranties') || [];
    const maintenance = BD22_DB.get('maintenance') || [];

    // Stats
    const activeProjectsCount = projects.filter(p => p.status === 'In Progress').length;
    const pendingInqCount = inquiries.filter(i => i.status === 'Pending Review' || i.status === 'Under Review').length;
    const activeWarrCount = warranties.filter(w => w.status === 'Active').length;
    
    // Balance
    let balance = 0;
    payments.forEach(p => {
      if (p.status === 'Partial' || p.status === 'Overdue' || p.status === 'Pending') {
        balance += Number(p.amount) || 0;
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
      const recentItems = inquiries.slice(0, 4);
      if (recentItems.length > 0) {
        activityContainer.innerHTML = recentItems.map(item => {
          let dot = 'dot-blue';
          if (item.status === 'Pending Review') dot = 'dot-red';
          else if (item.status === 'Scheduled') dot = 'dot-yellow';
          else if (item.status === 'In Progress') dot = 'dot-blue';
          else if (item.status === 'Completed') dot = 'dot-green';

          return `
            <div class="activity-item">
              <div class="activity-dot ${dot}"></div>
              <div class="activity-body">
                <span class="activity-title">${item.service} (${item.reference}) — ${item.status}</span>
                <span class="activity-time">${item.dateSubmitted} • Assigned: ${item.assignedStaff || 'Awaiting Staff Assignment'}</span>
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

      // 1. Pending or overdue invoices
      payments.forEach(p => {
        if (p.status === 'Partial' || p.status === 'Overdue') {
          actionItems.push({
            dot: 'dot-red',
            title: `Outstanding Invoice ${p.invoice} (₱${Number(p.amount).toLocaleString()})`,
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
          <div style="text-align: center; padding: 2.5rem 1rem; color: #64748b; font-size: 0.95rem;">
            ✓ All systems and accounts in good standing. No urgent action required.
          </div>
        `;
      }
    }
  }

  // =========================================================================
  // VIEW 2: MY INQUIRIES (Mockup 15)
  // =========================================================================
  const inqSearchInput = document.getElementById('customerInquirySearch');
  const inqStatusFilter = document.getElementById('customerInquiryStatusFilter');

  function renderInquiries() {
    const tbody = document.getElementById('customerInquiriesTableBody');
    if (!tbody) return;

    const inquiries = BD22_DB.get('inquiries') || [];
    const searchVal = (inqSearchInput?.value || '').toLowerCase().trim();
    const statusVal = inqStatusFilter?.value || 'All';

    const filtered = inquiries.filter(item => {
      const matchesSearch = (item.reference || '').toLowerCase().includes(searchVal) ||
                            (item.service || '').toLowerCase().includes(searchVal) ||
                            (item.trackingNote && item.trackingNote.toLowerCase().includes(searchVal));
      const matchesStatus = statusVal === 'All' || item.status === statusVal;
      return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding: 3.5rem 1.5rem; color: #64748b;">
            <div style="font-size:2rem; margin-bottom:0.5rem;">📄</div>
            <strong>No inquiries submitted yet</strong>
            <p style="margin-top:0.25rem; font-size:0.85rem;">Click "+ Request Service" to submit your first service request or inquiry.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(item => {
      let badgeClass = 'badge-pending';
      if (item.status === 'Scheduled') badgeClass = 'badge-scheduled';
      if (item.status === 'In Progress') badgeClass = 'badge-in-progress';
      if (item.status === 'Completed') badgeClass = 'badge-completed';
      if (item.status === 'Cancelled') badgeClass = 'badge-urgent';

      return `
        <tr data-ref="${item.reference}">
          <td class="ref-code">${item.reference}</td>
          <td style="font-weight: 700;">${item.service}</td>
          <td><span class="date-pill">${item.dateSubmitted}</span></td>
          <td><span class="badge-status ${badgeClass}">${item.status}</span></td>
          <td>${item.assignedStaff || 'Unassigned'}</td>
          <td style="color: #64748b;">${item.lastUpdate || 'Just now'}</td>
          <td><span class="row-action-arrow">›</span></td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('tr').forEach(row => {
      row.addEventListener('click', () => {
        const ref = row.getAttribute('data-ref');
        const item = inquiries.find(i => i.reference === ref);
        if (item) openInquiryDetailModal(item);
      });
    });
  }

  if (inqSearchInput) inqSearchInput.addEventListener('input', renderInquiries);
  if (inqStatusFilter) inqStatusFilter.addEventListener('change', renderInquiries);

  const custInqModal = document.getElementById('custInquiryDetailModal');
  function openInquiryDetailModal(item) {
    if (!custInqModal) return;
    document.getElementById('custInqRef').textContent = item.reference;
    document.getElementById('custInqService').textContent = item.service;
    document.getElementById('custInqStaff').textContent = item.assignedStaff || 'Awaiting Staff Assignment';
    document.getElementById('custInqNotes').textContent = item.trackingNote || 'Our service team is reviewing site requirements and will coordinate the next activity.';
    
    const badge = document.getElementById('custInqStatus');
    badge.textContent = item.status;
    badge.className = 'badge-status ' + (item.status === 'Completed' ? 'badge-completed' : (item.status === 'In Progress' || item.status === 'Scheduled' ? 'badge-in-progress' : 'badge-pending'));

    custInqModal.classList.add('active');
  }

  // =========================================================================
  // VIEW 3: SERVICES & PROJECTS (Mockups 16 & 17)
  // =========================================================================
  const custProjModal = document.getElementById('custProjectDetailModal');

  function renderProjects() {
    const grid = document.getElementById('customerProjectsGrid');
    if (!grid) return;

    const projects = BD22_DB.get('projects') || [];

    if (projects.length === 0) {
      grid.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1.5rem; background: #ffffff; border-radius: 12px; border: 1px dashed #cbd5e1;">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🏗️</div>
          <h4 style="font-weight: 700; color: #1e293b; margin-bottom: 0.35rem;">No Active Projects</h4>
          <p style="color: #64748b; font-size: 0.9rem;">You do not have any ongoing installations or retrofits yet. Submit a service request to initiate a project.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = projects.map(p => {
      let badgeClass = 'badge-in-progress';
      if (p.status === 'Completed') badgeClass = 'badge-completed';
      if (p.status === 'Scheduled') badgeClass = 'badge-scheduled';

      return `
        <div class="portal-project-card">
          <div class="project-card-header">
            <h3 class="portal-project-card-title">${p.name}</h3>
            <span class="badge-status ${badgeClass}">${p.status}</span>
          </div>
          <p class="portal-project-subtitle">Assigned Engineering Team: <strong>${p.team}</strong></p>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${p.progress || 0}%;"></div>
          </div>
          <div class="progress-info-row">
            <span>Target completion: ${p.targetDate || 'TBD'}</span>
            <span>${p.progress || 0}%</span>
          </div>
          <div style="margin-top:auto; display:flex; justify-content:flex-end;">
            <button class="project-details-btn" data-proj-id="${p.id}">View project details →</button>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.project-details-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.getAttribute('data-proj-id');
        const proj = projects.find(p => p.id === pid);
        if (proj && custProjModal) {
          document.getElementById('custProjTitle').textContent = proj.name;
          document.getElementById('custProjDate').textContent = proj.targetDate || 'TBD';
          document.getElementById('custProjProgressFill').style.width = `${proj.progress || 0}%`;
          document.getElementById('custProjProgressText').textContent = `${proj.progress || 0}% Complete`;
          document.getElementById('custProjMilestones').textContent = proj.milestones || 'Milestones include survey, engineering review, procurement, installation, commissioning, and turnover.';
          
          const badge = document.getElementById('custProjBadge');
          badge.textContent = proj.status;
          badge.className = 'badge-status ' + (proj.status === 'Completed' ? 'badge-completed' : 'badge-in-progress');

          custProjModal.classList.add('active');
        }
      });
    });
  }

  // =========================================================================
  // VIEW 4: PAYMENTS (Mockups 18, 19, 20)
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
      const amt = Number(p.amount) || 0;
      billed += amt;
      if (p.status === 'Paid') {
        paid += amt;
      } else {
        balance += amt;
        if (p.status === 'Overdue') overdue++;
      }
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
          <td colspan="6" style="text-align:center; padding: 3.5rem 1.5rem; color: #64748b;">
            <div style="font-size:2rem; margin-bottom:0.5rem;">💳</div>
            <strong>No billing or invoice records found</strong>
            <p style="margin-top:0.25rem; font-size:0.85rem;">Invoices will be posted here as milestones are completed.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = payments.map(p => {
      let badgeClass = 'badge-completed';
      if (p.status === 'Partial') badgeClass = 'badge-pending';
      if (p.status === 'Overdue') badgeClass = 'badge-urgent';

      return `
        <tr>
          <td class="ref-code">${p.invoice}</td>
          <td style="font-weight: 700;">${p.project}</td>
          <td><strong>₱${Number(p.amount).toLocaleString()}</strong></td>
          <td><span class="date-pill">${p.dueDate || 'TBD'}</span></td>
          <td><span class="badge-status ${badgeClass}">${p.status}</span></td>
          <td>
            ${p.status !== 'Paid' ? `
              <button class="btn btn-primary-red btn-sm btn-pay-now" data-inv="${p.invoice}">Pay Now</button>
            ` : '<span style="color:#15803d; font-weight:700;">Paid</span>'}
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-pay-now').forEach(btn => {
      btn.addEventListener('click', () => {
        const inv = btn.getAttribute('data-inv');
        const p = payments.find(item => item.invoice === inv);
        if (p && paymentModal) {
          selectedInvoice = p;
          document.getElementById('payModalInvoice').textContent = p.invoice;
          document.getElementById('payModalAmount').textContent = '₱' + Number(p.amount).toLocaleString();
          document.getElementById('payModalProject').textContent = p.project;
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
      if (selectedInvoice) {
        const method = document.getElementById('payMethod') ? document.getElementById('payMethod').value : 'Bank Transfer';
        const refNo = document.getElementById('payRef') ? document.getElementById('payRef').value : '';
        await BD22_DB.payInvoice(selectedInvoice.invoice, method, refNo);
        paymentModal.classList.remove('active');
        showToast(`Payment of ₱${Number(selectedInvoice.amount).toLocaleString()} for ${selectedInvoice.invoice} recorded!`);
        renderPayments();
        renderOverview();
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
          <div style="font-size:2rem; margin-bottom:0.5rem;">🛡️</div>
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
          <div style="font-size:2rem; margin-bottom:0.5rem;">🔧</div>
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
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📋</div>
          <strong>No completed service history records logged yet</strong>
          <p style="margin-top:0.25rem; font-size:0.85rem;">Completed installations and inspection certificates will be recorded here.</p>
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
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">✉️</div>
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
  // MODAL: + NEW SERVICE REQUEST (Mockup 14)
  // =========================================================================
  const newServiceModal = document.getElementById('newServiceModal');
  const btnOpenService = document.getElementById('btnOpenNewServiceModal');
  const newServiceForm = document.getElementById('customerNewServiceForm');

  if (btnOpenService && newServiceModal) {
    btnOpenService.addEventListener('click', () => {
      newServiceModal.classList.add('active');
    });
  }

  if (newServiceForm) {
    newServiceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const srvType = document.getElementById('custReqServiceType').value;
      const urgency = document.getElementById('custReqUrgency').value;
      const notes = document.getElementById('custReqNotes').value;

      const user = BD22_DB.get('currentUser') || {};

      // Register dispatch service request
      await BD22_DB.addServiceRequest({
        serviceType: srvType,
        urgency: urgency,
        notes: notes
      });

      // Also register inquiry for tracking
      const ref = await BD22_DB.addInquiry({
        customer: user.full_name || user.name || 'Customer',
        email: user.email || '',
        phone: user.phone || '',
        service: srvType,
        message: `[${urgency}] ${notes}`
      });

      newServiceModal.classList.remove('active');
      newServiceForm.reset();
      showToast(`Service request logged! Reference: ${ref}`);
      switchView('inquiries');
    });
  }
});
