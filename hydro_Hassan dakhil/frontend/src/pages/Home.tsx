/**
 * Page d'accueil — donnees de presentation statiques.
 * Les indicateurs et textes affiches proviennent de l'analyse documentaire du projet
 * (voir docs/ANALYSE_DONNEES_PAGE_ACCUEIL.md) : ils ne sont pas charges depuis l'API
 * et ne constituent pas des donnees temps reel.
 */
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Droplets,
  MapPin,
  Waves,
  Gauge,
  Sprout,
  ArrowRight,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  Mountain,
  LayoutDashboard,
  BookOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';

const HOME_PRESENTATION_STATS = {
  location: 'Lkheng – Province d\'Errachidia',
  watershed: 'Haut bassin du Ziz',
  damType: 'Grand barrage',
  commissioning: '1971',
  referenceCapacity: '312 Mm³',
  estimatedVolume2022: '~288 Mm³',
} as const;

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const heroHighlights = [
    { icon: MapPin, label: t('home.hero.highlights.location'), value: HOME_PRESENTATION_STATS.location },
    { icon: Waves, label: t('home.hero.highlights.watershed'), value: HOME_PRESENTATION_STATS.watershed },
    { icon: Building, label: t('home.hero.highlights.type'), value: HOME_PRESENTATION_STATS.damType },
    { icon: Calendar, label: t('home.hero.highlights.commissioning'), value: HOME_PRESENTATION_STATS.commissioning },
  ];

  const missions = [
    {
      icon: Droplets,
      title: t('home.missions.items.waterSupply.title'),
      description: t('home.missions.items.waterSupply.description'),
    },
    {
      icon: Sprout,
      title: t('home.missions.items.irrigation.title'),
      description: t('home.missions.items.irrigation.description'),
    },
    {
      icon: Waves,
      title: t('home.missions.items.flowRegulation.title'),
      description: t('home.missions.items.flowRegulation.description'),
    },
  ];

  const technicalData: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: MapPin, label: t('home.technical.items.location.label'), value: HOME_PRESENTATION_STATS.location },
    { icon: Waves, label: t('home.technical.items.watershed.label'), value: HOME_PRESENTATION_STATS.watershed },
    { icon: Building, label: t('home.technical.items.type.label'), value: HOME_PRESENTATION_STATS.damType },
    { icon: Calendar, label: t('home.technical.items.commissioning.label'), value: HOME_PRESENTATION_STATS.commissioning },
    { icon: Gauge, label: t('home.technical.items.referenceCapacity.label'), value: HOME_PRESENTATION_STATS.referenceCapacity },
    { icon: Droplets, label: t('home.technical.items.estimatedVolume.label'), value: HOME_PRESENTATION_STATS.estimatedVolume2022 },
  ];

  const whyMonitorKeys = ['siltation', 'capacity', 'sediment', 'erosion', 'waterProtection'] as const;
  const erosionFactorKeys = ['relief', 'slopes', 'precipitation', 'soils', 'deforestation', 'overgrazing', 'urbanization'] as const;
  const platformCapabilityKeys = ['spatial', 'flows', 'precipitation', 'erosion', 'siltation', 'scenarios'] as const;
  const studyAxisKeys = ['benchmark', 'hydrology', 'siltationEval', 'gis'] as const;

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const renderBulletSection = (
    sectionKey: 'whyMonitor' | 'erosionFactors' | 'platformCapabilities' | 'studyAxes',
    itemKeys: readonly string[],
    icon: LucideIcon,
    delay: number
  ) => {
    const SectionIcon = icon;
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className="mb-16"
      >
        <Card className="border border-gray-200 shadow-xl overflow-hidden">
          <CardContent className="p-8">
            <div className="text-center mb-10">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <SectionIcon className="w-7 h-7 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                {t(`home.${sectionKey}.title`)}
              </h2>
              {t(`home.${sectionKey}.subtitle`, { defaultValue: '' }) && (
                <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                  {t(`home.${sectionKey}.subtitle`)}
                </p>
              )}
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {itemKeys.map((key) => (
                <li key={key} className="flex items-start gap-3 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <span>{t(`home.${sectionKey}.items.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.section>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-blue-50/10 to-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <div className="relative w-full min-h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <div className="absolute inset-0 bg-gray-100">
              <img
                src="/barrage.png"
                alt={t('home.hero.imageAlt')}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1589652717521-10c0d092dea9?w=1920&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </div>

            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-10 lg:p-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-3xl"
              >
                <div className="mb-6">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">
                    {t('home.hero.title')}
                  </h1>
                  <p className="text-lg sm:text-xl text-cyan-100 font-medium mb-1">
                    {t('home.hero.subtitle')}
                  </p>
                  <div className="flex items-center gap-2 text-white/90">
                    <MapPin className="w-4 h-4" />
                    <span className="text-base">{t('home.hero.location')}</span>
                  </div>
                </div>

                <p className="text-lg text-white/95 mb-4 max-w-2xl leading-relaxed">
                  {t('home.hero.intro')}
                </p>

                <div className="flex flex-wrap gap-3">
                  {heroHighlights.map((feature, index) => (
                    <motion.div
                      key={feature.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <Badge className="bg-white/20 backdrop-blur-md text-white border-0 px-4 py-3 hover:bg-white/30 transition-all duration-300">
                        <feature.icon className="w-4 h-4 mr-2" />
                        <span className="font-bold">{feature.value}</span>
                        <span className="ml-1 opacity-90">{feature.label}</span>
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('home.missions.title')}</h2>
            <p className="text-gray-600 max-w-3xl mx-auto text-lg">{t('home.missions.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {missions.map((mission, index) => (
              <motion.div
                key={mission.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group h-full">
                  <CardContent className="p-8 text-center h-full flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <mission.icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {mission.title}
                    </h3>
                    <p className="text-gray-600 flex-grow">{mission.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-16"
        >
          <Card className="border border-gray-200 shadow-xl overflow-hidden">
            <CardContent className="p-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('home.technical.title')}</h2>
                <p className="text-gray-600 text-lg">{t('home.technical.subtitle')}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {technicalData.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className="text-center p-6 rounded-xl bg-gradient-to-b from-white to-gray-50 hover:from-blue-50 hover:to-cyan-50 transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-7 h-7 text-blue-600" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{item.value}</p>
                    <p className="text-gray-600 font-medium text-sm">{item.label}</p>
                  </motion.div>
                ))}
              </div>
              <p className="text-center text-sm text-gray-500 mt-8 max-w-2xl mx-auto">
                {t('home.technical.footnote')}
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {renderBulletSection('whyMonitor', whyMonitorKeys, AlertTriangle, 0.25)}
        {renderBulletSection('erosionFactors', erosionFactorKeys, Mountain, 0.3)}
        {renderBulletSection('platformCapabilities', platformCapabilityKeys, LayoutDashboard, 0.35)}
        {renderBulletSection('studyAxes', studyAxisKeys, BookOpen, 0.4)}

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mb-20"
        >
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 shadow-2xl overflow-hidden">
            <CardContent className="p-10 text-center">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('home.cta.title')}</h2>
                <p className="text-gray-700 text-lg mb-8 leading-relaxed">{t('home.cta.description')}</p>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDashboardClick}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-3 mx-auto"
                >
                  <span className="text-lg">{t('home.cta.button')}</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </main>

      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xl font-bold mb-6">Hydro-Data Intelligence</p>
          <p className="text-lg opacity-90 mb-2">{t('home.footer.line1')}</p>
          <p className="text-sm opacity-70">{t('home.footer.line2')}</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
