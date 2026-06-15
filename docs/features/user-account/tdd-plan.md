# User Account — TDD Plan

Implementation order and test specifications. Follow **Red → Green → Refactor** for each row.

## Vertical slice order

```text
Step 1  Value objects (EmailAddress, DisplayName, LgpdConsent, DeviceBindingDigest, PqcPublicKeyRef)
Step 2  Policies (SingleAccountPerDevice, EmailVerification)
Step 3  UserAccountRegistrationGuard
Step 4  UserAccount aggregate — registerNew, verifyEmail, requestErasure
Step 5  Domain events (no PII payloads)
Step 6  Shared Zod schemas (packages/shared)
Step 7  API handlers + integration tests
Step 8  PQC adapter (ML-DSA verify) + Redis abuse signal
Step 9  LGPD export/erasure handlers
```

---

## Step 1 — Value objects (`packages/domain`)

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 1.1 | `should_normalize_email_to_lowercase` | INV-U4 | unit |
| 1.2 | `should_reject_invalid_email_format` | — | unit |
| 1.3 | `should_reject_display_name_shorter_than_2_characters` | INV-U11 | unit |
| 1.4 | `should_reject_display_name_with_doxxing_pattern` | INV-A8, INV-U11 | unit |
| 1.5 | `should_reject_device_binding_digest_with_wrong_length` | INV-U8 | unit |
| 1.6 | `should_reject_lgpd_consent_without_terms_version` | INV-U5 | unit |
| 1.7 | `should_reject_lgpd_consent_with_outdated_privacy_version` | INV-U5 | unit |
| 1.8 | `should_accept_valid_pqc_public_key_ref_fingerprint` | INV-U6 | unit |
| 1.9 | `should_default_email_verification_state_to_pending` | INV-U2 | unit |

**Green:** VOs in `packages/domain/src/identity/value-objects/`.

---

## Step 2 — Policies

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 2.1 | `should_reject_registration_when_device_already_registered` | INV-U3 | unit |
| 2.2 | `should_allow_registration_when_device_digest_is_new` | INV-U3 | unit |
| 2.3 | `should_reject_expired_email_verification_token` | INV-U2 | unit |
| 2.4 | `should_accept_valid_email_verification_token_within_24h` | INV-U2 | unit |

**Green:** `single-account-per-device.policy.ts`, `email-verification.policy.ts`.

---

## Step 3 — Registration guard

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 3.1 | `should_reject_registration_without_valid_pqc_signature` | INV-U6 | unit |
| 3.2 | `should_reject_registration_when_email_already_used` | INV-U4 | unit |
| 3.3 | `should_reject_registration_without_lgpd_consent` | INV-U5 | unit |
| 3.4 | `should_pass_all_guards_for_valid_registration` | INV-U1–U6 | unit |

**Green:** `user-account-registration.guard.ts`.

---

## Step 4 — UserAccount aggregate

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 4.1 | `should_create_account_in_pending_verification_status` | INV-U2 | unit |
| 4.2 | `should_require_existing_contributor_id_on_register` | INV-U1 | unit |
| 4.3 | `should_activate_account_after_email_verification` | INV-U2 | unit |
| 4.4 | `should_reject_verification_when_already_active` | — | unit |
| 4.5 | `should_anonymize_email_on_erasure_request` | INV-U10, LGPD | unit |
| 4.6 | `should_set_status_deleted_on_erasure` | LGPD Art. 18 | unit |
| 4.7 | `should_preserve_show_identity_on_reports_default_false` | INV-A5 | unit |
| 4.8 | `should_increment_version_on_state_change` | — | unit |

**Green:** `user-account.entity.ts`.

---

## Step 5 — Domain events

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 5.1 | `should_not_include_email_in_user_account_created_payload` | INV-U9 | unit |
| 5.2 | `should_not_include_device_digest_in_event_payload` | INV-U9 | unit |
| 5.3 | `should_emit_email_verified_event_on_activation` | — | unit |

**Green:** `user-account-created.event.ts`, `email-verified.event.ts`.

---

## Step 6 — Shared schemas (`packages/shared`)

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 6.1 | `should_reject_register_payload_with_extra_fields` | security strict | unit |
| 6.2 | `should_reject_register_payload_without_lgpd_consent` | INV-U5 | unit |
| 6.3 | `should_reject_register_payload_with_raw_ip_field` | INV-U7 | unit |

---

## Step 7 — API integration

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 7.1 | `should_return_409_when_device_already_has_account` | INV-U3 | integration |
| 7.2 | `should_return_409_when_email_already_used` | INV-U4 | integration |
| 7.3 | `should_return_403_for_public_mode_without_verified_email` | INV-U2 | integration |
| 7.4 | `should_not_persist_ip_address_on_registration` | INV-U7 | integration |
| 7.5 | `should_return_401_without_session_on_register` | tenant | integration |

---

## Security phase gate mapping

| Phase gate item | Covered by |
|-----------------|------------|
| Input validation | Step 6 Zod strict |
| AuthN | Session required for register |
| PQC device proof | Step 3, 8 |
| LGPD erasure | Step 4.5, 9 |
| No PII in events | Step 5 |
| Rate limiting | Step 7 infra |

---

## Definition of done (domain slice — Steps 1–5)

- [ ] All unit tests green in `packages/domain`
- [ ] `npm run validate` passes
- [ ] Docs module complete under `docs/features/user-account/`
- [ ] Exports in `packages/domain/src/index.ts`
- [ ] No IP/device columns in DB sketch
- [ ] Events audited for PII absence

---

## Suggested first RED test

```typescript
// user-account.entity.spec.ts
it('should_create_account_in_pending_verification_status', () => {
  const { account } = UserAccount.registerNew({ /* ... */ });
  expect(account.status).toBe('pending_verification');
  expect(account.emailVerificationState).toBe('pending');
});
```

---

## Related docs

- [Business rules](business-rules.md)
- [Domain model](domain-model.md)
- [Security phase gate](../../security/phase-gate-checklist.md)
