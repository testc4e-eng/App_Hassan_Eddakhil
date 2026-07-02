import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container px-4 py-24 flex flex-col items-center justify-center text-center">
        <div className="max-w-md">
          <div className="text-6xl font-bold text-primary mb-4">404</div>
          <h1 className="text-3xl font-bold mb-4">{t('notFound.title')}</h1>
          <p className="text-muted-foreground mb-8">
            {t('notFound.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                {t('notFound.backHome')}
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('notFound.previousPage')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
