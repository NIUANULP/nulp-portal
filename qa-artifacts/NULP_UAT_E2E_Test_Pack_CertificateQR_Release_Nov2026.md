# NULP Certificate QR Verification Release — UAT End-to-End Test Pack

> Markdown conversion of `NULP_UAT_E2E_Test_Pack_CertificateQR_Release_Nov2026.xlsx`. Every sheet, row and cell is reproduced. In the workbook, counts and percentages are live Excel formulas; here they show their values at conversion time (all cases *Not Run*), and the formula behind each computed column is listed under its table. Line breaks inside cells are shown as `<br>`.

## Contents

1. [Test Plan](#test-plan)
2. [Summary](#summary)
3. [Roles & Test Accounts](#roles--test-accounts)
4. [Test Data](#test-data)
5. [Requirements](#requirements)
6. [Test Scenarios](#test-scenarios)
7. [Test Cases](#test-cases)
8. [RTM](#rtm)
9. [Findings & Risks](#findings--risks)
10. [Defect Log](#defect-log)


---

## Test Plan

**NULP Certificate QR Verification Release - UAT End-to-End Test Plan**


### Document control

| Item | Detail |
|---|---|
| Release / branches | nulp-portal: release-4.10.0_RC12-elite-discussion-prod-newdev, tip d302e03 (PR #759 feat/certificate-qr-verification) vs base release-4.10.0_RC12-elite-discussion-prod d13ab57  \|  nulp-elite-ui: prod-main-disussion-newdev, tip 8ec204fb (PR #1163 feat/certificate-short-qr) vs base prod-main-discussion 0669dbcd  \|  nulp-HomePage: main d22cdbb (no delta since 25-Jun-2026) |
| Commits in scope | Portal: 4e85a1c public verify API; faf4450 page redesign; 6d0131b hide header/footer; 0564152 drop signed-data fallback; a320fb3 login for RC download/search.  Elite UI: 50be21f2 short verification QR on certificates; dde2d984 await PDF save, off-screen render. |
| Environments | UAT frontend/portal: &lt;UAT_URL&gt; (TBC by DevOps - not in repositories)  \|  Verify API: &lt;UAT_URL&gt;/certificate/public/v1/verify/:id  \|  Public page: &lt;UAT_URL&gt;/certs/:id?t=1  \|  Production reference: https://nulp.niua.org |
| Prepared by / date | Tekdi Technologies QA - 02-Nov-2026 |
| Status | Draft for client review |

### Scope, approach and criteria

| Item | Detail |
|---|---|
| Objective | Confirm that certificates can be verified publicly by QR without login, that the verification page is accurate in every state, that RC certificate APIs no longer leak data to logged-out or other users, that downloaded certificates carry a scannable short QR, and that nothing around certificates, events, profile and login regresses. |
| In scope | Public verify API and rate limit; /certs verification page (states, i18n, copy link, chrome hiding, SEO); RC download/search access rules; Elite UI certificate PDF + short QR; regression of My Certificates, event certificates, Angular profile certificates, access-code form, certificate configuration, login, HomePage; build and env readiness. |
| Out of scope | Certificate issuance engine and RC registry internals; NodeBB discussion forum; learnathon; mobile app (unless it consumes rc/certificate/v1/search - see F-06); performance/load beyond the rate-limit cases. |
| Approach | Code-diff based risk analysis of the two release PRs; API tests with curl/Postman; UI tests on devices in TD-08; negative and security cases for every access change; regression on all callers found by code search (eventDetails.js, certificate.js, profile-page.component.ts). |
| Entry criteria | 1. Build deployed from a commit containing d302e03, 8ec204fb AND d13ab57/4ca680d/b796e45 (TC-081).  2. TC-084 smoke (verify API 200) passes.  3. Accounts TD-01 and certificates TD-02/TD-03 ready.  4. &lt;UAT_URL&gt; confirmed. |
| Suspension criteria | Verify API returns 500 for a known active certificate; login broken; build not from agreed commit; &gt;30% of Critical cases Blocked. |
| Exit criteria | 100% Critical and High cases executed; 0 open Critical/High defects (or client-signed deviation); F-01 resolved; decisions recorded for F-02, F-03, F-04, F-08. |

### Usage

| Item | Detail |
|---|---|
| How to use this workbook | Edit only: Test Cases columns M-Q (Status from dropdown, Actual result, Defect ID, Tested by, Date); Defect Log rows; Status/notes columns in Roles &amp; Test Accounts, Test Data and Findings &amp; Risks. Summary, RTM and all counts are formulas - do not overwrite. Defect Log row 2 is an EXAMPLE row showing the expected format. |
| Sheets | Summary \| Roles &amp; Test Accounts \| Test Data \| Requirements \| Test Scenarios \| Test Cases \| RTM \| Findings &amp; Risks \| Defect Log |

---

## Summary

**UAT Execution Summary - NULP certificate QR verification release**

| Module | Total | Pass | Fail | Blocked | Not Run | N/A | Executed % | Pass % |
|---|---|---|---|---|---|---|---|---|
| Verify API | 12 | 0 | 0 | 0 | 12 | 0 | 0 | 0 |
| Privacy &amp; SEO | 5 | 0 | 0 | 0 | 5 | 0 | 0 | 0 |
| Verify Page | 18 | 0 | 0 | 0 | 18 | 0 | 0 | 0 |
| Rate Limit | 5 | 0 | 0 | 0 | 5 | 0 | 0 | 0 |
| Regression | 12 | 0 | 0 | 0 | 12 | 0 | 0 | 0 |
| Page Chrome | 6 | 0 | 0 | 0 | 6 | 0 | 0 | 0 |
| i18n | 3 | 0 | 0 | 0 | 3 | 0 | 0 | 0 |
| RC API Security | 10 | 0 | 0 | 0 | 10 | 0 | 0 | 0 |
| Certificate Download | 11 | 0 | 0 | 0 | 11 | 0 | 0 | 0 |
| Deployment | 5 | 0 | 0 | 0 | 5 | 0 | 0 | 0 |
| E2E | 2 | 0 | 0 | 0 | 2 | 0 | 0 | 0 |
| TOTAL | 89 | 0 | 0 | 0 | 89 | 0 | 0 | 0 |

### By priority

| Priority | Total | Pass | Fail | Blocked | Not Run | N/A | Executed % | Pass % |
|---|---|---|---|---|---|---|---|---|
| Critical | 19 | 0 | 0 | 0 | 19 | 0 | 0 | 0 |
| High | 26 | 0 | 0 | 0 | 26 | 0 | 0 | 0 |
| Medium | 32 | 0 | 0 | 0 | 32 | 0 | 0 | 0 |
| Low | 12 | 0 | 0 | 0 | 12 | 0 | 0 | 0 |

### By type

| Type | Total | Pass | Fail | Blocked | Not Run | N/A | Executed % | Pass % |
|---|---|---|---|---|---|---|---|---|
| Positive | 28 | 0 | 0 | 0 | 28 | 0 | 0 | 0 |
| Negative | 8 | 0 | 0 | 0 | 8 | 0 | 0 | 0 |
| Edge | 25 | 0 | 0 | 0 | 25 | 0 | 0 | 0 |
| Security | 13 | 0 | 0 | 0 | 13 | 0 | 0 | 0 |
| Regression | 15 | 0 | 0 | 0 | 15 | 0 | 0 | 0 |

### Defects & risks

| Metric | Value |
|---|---|
| Open defects (Defect Log, excl. example) | 0 |
| Open Critical/High findings | 6 |
| Requirements not covered | 0 |

**Formulas used**

- Total: `=COUNTIF('Test Cases'!D:D,<Module>)` (priority block uses column K, type block uses column L)
- Pass / Fail / Blocked / Not Run / N/A: `=COUNTIFS('Test Cases'!D:D,<Module>,'Test Cases'!M:M,"<Status>")`
- Executed %: `=IF(Total=0,0,(Total-NotRun)/Total)`
- Pass %: `=IF((Total-NotRun-N/A)=0,0,Pass/(Total-NotRun-N/A))`
- TOTAL row: `=SUM()` of each column above it
- Open defects: `=COUNTIF('Defect Log'!M3:M200,"Open")` (excludes example row 2)
- Open Critical/High findings: `=COUNTIFS('Findings & Risks'!B:B,"Critical",'Findings & Risks'!G:G,"Open")+COUNTIFS(..."High"...)`
- Requirements not covered: `=COUNTIF(RTM!K:K,"Not covered")`

---

## Roles & Test Accounts

| # | Group | Role ID | Role / User | Login Method | URL | Test Account (Email) | Password / Key | Used To Test | Code Reference | Linked TC Role Label | # Test Cases | Provided By | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | A. Public | 1 | ANONYMOUS VERIFIER | None (no login) | &lt;UAT_URL&gt;/certs/&lt;id&gt;?t=1 | n/a | n/a | QR scan / verify page, revoked &amp; invalid states, rate-limit UX, i18n | certificateVerifyRoute.js (no auth) | Anonymous Verifier | 27 | QA | Ready |
| 2 | B. Learners | 2 | LEARNER A (certificate owner) | Password | &lt;UAT_URL&gt; | uat.nulp.learnera@mailinator.com | Share via secure channel - do not record here | Owns active + revoked RC certificates and a certreg v2 certificate; downloads; own search | whitelistApis.js ROLE.PUBLIC + OWNER_CHECK | Learner A | 22 | Client / Dev team | Requested |
| 3 | B. Learners | 3 | LEARNER B (no certificates) | Password | &lt;UAT_URL&gt; | uat.nulp.learnerb@mailinator.com | Share via secure channel - do not record here | IDOR / cross-user search &amp; download (negative), empty state | apiWhiteList.js __session__userId | Learner B | 4 | Client / Dev team | Requested |
| 4 | B. Learners | 4 | EVENT LEARNER | Password | &lt;UAT_URL&gt; | uat.nulp.eventlearner@mailinator.com | Share via secure channel - do not record here | Event certificate issue + duplicate check | eventDetails.js checkCertificateAlreadyIssued() | Event Learner | 2 | Client / Dev team | Requested |
| 5 | C. Staff | 5 | COURSE MENTOR / CREATOR | Password | &lt;UAT_URL&gt; | uat.nulp.mentor@mailinator.com | Share via secure channel - do not record here | /certs/configure pages, template names | certificate configure module | Course Mentor | 2 | Client / Dev team | Requested |
| 6 | C. Staff | 6 | ORG ADMIN | Password | &lt;UAT_URL&gt; | uat.nulp.orgadmin@mailinator.com | Share via secure channel - do not record here | No admin bypass on RC search; revoke certificate (with dev) | apiWhiteList.js (no __adminCheck on search) | Org Admin | 2 | Client / Dev team | Requested |
| 7 | D. Technical | 7 | API TESTER (QA) | curl / Postman | Verify API base: &lt;UAT_URL&gt;/certificate/public/v1/verify/ | - | - | Status codes, headers, rate limit, injection | certificateVerifyHelper.js | API Tester | 24 | QA | Ready |
| 8 | D. Technical | 8 | DEVOPS | Pipeline / kubectl | Jenkins / cluster | - | - | Build on Node 20, env vars, outage simulation, logs | build.sh, environmentVariablesHelper.js | DevOps | 6 | QA | Ready |

**Formulas behind computed columns** (shown for the first data row; same pattern on every row)

- `# Test Cases` (`L2`): `=IF(K2="","",COUNTIF('Test Cases'!E:E,"*"&K2&"*"))`

---

## Test Data

| Data ID | Data Set | Values | Used By | Owner | Status | Created IDs / Notes |
|---|---|---|---|---|---|---|
| TD-01 | Accounts | Roles 2-6 in 'Roles &amp; Test Accounts'. Learner A: &gt;=1 RC course certificate (ACTIVE), 1 certreg v2 certificate, 1 long-name course. Learner B: zero certificates. | All login-based cases | Dev team | Not ready |  |
| TD-02 | Active RC certificate | osid of Learner A's ACTIVE RC certificate (record here once issued). Template with image.qr-code. | Verify API/page, download, E2E | QA + Dev | Not ready |  |
| TD-03 | Revoked RC certificate | TD-03: status REVOKED. TD-03b: status blank. TD-03c: status 'active' (lower case). Dev to set in RC on UAT only. | TS-03 | Dev team | Not ready |  |
| TD-04 | Unknown well-formed id | 1-00000000-0000-0000-0000-000000000000 | TS-03 | QA | Ready |  |
| TD-05 | Malformed ids | 'abc1234' (7); 8-char 'abcd1234'; 64-char and 65-char alphanumerics; abc_def!@#xyz; &lt;script&gt;alert(1)&lt;/script&gt;; 1-abc' OR '1'='1; ..%2F..%2Fetc%2Fpasswd | TS-02 | QA | Ready |  |
| TD-06 | Pre-release QR links | TD-06: RC certificate issued before release with long data=/t= QR. TD-06b: legacy certreg v2 certificate with QR from production history (ask client for a real sample). | TS-09 | Client / Dev | Not ready |  |
| TD-07 | Certificate templates | TD-07a: SVG with &lt;image class='qr-code'&gt;; TD-07b: &lt;image id='QrCode'&gt;; TD-07c: no QR image element. | TS-12 | Dev / Mentor | Not ready |  |
| TD-08 | Devices &amp; browsers | Android 14 Chrome + Google Lens; iPhone iOS 17 Safari + Camera; Windows Chrome/Edge/Firefox latest; macOS Safari; one http (non-secure) context for clipboard fallback. | Page, QR scanning | QA | Ready |  |
| TD-09 | Load script | Bash/Postman runner sending 61-200 requests/min; X-Forwarded-For variants 10.0.0.1-10.0.0.100. | TS-04 | QA | Ready |  |
| TD-10 | Event with certificate | Published event with certificate template attached to batch; Event Learner registered and attended. | TS-15 | Dev / Creator | Not ready |  |
| TD-11 | Languages | English (default), Hindi; one other configured language without verify keys. | TS-08 | QA | Ready |  |

**Status dropdown:** Ready, Not ready, In progress.

---

## Requirements

| Req ID | Area | Requirement | Type | Priority | Source (Commits / Code References) |
|---|---|---|---|---|---|
| REQ-01 | Release change | Public certificate verification API GET /certificate/public/v1/verify/:id - no login; reads the RC record with the portal's own token and returns verified, status and certificate {id, recipientName, trainingName, trainingType, issuerName, issuedOn}. | Change | Critical | nulp-portal 4e85a1c; src/app/helpers/certificateVerifyHelper.js verifyCertificate(); routes/certificateVerifyRoute.js; server.js:311 |
| REQ-02 | Release change | Verify API rejects malformed certificate ids (pattern ^[A-Za-z0-9-]{8,64}$) with HTTP 400 CLIENT_ERROR before calling the registry. | Change | High | certificateVerifyHelper.js CERTIFICATE_ID_PATTERN, fetchCertificateRecord() |
| REQ-03 | Release change | Verify API outcomes: unknown id -&gt; 404 RESOURCE_NOT_FOUND {verified:false}; revoked/non-active -&gt; 200 {verified:false,status} with NO holder details; registry outage/auth error or 200-UNSUCCESSFUL body -&gt; 500 SERVER_ERROR (never reported as fake). Empty status treated as active. | Change | Critical | certificateVerifyHelper.js isNotFoundError(), isActive(), verifyCertificate() |
| REQ-04 | Release change | Verify API rate-limited to 60 requests / 60 s per client IP (first X-Forwarded-For hop, else req.ip); excess -&gt; 429 TOO_MANY_REQUESTS + Retry-After header. In-memory map pruned above 10,000 entries. | Change | High | certificateVerifyHelper.js rateLimit(), getClientIp(); RATE_LIMIT_MAX_REQUESTS=60 |
| REQ-05 | Release change | Certificate pages and the verify API are kept out of search engines: X-Robots-Tag 'noindex, nofollow' on API; &lt;meta name=robots&gt; added on page init and removed on destroy. | Change | Medium | certificateVerifyHelper.js noIndex(); certificate-details.component.ts ngOnInit/ngOnDestroy |
| REQ-06 | Release change | Redesigned public verification page /certs/:uuid (QR 't' or 'data' query): states loading / verified / invalid / revoked / error / too-many; shows recipient, training, issuer, issued on, certificate ID, 'Checked on' timestamp; Try again; Copy verification link (/certs/&lt;id&gt;?t=1) with clipboard + textarea fallback. | Change | High | nulp-portal faf4450; certificate-details.component.ts/.html/.scss verifyRCCertificate(), verifyState, copyVerificationLink() |
| REQ-07 | Release change | App top bar, header and footer hidden ONLY on the QR verification URL (/certs/&lt;id&gt; with t or data query); access-code form (no query) and /certs/configure/... keep app chrome. Decided from window URL so chrome never flashes before lazy route loads. | Change | High | nulp-portal 6d0131b; app.component.ts isCertificateVerifyUrl(); app.component.html |
| REQ-08 | Release change | Verification page text translated via resource bundles frmelmnts.cert.imsg.verify.* (en, hi) with English constant fallback; {time} placeholder substitution. | Change | Medium | resourcebundles/json/en.json, hi.json; certificate-details.component.ts verifyLabel(), CERT_VERIFY_TEXT |
| REQ-09 | Release change | Signed-data (CsCertificateService / certreg) verification fallback removed: both 'data' and 't' QR flavours are verified only via the public RC API using the id in the path. | Change | High | nulp-portal 0564152; certificate-details.component.ts validateCertificate()/validateTCertificate() -&gt; verifyRCCertificate() |
| REQ-10 | Security change | /learner/rc/certificate/v1/download/:id now requires a logged-in session (ROLE_CHECK PUBLIC). Previously open. | Change | Critical | nulp-portal a320fb3; helpers/whitelistApis.js:692 |
| REQ-11 | Security change | /learner/rc/certificate/v1/search now requires login AND OWNER_CHECK: body.filters.recipient.id.eq must equal session userId (strict match, no admin bypass). | Change | Critical | nulp-portal a320fb3; whitelistApis.js:902; apiWhiteList.js __session__userId |
| REQ-12 | Release change | Elite UI: downloaded certificate PDF gets a short verification QR for &lt;origin&gt;/certs/&lt;osid&gt;?t=1 (qrcode ^1.5.4, ECC M, 400px) replacing image.qr-code / image#QrCode; falls back to template QR if generation fails or no QR element. | Change | Critical | nulp-elite-ui 50be21f2; packages/nulp_elite/src/pages/profile/certificate.js replaceQrWithShortLink(); package.json |
| REQ-13 | Release change | Elite UI: certificate SVG rendered off-screen for PDF capture; html2pdf save() awaited before container is hidden (no blank/partial PDFs, no visual flash). | Change | High | nulp-elite-ui dde2d984; certificate.js handleDownloadPdf(), getCertificate() |
| REQ-14 | Regression | Elite UI 'My Certificates' still lists certreg v2 course certificates and RC certificates (latest first) and downloads both. | Regression | High | certificate.js fetchData() CERT_SEARCH + CERTIF_SEARCH |
| REQ-15 | Regression | Event details: certificate-already-issued detection (RC search by own userId) and custom event certificate generation still work under the new OWNER_CHECK. | Regression | High | nulp-elite-ui pages/events/eventDetails.js checkCertificateAlreadyIssued(), generateCertificate() |
| REQ-16 | Regression | Portal (Angular) profile page certificate list/download via CsCertificateService (rcApiPath /learner/rc/${schemaName}/v1) still works. | Regression | High | plugins/profile/components/profile-page/profile-page.component.ts:279,344 |
| REQ-17 | Regression | Access-code certificate verification form and mentor certificate configuration pages unchanged. | Regression | Medium | certificate-details.component.ts (no-query path); /certs/configure routes |
| REQ-18 | Regression | Smoke: login/logout (incl. SSO), NULP HomePage header/navigation (nulp-HomePage main d22cdbb, no delta since 25-Jun-2026), course consumption. | Regression | High | nulp-HomePage main; portal auth |
| REQ-19 | Deployment | Portal build for this release must run on Node 20 server binaries; prod-only commits d13ab57, 4ca680d, b796e45 (build.sh, src/app/yarn.lock) must be in the deployed build. | Deployment | Critical | git log prod-newdev..prod: build.sh, src/app/yarn.lock |
| REQ-20 | Deployment | Portal env sunbird_api_auth_token and sunbird_learner_player_url configured; public verify depends on them. | Deployment | Critical | environmentVariablesHelper.js:22,28 (LEARNER_URL, PORTAL_API_AUTH_TOKEN) |

---

## Test Scenarios

| Scenario ID | Req ID | Scenario Description | Actor / Role | Type (Positive / Negative / Edge / Integration) | # Test Cases |
|---|---|---|---|---|---|
| TS-01 | REQ-01 | Anyone (no login) verifies a genuine active certificate via API / QR page | Anonymous Verifier, API Tester | Positive | 6 |
| TS-02 | REQ-02 | Malformed, tampered or injected certificate ids are rejected safely | Anonymous Verifier, API Tester | Negative + Security | 5 |
| TS-03 | REQ-03 | Unknown, revoked, empty-status and registry-failure outcomes are reported correctly | Anonymous Verifier, API Tester, DevOps | Negative + Edge | 9 |
| TS-04 | REQ-04 | Verify API rate limiting per client | API Tester | Security + Edge | 7 |
| TS-05 | REQ-05 | Certificate pages and API excluded from search engines | API Tester, Anonymous Verifier | Security | 3 |
| TS-06 | REQ-06 | Verification page states, details, copy-link and responsiveness | Anonymous Verifier | Positive + Edge | 8 |
| TS-07 | REQ-07 | App chrome hidden only on the QR verification URL | Anonymous Verifier, Course Mentor, Learner A | Positive + Negative | 6 |
| TS-08 | REQ-08 | Verification page in English / Hindi with fallback | Anonymous Verifier | Positive + Edge | 3 |
| TS-09 | REQ-09 | Previously printed QR codes (data= / legacy) after fallback removal | Anonymous Verifier | Regression + Edge | 3 |
| TS-10 | REQ-10 | RC certificate download needs login | Learner A, Learner B, API Tester | Security | 3 |
| TS-11 | REQ-11 | RC certificate search restricted to own certificates | Learner A, Learner B, Org Admin, API Tester | Security + Negative | 8 |
| TS-12 | REQ-12 | Short verification QR stamped on downloaded certificate PDF | Learner A | Positive + Integration | 6 |
| TS-13 | REQ-13 | Certificate PDF generation quality and timing | Learner A | Positive + Edge | 4 |
| TS-14 | REQ-14 | Elite UI My Certificates regression | Learner A, Learner B | Regression | 2 |
| TS-15 | REQ-15 | Event certificate issue / duplicate check regression | Event Learner | Regression | 3 |
| TS-16 | REQ-16 | Angular portal profile certificates regression | Learner A | Regression | 1 |
| TS-17 | REQ-17 | Access-code verification and certificate configuration regression | Anonymous Verifier, Course Mentor | Regression | 2 |
| TS-18 | REQ-18 | Platform smoke - login, HomePage, course consumption | Learner A | Regression | 3 |
| TS-19 | REQ-19 | Release build and deployment integrity | DevOps | Integration | 3 |
| TS-20 | REQ-20 | Environment configuration for registry token | DevOps, API Tester | Integration + Edge | 2 |
| TS-21 | REQ-01 | End-to-end: earn, download, print, scan, revoke | Learner A, Anonymous Verifier, Org Admin | Integration | 2 |

**Formulas behind computed columns** (shown for the first data row; same pattern on every row)

- `# Test Cases` (`F2`): `=COUNTIF('Test Cases'!B:B,A2)`

---

## Test Cases

| TC ID | Scenario ID | Req ID | Module | Role | Title | Pre-condition | Test Data | Steps | Expected Result | Priority | Type | Status | Actual Result | Defect ID | Tested By | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-001 | TS-01 | REQ-01 | Verify API | API Tester | Verify API returns full details for an active certificate | RC certificate exists with status ACTIVE (TD-02) | TD-02 | 1. Without any cookie run: curl -i &lt;UAT_URL&gt;/certificate/public/v1/verify/&lt;TD-02 osid&gt;<br>2. Inspect status, headers and JSON body | HTTP 200; id='api.certificate.public.verify'; params.status='successful'; responseCode='OK'; result.verified=true; result.certificate has id, recipientName, trainingName, trainingType, issuerName, issuedOn. | Critical | Positive | Not Run |  |  |  |  |
| TC-002 | TS-01 | REQ-01 | Verify API | API Tester | Verify API works with no session (incognito / no cookies) | Logged out; incognito window | TD-02 | 1. Open incognito browser<br>2. Load &lt;UAT_URL&gt;/certificate/public/v1/verify/&lt;TD-02 osid&gt; directly<br>3. Repeat with curl and no Cookie header | 200 JSON returned in both cases; no 401/403, no redirect to login page. | Critical | Positive | Not Run |  |  |  |  |
| TC-003 | TS-01 | REQ-01 | Verify API | API Tester | Verify API values match RC record and printed certificate | TD-02 PDF downloaded by Learner A | TD-02 | 1. Call verify API for TD-02<br>2. Compare recipientName, trainingName, issuerName, issuedOn with the PDF and with RC record (dev assist) | All four values match; signed-data values (credentialSubject.*, issuer.name, issuanceDate) take precedence over plain record fields where both exist. | High | Positive | Not Run |  |  |  |  |
| TC-004 | TS-01 | REQ-01 | Privacy &amp; SEO | API Tester | Verify API exposes no extra personal data | - | TD-02 | 1. Call verify API for TD-02<br>2. Search body for email, phone, userId, recipient.id, _osSignedData, signature, template URL | Only the 6 certificate fields + verified/status are returned; none of the listed fields present. | High | Security | Not Run |  |  |  |  |
| TC-005 | TS-01 | REQ-01 | Verify Page | Anonymous Verifier | Scan QR of active certificate on mobile - verified page without login | TD-02 certificate printed/displayed; phone not logged in to NULP | TD-02, TD-08 | 1. Scan the certificate QR with Android camera / Google Lens<br>2. Open the link<br>3. Observe page | Page opens without login; seal + 'Genuine NULP certificate'; Awarded to, for completing, Issued on, Issued by, Certificate ID and 'Checked on &lt;date time&gt;' shown; 'Compare these details...' notice shown. | Critical | Positive | Not Run |  |  |  |  |
| TC-006 | TS-01 | REQ-01 | Verify Page | Anonymous Verifier | Open verification link directly on desktop browsers | - | TD-02, TD-08 | 1. Open &lt;UAT_URL&gt;/certs/&lt;TD-02 osid&gt;?t=1 in Chrome, Firefox, Edge, Safari | Verified state renders identically in each browser; no console errors. | High | Positive | Not Run |  |  |  |  |
| TC-007 | TS-02 | REQ-02 | Verify API | API Tester | Id shorter than 8 characters rejected with 400 | - | TD-05 ('abc1234') | 1. curl -i &lt;UAT_URL&gt;/certificate/public/v1/verify/abc1234 | HTTP 400; responseCode='CLIENT_ERROR'; params.errmsg='Invalid certificate id'; no registry call in server log. | High | Negative | Not Run |  |  |  |  |
| TC-008 | TS-02 | REQ-02 | Verify API | API Tester | Id longer than 64 characters rejected with 400 | - | TD-05 (65-char id) | 1. Call verify API with a 65-character alphanumeric id | HTTP 400 CLIENT_ERROR. | Medium | Edge | Not Run |  |  |  |  |
| TC-009 | TS-02 | REQ-02 | Verify API | API Tester | Boundary ids of exactly 8 and 64 characters pass validation | - | TD-05 (8-char, 64-char unknown ids) | 1. Call verify API with 8-char unknown id<br>2. Call with 64-char unknown id | Both pass the pattern and return 404 RESOURCE_NOT_FOUND (not 400). | Medium | Edge | Not Run |  |  |  |  |
| TC-010 | TS-02 | REQ-02 | Verify API | API Tester | Special characters / injection payloads in id | - | TD-05 (injection set) | 1. Call &lt;UAT_URL&gt;/certificate/public/v1/verify/&lt;payload&gt; for: abc_def!@#xyz, &lt;script&gt;alert(1)&lt;/script&gt; (URL-encoded), 1-abc' OR '1'='1, ..%2F..%2Fetc%2Fpasswd<br>2. Open the same payloads in &lt;UAT_URL&gt;/certs/&lt;payload&gt;?t=1 | API returns 400 (or 404 for unmatched route) for each; page shows 'Not a NULP certificate'; no script executes; no stack trace or internal URL leaked. | High | Security | Not Run |  |  |  |  |
| TC-011 | TS-02 | REQ-02 | Verify Page | Anonymous Verifier | Tampered QR (one character changed) shows not-a-NULP-certificate | - | TD-02 with one char changed | 1. Open &lt;UAT_URL&gt;/certs/&lt;TD-02 osid with last char changed&gt;?t=1 | Invalid state: 'Not a NULP certificate' + 'Do not accept it...' text; no Try again button; no holder details. | High | Negative | Not Run |  |  |  |  |
| TC-012 | TS-03 | REQ-03 | Verify API | API Tester | Unknown well-formed id returns 404 verified=false | - | TD-04 | 1. curl -i &lt;UAT_URL&gt;/certificate/public/v1/verify/&lt;TD-04&gt; | HTTP 404; responseCode='RESOURCE_NOT_FOUND'; result={verified:false}; errmsg 'Certificate not found'. | High | Negative | Not Run |  |  |  |  |
| TC-013 | TS-03 | REQ-03 | Verify Page | Anonymous Verifier | Revoked certificate shows 'Certificate revoked' | TD-03 status REVOKED in RC | TD-03 | 1. Open &lt;UAT_URL&gt;/certs/&lt;TD-03 osid&gt;?t=1<br>2. Call &lt;UAT_URL&gt;/certificate/public/v1/verify/&lt;TD-03 osid&gt; | Page: 'Certificate revoked' + 'NULP issued this certificate but has since revoked it'. API: HTTP 200, verified=false, status='REVOKED', no certificate object. | Critical | Negative | Not Run |  |  |  |  |
| TC-014 | TS-03 | REQ-03 | Privacy &amp; SEO | API Tester | Revoked certificate response hides holder details | TD-03 | TD-03 | 1. Open revoked page with DevTools Network tab<br>2. Inspect API response and page DOM | Holder name, training name, issuer and dates do not appear in response or DOM. | High | Security | Not Run |  |  |  |  |
| TC-015 | TS-03 | REQ-03 | Verify Page | DevOps | Registry outage shows 'Certificate not checked' (not fake) | DevOps makes RC unreachable or sets invalid sunbird_api_auth_token on UAT pod | TD-02 | 1. Break RC connectivity (coordinated)<br>2. Open &lt;UAT_URL&gt;/certs/&lt;TD-02 osid&gt;?t=1<br>3. Call API | API HTTP 500 SERVER_ERROR 'Unable to verify certificate right now' (within ~20 s timeout). Page: 'Certificate not checked' + 'Try again' button; NEVER 'Not a NULP certificate'. Server log has 'registry read failed'. | Critical | Edge | Not Run |  |  |  |  |
| TC-016 | TS-03 | REQ-03 | Verify Page | Anonymous Verifier | Try again recovers after outage | Continuation of previous case; RC restored | TD-02 | 1. With error state displayed, restore RC<br>2. Click 'Try again' | Loader shows, then verified state with details; error flags cleared. | Medium | Edge | Not Run |  |  |  |  |
| TC-017 | TS-03 | REQ-03 | Verify API | API Tester | Registry 200-UNSUCCESSFUL body handled | Dev assist: stub/mocked RC response | Mock bodies | 1. Stub RC to return HTTP 200 {params:{errmsg:'Internal error'}} (no osid)<br>2. Stub RC to return HTTP 200 {params:{errmsg:'Invalid id'}} | First -&gt; 500 SERVER_ERROR; second -&gt; 404 RESOURCE_NOT_FOUND. | Medium | Edge | Not Run |  |  |  |  |
| TC-018 | TS-03 | REQ-03 | Verify API | API Tester | Record with empty status is treated as verified | Dev assist: RC record with blank status (TD-03b) | TD-03b | 1. Call verify API for TD-03b | verified=true per code. Business owner to confirm this rule (Findings F-08); record decision in Actual result. | Medium | Edge | Not Run |  |  |  |  |
| TC-019 | TS-03 | REQ-03 | Verify API | API Tester | Status comparison is case-insensitive | Record with status 'active' (lower case) | TD-03c | 1. Call verify API | verified=true. | Low | Edge | Not Run |  |  |  |  |
| TC-020 | TS-03 | REQ-03 | Verify API | DevOps | Scan events logged without personal data | Access to portal logs | TD-02, TD-03, TD-04 | 1. Verify TD-02, TD-03, TD-04<br>2. Check portal logs | One 'certificate public verify: scanned' entry per call with certificateId and result (VERIFIED / REVOKED / RESOURCE_NOT_FOUND); no names logged. | Low | Positive | Not Run |  |  |  |  |
| TC-021 | TS-04 | REQ-04 | Rate Limit | API Tester | 61st request in one minute is throttled with Retry-After | Single client IP; fresh minute | TD-09 | 1. for i in $(seq 1 61); do curl -s -o /dev/null -w '%{http_code}\n' &lt;UAT_URL&gt;/certificate/public/v1/verify/&lt;TD-02&gt;; done<br>2. Inspect last response headers | Requests 1-60 return 200; request 61 returns 429 responseCode='TOO_MANY_REQUESTS' with Retry-After header (1-60 s). | High | Security | Not Run |  |  |  |  |
| TC-022 | TS-04 | REQ-04 | Rate Limit | API Tester | Limit resets after the window | Continuation of previous case | TD-09 | 1. Wait for Retry-After seconds<br>2. Call API again | HTTP 200. | Medium | Edge | Not Run |  |  |  |  |
| TC-023 | TS-04 | REQ-04 | Verify Page | Anonymous Verifier | Page shows 'too many checks' message on 429 | Client currently throttled | TD-09 | 1. While throttled open &lt;UAT_URL&gt;/certs/&lt;TD-02&gt;?t=1 | Error state with 'Too many checks from your network. Wait a minute, then try again.' and Try again button; not 'Not a NULP certificate'. | High | Negative | Not Run |  |  |  |  |
| TC-024 | TS-04 | REQ-04 | Rate Limit | API Tester | Rotating X-Forwarded-For cannot bypass the limit | - | TD-09 (XFF variants) | 1. Send 100 requests in 60 s, each with a different 'X-Forwarded-For: 10.0.0.&lt;n&gt;' header<br>2. Count 429s | Requirement: limit cannot be bypassed by a client-supplied header (some 429s expected). Code reads first XFF hop - likely FAILS; record result and link to F-02. | High | Security | Not Run |  |  |  |  |
| TC-025 | TS-04 | REQ-04 | Rate Limit | API Tester | Effective limit with multiple portal pods | Know pod/replica count (DevOps) | TD-09 | 1. Send 200 requests in 60 s from one IP through the load balancer<br>2. Count 200 vs 429 | Record number of successful calls. If &gt; 60, limit is per pod (in-memory) - link to F-02. | Medium | Edge | Not Run |  |  |  |  |
| TC-026 | TS-04 | REQ-04 | Rate Limit | API Tester | Users behind shared NAT share one quota | Two devices on same office Wi-Fi | TD-08 | 1. Exhaust quota from device 1<br>2. Open verify page on device 2 | Device 2 also sees 429 message (expected behaviour - document for helpdesk). | Low | Edge | Not Run |  |  |  |  |
| TC-027 | TS-04 | REQ-04 | Regression | API Tester | Rate limiter not applied to other portal routes | Quota exhausted for IP | - | 1. While throttled on verify API, open home page, course pages and other APIs | Other routes unaffected (no 429). | Low | Regression | Not Run |  |  |  |  |
| TC-028 | TS-05 | REQ-05 | Privacy &amp; SEO | API Tester | X-Robots-Tag on all verify API responses | - | TD-02, TD-04, TD-05 | 1. curl -I verify API for 200, 400, 404 and 429 cases | Every response carries 'X-Robots-Tag: noindex, nofollow'. | Medium | Security | Not Run |  |  |  |  |
| TC-029 | TS-05 | REQ-05 | Privacy &amp; SEO | Anonymous Verifier | Robots meta tag present on verification page | - | TD-02 | 1. Open verify page<br>2. Inspect &lt;head&gt; | &lt;meta name="robots" content="noindex, nofollow"&gt; present. | Medium | Security | Not Run |  |  |  |  |
| TC-030 | TS-05 | REQ-05 | Privacy &amp; SEO | Learner A | Robots meta tag removed after leaving certificate page | Logged in | TD-02 | 1. Open /certs/&lt;id&gt; (access-code form) in SPA<br>2. Navigate via in-app link to Home / Explore<br>3. Inspect &lt;head&gt; | robots meta removed on other pages (no site-wide noindex leak). | Medium | Edge | Not Run |  |  |  |  |
| TC-031 | TS-06 | REQ-06 | Verify Page | Anonymous Verifier | Loading state while verification is in progress | DevTools throttling 'Slow 3G' | TD-02 | 1. Open verify page with throttling | 'Verifying certificate' / 'Checking this certificate against NULP's records.' shown until response. | Low | Positive | Not Run |  |  |  |  |
| TC-032 | TS-06 | REQ-06 | Verify Page | Anonymous Verifier | Date formats for Issued on and Checked on | - | TD-02 | 1. Open verify page<br>2. Note dates | Issued on 'DD MMM YYYY' (e.g. 14 Oct 2026); Checked on 'DD MMM YYYY, h:mm A' in device local time. | Medium | Positive | Not Run |  |  |  |  |
| TC-033 | TS-06 | REQ-06 | Verify Page | Anonymous Verifier | Certificate ID shown equals id in URL | - | TD-02 | 1. Open verify page<br>2. Compare displayed Certificate ID with URL | Identical values. | Medium | Positive | Not Run |  |  |  |  |
| TC-034 | TS-06 | REQ-06 | Verify Page | Anonymous Verifier | Copy verification link (clipboard API) | HTTPS, Chrome | TD-02 | 1. Open via long QR link (data= or t=&lt;long&gt;)<br>2. Click 'Copy verification link'<br>3. Paste into notepad | Clipboard = &lt;origin&gt;/certs/&lt;id&gt;?t=1 (short, no data query); button shows 'Link copied' for ~2.5 s then resets. | Medium | Positive | Not Run |  |  |  |  |
| TC-035 | TS-06 | REQ-06 | Verify Page | Anonymous Verifier | Copy link fallback when clipboard API unavailable | Older browser or clipboard permission denied | TD-02 | 1. Deny clipboard permission (or use browser without navigator.clipboard)<br>2. Click Copy verification link | Link still copied via fallback; 'Link copied' shown; no error. | Low | Edge | Not Run |  |  |  |  |
| TC-036 | TS-06 | REQ-06 | Verify Page | Anonymous Verifier | Copied short link verifies on another device | Copied link from previous case | TD-02 | 1. Open copied link on a different device/browser | Verified state with same details. | Medium | Positive | Not Run |  |  |  |  |
| TC-037 | TS-06 | REQ-06 | Verify Page | Anonymous Verifier | Responsive layout on mobile, tablet, desktop | - | TD-02, TD-08 | 1. Check page at 360px, 768px, 1366px widths<br>2. Check NIUA/NULP logo | No horizontal scroll or overlapping text; logo renders; long names wrap. | Medium | Positive | Not Run |  |  |  |  |
| TC-038 | TS-06 | REQ-06 | Verify Page | Anonymous Verifier | Basic accessibility of verification page | Screen reader (NVDA/TalkBack) | TD-02 | 1. Tab through page<br>2. Use screen reader | Logo alt 'NIUA and National Urban Learning Platform (NULP) home'; Try again / Copy reachable by keyboard with visible focus; state title announced. | Low | Positive | Not Run |  |  |  |  |
| TC-039 | TS-07 | REQ-07 | Page Chrome | Anonymous Verifier | No header/footer/top bar on QR verify URL, including hard refresh | - | TD-02 | 1. Open &lt;UAT_URL&gt;/certs/&lt;id&gt;?t=1<br>2. Hard refresh (Ctrl+Shift+R) and watch first paint | Top bar, app header and footer never render (no flash before lazy route loads). | High | Positive | Not Run |  |  |  |  |
| TC-040 | TS-07 | REQ-07 | Page Chrome | Anonymous Verifier | No app chrome on data= QR URL | - | TD-06 | 1. Open &lt;UAT_URL&gt;/certs/&lt;id&gt;?data=&lt;value&gt; | App chrome hidden. | Medium | Positive | Not Run |  |  |  |  |
| TC-041 | TS-07 | REQ-07 | Page Chrome | Anonymous Verifier | Access-code form (no query) keeps header and footer | - | TD-02 | 1. Open &lt;UAT_URL&gt;/certs/&lt;id&gt; (no query) | Header/footer visible (guest footer rules unchanged); access-code form shown. | High | Negative | Not Run |  |  |  |  |
| TC-042 | TS-07 | REQ-07 | Page Chrome | Course Mentor | Certificate configure pages keep header | Mentor logged in; course with batch | TD-01 | 1. Course &gt; Batch &gt; Add/Edit certificate (/certs/configure/...) | Header and navigation visible; pages function normally. | High | Regression | Not Run |  |  |  |  |
| TC-043 | TS-07 | REQ-07 | Page Chrome | Learner A | Chrome restored after navigating away from verify page | Logged in | TD-02 | 1. Open verify URL in same tab as an open session<br>2. Navigate to /home via address bar or in-app link | Header/footer reappear on destination page. | Medium | Edge | Not Run |  |  |  |  |
| TC-044 | TS-07 | REQ-07 | Page Chrome | Learner A | Logged-in user opening verify link | Learner A logged in | TD-02 | 1. While logged in, open someone else's QR verify link | Same public page without chrome; session remains active afterwards. | Medium | Edge | Not Run |  |  |  |  |
| TC-045 | TS-08 | REQ-08 | i18n | Anonymous Verifier | Hindi labels for all verification states | Language switched to Hindi (or ?lang=hi as supported) | TD-02, TD-03, TD-04, TD-11 | 1. Switch language to Hindi<br>2. Open verified, revoked, invalid and error pages | All labels in Hindi (e.g. 'NULP का असली प्रमाण-पत्र', 'प्रमाण-पत्र रद्द किया गया'); no raw keys like frmelmnts.cert... | Medium | Positive | Not Run |  |  |  |  |
| TC-046 | TS-08 | REQ-08 | i18n | Anonymous Verifier | {time} placeholder substituted in Hindi | Hindi | TD-02 | 1. Open verified page in Hindi | '&lt;date time&gt; को जाँचा गया' - no literal {time}. | Low | Edge | Not Run |  |  |  |  |
| TC-047 | TS-08 | REQ-08 | i18n | Anonymous Verifier | Fallback to English for languages without translation | Language without cert.imsg.verify keys | TD-02 | 1. Switch to a language other than en/hi<br>2. Open verified page | English text shown; no blank labels or keys. | Low | Edge | Not Run |  |  |  |  |
| TC-048 | TS-09 | REQ-09 | Verify Page | Anonymous Verifier | QR printed before release with long data= link still verifies | RC certificate issued before release (old long QR) | TD-06 | 1. Scan an old printed RC certificate QR | Verified via id in path; details correct. | High | Regression | Not Run |  |  |  |  |
| TC-049 | TS-09 | REQ-09 | Verify Page | Anonymous Verifier | Legacy certreg (non-RC) certificate QR after fallback removal | Legacy certreg v2 certificate with QR (from production history) | TD-06b | 1. Scan / open the legacy certificate QR link | Genuine legacy certificate must NOT be reported as 'Not a NULP certificate'. Code now checks RC only - high risk of FAIL; link to F-04. | Critical | Regression | Not Run |  |  |  |  |
| TC-050 | TS-09 | REQ-09 | Verify Page | Anonymous Verifier | data= value with spaces / + characters | - | TD-06 | 1. Open /certs/&lt;id&gt;?data=a b+c%2B | Page loads, verifies by id; no JS error. | Low | Edge | Not Run |  |  |  |  |
| TC-051 | TS-10 | REQ-10 | RC API Security | API Tester | Logged-out download is blocked | No session | TD-02 | 1. curl -i &lt;UAT_URL&gt;/learner/rc/certificate/v1/download/&lt;TD-02&gt; -H 'Accept: image/svg+xml' | Request rejected by whitelist (401/403 'Unauthorized'); no SVG returned. | Critical | Security | Not Run |  |  |  |  |
| TC-052 | TS-10 | REQ-10 | Certificate Download | Learner A | Owner downloads own certificate | Learner A logged in | TD-02 | 1. Profile &gt; My Certificates &gt; Download on TD-02 | Download API 200; PDF saved. | Critical | Positive | Not Run |  |  |  |  |
| TC-053 | TS-10 | REQ-10 | RC API Security | Learner B | Another logged-in user downloads Learner A's certificate by osid | Learner B logged in; knows TD-02 osid (printed on QR) | TD-02 | 1. As Learner B call /learner/rc/certificate/v1/download/&lt;TD-02&gt; with session cookie | Expected (security): 403. Current code only checks login - likely 200; record and link to F-03. | High | Security | Not Run |  |  |  |  |
| TC-054 | TS-11 | REQ-11 | RC API Security | Learner A | Owner searches own RC certificates | Learner A logged in | TD-01 | 1. POST /learner/rc/certificate/v1/search {filters:{recipient:{id:{eq:&lt;A userId&gt;}}}} | 200 with Learner A's certificates only. | Critical | Positive | Not Run |  |  |  |  |
| TC-055 | TS-11 | REQ-11 | RC API Security | Learner B | Search for another user's certificates rejected | Learner B logged in | TD-01 | 1. As Learner B POST search with recipient.id.eq = Learner A userId | Rejected (OWNER_CHECK mismatch, 401/403); no data. | Critical | Security | Not Run |  |  |  |  |
| TC-056 | TS-11 | REQ-11 | RC API Security | API Tester | Logged-out search rejected even with empty filters | No session | - | 1. POST search with {filters:{}} and with no body | Rejected by ROLE_CHECK; empty-id owner match cannot pass. | Critical | Security | Not Run |  |  |  |  |
| TC-057 | TS-11 | REQ-11 | RC API Security | Learner A | Search with other filter shapes rejected | Learner A logged in | - | 1. POST search {filters:{training:{id:{eq:&lt;courseId&gt;}}}}<br>2. POST search {filters:{recipient:{id:{in:[&lt;A&gt;,&lt;B&gt;]}}}} | Both rejected (recipient.id.eq missing/mismatch). | High | Negative | Not Run |  |  |  |  |
| TC-058 | TS-11 | REQ-11 | RC API Security | Org Admin | Org/Sys admin cannot search other users' RC certificates | Org Admin logged in | TD-01 | 1. Search for Learner A certificates as Org Admin<br>2. Open any admin/report screen that lists learner certificates | API rejected (no admin bypass). Confirm no admin screen depends on it; any broken screen -&gt; defect (F-06). | Medium | Negative | Not Run |  |  |  |  |
| TC-059 | TS-11 | REQ-11 | RC API Security | Learner A | Expired session during certificate search | Session expired / cookie deleted | TD-01 | 1. Open My Certificates after session expiry | API rejected; UI shows 'Failed to fetch data' toast or login prompt; no infinite loop. | Medium | Edge | Not Run |  |  |  |  |
| TC-060 | TS-12 | REQ-12 | Certificate Download | Learner A | Downloaded PDF carries short QR to /certs/&lt;osid&gt;?t=1 | Template with image.qr-code (TD-07a) | TD-02, TD-07 | 1. Download TD-02 from My Certificates<br>2. Scan QR in PDF with phone | QR decodes to &lt;origin&gt;/certs/&lt;osid&gt;?t=1 exactly; opens verified page. | Critical | Positive | Not Run |  |  |  |  |
| TC-061 | TS-12 | REQ-12 | Certificate Download | Learner A | Template using image#QrCode also replaced | Template TD-07b | TD-07 | 1. Download certificate issued with TD-07b template<br>2. Decode QR | Short link QR present. | High | Positive | Not Run |  |  |  |  |
| TC-062 | TS-12 | REQ-12 | Certificate Download | Learner A | Template without QR image downloads unchanged | Template TD-07c | TD-07 | 1. Download certificate with TD-07c | PDF generated; content unchanged; no error toast. | Medium | Edge | Not Run |  |  |  |  |
| TC-063 | TS-12 | REQ-12 | Certificate Download | Learner A | QR generation failure falls back to template QR | Dev assist: force QRCode.toDataURL error (e.g. local override) | TD-02 | 1. Download with forced failure<br>2. Check console and PDF | Console 'Failed to generate short QR, using template QR'; PDF downloads with original QR. | Low | Edge | Not Run |  |  |  |  |
| TC-064 | TS-12 | REQ-12 | Certificate Download | Learner A | QR origin when downloaded from a non-canonical host | Access UI via alternate host (staging alias, www vs non-www) | TD-02 | 1. Download PDF from alternate host<br>2. Decode QR | Record host encoded. Should be canonical production URL - link to F-07. | Medium | Edge | Not Run |  |  |  |  |
| TC-065 | TS-12 | REQ-12 | Certificate Download | Learner A | Short QR scannable on print | PDF printed A4/Letter landscape | TD-02, TD-08 | 1. Print PDF<br>2. Scan with Android camera and iPhone camera at 30 cm | Scans within 3 s on both phones; noticeably less dense than pre-release QR. | Medium | Positive | Not Run |  |  |  |  |
| TC-066 | TS-13 | REQ-13 | Certificate Download | Learner A | No visual flash of certificate SVG during download | - | TD-02 | 1. Click Download and watch the page | Certificate SVG never appears on screen; no layout shift. | Medium | Positive | Not Run |  |  |  |  |
| TC-067 | TS-13 | REQ-13 | Certificate Download | Learner A | PDF content complete (not blank / cropped) | - | TD-02 | 1. Download<br>2. Open PDF | Full certificate on one landscape page; not blank; QR, signatures and logos present. | High | Positive | Not Run |  |  |  |  |
| TC-068 | TS-13 | REQ-13 | Certificate Download | Learner A | Double-click Download | - | TD-02 | 1. Double-click Download quickly | At most two valid PDFs; no blank PDF; container hidden afterwards; page usable. | Medium | Edge | Not Run |  |  |  |  |
| TC-069 | TS-13 | REQ-13 | Certificate Download | Learner A | Very long recipient / training names | Certificate with 60+ char name and course title | TD-01 | 1. Download certificate<br>2. Open verify page for it | PDF text not clipped beyond template behaviour; verify page wraps text. | Low | Edge | Not Run |  |  |  |  |
| TC-070 | TS-14 | REQ-14 | Regression | Learner A | My Certificates lists course and RC certificates latest first | Learner A has certreg v2 + RC certificates | TD-01 | 1. Open Profile &gt; Certificates | Both lists load; sorted newest first; downloads work for both types. | High | Regression | Not Run |  |  |  |  |
| TC-071 | TS-14 | REQ-14 | Regression | Learner B | User with no certificates | Learner B has none | TD-01 | 1. Open Profile &gt; Certificates | Empty state shown; no error toast. | Medium | Regression | Not Run |  |  |  |  |
| TC-072 | TS-15 | REQ-15 | Regression | Event Learner | Already-issued event certificate detected | Event learner already has certificate for TD-10 event | TD-10 | 1. Open event details for TD-10<br>2. Check Network for rc/certificate/v1/search | Search returns 200 (owner match); certificate shown as issued; no generate button / no new certificate created. | High | Regression | Not Run |  |  |  |  |
| TC-073 | TS-15 | REQ-15 | Regression | Event Learner | First-time event certificate generated once | Learner attended TD-10, no certificate yet | TD-10 | 1. Generate certificate<br>2. Reload page and try again | Exactly one RC certificate created; second attempt blocked. Note: checkCertificateAlreadyIssued swallows errors - if search fails, duplicates possible (F-05). | High | Regression | Not Run |  |  |  |  |
| TC-074 | TS-15 | REQ-15 | Regression | Anonymous Verifier | Guest opens event details | Logged out | TD-10 | 1. Open public event page logged out | Page loads; no repeated failing calls or error toasts; certificate generation not offered. | Medium | Edge | Not Run |  |  |  |  |
| TC-075 | TS-16 | REQ-16 | Regression | Learner A | Angular portal profile certificates list and download | Learner A logged in on classic portal profile | TD-01 | 1. Open portal profile page (Angular)<br>2. Open certificates section<br>3. Download one RC certificate | List loads (CsCertificateService.fetchCertificates passes OWNER_CHECK) and download works. | High | Regression | Not Run |  |  |  |  |
| TC-076 | TS-17 | REQ-17 | Regression | Anonymous Verifier | Access-code certificate verification still works | Certificate with access code | TD-02 | 1. Open /certs/&lt;id&gt; (no query)<br>2. Enter valid code, then invalid code | Valid code shows certificate; invalid code shows existing error message. | High | Regression | Not Run |  |  |  |  |
| TC-077 | TS-17 | REQ-17 | Regression | Course Mentor | Certificate template configuration and template names | Mentor; course batch | TD-01 | 1. Configure certificate on a batch<br>2. Check template cards | Template names shown under cards; save/attach works. | Medium | Regression | Not Run |  |  |  |  |
| TC-078 | TS-18 | REQ-18 | Regression | Learner A | Login and logout (password and SSO) | Accounts per TD-01 | TD-01 | 1. Login with password<br>2. Logout<br>3. Login via SSO (incl. iGOT if enabled) | Login lands on home; logout clears session; no redirect loop. | Critical | Regression | Not Run |  |  |  |  |
| TC-079 | TS-18 | REQ-18 | Regression | Anonymous Verifier | NULP HomePage header and navigation | - | - | 1. Open home page<br>2. Switch nav items; resize to mobile | Header renders; nav switching works (HomePage d22cdbb). | Medium | Regression | Not Run |  |  |  |  |
| TC-080 | TS-18 | REQ-18 | Regression | Learner A | Course enrol, play and progress | Published course with batch | TD-01 | 1. Enrol<br>2. Play content<br>3. Check progress | Enrolment succeeds; progress updates. | Medium | Regression | Not Run |  |  |  |  |
| TC-081 | TS-19 | REQ-19 | Deployment | DevOps | Deployed portal build contains prod-only Node 20 commits | Access to build pipeline | - | 1. git merge-base --is-ancestor d13ab57 &lt;deployed commit&gt;; repeat for 4ca680d, b796e45<br>2. Compare src/app/yarn.lock canvas version | All three commits are ancestors of the deployed commit; canvas 2.11.2 in lockfile. If not -&gt; release blocker F-01. | Critical | Regression | Not Run |  |  |  |  |
| TC-082 | TS-19 | REQ-19 | Deployment | DevOps | Portal server builds and starts on Node 20 | build.sh with SERVER_NODE_VERSION=20.0.0 | - | 1. Run build.sh<br>2. Start container<br>3. Hit /health and the verify API | Build succeeds; canvas binary loads; server healthy; verify route registered. | Critical | Positive | Not Run |  |  |  |  |
| TC-083 | TS-19 | REQ-19 | Deployment | DevOps | Elite UI build includes qrcode dependency | - | - | 1. yarn install --frozen-lockfile<br>2. Build nulp_elite<br>3. Load certificate page | Install succeeds; bundle loads without 'Cannot find module qrcode'. | High | Positive | Not Run |  |  |  |  |
| TC-084 | TS-20 | REQ-20 | Deployment | DevOps | Registry token and learner URL configured on UAT | - | - | 1. Check sunbird_api_auth_token and sunbird_learner_player_url on portal pods<br>2. Call verify API for TD-02 | Both set; API returns 200 (entry criterion smoke). | Critical | Positive | Not Run |  |  |  |  |
| TC-085 | TS-20 | REQ-20 | Deployment | API Tester | Expired / rotated registry token | Dev assist: token rotated | TD-02 | 1. Call verify API with stale token on pod | 500 SERVER_ERROR, page 'Certificate not checked'; never 404. | Medium | Edge | Not Run |  |  |  |  |
| TC-086 | TS-21 | REQ-01 | E2E | Learner A | Earn, download, print and scan certificate end-to-end | Course with certificate rule; Learner A not yet complete | TD-01, TD-08 | 1. Learner A completes course<br>2. Wait for certificate issue<br>3. Download PDF from My Certificates<br>4. Print<br>5. Anonymous phone scans QR | Verified page shows exactly the details on the printed certificate. | Critical | Positive | Not Run |  |  |  |  |
| TC-087 | TS-21 | REQ-03 | E2E | Org Admin | Revoke issued certificate and rescan | Previous case done; admin/dev can revoke in RC | TD-02 | 1. Revoke the certificate<br>2. Rescan the same printed QR | 'Certificate revoked' shown; no holder details. | High | Positive | Not Run |  |  |  |  |
| TC-088 | TS-11 | REQ-11 | RC API Security | Learner B | Alternate path /api/rc/certificate/v1/search cannot read another user's certificates | Learner B logged in; Learner A userId known | TD-01 | 1. As Learner B, with session cookie, POST &lt;UAT_URL&gt;/api/rc/certificate/v1/search {filters:{recipient:{id:{eq:&lt;Learner A userId&gt;}}}}<br>2. Repeat with {filters:{}} | Both rejected (401/403), same as the /learner/rc/certificate/v1/search path; no certificates returned. Code: whitelistApis.js:1766 has ROLE_CHECK only (no OWNER_CHECK) for this path; /api/* proxy is registered in server.js:291, before the global isAllowed() at :331. Likely FAIL - link to F-13. | Critical | Security | Not Run |  |  |  |  |
| TC-089 | TS-11 | REQ-11 | RC API Security | API Tester | Logged-out call to /api/rc/certificate/v1/search is rejected | No session / no cookies | TD-01 | 1. curl -i -X POST &lt;UAT_URL&gt;/api/rc/certificate/v1/search -H 'Content-Type: application/json' -d '{"filters":{}}'<br>2. Repeat with recipient.id.eq = Learner A userId | Rejected by whitelist (401/403); no certificate data. Code: whitelistApis.js:1766 has ROLE_CHECK only (no OWNER_CHECK) for this path; /api/* proxy is registered in server.js:291, before the global isAllowed() at :331. Likely FAIL - link to F-13. | Critical | Security | Not Run |  |  |  |  |

**Editable columns:** M Status (dropdown: Pass, Fail, Blocked, Not Run, N/A), N Actual Result, O Defect ID, P Tested By, Q Date. K Priority dropdown: Critical, High, Medium, Low. Conditional colours on Status: Pass = green, Fail = red, Blocked = yellow.

---

## RTM

| Req ID | Requirement | Priority | Scenarios | Test Cases | # TCs | Pass | Fail | Blocked | Not Run | Coverage | Result |
|---|---|---|---|---|---|---|---|---|---|---|---|
| REQ-01 | Public certificate verification API GET /certificate/public/v1/verify/:id - no login; reads the RC record with the portal's own token and returns verified, status and certificate {id, recipientName, trainingName, trainingType, issuerName, issuedOn}. | Critical | TS-01, TS-21 | TC-001 .. TC-006, TC-086 | 7 | 0 | 0 | 0 | 7 | Covered | In progress |
| REQ-02 | Verify API rejects malformed certificate ids (pattern ^[A-Za-z0-9-]{8,64}$) with HTTP 400 CLIENT_ERROR before calling the registry. | High | TS-02 | TC-007 .. TC-011 | 5 | 0 | 0 | 0 | 5 | Covered | In progress |
| REQ-03 | Verify API outcomes: unknown id -&gt; 404 RESOURCE_NOT_FOUND {verified:false}; revoked/non-active -&gt; 200 {verified:false,status} with NO holder details; registry outage/auth error or 200-UNSUCCESSFUL body -&gt; 500 SERVER_ERROR (never reported as fake). Empty status treated as active. | Critical | TS-03 | TC-012 .. TC-020, TC-087 | 10 | 0 | 0 | 0 | 10 | Covered | In progress |
| REQ-04 | Verify API rate-limited to 60 requests / 60 s per client IP (first X-Forwarded-For hop, else req.ip); excess -&gt; 429 TOO_MANY_REQUESTS + Retry-After header. In-memory map pruned above 10,000 entries. | High | TS-04 | TC-021 .. TC-027 | 7 | 0 | 0 | 0 | 7 | Covered | In progress |
| REQ-05 | Certificate pages and the verify API are kept out of search engines: X-Robots-Tag 'noindex, nofollow' on API; &lt;meta name=robots&gt; added on page init and removed on destroy. | Medium | TS-05 | TC-028 .. TC-030 | 3 | 0 | 0 | 0 | 3 | Covered | In progress |
| REQ-06 | Redesigned public verification page /certs/:uuid (QR 't' or 'data' query): states loading / verified / invalid / revoked / error / too-many; shows recipient, training, issuer, issued on, certificate ID, 'Checked on' timestamp; Try again; Copy verification link (/certs/&lt;id&gt;?t=1) with clipboard + textarea fallback. | High | TS-06 | TC-031 .. TC-038 | 8 | 0 | 0 | 0 | 8 | Covered | In progress |
| REQ-07 | App top bar, header and footer hidden ONLY on the QR verification URL (/certs/&lt;id&gt; with t or data query); access-code form (no query) and /certs/configure/... keep app chrome. Decided from window URL so chrome never flashes before lazy route loads. | High | TS-07 | TC-039 .. TC-044 | 6 | 0 | 0 | 0 | 6 | Covered | In progress |
| REQ-08 | Verification page text translated via resource bundles frmelmnts.cert.imsg.verify.* (en, hi) with English constant fallback; {time} placeholder substitution. | Medium | TS-08 | TC-045 .. TC-047 | 3 | 0 | 0 | 0 | 3 | Covered | In progress |
| REQ-09 | Signed-data (CsCertificateService / certreg) verification fallback removed: both 'data' and 't' QR flavours are verified only via the public RC API using the id in the path. | High | TS-09 | TC-048 .. TC-050 | 3 | 0 | 0 | 0 | 3 | Covered | In progress |
| REQ-10 | /learner/rc/certificate/v1/download/:id now requires a logged-in session (ROLE_CHECK PUBLIC). Previously open. | Critical | TS-10 | TC-051 .. TC-053 | 3 | 0 | 0 | 0 | 3 | Covered | In progress |
| REQ-11 | /learner/rc/certificate/v1/search now requires login AND OWNER_CHECK: body.filters.recipient.id.eq must equal session userId (strict match, no admin bypass). | Critical | TS-11 | TC-054 .. TC-059, TC-088 .. TC-089 | 8 | 0 | 0 | 0 | 8 | Covered | In progress |
| REQ-12 | Elite UI: downloaded certificate PDF gets a short verification QR for &lt;origin&gt;/certs/&lt;osid&gt;?t=1 (qrcode ^1.5.4, ECC M, 400px) replacing image.qr-code / image#QrCode; falls back to template QR if generation fails or no QR element. | Critical | TS-12 | TC-060 .. TC-065 | 6 | 0 | 0 | 0 | 6 | Covered | In progress |
| REQ-13 | Elite UI: certificate SVG rendered off-screen for PDF capture; html2pdf save() awaited before container is hidden (no blank/partial PDFs, no visual flash). | High | TS-13 | TC-066 .. TC-069 | 4 | 0 | 0 | 0 | 4 | Covered | In progress |
| REQ-14 | Elite UI 'My Certificates' still lists certreg v2 course certificates and RC certificates (latest first) and downloads both. | High | TS-14 | TC-070 .. TC-071 | 2 | 0 | 0 | 0 | 2 | Covered | In progress |
| REQ-15 | Event details: certificate-already-issued detection (RC search by own userId) and custom event certificate generation still work under the new OWNER_CHECK. | High | TS-15 | TC-072 .. TC-074 | 3 | 0 | 0 | 0 | 3 | Covered | In progress |
| REQ-16 | Portal (Angular) profile page certificate list/download via CsCertificateService (rcApiPath /learner/rc/${schemaName}/v1) still works. | High | TS-16 | TC-075 | 1 | 0 | 0 | 0 | 1 | Covered | In progress |
| REQ-17 | Access-code certificate verification form and mentor certificate configuration pages unchanged. | Medium | TS-17 | TC-076 .. TC-077 | 2 | 0 | 0 | 0 | 2 | Covered | In progress |
| REQ-18 | Smoke: login/logout (incl. SSO), NULP HomePage header/navigation (nulp-HomePage main d22cdbb, no delta since 25-Jun-2026), course consumption. | High | TS-18 | TC-078 .. TC-080 | 3 | 0 | 0 | 0 | 3 | Covered | In progress |
| REQ-19 | Portal build for this release must run on Node 20 server binaries; prod-only commits d13ab57, 4ca680d, b796e45 (build.sh, src/app/yarn.lock) must be in the deployed build. | Critical | TS-19 | TC-081 .. TC-083 | 3 | 0 | 0 | 0 | 3 | Covered | In progress |
| REQ-20 | Portal env sunbird_api_auth_token and sunbird_learner_player_url configured; public verify depends on them. | Critical | TS-20 | TC-084 .. TC-085 | 2 | 0 | 0 | 0 | 2 | Covered | In progress |

**Formulas behind computed columns** (shown for the first data row; same pattern on every row)

- `# TCs` (`F2`): `=COUNTIF('Test Cases'!C:C,A2)`
- `Pass` (`G2`): `=COUNTIFS('Test Cases'!C:C,A2,'Test Cases'!M:M,"Pass")`
- `Fail` (`H2`): `=COUNTIFS('Test Cases'!C:C,A2,'Test Cases'!M:M,"Fail")`
- `Blocked` (`I2`): `=COUNTIFS('Test Cases'!C:C,A2,'Test Cases'!M:M,"Blocked")`
- `Not Run` (`J2`): `=COUNTIFS('Test Cases'!C:C,A2,'Test Cases'!M:M,"Not Run")`
- `Coverage` (`K2`): `=IF(F2=0,"Not covered","Covered")`
- `Result` (`L2`): `=IF(F2=0,"-",IF(H2>0,"Fail",IF(I2>0,"Blocked",IF(J2>0,"In progress","Pass"))))`

---

## Findings & Risks

| ID | Severity | Category | Finding (Code &amp; Config Reality) | Action / Mitigation | Owner | Status |
|---|---|---|---|---|---|---|
| F-01 | Critical | Release blocker - deployment | prod branch has 3 commits not in release-4.10.0_RC12-elite-discussion-prod-newdev: d13ab57 (server canvas lockfile 2.11.2 for Node 20), 4ca680d, b796e45 (Player build-failure propagation, locked server deps) touching build.sh and src/app/yarn.lock. A build cut from the -newdev branch would regress the Node 20 build fix. | Merge prod back into -newdev (or build from the merged prod commit) before UAT deploy. TC-081 is the gate. | Dev / DevOps | Open |
| F-02 | High | Security | Verify API rate limiter keys on the FIRST X-Forwarded-For value, which the client controls; rotating that header bypasses the 60/min cap, re-opening name harvesting by id guessing. Limit is also in-memory per pod (N pods = N x 60) and resets on restart. | Derive client IP from the trusted proxy hop (Express 'trust proxy' with the ingress CIDR) and/or enforce limit_req at nginx/ingress; consider shared store (Redis). TC-024/025. | Dev / DevOps | Open |
| F-03 | High | Security / privacy | /learner/rc/certificate/v1/download/:id only requires login (ROLE_CHECK PUBLIC), no OWNER_CHECK. Certificate ids are printed in QR codes and copyable links, so any logged-in user can download anyone's full certificate SVG. | Add owner check (session userId vs certificate recipient.id) server-side, or accept risk explicitly (public page already shows name). TC-053. | Dev / Product | Open |
| F-04 | High | Functional regression | Signed-data fallback (CsCertificateService / certreg) removed (0564152). All QR scans now resolve only against RC by id. Genuine legacy certreg certificates (still listed via certreg/v2/certs/search in Elite UI) may now show 'Not a NULP certificate'. | Client to confirm whether legacy certreg certificates with QR are in circulation; if yes, keep a certreg lookup path. TC-049 with a real production sample. | Product / Dev | Open |
| F-05 | Medium | Functional risk | eventDetails.js checkCertificateAlreadyIssued() swallows errors. If the new OWNER_CHECK rejects (session expiry, userId mismatch), isCertificateIssued stays false and the learner may generate a duplicate event certificate. | Treat search failure as 'unknown' and block generation; add server-side uniqueness on (recipient.id, training.id). TC-073. | Dev | Open |
| F-06 | Medium | Integration risk | RC search OWNER_CHECK has no admin bypass. No admin caller found in nulp-elite-ui or portal client, but other consumers (mobile app, reports, NodeBB/learnathon integrations) were not inspected. CsLibInitializer also configures rcApiPath 'api/rc/certificate/v1' - confirm that path goes through the same whitelist. | Dev to list all consumers of rc/certificate/v1/search; confirm /api/ proxied path is whitelisted identically. TC-058. | Dev | Open |
| F-07 | Medium | Data integrity | Short QR encodes window.location.origin at download time. PDFs downloaded from staging, an IP, or www/non-www alias permanently carry that host. | Use a configured canonical base URL for the QR. TC-064. | Dev | Open |
| F-08 | Medium | Business rule | isActive() treats a missing/blank status as ACTIVE, so records without status verify as genuine. Front end shows 'revoked' for any non-empty non-ACTIVE status. | Product owner to confirm rule; TC-018 records decision. | Product | Open |
| F-09 | Medium | Entry criterion | Public verify depends on sunbird_api_auth_token and sunbird_learner_player_url (defaults to staging.open-sunbird.org if unset). Missing/expired token makes every scan show 'Certificate not checked'. | Smoke TC-084 before starting execution; suspend if it fails. | DevOps | Open |
| F-10 | Low | Template coverage | Templates without image.qr-code or image#QrCode keep the long, dense template QR. | Inventory production templates; TC-062. | Dev / Mentor | Open |
| F-11 | Info | Scope | nulp-HomePage main (d22cdbb) has no commits since 25-Jun-2026 - smoke only. nulp-elite-ui prod-only commits are merge commits with no content delta. | None. | QA | Closed |
| F-12 | Info | Environment | UAT/staging URLs are not in the repositories. &lt;UAT_URL&gt; is a placeholder throughout this pack. | DevOps to supply URLs; replace placeholder in Test Plan. | DevOps | Open |
| F-13 | High | Security | Second route to RC search skips the new OWNER_CHECK. whitelistApis.js:1766 whitelists /api/rc/certificate/v1/search with ROLE_CHECK PUBLIC only (unchanged by PR #759). In server.js the generic /api/* proxy (publicRoutes.js, registered at :291) is mounted before the global isAllowed() at :331 and, unlike /learner/*, does not call isAllowed() itself - so the whitelist may not run on /api/* at all. If reachable, any user (possibly logged out) can list anyone's certificates, defeating REQ-11. Not confirmed on dev: logged-out probe on 02-Nov-2026 timed out. | Dev to confirm reachability; apply ROLE_CHECK + OWNER_CHECK to /api/rc/certificate/v1/search (or block it at the portal) and make sure /api/* passes through the whitelist; extend apiWhiteListRcCertificate.spec.js. TC-088/089. | Dev | Open |
| F-14 | High | Entry criterion - environment | PRs not deployed on dev (https://devnulp.niua.org) as of 02-Nov-2026, checked 16:03 and 17:04 IST: verify API returns 403 'API WHITELIST Access is denied' (same as an unknown path); logged-out /learner/rc/certificate/v1/download and /search still reach RC; certificate-details chunk 34.90db97957acdf8152f51.js is old code (no verifyRCCertificate); /assets/images/nulp-niua-logo.jpeg redirects to /; bundle hashes (runtime.7328cee5, main.5d228635) unchanged between checks. Elite UI: 85 JS chunks scanned, no short-QR code found (likely not deployed). | DevOps to deploy portal (from a commit including F-01 prod commits) and Elite UI together, then QA runs smoke TC-084. Request sent to dev team on Slack. | DevOps | Open |
| F-15 | Medium | Process - quality gates | Portal PR #759: 0 check runs and 0 commit statuses - CI/SonarCloud did not run (.circleci/config.yml with sonar-scanner exists, but no recent portal PR reports checks, incl. #755/#756); no approving review before merge. Elite UI PR #1163: SonarCloud Quality Gate passed (0 new issues, 0 security hotspots) but 0.0% coverage on new code; PR-Agent 'no security concerns'; no approving review; no dependency vulnerability scan visible for new qrcode ^1.5.4. | Run Sonar on the portal release branch and share the gate result; security review of certificateVerifyHelper.js and whitelistApis.js changes; record formal approvals on both PRs; DevOps to fix CircleCI/Sonar integration for nulp-portal. | Dev / DevOps | Open |

**Status dropdown:** Open, In progress, Closed, Accepted.

---

## Defect Log

| Defect ID | TC ID | Module | Summary | Steps to reproduce | Expected | Actual | Severity | Priority | Environment | Browser | Screenshot / link | Status | Assigned to | Raised on | Fixed in build | Retest result |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DEF-001 | TC-024 | Rate Limit | EXAMPLE ROW - rate limit bypassed by rotating X-Forwarded-For | 1. Send 100 verify calls in 60 s<br>2. Vary X-Forwarded-For per call | Some calls return 429 | All 100 return 200 | High | P2 | &lt;UAT_URL&gt; | curl 8.5 | link | Example | Dev | 02-Nov-2026 |  |  |

**Status dropdown:** Open, In progress, Fixed, Retest, Closed, Rejected, Example. Row DEF-001 is an EXAMPLE showing the expected format; 40 blank rows follow in the workbook for logging defects.
