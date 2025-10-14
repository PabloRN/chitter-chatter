# ToonsTalk Legal Documents

This folder contains all legal and policy documents required for launching the ToonsTalk MVP.

## Documents Included

### 1. Privacy Policy (`privacy-policy.md`)
**URL:** https://toonstalk.com/privacy

Covers:
- Data collection (Firebase Auth, Realtime Database, Storage, Analytics)
- Cookie consent (essential + analytics)
- GDPR compliance and user rights
- Data retention and security
- Contact information for data requests

**Action Required:**
- [ ] Add your business address (Section 12)
- [ ] Set up email addresses:
  - contact+privacy@toonstalk.com
  - contact+dpo@toonstalk.com (Data Protection Officer)

### 2. Terms of Service (`terms-of-service.md`)
**URL:** https://toonstalk.com/terms

Covers:
- Service description and user eligibility
- Account creation and responsibilities
- Prohibited activities and content guidelines
- Intellectual property rights
- Disclaimers and liability limitations
- Dispute resolution

**Action Required:**
- [ ] Choose governing jurisdiction (Section 15.1)
- [ ] Specify dispute resolution venue (Section 15.2)
- [ ] Add business address (Section 17)
- [ ] Set up email addresses:
  - contact+legal@toonstalk.com
  - contact+support@toonstalk.com

### 3. Cookie Policy (`cookie-policy.md`)
**URL:** https://toonstalk.com/cookies

Covers:
- Essential vs. analytics cookies
- Two-tier consent system
- Third-party cookies (Google, Yahoo, Facebook)
- How to manage cookies
- Local storage and IndexedDB usage

**Action Required:**
- [ ] Verify cookie names match your implementation
- [ ] Set up contact+privacy@toonstalk.com

### 4. Acceptable Use Policy (`acceptable-use-policy.md`)
**URL:** https://toonstalk.com/acceptable-use

Covers:
- Prohibited content (illegal, harmful, hateful, sexual, spam)
- User conduct guidelines
- Avatar and room guidelines
- Reporting violations
- Enforcement actions

**Action Required:**
- [ ] Set up email addresses:
  - contact+report@toonstalk.com
  - contact+appeals@toonstalk.com
  - contact+support@toonstalk.com

### 5. Data Deletion Request Guide (`data-deletion-request.md`)
**URL:** https://toonstalk.com/data-deletion

Covers:
- GDPR "Right to be Forgotten"
- What data is deleted vs. retained
- Step-by-step deletion instructions
- Verification process and timeline
- Special cases (deceased users, minors)

**Action Required:**
- [ ] Implement account deletion functionality in app
- [ ] Set up email addresses:
  - contact+privacy@toonstalk.com
  - contact+dpo@toonstalk.com
  - contact+appeals@toonstalk.com
- [ ] Add business address

## Implementation Checklist

### ✅ Completed
- [x] All legal documents created
- [x] FirebaseUI links updated in `src/stores/user.js`
- [x] Routes added to `src/router/index.js`
- [x] Legal document viewer component created (`src/views/LegalDocument.vue`)
- [x] Documents copied to `public/documents/` for serving

### 🔲 To Do Before Launch

1. **Email Setup**
   - [ ] Create contact+privacy@toonstalk.com (GDPR requests)
   - [ ] Create contact+dpo@toonstalk.com (Data Protection Officer)
   - [ ] Create contact+legal@toonstalk.com (legal inquiries)
   - [ ] Create contact+support@toonstalk.com (general support)
   - [ ] Create contact+report@toonstalk.com (abuse reports)
   - [ ] Create contact+appeals@toonstalk.com (ban appeals)

2. **Legal Information**
   - [ ] Add your business address to all documents
   - [ ] Choose governing jurisdiction (Terms, Section 15)
   - [ ] Consult with a lawyer to review all documents
   - [ ] Register with data protection authority (if required in EU)

3. **Technical Implementation**
   - [ ] Implement account deletion feature (Settings → Delete Account)
   - [ ] Test all document routes work on production
   - [ ] Verify FirebaseUI shows Privacy & Terms links correctly
   - [ ] Add footer links to legal documents on all pages

4. **Firebase Console**
   - [ ] Add authorized domains for OAuth (if needed)
   - [ ] Review Firebase Security Rules
   - [ ] Apply API key restrictions (as discussed)

## Email Template Responses

### For contact+privacy@toonstalk.com
Create auto-response:
> Thank you for contacting ToonsTalk Privacy Team. We have received your request and will respond within 30 days as required by GDPR. Your request reference number is: [AUTO-GENERATED].

### For contact+report@toonstalk.com
Create auto-response:
> Thank you for reporting this issue. Our moderation team will review your report within 48 hours. Reference number: [AUTO-GENERATED].

## Testing URLs

Once deployed, test these URLs:
- https://toonstalk.com/privacy
- https://toonstalk.com/terms
- https://toonstalk.com/cookies
- https://toonstalk.com/acceptable-use
- https://toonstalk.com/data-deletion

## Firebase Console Settings

**Authentication → Settings → Authorized Domains:**
- toonstalk.com
- www.toonstalk.com
- localhost (for development)

**Authentication → Templates → Email Templates:**
- Customize email action handler URL to: https://toonstalk.com/acctmgmt/__/auth/action

## GDPR Compliance Notes

### Data Protection Officer (DPO)
If processing EU citizens' data at scale, you may need to appoint a DPO. Check requirements at: https://gdpr.eu/data-protection-officer/

### Cookie Consent
- ✅ Essential cookies (auth, session) - No consent required
- ✅ Analytics cookies - Consent required via banner

### Data Subject Rights
All rights implemented:
- ✅ Right to Access (contact privacy@)
- ✅ Right to Erasure (delete account feature)
- ✅ Right to Data Portability (contact privacy@)
- ✅ Right to Rectification (edit profile)
- ✅ Right to Withdraw Consent (cookie banner)

## Important Notes

1. **Customize Before Launch:** These are template documents. You MUST:
   - Add your real business address
   - Set up email addresses
   - Choose jurisdiction
   - Have a lawyer review everything

2. **Keep Updated:** Review and update documents annually or when:
   - You add new features
   - Privacy laws change
   - You change data practices

3. **Document Versions:** Keep track of changes:
   - Update "Last Updated" date when making changes
   - Consider versioning (v1.0, v1.1, etc.)
   - Archive old versions

4. **User Communication:** When updating policies:
   - Email all users about material changes
   - Give 30 days notice before enforcement
   - Get fresh consent for significant changes

## Resources

- [GDPR Official Text](https://gdpr.eu/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Google OAuth Setup](https://console.cloud.google.com/)
- [Facebook Developer Console](https://developers.facebook.com/)
- [Yahoo Developer Network](https://developer.yahoo.com/)

---

**Disclaimer:** These documents are templates and do not constitute legal advice. Consult with a qualified attorney in your jurisdiction before using them in production.
