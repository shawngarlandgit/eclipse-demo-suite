export function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal')
  if (!reveals.length) return
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
        obs.unobserve(entry.target)
      }
    })
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
  reveals.forEach(el => obs.observe(el))
}
