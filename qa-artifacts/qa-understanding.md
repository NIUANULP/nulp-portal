# QA Understanding — Certificate QR Verification

**Environment:** Dev — https://devnulp.niua.org/
**PRs under test:**
- [NIUANULP/nulp-portal#759](https://github.com/NIUANULP/nulp-portal/pull/759) — Public certificate QR verification page + API
- [NIUANULP/nulp-elite-ui#1163](https://github.com/NIUANULP/nulp-elite-ui/pull/1163) — Short verification QR on downloaded certificates

Both PRs were merged on 29 Oct 2026 and must ship together: the elite UI QR points to the portal page.

---

## 1. Summary

**Problem:**
- Certificate QRs encoded a very long link, which printed too dense to scan.
- Verification ran in the browser and needed the issuer's key. RC certificates issued without an issuer key failed it, even when genuine.
- Some RC certificate APIs (download, search) could be called without login, so anyone could fetch other people's certificates.

**Solution:**
- **New public API:** `GET /certificate/public/v1/verify/:id`, no login needed. The portal server reads the certificate from the RC registry using its own token and returns only what the page needs.
- **New public page:** `/certs/:id?t=1` or `?data=…` shows a full-screen result: Genuine, Not a NULP certificate, Revoked, or Not checked (with a retry). No header or footer.
- **Short QR:** downloading a certificate from Elite UI → Profile → Certificates swaps the template QR for one that encodes `<origin>/certs/<osid>?t=1`.
- **API lock-down:** `rc/certificate/v1/download/:id` now needs login. `rc/certificate/v1/search` needs login, and the `filters.recipient.id.eq` filter must be the logged-in user's own id.
- **PDF fix:** the certificate renders off-screen (no flash on screen), and the download is awaited before the hidden container is removed (no blank PDFs).

---

## 2. API behaviour (what the server should return)

| Input | HTTP | `responseCode` | `result` |
|---|---|---|---|
| Valid, active certificate | 200 | OK | `verified: true`, `certificate { id, recipientName, trainingName, trainingType, issuerName, issuedOn }` |
| Valid, revoked or other non-ACTIVE status | 200 | OK | `verified: false`, `status` (no holder details) |
| Well-formed id that doesn't exist | 404 | RESOURCE_NOT_FOUND | `verified: false` |
| Malformed id (not `[A-Za-z0-9-]`, or not 8–64 characters) | 400 | CLIENT_ERROR | `{}` |
| Registry down or auth failure | 500 | SERVER_ERROR | `{}` |
| More than 60 requests a minute from one IP | 429 | TOO_MANY_REQUESTS | `{}` + `Retry-After` header |

All responses carry the `X-Robots-Tag: noindex, nofollow` header.

---

## 3. Use cases

| ID | Actor | Use case | Expected outcome |
|---|---|---|---|
| UC-01 | Employer or verifier (not logged in) | Scans the QR on a NULP certificate | Page opens without login and shows "Genuine NULP certificate" with holder, course, issue date, issuer and ID |
| UC-02 | Verifier | Scans a fake or tampered QR | "Not a NULP certificate" |
| UC-03 | Verifier | Scans a revoked certificate | "Certificate revoked"; holder details hidden |
| UC-04 | Verifier | Verifies when the registry is down | "Certificate not checked" + Try again |
| UC-05 | Verifier | Shares the result | "Copy verification link" copies a clean `/certs/<id>?t=1` link |
| UC-06 | Verifier | Scans an **old** certificate (long `?data=` QR) | Still verifies through the new API |
| UC-07 | Learner (logged in) | Downloads a certificate from Elite UI → Profile → Certificates | PDF isn't blank, no on-screen flash, and the QR is short and scannable |
| UC-08 | Learner | Downloads a certificate whose template has no QR | Downloads unchanged |
| UC-09 | Learner (logged in) | Views and downloads own certificates (portal profile, elite profile, event details) | Works as before |
| UC-10 | Anonymous or other user | Calls RC download or search for someone else's certificates | Blocked |
| UC-11 | User with the access code | Opens `/certs/<id>` with no query | Old access-code form, with the portal header |
| UC-12 | Script or bot | Guesses ids in bulk | Rate-limited (429); results not indexed by search engines |

---

## 4. Scope

**In scope:** the public verify API, the verification page (all states, English and Hindi, mobile), the short QR on Elite UI download, the PDF render, the RC API lock-down and its regressions, header and footer visibility.

**Out of scope:** RC registry internals, certificate issuance, prod deployment.

---

## 5. Risks and open questions

1. **Legacy (certreg v1/v2) certificates:** the page now checks the RC registry only. Pre-RC certificates may show "Not a NULP certificate".
2. **Search lock-down:** any caller of `rc/certificate/v1/search` that doesn't filter on `recipient.id.eq` = the session user will get 403. Possible examples are admin, creator and report screens.
3. **Rate-limit bypass:** the limit is keyed on the first `X-Forwarded-For` value, which the client can spoof. Counts are kept in each server's memory, so with several pods the real limit is 60 × pods, and it resets on restart.
4. **Hindi:** all 24 `cert.imsg.verify` keys are translated in `hi.json` (the file is a single line, so the diff showed 1 line). Still check the `{time}` substitution and the English fallback for other languages.
5. **Short QR coverage:** only the Elite UI profile download gets the short QR. Event and portal-profile downloads may keep the dense QR.
6. **QR domain:** the QR uses `window.location.origin`, so certificates downloaded on dev point to devnulp.

---

## 6. Test data needed

- A valid, active RC certificate osid, plus its PDF
- A revoked RC certificate osid
- An old certificate with a long `?data=` QR
- A legacy (pre-RC) certificate, if one exists on dev
- Two learner accounts (User A, User B), each with at least one certificate
- A certificate template without a QR image

---

## 7. Sign-off criteria

- All P1 test cases pass
- No open Critical or High defects; Medium defects have an agreed owner and plan
- Regression on certificate listing and download passes on both the portal and Elite UI
- Risks 1–5 above are answered or accepted by the dev or PO
