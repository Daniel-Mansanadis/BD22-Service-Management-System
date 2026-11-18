/**
 * BD22 FIRE SYSTEM & BUILDERS INC.
 * Core State & Storage Management System
 * Authoritative Supabase Database Synchronization & State Persistence
 */

const BD22_DB = {
  csrfToken: null,
  _syncInterval: null,

  // Initialize clean data structures
  init() {
    const CURRENT_VERSION = '2.1';
    if (localStorage.getItem('bd22_db_version') !== CURRENT_VERSION) {
      this.clearUserData();
      localStorage.setItem('bd22_db_version', CURRENT_VERSION);
    }

    if (!localStorage.getItem('bd22_initialized')) {
      const initialData = {
        inquiries: [],
        serviceRequests: [],
        projects: [],
        payments: [],
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
          phone: '+63 917 888 2200',
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
  },

  // Clear all cached session data
  clearUserData() {
    const userKeys = [
      'currentUser', 'inquiries', 'serviceRequests', 'projects',
      'payments', 'warranties', 'maintenance', 'serviceHistory',
      'customerMessages', 'adminNotifications'
    ];
    userKeys.forEach(k => {
      localStorage.removeItem(`bd22_${k}`);
    });
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

  // Synchronize local cache with live Supabase PostgreSQL backend
  async sync() {
    try {
      // 1. Check session / me
      const authRes = await fetch('api/auth.php?action=me');
      let user = null;
      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.data && authData.data.csrf_token) {
          this.csrfToken = authData.data.csrf_token;
        }

        const isPortalPage = window.location.pathname.includes('customer-portal.html') || window.location.pathname.includes('admin.html');
        if (authData.data && authData.data.authenticated) {
          user = authData.data.user;
          const prevUser = this.get('currentUser');
          // If switching to a different user, clear previous cached data
          if (prevUser && prevUser.id && user && prevUser.id !== user.id) {
            this.clearUserData();
          }
          this.set('currentUser', user);

          // Role guard: redirect if customer tries to access admin
          if (window.location.pathname.includes('admin.html') && user.role !== 'admin') {
            window.location.href = 'customer-portal.html';
            return;
          }
        } else if (isPortalPage) {
          this.clearUserData();
          window.location.href = 'login.html';
          return;
        }
      }

      // Safe individual fetch helper
      const fetchSafe = async (url) => {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const json = await res.json();
            if (json && json.success) return json.data;
          }
        } catch (e) {
          console.warn('Sync fetch failed for ' + url, e);
        }
        return null;
      };

      const [inqData, srData, projData, payData, warrData, maintData, histData, msgData] = await Promise.all([
        fetchSafe('api/inquiries.php'),
        fetchSafe('api/service_requests.php'),
        fetchSafe('api/projects.php'),
        fetchSafe('api/payments.php'),
        fetchSafe('api/warranties.php'),
        fetchSafe('api/maintenance.php'),
        fetchSafe('api/history.php'),
        fetchSafe('api/messages.php')
      ]);

      if (inqData !== null && Array.isArray(inqData)) this.set('inquiries', inqData);
      if (srData !== null && Array.isArray(srData)) this.set('serviceRequests', srData);
      if (projData !== null && Array.isArray(projData)) this.set('projects', projData);
      if (payData !== null) {
        if (Array.isArray(payData)) this.set('payments', payData);
        else if (payData.payments && Array.isArray(payData.payments)) this.set('payments', payData.payments);
      }
      if (warrData !== null && Array.isArray(warrData)) this.set('warranties', warrData);
      if (maintData !== null && Array.isArray(maintData)) this.set('maintenance', maintData);
      if (histData !== null && Array.isArray(histData)) this.set('serviceHistory', histData);

      if (msgData !== null && Array.isArray(msgData)) {
        if (user && user.role === 'admin') {
          this.set('adminNotifications', msgData);
        } else {
          this.set('customerMessages', msgData);
        }
      }

      if (user && user.role === 'admin') {
        const invData = await fetchSafe('api/inventory.php');
        if (invData !== null && Array.isArray(invData)) {
          this.set('inventory', invData);
        }
      }

      // Dispatch event so UI re-renders with fresh database content
      window.dispatchEvent(new CustomEvent('bd22_synced'));
    } catch (err) {
      console.warn('Backend sync failed:', err);
      window.dispatchEvent(new CustomEvent('bd22_synced'));
    }
  },

  // Start polling so updates reflect across tabs/devices without manual page reload
  startAutoSync(intervalMs = 12000) {
    if (this._syncInterval) clearInterval(this._syncInterval);
    this._syncInterval = setInterval(() => {
      this.sync();
    }, intervalMs);
  },

  // Add new inquiry with server dispatch
  async addInquiry(newRecord) {
    let finalRef = 'INQ-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    try {
      const res = await fetch('api/inquiries.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.csrfToken || ''
        },
        body: JSON.stringify(newRecord)
      });
      const data = await res.json();
      if (res.ok && data.success && data.data && data.data.reference) {
        finalRef = data.data.reference;
      }
    } catch (err) {
      console.warn('Inquiry API dispatch failed:', err);
    }

    await this.sync();
    return finalRef;
  },

  // Add service request via API
  async addServiceRequest(reqData) {
    let finalRef = 'REQ-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    try {
      const res = await fetch('api/service_requests.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.csrfToken || ''
        },
        body: JSON.stringify(reqData)
      });
      const data = await res.json();
      if (res.ok && data.success && data.data && data.data.reference) {
        finalRef = data.data.reference;
      }
    } catch (err) {
      console.warn('Service request API dispatch failed:', err);
    }

    await this.sync();
    return finalRef;
  },

  // Update existing inquiry
  async updateInquiry(reference, updatedFields) {
    try {
      const res = await fetch('api/inquiries.php', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.csrfToken || ''
        },
        body: JSON.stringify({ reference, ...updatedFields })
      });
      const data = await res.json();
      await this.sync();
      return data;
    } catch (err) {
      console.warn('Inquiry update API failed:', err);
    }
    return true;
  },

  // Record a payment transaction
  async payInvoice(invoiceNum, method = 'Bank Transfer', refNo = '') {
    try {
      const res = await fetch('api/payments.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.csrfToken || ''
        },
        body: JSON.stringify({ invoice: invoiceNum, method, reference: refNo })
      });
      const data = await res.json();
      await this.sync();
      return data;
    } catch (err) {
      console.warn('Payment API post failed:', err);
    }
    return true;
  },

  // Create project via API
  async createProject(projData) {
    try {
      const res = await fetch('api/projects.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.csrfToken || ''
        },
        body: JSON.stringify(projData)
      });
      const data = await res.json();
      await this.sync();
      return data;
    } catch (err) {
      console.warn('Project creation API error:', err);
    }
  },

  // Save equipment via API
  async saveEquipment(eqData) {
    try {
      const res = await fetch('api/inventory.php', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.csrfToken || ''
        },
        body: JSON.stringify(eqData)
      });
      const data = await res.json();
      await this.sync();
      return data;
    } catch (err) {
      console.warn('Inventory update API error:', err);
    }
  },

  // Update profile via API
  async saveProfile(profData) {
    try {
      const res = await fetch('api/profile.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.csrfToken || ''
        },
        body: JSON.stringify(profData)
      });
      const data = await res.json();
      await this.sync();
      return data;
    } catch (err) {
      console.warn('Profile update API error:', err);
    }
  },

  // Logout cleanly from server session
  async logout() {
    try {
      await fetch('api/auth.php?action=logout', { method: 'POST' });
    } catch (e) {}
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
  toast.innerHTML = `
    <span style="font-size: 1.2rem; color: #a61c14;">●</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Global modal closer helper
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

  // Attach logout handler to all sign-out links
  document.querySelectorAll('a[href="login.html"]').forEach(link => {
    if (link.textContent.toLowerCase().includes('sign out') || link.textContent.toLowerCase().includes('logout')) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        BD22_DB.logout();
      });
    }
  });
}

// Initialize on DOM load and start backend synchronization
document.addEventListener('DOMContentLoaded', () => {
  BD22_DB.init();
  setupModalDismiss();
  BD22_DB.sync();
  BD22_DB.startAutoSync(12000);
});
