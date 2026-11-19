import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Play, BookOpen, Target, Sparkles, ArrowRight } from 'lucide-react';
import {
  NotebookBackground,
  Button,
  Card,
  SectionHeading
} from '../components/ui/index.js';
import { HeroNotebookIllustration } from '../components/landing/HeroNotebookIllustration.jsx';
import { HowItWorksStepCard } from '../components/landing/HowItWorksStepCard.jsx';
import { MultiplayerFeatureGrid } from '../components/landing/MultiplayerFeatureGrid.jsx';
import { SoundControls } from '../components/ui/SoundControls.jsx';
import { soundEffects } from '../services/soundEffects.js';

export const LandingPage = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const handleStartPlaying = () => {
    soundEffects.playButtonClick();
    navigate('/profile-setup');
  };

  const scrollToHowItWorks = () => {
    soundEffects.playButtonClick();
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const heroMotionProps = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: 'easeOut' }
      };

  return (
    <NotebookBackground showMargin={true} className="py-6 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pl-12 sm:pl-20">
        
        {/* Floating Top Right Sound Controls */}
        <div className="flex justify-end mb-2">
          <SoundControls />
        </div>

        {/* ========================================================= */}
        {/* 1. HERO SECTION                                           */}
        {/* ========================================================= */}
        <section className="min-h-[85vh] flex flex-col justify-center mb-16 sm:mb-24 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Hero Copy & Actions */}
            <motion.div
              className="lg:col-span-6 flex flex-col items-start"
              {...heroMotionProps}
            >
              {/* Nostalgic pill badge */}
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-[#EFE8DA] border border-[#D5CFC3] text-xs font-mono text-[#5C6069] mb-4">
                <Sparkles className="w-3.5 h-3.5 text-[#2B68B4]" />
                <span>The Classic Pencil & Paper Game Reborn</span>
              </div>

              {/* Title */}
              <h1 className="text-5xl sm:text-7xl font-handwriting font-bold tracking-tight text-[#23252A] leading-none mb-3">
                ODD WARS
              </h1>

              {/* Tagline */}
              <p className="text-xl sm:text-2xl font-handwriting text-[#2B68B4] font-bold mb-4">
                The Notebook Game. Reimagined.
              </p>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-[#5C6069] font-sans leading-relaxed mb-8 max-w-lg">
                Remember those school notebook games? Now challenge your friends, build your characters, and battle online.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  icon={Play}
                  onClick={handleStartPlaying}
                  className="w-full sm:w-auto"
                >
                  Play Now
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  icon={BookOpen}
                  onClick={scrollToHowItWorks}
                  className="w-full sm:w-auto"
                >
                  How to Play
                </Button>
              </div>

              {/* Subtle pencil footnote */}
              <div className="mt-8 pt-4 border-t border-[#D5CFC3] w-full flex items-center justify-between text-xs font-mono text-[#8E949F]">
                <span>2–4 PLAYERS &bull; NO DOWNLOAD</span>
                <span className="text-[#2E8557]">REAL-TIME 30Hz TICK</span>
              </div>
            </motion.div>

            {/* Right Column: Hero Notebook Battlefield Illustration */}
            <motion.div
              className="lg:col-span-6 flex justify-center"
              initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.96 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <HeroNotebookIllustration />
            </motion.div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. HOW IT WORKS SECTION                                   */}
        {/* ========================================================= */}
        <section id="how-it-works" className="mb-20 sm:mb-28 scroll-mt-24">
          <SectionHeading
            badge="01 — Gameplay Mechanics"
            title="How It Works"
            subtitle="Three simple turns straight from the pages of your school exercise book."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <HowItWorksStepCard
              stepNumber="01"
              title="Pick Your Number"
              description="Draw a random page number and discover your next move."
              illustrationType="pick-number"
              index={0}
            />

            <HowItWorksStepCard
              stepNumber="02"
              title="Build Your Fighter"
              description="Complete your character by drawing its head, body, face, and weapon."
              illustrationType="build-fighter"
              index={1}
            />

            <HowItWorksStepCard
              stepNumber="03"
              title="Battle Your Friends"
              description="Load your bullets and eliminate your opponents."
              illustrationType="battle-friends"
              index={2}
            />
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. MULTIPLAYER FEATURE SECTION                            */}
        {/* ========================================================= */}
        <section className="mb-20 sm:mb-28">
          <SectionHeading
            badge="02 — Multiplayer Arena"
            title="Online Paper Battles"
            subtitle="Engineered for real-time multiplayer skirmishes with friends or the community."
          />

          <MultiplayerFeatureGrid />
        </section>

        {/* ========================================================= */}
        {/* 4. CALL-TO-ACTION (CTA) SECTION                           */}
        {/* ========================================================= */}
        <section className="mb-20 sm:mb-24">
          <Card
            variant="sketch"
            padding="lg"
            className="text-center bg-[#FCFAF3] py-12 px-6 sm:px-12 flex flex-col items-center justify-center relative overflow-hidden"
          >
            {/* Corner washi tape accent */}
            <div className="w-16 h-5 bg-[#EFE8DA]/80 border-l-2 border-r-2 border-dashed border-[#D5CFC3] -rotate-3 mb-4 shadow-sm" />

            <h2 className="text-3xl sm:text-5xl font-handwriting font-bold text-[#23252A] mb-3 max-w-xl">
              Ready to reopen your notebook?
            </h2>

            <p className="text-base sm:text-lg text-[#5C6069] font-sans max-w-md mb-8">
              Gather your friends. Pick your color. Let the battle begin.
            </p>

            <Button
              variant="primary"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              onClick={handleStartPlaying}
              className="px-8 text-base shadow-sketch-dark"
            >
              Start Playing
            </Button>
          </Card>
        </section>

        {/* ========================================================= */}
        {/* 5. FOOTER                                                 */}
        {/* ========================================================= */}
        <footer className="pt-8 pb-12 border-t border-[#D5CFC3] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-[#5C6069]">
          <div className="flex items-center space-x-2">
            <span className="font-handwriting font-bold text-lg text-[#23252A]">
              ODD WARS
            </span>
            <span className="text-[#8E949F]">&bull;</span>
            <span className="font-handwriting text-sm text-[#2B68B4]">
              The Notebook Game. Reimagined.
            </span>
          </div>

          <div className="font-mono text-[11px] text-[#8E949F]">
            &copy; {new Date().getFullYear()} ODD WARS. All rights reserved.
          </div>
        </footer>
      </div>
    </NotebookBackground>
  );
};

export default LandingPage;
