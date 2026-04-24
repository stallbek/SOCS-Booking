function LookupPanel({
  actionDisabled = false,
  actionLabel = '',
  className = '',
  children = null,
  fieldLabel,
  heading,
  inputType = 'search',
  onAction,
  onChange,
  placeholder,
  value,
  eyebrow
}) {
  const wrapperClassName = ['dashboard-card', 'lookup-panel', className].filter(Boolean).join(' ');
  const toolbarClassName = `lookup-toolbar${onAction ? ' lookup-toolbar-action' : ''}`;

  return (
    <section className={wrapperClassName}>
      <div className="dashboard-card-head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{heading}</h2>
        </div>
      </div>

      <div className={toolbarClassName}>
        <label className="form-field owner-search-field">
          <span>{fieldLabel}</span>
          <input
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            type={inputType}
            value={value}
          />
        </label>

        {onAction ? (
          <button className="button button-primary" disabled={actionDisabled} onClick={onAction} type="button">
            {actionLabel}
          </button>
        ) : null}
      </div>

      {children}
    </section>
  );
}

export default LookupPanel;
