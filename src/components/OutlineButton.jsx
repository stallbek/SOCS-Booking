//Stalbek Ulanbek uulu 261102435
import { Link } from 'react-router-dom';

function OutlineButton({ children, className = '', onClick, to, type = 'button' }) {
  const classes = `button button-outline${className ? ` ${className}` : ''}`;

  if (to) {
    return (
      <Link className={classes} to={to}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} onClick={onClick} type={type}>
      {children}
    </button>
  );
}

export default OutlineButton;
