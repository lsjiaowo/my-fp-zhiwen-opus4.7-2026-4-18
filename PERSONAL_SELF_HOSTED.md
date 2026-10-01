# Personal Self-Hosted Edition

This branch keeps account login and cross-device cloud sync while removing the upstream manual account-approval dependency.

Server files are isolated under:

```text
/opt/my-fp-zhiwen-personal/
├── app/
├── data/
├── sync-data/
├── relays/
├── logs/
├── backups/
└── config/
```

Current behavior:

- Desktop client defaults to the owner's self-hosted sync/auth endpoint.
- Registration creates an active account immediately; no manual approval is required.
- Login and session tokens remain because sync data is namespaced by account.
- No built-in administrator username/password is created.
- Sync data and relay runtime files use the isolated project directory.
- Existing cloud-sync APIs remain authenticated.

Security note: never commit VPS passwords, SSH credentials, API tokens, or TLS private keys to this repository.
