# System Documentation

Sorriso Sentinel transforms dispersed local knowledge into collective urban intelligence. The map is a visualization layer — the product is **territorial memory**.

## Guides

| Guide | Description |
|-------|-------------|
| [Overview](overview.md) | Mission, central entity, product philosophy |
| [Occurrence lifecycle](occurrence-lifecycle.md) | States, validation, confidence, evolution, resolution |
| [Territorial intelligence](territorial-intelligence.md) | Location memory, graph, timeline, trends, missions |
| [Reputation and trust](reputation-and-trust.md) | Trust scores, specialists, natural hierarchy |
| [City health](city-health.md) | Neighborhood and city indicators |
| [Privacy and identity](privacy-and-identity.md) | 15 privacy principles, three-layer model |

Security enforcement for privacy rules: [security docs](../security/README.md).

## Architecture

| Guide | Description |
|-------|-------------|
| [Technology stack](../architecture/stack.md) | Backend, data, clients, infrastructure |
| [Monorepo structure](../architecture/monorepo-structure.md) | Planned folder layout (Turborepo) |

## Design references

The system is inspired by the intersection of **Wikipedia** (collective knowledge), **Waze** (real-time community input), and **Signal** (privacy by default).

## Ubiquitous language

| Term | Meaning |
|------|---------|
| **Occurrence** | Any reported event or issue at a location (pothole, flood, crime, fair, etc.) |
| **Contributor** | A reputation identity — not necessarily a named person |
| **Trust score** | Accuracy-based confidence of a contributor (invisible to the community) |
| **Territorial memory** | Historical knowledge accumulated per street, neighborhood, or rural route |
| **Confidence level** | Community-validated trust in a specific occurrence (0–100%) |
| **Sensitive report** | High-risk category with special anonymity rules |

All code, APIs, and database names use these English terms.
