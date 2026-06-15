# SQL Injection Prevention

SQL injection is **always in scope**. PostgreSQL + Drizzle reduces risk but does not eliminate it.

## Golden rules

1. **Never** concatenate user input into SQL strings.
2. **Always** use bound parameters (Drizzle query builder or `sql` placeholders).
3. **Treat** sort fields, column names, and dynamic filters as allowlists — not free text.
4. **Review** every `sql` tagged template and raw migration that touches runtime code paths.

## Approved patterns (Drizzle)

```typescript
// ✅ Parameterized equality
import { eq } from 'drizzle-orm';
await db.select().from(occurrences).where(eq(occurrences.id, occurrenceId));

// ✅ Parameterized IN list via Drizzle helpers
import { inArray } from 'drizzle-orm';
await db.select().from(occurrences).where(inArray(occurrences.id, ids));

// ✅ sql template with bound values only
import { sql } from 'drizzle-orm';
await db.execute(sql`SELECT uuidv7()`);
await db.select().where(sql`${occurrences.latitude} BETWEEN ${minLat} AND ${maxLat}`);
```

## Forbidden patterns

```typescript
// ❌ String interpolation
const query = `SELECT * FROM occurrences WHERE category = '${category}'`;

// ❌ sql.raw with user input
sql.raw(`ORDER BY ${sortColumn}`);

// ❌ Dynamic table/column from request without allowlist
const table = req.query.table;
db.execute(sql.raw(`SELECT * FROM ${table}`));
```

## Dynamic ORDER BY / filters

Use explicit allowlists:

```typescript
const SORTABLE_COLUMNS = {
  createdAt: occurrences.createdAt,
  confidenceLevel: occurrences.confidenceLevel,
} as const;

type SortKey = keyof typeof SORTABLE_COLUMNS;

function resolveSort(key: string): SortKey {
  if (key in SORTABLE_COLUMNS) return key as SortKey;
  return 'createdAt';
}
```

## PostGIS and spatial queries

- Bind coordinates as parameters: `ST_MakeEnvelope($1, $2, $3, $4)`.
- Validate bbox: lat ∈ [-90, 90], lng ∈ [-180, 180], max area limit.
- Do not embed WKT from users directly — parse and bind numerics only.

## Migrations vs runtime

| Context | Rule |
|---------|------|
| `packages/database/migrations/*.sql` | Static SQL only; reviewed in PR |
| Application code | No DDL at runtime without migration |
| `drizzle-kit` | Dev/staging only; not from user input |
| Integration test setup | Use fixtures — never copy-paste user strings into SQL |

## Database user privileges

| Environment | PostgreSQL role |
|-------------|-----------------|
| Application runtime | `SELECT`, `INSERT`, `UPDATE` on app tables — no `SUPERUSER`, no `DROP` |
| Migrations CI | Elevated role only in migration job — separate from app connection string |
| Read replicas | Read-only role for reporting endpoints |

## RLS complements — does not replace — parameterization

RLS stops cross-tenant reads when the app forgets `city_id`. It does **not** stop:

- `'; DROP TABLE occurrences; --` in a broken raw query
- Denial-of-service via expensive unparameterized queries

Use both.

## Code review checklist

- [ ] No `sql.raw` with variables
- [ ] No template literals building SQL strings
- [ ] Dynamic identifiers resolved via allowlist
- [ ] New repository methods have injection-negative tests (malicious strings return safe errors, no leak)
- [ ] `LIKE` patterns escape `%` and `_` from user input

## Related docs

- [Database rule](../../.cursor/rules/02-database.mdc)
- [IDOR and access control](idor-and-access-control.md)
- [Phase gate — Phase 1](phase-gate-checklist.md#phase-1--database-and-migrations)
