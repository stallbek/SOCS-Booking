function PageHeader({ description = '', eyebrow = '', title }) {
  return (
    <section className="dashboard-card dashboard-intro-card">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      {title ? <h1>{title}</h1> : null}
      {description ? <p className="dashboard-copy">{description}</p> : null}
    </section>
  );
}

export default PageHeader;
