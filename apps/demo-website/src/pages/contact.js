import { iconPin, iconClock, iconPhone, iconMail, iconSend, iconUser } from '../components/icons.js'
import { renderLocationsSection } from '../components/locations.js'

export function contactPage() {
  return `
  <section class="page-hero page-hero-contact">
    <div class="page-hero-content">
      <span class="section-label reveal">Contact</span>
      <h1 class="page-hero-title reveal">Get in Touch</h1>
      <p class="page-hero-sub reveal">Fill out the form below to contact us with any questions, or simply to say hello.</p>
    </div>
  </section>

  <section class="section" style="background:var(--dark-mid);">
    <div class="container">
      <div class="contact-grid">
        <div class="contact-form-wrapper reveal">
          <h2 class="section-title">Send Us a Message</h2>
          <form class="contact-form">
            <div class="form-row">
              <div class="form-group">
                <label for="fname">First Name</label>
                <input type="text" id="fname" name="fname" required placeholder="Your first name">
              </div>
              <div class="form-group">
                <label for="lname">Last Name</label>
                <input type="text" id="lname" name="lname" required placeholder="Your last name">
              </div>
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required placeholder="your@email.com">
            </div>
            <div class="form-group">
              <label for="subject">Subject</label>
              <input type="text" id="subject" name="subject" required placeholder="How can we help?">
            </div>
            <div class="form-group">
              <label for="message">Message</label>
              <textarea id="message" name="message" rows="5" required placeholder="Tell us more..."></textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;">Send Message ${iconSend}</button>
          </form>
        </div>
        <div class="contact-info reveal reveal-delay-2">
          <h2 class="section-title">Contact Info</h2>
          <div class="contact-info-card">
            <div class="location-detail">
              <div class="location-detail-icon">${iconMail}</div>
              <div class="location-detail-text"><strong>Email</strong><a href="mailto:info@coinslotcannabis.com">info@coinslotcannabis.com</a></div>
            </div>
            <div class="location-detail">
              <div class="location-detail-icon">${iconPhone}</div>
              <div class="location-detail-text"><strong>Vandelay Plaza</strong><a href="tel:+12125557734">(212) 555-7734</a></div>
            </div>
            <div class="location-detail">
              <div class="location-detail-icon">${iconPhone}</div>
              <div class="location-detail-text"><strong>Del Boca Vista</strong><a href="tel:+15615554523">(561) 555-4523</a></div>
            </div>
            <div class="location-detail">
              <div class="location-detail-icon">${iconPin}</div>
              <div class="location-detail-text"><strong>Vandelay Plaza</strong>129 W 81st St<br>New York, NY 10024</div>
            </div>
            <div class="location-detail">
              <div class="location-detail-icon">${iconPin}</div>
              <div class="location-detail-text"><strong>Del Boca Vista</strong>6800 Boca Del Mar Dr<br>Boca Raton, FL 33433</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  ${renderLocationsSection()}`
}
