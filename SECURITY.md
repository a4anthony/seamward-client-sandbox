# Security

This repository contains synthetic test data only.

Do not commit Seamward API keys, ingest tokens, GitHub credentials, provider secrets, webhook secrets, private keys, or real candidate data. Keep local values in `.env`, which is ignored by Git.

The management scripts never print credentials. The collector derives payload shapes, operation identities, and keyed correlation hashes locally. Raw candidate values and original idempotency keys must not be transmitted to Seamward or written to logs.

Report a suspected credential exposure by opening a private security advisory on the repository rather than a public issue.
