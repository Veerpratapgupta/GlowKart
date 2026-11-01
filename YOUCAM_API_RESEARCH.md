# YouCam API Research

**Status:** Research complete enough to plan, with one successful live SD result
**Checked:** 2026-10-31

## Official sources

- Documentation home: <https://docs.perfectcorp.com/develop/introduction>
- Quick start: <https://docs.perfectcorp.com/develop/quick_start_guide>
- API server: <https://docs.perfectcorp.com/develop/api_server>
- Skin analysis reference: <https://docs.perfectcorp.com/reference/ai_skin_analysis>
- Skin analysis playground: <https://yce.perfectcorp.com/api-console/en/api-playground/ai-skin-analysis/>
- Makeup VTO playground: <https://yce.perfectcorp.com/api-console/en/api-playground/ai-makeup-virtual-try-on/>
- Official Agent Skills: <https://github.com/YouCam-API/skills>
- Official Beauty MCP: <https://github.com/YouCam-API/beauty-personal-care-MCP>

The official reference pages were not retrievable from this environment because of a DNS/TLS transport failure. The playground landing page is reachable, but its interactive request details are client-rendered. The following facts come from indexed search results, the installed official skill contract, one successful live skill-run, and one successful direct live application probe.

## Strongly indicated workflow

The Skin AI flow appears to be asynchronous:

```text
request upload metadata
  → receive pre-signed upload URL and file id
  → upload image to the pre-signed URL
  → create skin-analysis task with file id
  → poll task status
  → retrieve normalized result and any overlays
```

The installed official skill contract resolves the Skin AI task path to `POST`/`GET /s2s/v2.1/task/skin-analysis/{task_id}`. Its local fallback identifies file registration at `/s2s/v2.0/file`, with a `files` metadata array followed by a PUT to the returned request URL. These facts are implemented and verified through the application route.

The task request used by the official skill is:

```json
{
  "format": "json",
  "src_file_id": "[file id]",
  "dst_actions": ["wrinkle", "acne", "moisture"]
}
```

The action families appear to include separate SD and HD names, and the two families must not be mixed. Confirm the exact supported action list for the hackathon account before choosing actions.

The adapter sends `format: "json"` because the official skill requires it. The direct application probe confirmed the expected response envelope and normalized observations without exposing provider payloads.

The application adapter intentionally bounds live work to a 120-second upload,
20-second metadata/task/status requests, and ten status polls at two-second
intervals. The browser allows 420 seconds for the complete request, while
recorded mode remains the recommended judge path.

## Live verification

The GlowKart production build passed a controlled direct application probe on
2026-10-31 using the protected live route and a configured server-only
authorization value. The sanitized response was HTTP 200 with `mode: "live"`,
`source: "live"`, and supported observations `pore` (61), `moisture` (72), and
`acne` (99). No credential, task ID, signed URL, raw provider payload, or image
data was persisted.

One controlled SD request succeeded on 2026-10-31 using the official skill and a temporary converted PNG. It used the three SD actions `acne`, `pore`, and `moisture` and returned `task_status: success`. The sanitized result contained:

```json
{
  "pore": 61,
  "moisture": 72,
  "acne": 99,
  "all": 77.33333333333333,
  "skin_age": 24
}
```

Only `ui_score` values are suitable for user-facing interpretation; raw scores and temporary signed result URLs were discarded. The official skill documents that higher `ui_score` is better and that these are AI reference results, not medical diagnosis.

## Authentication

The official skill successfully authenticated and completed the live request using the configured key. The application requires the generated-client Authorization value in the server-only `YOUCAM_AUTHORIZATION` environment variable; its exact value is never documented or returned to the browser. No credential, response URL, or response token was recorded.

Do not guess the header. Confirm the official quick-start generated code and keep the credential server-side.

## Input constraints

The official skill accepts JPG/JPEG/PNG inputs and the live request rejected earlier test images for face framing (`error_src_face_too_small`) and pose (`error_large_face_angle`). The current UI now asks for an upright, front-facing face filling most of the frame and accepts JPG/PNG up to 8 MB. Exact provider pixel limits remain **unverified**.

## VTO research

The controlled VTO probe and official contract review verified:

- Register and upload the selfie through `POST /s2s/v2.0/file` and its signed
  HTTPS `PUT` target.
- Create the task with `POST /s2s/v2.0/task/makeup-vto`.
- Poll `GET /s2s/v2.0/task/makeup-vto/{task_id}` until success.
- Use a `lip_color` effect with `original` shape, `full` style, the catalog
  swatch, matte texture, and intensity 100.
- Read the temporary result image from `data.results.url`.

A controlled `Sun Coral` probe completed successfully. The adapter now keeps
this flow server-side, validates HTTPS upload/result targets, and exposes only
the temporary result URL to the protected browser flow. Exact account quota,
pricing, and retention remain unverified.

## Safe implementation plan

1. Manually open the official quick-start and Skin AI reference pages.
2. Use the official playground to create one test request with a non-sensitive sample image.
3. Record exact auth, endpoint, payload, response, status values, and error responses here without recording credentials.
4. Implement a server-side provider adapter around those verified facts.
5. Capture a sanitized result fixture from the real integration.
6. Add a clearly labeled recorded-response mode for judges.
7. Keep live VTO restricted to protected deployments and preserve a recorded
   fallback for public judging.

## Agent helpers

The official `skin-analysis-expert` skill is installed for OpenCode and the official beauty MCP is configured at the user level. The MCP docs identify the remote server as:

```text
https://mcp-api-01.makeupar.com/mcp/beauty
```

Its authorization value must include the provider's required `******` prefix. The OpenCode configuration uses an environment placeholder and contains no API key. These helpers are for controlled research/validation; they do not remove the need for a secure application adapter.

## Current status

The Skin AI capability, upload/task flow, and normalized live application
boundary are verified. Keep recorded mode as the public default and run live
mode only on a separately protected deployment; do not proxy provider
credentials through the browser.
