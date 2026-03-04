import { arrowRight } from '../components/icons.js'

export function flowerPage() {
  return `
  <section class="page-hero page-hero-flower">
    <div class="page-hero-content">
      <span class="section-label reveal">Products</span>
      <h1 class="page-hero-title reveal">Premium Cannabis Flower</h1>
      <p class="page-hero-sub reveal">At Coin Slot, we offer the highest quality and most exclusive strains grown by our in-house cultivation team, sold at the lowest cost to you.</p>
    </div>
  </section>

  <div class="photo-strip">
    <div class="photo-strip-track">
      <div class="photo-strip-item"><img src="/images/flower-closeup.webp" alt="Premium flower" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/trichome-detail.webp" alt="Trichome detail" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/cannabis-macro-1.webp" alt="Crystal macro" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/crystal-detail.webp" alt="Frosty trichomes" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/cannabis-macro-2.webp" alt="Trichome stalks" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/trichome-macro.webp" alt="Purple calyx" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/flower-closeup.webp" alt="Premium flower" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/trichome-detail.webp" alt="Trichome detail" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/cannabis-macro-1.webp" alt="Crystal macro" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/crystal-detail.webp" alt="Frosty trichomes" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/cannabis-macro-2.webp" alt="Trichome stalks" loading="lazy"/></div>
      <div class="photo-strip-item"><img src="/images/trichome-macro.webp" alt="Purple calyx" loading="lazy"/></div>
    </div>
  </div>

  <section class="section" style="background:var(--dark-mid);">
    <div class="container">
      <div class="menu-section reveal">
        <h2 class="section-title" style="text-align:center;">Flower Menus</h2>
        <p class="section-desc" style="text-align:center;margin:0 auto 1.5rem;">Current strain availability for each location. Menus are updated regularly.</p>
        <div class="menu-pricing-quick reveal">
          <span>1/8 oz <strong>$20</strong></span>
          <span class="pricing-dot"></span>
          <span>1/4 oz <strong>$40</strong></span>
          <span class="pricing-dot"></span>
          <span>1/2 oz <strong>$75</strong></span>
          <span class="pricing-dot"></span>
          <span>1 oz <strong>$140</strong></span>
        </div>
      </div>

      <div class="menu-tabs reveal">
        <button class="menu-tab active" data-tab="raymond">Vandelay Plaza</button>
        <button class="menu-tab" data-tab="mechfalls">Del Boca Vista</button>
      </div>

      <div class="menu-content">
        <!-- VANDELAY PLAZA MENU -->
        <div class="menu-panel active" id="tab-raymond">
          <div class="menu-card reveal">
            <div class="menu-card-header">
              <h3>Vandelay Plaza Flower Menu</h3>
              <span class="menu-updated">Updated regularly</span>
            </div>
            <div class="menu-notice">
              <p>Menus change frequently based on harvest cycles. Call <strong>(212) 555-7734</strong> for the latest selection.</p>
            </div>
            <div class="strain-grid">
              ${strain('Festivus Kush', 'OG Kush x Northern Lights', 'Indica Dominant', '28')}
              ${strain('Serenity Now', 'Blue Dream x GDP', 'Hybrid', '24')}
              ${strain('The Opposite', 'Sour Diesel x Jack Herer', 'Sativa', '26')}
              ${strain('Mulva\u2019s Secret', 'Girl Scout Cookies x Zkittlez', 'Hybrid', '23')}
              ${strain('Marine Biologist', 'Purple Punch x Gelato', 'Indica', '30')}
              ${strain('Summer of George', 'Maui Wowie x Green Crack', 'Sativa Dominant', '22')}
              ${strain('Kramerica OG', 'Wedding Cake x Runtz', 'Indica Dominant', '27')}
              ${strain('Yada Yada Yada', 'Gelato x Biscotti', 'Hybrid', '25')}
              ${strain('No Soup For You', 'Ice Cream Cake x GMO', 'Indica', '29')}
              ${strain('The Vault', 'GG4 x Sunset Sherbert', 'Hybrid', '26')}
              ${strain('Mandelbaum!', 'Bruce Banner x Hulkberry', 'Sativa Dominant', '31')}
              ${strain('Marble Rye', 'Cheese x Purple Kush', 'Indica Dominant', '24')}
              ${strain('Jerk Store', 'Mimosa x Tangie', 'Sativa', '23')}
              ${strain('Pretzels Making Me Thirsty', 'Lemon Haze x Super Silver Haze', 'Sativa Dominant', '25')}
              ${strain('Art Vandelay', 'Zkittlez x Gelato', 'Hybrid', '27')}
              ${strain('Worlds Are Colliding', 'Blue Zushi x Cadillac Rainbow', 'Indica Dominant', '29')}
              ${strain('The Jimmy Legs', 'Durban Poison x Trainwreck', 'Sativa', '22')}
              ${strain('Shrinkage', 'Blue Cheese x Blueberry', 'Indica', '26')}
              ${strain('Master of My Domain', 'Headband x Larry OG', 'Hybrid', '28')}
              ${strain('Double Dip', 'Cherry Pie x Dosidos', 'Indica Dominant', '25')}
            </div>
            <div class="weekly-deals reveal">
              <h4>Weekly Ounce Deals</h4>
              <div class="deals-grid">
                <div class="deal-card">
                  <span class="deal-price">$100</span>
                  <strong>The Human Fund</strong>
                  <span>Northern Lights x Afghani</span>
                  <span class="deal-type">Indica THC: 24%</span>
                </div>
                <div class="deal-card">
                  <span class="deal-price">$90</span>
                  <strong>Tippy Toe</strong>
                  <span>Lemon Tree x Gelato</span>
                  <span class="deal-type">Sativa Dominant THC: 22%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- DEL BOCA VISTA MENU -->
        <div class="menu-panel" id="tab-mechfalls">
          <div class="menu-card reveal">
            <div class="menu-card-header">
              <h3>Del Boca Vista Flower Menu</h3>
              <span class="menu-updated">Updated regularly</span>
            </div>
            <div class="menu-notice">
              <p>Strain availability varies by location. Call <strong>(561) 555-4523</strong> for current selection.</p>
            </div>
            <div class="strain-grid">
              ${strain('Costanza Confidential', 'Peanut Butter Breath x Mochi', 'Indica', '27')}
              ${strain('Newman\u2019s Revenge', 'Gorilla Glue x White Widow', 'Hybrid', '26')}
              ${strain('The Drake', 'Wedding Crasher x Animal Cookies', 'Hybrid', '24')}
              ${strain('Bubble Boy', 'Bubble Gum x Pink Kush', 'Indica Dominant', '23')}
              ${strain('The Moops', 'MAC x Ice Cream Cake', 'Hybrid', '28')}
              ${strain('Soup Nazi Special', 'Runtz x Jealousy', 'Indica', '30')}
              ${strain('George Likes Spicy', 'Ghost Train Haze x Chemdawg', 'Sativa', '29')}
              ${strain('Elaine\u2019s Dance', 'Tangie x Clementine', 'Sativa Dominant', '21')}
              ${strain('J. Peterman Reserve', 'LA Confidential x Hindu Kush', 'Indica', '25')}
              ${strain('Assman OG', 'Death Star x Skywalker OG', 'Indica Dominant', '28')}
              ${strain('The Contest', 'Forbidden Fruit x Grape Ape', 'Hybrid', '24')}
              ${strain('Puddy\u2019s Paint', 'Sherbet x Jealousy', 'Indica Dominant', '26')}
              ${strain('Close Talker', 'Super Lemon Haze x Green Crack', 'Sativa', '23')}
              ${strain('Bro Code', 'OG Kush x SFV OG', 'Indica Dominant', '27')}
              ${strain('The Airing of Grievances', 'Sour Tangie x Strawberry Cough', 'Sativa Dominant', '22')}
              ${strain('Independent George', 'Gelato 41 x Zushi', 'Hybrid', '26')}
              ${strain('Low Talker', 'Purple Punch x Do-Si-Dos', 'Indica', '25')}
              ${strain('Rochelle Rochelle', 'Tropicana Cookies x Mango Haze', 'Sativa Dominant', '23')}
              ${strain('Fusilli Jerry', 'MAC x Gelato 33', 'Hybrid', '27')}
              ${strain('Golden Boy', 'Gold Leaf x Acapulco Gold', 'Sativa', '24')}
            </div>
            <div class="weekly-deals reveal">
              <h4>Weekly Ounce Deals</h4>
              <div class="deals-grid">
                <div class="deal-card">
                  <span class="deal-price">$90</span>
                  <strong>The Penske File</strong>
                  <span>Wedding Cake x Biscotti</span>
                  <span class="deal-type">Hybrid THC: 25%</span>
                </div>
                <div class="deal-card">
                  <span class="deal-price">$100</span>
                  <strong>Seven Costanza</strong>
                  <span>Sunset Sherbert x Zkittlez</span>
                  <span class="deal-type">Indica Dominant THC: 26%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="product-nav reveal" style="margin-top:3rem;">
        <a href="/products" class="product-nav-link">All Products</a>
        <a href="/products/extracts" class="product-nav-link">Extracts & Concentrates ${arrowRight}</a>
      </div>
    </div>
  </section>

`
}

function strain(name, genetics, type, thc) {
  return `
  <div class="strain-item">
    <div class="strain-info">
      <strong class="strain-name">${name}</strong>
      <span class="strain-genetics">${genetics}</span>
    </div>
    <div class="strain-meta">
      <span class="strain-type">${type}</span>
      <span class="strain-thc">THC: ${thc}%</span>
    </div>
  </div>`
}
