import { Link } from 'react-router-dom';
import { routes } from '@/config/routes';

interface LogoProps {
  size?: 'default' | 'small';
}

export const Logo = ({ size = 'default' }: LogoProps) => (
  <Link
    to={routes.home}
    className={`font-extralight text-white uppercase tracking-[0.15em] ${
      size === 'small' ? 'text-base' : 'text-xl'
    }`}
  >
    Fitnassist
  </Link>
);
