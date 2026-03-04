import { iconCheck } from '../components/icons.js'

export function pricingPage() {
  return `
  <section class="page-hero page-hero-pricing">
    <div class="page-hero-content">
      <span class="section-label reveal">Pricing</span>
      <h1 class="page-hero-title reveal">Premium Products, Great Prices</h1>
      <p class="page-hero-sub reveal">Premium local products at great prices. We believe quality cannabis shouldn't break the bank.</p>
    </div>
  </section>

  <section class="section" style="background:var(--dark-mid);">
    <div class="container">
      <div class="pricing-grid reveal">
        <!-- Flower Pricing -->
        <div class="pricing-card">
          <div class="pricing-card-header gradient-flower">
            <h3>Flower</h3>
            <p>Premium cannabis flower</p>
          </div>
          <div class="pricing-card-body">
            <div class="price-row"><span>1/8 oz (3.5g)</span><span class="price">$20</span></div>
            <div class="price-row"><span>1/4 oz (7g)</span><span class="price">$40</span></div>
            <div class="price-row"><span>1/2 oz (14g)</span><span class="price">$75</span></div>
            <div class="price-row"><span>1 oz (28g)</span><span class="price">$140</span></div>
            <div class="pricing-features">
              <div class="pricing-feature">${iconCheck} In-house cultivation</div>
              <div class="pricing-feature">${iconCheck} Hand-trimmed buds</div>
              <div class="pricing-feature">${iconCheck} Lab tested</div>
            </div>
            <a href="/products/flower" class="btn btn-primary pricing-card-cta">View Flower Menu</a>
          </div>
        </div>

        <!-- Concentrates Pricing -->
        <div class="pricing-card">
          <div class="pricing-card-header gradient-extracts">
            <h3>Concentrates</h3>
            <p>Extractions &amp; concentrates</p>
          </div>
          <div class="pricing-card-body">
            <div class="price-row"><span>1 gram</span><span class="price">$10</span></div>
            <div class="price-row"><span>1/8 oz (3.5g)</span><span class="price">$30</span></div>
            <div class="price-row"><span>1/2 oz (14g)</span><span class="price">$100</span></div>
            <div class="price-row"><span>1 oz (28g)</span><span class="price">$200</span></div>
            <div class="price-row"><span>Diamond oz</span><span class="price">$285</span></div>
            <div class="price-row"><span>Live Hash Rosin (1g)</span><span class="price">$40</span></div>
            <div class="pricing-features">
              <div class="pricing-feature">${iconCheck} Cured resin &amp; live hash rosin</div>
              <div class="pricing-feature">${iconCheck} In-house extraction</div>
              <div class="pricing-feature">${iconCheck} Lab tested</div>
            </div>
            <a href="/products/extracts" class="btn btn-primary pricing-card-cta">View Extracts Menu</a>
          </div>
        </div>

        <!-- Edibles -->
        <div class="pricing-card">
          <div class="pricing-card-header gradient-cbd">
            <h3>Edibles &amp; CBD</h3>
            <p>Lab tested edibles &amp; CBD</p>
          </div>
          <div class="pricing-card-body">
            <div class="pricing-notice">
              <p>Edible and CBD pricing varies by product. Visit us in-store for current selection and pricing, or call for details.</p>
            </div>
            <div class="pricing-features" style="margin-top:1.5rem;">
              <div class="pricing-feature">${iconCheck} Lab tested dosing</div>
              <div class="pricing-feature">${iconCheck} Multiple formats</div>
              <div class="pricing-feature">${iconCheck} CBD options available</div>
            </div>
            <a href="/products/cbd" class="btn btn-primary pricing-card-cta">Learn About CBD</a>
          </div>
        </div>
      </div>

      <div class="pricing-cta reveal" style="text-align:center;margin-top:4rem;">
        <p class="section-desc" style="margin:0 auto 1.5rem;">Pricing may vary. Visit either location or call for the most current pricing and daily specials.</p>
        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
          <a href="tel:+12125557734" class="btn btn-outline">Call Vandelay Plaza</a>
          <a href="tel:+15615554523" class="btn btn-outline">Call Del Boca Vista</a>
        </div>
      </div>
    </div>
  </section>`
}
