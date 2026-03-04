import { arrowRight } from '../components/icons.js'

export function merchandisePage() {
  return `
  <section class="page-hero page-hero-merch">
    <div class="page-hero-content">
      <span class="section-label reveal">Products</span>
      <h1 class="page-hero-title reveal">Merchandise</h1>
      <p class="page-hero-sub reveal">Rep the Coin Slot brand with our signature retro-nostalgic apparel and accessories.</p>
    </div>
  </section>

  <section class="section" style="background:var(--dark-mid);">
    <div class="container" style="text-align:center;">
      <div class="merch-content reveal">
        <h2 class="section-title">Shop Our Collection</h2>
        <p class="section-desc" style="margin:0 auto 2rem;">Gold coin motifs, retro-nostalgic vibes, and iconic references straight from the Coin Slot universe. Our merchandise captures the same attention to detail we put into every strain we grow.</p>
        <p class="section-desc" style="margin:0 auto 2.5rem;">Apparel, hats, stickers, and accessories are available at both locations. Stop by and find your new favorite piece.</p>
        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
          <a href="/contact" class="btn btn-primary">Find a Location</a>
          <a href="/products" class="btn btn-outline">All Products</a>
        </div>
      </div>

      <div class="product-nav reveal" style="margin-top:4rem;">
        <a href="/products/cbd" class="product-nav-link">${arrowRight} CBD</a>
        <a href="/products" class="product-nav-link">All Products ${arrowRight}</a>
      </div>
    </div>
  </section>`
}
