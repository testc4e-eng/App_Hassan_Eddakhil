import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, Mail, Menu, X } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { UserMenu } from '@/components/auth/UserMenu';
import { useAuth } from '@/contexts/AuthContext';

export function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navLinks = [
    { href: '/', label: t('nav.home'), icon: Home },
    { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { href: '/contact', label: t('nav.contact'), icon: Mail },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto w-full max-w-[1600px] px-4 lg:px-5">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo variant="primary" size="sm" className="rounded-lg" />
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold text-foreground leading-tight">
                Hydro-Data Intelligence
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Barrage Hassan Addakhil
              </p>
            </div>
          </Link>

          {/* Desktop Navigation + secondary logo */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <LanguageSwitcher />
              {isAuthenticated ? (
                <nav className="flex items-center gap-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.href;

                    return (
                      <Link
                        key={link.href}
                        to={link.href}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>
              ) : null}
              <UserMenu />
            </div>
            <BrandLogo
              variant="secondary"
              size="sm"
              className="h-10 w-auto max-w-[2.75rem] sm:max-w-[3rem]"
            />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex items-center justify-end mb-3">
              <LanguageSwitcher />
            </div>
            <div className="mb-3 flex justify-end">
              <UserMenu />
            </div>
            {isAuthenticated ? (
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.href;

                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </nav>
        )}
      </div>
    </header>
  );
}
