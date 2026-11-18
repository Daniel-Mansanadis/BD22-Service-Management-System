/**
 * BD22 FIRE SYSTEM & BUILDERS INC. - PUBLIC WEBSITE SCRIPTS
 * Controls slider, accordions, modals, and inquiry dispatch across public pages
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobileNavToggle') || document.querySelector('.mobile-nav-toggle');
  const navMenu = document.getElementById('navMenu') || document.querySelector('.nav-menu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });
  }

  // 2. Hero Slider (Mockup 1)
  const slides = document.querySelectorAll('.hero-slide');
  const prevBtn = document.getElementById('sliderPrev') || document.querySelector('.slider-prev');
  const nextBtn = document.getElementById('sliderNext') || document.querySelector('.slider-next');
  let currentSlide = 0;

  function showSlide(index) {
    if (!slides.length) return;
    slides.forEach((s, i) => {
      s.classList.toggle('active', i === index);
    });
  }

  if (prevBtn && nextBtn && slides.length > 0) {
    prevBtn.addEventListener('click', () => {
      currentSlide = (currentSlide - 1 + slides.length) % slides.length;
      showSlide(currentSlide);
    });
    nextBtn.addEventListener('click', () => {
      currentSlide = (currentSlide + 1) % slides.length;
      showSlide(currentSlide);
    });
    // Auto-advance every 6 seconds
    setInterval(() => {
      currentSlide = (currentSlide + 1) % slides.length;
      showSlide(currentSlide);
    }, 6000);
  }

  // 3. FAQ Accordion (Mockup 9)
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
      title: 'Fire Sprinkler Systems (Wet & Dry Pipe)',
      overview: 'Turnkey hydraulic line sizing, head distribution, and BFP compliance.',
      desc: 'Our engineering team designs, fabricates, and commissions complete wet pipe, dry pipe, and preaction fire sprinkler systems. We calculate friction loss and water supply demand in strict alignment with NFPA 13 and the Revised Fire Code of the Philippines.',
      standards: [
        'Fire Code of the Philippines (RA 9514)',
        'NFPA 13 (Standard for the Installation of Sprinkler Systems)',
        'UL Listed & FM Approved Sprinkler Heads and Alarm Check Valves'
      ]
    },
    'preaction': {
      title: 'Preaction Fire Protection Systems',
      overview: 'Double-interlock preaction mechanisms for zero accidental water discharge.',
      desc: 'Engineered specifically for sensitive environments including telecommunications vaults, data centers, cleanrooms, and museum archives where accidental pipe rupture or head activation cannot be tolerated.',
      standards: [
        'NFPA 13 & NFPA 75 (Protection of Information Technology Equipment)',
        'Dual-action electric/pneumatic release detection',
        'Fail-safe supervisory air pressure monitoring'
      ]
    },
    'cleanagent': {
      title: 'FM-200 & NOVEC 1230 Clean Agent Systems',
      overview: 'Waterless, non-conductive total flooding gaseous extinguishing agent.',
      desc: 'Suppresses electrical and flammable liquid fires within 10 seconds of discharge without residue, collateral water damage, or electrical shorting. Guaranteed safe for occupied spaces when engineered to precise room volume calculations.',
      standards: [
        'NFPA 2001 (Standard on Clean Agent Fire Extinguishing Systems)',
        'Zero Ozone Depletion Potential (ODP)',
        'Integrated with intelligent addressable smoke and heat cross-zoning'
      ]
    },
    'deluge': {
      title: 'Deluge & Foam Extinguishing Systems',
      overview: 'High-velocity water spray and aqueous film-forming foam (AFFF).',
      desc: 'Deluge systems utilize unpressurized open nozzles fed through a rapid-acting deluge valve triggered by hydraulic, pneumatic, or electric fire detection. Ideal for transformer yards, aircraft hangars, and fuel loading terminals.',
      standards: [
        'NFPA 15 (Water Spray Fixed Systems) & NFPA 16 (Foam-Water Systems)',
        'High-expansion foam proportioners & concentrate bladder tanks',
        'Automatic seismic and flow-rate safety interlocks'
      ]
    },
    'standpipe': {
      title: 'Standpipe & Fire Department Siamese Connections',
      overview: 'Class I, II, and III standpipe risers with certified Siamese inlet bodies.',
      desc: 'Robust vertical pipe networks that supply reliable water pressure to fire hoses across all floors. Complete with heavy-duty ductile iron fittings, angle valves, pressure-reducing valves, and roof manifolds.',
      standards: [
        'NFPA 14 (Standard for the Installation of Standpipe and Hose Systems)',
        'BFP Compliant Siamese Twin Connections with check valves',
        'Hydrostatic test certification to 200 PSI'
      ]
    },
    'pms': {
      title: 'Preventative Maintenance & Testing (PMS)',
      overview: 'Scheduled quarterly, semi-annual, and annual inspection agreements.',
      desc: 'Keep your property 100% compliant and ready for inspection. We provide regular fire pump flow test runs, valve lubrication, hydro-testing of cylinders, alarm battery load testing, and certified test reports for BFP FSIC permit renewal.',
      standards: [
        'NFPA 25 (Inspection, Testing, and Maintenance of Water-Based Fire Protection Systems)',
        'NFPA 72 (National Fire Alarm and Signaling Code)',
        'Official BFP Fire Safety Inspection Certification assistance'
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
      name: 'North Harbor Warehouse Sprinkler Retrofit',
      client: 'Arden Manufacturing Ltd.',
      status: 'Completed',
      date: 'Nov 18, 2026',
      team: 'Ramos Fire Systems',
      desc: 'Turnkey hydraulic line sizing, pipe threading, booster pump overhaul, and sprinkler head placement across an active 18,000 sqm distribution hub with zero warehouse downtime.',
      milestones: 'Initial site survey, hydraulic calculation submission to BFP, fabrication, off-peak night installation, pressure testing, and final FSIC issuance.'
    },
    'proj-2': {
      name: 'Meridian Tower Fire Alarm Upgrade',
      client: 'Meridian Property Group',
      status: 'Completed',
      date: 'Oct 01, 2026',
      team: 'Ramos Fire Systems',
      desc: 'Complete multi-loop intelligent addressable fire detection overhaul across 24 floors with optical smoke sensors, heat sensors, elevator recall, and HVAC damper shutdown automation.',
      milestones: 'System engineering review, panel installation, commissioning of 640 addressable points, voice evacuation acoustic tuning, and local authority turnover.'
    },
    'proj-3': {
      name: 'Cedar Grove Residential Complex Audit',
      client: 'Cedar Grove Residences',
      status: 'In Progress',
      date: 'Dec 15, 2026',
      team: 'Ramos Fire Systems',
      desc: 'Full residential standpipe riser inspection, emergency lighting circuit rewiring, and Siamese inlet valve overhaul across 3 multi-family residential towers.',
      milestones: 'Phase 1 flow testing completed, Phase 2 emergency lighting unit procurement, Phase 3 BFP re-certification scheduled.'
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
        const elStatus = document.getElementById('modalProjectStatus');
        const elDate = document.getElementById('modalProjectDate');
        const elTeam = document.getElementById('modalProjectTeam');
        const elDesc = document.getElementById('modalProjectDesc');
        const elMilestones = document.getElementById('modalProjectMilestones');

        if (elName) elName.textContent = p.name;
        if (elClient) elClient.textContent = p.client;
        if (elDate) elDate.textContent = p.date;
        if (elTeam) elTeam.textContent = p.team;
        if (elDesc) elDesc.textContent = p.desc;
        if (elMilestones) elMilestones.textContent = p.milestones;

        if (elStatus) {
          elStatus.textContent = p.status;
          elStatus.className = 'badge-status ' + (p.status === 'Completed' ? 'badge-completed' : 'badge-in-progress');
        }

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

  if (inquiryForm) {
    inquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('inqCustomerName') || document.getElementById('fullName');
      const emailInput = document.getElementById('inqEmail') || document.getElementById('email');
      const phoneInput = document.getElementById('inqPhone') || document.getElementById('contactNumber');
      const serviceInput = document.getElementById('inqServiceType') || document.getElementById('serviceNeeded');
      const messageInput = document.getElementById('inqMessage') || document.getElementById('inquiryMessage');

      const user = (window.BD22_DB && BD22_DB.get('currentUser')) || {};
      const customerName = nameInput ? nameInput.value.trim() : (user.full_name || '');
      const email = emailInput ? emailInput.value.trim() : (user.email || '');
      const phone = phoneInput ? phoneInput.value.trim() : (user.phone || '');
      const service = serviceInput ? serviceInput.value : 'Fire Protection Service';
      const message = messageInput ? messageInput.value.trim() : 'Inquiry registered from website.';

      const submitBtn = inquiryForm.querySelector('button[type="submit"]');
      const origText = submitBtn ? submitBtn.textContent : 'Submit Inquiry';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
      }

      // Save to BD22_DB & MariaDB backend
      const ref = await BD22_DB.addInquiry({
        customer: customerName,
        email: email,
        phone: phone,
        service: service,
        message: message
      });

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = origText;
      }

      // Show confirmation
      if (successModal && successRefSpan) {
        successRefSpan.textContent = ref;
        successModal.classList.add('active');
        inquiryForm.reset();
      } else {
        showToast(`Inquiry submitted successfully! Reference: ${ref}`);
        inquiryForm.reset();
      }
    });
  }
});
