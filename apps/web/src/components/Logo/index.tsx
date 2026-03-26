import { Link } from 'react-router-dom';
import { routes } from '@/config/routes';

export const Logo = () => (
  <Link
    to={routes.home}
    className="text-xl font-extralight text-white uppercase tracking-[0.15em]"
  >
    Fitnassist
  </Link>
);
