# Mobile Navigation

Planned screen map and navigation structure for Expo. **Status:** draft — not implemented in code yet.

## Navigator structure

```text
RootNavigator
├── BootstrapStack (first launch)
│   └── SessionBootstrapScreen
├── AuthStack (optional account)
│   ├── LoginScreen
│   ├── RegisterScreen
│   └── VerifyEmailScreen
└── MainTabs
    ├── MapTab → MapScreen
    ├── ReportTab → CreateOccurrenceScreen
    ├── ActivityTab → MyOccurrencesScreen (future)
    └── SettingsTab → SettingsStack
        ├── SettingsHomeScreen
        ├── IdentityScreen
        ├── AccountProfileScreen
        └── LocaleScreen
```

## Screen → API dependencies

| Screen | Primary routes |
|--------|----------------|
| SessionBootstrapScreen | `POST /sessions/bootstrap` |
| MapScreen | `GET /occurrences` |
| CreateOccurrenceScreen | `POST /occurrences`, media upload flow |
| OccurrenceDetailScreen | `GET /occurrences/:id`, comments, media, validation |
| LoginScreen | `POST /auth/login` |
| RegisterScreen | `POST /user-accounts/register` |
| AccountProfileScreen | `GET/PATCH /user-accounts/me` |
| IdentityScreen | `PATCH /identity/mode`, `POST /identity/rotate` |
| SettingsHomeScreen | `POST /auth/logout`, `DELETE /user-accounts/me` |

## Deep links (planned)

| Path | Screen |
|------|--------|
| `sentinel://occurrences/:id` | OccurrenceDetailScreen |
| `sentinel://verify-email?token=` | VerifyEmailScreen |

Configure in `app.json` / Expo linking and `src/navigation/linking.ts`.

## Auth gating

| State | Visible navigator |
|-------|-------------------|
| No session token | BootstrapStack |
| Session only (ghost) | MainTabs — account features show upgrade prompts |
| JWT access + refresh | MainTabs — full account profile |

## Related docs

- [API routes](api-routes.md)
- [Architecture](architecture.md)
