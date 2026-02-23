# OpenClaw Railway Template (1‑click deploy)

This repo packages **OpenClaw** for Railway with a small **/setup** web wizard so users can deploy and onboard **without running any commands**.

## What you get

- **OpenClaw Gateway + Control UI** (served at `/` and `/openclaw`)
- A friendly **Setup Wizard** at `/setup` (protected by a password)
- Optional **Web Terminal** at `/tui` for browser-based TUI access
- Persistent state via **Railway Volume** (so config/credentials/memory survive redeploys)

## How it works (high level)

- The container runs a wrapper web server.
- The wrapper protects `/setup` with `SETUP_PASSWORD`.
- During setup, the wrapper runs `openclaw onboard --non-interactive ...` inside the container, writes state to the volume, and then starts the gateway.
- After setup, **`/` is OpenClaw**. The wrapper reverse-proxies all traffic (including WebSockets) to the local gateway process.

## Getting chat tokens (so you don't have to scramble)

### Telegram bot token

1. Open Telegram and message **@BotFather**
2. Run `/newbot` and follow the prompts
3. BotFather will give you a token that looks like: `123456789:AA...`
4. Paste that token into `/setup`

### Discord bot token

1. Go to the Discord Developer Portal: https://discord.com/developers/applications
2. **New Application** → pick a name
3. Open the **Bot** tab → **Add Bot**
4. Copy the **Bot Token** and paste it into `/setup`
5. Invite the bot to your server (OAuth2 URL Generator → scopes: `bot`, `applications.commands`; then choose permissions)

## Web Terminal (TUI)

The template includes an optional web-based terminal that runs `openclaw tui` in your browser.

### Enabling

Set `ENABLE_WEB_TUI=true` in your Railway Variables. The terminal is **disabled by default**.

Once enabled, access it at `/tui` or via the "Open Terminal" button on the setup page.

### Security

The web TUI implements multiple security layers:

| Control | Description |

## External Dashboard Support

This template supports connecting external dashboards and custom WebSocket clients to the OpenClaw gateway.

### Method A: Allowed Origins (Recommended)

Set `CONTROL_UI_ALLOWED_ORIGINS` in Railway Variables to a comma-separated list of allowed origins:

```
CONTROL_UI_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://10.0.0.100:3000
```

- This configures `gateway.controlUi.allowedOrigins` in the OpenClaw config after setup
- Safe merge strategy: preserves existing origins and adds new ones
- Takes effect after the next setup/run cycle

### Method B: Force Origin (Fallback)

If the gateway config cannot be modified, enable origin spoofing at the proxy level:

```
FORCE_WS_ORIGIN=true
```

- Forces WebSocket `Origin` header to match the gateway host for all upgrade requests
- Use only if Method A doesn't work for your setup
- May affect security - use with caution

### Example Usage

With `CONTROL_UI_ALLOWED_ORIGINS=http://localhost:3001`, your local Next.js dashboard at `http://localhost:3001` can:

1. Connect to `wss://your-railway-domain.app/ws` (WebSocket will be proxied)
2. Pass authentication via the gateway token
3. Receive real-time updates without "origin not allowed" errors

### Security

| Control | Description |
|---------|-------------|
| **Opt-in only** | Disabled by default, requires explicit `ENABLE_WEB_TUI=true` |
| **Password protected** | Uses the same `SETUP_PASSWORD` as the setup wizard |
| **Single session** | Only 1 concurrent TUI session allowed at a time |
| **Idle timeout** | Auto-closes after 5 minutes of inactivity (configurable via `TUI_IDLE_TIMEOUT_MS`) |
| **Max duration** | Hard limit of 30 minutes per session (configurable via `TUI_MAX_SESSION_MS`) |

### Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_WEB_TUI` | `false` | Set to `true` to enable web terminal |
| `TUI_IDLE_TIMEOUT_MS` | `300000` (5 min) | Closes session after inactivity |
| `TUI_MAX_SESSION_MS` | `1800000` (30 min) | Maximum session duration |
| `CONTROL_UI_ALLOWED_ORIGINS` | `""` | Comma-separated list of allowed origins for external dashboards |
| `FORCE_WS_ORIGIN` | `false` | Fallback: Force WebSocket Origin header at proxy level |
| `OPENCLAW_GATEWAY_TOKEN` | *generated* | Gateway auth token (set via Railway secret for production) |
| `TELEGRAM_DM_POLICY` | *default* | Override: `allow` or `pairing` |
| `TELEGRAM_GROUP_POLICY` | *default* | Override: `allow` or `allowlist` |

### Environment Variable Reference

#### Required Variables
- **`SETUP_PASSWORD`** - Password to access `/setup` wizard
- **`OPENCLAW_STATE_DIR`** - Directory for OpenClaw state (use `/data/.openclaw` on Railway)
- **`OPENCLAW_WORKSPACE_DIR`** - Directory for workspace files (use `/data/workspace` on Railway)

#### External Dashboard Support
- **`CONTROL_UI_ALLOWED_ORIGINS`** - Allows external WebSocket connections
  ```
  CONTROL_UI_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
  ```
- **`FORCE_WS_ORIGIN`** - Fallback origin spoofing (use if above doesn't work)

#### Web Terminal (TUI)
- **`ENABLE_WEB_TUI`** - Enable browser-based terminal at `/tui`
- **`TUI_IDLE_TIMEOUT_MS`** - Auto-close after inactivity (default: 5 minutes)
- **`TUI_MAX_SESSION_MS`** - Maximum session duration (default: 30 minutes)

#### Telegram Policy Overrides
- **`TELEGRAM_DM_POLICY`** - DM handling: `allow` (auto-allow) or `pairing` (require approval)
- **`TELEGRAM_GROUP_POLICY`** - Group handling: `allow` (all groups) or `allowlist` (whitelisted only)

#### Advanced Configuration
- **`OPENCLAW_GATEWAY_TOKEN`** - Stable gateway token (use Railway `${{ secret() }}` for production)
- **`PORT`** - Wrapper HTTP port (default: 8080, Railway sets automatically)
- **`INTERNAL_GATEWAY_PORT`** - Internal gateway port (default: 18789)
- **`INTERNAL_GATEWAY_HOST`** - Internal gateway host (default: 127.0.0.1)
- **`OPENCLAW_ENTRY`** - Path to OpenClaw CLI entry point
- **`OPENCLAW_NODE`** - Node.js executable to use
- **`OPENCLAW_CONFIG_PATH`** - Custom config file path

#### Debug Information
Visit `/setup/api/debug` (requires setup password) to see:
- Detected environment variables (names only, no values)
- OpenClaw version and configuration
- Gateway status and token information

## Local testing

```bash
docker build -t openclaw-railway-template .

docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e SETUP_PASSWORD=test \
  -e ENABLE_WEB_TUI=true \
  -e OPENCLAW_STATE_DIR=/data/.openclaw \
  -e OPENCLAW_WORKSPACE_DIR=/data/workspace \
  -v $(pwd)/.tmpdata:/data \
  openclaw-railway-template

# Setup wizard: http://localhost:8080/setup (password: test)
# Web terminal: http://localhost:8080/tui (after setup)
```

## FAQ

**Q: How do I access the setup page?**

A: Go to `/setup` on your deployed instance. When prompted for credentials, use the generated `SETUP_PASSWORD` from your Railway Variables as the password. The username field is ignored—you can leave it empty or enter anything.

**Q: I see "gateway disconnected" or authentication errors in the Control UI. What should I do?**

A: Go back to `/setup` and click the "Open OpenClaw UI" button from there. The setup page passes the required auth token to the UI. Accessing the UI directly without the token will cause connection errors.

**Q: I don't see the TUI option on the setup page.**

A: Make sure `ENABLE_WEB_TUI=true` is set in your Railway Variables and redeploy. The web terminal is disabled by default.

**Q: How do I approve pairing for Telegram or Discord?**

A: Go to `/setup` and use the "Approve Pairing" dialog to approve pending pairing requests from your chat channels.

**Q: How do I connect an external dashboard like a custom Next.js interface?**

A: Set `CONTROL_UI_ALLOWED_ORIGINS=http://localhost:3001` in Railway Variables to allow your local dashboard at `http://localhost:3001` to connect. If that doesn't work, set `FORCE_WS_ORIGIN=true` as a fallback.

**Q: I don't see all environment variables in Railway UI?**

A: Railway only shows variables that exist in your deployment. Make sure to set them in Railway Variables panel, then redeploy. Use `/setup/api/debug` to verify which variables are detected.

**Q: How do I configure Telegram to auto-allow DMs instead of requiring pairing?**

A: Set `TELEGRAM_DM_POLICY=allow` in Railway Variables and redeploy. This overrides the setup wizard configuration.

**Q: How do I change AI model after setup?**

A: Use OpenClaw CLI to switch models. Access the web terminal at `/tui` (if enabled) or SSH into your container and run:

```bash
openclaw models set provider/model-id
```

For example: `openclaw models set anthropic/claude-sonnet-4-20250514` or `openclaw models set openai/gpt-4-turbo`. Use `openclaw models list --all` to see available models.

**Q: My config seems broken or I'm getting strange errors. How do I fix it?**

A: Go to `/setup` and click the "Run Doctor" button. This runs `openclaw doctor --repair` which performs health checks on your gateway and channels, creates a backup of your config, and removes any unrecognized or corrupted configuration keys.

## Support

Need help? [Request support on Railway Station](https://station.railway.com/all-templates/d0880c01-2cc5-462c-8b76-d84c1a203348)
