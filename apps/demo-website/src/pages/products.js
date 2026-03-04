import { arrowRight } from '../components/icons.js'

export function productsPage() {
  return `
  <section class="page-hero page-hero-products">
    <div class="page-hero-content">
      <span class="section-label reveal">Browse</span>
      <h1 class="page-hero-title reveal">Our Products</h1>
      <p class="page-hero-sub reveal">Let's find the right product for you. The highest quality and most exclusive strains, sold at the lowest cost.</p>
    </div>
  </section>

  <section class="section" style="background:var(--dark-mid);">
    <div class="container">
      <div class="products-grid products-grid-2">
        <a href="/products/flower" class="product-card-large reveal reveal-delay-1">
          <div class="product-card-visual product-card-photo">
            <img src="/images/flower-closeup.webp" alt="Premium cannabis flower" loading="lazy"/>
            <div class="product-card-photo-overlay gradient-flower"></div>
          </div>
          <div class="product-card-content">
            <h3 class="product-card-title">Premium Cannabis Flower</h3>
            <p class="product-card-desc">Hand-trimmed, small-batch cultivars. Browse our current strain selection for both locations.</p>
            <div class="product-card-arrow">Browse Strains ${arrowRight}</div>
          </div>
        </a>
        <a href="/products/extracts" class="product-card-large reveal reveal-delay-2">
          <div class="product-card-visual product-card-photo">
            <img src="/images/trichome-macro.webp" alt="Cannabis trichomes macro" loading="lazy"/>
            <div class="product-card-photo-overlay gradient-extracts"></div>
          </div>
          <div class="product-card-content">
            <h3 class="product-card-title">Extracts &amp; Concentrates</h3>
            <p class="product-card-desc">Live resin, shatter, rosin, and more. Extracted for maximum purity and flavor from our in-house flower.</p>
            <div class="product-card-arrow">View Extracts ${arrowRight}</div>
          </div>
        </a>
        <a href="/products/cbd" class="product-card-large reveal reveal-delay-3">
          <div class="product-card-visual product-card-photo">
            <img src="/images/cbd-drops.webp" alt="Serenity Now CBD Drops" loading="lazy"/>
            <div class="product-card-photo-overlay gradient-cbd"></div>
          </div>
          <div class="product-card-content">
            <h3 class="product-card-title">CBD</h3>
            <p class="product-card-desc">Cannabidiol products for natural relief without psychoactive effects. Pain management, anxiety, and wellness.</p>
            <div class="product-card-arrow">Explore CBD ${arrowRight}</div>
          </div>
        </a>
        <a href="/products/merchandise" class="product-card-large reveal reveal-delay-4">
          <div class="product-card-visual product-card-photo">
            <img src="/images/merch-hoodie.webp" alt="Coin Slot Cannabis hoodie and mug" loading="lazy"/>
            <div class="product-card-photo-overlay gradient-merch"></div>
          </div>
          <div class="product-card-content">
            <h3 class="product-card-title">Merchandise</h3>
            <p class="product-card-desc">Apparel, accessories, and gear featuring our signature retro-nostalgic Coin Slot designs.</p>
            <div class="product-card-arrow">Shop Merch ${arrowRight}</div>
          </div>
        </a>
      </div>
    </div>
  </section>`
}
