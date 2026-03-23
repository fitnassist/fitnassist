import { useState } from 'react';
import { Outlet, Link } from "react-router-dom";
import { Sun, Moon, User, LogOut, Menu, X } from "lucide-react";
import { routes } from "@/config/routes";
import { Button } from "@/components/ui";
import { useTheme } from "@/providers";
import { useAuth } from "@/hooks";
import { cn } from "@/lib/utils";

export function MainLayout() {
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to={routes.home} className="text-xl font-bold text-primary">
              Fitnassist
            </Link>

            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Link to={routes.trainers}>
                <Button variant="ghost">Find a Trainer</Button>
              </Link>

              {isLoading ? (
                <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
              ) : isAuthenticated ? (
                <>
                  <Link to={routes.dashboard}>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {user?.name || 'Dashboard'}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={signOut}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to={routes.login}>
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link to={routes.register}>
                    <Button>Sign Up</Button>
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
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        <div
          className={cn(
            'sm:hidden border-t bg-background overflow-hidden transition-all duration-200',
            mobileMenuOpen ? 'max-h-64' : 'max-h-0 border-t-0'
          )}
        >
          <div className="px-4 py-3 space-y-1">
            <Link
              to={routes.trainers}
              className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              Find a Trainer
            </Link>

            {isLoading ? null : isAuthenticated ? (
              <>
                <Link
                  to={routes.dashboard}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  {user?.name || 'Dashboard'}
                </Link>
                <button
                  onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium hover:bg-muted text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to={routes.login}
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to={routes.register}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-primary hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t bg-muted py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              {new Date().getFullYear()} Fitnassist. All rights reserved.
            </p>
            <nav className="mt-3 flex gap-4 sm:gap-6 md:mt-0">
              <Link
                to={routes.privacy}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Privacy Policy
              </Link>
              <Link
                to={routes.terms}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Terms of Service
              </Link>
              <Link
                to={routes.support}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Contact Support
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
