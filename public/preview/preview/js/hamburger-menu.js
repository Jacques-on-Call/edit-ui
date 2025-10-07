export function initializeHamburgerMenu() {
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.main-nav');
  const closeBtn = document.querySelector('.close-btn');
  if (hamburger && nav) {
    hamburger.addEventListener('click', () => nav.classList.add('show-menu'));
    closeBtn.addEventListener('click', () => nav.classList.remove('show-menu'));
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
        nav.classList.remove('show-menu');
      }
    });
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => nav.classList.remove('show-menu'));
    });
    window.addEventListener('scroll', () => nav.classList.remove('show-menu'));
  }
}
