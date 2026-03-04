import { coinSlotLogoColor } from './icons.js'

export function renderAgeGate() {
  return `
  <div class="age-gate" id="ageGate">
    <div class="age-gate-logo">${coinSlotLogoColor}</div>
    <h2>Welcome to Coin Slot Cannabis</h2>
    <p>Your Lucky Find. Premium recreational cannabis. You must be 21 or older to enter.</p>
    <div class="age-gate-buttons">
      <button class="age-gate-yes" id="age-yes">I'm 21+</button>
      <button class="age-gate-no" id="age-no">I'm under 21</button>
    </div>
  </div>`
}
