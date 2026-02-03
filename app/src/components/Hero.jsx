function Hero({ onLoginClick }) {
  return (
    <section id="home" className="hero">
      <div className="container hero-container">
        <div className="hero-content">
          <h1 className="hero-title">RetailForecaster</h1>
          <p className="hero-tagline">Stop guessing. Start predicting.</p>
          <p className="hero-description">
            Retail businesses lose millions to stockouts and overstocking.
            RetailForecaster transforms chaos into clarity with real-time analytics
            and intelligent demand forecasting.
          </p>
          <button className="cta-button" onClick={onLoginClick}>
            Login/Sign Up
          </button>
        </div>
      </div>
    </section>
  );
}

export default Hero;
