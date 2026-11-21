import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Settings,
  RefreshCw,
  Bell,
  Search,
  User,
  Shield,
  Layers,
  Palette,
  Type,
  Layout,
  MousePointer,
  HelpCircle
} from 'lucide-react';
import {
  NotebookBackground,
  Button,
  IconButton,
  Input,
  Card,
  SectionHeading,
  LoadingIndicator,
  Modal,
  PlayerColorIndicator,
  PLAYER_COLORS,
  PencilStrokeDemo
} from '../components/ui/index.js';

export const DesignSystemPreview = () => {
  const [selectedColor, setSelectedColor] = useState('blue');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('PencilWarrior99');
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  const toggleLoading = () => {
    setIsButtonLoading(true);
    setTimeout(() => setIsButtonLoading(false), 2000);
  };

  return (
    <NotebookBackground showMargin={true} className="py-4 sm:py-12">
      <div className="max-w-6xl mx-auto px-3.5 xs:px-4 sm:pl-16 md:pl-20 sm:pr-8">
        {/* Top Header */}
        <header className="mb-8 sm:mb-12 border-b border-[#D5CFC3] pb-4 sm:pb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-[#EFE8DA] border border-[#D5CFC3] text-xs font-mono text-[#5C6069] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#2B68B4]" />
            <span>Task 02: Design System & Animation Foundation</span>
          </div>

          <h1 className="text-3xl xs:text-4xl sm:text-5xl font-handwriting font-bold tracking-tight text-[#23252A]">
            ODD WAR — Notebook Design System
          </h1>

          <p className="mt-2 text-base text-[#5C6069] max-w-3xl font-sans">
            A playful, nostalgic, and premium school notebook visual identity built with warm ivory paper, 
            graphite typography, restrained ink accents, and 2D pencil-stroke animations.
          </p>
        </header>

        {/* 1. Typography Showcase */}
        <section className="mb-14">
          <SectionHeading
            badge="01. Typography"
            title="Notebook Typography System"
            subtitle="Display font for titles & handwriting; high-legibility sans for crisp interface controls."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="default">
              <span className="text-xs font-mono uppercase text-[#5C6069] block mb-2">
                Display Font (Patrick Hand)
              </span>
              <div className="space-y-3">
                <div className="text-3xl font-handwriting font-bold text-[#23252A]">
                  Odd War: Quick Match
                </div>
                <div className="text-2xl font-handwriting font-bold text-[#2B68B4]">
                  Round 03 — Pencil Crossfire
                </div>
                <div className="text-xl font-handwriting text-[#5C6069]">
                  "Rule #1: Only 2 to 4 players on a single lined sheet."
                </div>
              </div>
            </Card>

            <Card variant="ruled">
              <span className="text-xs font-mono uppercase text-[#5C6069] block mb-2">
                UI & Body Font (Inter)
              </span>
              <div className="space-y-3 font-sans text-sm">
                <p className="font-bold text-[#23252A]">
                  Primary Graphite: #23252A (High contrast, sharp readability)
                </p>
                <p className="font-normal text-[#5C6069]">
                  Pencil Grey: #5C6069 (Secondary labels, metadata, match timestamps)
                </p>
                <p className="font-normal text-[#8E949F]">
                  Light Pencil: #8E949F (Placeholders, subtle annotations)
                </p>
                <p className="font-mono text-xs text-[#2B68B4] bg-[#EFE8DA]/50 p-2 rounded border border-[#D5CFC3]">
                  Code / Monospace: 30 Hz Authoritative Tick Loop
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* 2. Color Palette & Player Indicators */}
        <section className="mb-14">
          <SectionHeading
            badge="02. Color Palette"
            title="School Notebook Ink & Player Colors"
            subtitle="Restrained colored pencil and ballpoint inks designed for 2–4 player identification."
          />

          <Card variant="default" className="mb-6">
            <h4 className="text-sm font-semibold text-[#23252A] mb-4">
              Selectable Player Colors (5 Supported Profiles)
            </h4>

            {/* Interactive Player Color Swatches */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {Object.keys(PLAYER_COLORS).map((colorKey) => (
                <PlayerColorIndicator
                  key={colorKey}
                  color={colorKey}
                  variant="swatch"
                  size="md"
                  selected={selectedColor === colorKey}
                  onClick={() => setSelectedColor(colorKey)}
                />
              ))}
            </div>

            {/* Badges showcase */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#D5CFC3]">
              {Object.keys(PLAYER_COLORS).map((colorKey) => (
                <PlayerColorIndicator
                  key={colorKey}
                  color={colorKey}
                  variant="badge"
                  selected={selectedColor === colorKey}
                  onClick={() => setSelectedColor(colorKey)}
                />
              ))}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-[#FCFAF3] border border-[#D5CFC3] text-xs text-[#5C6069]">
              Active Selection: <span className="font-bold text-[#23252A]">{PLAYER_COLORS[selectedColor]?.name}</span> ({PLAYER_COLORS[selectedColor]?.hex})
            </div>
          </Card>
        </section>

        {/* 3. Reusable Buttons & Icon Buttons */}
        <section className="mb-14">
          <SectionHeading
            badge="03. Interactive Controls"
            title="Buttons & Icon Buttons"
            subtitle="Touch-friendly, tactile button feedback with physical pencil press states."
          />

          <Card variant="default">
            <div className="space-y-6">
              {/* Primary & Secondary */}
              <div>
                <span className="text-xs font-mono uppercase text-[#5C6069] block mb-3">
                  Button Variants (44px Minimum Touch Target)
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">
                    Primary Button
                  </Button>
                  <Button variant="secondary">
                    Secondary Button
                  </Button>
                  <Button variant="danger">
                    Danger Action
                  </Button>
                  <Button variant="ghost">
                    Ghost Link
                  </Button>
                  <Button
                    variant="primary"
                    isLoading={isButtonLoading}
                    onClick={toggleLoading}
                  >
                    Click to Test Loading
                  </Button>
                  <Button variant="primary" disabled>
                    Disabled
                  </Button>
                </div>
              </div>

              {/* Sizes */}
              <div className="pt-4 border-t border-[#D5CFC3]">
                <span className="text-xs font-mono uppercase text-[#5C6069] block mb-3">
                  Button Sizes
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm" variant="secondary">Small (36px)</Button>
                  <Button size="md" variant="secondary">Medium (44px)</Button>
                  <Button size="lg" variant="primary">Large (50px)</Button>
                </div>
              </div>

              {/* Icon Buttons */}
              <div className="pt-4 border-t border-[#D5CFC3]">
                <span className="text-xs font-mono uppercase text-[#5C6069] block mb-3">
                  Icon Buttons
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <IconButton icon={Settings} variant="secondary" title="Settings" />
                  <IconButton icon={RefreshCw} variant="secondary" title="Refresh" />
                  <IconButton icon={Bell} variant="secondary" title="Notifications" />
                  <IconButton icon={Shield} variant="primary" title="Security" />
                  <IconButton icon={HelpCircle} variant="ghost" title="Help" />
                  <IconButton icon={Settings} variant="secondary" disabled title="Disabled" />
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* 4. Form Inputs */}
        <section className="mb-14">
          <SectionHeading
            badge="04. Form Inputs"
            title="Text Inputs & Form Fields"
            subtitle="Notebook-styled inputs with standard and ruled options, icons, and error states."
          />

          <Card variant="default">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Player Call-Sign"
                helperText="3 to 16 characters"
                placeholder="Enter player name"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                icon={User}
              />

              <Input
                label="Lobby Password (Private)"
                type="password"
                placeholder="Leave blank for public room"
                helperText="Optional"
              />

              <Input
                label="Ruled Paper Style Input"
                variant="ruled"
                placeholder="Write your squad note here..."
                helperText="Minimal notebook line style"
              />

              <Input
                label="Input With Validation Error"
                placeholder="Room code"
                defaultValue="ROOM_FULL_44"
                error="Room is currently at maximum capacity (4/4 players)"
              />
            </div>
          </Card>
        </section>

        {/* 5. Paper Panels & Cards */}
        <section className="mb-14">
          <SectionHeading
            badge="05. Paper Surfaces"
            title="Paper Panels & Card Variations"
            subtitle="Paper cards with natural drop-shadows, ruled variants, and washi tape accents."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="default">
              <span className="text-xs font-mono text-[#5C6069] block mb-1">Variant 1</span>
              <h4 className="text-lg font-handwriting font-bold text-[#23252A] mb-2">
                Standard Paper Sheet
              </h4>
              <p className="text-xs text-[#5C6069] leading-relaxed font-sans">
                Warm ivory background with subtle pencil line border and gentle paper elevation.
              </p>
            </Card>

            <Card variant="ruled">
              <span className="text-xs font-mono text-[#5C6069] block mb-1">Variant 2</span>
              <h4 className="text-lg font-handwriting font-bold text-[#23252A] mb-2">
                Ruled Note Card
              </h4>
              <p className="text-xs text-[#5C6069] leading-relaxed font-sans">
                Includes subtle 26px blue/grey ruled lines for lists and score tallies.
              </p>
            </Card>

            <Card variant="taped">
              <span className="text-xs font-mono text-[#5C6069] block mb-1">Variant 3</span>
              <h4 className="text-lg font-handwriting font-bold text-[#23252A] mb-2">
                Washi Taped Card
              </h4>
              <p className="text-xs text-[#5C6069] leading-relaxed font-sans">
                Features a semi-translucent top tape accent for pinned game notices.
              </p>
            </Card>
          </div>
        </section>

        {/* 6. Loading Indicators & Modal */}
        <section className="mb-14">
          <SectionHeading
            badge="06. Feedback & Modals"
            title="Loading States & Dialogs"
            subtitle="Pencil lead bouncing animation and full notebook modal window."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="default" className="flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-[#5C6069] block mb-3">
                  Pencil Lead Loading Indicators
                </span>
                <div className="space-y-4 py-2">
                  <div className="flex items-center space-x-6">
                    <LoadingIndicator size="sm" label="Connecting..." />
                  </div>
                  <div className="flex items-center space-x-6">
                    <LoadingIndicator size="md" label="Sketching room..." />
                  </div>
                  <div className="flex items-center space-x-6">
                    <LoadingIndicator size="lg" label="Syncing game tick..." />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#D5CFC3] text-xs text-[#8E949F]">
                Lightweight CSS/Framer Motion keyframes without GIF or heavy assets.
              </div>
            </Card>

            <Card variant="default" className="flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-[#5C6069] block mb-3">
                  Paper Sheet Modal
                </span>
                <p className="text-xs text-[#5C6069] mb-4 font-sans">
                  Accessible, keyboard-friendly (ESC), backdrop-blurred notebook dialog.
                </p>
                <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                  Open Demo Modal
                </Button>
              </div>

              <div className="pt-4 border-t border-[#D5CFC3] text-xs text-[#8E949F]">
                Handles mobile viewports, outside click dismissal, and focus trapping.
              </div>
            </Card>
          </div>
        </section>

        {/* 7. 2D Drawing and Animation Foundation */}
        <section className="mb-14">
          <SectionHeading
            badge="07. 2D Animation Foundation"
            title="SVG Pencil-Stroke Drawing Engine"
            subtitle="Demonstrates the GSAP path-reveal animation for future hand-drawn 2D pencil characters."
          />

          <div className="max-w-md mx-auto">
            <PencilStrokeDemo />
          </div>
        </section>

        {/* Footer Note */}
        <footer className="pt-8 border-t border-[#D5CFC3] text-center text-xs font-mono text-[#5C6069]">
          ODD WAR &bull; Task 02 Design System & Animation Foundation Completed &bull; Ready for Task 03 Approval
        </footer>

        {/* Demo Modal Instance */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Notebook Modal Dialog"
          subtitle="Task 02 Reusable UI Component Test"
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Dismiss
              </Button>
              <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                Confirm Action
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p>
              This is a demonstration of the <strong>ODD WAR Paper Sheet Modal</strong>.
            </p>
            <p className="text-xs text-[#5C6069] leading-relaxed">
              It matches the warm cream notebook aesthetic with graphite text, a subtle pencil-line header, 
              responsive padding, and smooth entrance animation. It will be used for room creation, 
              settings, and match statistics in subsequent tasks.
            </p>
          </div>
        </Modal>
      </div>
    </NotebookBackground>
  );
};

export default DesignSystemPreview;
