import { arrowRight, iconCheck } from '../components/icons.js'

export function cbdPage() {
  return `
  <section class="page-hero page-hero-cbd">
    <div class="page-hero-content">
      <span class="section-label reveal">Products</span>
      <h1 class="page-hero-title reveal">CBD</h1>
      <p class="page-hero-sub reveal">Natural relief from various ailments without psychoactive effects. Cannabidiol for wellness, balance, and healing.</p>
    </div>
  </section>

  <section class="section" style="background:var(--dark-mid);">
    <div class="container">
      <div class="cbd-content">
        <div class="cbd-main reveal">
          <h2 class="section-title">What is CBD?</h2>
          <p class="section-desc" style="max-width:100%;">Cannabidiol (CBD) is a naturally occurring compound found in the cannabis plant. Unlike THC, CBD does not produce psychoactive effects, making it an excellent option for customers seeking natural relief without the high.</p>
          <p class="section-desc" style="max-width:100%;margin-top:1.5rem;">CBD is available in topical, oil, and other consumable forms. Our team can help you find the right product and dosage for your specific needs.</p>
        </div>

        <div class="cbd-benefits-grid" style="margin-top:3rem;">
          <div class="benefit-card reveal reveal-delay-1">
            <div class="benefit-icon">${iconCheck}</div>
            <h3>Pain Management</h3>
            <p>Natural relief for chronic pain conditions without the side effects of traditional pharmaceuticals.</p>
          </div>
          <div class="benefit-card reveal reveal-delay-2">
            <div class="benefit-icon">${iconCheck}</div>
            <h3>Anxiety &amp; Stress</h3>
            <p>Clinically studied for reducing anxiety and promoting calm, balanced mental states.</p>
          </div>
          <div class="benefit-card reveal reveal-delay-3">
            <div class="benefit-icon">${iconCheck}</div>
            <h3>Neuroprotective</h3>
            <p>Research suggests CBD may support brain health and has neuroprotective properties.</p>
          </div>
          <div class="benefit-card reveal reveal-delay-4">
            <div class="benefit-icon">${iconCheck}</div>
            <h3>Seizure Disorders</h3>
            <p>FDA-approved CBD medications exist for epilepsy and other seizure disorders.</p>
          </div>
        </div>

        <div class="menu-notice reveal" style="margin-top:3rem;">
          <p>For current CBD product availability and pricing, visit us in-store or call <strong>(212) 555-7734</strong> (Vandelay Plaza) or <strong>(561) 555-4523</strong> (Del Boca Vista).</p>
        </div>
      </div>

      <div class="product-nav reveal" style="margin-top:3rem;">
        <a href="/products/extracts" class="product-nav-link">${arrowRight} Extracts & Concentrates</a>
        <a href="/products/merchandise" class="product-nav-link">Merchandise ${arrowRight}</a>
      </div>
    </div>
  </section>`
}
