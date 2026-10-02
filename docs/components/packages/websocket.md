<div align="center">

# @nestlancer/websocket

### Socket.IO client with auth and room subscriptions.

</div>

---

## 📖 Table of Contents

- [Package info](#package-info)
- [Workspace dependencies](#workspace-dependencies)
- [Connection](#connection)
- [Hooks](#hooks)
- [📚 Related documentation](#related-documentation)

---

## Package info

|            |                                              |
| :--------- | :------------------------------------------- |
| **Path**   | `packages/websocket/`                        |
| **Import** | `import { … } from '@nestlancer/websocket';` |

---

## Workspace dependencies

- `@nestlancer/types`

---

## Connection

```typescript
// Typical env
NEXT_PUBLIC_WS_URL=https://dev.nestlancer.com
NEXT_PUBLIC_SOCKET_IO_PATH=/ws/socket.io
```

---

## Hooks

| Hook            | Purpose                         |
| :-------------- | :------------------------------ |
| `useWebSocket`  | Connection lifecycle            |
| `useSocketRoom` | Join conversation/project rooms |
| `usePresence`   | Online indicators               |

Event names align with [backend WebSocket protocol](../../../../nestlancer-backend-api/docs/architecture/websocket-protocol.md) (sibling repo).

---

## 📚 Related documentation

- [Frontend architecture](../../architecture/ARCHITECTURE.md)
- [CHANGELOG](../../changelog/CHANGELOG.md)

---

<div align="center">

**@nestlancer/websocket** — Nestlancer backend component documentation

</div>
