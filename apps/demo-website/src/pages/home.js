import { coinSlotLogoAnimated, iconChevronDown, arrowRight, iconStar, iconBook, iconHeart, iconLeaf } from '../components/icons.js'
import { renderLocationsSection } from '../components/locations.js'

export function homePage() {
  return `
  <!-- HERO -->
  <section class="hero">
    <div class="cloud cloud-1"></div>
    <div class="cloud cloud-2"></div>
    <div class="cloud cloud-3"></div>
    <div class="cloud cloud-4"></div>
    <!-- Layered landscape -->
    <div class="hero-landscape">
      <!-- Far hills (most transparent, behind everything) -->
      <svg class="landscape-layer landscape-far" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="none">
        <path d="M0,280 Q120,200 240,240 Q360,180 480,220 Q600,160 720,210 Q840,170 960,230 Q1080,180 1200,220 Q1320,190 1440,250 L1440,320 L0,320 Z" fill="rgba(74,26,107,0.2)"/>
      </svg>
      <!-- Mid pine tree layer -->
      <svg class="landscape-layer landscape-mid" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="none">
        <path d="M0,300 Q200,250 400,270 Q600,240 800,260 Q1000,230 1200,260 Q1350,245 1440,270 L1440,320 L0,320 Z" fill="rgba(74,26,107,0.25)"/>
        <!-- Distant trees (small, spaced) -->
        <path d="M60,268 L68,220 L72,240 L78,195 L82,230 L86,210 L92,268 Z" fill="rgba(74,26,107,0.3)"/>
        <path d="M150,260 L157,215 L161,235 L165,190 L169,225 L175,260 Z" fill="rgba(74,26,107,0.28)"/>
        <path d="M280,265 L287,225 L291,242 L296,200 L300,235 L305,265 Z" fill="rgba(74,26,107,0.32)"/>
        <path d="M420,260 L427,210 L432,235 L436,185 L440,225 L446,260 Z" fill="rgba(74,26,107,0.27)"/>
        <path d="M560,255 L566,205 L570,230 L575,180 L580,220 L586,255 Z" fill="rgba(74,26,107,0.3)"/>
        <path d="M680,258 L687,212 L691,233 L696,188 L701,228 L707,258 Z" fill="rgba(74,26,107,0.28)"/>
        <path d="M820,252 L827,200 L832,225 L837,178 L842,218 L848,252 Z" fill="rgba(74,26,107,0.31)"/>
        <path d="M960,258 L967,208 L971,232 L976,185 L981,224 L987,258 Z" fill="rgba(74,26,107,0.29)"/>
        <path d="M1100,255 L1107,205 L1111,228 L1116,182 L1121,222 L1127,255 Z" fill="rgba(74,26,107,0.3)"/>
        <path d="M1240,260 L1247,215 L1251,238 L1256,192 L1261,230 L1267,260 Z" fill="rgba(74,26,107,0.28)"/>
        <path d="M1360,265 L1367,218 L1371,240 L1376,198 L1381,232 L1387,265 Z" fill="rgba(74,26,107,0.32)"/>
      </svg>
      <!-- Foreground treeline (darkest, most detailed) -->
      <svg class="landscape-layer landscape-near" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="none">
        <!-- Rolling ground -->
        <path d="M0,295 Q100,275 200,285 Q350,270 500,280 Q650,265 800,278 Q950,268 1100,280 Q1250,270 1350,282 Q1400,276 1440,285 L1440,320 L0,320 Z" fill="rgba(55,20,80,0.5)"/>
        <!-- Detailed spruce trees - left cluster -->
        <path d="M30,285 L36,265 L32,268 L37,248 L33,252 L38,230 L34,234 L39,210 L35,216 L42,175 L49,216 L45,210 L50,234 L46,230 L51,252 L47,248 L52,268 L48,265 L54,285 Z" fill="rgba(55,20,80,0.65)"/>
        <path d="M65,285 L72,260 L68,264 L74,238 L70,243 L76,215 L72,220 L80,170 L88,220 L84,215 L90,243 L86,238 L92,264 L88,260 L95,285 Z" fill="rgba(55,20,80,0.6)"/>
        <path d="M105,285 L110,262 L107,265 L112,242 L109,246 L114,222 L111,226 L116,195 L123,226 L120,222 L125,246 L122,242 L127,265 L124,262 L130,285 Z" fill="rgba(55,20,80,0.55)"/>
        <path d="M148,285 L155,255 L151,259 L157,230 L153,235 L160,200 L156,206 L163,158 L170,206 L166,200 L173,235 L169,230 L175,259 L171,255 L178,285 Z" fill="rgba(55,20,80,0.62)"/>
        <path d="M195,285 L200,268 L197,270 L203,250 L200,253 L206,228 L203,232 L208,205 L213,232 L210,228 L216,253 L213,250 L219,270 L216,268 L222,285 Z" fill="rgba(55,20,80,0.5)"/>
        <!-- Right cluster -->
        <path d="M1120,280 L1127,252 L1123,256 L1130,225 L1126,230 L1133,195 L1129,200 L1136,155 L1143,200 L1139,195 L1146,230 L1142,225 L1149,256 L1145,252 L1152,280 Z" fill="rgba(55,20,80,0.62)"/>
        <path d="M1165,280 L1170,260 L1167,263 L1173,240 L1170,244 L1176,218 L1173,222 L1178,190 L1185,222 L1182,218 L1188,244 L1185,240 L1191,263 L1188,260 L1194,280 Z" fill="rgba(55,20,80,0.58)"/>
        <path d="M1210,282 L1216,258 L1213,261 L1219,235 L1216,239 L1222,210 L1219,215 L1225,172 L1232,215 L1229,210 L1235,239 L1232,235 L1238,261 L1235,258 L1242,282 Z" fill="rgba(55,20,80,0.65)"/>
        <path d="M1262,280 L1268,255 L1265,258 L1271,232 L1268,236 L1275,205 L1272,210 L1278,165 L1285,210 L1282,205 L1288,236 L1285,232 L1291,258 L1288,255 L1295,280 Z" fill="rgba(55,20,80,0.55)"/>
        <path d="M1320,282 L1326,260 L1323,263 L1329,238 L1326,242 L1332,212 L1329,217 L1335,178 L1342,217 L1339,212 L1345,242 L1342,238 L1348,263 L1345,260 L1352,282 Z" fill="rgba(55,20,80,0.6)"/>
        <path d="M1370,283 L1376,265 L1373,268 L1379,245 L1376,249 L1382,222 L1379,226 L1385,195 L1392,226 L1389,222 L1395,249 L1392,245 L1398,268 L1395,265 L1402,283 Z" fill="rgba(55,20,80,0.52)"/>
        <path d="M1410,284 L1416,268 L1413,270 L1419,252 L1416,255 L1422,235 L1419,238 L1424,210 L1430,238 L1427,235 L1433,255 L1430,252 L1436,270 L1433,268 L1440,284 Z" fill="rgba(55,20,80,0.48)"/>
        <!-- Scattered center trees -->
        <path d="M500,278 L505,258 L502,261 L508,238 L505,242 L511,215 L508,220 L514,185 L520,220 L517,215 L523,242 L520,238 L526,261 L523,258 L528,278 Z" fill="rgba(55,20,80,0.45)"/>
        <path d="M620,275 L626,252 L623,256 L629,230 L626,235 L633,202 L630,208 L636,168 L643,208 L640,202 L646,235 L643,230 L649,256 L646,252 L652,275 Z" fill="rgba(55,20,80,0.4)"/>
        <path d="M780,276 L785,260 L782,262 L788,242 L785,245 L791,222 L788,226 L793,198 L799,226 L796,222 L802,245 L799,242 L805,262 L802,260 L808,276 Z" fill="rgba(55,20,80,0.42)"/>
        <path d="M920,278 L925,262 L922,264 L928,245 L925,248 L931,225 L928,228 L933,200 L939,228 L936,225 L942,248 L939,245 L945,264 L942,262 L948,278 Z" fill="rgba(55,20,80,0.38)"/>
        <path d="M1020,279 L1026,258 L1023,261 L1029,238 L1026,242 L1032,215 L1029,220 L1035,188 L1041,220 L1038,215 L1044,242 L1041,238 L1047,261 L1044,258 L1050,279 Z" fill="rgba(55,20,80,0.44)"/>
      </svg>
    </div>
    <div class="hero-logo">${coinSlotLogoAnimated}</div>
    <div class="hero-content">
      <h1 class="hero-title">Coin Slot<span>Cannabis</span></h1>
      <p class="hero-sub">Your Lucky Find. Premium recreational cannabis crafted with care and a little bit of luck with every visit.</p>
      <div class="hero-buttons">
        <a href="/products" class="btn btn-primary">Explore Products</a>
        <a href="/contact" class="btn btn-ghost">Find a Location</a>
      </div>
    </div>
    <div class="scroll-indicator">${iconChevronDown}</div>
  </section>

  <div class="wave-divider"><svg viewBox="0 0 1440 100" preserveAspectRatio="none"><path d="M0,0 C360,100 1080,0 1440,80 L1440,100 L0,100 Z" fill="var(--dark-mid)"/></svg></div>

  <!-- PRODUCTS PREVIEW -->
  <section class="section products">
    <div class="container">
      <div class="products-header reveal">
        <span class="section-label">Our Products</span>
        <h2 class="section-title">Let's Find the Right Product for You</h2>
        <p class="section-desc">The highest quality and most exclusive strains grown by our in-house cultivation team, sold at the lowest cost to you.</p>
      </div>
      <div class="products-grid products-grid-4">
        <a href="/products/flower" class="product-card reveal reveal-delay-1">
          <div class="product-card-visual product-card-photo">
            <img src="/images/flower-closeup.webp" alt="Premium cannabis flower" loading="lazy"/>
            <div class="product-card-photo-overlay gradient-flower"></div>
          </div>
          <div class="product-card-content">
            <h3 class="product-card-title">Premium Cannabis Flower</h3>
            <p class="product-card-desc">Hand-trimmed, small-batch cultivars. Rich terpene profiles from seed to sale.</p>
            <div class="product-card-arrow">Browse Strains ${arrowRight}</div>
          </div>
        </a>
        <a href="/products/extracts" class="product-card reveal reveal-delay-2">
          <div class="product-card-visual product-card-photo">
            <img src="/images/trichome-macro.webp" alt="Cannabis trichomes" loading="lazy"/>
            <div class="product-card-photo-overlay gradient-extracts"></div>
          </div>
          <div class="product-card-content">
            <h3 class="product-card-title">Extracts &amp; Concentrates</h3>
            <p class="product-card-desc">Live resin, shatter, and rosin — extracted for maximum purity and flavor.</p>
            <div class="product-card-arrow">View Extracts ${arrowRight}</div>
          </div>
        </a>
        <a href="/products/cbd" class="product-card reveal reveal-delay-3">
          <div class="product-card-visual product-card-photo">
            <img src="/images/cbd-drops.webp" alt="Serenity Now CBD Drops" loading="lazy"/>
            <div class="product-card-photo-overlay gradient-cbd"></div>
          </div>
          <div class="product-card-content">
            <h3 class="product-card-title">CBD</h3>
            <p class="product-card-desc">Pure CBD products for wellness without the high. Tinctures, topicals, and capsules.</p>
            <div class="product-card-arrow">Explore CBD ${arrowRight}</div>
          </div>
        </a>
        <a href="/products/merchandise" class="product-card reveal reveal-delay-4">
          <div class="product-card-visual product-card-photo">
            <img src="/images/merch-hoodie.webp" alt="Coin Slot Cannabis hoodie and mug" loading="lazy"/>
            <div class="product-card-photo-overlay gradient-merch"></div>
          </div>
          <div class="product-card-content">
            <h3 class="product-card-title">Merchandise</h3>
            <p class="product-card-desc">Rep the Coin Slot brand. Apparel, accessories, and gear with our signature designs.</p>
            <div class="product-card-arrow">Shop Merch ${arrowRight}</div>
          </div>
        </a>
      </div>
    </div>
  </section>

  <!-- ABOUT PREVIEW -->
  <div class="wave-divider wave-divider-flipped"><svg viewBox="0 0 1440 100" preserveAspectRatio="none"><path d="M0,0 C480,100 960,20 1440,60 L1440,100 L0,100 Z" fill="var(--dark)"/></svg></div>
  <section class="section about-section">
    <div class="container">
      <div class="about-inner">
        <div class="about-text">
          <span class="section-label reveal">Our Story</span>
          <h2 class="section-title reveal">Your Lucky Find</h2>
          <p class="section-desc reveal">With a passion for premium cannabis and pop culture, our team is dedicated to crafting the finest recreational cannabis experience. Coin Slot Cannabis believes in quality, community, and a little bit of luck with every visit.</p>
          <div class="about-values">
            <div class="value-item reveal reveal-delay-1">
              <div class="value-icon vi-1">${iconStar}</div>
              <div class="value-name">Quality</div>
              <div class="value-desc">Small-batch cultivation with meticulous attention to every plant</div>
            </div>
            <div class="value-item reveal reveal-delay-2">
              <div class="value-icon vi-2">${iconBook}</div>
              <div class="value-name">Expertise</div>
              <div class="value-desc">Knowledgeable budtenders who guide your journey</div>
            </div>
            <div class="value-item reveal reveal-delay-3">
              <div class="value-icon vi-3">${iconHeart}</div>
              <div class="value-name">Community</div>
              <div class="value-desc">Customer-first approach to wellness and good vibes</div>
            </div>
            <div class="value-item reveal reveal-delay-4">
              <div class="value-icon vi-4">${iconLeaf}</div>
              <div class="value-name">Sustainability</div>
              <div class="value-desc">Responsible growing practices rooted in the land</div>
            </div>
          </div>
          <a href="/company" class="btn btn-primary" style="margin-top:2rem;">Learn More About Us</a>
        </div>
        <div class="about-illustration reveal">
          <div class="about-photo-grid">
            <div class="about-photo about-photo-main">
              <img src="/images/flower-closeup.webp" alt="Premium cannabis flower closeup" loading="lazy"/>
            </div>
            <div class="about-photo about-photo-sm-1">
              <img src="/images/trichome-detail.webp" alt="Trichome detail" loading="lazy"/>
            </div>
            <div class="about-photo about-photo-sm-2">
              <img src="/images/cannabis-macro-1.webp" alt="Crystal trichomes macro" loading="lazy"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- LOCATIONS -->
  <div class="wave-divider"><svg viewBox="0 0 1440 100" preserveAspectRatio="none"><path d="M0,20 C300,100 600,0 900,60 C1100,90 1300,30 1440,50 L1440,100 L0,100 Z" fill="var(--dark-mid)"/></svg></div>
  ${renderLocationsSection()}

  <!-- REVIEWS -->
  <div class="wave-divider wave-divider-flipped"><svg viewBox="0 0 1440 100" preserveAspectRatio="none"><path d="M0,0 C480,100 960,20 1440,60 L1440,100 L0,100 Z" fill="var(--dark)"/></svg></div>
  <section class="section" style="background:var(--dark);">
    <div class="container" style="max-width:900px;text-align:center;">
      <span class="section-label reveal">Reviews</span>
      <h2 class="section-title reveal">What Our Customers Say</h2>
      <div class="reveal" style="display:flex;align-items:center;justify-content:center;gap:0.5rem;margin-bottom:2rem;">
        <div style="display:flex;gap:2px;">${'<svg width="20" height="20" viewBox="0 0 20 20" fill="#D4A035"><path d="M10 1l2.5 5.5L18 7.5l-4 4 1 6-5-2.8-5 2.8 1-6-4-4 5.5-1z"/></svg>'.repeat(5)}</div>
        <span style="color:var(--gold-light);font-weight:700;font-size:1.1rem;">4.8</span>
        <span style="color:var(--text-muted);font-size:0.9rem;">— 240+ Google Reviews</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.25rem;">
        <div class="reveal reveal-delay-1" style="background:var(--dark-card);border-radius:12px;padding:1.5rem;border:1px solid var(--dark-border);text-align:left;">
          <p style="color:var(--text-body);font-size:0.9rem;line-height:1.6;margin-bottom:1rem;">"Best prices in the city, hands down. The budtenders actually know their stuff and the flower is always fresh."</p>
          <div style="color:var(--text-muted);font-size:0.8rem;font-weight:600;">— Michael V.</div>
        </div>
        <div class="reveal reveal-delay-2" style="background:var(--dark-card);border-radius:12px;padding:1.5rem;border:1px solid var(--dark-border);text-align:left;">
          <p style="color:var(--text-body);font-size:0.9rem;line-height:1.6;margin-bottom:1rem;">"The loyalty program is legit. I've saved so much. Love the Wax Wednesday deals — you can't beat the concentrate prices here."</p>
          <div style="color:var(--text-muted);font-size:0.8rem;font-weight:600;">— Sarah K.</div>
        </div>
        <div class="reveal reveal-delay-3" style="background:var(--dark-card);border-radius:12px;padding:1.5rem;border:1px solid var(--dark-border);text-align:left;">
          <p style="color:var(--text-body);font-size:0.9rem;line-height:1.6;margin-bottom:1rem;">"Clean store, chill vibe, great selection. The Del Boca Vista location is my new go-to. Serenity Now is an incredible strain."</p>
          <div style="color:var(--text-muted);font-size:0.8rem;font-weight:600;">— Jason R.</div>
        </div>
      </div>
    </div>
  </section>

  <!-- NEWSLETTER -->
  <section style="background:var(--dark-card);padding:3rem 2rem;">
    <div class="container reveal" style="max-width:600px;text-align:center;">
      <h3 style="font-family:'Space Grotesk',sans-serif;color:var(--text-light);font-size:1.2rem;margin-bottom:0.5rem;">Get 10% Off Your First Order</h3>
      <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:1.5rem;">Sign up for deals, new strain drops, and exclusive offers.</p>
      <form class="newsletter-form" onsubmit="event.preventDefault();this.innerHTML='<p style=\\'color:var(--gold-light);font-weight:600;\\'>You\\'re in! Check your inbox.</p>'" style="display:flex;gap:0.5rem;max-width:420px;margin:0 auto;">
        <input type="email" placeholder="Enter your email" required style="flex:1;padding:0.75rem 1rem;border-radius:8px;border:1px solid var(--dark-border);background:var(--dark-mid);color:var(--text-light);font-size:0.9rem;outline:none;"/>
        <button type="submit" class="btn btn-primary" style="white-space:nowrap;">Sign Up</button>
      </form>
    </div>
  </section>

  <!-- CTA -->
  <section class="cta-banner">
    <div class="cta-content">
      <span class="section-label reveal">Get in Touch</span>
      <h2 class="section-title reveal">Ready to Get Lucky?</h2>
      <p class="cta-desc reveal">Whether you're a new customer or a longtime friend, our team is here to help you find exactly what you need.</p>
      <div class="cta-buttons reveal">
        <a href="tel:+12125557734" class="btn btn-light">Call Vandelay Plaza</a>
        <a href="tel:+15615554523" class="btn btn-ghost">Call Del Boca Vista</a>
      </div>
    </div>
  </section>
  `
}

function productCard(href, gradientClass, icon, title, desc, cta, delay) {
  return `
  <a href="${href}" class="product-card reveal reveal-delay-${delay}">
    <div class="product-card-visual ${gradientClass}">${icon}</div>
    <div class="product-card-content">
      <h3 class="product-card-title">${title}</h3>
      <p class="product-card-desc">${desc}</p>
      <div class="product-card-arrow">${cta} ${arrowRight}</div>
    </div>
  </a>`
}

const flowerIcon = `<svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="18" fill="rgba(255,255,255,0.25)"/><ellipse cx="50" cy="24" rx="12" ry="16" fill="rgba(255,255,255,0.9)" transform="rotate(0 50 50)"/><ellipse cx="50" cy="24" rx="12" ry="16" fill="rgba(255,255,255,0.8)" transform="rotate(72 50 50)"/><ellipse cx="50" cy="24" rx="12" ry="16" fill="rgba(255,255,255,0.7)" transform="rotate(144 50 50)"/><ellipse cx="50" cy="24" rx="12" ry="16" fill="rgba(255,255,255,0.8)" transform="rotate(216 50 50)"/><ellipse cx="50" cy="24" rx="12" ry="16" fill="rgba(255,255,255,0.85)" transform="rotate(288 50 50)"/><circle cx="50" cy="50" r="10" fill="rgba(255,255,255,0.95)"/><path d="M50 68L50 95" stroke="rgba(255,255,255,0.5)" stroke-width="3" stroke-linecap="round"/></svg>`

const extractsIcon = `<svg viewBox="0 0 100 100" fill="none"><path d="M40 25L40 45C30 55,30 75,50 85C70 75,70 55,60 45L60 25Z" fill="rgba(255,255,255,0.85)" stroke="rgba(255,255,255,0.95)" stroke-width="2"/><path d="M40 25L60 25" stroke="rgba(255,255,255,0.95)" stroke-width="3" stroke-linecap="round"/><ellipse cx="50" cy="65" rx="12" ry="10" fill="rgba(212,160,53,0.4)"/></svg>`

const cbdIcon = `<svg viewBox="0 0 100 100" fill="none"><path d="M50 15C35 30,25 50,25 65C25 80,36 90,50 90C64 90,75 80,75 65C75 50,65 30,50 15Z" fill="rgba(255,255,255,0.85)" stroke="rgba(255,255,255,0.95)" stroke-width="2"/><path d="M50 35L50 72" stroke="rgba(107,45,139,0.3)" stroke-width="2" stroke-linecap="round"/><path d="M50 45C42 40,36 42,33 47" stroke="rgba(107,45,139,0.25)" stroke-width="1.5" stroke-linecap="round" fill="none"/><path d="M50 45C58 40,64 42,67 47" stroke="rgba(107,45,139,0.25)" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`

const merchIcon = `<svg viewBox="0 0 100 100" fill="none"><path d="M30 30L38 22L46 28L50 26L54 28L62 22L70 30L78 38L68 48L68 80L32 80L32 48L22 38Z" fill="rgba(255,255,255,0.85)" stroke="rgba(255,255,255,0.95)" stroke-width="2" stroke-linejoin="round"/><path d="M46 28C46 34,54 34,54 28" stroke="rgba(212,160,53,0.4)" stroke-width="1.5" fill="none"/><path d="M50 50C44 50,40 56,42 62" stroke="rgba(232,122,43,0.35)" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M50 50C56 50,60 56,58 62" stroke="rgba(232,122,43,0.35)" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`
