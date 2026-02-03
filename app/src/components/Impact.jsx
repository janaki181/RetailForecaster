import { useEffect, useRef } from "react";

const impacts = [
  { value: "+25%", label: "Revenue Increase" },
  { value: "-30%", label: "Holding Costs" },
  { value: "-40%", label: "Stockouts" },
  { value: "5x", label: "Faster Decisions" }
];

function Impact() {
  const cardsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.2 }
    );

    cardsRef.current.forEach(card => observer.observe(card));
  }, []);

  return (
    <section id="impact" className="impact-section">
      <div className="container">
        <h2 className="section-title light">Business Impact That Matters</h2>
        <p className="section-subtitle light">
          Real numbers from real retail transformations
        </p>

        <div className="impact-grid">
          {impacts.map((i, idx) => (
            <div
              key={idx}
              className="impact-card"
              ref={el => (cardsRef.current[idx] = el)}
              style={{
                opacity: 0,
                transform: "translateY(30px)",
                transition: "0.6s ease"
              }}
            >
              <div className="impact-number">{i.value}</div>
              <div className="impact-label">{i.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Impact;
