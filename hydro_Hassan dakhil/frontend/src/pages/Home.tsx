import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets, MapPin, Waves, Gauge, Sprout, Shield, ArrowRight, Calendar, Building, CloudRain, Sun, Thermometer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const keyFeatures = [
    { icon: Waves, label: t('home.hero.capacityLabel'), value: '312 Mm3' },
    { icon: MapPin, label: t('home.hero.watershedLabel'), value: '4,290 km2' },
    { icon: Gauge, label: t('home.hero.inflowLabel'), value: '120 Mm3/an' },
    { icon: Shield, label: t('home.hero.heightLabel'), value: '85 m' },
  ];

  const missions = [
    {
      icon: Sprout,
      title: t('home.missions.items.irrigation.title'),
      description: t('home.missions.items.irrigation.description')
    },
    {
      icon: Shield,
      title: t('home.missions.items.protection.title'),
      description: t('home.missions.items.protection.description')
    },
    {
      icon: Droplets,
      title: t('home.missions.items.waterSupply.title'),
      description: t('home.missions.items.waterSupply.description')
    },
    {
      icon: Waves,
      title: t('home.missions.items.energy.title'),
      description: t('home.missions.items.energy.description')
    }
  ];

  const technicalData = [
    { icon: Waves, label: t('home.technical.items.storageVolume.label'), value: '312 Mm3' },
    { icon: MapPin, label: t('home.technical.items.watershed.label'), value: '4,290 km2' },
    { icon: Gauge, label: t('home.technical.items.avgInflow.label'), value: '120 Mm3/an' },
    { icon: Shield, label: t('home.technical.items.damHeight.label'), value: '85 m' },
    { icon: Calendar, label: t('home.technical.items.commissioning.label'), value: '1971' },
    { icon: Building, label: t('home.technical.items.type.label'), value: t('home.technical.items.type.value') },
  ];

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-blue-50/10 to-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section - Image améliorée */}
{/* Hero Section - Image améliorée */}
<motion.section 
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  className="mb-16"
>
  <div className="relative w-full min-h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
    {/* Conteneur image flexible */}
    <div className="absolute inset-0 bg-gray-100">
      <img 
        src="/barrage.png" 
        alt={t('home.hero.imageAlt')}
        className="w-full h-full object-cover"
        onError={(e) => {
          console.log("Image loading error");
          e.currentTarget.src = "https://images.unsplash.com/photo-1589652717521-10c0d092dea9?w=1920&q=80";
        }}
      />
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
    </div>
    
    {/* Contenu superposé */}
    <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-10 lg:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-3xl"
      >
        {/* Logo et titre */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/90 to-cyan-400/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Droplets className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">
              {t('home.hero.title')}
            </h1>
            <div className="flex items-center gap-2 text-white/90">
              <MapPin className="w-4 h-4" />
              <span className="text-base">{t('home.hero.location')}</span>
            </div>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-lg text-white/95 mb-8 max-w-2xl leading-relaxed">
          {t('home.hero.description')}
        </p>

        {/* Badges avec stats */}
        <div className="flex flex-wrap gap-3 mb-6">
          {keyFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Badge className="bg-white/20 backdrop-blur-md text-white border-0 px-4 py-3 hover:bg-white/30 transition-all duration-300 hover:scale-105">
                <feature.icon className="w-4 h-4 mr-2" />
                <span className="font-bold">{feature.value}</span>
                <span className="ml-1">{feature.label}</span>
              </Badge>
            </motion.div>
          ))}
        </div>

        {/* Indicateurs environnementaux */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2 text-white/90">
            <Thermometer className="w-4 h-4" />
            <span className="text-sm">{t('home.hero.temperature')}</span>
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <CloudRain className="w-4 h-4" />
            <span className="text-sm">{t('home.hero.precipitation')}</span>
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <Sun className="w-4 h-4" />
            <span className="text-sm">{t('home.hero.etp')}</span>
          </div>
        </div>
      </motion.div>
    </div>
  </div>
</motion.section>

        {/* Missions Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('home.missions.title')}
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto text-lg">
              {t('home.missions.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {missions.map((mission, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
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

        {/* Technical Data Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-16"
        >
          <Card className="border border-gray-200 shadow-xl overflow-hidden">
            <CardContent className="p-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {t('home.technical.title')}
                </h2>
                <p className="text-gray-600 text-lg">
                  {t('home.technical.subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {technicalData.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-6 rounded-xl bg-gradient-to-b from-white to-gray-50 hover:from-blue-50 hover:to-cyan-50 transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-7 h-7 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-2">{item.value}</p>
                    <p className="text-gray-600 font-medium">{item.label}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Call to Action */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-20"
        >
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 shadow-2xl overflow-hidden">
            <CardContent className="p-10 text-center">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  {t('home.cta.title')}
                </h2>
                <p className="text-gray-700 text-lg mb-8 leading-relaxed">
                  {t('home.cta.description')}
                </p>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDashboardClick}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-3 mx-auto mb-10"
                >
                  <span className="text-lg">{t('home.cta.button')}</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-blue-200">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-blue-600">24/7</p>
                    <p className="text-gray-700 font-medium mt-2">{t('home.cta.kpi1')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-blue-600">99.9%</p>
                    <p className="text-gray-700 font-medium mt-2">{t('home.cta.kpi2')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-blue-600">50+</p>
                    <p className="text-gray-700 font-medium mt-2">{t('home.cta.kpi3')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Droplets className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold">Hydro-Data Intelligence</span>
          </div>
          <p className="text-lg opacity-90 mb-2">
            {t('home.footer.line1')}
          </p>
          <p className="text-sm opacity-70">
            {t('home.footer.line2')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
