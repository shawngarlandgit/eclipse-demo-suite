import './styles/global.css'
import './styles/nav.css'
import './styles/hero.css'
import './styles/sections.css'
import './styles/products.css'
import './styles/locations.css'
import './styles/pricing.css'
import './styles/contact.css'
import './styles/footer.css'
import './styles/agegate.css'
import './styles/animations.css'
import { router } from './router.js'
import { renderNav } from './components/nav.js'
import { renderFooter } from './components/footer.js'
import { renderAgeGate } from './components/agegate.js'

function init() {
  const app = document.getElementById('app')
  app.innerHTML = `
${renderAgeGate()}
    ${renderNav()}
    <main id="page-content"></main>
    ${renderFooter()}
  `

  // Age gate
  const ageGate = document.getElementById('ageGate')
  document.getElementById('age-yes')?.addEventListener('click', () => {
    ageGate.classList.add('hidden')
    sessionStorage.setItem('coinslot-age-verified', 'true')
  })
  document.getElementById('age-no')?.addEventListener('click', () => {
    window.location.href = 'https://google.com'
  })
  if (sessionStorage.getItem('coinslot-age-verified') === 'true') {
    ageGate.classList.add('hidden')
  }

  // Announcement bar
  const announcementBar = document.getElementById('announcementBar')
  const announcementClose = document.getElementById('announcementClose')
  function syncAnnounceHeight() {
    const h = announcementBar && !announcementBar.classList.contains('hidden')
      ? announcementBar.offsetHeight : 0
    document.documentElement.style.setProperty('--announce-h', h + 'px')
  }
  if (sessionStorage.getItem('coinslot-announcement-hidden') === 'true') {
    announcementBar?.classList.add('hidden')
  }
  syncAnnounceHeight()
  window.addEventListener('resize', syncAnnounceHeight, { passive: true })
  announcementClose?.addEventListener('click', () => {
    announcementBar.classList.add('hidden')
    sessionStorage.setItem('coinslot-announcement-hidden', 'true')
    syncAnnounceHeight()
  })
  // Rotate announcement messages
  const msgs = document.querySelectorAll('.announcement-msg')
  if (msgs.length > 1) {
    let current = 0
    setInterval(() => {
      msgs[current].classList.remove('active')
      current = (current + 1) % msgs.length
      msgs[current].classList.add('active')
    }, 4000)
  }

  // Nav scroll
  const nav = document.getElementById('nav')
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60)
  }, { passive: true })

  // Mobile menu
  document.getElementById('nav-hamburger')?.addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.add('open')
  })
  document.getElementById('mobile-close')?.addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.remove('open')
  })
  document.querySelectorAll('#mobileMenu a').forEach(a => {
    a.addEventListener('click', () => {
      document.getElementById('mobileMenu').classList.remove('open')
    })
  })

  // Init router
  router.init()
}

document.addEventListener('DOMContentLoaded', init)
