import { Link } from 'react-router-dom';
import { routes } from '@/config/routes';

interface LogoProps {
  size?: 'default' | 'small';
}

export const Logo = ({ size = 'default' }: LogoProps) => (
  <Link to={routes.home} className="inline-block">
    <img
      src="/logo.svg"
      alt="Fitnassist"
      className={size === 'small' ? 'h-5 w-auto' : 'h-7 w-auto'}
    />
  </Link>
);
