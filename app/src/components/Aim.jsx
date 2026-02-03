function Aim() {
  return (
    <section id="aim" className="aim-section">
      <div className="container">
        <h2 className="section-title">Our Mission</h2>
        <p className="section-subtitle">
          Empowering retail businesses with data-driven inventory intelligence
        </p>

        <div className="aim-grid">
          <div className="aim-card">
            <div className="aim-icon">🎯</div>
            <h3>Reduce Stockouts</h3>
            <p>Never miss a sale with predictive analytics.</p>
          </div>
          <div className="aim-card">
            <div className="aim-icon">💰</div>
            <h3>Avoid Overstocking</h3>
            <p>Prevent excess inventory and reduce holding costs.</p>
          </div>
          <div className="aim-card">
            <div className="aim-icon">📈</div>
            <h3>Improve Planning</h3>
            <p>Reveal trends invisible to spreadsheets.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Aim;
