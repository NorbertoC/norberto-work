import { workCases, workSection } from "../content/site-content";

export function WorkSection() {
  return (
    <section className="work" id="work" aria-labelledby="work-title">
      <header className="section-head">
        <p className="section-label">{workSection.label}</p>
        <h2 id="work-title">{workSection.title}</h2>
      </header>
      <div className="work-grid">
        {workCases.map((workCase) => (
          <article className="work-card" key={workCase.title}>
            <h3>{workCase.title}</h3>
            <p className="work-meta">{workCase.meta}</p>
            <p className="work-summary">{workCase.summary}</p>
            <ul className="work-points">
              {workCase.decisions.map((decision) => (
                <li key={decision}>{decision}</li>
              ))}
            </ul>
            <p className="work-result">{workCase.result}</p>
            {workCase.link ? (
              <a className="work-link" href={workCase.link.href} rel="noreferrer" target="_blank">
                {workCase.link.label}
                <span aria-hidden="true"> ↗</span>
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
