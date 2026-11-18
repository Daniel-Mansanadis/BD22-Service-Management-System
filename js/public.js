/**
 * BD22 FIRE SYSTEM & BUILDERS INC. - PUBLIC WEBSITE SCRIPTS
 * Controls slider, accordions, modals, and inquiry dispatch across public pages
 */

document.addEventListener('DOMContentLoaded', () => {
  const setupLegalModal = legalModal => {
    const legalTitle = legalModal.querySelector('#legalModalTitle');
    const legalTabs = legalModal.querySelectorAll('.legal-modal-tab');
    const privacyPanel = legalModal.querySelector('#privacyPolicyPanel');
    const termsPanel = legalModal.querySelector('#termsConditionsPanel');
    const closeButton = legalModal.querySelector('.modal-close-btn');
    let legalTrigger = null;

    const selectLegalTab = name => {
      const isPrivacy = name === 'privacy';
      const selectedTab = legalModal.querySelector(`[data-legal-tab="${name}"].legal-modal-tab`);
      legalTitle.textContent = isPrivacy ? 'Privacy Policy' : 'Terms and Conditions';

      legalTabs.forEach(tab => {
        const selected = tab === selectedTab;
        tab.classList.toggle('active', selected);
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });

      privacyPanel.hidden = !isPrivacy;
      termsPanel.hidden = isPrivacy;
    };

    const closeLegalModal = () => {
      legalModal.classList.remove('active');
      legalModal.setAttribute('aria-hidden', 'true');
      if (legalTrigger) legalTrigger.focus();
    };

    const openLegalModal = (name, trigger = null) => {
      legalTrigger = trigger;
      selectLegalTab(name);
      legalModal.classList.add('active');
      legalModal.setAttribute('aria-hidden', 'false');
      if (trigger) closeButton.focus();
    };

    legalTabs.forEach(tab => {
      tab.addEventListener('click', () => selectLegalTab(tab.dataset.legalTab));
      tab.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          const nextTab = tab.dataset.legalTab === 'privacy' ? 'terms' : 'privacy';
          selectLegalTab(nextTab);
          legalModal.querySelector(`.legal-modal-tab[data-legal-tab="${nextTab}"]`).focus();
        }
      });
    });

    closeButton.addEventListener('click', closeLegalModal);
    legalModal.addEventListener('click', event => {
      if (event.target === legalModal) closeLegalModal();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && legalModal.classList.contains('active')) {
        closeLegalModal();
      }
    });

    return { legalModal, openLegalModal };
  };

  const existingLegalModal = document.getElementById('legalPolicyModal');
  let legalModalPromise = existingLegalModal
    ? Promise.resolve(setupLegalModal(existingLegalModal))
    : null;

  const ensureLegalModal = () => {
    if (!legalModalPromise) {
      legalModalPromise = fetch(new URL('index.html', window.location.href))
        .then(response => {
          if (!response.ok) throw new Error(`Could not load legal documents (${response.status}).`);
          return response.text();
        })
        .then(html => {
          const legalDocument = new DOMParser().parseFromString(html, 'text/html');
          const legalModal = legalDocument.getElementById('legalPolicyModal');
          if (!legalModal) throw new Error('The legal document modal is missing from index.html.');
          document.body.append(legalModal);
          return setupLegalModal(legalModal);
        })
        .catch(error => {
          legalModalPromise = null;
          throw error;
        });
    }

    return legalModalPromise;
  };

  const openInitialLegalModal = tab => {
    ensureLegalModal()
      .then(({ openLegalModal }) => openLegalModal(tab))
      .catch(error => {
        console.error('Unable to open legal documents:', error);
        showToast('Legal information could not be loaded. Please try again.', 'error');
      });
  };

  document.addEventListener('click', event => {
    const trigger = event.target instanceof Element
      ? event.target.closest('.legal-policy-link')
      : null;
    if (!trigger) return;

    event.preventDefault();
    ensureLegalModal()
      .then(({ openLegalModal }) => openLegalModal(trigger.dataset.legalTab, trigger))
      .catch(error => {
        console.error('Unable to open legal documents:', error);
        showToast('Legal information could not be loaded. Please try again.', 'error');
      });
  });

  const initialLegalTab = window.location.hash === '#terms-and-conditions'
    ? 'terms'
    : window.location.hash === '#privacy-policy' ? 'privacy' : null;
  if (initialLegalTab) openInitialLegalModal(initialLegalTab);

  // 0. Home hero slideshow
  const heroSlides = document.querySelectorAll('.home-hero-slide');
  if (heroSlides.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let activeHeroSlide = 0;
    window.setInterval(() => {
      heroSlides[activeHeroSlide].classList.remove('is-active');
      activeHeroSlide = (activeHeroSlide + 1) % heroSlides.length;
      const nextSlide = heroSlides[activeHeroSlide];
      if (nextSlide.dataset.bg && !nextSlide.style.backgroundImage) {
        nextSlide.style.backgroundImage = `url('${nextSlide.dataset.bg}')`;
      }
      nextSlide.classList.add('is-active');
    }, 5000);
  }

  // 1. Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobileNavToggle') || document.querySelector('.mobile-nav-toggle');
  const navMenu = document.getElementById('navMenu') || document.querySelector('.nav-menu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 2. FAQ Accordion (Mockup 9)
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        faqItems.forEach(other => other.classList.remove('open'));
        if (!isOpen) {
          item.classList.add('open');
        }
      });
    }
  });

  // 4. Service Detail Modal (Mockups 5 & 6)
  const serviceModal = document.getElementById('serviceDetailModal');
  const serviceCards = document.querySelectorAll('.white-service-card');

  const serviceSpecs = {
    'sprinkler': {
      title: 'Fire Sprinkler System',
      overview: 'Turnkey hydraulic line sizing, head distribution, and BFP compliance.',
      desc: 'Our engineering team designs, fabricates, and commissions complete wet pipe, dry pipe, and preaction fire sprinkler systems. We calculate friction loss and water supply demand in strict alignment with NFPA 13 and the Revised Fire Code of the Philippines.',
      standards: [
        'Fire Code of the Philippines (RA 9514)',
        'NFPA 13 (Standard for the Installation of Sprinkler Systems)',
        'UL Listed & FM Approved Sprinkler Heads and Alarm Check Valves'
      ]
    },
    'fm200': {
      title: 'FM-200 Fire Suppression System',
      overview: 'Clean-agent protection for sensitive equipment and critical environments.',
      desc: 'FM-200 systems suppress fires in protected spaces without leaving water or chemical residue, making them suitable for areas with sensitive equipment.',
      standards: [
        'NFPA 2001 (Standard on Clean Agent Fire Extinguishing Systems)',
        'System design based on protected room volume',
        'Integrated fire detection and releasing controls'
      ]
    },
    'novec': {
      title: 'NOVEC 1230 Fire Suppression System',
      overview: 'Clean-agent suppression for specialized applications and protected spaces.',
      desc: 'NOVEC 1230 systems provide clean-agent fire protection for spaces where water-based suppression could damage equipment or interrupt operations.',
      standards: [
        'NFPA 2001 (Standard on Clean Agent Fire Extinguishing Systems)',
        'System design based on protected room volume',
        'Integrated fire detection and releasing controls'
      ]
    },
    'preaction': {
      title: 'Preaction System',
      overview: 'Double-interlock preaction mechanisms for zero accidental water discharge.',
      desc: 'Engineered specifically for sensitive environments including telecommunications vaults, data centers, cleanrooms, and museum archives where accidental pipe rupture or head activation cannot be tolerated.',
      standards: [
        'NFPA 13 & NFPA 75 (Protection of Information Technology Equipment)',
        'Dual-action electric/pneumatic release detection',
        'Fail-safe supervisory air pressure monitoring'
      ]
    },
    'deluge-water': {
      title: 'Deluge Water Spray System',
      overview: 'High-velocity water spray for high-hazard fire protection.',
      desc: 'Deluge systems utilize unpressurized open nozzles fed through a rapid-acting deluge valve triggered by hydraulic, pneumatic, or electric fire detection. Ideal for transformer yards, aircraft hangars, and fuel loading terminals.',
      standards: [
        'NFPA 15 (Standard for Water Spray Fixed Systems)',
        'Open-nozzle discharge through a deluge valve',
        'Automatic seismic and flow-rate safety interlocks'
      ]
    },
    'deluge-foam': {
      title: 'Deluge Foam Sprinkler System',
      overview: 'Foam-water fire protection for specialized fire risks.',
      desc: 'Foam-water sprinkler systems combine water and foam concentrate to protect facilities with flammable-liquid or other specialized fire hazards.',
      standards: [
        'NFPA 16 (Standard for the Installation of Foam-Water Sprinkler and Foam-Water Spray Systems)',
        'Foam proportioning and concentrate storage',
        'System design matched to the protected hazard'
      ]
    },
    'kitchen': {
      title: 'Kitchen Suppression System',
      overview: 'Fire suppression for commercial cooking equipment and exhaust hoods.',
      desc: 'Kitchen suppression systems protect cooking appliances, hood plenums, and exhaust ducts, with automatic detection and agent discharge designed for commercial kitchens.',
      standards: [
        'NFPA 17A (Standard for Wet Chemical Extinguishing Systems)',
        'Protection coordinated with cooking appliances and hood exhaust',
        'Manual and automatic system activation'
      ]
    },
    'alarm': {
      title: 'Fire Detection & Alarm System',
      overview: 'Early fire detection and occupant notification.',
      desc: 'Fire detection and alarm systems use compatible initiating devices, control equipment, and notification appliances to provide timely warning of fire conditions.',
      standards: [
        'NFPA 72 (National Fire Alarm and Signaling Code)',
        'Detection and notification device coordination',
        'System design matched to the protected occupancy'
      ]
    },
    'pumps': {
      title: 'Fire Pumps',
      overview: 'Reliable water supply and pressure for fire protection systems.',
      desc: 'Fire pump systems support required water flow and pressure for connected fire protection equipment, with controls and components selected for the project demand.',
      standards: [
        'NFPA 20 (Standard for the Installation of Stationary Pumps for Fire Protection)',
        'Pump and driver selection based on system demand',
        'Controller and water supply coordination'
      ]
    }
  };

  if (serviceCards.length > 0 && serviceModal) {
    serviceCards.forEach(card => {
      card.addEventListener('click', () => {
        const key = card.getAttribute('data-service-key') || 'sprinkler';
        const spec = serviceSpecs[key] || serviceSpecs['sprinkler'];

        const elTitle = document.getElementById('modalServiceTitle');
        const elOverview = document.getElementById('modalServiceOverview');
        const elDesc = document.getElementById('modalServiceDescription');
        const elStandards = document.getElementById('modalServiceStandards');
        const elInquire = document.getElementById('modalServiceInquireBtn');

        if (elTitle) elTitle.textContent = spec.title;
        if (elOverview) elOverview.textContent = spec.overview;
        if (elDesc) elDesc.textContent = spec.desc;
        if (elStandards) {
          elStandards.innerHTML = spec.standards.map(s => `<li>${s}</li>`).join('');
        }
        if (elInquire) {
          elInquire.href = `contacts.html?service=${encodeURIComponent(spec.title)}`;
        }

        serviceModal.classList.add('active');
      });
    });
  }

  // 5. Project Detail Modal (Mockups 7 & 8)
  const projectModal = document.getElementById('projectDetailModal');
  const projectButtons = document.querySelectorAll('.view-project-btn');

  const projectDetailsMap = {
    'proj-1': {
      name: 'Eco Solar Battery Energy Storage Facility',
      client: 'Panit-an, Roxas City, Capiz',
      desc: 'Battery energy storage facility project in Panit-an, Roxas City, Capiz.',
      milestones: 'Eco Solar Battery Energy Storage Facility project.'
    },
    'proj-2': {
      name: 'FM200 Fire Suppression System',
      client: 'URC, Lacarlota City, Negros Oriental Mindoro',
      desc: 'FM200 fire suppression system project for URC in Lacarlota City, Negros Oriental Mindoro.',
      milestones: 'FM200 fire suppression system project.'
    },
    'proj-3': {
      name: 'Sanmar Solar Energy PMS of FM200 Fire Suppression System and Fire Fighting System',
      client: 'San Marcelino, Zambales',
      desc: 'Preventive maintenance of the FM200 fire suppression and fire fighting systems at Sanmar Solar Energy.',
      milestones: 'Preventive maintenance of the FM200 fire suppression system and fire fighting system.'
    },
    'proj-4': {
      name: 'Toyota Motors Philippines Inc. PMS of Fire Deluge System and Fire Pump',
      client: 'Laguna',
      desc: 'Preventive maintenance of the fire deluge system and fire pump at Toyota Motors Philippines Inc.',
      milestones: 'Preventive maintenance of the fire deluge system and fire pump.'
    }
  };

  if (projectButtons.length > 0 && projectModal) {
    projectButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const pid = btn.getAttribute('data-project-id') || 'proj-1';
        const p = projectDetailsMap[pid] || projectDetailsMap['proj-1'];

        const elName = document.getElementById('modalProjectName');
        const elClient = document.getElementById('modalProjectClient');
        const elDesc = document.getElementById('modalProjectDesc');
        const elMilestones = document.getElementById('modalProjectMilestones');

        if (elName) elName.textContent = p.name;
        if (elClient) elClient.textContent = p.client;
        if (elDesc) elDesc.textContent = p.desc;
        if (elMilestones) elMilestones.textContent = p.milestones;

        projectModal.classList.add('active');
      });
    });
  }

  // 6. Pre-select service from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const serviceParam = urlParams.get('service');
  const serviceDropdown = document.getElementById('inqServiceType') || document.getElementById('serviceNeeded');
  if (serviceParam && serviceDropdown) {
    for (let opt of serviceDropdown.options) {
      if (opt.text.toLowerCase().includes(serviceParam.toLowerCase()) || opt.value.toLowerCase().includes(serviceParam.toLowerCase())) {
        opt.selected = true;
        break;
      }
    }
  }

  // 7. Public Inquiry Form Submission (Mockups 2, 3, 10)
  const inquiryForm = document.getElementById('publicInquiryForm') || document.getElementById('serviceInquiryForm');
  const successModal = document.getElementById('inquirySuccessModal');
  const successRefSpan = document.getElementById('modalSuccessRef') || document.getElementById('generatedRefNumber');

  // Real-time input sanitization for public inquiry forms
  const inqNameEl = document.getElementById('inqCustomerName') || document.getElementById('fullName');
  if (inqNameEl && inqNameEl.getAttribute('pattern')) {
    inqNameEl.addEventListener('input', () => {
      if (/\d/.test(inqNameEl.value)) {
        inqNameEl.value = inqNameEl.value.replace(/\d/g, '');
        const hint = document.getElementById('inqCustomerNameHint');
        if (hint) {
          hint.style.display = 'block';
          setTimeout(() => { if (hint) hint.style.display = 'none'; }, 3500);
        }
      }
    });
  }

  const inqPhoneEl = document.getElementById('inqPhone') || document.getElementById('contactNumber');
  if (inqPhoneEl) {
    inqPhoneEl.addEventListener('input', () => {
      if (/[a-zA-Z]/.test(inqPhoneEl.value)) {
        inqPhoneEl.value = inqPhoneEl.value.replace(/[a-zA-Z]/g, '');
        const hint = document.getElementById('inqPhoneHint');
        if (hint) {
          hint.style.display = 'block';
          setTimeout(() => { if (hint) hint.style.display = 'none'; }, 3500);
        }
      }
    });
  }

  if (inquiryForm) {
    let isSubmittingInquiry = false;

    inquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSubmittingInquiry) return;

      const nameInput = document.getElementById('inqCustomerName') || document.getElementById('fullName');
      const emailInput = document.getElementById('inqEmail') || document.getElementById('email');
      const phoneInput = document.getElementById('inqPhone') || document.getElementById('contactNumber');
      const serviceInput = document.getElementById('inqServiceType') || document.getElementById('serviceNeeded');
      const messageInput = document.getElementById('inqMessage') || document.getElementById('inquiryMessage');

      const user = (window.BD22_DB && BD22_DB.get('currentUser')) || {};
      const customerName = nameInput ? nameInput.value.trim() : (user.full_name || '');
      const email = emailInput ? emailInput.value.trim() : (user.email || '');
      const phone = phoneInput ? phoneInput.value.trim() : (user.phone || '');
      const service = serviceInput ? serviceInput.value : '';
      const message = messageInput ? messageInput.value.trim() : '';

      // Form validation
      if (!customerName || customerName.length < 2) {
        showToast('Please enter your full name or company name (at least 2 characters).', 'error');
        if (nameInput) {
          nameInput.focus();
          nameInput.classList.add('input-error-pulse');
        }
        return;
      }

      if (nameInput && nameInput.getAttribute('pattern') && /\d/.test(customerName)) {
        showToast('Full Name cannot contain numbers. Please use letters only.', 'error');
        if (nameInput) {
          nameInput.focus();
          nameInput.classList.add('input-error-pulse');
        }
        return;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!email || !emailRegex.test(email)) {
        showToast('Please enter a valid email address (e.g. name@company.com).', 'error');
        if (emailInput) {
          emailInput.focus();
          emailInput.classList.add('input-error-pulse');
        }
        return;
      }

      if (/[a-zA-Z]/.test(phone)) {
        showToast('Mobile phone number cannot contain letters.', 'error');
        if (phoneInput) {
          phoneInput.focus();
          phoneInput.classList.add('input-error-pulse');
        }
        return;
      }

      const cleanDigits = phone.replace(/\D/g, '');
      if (cleanDigits.length < 7 || cleanDigits.length > 15) {
        showToast('Please enter a valid phone number (between 7 and 15 digits).', 'error');
        if (phoneInput) {
          phoneInput.focus();
          phoneInput.classList.add('input-error-pulse');
        }
        return;
      }

      if (!service) {
        showToast('Please select a fire protection service category.', 'error');
        if (serviceInput) {
          serviceInput.focus();
          serviceInput.classList.add('input-error-pulse');
        }
        return;
      }

      if (!message || message.length < 10) {
        showToast('Please provide a description of your site requirements (at least 10 characters).', 'error');
        if (messageInput) {
          messageInput.focus();
          messageInput.classList.add('input-error-pulse');
        }
        return;
      }

      const submitBtn = inquiryForm.querySelector('button[type="submit"]');
      const origText = submitBtn ? submitBtn.textContent : 'Submit Inquiry';
      isSubmittingInquiry = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
      }

      try {
        const ref = await BD22_DB.addInquiry({
          customer: customerName,
          email,
          phone,
          service,
          message
        });

        if (successModal && successRefSpan) {
          successRefSpan.textContent = ref;
          successModal.classList.add('active');
        } else {
          showToast(`Request received and pending review. Reference: ${ref}`);
        }
        inquiryForm.reset();
      } catch (error) {
        console.error('Public inquiry submission failed:', error);
        showToast('We could not submit your request. Your details are still here; please try again or email bd22firepro@gmail.com.', 'error');
      } finally {
        isSubmittingInquiry = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = origText;
        }
      }
    });
  }
});
