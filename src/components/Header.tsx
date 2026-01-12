import { useState } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Droplet, Menu } from 'lucide-react';

import { ProfileSidebar } from './ProfileSidebar';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout, isLoggingIn, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = !!identity;
  const disabled = isLoggingIn;
  const authText = isLoggingIn ? 'Verifying...' : isAuthenticated ? 'Logout' : 'Login';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await logout();
      queryClient.clear();
      // Redirect to home after logout
      navigate({ to: '/' });
    } else {
      await login();
    }
  };

  const navItems = [
    { label: 'Request Blood', path: '/request-blood' },
    { label: 'Donate Blood', path: '/donor-dashboard' },
    { label: 'My Requests', path: '/status-tracking' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm transition-all duration-300">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105" onClick={() => navigate({ to: '/' })}>
          <div className="bg-rose-100 dark:bg-rose-900/20 p-2 rounded-full">
            <Droplet className="h-6 w-6 text-rose-600 fill-current" />
          </div>
          <span className="text-xl font-bold text-rose-600 dark:text-rose-500">HelpConnect</span>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate({ to: item.path })}
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive(item.path) ? 'text-primary' : 'text-muted-foreground'
                }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {isAuthenticated && <ProfileSidebar />}

          <Button
            onClick={handleAuth}
            disabled={disabled}
            variant={isAuthenticated ? 'outline' : 'default'}
            size="sm"
            className="hidden md:flex"
          >
            {authText}
          </Button>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate({ to: item.path });
                      setMobileMenuOpen(false);
                    }}
                    className={`text-left text-lg font-medium transition-colors hover:text-primary ${isActive(item.path) ? 'text-primary' : 'text-muted-foreground'
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
                <div className="flex items-center gap-2 mt-4">
                  {isAuthenticated && <span className="text-sm font-medium px-2">Profile:</span>}
                  {isAuthenticated && <ProfileSidebar />}
                </div>
                <Button
                  onClick={() => {
                    handleAuth();
                    setMobileMenuOpen(false);
                  }}
                  disabled={disabled}
                  variant={isAuthenticated ? 'outline' : 'default'}
                  className="mt-2"
                >
                  {authText}
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
