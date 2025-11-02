import './LoginPage.css';

export function LoginPage() {
  return (
    <div className="login-container">
      <header className="login-header">
        <img src="/ShowUp-Logo.webp" alt="ShowUp Logo" className="logo-h1" />
        <img src="/ShowUp-H1-Logo.webp" alt="ShowUp" className="logo-h1-image" />
      </header>

      <main>
        <p className="tagline">Build your business visibility, easily.</p>
        <p className="subtext">
          ShowUp helps professionals build high-ranking websites and attract new customers – fast.
        </p>

        <ul className="features">
          <li><span className="checkmark">✓✓</span> Personalized guidance</li>
          <li><span className="checkmark">✓✓</span> Simple to update</li>
          <li><span className="checkmark">✓</span> Easy SEO (search everywhere optimized)</li>
        </ul>

        <button className="cta-button">
          <img src="/ShowUp-Logo.webp" alt="ShowUp Logo" />
          <span>Sign Up Free</span>
        </button>

        <a href="#" className="login-link">
          Login
        </a>
      </main>

      <footer className="login-footer">
        <p>Powered by Strategy Content Agency</p>
      </footer>
    </div>
  );
}
