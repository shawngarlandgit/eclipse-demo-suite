# CannaConnect Landing Page

Marketing landing page for CannaConnect - a cannabis dispensary management platform.

**Live URL**: https://cannaconnect.awakenedai.online

## Overview

Single-page marketing site targeting independent cannabis dispensary owners. Built with vanilla HTML/CSS for maximum portability and fast loading.

## Features

- **Responsive Design**: Mobile-first, works on all devices
- **Self-Contained**: Single HTML file with inline CSS
- **No Dependencies**: No JavaScript frameworks, no build step
- **Premium UI**: Satoshi display font, subtle animations, dark theme

## Page Sections

1. **Hero** - Pain-point headline with email capture
2. **Problems** - Key statistics about dispensary challenges
3. **Features** - Product screenshots with benefit descriptions
4. **Comparison Table** - CannaConnect vs Dutchie, Leafly, Jane
5. **Value Breakdown** - Cost of hiring separately vs Studio tier
6. **Testimonial** - Social proof from pilot customer
7. **Pricing** - 4 tiers (Essential, Specialist, Studio, Enterprise)
8. **How It Works** - 90-day pilot timeline
9. **FAQ** - Common questions
10. **CTA** - Final email capture

## Files

```
├── index.html                  # Complete landing page
├── screenshot-analytics.png    # Analytics dashboard screenshot
├── screenshot-dashboard.png    # Main dashboard screenshot
├── screenshot-inventory.png    # Inventory management screenshot
├── screenshot-questionnaire.png # Patient questionnaire screenshot
└── README.md                   # This file
```

## Deployment

The site is deployed to a VPS:

```bash
# Deploy to VPS (replace with your server)
scp index.html root@YOUR_SERVER:/var/www/cannaconnect/
scp screenshot-*.png root@YOUR_SERVER:/var/www/cannaconnect/
```

## Pricing Tiers

| Tier | Price | Target |
|------|-------|--------|
| Essential | $1,000/mo | Single location owner-operators |
| Specialist | $2,500/mo | Multi-location operators |
| Studio | $5,500/mo | Brand builders (includes media production) |
| Enterprise | Custom | Regional chains / MSOs |

## Tech Stack

- HTML5 + CSS3 (vanilla, no frameworks)
- Google Fonts (Inter) + Fontshare (Satoshi)
- Inline SVG icons
- CSS scroll-triggered animations (IntersectionObserver)

## Related Projects

- [cannabis-admin-dashboard](https://github.com/shawngarlandgit/cannabis-admin-dashboard) - The actual admin dashboard product
