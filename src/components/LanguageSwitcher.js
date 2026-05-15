import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Globe } from 'lucide-react';

const LanguageSwitcher = ({ variant = "outline", size = "sm" }) => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleLanguage}
      className="flex items-center gap-2"
      data-testid="language-switcher"
    >
      <Globe className="w-4 h-4" />
      {i18n.language === 'fr' ? 'EN' : 'FR'}
    </Button>
  );
};

export default LanguageSwitcher;