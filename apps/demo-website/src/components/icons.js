export const coinSlotLogo = (color = 'white') => `
<svg viewBox="0 0 200 170" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Gold coin circle -->
  <circle cx="100" cy="85" r="65" stroke="${color}" stroke-width="12" fill="none"/>
  <circle cx="100" cy="85" r="50" stroke="${color}" stroke-width="4" fill="none" opacity="0.5"/>
  <!-- Slot line through center -->
  <line x1="70" y1="85" x2="130" y2="85" stroke="${color}" stroke-width="10" stroke-linecap="round"/>
</svg>`

export const coinSlotLogoAnimated = `
<svg viewBox="0 0 200 170" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Gold coin circle with shimmer -->
  <circle cx="100" cy="85" r="65" stroke="#D4A035" stroke-width="12" fill="none">
    <animate attributeName="stroke" values="#D4A035;#F5C040;#E8B520;#D4A035" dur="4s" repeatCount="indefinite"/>
  </circle>
  <circle cx="100" cy="85" r="50" stroke="#F5C040" stroke-width="4" fill="none" opacity="0.5">
    <animate attributeName="stroke" values="#F5C040;#FFD700;#F5C040" dur="3s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite"/>
  </circle>
  <!-- Slot line with shimmer -->
  <line x1="70" y1="85" x2="130" y2="85" stroke="#F5C040" stroke-width="10" stroke-linecap="round">
    <animate attributeName="stroke" values="#F5C040;#FFD700;#D4A035;#F5C040" dur="4s" repeatCount="indefinite"/>
  </line>
</svg>`

export const coinSlotLogoColor = `
<svg viewBox="0 0 200 170" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Static gold/amber coin -->
  <circle cx="100" cy="85" r="65" stroke="#D4A035" stroke-width="12" fill="none"/>
  <circle cx="100" cy="85" r="50" stroke="#E8B520" stroke-width="4" fill="none" opacity="0.5"/>
  <!-- Slot line -->
  <line x1="70" y1="85" x2="130" y2="85" stroke="#D4A035" stroke-width="10" stroke-linecap="round"/>
</svg>`

export const arrowRight = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`

export const iconPin = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`

export const iconClock = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`

export const iconPhone = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>`

export const iconMail = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>`

export const iconStar = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"/></svg>`

export const iconBook = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>`

export const iconHeart = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`

export const iconLeaf = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4-4 8-7.5 8-12A8 8 0 004 10c0 4.5 4 8 8 12z"/><circle cx="12" cy="10" r="3"/></svg>`

export const iconInstagram = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`

export const iconMapPin = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`

export const iconChevronDown = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>`

export const iconCheck = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`

export const iconUser = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`

export const iconSend = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`
