import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingScreen } from '../components/LoadingScreen';

const SlideIn: React.FC<{ children: React.ReactNode, direction: 'left' | 'right' | 'up', delay?: number }> = ({ children, direction, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  let transformClass = "";
  if (direction === 'left') transformClass = "-translate-x-24";
  if (direction === 'right') transformClass = "translate-x-24";
  if (direction === 'up') transformClass = "translate-y-24";

  return (
    <div 
      ref={ref} 
      className={`transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible ? "opacity-100 translate-x-0 translate-y-0" : `opacity-0 ${transformClass}`
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [introComplete, setIntroComplete] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isToggleOn, setIsToggleOn] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (textRef.current) {
        setIsScrolled(textRef.current.getBoundingClientRect().top <= 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <LoadingScreen onComplete={() => setIntroComplete(true)} />

      <div
        className={`min-h-screen bg-[#F7F7F7] text-[#111] font-['Inter',sans-serif] antialiased transition-opacity duration-1000 overflow-x-hidden ${
          introComplete ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* NAVBAR */}
        <nav className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex justify-between items-center bg-transparent transition-all duration-300">
          <SlideIn direction="left">
            <div className="flex items-center gap-10">
              <div className="font-black tracking-widest uppercase text-xl text-black">
                Alliure
              </div>
              <a href="#how-it-works" className="text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-black transition">
                How it works
              </a>
              <a href="#support" className="text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-black transition">
                Support
              </a>
              <a href="#contact" className="text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-black transition">
                Contact
              </a>
            </div>
          </SlideIn>
          <SlideIn direction="right">
            <div className="flex items-center gap-8">
              <button
                onClick={() => navigate('/login')}
                className="text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-black transition"
              >
                Sign In
              </button>
              {/* Functional Toggle Button */}
              <button 
                onClick={() => setIsToggleOn(!isToggleOn)}
                className={`w-12 h-6 rounded-full border relative transition-colors duration-300 ${isToggleOn ? 'bg-black border-black' : 'bg-gray-300 border-gray-400'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${isToggleOn ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </SlideIn>
        </nav>

        {/* HERO SECTION */}
        <div className="relative w-full h-screen pt-24 pb-6 box-border">
          {/* The Grid Overlay */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-[1.5fr_1.5fr_2fr] grid-rows-[1fr_1fr_1.5fr]">
            <div className="col-start-2 row-span-3 border-l border-dotted border-gray-400/50" />
            <div className="col-start-3 row-span-3 border-l border-dotted border-gray-400/50" />
            <div className="row-start-2 col-span-3 border-t border-dotted border-gray-400/50" />
            <div className="row-start-3 col-span-3 border-t border-dotted border-gray-400/50" />
          </div>

          {/* Content Container */}
          <div className="relative z-10 w-full h-full grid grid-cols-[1.5fr_1.5fr_2fr] grid-rows-[1fr_1fr_1.5fr] px-6">
            
            <div className="col-start-1 row-start-1 flex flex-col justify-end pr-4 pb-4"></div>
            <div className="col-start-2 row-start-1 pl-4 flex flex-col justify-end pb-4"></div>

            {/* Row 2 - Geometric Shape */}
            <div className="col-start-1 col-span-2 row-start-2 relative flex items-center justify-center">
              <SlideIn direction="left" delay={200}>
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <div className="absolute inset-0 border-[8px] border-black rounded-full border-t-gray-300 border-l-gray-300 transform -rotate-45" />
                  <div className="absolute w-28 h-28 border-[4px] border-dotted border-gray-500 rounded-full animate-[spin_30s_linear_infinite]" />
                </div>
              </SlideIn>
            </div>

            {/* Row 3 - Fading Text */}
            <div 
              ref={textRef}
              className={`col-start-1 col-span-2 row-start-3 flex items-end pb-8 transition-opacity duration-300 ease-in-out ${
                isScrolled ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <SlideIn direction="left" delay={400}>
                <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-semibold tracking-tight text-black leading-none">
                  Meet<br />Alliure
                </h1>
              </SlideIn>
            </div>

            <div 
              className={`col-start-3 row-start-3 flex items-end pb-12 pl-4 pr-12 transition-opacity duration-300 ease-in-out ${
                isScrolled ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <SlideIn direction="right" delay={600}>
                <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 leading-snug font-medium max-w-lg">
                  Alliure redefines engineering workflows, empowering you to scale development, predict risks, and launch faster—unlocking your <span className="text-black font-semibold">true velocity</span>.
                </p>
              </SlideIn>
            </div>
          </div>
        </div>

        {/* REST OF THE PAGE SECTIONS */}
        
        {/* THE PROBLEM */}
        <section className="py-32 px-6 border-t border-dotted border-gray-400/50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
            <SlideIn direction="left">
              <div>
                <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 mb-6">01 — The Problem</h2>
                <h3 className="text-4xl md:text-5xl font-semibold tracking-tight text-black leading-tight">
                  Status reporting is fundamentally broken.
                </h3>
              </div>
            </SlideIn>
            <SlideIn direction="right" delay={200}>
              <div className="flex flex-col justify-end h-full">
                <p className="text-lg text-gray-600 leading-relaxed font-medium">
                  Engineers hate writing status updates. Managers hate chasing them. Executives can't trust them because they're based on estimates, not facts. The result? Hidden risks, stalled projects, and missed deadlines.
                </p>
              </div>
            </SlideIn>
          </div>
        </section>

        {/* THE ALLIURE APPROACH */}
        <section className="py-32 px-6 bg-black text-white overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
            <SlideIn direction="left">
              <div>
                <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 mb-6">02 — The Approach</h2>
                <h3 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
                  Data-driven evidence over subjective estimation.
                </h3>
              </div>
            </SlideIn>
            <SlideIn direction="right" delay={200}>
              <div className="flex flex-col justify-end h-full">
                <p className="text-lg text-gray-400 leading-relaxed font-medium">
                  We believe progress should be measured by code, not conversations. Alliure connects directly to your repositories and project management tools to synthesize a ground-truth picture of your organization's velocity.
                </p>
              </div>
            </SlideIn>
          </div>
        </section>

        {/* WHAT WE TRACK */}
        <section className="py-32 px-6 border-b border-dotted border-gray-400/50 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <SlideIn direction="left">
              <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 mb-16">03 — What We Track</h2>
            </SlideIn>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {['Code Commits', 'Pull Requests', 'Issue Velocity'].map((item, i) => (
                <SlideIn key={item} direction="up" delay={i * 150}>
                  <div className="border border-dotted border-gray-400/50 p-8 flex flex-col justify-between h-64 hover:bg-white transition-colors duration-300">
                    <div className="text-3xl font-light text-gray-400">0{i + 1}</div>
                    <h4 className="text-xl font-semibold tracking-tight text-black">{item}</h4>
                  </div>
                </SlideIn>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-32 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
            <SlideIn direction="left">
              <div>
                <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 mb-6">04 — How It Works</h2>
                <h3 className="text-4xl md:text-5xl font-semibold tracking-tight text-black leading-tight">
                  AI powered risk prediction engine.
                </h3>
              </div>
            </SlideIn>
            <SlideIn direction="right" delay={200}>
              <div className="flex flex-col justify-end">
                <p className="text-lg text-gray-600 leading-relaxed font-medium mb-8">
                  Our machine learning models analyze historical project data and real-time developer activity. When a task begins to show patterns associated with past delays, Alliure flags it instantly.
                </p>
                <div className="h-[200px] w-full border border-dotted border-gray-400/50 flex items-center justify-center bg-gray-50 relative overflow-hidden">
                   <div className="absolute inset-0 grid grid-cols-[1fr_1fr] grid-rows-[1fr_1fr]">
                      <div className="border-r border-b border-dotted border-gray-300" />
                      <div className="border-b border-dotted border-gray-300" />
                      <div className="border-r border-dotted border-gray-300" />
                   </div>
                   <div className="relative z-10 w-16 h-16 bg-black rounded-full flex items-center justify-center animate-pulse">
                     <div className="w-6 h-6 border border-white rounded-full" />
                   </div>
                </div>
              </div>
            </SlideIn>
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section id="support" className="py-32 px-6 border-t border-dotted border-gray-400/50 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <SlideIn direction="up">
              <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 mb-16 text-center">05 — Built for the whole team</h2>
            </SlideIn>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <SlideIn direction="up" delay={100}>
                <div>
                  <h4 className="text-xl font-semibold tracking-tight text-black mb-4">Executives</h4>
                  <p className="text-sm text-gray-600 font-medium">Instant portfolio health without chasing managers. See what's actually shipping.</p>
                </div>
              </SlideIn>
              <SlideIn direction="up" delay={250}>
                <div>
                  <h4 className="text-xl font-semibold tracking-tight text-black mb-4">Project Managers</h4>
                  <p className="text-sm text-gray-600 font-medium">Stop begging for updates. Focus on unblocking the high-risk items Alliure identifies.</p>
                </div>
              </SlideIn>
              <SlideIn direction="up" delay={400}>
                <div>
                  <h4 className="text-xl font-semibold tracking-tight text-black mb-4">Developers</h4>
                  <p className="text-sm text-gray-600 font-medium">Write code, not reports. Your commits automatically update your task progress.</p>
                </div>
              </SlideIn>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="contact" className="py-32 px-6 bg-[#F7F7F7] border-t border-solid border-black overflow-hidden">
          <SlideIn direction="up">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-5xl md:text-7xl font-semibold tracking-tight text-black mb-10">
                Ready to see beyond status?
              </h2>
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-black text-white text-xs font-semibold tracking-widest uppercase hover:bg-gray-800 transition"
              >
                Launch Dashboard
              </button>
            </div>
          </SlideIn>
        </section>

        {/* FOOTER */}
        <footer className="py-12 px-6 border-t border-dotted border-gray-400/50 text-center flex flex-col items-center gap-4">
           <div className="font-bold tracking-[0.2em] uppercase text-xs text-black">
              Alliure
           </div>
           <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">
             © 2026 Alliure Systems
           </p>
        </footer>

      </div>
    </>
  );
};
