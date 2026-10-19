# Live narration from the DGX Spark

The homepage narrator (EK—01) always shows its scripted line first. When the Spark is reachable, `/api/narrate` adds a short follow-on line for the visitor type and answers questions inline. When it isn't (Spark off, tunnel down, slow, bad output), the endpoint returns `null` and the site behaves exactly as it does today: script only, and questions go to the on-page guide.

```
browser ──POST /api/narrate──▶ Vercel function ──HTTPS + API key──▶ Tailscale Funnel (one path) ──▶ model server on the Spark (127.0.0.1)
                                  │ 3 s timeout, validates every reply, logs one line (no IP)
```

Vercel can't reach into a home network by itself; it needs a public HTTPS address to call. This setup uses **Tailscale Funnel** (step 2), which the Spark already has, so no Cloudflare or DNS changes are needed. A Cloudflare Tunnel with Access is the alternative (step 2b): it blocks unauthenticated requests at Cloudflare's edge instead of at the model server.

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

**Running now (set up 2026-10-19):** on `dgx1` this runs as the user service `ek-narrator.service` (`~/.config/systemd/user/ek-narrator.service`; lingering is on, so it starts at boot without a login). It uses the native CUDA build at `~/src/llama.cpp/build/bin/llama-server`, because the `jim` account has no Docker access, and adds `--reasoning-budget 0` and `--api-key-file ~/.config/ek-narrator/api-key`. It loads in about 3 seconds and answers in 1–2 seconds.

```bash
systemctl --user status ek-narrator      # state
journalctl --user -u ek-narrator -f      # logs
systemctl --user stop ek-narrator        # free the memory (about 18 GiB)
systemctl --user disable --now ek-narrator   # stop it starting at boot
```

Check it on the Spark:

```bash
curl -s 127.0.0.1:8090/v1/chat/completions -H 'content-type: application/json' \
  -d '{"model":"qwen3.6-35b-a3b","max_tokens":40,"chat_template_kwargs":{"enable_thinking":false},
       "messages":[{"role":"user","content":"Say hello in five words."}]}'
```

Optionally run it as a systemd service so it survives reboots.

## 2. Publish it with Tailscale Funnel (in use)

The model server requires an API key (`--api-key-file`; on `dgx1` the key is in `~/.config/ek-narrator/api-key`, mode 600). Generate one with:

```bash
mkdir -p ~/.config/ek-narrator && chmod 700 ~/.config/ek-narrator
(umask 077; openssl rand -hex 32 > ~/.config/ek-narrator/api-key)
```

Publish **only** the chat endpoint, not the server's other pages (`/v1/models`, `/props` and `/health` answer without a key):

```bash
tailscale funnel --bg --https=443 \
  --set-path=/v1/chat/completions http://127.0.0.1:8090/v1/chat/completions
```

The first time, Tailscale prints a link to enable Funnel for the tailnet; a tailnet admin approves it, then run the command again. Check it from outside the tailnet:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -XPOST https://dgx1.tail31115a.ts.net/v1/chat/completions   # 401
curl -s -o /dev/null -w '%{http_code}\n' https://dgx1.tail31115a.ts.net/v1/models                    # 404
```

Stop publishing with `tailscale funnel --https=443 off`. Funnel is served by `tailscaled`, so it survives reboots.

Then use these Vercel variables in step 4: `DGX_NARRATE_URL=https://dgx1.tail31115a.ts.net` and `DGX_NARRATE_API_KEY=<the key>`. Skip step 3.

## 2b. Or publish it with a Cloudflare Tunnel

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

## 3. Lock it with Cloudflare Access (Cloudflare route only)

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

| Name                      | Value                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| `DGX_NARRATE_URL`         | `https://dgx1.tail31115a.ts.net` (Funnel) or `https://narrator.example.com` (Cloudflare) |
| `DGX_NARRATE_API_KEY`     | Funnel: the model server's API key                                                       |
| `CF_ACCESS_CLIENT_ID`     | Cloudflare: the service token's Client ID                                                |
| `CF_ACCESS_CLIENT_SECRET` | Cloudflare: the service token's Client Secret                                            |
| `DGX_NARRATE_MODEL`       | optional; defaults to `qwen3.6-35b-a3b`                                                  |
| `HIDDEN_TERMS`            | optional; comma-separated client names. Replies mentioning one are dropped               |

For Preview, pass the branch as the third argument (`vercel env add DGX_NARRATE_API_KEY preview <branch> --value "$KEY" --yes`): in CLI 54.5 the all-branches form loops on `git_branch_required` in non-interactive mode. Read the key into a shell variable from the Spark rather than pasting it.

Redeploy, then check (on a protected preview, use `vercel curl --deployment <url> /api/narrate -- -XPOST -d '<json>'`):

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
vercel env pull .env.local     # or write the variables into .env.local
pnpm narrator:record
pnpm test
```

Review the fixture diff before committing. If a recorded output fails its expectations, that is a real eval failure: fix the prompt in `src/lib/narrate/prompt.ts`, re-record and re-test.

## Logs

Each request writes one JSON line to the Vercel runtime logs, for example:

```json
{
  "evt": "narrate",
  "kind": "question",
  "persona": "engineer",
  "chapter": "systems",
  "q": "Show me Keeper",
  "source": "dgx",
  "ms": 640
}
```

No IP, user agent or headers are logged. Questions are truncated to 200 characters, and the site tells visitors their questions are logged.

## Turning it off

Stop the model server, the Funnel or the tunnel. The endpoint returns `null` within 3 seconds, the narrator stops asking after one failed follow-on line per visit, and the site runs from its script.
