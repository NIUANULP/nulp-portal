# QA Test Report — Certificate QR Verification

| | |
|---|---|
| **Release** | nulp-portal PR #759 (public verify API + page, RC API lock-down) · nulp-elite-ui PR #1163 (short QR on downloaded certificate) |
| **Environment** | Dev — https://devnulp.niua.org (build deployed 03-Nov-2026, `main.6f223850316c72f027e6.js`) |
| **Test dates** | 02–03 Nov 2026 |
| **Tested by** | Tekdi QA (API: curl · UI: Playwright on Chrome 156, Edge 156, Firefox 157, WebKit 27.2, Pixel 7 and iPhone 14 emulation) |
| **Detailed results** | `NULP_UAT_E2E_Test_Pack_CertificateQR_Release_Nov2026.xlsx` (Test Cases, Defect Log, Findings) · screenshots in `screenshots-2026-11-03/` · deployment evidence in `dev-deployment-evidence-2026-11-03.txt` |

## 1. Verdict

**Not ready for sign-off.** The verification page and the API lock-down work as specified in every browser and on mobile. Two rate-limit defects are open, and the core download → QR → scan flow is still untested, because dev could not issue a certificate during the test window.

## 2. Execution summary

| Status | Count |
|---|---|
| Pass | 31 |
| Fail | 3 (2 defects) |
| Blocked | 15 |
| Not run | 40 |
| **Total** | **89** |

| Module | Pass | Fail | Blocked | Not run |
|---|---|---|---|---|
| Verify API | 6 | – | 1 | 5 |
| Verify page | 10 | – | 1 | 7 |
| Page chrome (header/footer) | 3 | – | – | 3 |
| Privacy & SEO | 2 | – | 1 | 2 |
| RC API security (lock-down) | 7 | – | 1 | 2 |
| Rate limit | 1 | 3 | – | 1 |
| Certificate download / short QR | – | – | 11 | – |
| Deployment | 2 | – | – | 3 |
| Regression, i18n, E2E | – | – | – | 17 |

Most of the "Not run" cases need things QA does not have on dev: a revoked certificate, a second learner, admin or mentor accounts, or DevOps help (outage simulation, logs, pod config).

## 3. Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | QR-template certificate downloaded from Profile → Certificates has a small, scannable QR | ⛔ Blocked | No certificate could be issued (see §5) |
| 2 | Phone scan opens `/certs/<id>` without login | 🟡 Partial | Link opens without login on emulated Pixel 7 and iPhone 14. Real camera scan pending |
| 3 | Genuine page shows correct Awarded to, course, Issued on, Issued by, Certificate ID, matching the PDF | 🟡 Partial | All fields match the registry in all 6 targets. PDF comparison pending |
| 4 | Invalid or made-up id shows "Not a NULP certificate" | ✅ Pass | Made-up, malformed and one-character-tampered ids, all 6 targets |
| 5 | Revoked certificate shows "Certificate revoked" | 🟡 Partial | No revoked certificate on dev. Page renders the state correctly from a simulated response |
| 6 | "Verifying certificate" while loading; "Certificate not checked" with a working Try again | ✅ Pass | All 6 targets. See F-18 for a related reliability risk |
| 7 | Copy verification link → "Link copied" | ✅ Pass | Clipboard holds `…/certs/<id>?t=1` |
| 8 | No app header or footer on the verification page; the rest of the site keeps them | ✅ Pass | Also with the old `?data=` link. Access-code form and logged-in pages keep their header |
| 9 | Old-template certificates download correctly without a QR | ⛔ Blocked | Same cause as #1 |
| 10 | Logged out, download and search fail; logged in, they work only for your own certificates | ✅ Pass | Logged out: 403. Logged in: own 23 certificates; other user's id, empty filter, `in` and training filters all 403 |
| 11 | Displays correctly in Chrome, Firefox, Safari, Edge and on mobile | ✅ Pass | No horizontal scroll, readable text, long names wrap. Safari covered by the WebKit engine, not a real iPhone |

## 4. Defects

| ID | Severity | Summary | Status |
|---|---|---|---|
| DEF-002 | High | Rate limit on the public verify API can be bypassed by sending a different `X-Forwarded-For` header on each request. While the real IP was throttled (429), 100 spoofed requests all succeeded | Open |
| DEF-003 | Medium | Rate limit lets about 180 requests per window through instead of 60. Each of the ~3 portal pods keeps its own in-memory counter | Open |

## 5. Blockers and environment issues

| ID | Severity | Issue | Status |
|---|---|---|---|
| — | Critical | **No certificate issued.** The learner account completed Title Course (server: enrollment status 2, 100%; batch has QR template `cert_template_fixed_qr` with criterion "status 2"), but no certificate appeared after about 40 minutes (polled every 30 s, 11:42–12:08 UTC). Dev's certificate-issuing job is likely stuck | Open, DevOps to check |
| F-17 | High | Older dev certificates use template storage hosts that no longer exist (`devnewnulp…`, `nulpstorage1…`), so they cannot be downloaded (400). The new QR template host is reachable | Open |
| F-20 | Critical | Content service returned 500 on every content read, so no content would play | **Resolved 03-Nov** |

## 6. Other findings for the team

| ID | Severity | Finding |
|---|---|---|
| F-16 | Critical | Before this release, `/learner/rc/certificate/v1/search` returned **every learner's certificates to anyone, logged out** (452 certificates from 71 people on dev). Fixed on dev by #759. **Prod still runs the old rule**, so prod is very likely exposed until this release ships |
| F-01 | Critical | Prod branch has 3 commits (Node 20 build fix) missing from the release branch. Merge them before building for prod |
| F-03 | High | Certificate download needs login but not ownership, so any logged-in user can download another person's certificate by id (ids are printed in QR codes) |
| F-04 | High | Legacy (pre-RC) certificates may now show "Not a NULP certificate", because the page only checks the RC registry |
| F-15 | Medium | No CI or Sonar ran on portal PR #759, and neither PR has a formal approval |
| F-18 | Medium | In 2 of 7 fresh Chrome sessions the verify request hung for more than 40 s. The page has no time limit, so it stays on "Verifying certificate" with no error. Suggest a client-side timeout that falls back to "Certificate not checked" |
| F-19 | Low | Harmless JS error on the verify page ("Error while fetching guest user") |
| F-13 | Low | A second search path, `/api/rc/certificate/v1/search`, skips the owner check in code, but the API gateway blocks it (401) |

## 7. Needed to complete testing

1. **DevOps:** check why no certificate is issued for completed courses on dev (certificate-generation job).
2. **Dev:** fix DEF-002 and DEF-003, then QA retests TC-021, TC-024 and TC-025.
3. **QA, once a certificate exists:** download from Profile → Certificates, check the QR is small and decodes to `/certs/<id>?t=1`, compare page against PDF, download one old-template certificate (no QR expected).
4. **QA lead:** real phone-camera scan (Android and iPhone) of the QR shown on screen and on a printout.
5. **Test data:** a revoked certificate, a second learner account (for "download someone else's certificate", F-03), and an admin/mentor account for regression.
6. **Manual check:** Hindi labels via the language switcher (automation could not switch language).
7. **Product/security:** decide on F-03, F-04 and the prod exposure in F-16.
