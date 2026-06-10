import { methodCards } from "../content/site-content";

export function MethodSection() {
  return (
    <section className="below" id="method">
      {methodCards.map((card) => (
        <article className="below-card" id={card.id} key={card.title}>
          <strong>{card.title}</strong>
          <p>{card.body}</p>
        </article>
      ))}
    </section>
  );
}
