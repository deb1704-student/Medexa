# Medexa

> **Integrated Care Continuity & Referral Intelligence Platform for Rural and Underserved Healthcare**

Medexa is an offline-first healthcare continuity platform being developed for **Smart India Hackathon 2026**.

The platform is designed to address a problem that often exists beyond clinical diagnosis:

> A patient may receive the correct medical advice and still fail to receive continuous care.

Referrals may not be acknowledged. Patients may miss follow-ups. Connectivity may disappear. Appropriate facilities may be overloaded. Travel barriers may prevent care from continuing.

Medexa focuses on detecting and reducing these **care-continuity failures**.

---

# Table of Contents

- [Problem Statement](#problem-statement)
- [Our Approach](#our-approach)
- [Core Design Principle](#core-design-principle)
- [Key Capabilities](#key-capabilities)
- [Current Implementation Status](#current-implementation-status)
- [Architecture Overview](#architecture-overview)
- [Frontend Architecture](#frontend-architecture)
- [Domain Model](#domain-model)
- [Clinical Risk Engine](#clinical-risk-engine)
- [Continuity Risk Engine](#continuity-risk-engine)
- [Referral Lifecycle](#referral-lifecycle)
- [Referral SLA Monitoring](#referral-sla-monitoring)
- [Referral Rescue](#referral-rescue)
- [Offline-First Design](#offline-first-design)
- [District Dashboard](#district-dashboard)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Quick Start](#quick-start)
- [Running With Docker](#running-with-docker-recommended)
- [Running Without Docker](#running-without-docker)
- [Available Commands](#available-commands)
- [Environment Configuration](#environment-configuration)
- [Backend Integration](#backend-integration)
- [Team Development Workflow](#team-development-workflow)
- [Contributing Guidelines](#contributing-guidelines)
- [Important Architecture Rules](#important-architecture-rules)
- [Documentation](#documentation)
- [Current Roadmap](#current-roadmap)

---

# Problem Statement

Healthcare systems frequently focus on whether a patient has been diagnosed, treated, or referred.

However, a major operational problem remains:

## What happens after the referral?

A patient journey may break because:

- A referral is never acknowledged.
- A receiving facility is overloaded.
- An appointment is delayed.
- A patient cannot travel to the appropriate facility.
- Connectivity prevents communication.
- A follow-up is missed.
- The outcome of treatment never reaches the originating healthcare worker.
- A patient silently disappears from the care pathway.

These failures are particularly significant in:

- Rural healthcare environments.
- Underserved regions.
- Low-connectivity areas.
- Distributed public healthcare systems.
- Referral-heavy care networks.

Medexa is designed as a **care continuity layer** that helps detect, track, and reduce these failures.

---

# Our Approach

Medexa models healthcare as a **continuous care journey** rather than a collection of isolated clinical encounters.

The central entity is the:

## Care Episode

A Care Episode represents a patient's ongoing journey through the healthcare system.

It connects:

```text
Patient
   ¦
   ?
Care Episode
   ¦
   +-- Triage Assessment
   ¦
   +-- Clinical Risk
   ¦
   +-- Referral
   ¦
   +-- Referral SLA
   ¦
   +-- Continuity Risk
   ¦
   +-- Referral Rescue Actions
   ¦
   +-- Follow-up Tasks
