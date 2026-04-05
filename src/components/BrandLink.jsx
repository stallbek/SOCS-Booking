import { Link } from 'react-router-dom';
import mcgillLogo from '../assets/mcgill-university-1.svg';

function BrandLink() {
  return (
    <Link className="brand" to="/">
      <img className="brand-logo" src={mcgillLogo} alt="McGill University visual mark" />
      <span className="brand-lockup">
        <span className="brand-name">
          <span className="brand-name-main">SOCS</span>
          <span className="brand-name-accent">Booking</span>
        </span>
        <span className="brand-subtitle">
          <span className="brand-subtitle-prefix">for</span>
          <span className="brand-subtitle-name">McGill University</span>
        </span>
      </span>
    </Link>
  );
}

export default BrandLink;
