import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Sun, Moon, User, LogOut, Menu, X } from 'lucide-react';
import { routes } from '@/config/routes';
import { Button } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { useTheme } from '@/providers';
import { useAuth } from '@/hooks';
import { cn } from '@/lib/utils';

export function MainLayout() {
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const noHeroPages = [routes.trainers];
  const alwaysSolid = noHeroPages.some((p) => location.pathname === p);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled || alwaysSolid || mobileMenuOpen
            ? 'bg-[hsl(230,25%,10%)] shadow-lg'
            : 'bg-transparent',
        )}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Logo />

            {/* Desktop nav */}
            <nav aria-label="Main navigation" className="hidden sm:flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Link to={routes.trainers}>
                <Button
                  variant="ghost"
                  className="text-white/80 hover:text-white hover:bg-white/10 uppercase text-xs tracking-wider font-semibold"
                >
                  Find a Trainer
                </Button>
              </Link>
              <Link to={routes.pricing}>
                <Button
                  variant="ghost"
                  className="text-white/80 hover:text-white hover:bg-white/10 uppercase text-xs tracking-wider font-semibold"
                >
                  Pricing
                </Button>
              </Link>

              {isLoading ? (
                <div className="h-9 w-20 bg-white/10 animate-pulse rounded-md" />
              ) : isAuthenticated ? (
                <>
                  <Link to={routes.dashboard}>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 text-white/80 hover:text-white hover:bg-white/10 uppercase text-xs tracking-wider font-semibold"
                    >
                      <User className="h-4 w-4" />
                      {user?.name || 'Dashboard'}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={signOut}
                    className="flex items-center gap-2 text-white/80 hover:text-white hover:bg-white/10 uppercase text-xs tracking-wider font-semibold"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to={routes.login}>
                    <Button
                      variant="ghost"
                      className="text-white/80 hover:text-white hover:bg-white/10 uppercase text-xs tracking-wider font-semibold"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link to={routes.register}>
                    <Button className="uppercase text-xs tracking-wider font-semibold">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile nav toggle */}
            <div className="flex items-center gap-2 sm:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        <div
          className={cn(
            'sm:hidden bg-[hsl(230,25%,12%)] overflow-hidden transition-all duration-200',
            mobileMenuOpen ? 'max-h-64' : 'max-h-0',
          )}
        >
          <nav aria-label="Mobile navigation" className="px-4 py-3 space-y-1">
            <Link
              to={routes.trainers}
              className="block px-3 py-2 rounded-md text-sm font-semibold uppercase tracking-wider text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Find a Trainer
            </Link>
            <Link
              to={routes.pricing}
              className="block px-3 py-2 rounded-md text-sm font-semibold uppercase tracking-wider text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>

            {isLoading ? null : isAuthenticated ? (
              <>
                <Link
                  to={routes.dashboard}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold uppercase tracking-wider text-white/80 hover:bg-white/10 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  {user?.name || 'Dashboard'}
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-semibold uppercase tracking-wider hover:bg-white/10 text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to={routes.login}
                  className="block px-3 py-2 rounded-md text-sm font-semibold uppercase tracking-wider text-white/80 hover:bg-white/10 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to={routes.register}
                  className="block px-3 py-2 rounded-md text-sm font-semibold uppercase tracking-wider text-coral hover:bg-white/10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gradient-to-br from-[#20415c] to-[#5a0c30] py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div>
              <Logo size="small" />
              <p className="text-sm text-white/50 mt-2">
                {new Date().getFullYear()} Fitnassist. All rights reserved.
              </p>
            </div>
            <nav aria-label="Footer navigation" className="flex gap-8 sm:gap-12">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  Product
                </p>
                <Link
                  to={routes.trainers}
                  className="block text-sm text-white/50 hover:text-white/80"
                >
                  Find a Trainer
                </Link>
                <Link
                  to={routes.pricing}
                  className="block text-sm text-white/50 hover:text-white/80"
                >
                  Pricing
                </Link>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  Company
                </p>
                <Link
                  to={routes.privacy}
                  className="block text-sm text-white/50 hover:text-white/80"
                >
                  Privacy Policy
                </Link>
                <Link to={routes.terms} className="block text-sm text-white/50 hover:text-white/80">
                  Terms of Service
                </Link>
                <Link
                  to={routes.support}
                  className="block text-sm text-white/50 hover:text-white/80"
                >
                  Support
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
