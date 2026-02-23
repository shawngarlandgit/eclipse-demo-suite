# Gemini 3 Pro - CannaConnect Screenshot Generation Prompts

**Model:** Gemini 3 Pro
**Task:** Generate photorealistic marketing screenshots for SaaS dashboard
**Live Reference:** https://cannaconnect.me/

---

## MASTER PROMPT TEMPLATE

Use this structure for all screenshot requests:

```
[VISUAL CONTEXT]
Generate a photorealistic screenshot of a modern SaaS admin dashboard for a cannabis dispensary management platform called "CannaConnect". The interface uses a dark theme with the following exact specifications:

- Background: #0f172a (very dark blue-gray)
- Card surfaces: #1e293b (dark slate)
- Borders: #334155 (medium slate)
- Primary accent: #22c55e (cannabis green)
- Secondary accent: #8b5cf6 (violet purple)
- Text primary: #f8fafc (near-white)
- Text secondary: #94a3b8 (muted gray)

[LAYOUT]
{Describe specific layout here}

[CONTENT]
{Describe specific content/data here}

[STYLE REQUIREMENTS]
- Ultra-high resolution, 4K quality
- Crisp text rendering with Inter font family
- Subtle depth with layered card shadows
- Professional SaaS aesthetic similar to Linear, Vercel, or Stripe dashboards
- Pixel-perfect UI components with consistent 8px grid spacing
- Modern glassmorphism effects where appropriate
- Smooth gradient transitions on accent elements

[AVOID]
- Blurry or illegible text
- Inconsistent spacing or alignment
- Overly saturated colors
- Cartoonish or flat design
- Generic stock imagery
- Placeholder "lorem ipsum" text
```

---

## SCREENSHOT 1: Hero Dashboard (The Big Three)

```
Generate a photorealistic 4K screenshot of the CannaConnect cannabis dispensary admin dashboard showing "The Big Three" layout.

VIEWPORT: 1920x1080 desktop browser view

LAYOUT:
- Left sidebar (260px wide, #1e293b background) with:
  - Logo area: Green leaf emoji in #16a34a rounded square + "Cannabis Admin" text
  - Navigation items: Dashboard (active with green left border), Dispatch, Recommendations, Questionnaire, Patients, Strains, Inventory, Analytics, Staff, Compliance
  - Bottom: "v1.0.0" + purple "manager" badge

- Top bar (64px tall, #1e293b) with:
  - Hamburger menu icon (left)
  - Green dot + "Synced" pill (right)
  - Bell icon with red "3" badge
  - User avatar (green circle with "JM") + "Jordan Mitchell" + "Manager"

MAIN CONTENT:
- Heading: "Today at a Glance" with date "Monday, January 27"
- Three large gradient cards in a row (equal width):

Card 1 (Green gradient #10b981 to #059669):
- Large white dollar sign icon (top)
- "Today's Revenue" label
- "$12,847" in bold 36px white text

Card 2 (Blue gradient #3b82f6 to #2563eb):
- Large white shopping cart icon
- "Sales Today" label
- "247" in bold 36px white text
- "Avg ticket: $52.01" subtitle

Card 3 (Purple gradient #8b5cf6 to #7c3aed):
- Large white trending-up icon
- "Best Seller Today" label
- "Blue Dream - Flower (1/8th)" product name
- "48 units sold" and "$1,440 revenue"

- Footer text: "For more details, check the Analytics page" (muted)

STYLE: Professional enterprise SaaS, photorealistic UI render, sharp text, subtle card shadows, modern dark theme
```

---

## SCREENSHOT 2: Metrics Dashboard (Option 1)

```
Generate a photorealistic 4K screenshot of the CannaConnect dashboard showing the "Compact Metric Strips" layout with data visualization.

VIEWPORT: 1920x1080 desktop browser view

LAYOUT:
- Same sidebar and top bar as previous
- Main content shows:

ROW 1 - Revenue Strip (horizontal bar, #1e293b):
- Green "Revenue & Sales" label on left
- Metrics inline: "Today $12,847 ↑12.5%" | "MTD $387,420 ↑8.2%" | "Trans 247 ↑5.1%" | "Avg Ticket $52.01 ↓2.3%"
- Metrics separated by subtle vertical dividers

ROW 2 - Customer Strip:
- Blue "Customers" label
- "New Today 18" | "Repeat Rate 67.3% ↑3.2%" | "Staff On Duty 6" | "Trans MTD 7,842 ↑6.8%"

ROW 3 - Inventory Strip:
- Purple "Inventory & Compliance" label
- "Health 94%" (green) | "Low Stock 12" (yellow) | "Need Retest 4" (orange) | "Open Flags 3" (red) | "Critical 1" (red)

BELOW STRIPS:
- Large area chart (70% width) showing revenue trend over 7 days
  - Green line (#22c55e) with gradient fill below
  - X-axis: Mon, Tue, Wed, Thu, Fri, Sat, Sun
  - Y-axis: $0 to $15,000
  - Tooltip visible on Wednesday showing "$11,420"

- Staff Performance table (30% width, right side):
  - Header: "Staff Performance" in orange
  - Columns: Name, #, Sales
  - Rows:
    1. Sarah M. | 42 | $2,184
    2. James T. | 38 | $1,976
    3. Maria G. | 35 | $1,820
    4. Devon K. | 31 | $1,612
    5. Ashley R. | 28 | $1,456

STYLE: Dense information design, professional data dashboard, crisp typography, subtle row hover states
```

---

## SCREENSHOT 3: Mobile Responsive View

```
Generate a photorealistic screenshot of the CannaConnect dashboard on a mobile device (iPhone 15 Pro frame).

VIEWPORT: 390x844 (iPhone 15 Pro)

LAYOUT:
- Sidebar collapsed (hidden)
- Top bar shows:
  - Hamburger menu icon
  - "CannaConnect" centered
  - Bell icon with badge

MAIN CONTENT (scrollable):
- "Today at a Glance" heading
- Date below
- Three stacked cards (full width, vertical):
  1. Green revenue card: "$12,847"
  2. Blue sales card: "247 sales"
  3. Purple best seller card: "Blue Dream"

STYLE: Clean mobile UI, proper touch targets, native iOS feel, device frame visible, realistic screen rendering
```

---

## SCREENSHOT 4: Inventory Management

```
Generate a photorealistic 4K screenshot of the CannaConnect Inventory page.

VIEWPORT: 1920x1080

LAYOUT:
- Sidebar with "Inventory" nav item active (green highlight)
- Top bar as standard

MAIN CONTENT:
- Page title: "Inventory Management"
- Filter bar: Search input + "Category" dropdown + "Status" dropdown + green "Add Product" button

- Data table with columns:
  | Product | SKU | Category | Stock | Status | Last Updated |
  |---------|-----|----------|-------|--------|--------------|
  | Blue Dream (1/8) | BD-F-125 | Flower | 48 | ● In Stock | 2h ago |
  | Sour Diesel Pre-Roll | SD-PR-001 | Pre-Roll | 124 | ● In Stock | 1h ago |
  | GSC Live Resin | GSC-LR-500 | Concentrate | 8 | ● Low Stock | 30m ago |
  | Wedding Cake | WC-F-125 | Flower | 2 | ● Critical | 15m ago |
  | OG Kush Pack | OK-PRP-5 | Pre-Roll | 67 | ● In Stock | 3h ago |

Status badges:
- "In Stock" = green badge
- "Low Stock" = yellow badge
- "Critical" = red badge

STYLE: Clean data table, alternating row shading, sortable column headers, professional enterprise feel
```

---

## SCREENSHOT 5: Analytics Charts

```
Generate a photorealistic 4K screenshot of the CannaConnect Analytics page with multiple data visualizations.

VIEWPORT: 1920x1080

MAIN CONTENT:
- Page title: "Sales Analytics" with date range picker showing "Last 7 Days"

TOP ROW (4 stat cards):
- Total Revenue: $87,420 (↑12.5%)
- Total Orders: 1,847 (↑8.2%)
- Avg Order Value: $47.32 (↓2.1%)
- New Customers: 142 (↑15.7%)

MIDDLE ROW:
- Large line chart (60% width): "Revenue Trend"
  - Dual lines: Revenue (green) and Orders (purple)
  - 7-day x-axis
  - Smooth curves with data points

- Donut chart (40% width): "Sales by Category"
  - Flower: 45% (green)
  - Pre-Roll: 25% (blue)
  - Concentrate: 15% (purple)
  - Edible: 10% (orange)
  - Other: 5% (gray)

BOTTOM ROW:
- Bar chart: "Top 5 Products"
  - Horizontal bars in descending order
  - Blue Dream leading with longest bar

STYLE: Data visualization best practices, consistent color coding, clear legends, professional analytics dashboard
```

---

## QUALITY CHECKLIST

Before finalizing any screenshot, verify:

- [ ] Text is sharp and readable at all sizes
- [ ] Colors match exact hex values provided
- [ ] Spacing is consistent (8px grid)
- [ ] Shadows are subtle and realistic
- [ ] Data looks realistic (not placeholder)
- [ ] Navigation shows current page as active
- [ ] User avatar and name visible in top bar
- [ ] Notification badge shows "3"
- [ ] "Synced" status indicator visible
- [ ] No visual artifacts or glitches
- [ ] Proper dark mode contrast ratios
- [ ] Professional SaaS aesthetic maintained

---

## NEGATIVE PROMPT ADDITIONS

Add to any prompt to avoid common issues:

```
DO NOT include:
- Blurry or pixelated text
- Misaligned UI elements
- Wrong color values
- Light mode or white backgrounds
- Generic placeholder text like "Lorem ipsum"
- Watermarks or AI generation artifacts
- Overly glossy or 3D effects
- Inconsistent icon styles
- Broken layouts or overlapping elements
- Non-English text or random characters
```

---

## ASPECT RATIOS

| Use Case | Dimensions | Aspect Ratio |
|----------|------------|--------------|
| Desktop Hero | 1920x1080 | 16:9 |
| Desktop Wide | 2560x1440 | 16:9 |
| Laptop | 1440x900 | 16:10 |
| Tablet | 1024x768 | 4:3 |
| Mobile | 390x844 | ~9:19.5 |
| Social (Square) | 1200x1200 | 1:1 |
| Twitter/X | 1200x675 | 16:9 |
| LinkedIn | 1200x627 | ~1.91:1 |
