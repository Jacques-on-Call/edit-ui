export function initializeCookieNotice() {
  loadCSS();
  showCookieNotice();
  document.getElementById('accept-cookies').addEventListener('click', acceptCookies);
}

function loadCSS() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'css/cookie-notice.css';
  document.head.appendChild(link);
}

function showCookieNotice() {
  const cookieNotice = document.getElementById('cookie-notice');
  if (!localStorage.getItem('cookiesAccepted')) {
     cookieNotice.classList.add('show');
  }
}

function acceptCookies() {
  const cookieNotice = document.getElementById('cookie-notice');
  cookieNotice.classList.remove('show');
   cookieNotice.classList.add('hidden')
  localStorage.setItem('cookiesAccepted', true);
}
