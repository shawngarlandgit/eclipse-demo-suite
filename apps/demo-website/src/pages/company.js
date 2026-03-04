import { iconStar, iconBook, iconHeart, iconLeaf } from '../components/icons.js'
import { renderLocationsSection } from '../components/locations.js'

export function companyPage() {
  return `
  <section class="page-hero page-hero-company">
    <div class="page-hero-content">
      <span class="section-label reveal">About Us</span>
      <h1 class="page-hero-title reveal">Coin Slot Cannabis</h1>
      <p class="page-hero-sub reveal">With a passion for premium cannabis and pop culture, our team is dedicated to crafting the finest recreational cannabis experience.</p>
    </div>
  </section>

  <section class="section" style="background:var(--dark-mid);">
    <div class="container">
      <div class="company-content">
        <div class="company-main reveal">
          <h2 class="section-title">Our Mission</h2>
          <p class="section-desc" style="max-width:100%;">Coin Slot Cannabis is dedicated to crafting the finest recreational cannabis experience. We believe in quality, community, and a little bit of luck with every visit.</p>
          <p class="section-desc" style="max-width:100%;margin-top:1.5rem;">We believe that premium recreational cannabis can elevate your day. From our two locations, we combine deep botanical knowledge with genuine care for every customer who walks through our doors. Every strain is cultivated in-house, every product is tested, and every interaction is guided by our commitment to your satisfaction.</p>
        </div>

        <div class="photo-showcase reveal" style="margin-top:3rem;">
          <div class="photo-showcase-grid">
            <div class="photo-showcase-item photo-showcase-tall">
              <img src="/images/flower-closeup.webp" alt="Premium cannabis bud" loading="lazy"/>
              <div class="photo-showcase-overlay"><span>In-House Cultivation</span></div>
            </div>
            <div class="photo-showcase-item">
              <img src="/images/cannabis-macro-2.webp" alt="Trichome stalks macro" loading="lazy"/>
              <div class="photo-showcase-overlay"><span>Trichome Detail</span></div>
            </div>
            <div class="photo-showcase-item">
              <img src="/images/crystal-detail.webp" alt="Crystal trichomes" loading="lazy"/>
              <div class="photo-showcase-overlay"><span>Premium Quality</span></div>
            </div>
            <div class="photo-showcase-item">
              <img src="/images/trichome-macro.webp" alt="Trichome covered calyx" loading="lazy"/>
              <div class="photo-showcase-overlay"><span>Lab Tested</span></div>
            </div>
            <div class="photo-showcase-item">
              <img src="/images/trichome-detail.webp" alt="Dense trichome bud" loading="lazy"/>
              <div class="photo-showcase-overlay"><span>Hand Trimmed</span></div>
            </div>
          </div>
        </div>

        <div class="about-values" style="margin-top:3rem;">
          <div class="value-card reveal reveal-delay-1">
            <div class="value-icon-lg vi-1">${iconStar}</div>
            <h3>Quality First</h3>
            <p>Small-batch cultivation with meticulous attention to every plant. We never cut corners — from genetics selection to cure, every step matters.</p>
          </div>
          <div class="value-card reveal reveal-delay-2">
            <div class="value-icon-lg vi-2">${iconBook}</div>
            <h3>Deep Expertise</h3>
            <p>Our budtenders don't just sell cannabis — they understand it. Combined growing and consulting experience guides every recommendation.</p>
          </div>
          <div class="value-card reveal reveal-delay-3">
            <div class="value-icon-lg vi-3">${iconHeart}</div>
            <h3>Customer Care</h3>
            <p>Every customer is unique. We take the time to understand your needs, preferences, and goals to find the perfect product for you.</p>
          </div>
          <div class="value-card reveal reveal-delay-4">
            <div class="value-icon-lg vi-4">${iconLeaf}</div>
            <h3>Sustainability</h3>
            <p>We practice responsible cultivation that respects the land and community we're proud to be part of.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="wave-divider wave-divider-flipped"><svg viewBox="0 0 1440 100" preserveAspectRatio="none"><path d="M0,0 C480,100 960,20 1440,60 L1440,100 L0,100 Z" fill="var(--dark-mid)"/></svg></div>
  ${renderLocationsSection()}

  <section class="cta-banner">
    <div class="cta-content">
      <span class="section-label reveal">Visit Us</span>
      <h2 class="section-title reveal">Come Say Hello</h2>
      <p class="cta-desc reveal">Stop by either location and let our team help you find exactly what you're looking for.</p>
      <div class="cta-buttons reveal">
        <a href="/contact" class="btn btn-light">Contact Us</a>
        <a href="/products" class="btn btn-ghost">View Products</a>
      </div>
    </div>
  </section>`
}
