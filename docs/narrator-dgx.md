# Live narration from the DGX Spark

The homepage narrator (EK—01) always shows its scripted line first. When the Spark is reachable, `/api/narrate` adds a short follow-on line for the visitor type and answers questions inline. When it isn't (Spark off, tunnel down, slow, bad output), the endpoint returns `null` and the site behaves exactly as it does today: script only, and questions go to the on-page guide.

```
browser ──POST /api/narrate──▶ Vercel function ──HTTPS + Access token──▶ Cloudflare Tunnel ──▶ model server on the Spark (127.0.0.1)
                                  │ 3 s timeout, validates every reply, logs one line (no IP)
```

Nothing here is needed for the site to work. Do the steps in order; each one can be checked before the next.

## 1. Serve the model on the Spark

Use the Qwen3.6-35B-A3B GGUF that dgx-autonomy already qualified (`config/models.yaml`: about 17.6 GiB, fits next to `claude-qwen`). Any OpenAI-compatible server works; llama.cpp's `llama-server` matches the qualified setup:

```bash
llama-server \
  -m "$DGX_AUTONOMY_MODELS/qwen3.6-35b-a3b/Qwen3.6-35B-A3B-UD-Q3_K_XL.gguf" \
  --host 127.0.0.1 --port 8090 \
  --alias qwen3.6-35b-a3b \
  --jinja -ngl 99 -c 16384 --parallel 2 \
  -ctk q8_0 -ctv q8_0
```

- Bind to `127.0.0.1` only. The tunnel is the only way in.
- The site sends `chat_template_kwargs: {"enable_thinking": false}` and a JSON schema (`response_format`), so `--jinja` is required. If your build supports `--reasoning-budget 0`, add it too.
- 16K context is plenty: a request is about 1,500 tokens of notes plus a short reply.
- SGLang works as well; serve on `127.0.0.1:8090` with `--served-model-name qwen3.6-35b-a3b`.

Check it on the Spark:

```bash
curl -s 127.0.0.1:8090/v1/chat/completions -H 'content-type: application/json' \
  -d '{"model":"qwen3.6-35b-a3b","max_tokens":40,"chat_template_kwargs":{"enable_thinking":false},
       "messages":[{"role":"user","content":"Say hello in five words."}]}'
```

Optionally run it as a systemd service so it survives reboots.

## 2. Publish it with a Cloudflare Tunnel

> **DNS caveat.** A tunnel's public hostname must be on a domain whose DNS is managed by Cloudflare. `kakosyaneduard.ca` is moving to Porkbun nameservers, so either use another domain you keep on Cloudflare, or keep `kakosyaneduard.ca` on Cloudflare DNS (with the Vercel A/CNAME records there instead of at Porkbun). The examples use `narrator.example.com`.

On the Spark:

```bash
cloudflared tunnel login
cloudflared tunnel create ek-narrator
cloudflared tunnel route dns ek-narrator narrator.example.com
```

`~/.cloudflared/config.yml`:

```yaml
tunnel: ek-narrator
credentials-file: /home/<you>/.cloudflared/<tunnel-id>.json
ingress:
  - hostname: narrator.example.com
    service: http://127.0.0.1:8090
  - service: http_status:404
```

```bash
sudo cloudflared service install   # runs the tunnel at boot
```

## 3. Lock it with Cloudflare Access

In Cloudflare Zero Trust:

1. **Access → Service credentials → Service tokens → Create.** Name it `vercel-narrator`. Copy the Client ID and Client Secret; the secret is shown once.
2. **Access → Applications → Add → Self-hosted.** Domain `narrator.example.com`. Add a policy with action **Service Auth** that includes the `vercel-narrator` token. No other policies.

Check from your laptop. Without the headers you should get a redirect or 403; with them, a reply:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://narrator.example.com/v1/models
curl -s https://narrator.example.com/v1/models \
  -H "CF-Access-Client-Id: $ID" -H "CF-Access-Client-Secret: $SECRET"
```

## 4. Add the Vercel environment variables

Set these for Preview and Production (Vercel dashboard → Project → Settings → Environment Variables, or `vercel env add <NAME> <environment>`):

| Name | Value |
|---|---|
| `DGX_NARRATE_URL` | `https://narrator.example.com` |
| `CF_ACCESS_CLIENT_ID` | the service token's Client ID |
| `CF_ACCESS_CLIENT_SECRET` | the service token's Client Secret |
| `DGX_NARRATE_MODEL` | optional; defaults to `qwen3.6-35b-a3b` |
| `HIDDEN_TERMS` | optional; comma-separated client names. Replies mentioning one are dropped |

Redeploy, then check (on a protected preview, use `vercel curl`):

```bash
curl -s -XPOST https://<deployment>/api/narrate \
  -d '{"kind":"bridge","persona":"recruiter","chapter":"systems"}'
```

A JSON object with `"action":"answer"` means it's live; `null` means the site fell back (check the logs).

## 5. Rate-limit the endpoint

Vercel dashboard → Project → **Firewall → Configure → New rule**:

- **If** Request Path **equals** `/api/narrate`
- **Then** Rate Limit: fixed window, 60 seconds, 20 requests, keyed by IP, action Too Many Requests (429)

Check by sending 25 requests in a row; the last few should return 429.

## 6. Record real outputs for the evals

The tests in `tests/narrator-evals.test.mjs` run offline against fixtures in `tests/fixtures/narrator/`. The success cases start as hand-written outputs. To replace them with real Spark outputs:

```bash
cd personal-website
vercel env pull .env.local     # or write the three variables into .env.local
pnpm narrator:record
pnpm test
```

Review the fixture diff before committing. If a recorded output fails its expectations, that is a real eval failure: fix the prompt in `src/lib/narrate/prompt.ts`, re-record and re-test.

## Logs

Each request writes one JSON line to the Vercel runtime logs, for example:

```json
{"evt":"narrate","kind":"question","persona":"engineer","chapter":"systems","q":"Show me Keeper","source":"dgx","ms":640}
```

No IP, user agent or headers are logged. Questions are truncated to 200 characters, and the site tells visitors their questions are logged.

## Turning it off

Stop the model server or the tunnel. The endpoint returns `null` within 3 seconds, the narrator stops asking after one failed follow-on line per visit, and the site runs from its script.
