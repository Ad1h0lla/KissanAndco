import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, MapPin, Cloud, Lightbulb, Zap, Store, Gift } from 'lucide-react';
import { t } from '../i18n';

interface TutorialCard {
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
}

const tutorialCards: TutorialCard[] = [
  {
    icon: <MapPin size={40} className="text-green-600" />,
    titleKey: 'farmOverview',
    descKey: 'farmOverviewDesc'
  },
  {
    icon: <Cloud size={40} className="text-blue-600" />,
    titleKey: 'weatherSoil',
    descKey: 'weatherSoilDesc'
  },
  {
    icon: <Lightbulb size={40} className="text-yellow-600" />,
    titleKey: 'advisor',
    descKey: 'aiAdviceDesc'
  },
  {
    icon: <Zap size={40} className="text-purple-600" />,
    titleKey: 'simulator',
    descKey: 'simulatorDesc'
  },
  {
    icon: <Store size={40} className="text-orange-600" />,
    titleKey: 'marketplace',
    descKey: 'marketplaceDesc'
  },
  {
    icon: <Gift size={40} className="text-red-600" />,
    titleKey: 'subsidies',
    descKey: 'subsidiesDesc'
  }
];

interface TutorialProps {
  lang?: string;
}

export default function Tutorial({ lang = 'en' }: TutorialProps) {
  const [currentCard, setCurrentCard] = useState(0);

  const handleNext = () => {
    setCurrentCard((prev) => (prev + 1) % tutorialCards.length);
  };

  const handlePrev = () => {
    setCurrentCard((prev) => (prev - 1 + tutorialCards.length) % tutorialCards.length);
  };

  const card = tutorialCards[currentCard];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-green-800 mb-8">{t(lang, 'tutorialTitle')}</h1>

      {/* Card Display */}
      <motion.div
        key={currentCard}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-lg p-8 mb-8"
      >
        <div className="flex justify-center mb-6">{card.icon}</div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
          {t(lang, card.titleKey)}
        </h2>
        <p className="text-center text-gray-700 text-lg mb-6">
          {t(lang, card.descKey)}
        </p>
        {/* Placeholder for illustration */}
        <div className="bg-gradient-to-br from-green-100 to-blue-100 h-40 rounded-lg flex items-center justify-center text-gray-500 mb-4">
          <span className="text-sm">{t(lang, 'loading')}...</span>
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrev}
          className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition"
          aria-label="Previous"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Progress Dots */}
        <div className="flex gap-2">
          {tutorialCards.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentCard(idx)}
              className={`w-3 h-3 rounded-full transition ${
                idx === currentCard ? 'bg-green-600' : 'bg-gray-300'
              }`}
              aria-label={`Card ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition"
          aria-label="Next"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Card Counter */}
      <div className="text-center text-gray-600">
        {currentCard + 1} / {tutorialCards.length}
      </div>
    </div>
  );
}
