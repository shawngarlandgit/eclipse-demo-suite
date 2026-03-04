import { arrowRight } from '../components/icons.js'

export function extractsPage() {
  return `
  <section class="page-hero page-hero-extracts">
    <div class="page-hero-content">
      <span class="section-label reveal">Products</span>
      <h1 class="page-hero-title reveal">Extracts &amp; Concentrates</h1>
      <p class="page-hero-sub reveal">Premium concentrates extracted from our in-house flower for maximum purity, potency, and flavor.</p>
    </div>
  </section>

  <div class="photo-strip">
    <div class="photo-strip-track">
      <div class="photo-strip-item"><img src="/images/trichome-macro.webp" alt="Trichome calyx" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/cannabis-macro-2.webp" alt="Trichome stalks" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/crystal-detail.webp" alt="Crystal detail" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/cannabis-macro-1.webp" alt="Macro trichomes" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/trichome-detail.webp" alt="Dense bud" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/flower-closeup.webp" alt="Premium flower" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/trichome-macro.webp" alt="Trichome calyx" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/cannabis-macro-2.webp" alt="Trichome stalks" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/crystal-detail.webp" alt="Crystal detail" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/cannabis-macro-1.webp" alt="Macro trichomes" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/trichome-detail.webp" alt="Dense bud" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/flower-closeup.webp" alt="Premium flower" loading="lazy"/></div>
    </div>
  </div>

  <section class="section" style="background:var(--dark-mid);">
    <div class="container">
      <div class="menu-section reveal">
        <h2 class="section-title" style="text-align:center;">Cured Resin Menus</h2>
        <p class="section-desc" style="text-align:center;margin:0 auto 1.5rem;">Current concentrate availability for each location. Menus updated regularly.</p>
        <div class="menu-pricing-quick reveal">
          <span>1g <strong>$10</strong></span>
          <span class="pricing-dot"></span>
          <span>3.5g <strong>$30</strong></span>
          <span class="pricing-dot"></span>
          <span>14g <strong>$100</strong></span>
          <span class="pricing-dot"></span>
          <span>1 oz <strong>$200</strong></span>
        </div>
      </div>

      <div class="menu-tabs reveal">
        <button class="menu-tab active" data-tab="raymond">Vandelay Plaza</button>
        <button class="menu-tab" data-tab="mechfalls">Del Boca Vista</button>
      </div>

      <div class="menu-content">
        <!-- VANDELAY PLAZA CURED RESIN -->
        <div class="menu-panel active" id="tab-raymond">
          <div class="menu-card reveal">
            <div class="menu-card-header">
              <h3>Vandelay Plaza Cured Resin</h3>
              <span class="menu-updated">Updated regularly</span>
            </div>
            <div class="menu-notice">
              <p>Selection rotates based on production. Call <strong>(212) 555-7734</strong> for current availability.</p>
            </div>

            <!-- 1 GRAM -->
            <div class="menu-tier-header">1 Gram</div>
            <div class="strain-grid">
              ${cs('Festivus Kush', 'OG Kush x Northern Lights', 'Indica Dominant', '28')}
              ${cs('Serenity Now', 'Blue Dream x GDP', 'Hybrid', '24')}
              ${cs('The Opposite', 'Sour Diesel x Jack Herer', 'Sativa', '26')}
              ${cs('Marine Biologist', 'Purple Punch x Gelato', 'Indica', '30')}
              ${cs('Kramerica OG', 'Wedding Cake x Runtz', 'Indica Dominant', '27')}
              ${cs('Yada Yada Yada', 'Gelato x Biscotti', 'Hybrid', '25')}
              ${cs('No Soup For You', 'Ice Cream Cake x GMO', 'Indica', '29')}
              ${cs('The Vault', 'GG4 x Sunset Sherbert', 'Hybrid', '26')}
              ${cs('Marble Rye', 'Cheese x Purple Kush', 'Indica Dominant', '24')}
              ${cs('Jerk Store', 'Mimosa x Tangie', 'Sativa', '23')}
              ${cs('Art Vandelay', 'Zkittlez x Gelato', 'Hybrid', '27')}
              ${cs('Shrinkage', 'Blue Cheese x Blueberry', 'Indica', '26')}
              ${cs('Double Dip', 'Cherry Pie x Dosidos', 'Indica Dominant', '25')}
            </div>

            <!-- 3.5 GRAMS -->
            <div class="menu-tier-header">3.5 Grams</div>
            <div class="strain-grid">
              ${cs('Serenity Now', 'Blue Dream x GDP', 'Hybrid', '24')}
              ${cs('Mulva\u2019s Secret', 'Girl Scout Cookies x Zkittlez', 'Hybrid', '23')}
              ${cs('Summer of George', 'Maui Wowie x Green Crack', 'Sativa Dominant', '22')}
              ${cs('Mandelbaum!', 'Bruce Banner x Hulkberry', 'Sativa Dominant', '31')}
              ${cs('Pretzels Making Me Thirsty', 'Lemon Haze x Super Silver Haze', 'Sativa Dominant', '25')}
              ${cs('Worlds Are Colliding', 'Blue Zushi x Cadillac Rainbow', 'Indica Dominant', '29')}
              ${cs('The Jimmy Legs', 'Durban Poison x Trainwreck', 'Sativa', '22')}
              ${cs('Master of My Domain', 'Headband x Larry OG', 'Hybrid', '28')}
              ${cs('The Vault', 'GG4 x Sunset Sherbert', 'Hybrid', '26')}
              ${cs('Marine Biologist', 'Purple Punch x Gelato', 'Indica', '30')}
              ${cs('No Soup For You', 'Ice Cream Cake x GMO', 'Indica', '29')}
              ${cs('Art Vandelay', 'Zkittlez x Gelato', 'Hybrid', '27')}
              ${cs('Festivus Kush', 'OG Kush x Northern Lights', 'Indica Dominant', '28')}
            </div>

            <!-- LIVE HASH ROSIN -->
            <div class="menu-tier-header">Live Hash Rosin <span class="tier-price">1 Gram — $40</span></div>
            <div class="strain-grid">
              ${cs('The Merv Griffin Show', '', 'Hybrid', '')}
              ${cs('Urban Sombrero', '', 'Indica', '')}
            </div>

            <!-- 1 OUNCE -->
            <div class="menu-tier-header">1 Ounce — 28g</div>
            <div class="strain-grid">
              ${cs('Shrinkage', 'Blue Cheese x Blueberry', 'Indica', '26')}
            </div>

            <div class="menu-legend">
              <span><strong>PURPLE</strong> = Indica</span>
              <span><strong>GREEN</strong> = Hybrid</span>
              <span><strong>ORANGE</strong> = Sativa</span>
            </div>
          </div>
        </div>

        <!-- DEL BOCA VISTA CURED RESIN -->
        <div class="menu-panel" id="tab-mechfalls">
          <div class="menu-card reveal">
            <div class="menu-card-header">
              <h3>Del Boca Vista Cured Resin</h3>
              <span class="menu-updated">Updated regularly</span>
            </div>
            <div class="menu-notice">
              <p>Selection varies by location. Call <strong>(561) 555-4523</strong> for what's in stock.</p>
            </div>

            <!-- 1 GRAM -->
            <div class="menu-tier-header">1 Gram</div>
            <div class="strain-grid">
              ${cs('Costanza Confidential', 'Peanut Butter Breath x Mochi', 'Indica', '27')}
              ${cs('Newman\u2019s Revenge', 'Gorilla Glue x White Widow', 'Hybrid', '26')}
              ${cs('The Drake', 'Wedding Crasher x Animal Cookies', 'Hybrid', '24')}
              ${cs('Bubble Boy', 'Bubble Gum x Pink Kush', 'Indica Dominant', '23')}
              ${cs('The Moops', 'MAC x Ice Cream Cake', 'Hybrid', '28')}
              ${cs('Soup Nazi Special', 'Runtz x Jealousy', 'Indica', '30')}
              ${cs('George Likes Spicy', 'Ghost Train Haze x Chemdawg', 'Sativa', '29')}
              ${cs('J. Peterman Reserve', 'LA Confidential x Hindu Kush', 'Indica', '25')}
              ${cs('Assman OG', 'Death Star x Skywalker OG', 'Indica Dominant', '28')}
              ${cs('The Contest', 'Forbidden Fruit x Grape Ape', 'Hybrid', '24')}
              ${cs('Puddy\u2019s Paint', 'Sherbet x Jealousy', 'Indica Dominant', '26')}
              ${cs('Close Talker', 'Super Lemon Haze x Green Crack', 'Sativa', '23')}
              ${cs('Bro Code', 'OG Kush x SFV OG', 'Indica Dominant', '27')}
              ${cs('Independent George', 'Gelato 41 x Zushi', 'Hybrid', '26')}
              ${cs('Fusilli Jerry', 'MAC x Gelato 33', 'Hybrid', '27')}
              ${cs('Golden Boy', 'Gold Leaf x Acapulco Gold', 'Sativa', '24')}
              ${cs('Low Talker', 'Purple Punch x Do-Si-Dos', 'Indica', '25')}
            </div>

            <!-- 3.5 GRAMS -->
            <div class="menu-tier-header">3.5 Grams</div>
            <div class="strain-grid">
              ${cs('Costanza Confidential', 'Peanut Butter Breath x Mochi', 'Indica', '27')}
              ${cs('Newman\u2019s Revenge', 'Gorilla Glue x White Widow', 'Hybrid', '26')}
              ${cs('Soup Nazi Special', 'Runtz x Jealousy', 'Indica', '30')}
              ${cs('Elaine\u2019s Dance', 'Tangie x Clementine', 'Sativa Dominant', '21')}
              ${cs('The Airing of Grievances', 'Sour Tangie x Strawberry Cough', 'Sativa Dominant', '22')}
              ${cs('Rochelle Rochelle', 'Tropicana Cookies x Mango Haze', 'Sativa Dominant', '23')}
              ${cs('The Moops', 'MAC x Ice Cream Cake', 'Hybrid', '28')}
              ${cs('Assman OG', 'Death Star x Skywalker OG', 'Indica Dominant', '28')}
              ${cs('The Contest', 'Forbidden Fruit x Grape Ape', 'Hybrid', '24')}
              ${cs('Puddy\u2019s Paint', 'Sherbet x Jealousy', 'Indica Dominant', '26')}
              ${cs('Bro Code', 'OG Kush x SFV OG', 'Indica Dominant', '27')}
              ${cs('Independent George', 'Gelato 41 x Zushi', 'Hybrid', '26')}
              ${cs('Bubble Boy', 'Bubble Gum x Pink Kush', 'Indica Dominant', '23')}
              ${cs('George Likes Spicy', 'Ghost Train Haze x Chemdawg', 'Sativa', '29')}
              ${cs('Fusilli Jerry', 'MAC x Gelato 33', 'Hybrid', '27')}
              ${cs('Golden Boy', 'Gold Leaf x Acapulco Gold', 'Sativa', '24')}
              ${cs('J. Peterman Reserve', 'LA Confidential x Hindu Kush', 'Indica', '25')}
            </div>
          </div>
        </div>
      </div>

      <div class="product-nav reveal" style="margin-top:3rem;">
        <a href="/products/flower" class="product-nav-link">${arrowRight} Premium Cannabis Flower</a>
        <a href="/products/cbd" class="product-nav-link">CBD ${arrowRight}</a>
      </div>
    </div>
  </section>

`
}

function cs(name, genetics, type, thc) {
  const thcDisplay = thc ? `THC: ${thc}%` : ''
  const geneticsDisplay = genetics ? `<span class="strain-genetics">${genetics}</span>` : ''
  return `
  <div class="strain-item">
    <div class="strain-info">
      <strong class="strain-name">${name}</strong>
      ${geneticsDisplay}
    </div>
    <div class="strain-meta">
      <span class="strain-type">${type}</span>
      <span class="strain-thc">${thcDisplay}</span>
    </div>
  </div>`
}
