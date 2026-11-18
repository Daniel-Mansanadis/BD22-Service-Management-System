# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Property owners and building managers** needing fire protection systems for new or existing commercial, industrial, and residential facilities — including offices, factories, warehouses, data centers, and high-rise developments.

**Contractors and developers** needing a specialized fire protection subcontractor for construction and development projects. They evaluate BD22 on technical capability, compliance support, and the ability to handle specialized suppression systems.

Both audiences operate in the Philippines, often in Metro Manila. They arrive looking for a credible engineering partner, not a commodity installer. Many are navigating BFP (Bureau of Fire Protection) compliance requirements and need help with both the engineering documentation and the physical installation.

## Product Purpose

The website serves two functions:

1. **Landing / marketing site (Persuade):** Convert visitors — property owners, facility managers, and contractors — into service inquiries by demonstrating BD22's engineering competence, full-service capability, and specialization in advanced suppression systems. The primary conversion action is "Book an Appointment," which submits a service inquiry to the BD22 team via Supabase.

2. **Customer Portal (Operate):** Authenticated clients can track their appointments/inquiries, view project status, maintenance schedules, warranties, payments, and communicate with BD22. There is also an admin panel for internal project management.

## Positioning

BD22's differentiator is **specialization in high-value and industrial suppression systems** — FM-200, NOVEC 1230, preaction, deluge water spray, deluge foam sprinkler, and kitchen suppression — not just commodity fire sprinkler installation. This positions them above general-trade contractors and alongside specialized engineering firms, in a market where most competitors offer only basic sprinkler and alarm installation.

## Operating Context

- Projects span the full lifecycle: site assessment → engineering design → proposal → installation → testing/inspection → turnover → ongoing maintenance.
- Compliance with RA 9514 (Revised Fire Code of the Philippines) and relevant NFPA standards is a constant requirement across all engagements.
- Clients submit inquiries through the public website form; BD22 coordinates via email (bd22firepro@gmail.com), mobile (+63 916 388 4309), and landline (82942684).
- The customer portal lets authenticated clients track inquiry status, project progress, maintenance schedules, warranty information, and payment history.
- An admin panel lets BD22 staff manage inquiries, projects, customers, inventory, services, maintenance, payments, warranties, and messaging.

## Capabilities and Constraints

**Confirmed services:**
- Fire Sprinkler System
- FM-200 Fire Suppression System
- NOVEC 1230 Fire Suppression System
- Preaction System
- Deluge Water Spray System
- Deluge Foam Sprinkler System
- Kitchen Suppression System
- Fire Detection & Alarm System
- Fire Pumps

**Technical stack:**
- Static HTML/CSS/JS with no build tool or framework. Pages are individual HTML files.
- Backend: Supabase (database, auth, real-time) with a PHP API layer (`/api/` endpoints) and Google OAuth integration.
- Deployed on Vercel.
- Uses AOS (Animate On Scroll) for scroll animations, and a Tuqlas chatbot widget.
- No component library, no CSS preprocessor.

**Design constraint from the user:** Minimize the use of cards across the site. Card-heavy layouts are identified as an AI-slop pattern to avoid. Prefer alternative layout treatments — inline sections, tables, lists, typographic hierarchy, or direct content flow — over wrapping every item in a bordered/shadowed card container.

## Brand Commitments

- **Name:** BD22 Fire System & Builders Inc.
- **Logo:** `assets/images/bd22-logo.png`
- **Palette:** Red (#a61c14 primary action), dark navy/charcoal backgrounds, white text on dark surfaces. No formal brand guide beyond what the current site establishes.
- **Voice:** Professional, technical, direct. Engineering authority without marketing hyperbole. Avoids superlatives and invented social proof.

## Evidence on Hand

- Four completed project case studies with photographs:
  - Toyota Motor Philippines — Deluge Water Spray System
  - Universal Robina Corporation — FM-200 Fire Suppression System
  - Sanmar Shipping — FM-200 Fire Suppression System
  - Eco Solar — Solar Energy System (builder services)
- Each project has two photos in `assets/images/`.
- No testimonials, press coverage, or third-party certifications are published on the site. Future design work must not fabricate these.

## Product Principles

1. **Engineering credibility over marketing polish.** The site must project technical competence, not lifestyle aspiration. Every claim should be substantiated or removable.
2. **Conversion through clarity.** The visitor should understand what BD22 does, who it serves, and how to engage within seconds. The booking form is the site's revenue instrument.
3. **Minimize decorative structure.** Content earns its space through information density, not card borders and drop shadows. Use layout and typography to organize, not containers.
4. **Compliance is a feature.** RA 9514 and NFPA standards are not boilerplate footnotes — they are part of the value proposition and should be communicated with specificity.
5. **Honest evidence.** Use only real project photos and confirmed facts. No stock imagery presented as BD22 work, no invented testimonials, no fabricated statistics.
