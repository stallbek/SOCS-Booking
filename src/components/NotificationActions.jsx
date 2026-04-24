//Stalbek Ulanbek uulu 261102435

function NotificationActions({ actions = [] }) {
  const visibleActions = (Array.isArray(actions) ? actions : [actions]).filter(Boolean);

  if (!visibleActions.length) {
    return null;
  }

  return (
    <div className="notification-actions">
      {visibleActions.map((action) => (
        <a className="text-link" href={action.href} key={`${action.label}-${action.href}`}>
          {action.label}
        </a>
      ))}
    </div>
  );
}

export default NotificationActions;
