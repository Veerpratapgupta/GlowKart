# YouCam API Research

**Status:** Research complete enough to plan, not enough to implement safely
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

The official reference pages were not retrievable from this environment because of a DNS/TLS transport failure. The playground landing page is reachable, but its interactive request details are client-rendered. The following facts come from indexed search results pointing to official URLs and a metadata-only endpoint probe; exact auth formatting and schemas still require confirmation in the browser API playground.

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

The indexed results identify these paths as likely:

- `POST /s2s/v2.0/file`
- `POST /s2s/v2.0/task/skin-analysis`
- `GET /s2s/v2.0/skin-analysis/{task_id}`

Additional indexed results indicate task polling may use:

- `GET /s2s/v2.0/task/skin-analysis/{task_id}`

The task request is indicated as:

```json
{
  "src_file_id": "[file id]",
  "dst_actions": ["wrinkle", "acne", "moisture"]
}
```

The action families appear to include separate SD and HD names, and the two families must not be mixed. Confirm the exact supported action list for the hackathon account before choosing actions.

Do not implement these paths until the exact request and response schemas are copied from the official reference or playground.

## Authentication

Indexed results indicate an API-key `Authorization` header. The exact header syntax was redacted in search output and is therefore **unverified**. A metadata-only probe against `https://yce-api-01.makeupar.com/s2s/v2.0/file` returned HTTP 401 for both direct and `Bearer` candidates using the local value. This does not prove which format is correct; it may indicate a revoked/wrong key, a required account credential, or an incorrect header format. No response body, signed URL, or credential was recorded.

Do not guess the header. Confirm the official quick-start generated code and keep the credential server-side.

## Input constraints

Indexed results indicate possible image constraints around JPEG/PNG, file size, and pixel dimensions. Exact limits are **unverified**. The current Phase 1 UI accepts JPG, PNG, and WebP up to 8 MB; reconcile that validation with the official Skin AI limits before Phase 2 implementation.

## VTO research

Indexed results indicate a makeup VTO operation with a lipstick/lip-color effect and palette fields such as color, texture, and intensity. Exact endpoint, upload flow, response shape, and supported product parameters are **unverified**. VTO remains deferred until the Skin AI adapter is stable.

## Safe implementation plan

1. Manually open the official quick-start and Skin AI reference pages.
2. Use the official playground to create one test request with a non-sensitive sample image.
3. Record exact auth, endpoint, payload, response, status values, and error responses here without recording credentials.
4. Implement a server-side provider adapter around those verified facts.
5. Capture a sanitized result fixture from the real integration.
6. Add a clearly labeled recorded-response mode for judges.
7. Research and implement lipstick VTO only after Skin AI passes its verification gate.

## Agent helpers

The official `skin-analysis-expert` skill is installed for OpenCode and the official beauty MCP is configured at the user level. The MCP docs identify the remote server as:

```text
https://mcp-api-01.makeupar.com/mcp/beauty
```

Its authorization value must include the provider's required `******` prefix. The OpenCode configuration uses an environment placeholder and contains no API key. These helpers are for controlled research/validation; they do not remove the need for a secure application adapter.

## Current blocker

No provider code should be written yet. The exact authorization header and schemas are not verified in this environment, and the local metadata probe returned 401. First confirm the key status and generated authorization example in the official console, then repeat only the metadata request before consuming an analysis unit.
