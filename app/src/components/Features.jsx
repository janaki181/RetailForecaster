const features = [
  { icon: "📊", title: "Sales Trend Analysis", desc: "Visualize revenue patterns and growth." },
  { icon: "🔮", title: "Demand Forecasting", desc: "ML-powered predictions for smarter stocking." },
  { icon: "❤️", title: "Inventory Health", desc: "Real-time monitoring of stock levels." },
  { icon: "⚠️", title: "Low Stock Alerts", desc: "Get notified before stockouts happen." },
  { icon: "🏆", title: "Top Products", desc: "Identify best-sellers instantly." },
  { icon: "📈", title: "Revenue Analytics", desc: "Track performance across categories." }
];

function Features() {
  return (
    <section id="features" className="features-section">
      <div className="container">
        <h2 className="section-title">Powerful Features</h2>
        <p className="section-subtitle">
          Everything you need to transform your retail operations
        </p>
      </div>

      <div className="features-slider">
        <div className="features-track">
          {[...features, ...features].map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
