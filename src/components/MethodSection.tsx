import { methodCards, methodSection } from "../content/site-content";

export function MethodSection() {
  return (
    <section className="below" id="method" aria-labelledby="method-title">
      <header className="section-head">
        <p className="section-label">{methodSection.label}</p>
        <h2 id="method-title">{methodSection.title}</h2>
      </header>
      <div className="below-grid">
        {methodCards.map((card) => (
          <article className="below-card" key={card.title}>
            <span className="below-step" aria-hidden="true">
              {card.step}
            </span>
            <strong>{card.title}</strong>
            <p>{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
