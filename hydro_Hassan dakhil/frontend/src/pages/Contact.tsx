import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Send, Building2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const Contact = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: t("contact.toast.title"),
      description: t("contact.toast.description"),
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const contactInfo = [
    {
      icon: Building2,
      title: t('contact.info.agency.title'),
      details: [t('contact.info.agency.line1'), t('contact.info.agency.line2')]
    },
    {
      icon: MapPin,
      title: t('contact.info.address.title'),
      details: [t('contact.info.address.line1'), t('contact.info.address.line2')]
    },
    {
      icon: Phone,
      title: t('contact.info.phone.title'),
      details: ['+212 535 57 XX XX', '+212 535 57 XX XX']
    },
    {
      icon: Mail,
      title: t('contact.info.email.title'),
      details: ['contact@abhgzr.ma', 'info@abhgzr.ma']
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('contact.title')}</h1>
          <p className="text-muted-foreground text-lg">
            {t('contact.subtitle')}
          </p>
        </motion.section>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t('contact.form.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('contact.form.fullName')}</Label>
                      <Input
                        id="name"
                        placeholder={t('contact.form.fullNamePlaceholder')}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('contact.form.email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="subject">{t('contact.form.subject')}</Label>
                    <Input
                      id="subject"
                      placeholder={t('contact.form.subjectPlaceholder')}
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">{t('contact.form.message')}</Label>
                    <Textarea
                      id="message"
                      placeholder={t('contact.form.messagePlaceholder')}
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    {t('contact.form.send')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <info.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{info.title}</h3>
                        {info.details.map((detail, idx) => (
                          <p key={idx} className="text-sm text-muted-foreground">{detail}</p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Map placeholder */}
            <Card className="overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t('contact.map.city')}</p>
                  <p className="text-xs text-muted-foreground">31.9314° N, 4.4343° W</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-sidebar text-sidebar-foreground py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-80">
            {t('contact.footer.line1')}
          </p>
          <p className="text-xs opacity-60 mt-1">
            {t('contact.footer.line2')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
