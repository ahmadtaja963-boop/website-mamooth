# MAMMOTH — Project Instructions for Claude Code

## Brand
- **Name:** MAMMOTH (all caps, double-M)
- **Type:** General dropshipping store (Shopify)
- **Niche:** Wellness, fitness, supplements, skincare — flexible for electronics/lifestyle
- **Target:** Health-conscious consumers 25–45, male + female
- **Voice:** Confident but not arrogant. Clean but not cold. Like a knowledgeable friend.

## Design Tokens
All colors/fonts/spacing live in `:root` at the top of `assets/theme.css`.
**Change the store look by editing ONLY that block. Do not hardcode values below it.**

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#FAFBFC` | Arctic White — page bg |
| `--color-bg-dark` | `#1A2332` | Mammoth Dark — footer, announcement |
| `--color-accent` | `#2B8F9E` | Tusk Teal — CTAs, links |
| `--color-accent-hover` | `#247A87` | Teal hover state |
| `--color-bg-secondary` | `#E8F4F8` | Ice Blue — section bgs |
| `--color-text` | `#1A2332` | Primary text |
| `--color-text-muted` | `#6B7B8D` | Steel Gray — captions |
| `--color-border` | `#DDE4EA` | Glacier — borders |
| `--font-heading` | `Montserrat` | Bold/700 headings |
| `--font-body` | `Inter` | Regular/500 body |
| `--radius` | `8px` | Buttons, inputs |
| `--radius-card` | `12px` | Product/collection cards |

## Button Classes
- `.btn-primary` → Tusk Teal background (main CTAs, Add to Cart)
- `.btn-dark` → Mammoth Dark background (Buy Now)
- `.btn-outline` → Teal border, transparent bg
- `.btn-white` → White bg, switches to teal on hover

## Navigation (desktop header)
SHOP · WELLNESS · SKINCARE · FITNESS · LIFESTYLE · ABOUT

## Image Generation — KIE.AI

API Key: stored locally in `~/.mammoth-secrets` (never commit)
Auth header: `Authorization: Bearer <KIE_AI_KEY>`
Model: `nano-banana-2`

### Step 1 — Submit task
```
POST https://api.kie.ai/api/v1/jobs/createTask
Content-Type: application/json
Authorization: Bearer <KIE_AI_KEY>

{
  "model": "nano-banana-2",
  "input": {
    "prompt": "...",
    "aspect_ratio": "16:9",   // or "1:1", "4:3"
    "output_format": "jpg",
    "resolution": "2K"        // or "1K"
  }
}
```
Response: `{ "code": 200, "data": { "taskId": "abc123..." } }`

### Step 2 — Poll for result (use this exact endpoint — others return 404)
```
GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=<taskId>
Authorization: Bearer <KIE_AI_KEY>
```
Response when done: `{ "data": { "state": "success", "resultJson": "{\"resultUrls\":[\"https://tempfile.aiquickdraw.com/...\"]}" } }`

Poll every 10–15 seconds until `state == "success"`. Parse `resultJson` (it's a JSON string inside JSON) to get the image URL array.

### Step 3 — Download image
```bash
curl -sL "<resultUrl>" -o "assets/<filename>.jpg"
```

### Brand image style prompt prefix (always use)
> "Clean light background #FAFBFC, cool-toned natural daylight, premium editorial product photography, minimalist wellness aesthetic, no text overlays —"

### Generated images already in assets/
| File | Use |
|---|---|
| `mammoth-hero.jpg` | Hero section background (2K 16:9) |
| `mammoth-wellness.jpg` | Wellness collection card (1K 1:1) |
| `mammoth-skincare.jpg` | Skincare collection card (1K 1:1) |
| `mammoth-fitness.jpg` | Fitness collection card (1K 1:1) |
| `mammoth-lifestyle.jpg` | Lifestyle collection card (1K 1:1) |
| `mammoth-why-brand.jpg` | Why Brand section image (1K 4:3) |

## Shopify MCP
Store: `mamothus.myshopify.com`
Access Token: stored in `~/.claude/mcp.json` (never commit)
MCP server: `shopify-mammoth` (configured in ~/.claude/mcp.json)
OAuth App Client ID: stored locally (never commit)

## GitHub
Repo: `https://github.com/ahmadtaja963-boop/website-mamooth`
Branch: `main`
Local: `/Users/bass/Library/Mobile Documents/com~apple~CloudDocs/Shopify/mammoth`

## After every work session
Commit and push to GitHub so Shopify picks up changes automatically.
```bash
cd "/Users/bass/Library/Mobile Documents/com~apple~CloudDocs/Shopify/mammoth"
git add -A && git commit -m "..." && git push origin main
```
