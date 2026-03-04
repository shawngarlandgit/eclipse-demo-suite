import { arrowRight } from '../components/icons.js'

export function dealsPage() {
  return `
  <section class="page-hero page-hero-deals">
    <div class="page-hero-content">
      <span class="section-label reveal">Specials</span>
      <h1 class="page-hero-title reveal">Deals & Rewards</h1>
      <p class="page-hero-sub reveal">Great cannabis doesn't have to break the bank. Check our current specials and start earning rewards today.</p>
    </div>
  </section>

  <section class="section" style="background:var(--dark-mid);">
    <div class="container">
      <!-- First Timer -->
      <div class="reveal" style="text-align:center;padding:3rem 2rem;background:linear-gradient(135deg,var(--dark-card),var(--dark-surface));border-radius:16px;border:1px solid var(--gold-deep);margin-bottom:3rem;">
        <span class="section-label">New Customer</span>
        <h2 style="font-family:'Space Grotesk',sans-serif;font-size:clamp(2rem,4vw,3rem);color:var(--gold-light);margin:0.5rem 0;">20% Off Your First Visit</h2>
        <p style="color:var(--text-body);max-width:500px;margin:0.5rem auto 1.5rem;">No code needed. Just mention it's your first time at checkout. Valid at both locations.</p>
        <a href="/contact" class="btn btn-primary">Find a Location</a>
      </div>

      <!-- Daily Deals -->
      <div style="margin-bottom:3rem;">
        <h2 class="section-title reveal" style="text-align:center;margin-bottom:2rem;">Daily Deals</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.25rem;">
          <div class="reveal reveal-delay-1" style="background:var(--dark-card);border-radius:12px;padding:1.5rem;border:1px solid var(--dark-border);">
            <div style="font-size:0.75rem;color:var(--gold);font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem;">Monday</div>
            <h3 style="font-family:'Space Grotesk',sans-serif;color:var(--text-light);font-size:1.1rem;margin-bottom:0.25rem;">Munchie Monday</h3>
            <p style="color:var(--text-body);font-size:0.9rem;">15% off all edibles</p>
          </div>
          <div class="reveal reveal-delay-2" style="background:var(--dark-card);border-radius:12px;padding:1.5rem;border:1px solid var(--dark-border);">
            <div style="font-size:0.75rem;color:var(--gold);font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem;">Wednesday</div>
            <h3 style="font-family:'Space Grotesk',sans-serif;color:var(--text-light);font-size:1.1rem;margin-bottom:0.25rem;">Wax Wednesday</h3>
            <p style="color:var(--text-body);font-size:0.9rem;">10% off all concentrates</p>
          </div>
          <div class="reveal reveal-delay-3" style="background:var(--dark-card);border-radius:12px;padding:1.5rem;border:1px solid var(--dark-border);">
            <div style="font-size:0.75rem;color:var(--gold);font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem;">Friday</div>
            <h3 style="font-family:'Space Grotesk',sans-serif;color:var(--text-light);font-size:1.1rem;margin-bottom:0.25rem;">Flower Friday</h3>
            <p style="color:var(--text-body);font-size:0.9rem;">$5 off any 1/8th</p>
          </div>
          <div class="reveal reveal-delay-4" style="background:var(--dark-card);border-radius:12px;padding:1.5rem;border:1px solid var(--dark-border);">
            <div style="font-size:0.75rem;color:var(--gold);font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem;">Sunday</div>
            <h3 style="font-family:'Space Grotesk',sans-serif;color:var(--text-light);font-size:1.1rem;margin-bottom:0.25rem;">Sunday Funday</h3>
            <p style="color:var(--text-body);font-size:0.9rem;">BOGO pre-rolls</p>
          </div>
        </div>
      </div>

      <!-- Happy Hour -->
      <div class="reveal" style="text-align:center;padding:2rem;background:var(--dark-card);border-radius:12px;border:1px solid var(--dark-border);margin-bottom:3rem;">
        <h3 style="font-family:'Space Grotesk',sans-serif;color:var(--gold-light);font-size:1.3rem;margin-bottom:0.25rem;">Happy Hour — 4pm to 6pm Daily</h3>
        <p style="color:var(--text-body);font-size:0.95rem;">10% off all flower. Both locations.</p>
      </div>

      <!-- Loyalty + Referral -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin-bottom:3rem;">
        <div class="reveal" style="background:var(--dark-card);border-radius:12px;padding:2rem;border:1px solid var(--dark-border);">
          <span class="section-label" style="margin-bottom:0.75rem;display:block;">Rewards</span>
          <h3 style="font-family:'Space Grotesk',sans-serif;color:var(--text-light);font-size:1.2rem;margin-bottom:1rem;">Loyalty Program</h3>
          <ul style="color:var(--text-body);font-size:0.9rem;line-height:2;list-style:none;padding:0;">
            <li>Earn 1 point for every $1 spent</li>
            <li>100 points = $10 off your next purchase</li>
            <li>Double points on your birthday</li>
            <li>Early access to new strains</li>
          </ul>
        </div>
        <div class="reveal" style="background:var(--dark-card);border-radius:12px;padding:2rem;border:1px solid var(--dark-border);">
          <span class="section-label" style="margin-bottom:0.75rem;display:block;">Referrals</span>
          <h3 style="font-family:'Space Grotesk',sans-serif;color:var(--text-light);font-size:1.2rem;margin-bottom:1rem;">Refer a Friend</h3>
          <p style="color:var(--text-body);font-size:0.9rem;line-height:1.7;">Send a friend our way and you both get $10 off your next purchase. No limit on referrals. Ask a budtender for details at either location.</p>
        </div>
      </div>

      <p class="reveal" style="text-align:center;color:var(--text-muted);font-size:0.8rem;">Deals cannot be combined with other offers. Valid ID required. While supplies last.</p>
    </div>
  </section>`
}
