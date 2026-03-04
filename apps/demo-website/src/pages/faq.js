import { arrowRight } from '../components/icons.js'

export function faqPage() {
  return `
  <section class="page-hero page-hero-faq">
    <div class="page-hero-content">
      <span class="section-label reveal">Help</span>
      <h1 class="page-hero-title reveal">Frequently Asked Questions</h1>
      <p class="page-hero-sub reveal">Everything you need to know before your visit.</p>
    </div>
  </section>

  <section class="section" style="background:var(--dark-mid);">
    <div class="container" style="max-width:800px;">
      ${faqItem('What do I need to bring?', 'A valid government-issued photo ID proving you are 21 years of age or older. We accept driver\'s licenses, passports, and state-issued ID cards. No medical card required — we are a recreational dispensary.')}
      ${faqItem('What payment methods do you accept?', 'We accept cash, debit cards, and CanPay. ATMs are available on-site at both locations. We do not accept credit cards per federal regulations.')}
      ${faqItem('Is this my first visit — do I get a discount?', 'Yes! First-time customers receive 20% off their entire first purchase. Just let your budtender know. No code or coupon needed.')}
      ${faqItem('Do you offer delivery?', 'Not yet — delivery service is coming soon. Currently we offer in-store shopping only at both our Vandelay Plaza and Del Boca Vista locations.')}
      ${faqItem('How does your loyalty program work?', 'Earn 1 point for every $1 spent. Once you hit 100 points, you get $10 off your next purchase. You also earn double points on your birthday. Ask a budtender to sign you up.')}
      ${faqItem('What are your hours?', 'Vandelay Plaza (NYC): Daily 10am–9pm. Del Boca Vista (Boca Raton): Mon–Thu 10am–8pm, Fri–Sat 9am–10pm, Sun 10am–6pm.')}
      ${faqItem('Do you carry medical products?', 'We are a recreational-only dispensary. However, many of our products including CBD tinctures, topicals, and low-THC options are popular with wellness-focused customers.')}
      ${faqItem('Can I order ahead for pickup?', 'Phone-ahead ordering is available. Call your preferred location, place your order, and we\'ll have it ready when you arrive. Online ordering is coming soon.')}
      ${faqItem('Do you have daily deals?', 'Yes! We run specials throughout the week including Munchie Monday, Wax Wednesday, Flower Friday, and Sunday Funday. Plus happy hour pricing from 4-6pm daily. Check our <a href="/deals" style="color:var(--gold-light)">Deals page</a> for details.')}
      ${faqItem('Are your products lab tested?', 'Every product we sell is third-party lab tested for potency, pesticides, heavy metals, and microbials. COA results are available upon request at both locations.')}
    </div>
  </section>`
}

function faqItem(question, answer) {
  return `
  <details class="faq-item reveal" style="background:var(--dark-card);border-radius:12px;border:1px solid var(--dark-border);margin-bottom:0.75rem;overflow:hidden;">
    <summary style="padding:1.25rem 1.5rem;cursor:pointer;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:1rem;color:var(--text-light);display:flex;justify-content:space-between;align-items:center;list-style:none;">
      ${question}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;margin-left:1rem;transition:transform 0.3s;"><path d="M4 6l4 4 4-4" stroke="var(--gold)" stroke-width="2" stroke-linecap="round"/></svg>
    </summary>
    <div style="padding:0 1.5rem 1.25rem;color:var(--text-body);font-size:0.9rem;line-height:1.7;">${answer}</div>
  </details>`
}
