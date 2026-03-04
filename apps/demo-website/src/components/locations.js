import { iconPin, iconClock, iconPhone, arrowRight } from './icons.js'

export function renderLocationsSection() {
  return `
  <section class="section locations">
    <div class="container">
      <div class="locations-header reveal">
        <span class="section-label">Find Us</span>
        <h2 class="section-title">Two Locations, One Standard</h2>
        <p class="section-desc">Visit either of our locations for personalized recommendations from our knowledgeable team.</p>
      </div>
      <div class="locations-grid">
        <div class="location-card reveal reveal-delay-1">
          <div class="location-card-header">
            <div class="location-badge">Flagship</div>
            <h3 class="location-name">Vandelay Plaza</h3>
          </div>
          <div class="location-card-body">
            <div class="location-details-list">
              <div class="location-detail">
                <div class="location-detail-icon">${iconPin}</div>
                <div class="location-detail-text"><strong>Address</strong>129 W 81st St<br>New York, NY 10024</div>
              </div>
              <div class="location-detail">
                <div class="location-detail-icon">${iconClock}</div>
                <div class="location-detail-text"><strong>Hours</strong>Daily 10am &ndash; 9pm</div>
              </div>
              <div class="location-detail">
                <div class="location-detail-icon">${iconPhone}</div>
                <div class="location-detail-text"><strong>Phone</strong>(212) 555-7734</div>
              </div>
            </div>
            <a href="https://maps.google.com/?q=129+W+81st+St+New+York+NY+10024" target="_blank" rel="noopener" class="location-cta">Get Directions ${arrowRight}</a>
          </div>
        </div>
        <div class="location-card reveal reveal-delay-2">
          <div class="location-card-header">
            <div class="location-badge">Now Open</div>
            <h3 class="location-name">Del Boca Vista</h3>
          </div>
          <div class="location-card-body">
            <div class="location-details-list">
              <div class="location-detail">
                <div class="location-detail-icon">${iconPin}</div>
                <div class="location-detail-text"><strong>Address</strong>6800 Boca Del Mar Dr<br>Boca Raton, FL 33433</div>
              </div>
              <div class="location-detail">
                <div class="location-detail-icon">${iconClock}</div>
                <div class="location-detail-text"><strong>Hours</strong>Mon&ndash;Thu 10am&ndash;8pm<br>Fri&ndash;Sat 9am&ndash;10pm<br>Sun 10am&ndash;6pm</div>
              </div>
              <div class="location-detail">
                <div class="location-detail-icon">${iconPhone}</div>
                <div class="location-detail-text"><strong>Phone</strong>(561) 555-4523</div>
              </div>
            </div>
            <a href="https://maps.google.com/?q=6800+Boca+Del+Mar+Dr+Boca+Raton+FL+33433" target="_blank" rel="noopener" class="location-cta">Get Directions ${arrowRight}</a>
          </div>
        </div>
      </div>
    </div>
  </section>`
}
