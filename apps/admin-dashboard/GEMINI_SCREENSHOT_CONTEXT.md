# CannaConnect Dashboard - Screenshot Generation Context

**Live URL:** https://cannaconnect.me/
**Purpose:** Generate high-quality marketing screenshots for cannabis dispensary admin dashboard

---

## VISUAL DESIGN SYSTEM

### Color Palette (Exact Hex Values)

```
PRIMARY (Cannabis Green):
- 50:  #f0fdf4  (lightest)
- 100: #dcfce7
- 200: #bbf7d0
- 300: #86efac
- 400: #4ade80
- 500: #22c55e  ← PRIMARY BRAND COLOR
- 600: #16a34a
- 700: #15803d
- 800: #166534
- 900: #14532d  (darkest)

NEUTRAL (Slate - Dark Mode):
- 50:  #f8fafc  (text on dark)
- 100: #f1f5f9
- 200: #e2e8f0
- 300: #cbd5e1
- 400: #94a3b8
- 500: #64748b
- 600: #475569
- 700: #334155  (borders)
- 800: #1e293b  (cards, sidebar)
- 900: #0f172a  ← MAIN BACKGROUND

ACCENT (Violet Purple):
- 400: #a78bfa
- 500: #8b5cf6  ← ACCENT COLOR
- 600: #7c3aed

STATUS COLORS:
- Success: #10b981
- Warning: #f59e0b
- Danger:  #ef4444
- Info:    #3b82f6
```

### Typography
- **Headings & Body:** Inter (system-ui fallback)
- **Monospace:** Fira Code
- **Font Sizes:** 12px (xs), 14px (sm), 16px (base), 18px (lg), 20px (xl), 24px (2xl), 30px (3xl), 36px (4xl)

### Component Styling

**Cards:**
- Background: slate.800 (#1e293b)
- Border: 1px solid slate.700 (#334155)
- Border radius: 8px (lg)
- Padding: 24px

**Buttons (Primary):**
- Background: cannabis.600 (#16a34a)
- Hover: cannabis.700 (#15803d)
- Text: white
- Border radius: 8px
- Font weight: medium

**Stat Cards:**
- Same as cards
- Value: 30px bold white
- Label: 14px medium slate.400
- Trend up: cannabis.500 (#22c55e)
- Trend down: red.500 (#ef4444)

**Badges:**
- Border radius: full (pill)
- Success: bg cannabis.900/30, text cannabis.400, border cannabis.700
- Warning: bg yellow.900/30, text yellow.400, border yellow.700
- Danger: bg red.900/30, text red.400, border red.700

**Glass Effect:**
- Background: slate.800/50 with backdrop-blur

---

## LAYOUT STRUCTURE

### Main Layout (100vh)
```
┌─────────────────────────────────────────────────────────────┐
│ SIDEBAR (260px)  │  MAIN CONTENT AREA                       │
│                  │  ┌─────────────────────────────────────┐ │
│ ┌──────────────┐ │  │ TOP BAR (64px)                      │ │
│ │ 🌿 Cannabis  │ │  │ [☰] [Title]        [Synced] [🔔] [👤]│ │
│ │    Admin     │ │  └─────────────────────────────────────┘ │
│ └──────────────┘ │  ┌─────────────────────────────────────┐ │
│                  │  │                                     │ │
│ Dashboard ●      │  │  PAGE CONTENT (scrollable)          │ │
│                  │  │  padding: 24px                      │ │
│ ─── Budtender ─  │  │                                     │ │
│ Dispatch         │  │                                     │ │
│ Recommendations  │  │                                     │ │
│ Questionnaire    │  │                                     │ │
│ Patients         │  │                                     │ │
│ Strains          │  │                                     │ │
│                  │  │                                     │ │
│ ─── Management ─ │  │                                     │ │
│ Inventory        │  │                                     │ │
│ Analytics        │  │                                     │ │
│ Staff            │  │                                     │ │
│ Compliance       │  │                                     │ │
│ Configuration    │  │                                     │ │
│                  │  │                                     │ │
│ ─────────────── │  │                                     │ │
│ v1.0.0           │  │                                     │ │
│ [manager]        │  └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Sidebar Details
- Width: 260px
- Background: slate.800 (#1e293b)
- Right border: 1px slate.700
- Logo area: 64px height with 🌿 icon in cannabis.600 box
- Active nav item: cannabis.900 bg, cannabis.400 text, 3px left border cannabis.500
- Inactive: transparent bg, slate.300 text
- Hover: slate.700 bg
- Section labels: xs uppercase slate.500

### Top Bar Details
- Height: 64px
- Background: slate.800
- Bottom border: 1px slate.700
- Left: hamburger menu icon + page title
- Right:
  - Sync indicator (green dot + "Synced" in slate.700 pill)
  - Bell icon with red badge "3"
  - User avatar (cannabis.600 bg) + name + role dropdown

---

## DASHBOARD LAYOUTS (8 Total)

### Simple 1: "The Big Three"
Three large gradient cards in a row:
1. **Revenue Card** - Green gradient (#10b981 → #059669)
   - $ icon (large, white, 0.9 opacity)
   - "Today's Revenue" label
   - "$12,847" large value

2. **Sales Card** - Blue gradient (#3b82f6 → #2563eb)
   - Shopping cart icon
   - "Sales Today" label
   - "247" large value
   - "Avg ticket: $52.01" subtitle

3. **Best Seller Card** - Purple gradient (#8b5cf6 → #7c3aed)
   - Trending up icon
   - "Best Seller Today" label
   - "Blue Dream - Flower (1/8th)" product name
   - "48 units sold" + "$1,440 revenue"

### Option 1: "Compact Metric Strips"
Horizontal strips with inline metrics:
- Revenue strip: green accent, Today/MTD/Trans/Avg Ticket
- Customer strip: blue accent, New Today/Repeat Rate/Staff/Trans MTD
- Inventory strip: purple accent, Health %/Low Stock/Need Retest/Open Flags
- Large revenue chart below
- Staff performance table on right

---

## CHART STYLING

### Revenue Line Chart
- Line color: cannabis.500 (#22c55e)
- Gradient fill below line (green to transparent)
- Grid: slate.700 dashed
- Axis labels: slate.400
- Tooltip: slate.800 bg with white text

### Chart Gradients
- Revenue: #22c55e → #16a34a
- Transactions: #8b5cf6 → #7c3aed
- Customers: #3b82f6 → #2563eb
- Inventory: #f59e0b → #d97706

---

## SAMPLE DATA FOR SCREENSHOTS

### KPI Values
- Revenue Today: $12,847
- Revenue MTD: $387,420
- Transactions Today: 247
- Avg Transaction: $52.01
- New Customers Today: 18
- Repeat Rate: 67.3%
- Staff On Duty: 6
- Inventory Health: 94%
- Low Stock Items: 12
- Compliance Flags: 3

### Top Products
1. Blue Dream - Flower (1/8th) - 48 units - $1,440
2. Sour Diesel - Pre-Roll - 36 units - $324
3. GSC - Live Resin Cart - 24 units - $960
4. Wedding Cake - Flower - 22 units - $770
5. OG Kush - Pre-Roll Pack - 18 units - $270

### Staff Performance
1. Sarah M. - 42 sales - $2,184
2. James T. - 38 sales - $1,976
3. Maria G. - 35 sales - $1,820
4. Devon K. - 31 sales - $1,612
5. Ashley R. - 28 sales - $1,456

### User Profile (for avatar)
- Name: "Jordan Mitchell"
- Role: "Manager"
- Avatar: Green background with initials "JM"

---

## PRODUCT CATEGORIES (Icons)
- 🌿 Flower
- 🚬 Pre-Roll
- 💎 Concentrate
- 🍫 Edible
- 💨 Vape
- 🧪 Tincture
- 🧴 Topical
- 🪈 Glass Pipe
- ⚙️ Grinder
- 🔋 Vape Battery

---

## VISUAL REQUIREMENTS FOR SCREENSHOTS

1. **Always dark mode** - slate.900 background
2. **Crisp text rendering** - Inter font, proper anti-aliasing
3. **Consistent spacing** - 24px content padding, 16px card padding
4. **Proper shadows** - subtle, matching dark theme
5. **Active states** - show hover/active states where appropriate
6. **Realistic data** - use sample data above, not placeholder text
7. **Full sidebar visible** - show navigation context
8. **User logged in** - show avatar and name in top bar
9. **Notifications badge** - show "3" on bell icon
10. **Green sync indicator** - "Synced" status visible
