import { Outlet, Link } from 'react-router-dom';
import { routes } from '@/config/routes';

export function AuthLayout() {

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#20415c] to-[#5a0c30]">
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <Link to={routes.home} className="text-xl font-bold text-primary">
              Fitnassist
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <Outlet />
      </main>
    </div>
  );
}
