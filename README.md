# Veramo CloudFlare deployment

Clone this repo.

```
git clone git@github.com:veramolabs/cloudflare-agent.git
cd cloudflare-agent
```

```
pnpm install
```

Create `wrangler.toml` file.

```
touch wrangler.toml
```

Create KV namespace

```
pnpm wrangler kv:namespace create KV
```

Create KMS secret key

```
npx @veramo/cli config create-secret-key
```

Copy and paste this to your `wrangler.toml` (don't forget to update these values)
```toml
name = "hono-veramo"
compatibility_date = "2023-01-01"
compatibility_flags = [ "nodejs_compat" ]

[[kv_namespaces]]
binding = "KV"
id = "abf1e373ac4e4abd93e7f800bbc80704"

[vars]
API_KEY = "test123"
KMS_SECRET_KEY="1d6a5ea0200edfd65c6c5bf7be2a1eae538a96c6c08ffc9d15c8f34ee486c08f"
INFURA_PROJECT_ID="6fffe7dc6c6c42459d5443592d3c3afc"
```

Deploy:

```
pnpm run deploy
```

## Running locally

```
pnpm run dev
```
