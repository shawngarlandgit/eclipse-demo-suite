import { coinSlotLogo } from './icons.js'

export function renderNav() {
  return `
  <div class="announcement-bar" id="announcementBar">
    <div class="announcement-messages">
      <span class="announcement-msg active">First Visit? Get 20% Off Your First Order</span>
      <span class="announcement-msg">Daily Deals — Check Our <a href="/deals">Specials Page</a></span>
      <span class="announcement-msg">Loyalty Rewards — Earn Points Every Visit</span>
    </div>
    <button class="announcement-close" id="announcementClose" aria-label="Close">&times;</button>
  </div>
  <nav class="nav" id="nav">
    <a href="/" class="nav-logo">
      ${coinSlotLogo('white')}
      <span class="nav-logo-text">COIN SLOT</span>
    </a>
    <ul class="nav-links">
      <li><a href="/">Home</a></li>
      <li><a href="/products">Products</a></li>
      <li><a href="/deals">Deals</a></li>
      <li><a href="/pricing">Pricing</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
    <a href="/products/flower" class="nav-cta">Order Now</a>
    <button class="nav-hamburger" id="nav-hamburger" aria-label="Open menu">
      <span></span><span></span><span></span>
    </button>
  </nav>
  <div class="mobile-menu" id="mobileMenu">
    <button class="mobile-close" id="mobile-close" aria-label="Close menu">&times;</button>
    <a href="/">Home</a>
    <a href="/products">Products</a>
    <a href="/deals">Deals</a>
    <a href="/pricing">Pricing</a>
    <a href="/company">Company</a>
    <a href="/contact">Contact</a>
    <a href="/products/flower" class="mobile-cta">Order Now</a>
  </div>`
}
