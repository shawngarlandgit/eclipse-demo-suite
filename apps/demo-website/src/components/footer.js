import { coinSlotLogoColor, iconInstagram, iconMapPin } from './icons.js'

export function renderFooter() {
  return `
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <a href="/" class="nav-logo">
          <span style="display:inline-block;height:36px;width:auto;">${coinSlotLogoColor}</span>
          <span class="nav-logo-text" style="font-size:1.1rem;">COIN SLOT</span>
        </a>
        <p class="footer-brand-desc">Premium recreational cannabis. Two locations, one unwavering commitment to quality and customer care.</p>
        <div class="footer-social">
          <a href="https://instagram.com/coinslotcannabis" target="_blank" rel="noopener" aria-label="Instagram">${iconInstagram}</a>
          <a href="https://maps.google.com/?q=129+W+81st+St+New+York+NY+10024" target="_blank" rel="noopener" aria-label="Google Maps">${iconMapPin}</a>
        </div>
      </div>
      <div class="footer-col">
        <h4 class="footer-col-title">Shop</h4>
        <a href="/products/flower">Flower</a>
        <a href="/products/extracts">Extracts</a>
        <a href="/products/cbd">CBD</a>
        <a href="/deals">Deals & Specials</a>
        <a href="/pricing">Pricing</a>
      </div>
      <div class="footer-col">
        <h4 class="footer-col-title">Company</h4>
        <a href="/company">Our Story</a>
        <a href="/faq">FAQ</a>
        <a href="/contact">Contact</a>
      </div>
      <div class="footer-col">
        <h4 class="footer-col-title">Visit</h4>
        <a href="/contact">Vandelay Plaza — NYC</a>
        <a href="/contact">Del Boca Vista — Boca Raton</a>
        <a href="/contact" style="color:var(--gold);font-weight:600;">Get Directions</a>
      </div>
    </div>
    <div class="footer-bottom">
      <div>
        <span>&copy; 2026 Coin Slot Cannabis. All rights reserved.</span>
        <span style="margin-left:1rem;opacity:0.6;">License #CSC-2024-NY-0742 | #CSC-2024-FL-0318</span>
      </div>
      <div class="footer-legal">
        <a href="/faq" style="color:var(--text-muted);transition:color 0.3s;">FAQ</a>
        <span style="opacity:0.3;">|</span>
        <span style="color:var(--text-muted);">Privacy Policy</span>
        <span style="opacity:0.3;">|</span>
        <span style="color:var(--text-muted);">Terms of Service</span>
      </div>
    </div>
  </footer>`
}
