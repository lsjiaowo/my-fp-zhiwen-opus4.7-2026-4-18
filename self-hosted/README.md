# Personal Self-Hosted deployment

All server-side files for this edition live under `/opt/my-fp-zhiwen-personal`.

## Directory layout

```text
/opt/my-fp-zhiwen-personal/
├── app/
├── data/
├── logs/
├── backups/
└── config/
```

The application stores sync data and relay runtime data below `data/`, so the project remains isolated from other VPS services.

## Server

Use Node.js to run `auth-server/server.js`. The data directory can be overridden with `FP_DATA_DIR`; otherwise it defaults to `/opt/my-fp-zhiwen-personal/data`.

Example systemd environment:

```ini
Environment=NODE_ENV=production
Environment=FP_DATA_DIR=/opt/my-fp-zhiwen-personal/data
```

Do not place passwords, SSH credentials, API tokens, or TLS private keys in the repository.

## Account behavior

Personal Self-Hosted registration creates an enabled account immediately. Login/session authentication remains enabled because cloud-sync data is isolated by account.

## Client

The desktop client keeps the server-address setting on the login screen. Point it at the self-hosted server and use the same account on computer A and computer B for cross-device synchronization.


## First-account registration secret

The server reads `FP_REGISTRATION_SECRET` from the private environment file `/opt/my-fp-zhiwen-personal/config/server.env`. Keep this file on the VPS only and never commit it. Registration requires this secret and is also permanently closed once the first account exists.
