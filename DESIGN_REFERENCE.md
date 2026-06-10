# Saya Design Reference — Match Business Plan & Investor Pitch Exactly
**ADDENDUM to task t_d4e8c0de**
**READ THIS FILE. It overrides the color values in SAYA_FULL_REQUIREMENTS.md.**

The entire app — frontend AND admin dashboard — must look like the Saya Business Plan
and Investor Pitch documents at:
- D:\Claude\Empire\Saya Companion App\BUSINESS_PLAN.html
- D:\Claude\Empire\Saya Companion App\Saya_Investor_Pitch.html

Those documents ARE the design reference. The app must feel like it was designed by the
same hand. Open them in a browser to see exactly what the user expects.

---

## EXACT COLOR TOKENS (copy these verbatim into Tailwind config + CSS variables)

```css
:root {
  --bg:         #06060f;   /* page background — very dark navy-black */
  --bg2:        #0c0c1a;   /* slightly lighter bg, section alternates */
  --card:       #111122;   /* card / panel background */
  --card2:      #0e0e20;   /* table headers, nested cards */
  --border:     rgba(139, 92, 246, 0.18);  /* ALL borders — purple-tinted, not grey */

  --purple:     #8b5cf6;   /* primary accent */
  --pink:       #ec4899;   /* secondary accent */
  --teal:       #14b8a6;   /* success / positive */
  --amber:      #f59e0b;   /* warning */
  --green:      #10b981;   /* positive / growth */
  --red:        #ef4444;   /* error / crisis */
  --blue:       #3b82f6;   /* info */

  --text:       #f0effa;   /* primary text */
  --text-dim:   #9ca3c8;   /* secondary text */
  --text-muted: #4a4a6a;   /* muted / disabled text */

  /* Gradients */
  --grad-brand: linear-gradient(135deg, #8b5cf6, #ec4899);
  --grad-green: linear-gradient(135deg, #10b981, #14b8a6);
  --grad-amber: linear-gradient(135deg, #f59e0b, #ec4899);
  --grad-timeline: linear-gradient(180deg, #8b5cf6, #ec4899, #14b8a6, #10b981);
}
```

---

## TAILWIND CONFIG (tailwind.config.ts)

```js
colors: {
  bg:      '#06060f',
  bg2:     '#0c0c1a',
  card:    '#111122',
  card2:   '#0e0e20',
  purple:  '#8b5cf6',
  pink:    '#ec4899',
  teal:    '#14b8a6',
  amber:   '#f59e0b',
  green:   '#10b981',
  red:     '#ef4444',
  blue:    '#3b82f6',
  text:    '#f0effa',
  dim:     '#9ca3c8',
  muted:   '#4a4a6a',
}
```

---

## KEY DESIGN PATTERNS (exact from business plan)

### Navigation bar
```css
nav {
  background: rgba(6, 6, 15, 0.96);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(139, 92, 246, 0.18);
  height: 56px;
}
```

### Brand name / Saya logo text
```css
.brand-name {
  font-weight: 800;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Cards
```css
.card {
  background: #111122;
  border: 1px solid rgba(139, 92, 246, 0.18);
  border-radius: 14px;
  padding: 1.5rem;
}
.card.highlight {
  border-color: #8b5cf6;  /* active/featured card gets solid purple border */
}
```

### Stat numbers (gradient text on big numbers)
```css
.stat-num { font-size: 1.9rem; font-weight: 800; }
.stat-num.brand { background: linear-gradient(135deg, #8b5cf6, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.stat-num.green  { background: linear-gradient(135deg, #10b981, #14b8a6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.stat-num.amber  { background: linear-gradient(135deg, #f59e0b, #ec4899);  -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
```

### Pills / badges
```css
.pill {
  font-size: 0.77rem;
  padding: 4px 14px;
  border-radius: 20px;
  border: 1px solid;
  font-weight: 600;
}
.pill-purple { border-color: #8b5cf6; color: #8b5cf6; background: rgba(139,92,246,0.08); }
.pill-teal   { border-color: #14b8a6; color: #14b8a6; }
.pill-amber  { border-color: #f59e0b; color: #f59e0b; }
.pill-green  { border-color: #10b981; color: #10b981; }
```

### Tables (admin dashboard, pricing, comparisons)
```css
table th {
  background: #0e0e20;
  padding: 0.75rem 1rem;
  font-size: 0.73rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #4a4a6a;
  border-bottom: 1px solid rgba(139,92,246,0.18);
}
table td {
  padding: 0.7rem 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  color: #9ca3c8;
}
table td.bold { color: #f0effa; font-weight: 600; }
```

### Section labels (uppercase small caps above headings)
```css
.section-label {
  font-size: 0.68rem;
  color: #4a4a6a;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-bottom: 1.2rem;
}
```

### Glow on active / hover
```css
.dot-active {
  background: #8b5cf6;
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.5);
}
.btn-primary:hover {
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
}
```

### Typography
- Font: 'Segoe UI', -apple-system, sans-serif (system font, clean)
- H1: clamp(2.2rem, 5vw, 3.6rem), weight 800
- H2: clamp(1.4rem, 3vw, 2.2rem), weight 700
- H4: 0.88rem, weight 700, color var(--purple), uppercase, letter-spacing 0.08em
- Body: 0.96rem, line-height 1.75, color var(--text-dim)
- Lead text: 1.1rem, color var(--text), max-width 820px

---

## WHERE THIS APPLIES

Apply this design to ALL parts of the app:

1. **Landing page** — same dark aesthetic as business plan cover section
2. **Auth pages** (login/register) — dark cards, purple border, gradient buttons
3. **Onboarding flow** — same card style, gradient progress bar
4. **Chat interface** — dark bg, card-style bubbles, purple accents
5. **Profile/Settings pages** — same table and card patterns
6. **Subscription/Pricing** — same price card style as business plan pricing section
7. **Admin dashboard** — THIS IS CRITICAL. Admin should look like the financial tables, stat cards, and timeline from the business plan. Same purple-tinted borders, gradient stat numbers, uppercase table headers, section labels.

The admin dashboard in particular should feel like looking at the business plan's financial section —
professional, data-dense, beautiful dark design with gradient accents on the key numbers.

---

## WHAT NOT TO DO

- Do NOT use plain grey borders (#333, #444 etc) — borders are always purple-tinted: rgba(139,92,246,0.18)
- Do NOT use white or light backgrounds anywhere
- Do NOT use solid color buttons without gradient
- Do NOT use generic shadcn default styling without overriding to match these tokens
- Do NOT make the admin look like a generic dashboard — it should feel premium

---

## REFERENCE FILES

Open these in a browser to see exactly what the target looks like:
- D:\Claude\Empire\Saya Companion App\BUSINESS_PLAN.html
- D:\Claude\Empire\Saya Companion App\Saya_Investor_Pitch.html

Every design decision you make should pass this test: "Does this look like it belongs in those documents?"
