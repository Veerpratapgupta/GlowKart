# Official Hackathon Verification

**Checked:** 2026-10-31  
**Sources searched:**

- Devpost event: <https://youcam-api-skin-ai-ecommerce.devpost.com/>
- Rules: <https://youcam-api-skin-ai-ecommerce.devpost.com/rules>
- Judge access discussion: <https://youcam-api-skin-ai-ecommerce.devpost.com/forum_topics/45693-judge-access-local-test-build-with-recorded-api-result-and-gated-fresh-inference>
- Perfect Corp announcement: <https://www.perfectcorp.com/business/news/YouCam-API-Hackthon-eCommerce>

The Devpost pages returned HTTP 403 to automated retrieval, so the items below are based on indexed search results and must be manually rechecked in a browser before final submission.

## Verified or strongly indicated requirements

| Requirement | GlowCart response | Status |
|---|---|---|
| Build a web or mobile application | Next.js web prototype | aligned |
| Use at least one YouCam API meaningfully | Skin AI first, lipstick VTO second | aligned |
| Target skincare, beauty, fashion, or e-commerce | Cosmetics shopping | aligned |
| Provide a way for judges to test the solution | Add recorded-response demo mode and deployed URL | required addition |
| Explain fresh API inference access without exposing credentials | Document live mode and demo mode separately | required addition |
| Submit source code and runnable instructions | Public repository and README | planned |
| Provide a public demo/video | Two-minute demo plus backup recording | planned |
| Deadline reported by indexed results | November 2, 2026 at 11:45 a.m. ET | manually confirm |
| Prize pool reported by indexed results | $6,000 total, with category awards | informational only |

## Design verification

The current GlowCart concept is in scope:

```text
guest shopper → selfie/camera → Skin AI observations
→ explainable lipstick recommendations → lipstick VTO
→ confidence-building result → prototype cart
```

It is not sufficient to ship only a static mockup. The final project must demonstrate a real YouCam integration in live mode or clearly show recorded results from a real integration, while remaining testable without private credentials.

## Required submission modes

### Demo mode

- Uses recorded, sanitized API response fixtures created from a real integration.
- Is clearly labeled as `Demo mode` or `Recorded API result`.
- Lets judges complete the end-to-end journey without an API key.
- Never claims that a fixture is a fresh inference.

### Live mode

- Uses server-side YouCam credentials supplied through deployment secrets.
- Is optional for judges unless the official rules require fresh inference.
- Has explicit provider timeout, quota, and error states.
- Is documented without publishing credentials.

## Release blockers

Do not call GlowCart submission-ready until:

- At least one real YouCam API integration has been verified.
- A recorded-response path can be tested without secrets.
- The README explains both modes and how judges can run the project.
- The deployed URL and backup video are available.
- The Devpost rules page has been manually checked for any additional required fields or licensing rules.
