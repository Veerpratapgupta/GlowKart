# GlowKart Product Specification

**Status:** Implemented (2026-11-01). This spec is the approved design baseline; the shipped flow lives in `components/flow/` and the README.

## One-line product

GlowKart is a guest-first beauty shopping experience that helps an online cosmetics buyer move from uncertainty to confidence: analyze visible skin needs, discover a suitable lipstick, and see the result through virtual try-on before adding it to a routine.

## Problem

**Online cosmetics buyers hesitate because product photos do not show whether a product will suit their skin and look.**

The buyer has two unanswered questions:

1. What should I choose?
2. Will it look good on me?

GlowKart answers those questions in one short journey without pretending to diagnose medical conditions.

## Target user

An online cosmetics buyer who wants a confident starting point and does not want to browse a large catalog or buy a product blindly.

## Product promise

**Understand your skin. Find your shade direction. See the look. Shop with confidence.**

## Primary demo

```text
Welcome
  → Upload or capture a selfie
  → Skin AI analysis
  → Explain 2–3 visible observations
  → Recommend one primary lipstick and two alternatives
  → Virtually try the primary lipstick
  → Show “your look” result and a simple cart
```

The first demo supports both upload and camera input at the UX level, but implementation may ship upload first if that is more reliable on the judging device.

## Product principles

- **Confidence, not diagnosis:** use “visible skin observations” and “beauty matching,” never medical conclusions.
- **One clear decision:** recommend a small set, not an overwhelming catalog.
- **Show, then ask:** the VTO result earns the add-to-cart action.
- **Guest-first:** no login wall during the judging path.
- **Honest integration:** live API states are distinct from demo fallback states.
- **Progressive depth:** the simple path works in under two minutes; details are available on demand.

## MVP boundary

### Must have

- Mobile-friendly web experience
- Upload and/or camera entry
- Secure YouCam Skin AI integration
- Normalized user-facing observations
- Curated lipstick catalog
- Explainable recommendation
- Secure YouCam lipstick VTO integration
- Prototype cart/routine result
- Loading, retry, invalid-input, and provider-error states
- Deployed HTTPS demo and backup recording

### Later, not MVP

- Full skincare routine
- Every makeup category
- Multiple VTO categories
- Authentication, saved profiles, and history
- Payments and fulfillment
- Retailer dashboard
- Conversational assistant
- Large catalog, reviews, or social features
- Medical-grade claims or advice

## Success signals

The demo succeeds when a judge can answer “yes” to all of these:

- I understand the problem within ten seconds.
- I see a meaningful YouCam API integration.
- I can complete the flow without being coached.
- The recommendation has a visible reason.
- The VTO changes my purchase confidence.
- The design feels intentional rather than like a generic API demo.

## Business value hypothesis

For consumers, GlowKart reduces uncertainty before purchase. For retailers, it creates a more informed product view and a stronger path from discovery to cart. These are hypotheses for the prototype, not measured claims.
