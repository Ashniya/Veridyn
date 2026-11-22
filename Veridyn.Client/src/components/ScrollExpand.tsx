import React, { useCallback, useEffect, useRef } from 'react';
import './ScrollExpand.css';

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

export interface ScrollExpandProps {
  src?: string;
  mediaType?: 'image' | 'video';
  poster?: string;
  alt?: string;
  title?: string;
  scrollHint?: string;
  startWidth?: number;
  startHeight?: number;
  startRadius?: number;
  endRadius?: number;
  mediaZoom?: number;
  scrollDistance?: number;
  holdDistance?: number;
  smoothing?: number;
  overlayScrim?: number;
  enabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ScrollExpand: React.FC<ScrollExpandProps> = ({
  src = '',
  mediaType = 'image',
  poster = '',
  alt = '',
  title = 'WHAT WE DO',
  scrollHint = 'Scroll to expand',
  startWidth = 48,
  startHeight = 60,
  startRadius = 24,
  endRadius = 0,
  mediaZoom = 1.15,
  scrollDistance = 1.8,
  holdDistance = 1.0,
  smoothing = 0.08,
  overlayScrim = 0.85,
  enabled = true,
  className = '',
  style,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<any>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const text1Ref = useRef<HTMLDivElement>(null);
  const text2Ref = useRef<HTMLDivElement>(null);

  const propsRef = useRef<any>({});
  propsRef.current = {
    startWidth,
    startHeight,
    startRadius,
    endRadius,
    mediaZoom,
    scrollDistance,
    holdDistance,
    smoothing,
    overlayScrim,
    enabled
  };

  const applyProgress = useCallback((p: number) => {
    const frame = frameRef.current;
    const media = mediaRef.current;
    if (!frame || !media) return;
    const c = propsRef.current;

    // Phase 1 (0 to 0.30): Expand image to full screen. It is 100% full screen by p = 0.30!
    const expandProgress = clamp(p / 0.30, 0, 1);
    const e = smoothstep(0, 1, expandProgress);

    const w = c.startWidth + (100 - c.startWidth) * e;
    const h = c.startHeight + (100 - c.startHeight) * e;
    const ix = Math.max(0, (100 - w) / 2);
    const iy = Math.max(0, (100 - h) / 2);
    const r = c.startRadius + (c.endRadius - c.startRadius) * e;
    frame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`;

    media.style.transform = `scale(${c.mediaZoom + (1 - c.mediaZoom) * e})`;

    if (scrimRef.current) {
      scrimRef.current.style.opacity = `${c.overlayScrim * e}`;
    }

    // Initial "WHAT WE DO" header fades out as it expands (0.05 to 0.25)
    if (titleRef.current) {
      const titleOut = smoothstep(0.05, 0.25, p);
      titleRef.current.style.opacity = `${1 - titleOut}`;
      titleRef.current.style.transform = `translate3d(0, ${-25 * titleOut}px, 0)`;
    }

    if (hintRef.current) {
      const hintGone = smoothstep(0, 0.10, p);
      hintRef.current.style.opacity = `${1 - hintGone}`;
      hintRef.current.style.transform = `translate3d(0, ${10 * hintGone}px, 0)`;
    }

    // Phase 2 (0.30 to 0.60): First Message (Evidence Validation)
    // Image is 100% fully expanded here!
    if (text1Ref.current) {
      const fadeIn = smoothstep(0.30, 0.38, p);
      const fadeOut = smoothstep(0.55, 0.63, p);
      const netOpacity = fadeIn * (1 - fadeOut);
      const translateY = 15 * (1 - fadeIn) - 15 * fadeOut;
      text1Ref.current.style.opacity = `${netOpacity}`;
      text1Ref.current.style.transform = `translate3d(0, ${translateY}px, 0)`;
      text1Ref.current.style.pointerEvents = netOpacity > 0.5 ? 'auto' : 'none';
    }

    // Phase 3 (0.62 to 0.95): Second Message (AI Risk Forecasting)
    // Image is still 100% full screen pinned!
    if (text2Ref.current) {
      const fadeIn2 = smoothstep(0.62, 0.70, p);
      text2Ref.current.style.opacity = `${fadeIn2}`;
      text2Ref.current.style.transform = `translate3d(0, ${15 * (1 - fadeIn2)}px, 0)`;
      text2Ref.current.style.pointerEvents = fadeIn2 > 0.5 ? 'auto' : 'none';
    }
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let current = 0;
    let target = 0;
    let stageH = 0;
    let running = false;

    const measure = () => {
      const c = propsRef.current;
      stageH = window.innerHeight;
      if (stageH <= 0) return;
      stage.style.height = `${stageH}px`;
      // Generous track height to guarantee image stays pinned while displaying both content slides
      track.style.height = `${stageH * (1 + c.scrollDistance + c.holdDistance)}px`;

      const w = window.innerWidth || stageH;
      stage.style.setProperty('--se-title-size', `${clamp(w * 0.05, 22, 64)}px`);
    };

    const readProgress = () => {
      const c = propsRef.current;
      if (!c.enabled) return 1;
      const totalScrollSpan = stageH * (c.scrollDistance + c.holdDistance);
      if (totalScrollSpan <= 0) return 1;

      const rect = track.getBoundingClientRect();
      const scrolled = -rect.top;
      return clamp(scrolled / totalScrollSpan, 0, 1);
    };

    const tick = () => {
      const c = propsRef.current;
      const k = c.smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * c.smoothing));
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.0003) {
        current = target;
        running = false;
      }
      applyProgress(current);
      raf = running ? requestAnimationFrame(tick) : 0;
    };

    const kick = () => {
      if (running) return;
      running = true;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      target = readProgress();
      if (propsRef.current.smoothing <= 0 || reduceMotion) {
        current = target;
        applyProgress(current);
        return;
      }
      kick();
    };

    const onResize = () => {
      measure();
      target = readProgress();
      current = target;
      applyProgress(current);
    };

    measure();
    target = readProgress();
    current = target;
    applyProgress(current);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [applyProgress]);

  const media =
    mediaType === 'video' ? (
      <video
        ref={mediaRef}
        className="scroll-expand__media"
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
      />
    ) : (
      <img ref={mediaRef} className="scroll-expand__media" src={src} alt={alt} draggable={false} />
    );

  return (
    <div
      ref={trackRef}
      className={`scroll-expand__track ${className}`.trim()}
      style={style}
    >
      <div ref={stageRef} className="scroll-expand__stage">
        <div ref={frameRef} className="scroll-expand__frame">
          {media}
          <div ref={scrimRef} className="scroll-expand__scrim" />

          {/* OVERLAY STAGE WITH SEQUENCED TEXT TRANSITIONS */}
          <div className="scroll-expand__overlay">
            {/* Slide 1: "WHAT WE DO" */}
            <div
              ref={text1Ref}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white text-center max-w-4xl mx-auto"
              style={{ opacity: 0 }}
            >
              <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-sky-400 mb-3">
                03 — What We Do
              </span>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
                Validate Engineering Velocity with Real Code.
              </h3>
              <p className="text-sm md:text-base text-gray-200 max-w-2xl leading-relaxed mb-6 font-normal">
                Instead of asking engineers to spend hours drafting status reports, Alliure automatically extracts proof directly from daily workflow activities—connecting git commits, pull requests, work logs, and subtask milestones into an indisputable Progress Evidence Score.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-gray-300">
                <span className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                  0 Manual Status Reports
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                  Direct GitHub Webhook Sync
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                  Granular Subtask Audit
                </span>
              </div>
            </div>

            {/* Slide 2: "HOW WE PREDICT DELAYS" */}
            <div
              ref={text2Ref}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white text-center max-w-4xl mx-auto"
              style={{ opacity: 0 }}
            >
              <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-emerald-400 mb-3">
                04 — How We Prevent Delays
              </span>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
                AI-Driven Risk & Schedule Forecasting.
              </h3>
              <p className="text-sm md:text-base text-gray-200 max-w-2xl leading-relaxed mb-6 font-normal">
                When a task displays signs of friction—stalled commits, lagging subtasks, or dependency roadblocks—our Scikit-Learn Random Forest model computes a real-time Delay Probability (%). Project managers receive instant alerts to step in and unblock developers days before deadlines are missed.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-gray-300">
                <span className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300">
                  Random Forest Model Active
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                  Real-Time Delay Probability
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                  Blocking Dependency Detection
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Initial title visible before expanding */}
        {title ? (
          <div ref={titleRef} className="scroll-expand__title">
            {title}
          </div>
        ) : null}

        {scrollHint ? (
          <div ref={hintRef} className="scroll-expand__hint">
            <span>{scrollHint}</span>
            <span className="text-sm animate-bounce">↓</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ScrollExpand;
