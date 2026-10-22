import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingScreen } from '../components/LoadingScreen';

const SlideIn: React.FC<{ children: React.ReactNode; direction: 'left' | 'right' | 'up'; delay?: number }> = ({ children, direction, delay = 0 }) => {
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
  // Default is false (Light Mode). True = Dark Mode.
  const [isDarkMode, setIsDarkMode] = useState(false);
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

  // Theme-dependent classes
  const themeBg = isDarkMode ? 'bg-[#0B1120]' : 'bg-[#F7F7F7]';
  const themeText = isDarkMode ? 'text-white' : 'text-[#111]';
  const themeMuted = isDarkMode ? 'text-slate-400' : 'text-gray-500';
  const themeParagraph = isDarkMode ? 'text-slate-300' : 'text-gray-600';
  const themeDotted = isDarkMode ? 'border-slate-800' : 'border-gray-400/50';
  const themeCardBg = isDarkMode ? 'bg-[#131D33] hover:bg-[#18233C]' : 'hover:bg-white';
  const themeAltSection = isDarkMode ? 'bg-[#070C18]' : 'bg-black text-white';

  return (
    <>
      <LoadingScreen onComplete={() => setIntroComplete(true)} />

      <div
        className={`min-h-screen ${themeBg} ${themeText} font-['Inter',sans-serif] antialiased transition-colors duration-500 overflow-x-hidden`}
        style={{
          opacity: introComplete ? 1 : 0,
          transform: introComplete ? 'translateY(0)' : 'translateY(32px)',
          transition: introComplete
            ? 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)'
            : 'none',
        }}
      >
        {/* NAVBAR */}
        <nav className={`fixed top-0 left-0 w-full z-50 px-8 py-5 flex justify-between items-center transition-all duration-300 backdrop-blur-md ${isDarkMode ? 'bg-[#0B1120]/80 border-b border-slate-800/80' : 'bg-[#F7F7F7]/80'}`}>
          <SlideIn direction="left">
            <div className="flex items-center gap-10">
              <div className={`font-black tracking-[0.25em] uppercase text-xl ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Alliure
              </div>
              <a href="#how-it-works" className={`text-xs font-bold tracking-widest uppercase ${themeMuted} hover:${themeText} transition`}>
                How it works
              </a>
              <a href="#support" className={`text-xs font-bold tracking-widest uppercase ${themeMuted} hover:${themeText} transition`}>
                Role Matrix
              </a>
              <a href="#contact" className={`text-xs font-bold tracking-widest uppercase ${themeMuted} hover:${themeText} transition`}>
                Launch
              </a>
            </div>
          </SlideIn>

          <SlideIn direction="right">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/login')}
                className={`text-xs font-bold tracking-widest uppercase ${themeMuted} hover:${themeText} transition`}
              >
                Sign In
              </button>

              {/* Simple Sliding Toggle Button */}
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                aria-label="Toggle theme"
                title={isDarkMode ? "Switch to light theme" : "Switch to dark theme"}
                className={`w-12 h-6 rounded-full border relative transition-colors duration-300 p-0.5 cursor-pointer ${
                  isDarkMode ? 'bg-black border-slate-700' : 'bg-gray-300 border-gray-400'
                }`}
              >
                <div 
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`} 
                />
              </button>
            </div>
          </SlideIn>
        </nav>

        {/* HERO SECTION */}
        <div className="relative w-full h-screen pt-24 pb-6 box-border">
          {/* The Grid Overlay */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-[1.5fr_1.5fr_2fr] grid-rows-[1fr_1fr_1.5fr]">
            <div className={`col-start-2 row-span-3 border-l border-dotted ${themeDotted}`} />
            <div className={`col-start-3 row-span-3 border-l border-dotted ${themeDotted}`} />
            <div className={`row-start-2 col-span-3 border-t border-dotted ${themeDotted}`} />
            <div className={`row-start-3 col-span-3 border-t border-dotted ${themeDotted}`} />
          </div>

          {/* Content Container */}
          <div className="relative z-10 w-full h-full grid grid-cols-[1.5fr_1.5fr_2fr] grid-rows-[1fr_1fr_1.5fr] px-6">
            <div className="col-start-1 row-start-1 flex flex-col justify-end pr-4 pb-4">
              <span className={`text-[10px] font-bold tracking-[0.3em] uppercase ${themeMuted}`}>
                SYSTEM ACTIVE // v2.4
              </span>
            </div>
            <div className="col-start-2 row-start-1 pl-4 flex flex-col justify-end pb-4">
              <span className={`text-[10px] font-bold tracking-[0.3em] uppercase ${themeMuted}`}>
                PREDICTIVE EVIDENCE ENGINE
              </span>
            </div>

            {/* Row 2 - Geometric Shape */}
            <div className="col-start-1 col-span-2 row-start-2 relative flex items-center justify-center">
              <SlideIn direction="left" delay={200}>
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <div className={`absolute inset-0 border-[8px] rounded-full transform -rotate-45 transition-colors ${
                    isDarkMode 
                      ? 'border-white border-t-slate-700 border-l-slate-700' 
                      : 'border-black border-t-gray-300 border-l-gray-300'
                  }`} />
                  <div className={`absolute w-28 h-28 border-[4px] border-dotted rounded-full animate-[spin_30s_linear_infinite] ${
                    isDarkMode ? 'border-sky-500/60' : 'border-gray-500'
                  }`} />
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
                <h1 className={`text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-semibold tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>
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
                <div>
                  <p className={`text-lg sm:text-xl lg:text-2xl leading-snug font-medium max-w-lg ${themeParagraph}`}>
                    Alliure redefines engineering workflows, cross-referencing self-reported task status against GitHub evidence to predict risk and unlock your <span className={`font-semibold ${isDarkMode ? 'text-sky-400' : 'text-black'}`}>true velocity</span>.
                  </p>
                  <div className="mt-6 flex items-center gap-4">
                    <button
                      onClick={() => navigate('/login')}
                      className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition shadow-lg ${
                        isDarkMode 
                          ? 'bg-white text-black hover:bg-slate-200 shadow-white/10' 
                          : 'bg-black text-white hover:bg-gray-800 shadow-black/20'
                      }`}
                    >
                      Open Platform
                    </button>
                  </div>
                </div>
              </SlideIn>
            </div>
          </div>
        </div>

        {/* 01 — THE PROBLEM */}
        <section className={`py-32 px-6 border-t border-dotted ${themeDotted} relative overflow-hidden`}>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
            <SlideIn direction="left">
              <div>
                <h2 className={`text-xs font-semibold tracking-[0.2em] uppercase ${themeMuted} mb-6`}>01 — The Problem</h2>
                <h3 className={`text-4xl md:text-5xl font-semibold tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Status reporting is fundamentally broken.
                </h3>
              </div>
            </SlideIn>
            <SlideIn direction="right" delay={200}>
              <div className="flex flex-col justify-end h-full">
                <p className={`text-lg leading-relaxed font-medium ${themeParagraph}`}>
                  Engineers hate writing status updates. Managers hate chasing them. Executives can't trust them because they're based on subjective estimates, not verifiable facts. The result? Hidden risks, stalled milestones, and blown deadlines.
                </p>
              </div>
            </SlideIn>
          </div>
        </section>

        {/* 02 — THE ALLIURE APPROACH */}
        <section className={`py-32 px-6 ${themeAltSection} overflow-hidden border-y border-dotted ${themeDotted}`}>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
            <SlideIn direction="left">
              <div>
                <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 mb-6">02 — The Approach</h2>
                <h3 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight text-white">
                  Data-driven evidence over subjective estimation.
                </h3>
              </div>
            </SlideIn>
            <SlideIn direction="right" delay={200}>
              <div className="flex flex-col justify-end h-full">
                <p className="text-lg text-gray-300 leading-relaxed font-medium">
                  Progress must be validated by code, not conversations. Alliure connects directly to Git commits, pull requests, work logs, and subtasks to synthesize an objective, ground-truth picture of your software delivery velocity.
                </p>
              </div>
            </SlideIn>
          </div>
        </section>

        {/* 03 — WHAT WE TRACK */}
        <section className={`py-32 px-6 border-b border-dotted ${themeDotted} overflow-hidden`}>
          <div className="max-w-7xl mx-auto">
            <SlideIn direction="left">
              <h2 className={`text-xs font-semibold tracking-[0.2em] uppercase ${themeMuted} mb-16`}>03 — What We Track</h2>
            </SlideIn>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Code Commits & PRs', desc: 'Real-time telemetry tracking commit frequency, additions/deletions, and pull request activity.' },
                { title: 'Subtask Checklist Evidence', desc: 'Validates that estimated subcomponents are actually completed rather than just checked off at once.' },
                { title: 'Hybrid Machine Learning', desc: 'Scikit-Learn Random Forest model blending historical delay trends with real-time risk indicators.' }
              ].map((item, i) => (
                <SlideIn key={item.title} direction="up" delay={i * 150}>
                  <div className={`border border-dotted ${themeDotted} p-8 flex flex-col justify-between h-72 transition-colors duration-300 ${themeCardBg} rounded-xl`}>
                    <div className="text-3xl font-light text-gray-400">0{i + 1}</div>
                    <div>
                      <h4 className={`text-xl font-semibold tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>{item.title}</h4>
                      <p className={`text-xs leading-relaxed ${themeParagraph}`}>{item.desc}</p>
                    </div>
                  </div>
                </SlideIn>
              ))}
            </div>
          </div>
        </section>

        {/* 04 — HOW IT WORKS */}
        <section id="how-it-works" className="py-32 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
            <SlideIn direction="left">
              <div>
                <h2 className={`text-xs font-semibold tracking-[0.2em] uppercase ${themeMuted} mb-6`}>04 — How It Works</h2>
                <h3 className={`text-4xl md:text-5xl font-semibold tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  AI powered risk prediction engine.
                </h3>
              </div>
            </SlideIn>
            <SlideIn direction="right" delay={200}>
              <div className="flex flex-col justify-end">
                <p className={`text-lg leading-relaxed font-medium mb-8 ${themeParagraph}`}>
                  Our machine learning model analyzes historical project data, deadline proximity, and real-time developer activity. When a task exhibits patterns associated with past delays, Alliure calculates a Delay Probability (%) and alerts managers immediately.
                </p>
                <div className={`h-[200px] w-full border border-dotted ${themeDotted} flex items-center justify-center relative overflow-hidden rounded-xl ${isDarkMode ? 'bg-[#131D33]' : 'bg-gray-50'}`}>
                   <div className="absolute inset-0 grid grid-cols-[1fr_1fr] grid-rows-[1fr_1fr] opacity-40">
                      <div className={`border-r border-b border-dotted ${themeDotted}`} />
                      <div className={`border-b border-dotted ${themeDotted}`} />
                      <div className={`border-r border-dotted ${themeDotted}`} />
                   </div>
                   <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center animate-pulse ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>
                     <div className={`w-6 h-6 border rounded-full ${isDarkMode ? 'border-black' : 'border-white'}`} />
                   </div>
                </div>
              </div>
            </SlideIn>
          </div>
        </section>

        {/* 05 — WHO IT'S FOR */}
        <section id="support" className={`py-32 px-6 border-t border-dotted ${themeDotted} overflow-hidden`}>
          <div className="max-w-7xl mx-auto">
            <SlideIn direction="up">
              <h2 className={`text-xs font-semibold tracking-[0.2em] uppercase ${themeMuted} mb-16 text-center`}>
                05 — Enterprise Access & Governance
              </h2>
            </SlideIn>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <SlideIn direction="up" delay={100}>
                <div className={`p-8 border border-dotted ${themeDotted} rounded-xl ${themeCardBg} transition-colors`}>
                  <div className="text-xs font-bold tracking-widest uppercase text-sky-400 mb-2">Tier 01</div>
                  <h4 className={`text-xl font-semibold tracking-tight mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>System Admin</h4>
                  <p className={`text-xs leading-relaxed ${themeParagraph}`}>
                    Highest governance authority. Seeds workspaces, monitors full-system audit logs, and provisions accounts for Project Managers and Developers.
                  </p>
                </div>
              </SlideIn>
              <SlideIn direction="up" delay={250}>
                <div className={`p-8 border border-dotted ${themeDotted} rounded-xl ${themeCardBg} transition-colors`}>
                  <div className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-2">Tier 02</div>
                  <h4 className={`text-xl font-semibold tracking-tight mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>Project Manager</h4>
                  <p className={`text-xs leading-relaxed ${themeParagraph}`}>
                    Created by Admin. Manages sprint delivery, unblocks tasks, and invites/provisions Developer accounts for their projects.
                  </p>
                </div>
              </SlideIn>
              <SlideIn direction="up" delay={400}>
                <div className={`p-8 border border-dotted ${themeDotted} rounded-xl ${themeCardBg} transition-colors`}>
                  <div className="text-xs font-bold tracking-widest uppercase text-indigo-400 mb-2">Tier 03</div>
                  <h4 className={`text-xl font-semibold tracking-tight mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>Developer</h4>
                  <p className={`text-xs leading-relaxed ${themeParagraph}`}>
                    Invited by Admin or PM. Focuses on writing code, checking subtasks, and logging work while automated telemetry keeps status up-to-date.
                  </p>
                </div>
              </SlideIn>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="contact" className={`py-32 px-6 border-t border-solid ${isDarkMode ? 'border-slate-800 bg-[#070C18]' : 'border-black bg-[#F7F7F7]'} overflow-hidden`}>
          <SlideIn direction="up">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className={`text-5xl md:text-7xl font-semibold tracking-tight mb-10 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Ready to see beyond status?
              </h2>
              <button 
                onClick={() => navigate('/login')}
                className={`px-8 py-4 text-xs font-semibold tracking-widest uppercase transition rounded-xl shadow-xl ${
                  isDarkMode 
                    ? 'bg-white text-black hover:bg-slate-200 shadow-white/10' 
                    : 'bg-black text-white hover:bg-gray-800 shadow-black/20'
                }`}
              >
                Launch Dashboard
              </button>
            </div>
          </SlideIn>
        </section>

        {/* FOOTER */}
        <footer className={`py-12 px-6 border-t border-dotted ${themeDotted} text-center flex flex-col items-center gap-4`}>
           <div className={`font-bold tracking-[0.25em] uppercase text-xs ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Alliure
           </div>
           <p className={`text-[10px] font-semibold tracking-widest uppercase ${themeMuted}`}>
             © 2026 Alliure Systems // Alliure Core
           </p>
        </footer>

      </div>
    </>
  );
};
