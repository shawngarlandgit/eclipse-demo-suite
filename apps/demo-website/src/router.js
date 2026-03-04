import { homePage } from './pages/home.js'
import { companyPage } from './pages/company.js'
import { productsPage } from './pages/products.js'
import { flowerPage } from './pages/flower.js'
import { extractsPage } from './pages/extracts.js'
import { cbdPage } from './pages/cbd.js'
import { merchandisePage } from './pages/merchandise.js'
import { pricingPage } from './pages/pricing.js'
import { contactPage } from './pages/contact.js'
import { dealsPage } from './pages/deals.js'
import { faqPage } from './pages/faq.js'
import { initScrollReveal } from './components/reveal.js'

const routes = {
  '/': homePage,
  '/company': companyPage,
  '/products': productsPage,
  '/products/flower': flowerPage,
  '/products/extracts': extractsPage,
  '/products/cbd': cbdPage,
  '/products/merchandise': merchandisePage,
  '/pricing': pricingPage,
  '/contact': contactPage,
  '/deals': dealsPage,
  '/faq': faqPage,
}

function navigate(path) {
  const page = routes[path] || routes['/']
  const container = document.getElementById('page-content')
  if (!container) return

  container.style.opacity = '0'
  container.style.transform = 'translateY(12px)'

  setTimeout(() => {
    container.innerHTML = page()
    window.scrollTo({ top: 0 })
    container.style.opacity = '1'
    container.style.transform = 'translateY(0)'
    initScrollReveal()
    updateActiveNav(path)
    initPageInteractions()
  }, 150)
}

function updateActiveNav(path) {
  document.querySelectorAll('.nav-links a, #mobileMenu a').forEach(a => {
    a.classList.remove('active')
    const href = a.getAttribute('href')
    if (href === path || (path.startsWith('/products') && href === '/products')) {
      a.classList.add('active')
    }
  })
}

function initPageInteractions() {
  // Menu tab switching (flower, extracts pages)
  document.querySelectorAll('.menu-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'))
      document.querySelectorAll('.menu-panel').forEach(p => p.classList.remove('active'))
      tab.classList.add('active')
      const panel = document.getElementById('tab-' + tab.dataset.tab)
      if (panel) panel.classList.add('active')
    })
  })

  // Contact form
  const form = document.querySelector('.contact-form')
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      form.innerHTML = '<div class="form-success">Thank you! We\'ll be in touch soon.</div>'
    })
  }
}

export const router = {
  init() {
    // Handle link clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="/"]')
      if (!link) return
      if (link.target === '_blank') return
      e.preventDefault()
      const path = link.getAttribute('href')
      history.pushState(null, '', path)
      navigate(path)
    })

    // Handle popstate
    window.addEventListener('popstate', () => {
      navigate(location.pathname)
    })

    // Initial render
    navigate(location.pathname)
  },

  push(path) {
    history.pushState(null, '', path)
    navigate(path)
  }
}
