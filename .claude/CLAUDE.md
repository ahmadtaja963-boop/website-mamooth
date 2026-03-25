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
