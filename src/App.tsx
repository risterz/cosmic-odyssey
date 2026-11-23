import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, AudioLines, Check, ChevronRight, Menu, Pause, Play, Plus, VolumeX, X } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { BrandMark } from './components/BrandMark';
import { useAmbientSound } from './hooks/useAmbientSound';
import { planets } from './data/planets';
import type { PlanetData, SceneName } from './types';
import type { JourneyProgress } from './components/SpaceCanvas';

gsap.registerPlugin(ScrollTrigger);
const SpaceCanvas = lazy(() => import('./components/SpaceCanvas'));
const chapters: { id: SceneName; label: string }[] = [
  { id: 'home', label: 'Origin' },
  { id: 'galaxy', label: 'Deep space' },
  { id: 'worlds', label: 'New worlds' },
  { id: 'weightless', label: 'Weightless' },
  { id: 'beyond', label: 'The beyond' },
];

export default function App() {
  const root = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const planetRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const journey = useRef<JourneyProgress>({ hero: 0, galaxy: 0, worlds: 0, pointerX: 0, pointerY: 0 });
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<SceneName>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const sound = useAmbientSound();
  const onReady = useCallback(() => setReady(true), []);
  const onPlanetSelect = useCallback((planet: PlanetData) => setSelectedPlanet(planet), []);
  const onLabelsUpdate = useCallback((positions: Record<string, { x: number; y: number; visible: boolean }>) => {
    Object.entries(positions).forEach(([id, { x, y, visible }]) => {
      const label = planetRefs.current[id];
      if (!label) return;
      if (!visible && document.activeElement === label) {
        document.querySelector<HTMLButtonElement>('.world-selector button')?.focus();
      }
      label.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      label.style.opacity = visible ? '1' : '0';
      label.style.pointerEvents = visible ? 'auto' : 'none';
      label.tabIndex = visible ? 0 : -1;
      label.inert = !visible;
      label.setAttribute('aria-hidden', String(!visible));
    });
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  const navigate = useCallback((id: SceneName, keepPlaying = false) => {
    if (menuRef.current?.contains(document.activeElement)) menuButtonRef.current?.focus();
    setMenuOpen(false);
    if (!keepPlaying) setPlaying(false);
    const element = document.getElementById(id);
    if (!element) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(element, { duration: reduced ? 0 : 1.3, immediate: reduced });
    } else {
      element.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' });
    }
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lenis = new Lenis({ duration: reduced ? 0 : 1.25, smoothWheel: !reduced });
    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const update = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    const context = gsap.context(() => {
      const progressTo = (key: 'hero' | 'galaxy' | 'worlds', id: string) => {
        ScrollTrigger.create({
          trigger: `#${id}`, start: 'top top', end: 'bottom bottom', scrub: reduced ? true : 1,
          onUpdate: (self) => { journey.current[key] = self.progress; },
        });
      };
      progressTo('hero', 'home');
      progressTo('galaxy', 'galaxy');
      progressTo('worlds', 'worlds');
      if (!reduced) {
        gsap.from('.header > *', { y: -20, opacity: 0, duration: 1.1, stagger: 0.12, delay: 0.3, ease: 'power3.out' });
        gsap.from('.hero-eyebrow, .hero-title > span, .hero-description, .hero-actions', {
          y: 50, opacity: 0, duration: 1.25, stagger: 0.11, delay: 0.4, ease: 'power3.out',
        });
        gsap.from('.hero-bottom > *', { y: 20, opacity: 0, duration: 1, stagger: 0.12, delay: 1.2, ease: 'power2.out' });
        gsap.to('.hero-content', {
          opacity: 0, y: -100, scale: 0.94, ease: 'none',
          scrollTrigger: { trigger: '#home', start: 'top top', end: '75% bottom', scrub: 1 },
        });
        gsap.to('.hero-planet-label', {
          opacity: 0, x: 50, ease: 'none',
          scrollTrigger: { trigger: '#home', start: '25% top', end: '75% bottom', scrub: 1 },
        });
        gsap.fromTo('.galaxy-visual', { xPercent: 12, scale: 1.16 }, {
          xPercent: -4, scale: 1, ease: 'none',
          scrollTrigger: { trigger: '#galaxy', start: 'top bottom', end: 'bottom top', scrub: 1 },
        });
        gsap.fromTo('.astronaut', { yPercent: 32, rotate: -19 }, {
          yPercent: -25, rotate: 13, ease: 'none',
          scrollTrigger: { trigger: '#weightless', start: 'top bottom', end: 'bottom top', scrub: 1.3 },
        });
        gsap.fromTo('.earth-horizon', { yPercent: 35 }, {
          yPercent: -8, ease: 'none',
          scrollTrigger: { trigger: '#weightless', start: 'top bottom', end: 'bottom top', scrub: 1 },
        });
        gsap.fromTo('.beyond-orb', { yPercent: 50, scale: 0.85 }, {
          yPercent: 8, scale: 1.12, ease: 'none',
          scrollTrigger: { trigger: '#beyond', start: 'top bottom', end: 'bottom bottom', scrub: 1 },
        });
      }
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((element) => {
        if (reduced) return;
        gsap.fromTo(element, { y: 65, opacity: 0 }, {
          y: 0, opacity: 1, ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 88%', end: 'top 50%', scrub: 1 },
        });
      });
    }, root);

    const observers = chapters.map(({ id }) => {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) setActive(id);
      }, { rootMargin: '-35% 0px -35% 0px' });
      observer.observe(document.getElementById(id)!);
      return observer;
    });
    return () => {
      observers.forEach((observer) => observer.disconnect());
      context.revert();
      gsap.ticker.remove(update);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menuOpen || !menu) return;
    const focusable = Array.from(menu.querySelectorAll<HTMLButtonElement>('button:not([inert])'));
    menu.inert = false;
    focusable[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== 'Tab' || !focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const open = Boolean(selectedPlanet || aboutOpen || creditsOpen || tourOpen);
    if (open && !dialog.open) {
      dialog.showModal();
      lenisRef.current?.stop();
    } else if (!open && dialog.open) {
      dialog.close();
      lenisRef.current?.start();
    }
  }, [selectedPlanet, aboutOpen, creditsOpen, tourOpen]);

  useEffect(() => {
    if (!playing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPlaying(false);
      return;
    }
    const sequence: SceneName[] = ['home', 'galaxy', 'worlds', 'weightless', 'beyond'];
    let index = 0;
    const home = document.getElementById('home');
    if (home) lenisRef.current?.scrollTo(home, { duration: 4, easing: (t) => 1 - Math.pow(1 - t, 3) });
    const timer = window.setInterval(() => {
      index += 1;
      if (index >= sequence.length) {
        window.clearInterval(timer);
        setPlaying(false);
        return;
      }
      const element = document.getElementById(sequence[index]);
      if (element) lenisRef.current?.scrollTo(element, { duration: 4, easing: (t) => 1 - Math.pow(1 - t, 3) });
    }, 8500);
    return () => window.clearInterval(timer);
  }, [playing]);

  const closeDialog = () => {
    setSelectedPlanet(null);
    setAboutOpen(false);
    setCreditsOpen(false);
    setTourOpen(false);
  };

  return (
    <div ref={root} className={`experience ${ready ? 'is-ready' : ''}`}>
      <a className="skip-link" href="#journey-content">Skip to journey</a>
      <div className="loader" aria-hidden={ready}>
        <BrandMark size={44} />
        <span>COSMIC ODYSSEY</span>
        <div className="loader-track"><span /></div>
        <small>PREPARING YOUR JOURNEY</small>
      </div>

      <div className="scene-layer">
        <Suspense fallback={null}>
          <SpaceCanvas journey={journey} onReady={onReady} onPlanetSelect={onPlanetSelect} onLabelsUpdate={onLabelsUpdate} />
        </Suspense>
        <div className="scene-vignette" />
        <div className="film-grain" />
      </div>

      <header className="header">
        <button className="brand" onClick={() => navigate('home')} aria-label="Cosmic Odyssey home">
          <BrandMark />
          <span>COSMIC<span className="brand-light"> ODYSSEY</span></span>
        </button>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <button className={active === 'galaxy' || active === 'weightless' ? 'active' : ''} onClick={() => navigate('galaxy')}>The Journey</button>
          <button className={active === 'worlds' ? 'active' : ''} onClick={() => navigate('worlds')}>Destinations</button>
          <button onClick={() => setAboutOpen(true)}>Our Mission</button>
        </nav>
        <div className="header-actions">
          <button className={`sound-toggle ${sound.enabled ? 'sound-on' : ''}`} onClick={sound.toggle} aria-label={sound.enabled ? 'Mute ambient sound' : 'Enable ambient sound'} aria-pressed={sound.enabled} title="Ambient sound (M)">
            {sound.enabled ? <AudioLines size={17} /> : <VolumeX size={17} />}
            <span>SOUND {sound.enabled ? 'ON' : 'OFF'}</span>
          </button>
          <button ref={menuButtonRef} className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation menu" aria-expanded={menuOpen} aria-controls="navigation-menu"><Menu size={21} /></button>
        </div>
      </header>

      <div ref={menuRef} id="navigation-menu" className={`menu-overlay ${menuOpen ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Journey navigation" aria-hidden={!menuOpen} inert={!menuOpen}>
        <div className="menu-top"><span>CHOOSE YOUR DIRECTION</span><button onClick={closeMenu} aria-label="Close navigation menu" tabIndex={menuOpen ? 0 : -1}><X /></button></div>
        <nav aria-label="Journey chapters">
          {chapters.map((chapter, index) => (
            <button key={chapter.id} onClick={() => navigate(chapter.id)} tabIndex={menuOpen ? 0 : -1}>
              <small>0{index + 1}</small><span>{chapter.label}</span><ArrowUpRight />
            </button>
          ))}
        </nav>
        <div className="menu-footer"><span>THE UNIVERSE IS CLOSER THAN YOU THINK.</span><span>EST. 2026 · EARTH</span></div>
      </div>

      <aside className="chapter-rail" aria-label="Current chapter">
        <span className="rail-line" />
        {chapters.map((chapter, index) => (
          <button key={chapter.id} className={active === chapter.id ? 'current' : ''} onClick={() => navigate(chapter.id)} aria-label={`Go to ${chapter.label}`} aria-current={active === chapter.id ? 'step' : undefined}>
            <span>0{index + 1}</span><i /><b>{chapter.label}</b>
          </button>
        ))}
        <span className="rail-line" />
      </aside>

      <main id="journey-content">
        <section className="chapter hero-chapter" id="home" aria-labelledby="hero-title">
          <div className="chapter-sticky hero-sticky">
            <div className="hero-content page-gutter">
              <p className="eyebrow hero-eyebrow"><span /> NOT JUST A JOURNEY. A NEW PERSPECTIVE.</p>
              <h1 className="hero-title" id="hero-title"><span>COSMIC</span><span className="outline-title">ODYSSEY</span></h1>
              <div className="hero-intro">
                <p className="hero-description">Leave the familiar behind.<br />Discover a universe without limits.</p>
                <button className="primary-button hero-actions" onClick={() => navigate('galaxy')}>Explore the universe <ArrowRight size={18} /></button>
              </div>
            </div>
            <div className="planet-coordinate hero-planet-label">
              <span className="coordinate-dot" /><span className="coordinate-line" />
              <div><small>YOUR POINT OF ORIGIN</small><strong>EARTH <span>·</span> SOL SYSTEM</strong><em>12,742 KM OF POSSIBILITY</em></div>
            </div>
            <div className="hero-bottom page-gutter">
              <button className="scroll-cue" onClick={() => navigate('galaxy')}><span className="scroll-icon"><ArrowDown size={14} /></span><span>SCROLL TO DISCOVER</span></button>
              <div className="hero-facts"><div><strong>04</strong><span>WORLDS TO EXPLORE</span></div><div><strong>∞</strong><span>WAYS TO BE AMAZED</span></div></div>
              <span className="hero-status"><i /> YOUR JOURNEY STARTS HERE</span>
            </div>
          </div>
        </section>

        <section className="chapter galaxy-chapter" id="galaxy" aria-labelledby="galaxy-title">
          <div className="chapter-sticky galaxy-sticky">
            <div className="galaxy-visual"><img src="/images/spiral.webp" alt="The Whirlpool Galaxy and its sweeping spiral arms" /></div>
            <div className="galaxy-content page-gutter">
              <p className="eyebrow reveal"><span>01</span> INTO THE INFINITE</p>
              <h2 className="section-title reveal" id="galaxy-title">A galaxy of<br /><span className="serif-accent">endless</span> wonder.</h2>
              <p className="section-copy reveal">Every star, a story. Every world, a possibility.<br />Venture beyond what you know and into<br />the extraordinary.</p>
              <div className="galaxy-caption reveal"><span>MESSIER 51</span><i /><span>31 MILLION LIGHT-YEARS AWAY</span></div>
            </div>
            <div className="chapter-footer page-gutter">
              <div className="cosmic-fact"><strong>100<span>+</span> billion</strong><span>STARS. ONE MILKY WAY.</span></div>
              <p>THE FURTHER YOU GO,<br />THE MORE YOU UNDERSTAND.</p>
              <span className="chapter-number">01 <i>/</i> 04</span>
            </div>
          </div>
        </section>

        <section className="chapter worlds-chapter" id="worlds" aria-labelledby="worlds-title">
          <div className="chapter-sticky worlds-sticky">
            <div className="worlds-heading page-gutter">
              <p className="eyebrow reveal"><span>02</span> OUR CELESTIAL NEIGHBORHOOD</p>
              <h2 className="section-title reveal" id="worlds-title">Familiar worlds.<br /><span className="serif-accent">New</span> perspectives.</h2>
              <p className="worlds-instruction"><Plus size={13} /> SELECT A WORLD TO EXPLORE</p>
            </div>
            <div className="planet-hotspots">
              {[planets[1], planets[2], planets[3], planets[0]].map((planet) => (
                <button
                  key={planet.id}
                  ref={(element) => { planetRefs.current[planet.id] = element; }}
                  className={`planet-hotspot ${planet.id}-hotspot`}
                  aria-label={`Explore ${planet.name}`}
                  aria-hidden="true"
                  inert
                  tabIndex={-1}
                  onClick={() => setSelectedPlanet(planet)}
                >
                  <i /><span>{planet.name.toUpperCase()}</span><small>{String(planets.indexOf(planet) + 1).padStart(2, '0')}</small>
                </button>
              ))}
            </div>
            <div className="worlds-bottom page-gutter">
              <div className="world-selector" role="group" aria-label="Explore a planet">
                {planets.map((planet, index) => <button key={planet.id} onClick={() => setSelectedPlanet(planet)}><small>0{index + 1}</small>{planet.name}<ArrowUpRight size={14} /></button>)}
              </div>
              <p>ILLUSTRATIVE VIEW · NOT TO SCALE</p>
            </div>
          </div>
        </section>

        <section className="chapter weightless-chapter" id="weightless" aria-labelledby="weightless-title">
          <div className="chapter-sticky weightless-sticky">
            <div className="earth-horizon" />
            <div className="astronaut-wrap"><img className="astronaut" src="/images/astronaut.png" alt="NASA astronaut Bruce McCandless floating untethered in space" /></div>
            <div className="weightless-content page-gutter">
              <p className="eyebrow reveal"><span>03</span> A DIFFERENT KIND OF FREEDOM</p>
              <h2 className="section-title reveal" id="weightless-title">Let go.<br /><span className="serif-accent">Look</span> beyond.</h2>
              <p className="section-copy reveal">No up. No down. No limits.<br />Just you and a perspective few<br />will ever know.</p>
              <div className="weightless-quote reveal"><span>“</span><p>The Earth is a small town<br />with many neighborhoods<br />in a very big universe.</p><small>— RON GARAN, ASTRONAUT</small></div>
            </div>
            <div className="weightless-meta page-gutter"><span><i /> ZERO GRAVITY</span><span>A HUMAN PERSPECTIVE. AN INFINITE VIEW.</span><span className="chapter-number">03 <i>/</i> 04</span></div>
          </div>
        </section>

        <section className="chapter beyond-chapter" id="beyond" aria-labelledby="beyond-title">
          <div className="chapter-sticky beyond-sticky">
            <div className="beyond-orb"><span /></div>
            <div className="beyond-content page-gutter">
              <p className="eyebrow reveal">THE END IS ONLY THE BEGINNING</p>
              <h2 className="beyond-title reveal" id="beyond-title">Your universe<br /><span className="serif-accent">awaits.</span></h2>
              <p className="reveal">The next frontier isn't out there.<br />It's the way you choose to see it.</p>
              <button className="primary-button reveal" onClick={() => setTourOpen(true)}>Begin your odyssey <ArrowUpRight size={18} /></button>
            </div>
            <footer className="footer page-gutter">
              <button className="brand" onClick={() => navigate('home')}><BrandMark size={25} /><span>COSMIC ODYSSEY</span></button>
              <p>STAY CURIOUS. KEEP EXPLORING.</p>
              <div><button onClick={() => setCreditsOpen(true)}>Image credits</button><button className="back-top" onClick={() => navigate('home')}>Back to Earth <ArrowUp size={14} /></button></div>
            </footer>
          </div>
        </section>
      </main>

      <button className={`tour-control ${playing ? 'is-playing' : ''}`} onClick={() => setPlaying((value) => !value)} aria-label={playing ? 'Pause cinematic journey' : 'Play cinematic journey'} title={playing ? 'Pause journey' : 'Autoplay journey'}>
        {playing ? <Pause size={14} /> : <Play size={14} />}<span>{playing ? 'PAUSE JOURNEY' : 'AUTOPLAY'}</span>
      </button>

      <dialog ref={dialogRef} className="detail-dialog" onCancel={(event) => { event.preventDefault(); closeDialog(); }} onClick={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
        <div className="dialog-inner">
          <button className="dialog-close" onClick={closeDialog} aria-label="Close dialog"><X size={20} /></button>
          {selectedPlanet && (
            <div className="planet-detail">
              <div className="planet-preview"><img src={selectedPlanet.texture} alt={`Surface map of ${selectedPlanet.name}`} style={{ borderColor: selectedPlanet.color }} /><span>PLANETARY ARCHIVE / {selectedPlanet.id.toUpperCase()}</span></div>
              <div className="planet-info"><p className="eyebrow">DESTINATION PROFILE</p><h2>{selectedPlanet.name}</h2><h3>{selectedPlanet.type}</h3><p>{selectedPlanet.description}</p>
                <dl><div><dt>DISTANCE FROM SUN</dt><dd>{selectedPlanet.distance}</dd></div><div><dt>DIAMETER</dt><dd>{selectedPlanet.diameter}</dd></div><div><dt>ORBITAL PERIOD</dt><dd>{selectedPlanet.year}</dd></div><div><dt>MEAN TEMPERATURE</dt><dd>{selectedPlanet.temperature}</dd></div></dl>
                <button className="text-button" onClick={() => { const next = planets[(planets.indexOf(selectedPlanet) + 1) % planets.length]; setSelectedPlanet(next); }}>Next destination <ChevronRight size={17} /></button>
              </div>
            </div>
          )}
          {aboutOpen && <div className="text-detail"><p className="eyebrow">OUR MISSION</p><h2>A new way<br />to see home.</h2><p>Cosmic Odyssey is an invitation to trade the everyday for a little perspective. No checklist. No destination required. Just a journey through the beauty, scale, and possibility of our universe.</p><p>Real planetary imagery, real astronomical photography, and real-time 3D bring five cinematic chapters to life. Every interaction happens in your browser. No account. No tracking. Just curiosity.</p><button className="primary-button" onClick={() => { closeDialog(); navigate('galaxy'); }}>Find your perspective <ArrowRight size={18} /></button></div>}
          {creditsOpen && <div className="text-detail credits"><p className="eyebrow">BEHIND THE JOURNEY</p><h2>Image credits.</h2><p>Planet and ring textures: <a href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noreferrer">Solar System Scope</a>, licensed under CC BY 4.0.</p><p>Astronaut: NASA photograph S84-27562, Bruce McCandless II's historic untethered spacewalk, 7 February 1984.</p><p>Whirlpool Galaxy: NASA/ESA Hubble, HEIC0506A. Andromeda: NASA/ESA Hubble, HEIC1502A. Additional astronomical imagery: NASA/ESA Hubble.</p><p>Typography: Space Grotesk and DM Sans via Google Fonts. All 3D rendering and motion run locally.</p></div>}
          {tourOpen && <div className="text-detail tour-detail"><p className="eyebrow">YOUR FLIGHT PLAN</p><h2>Ready for<br />a new perspective?</h2><p>Take the guided journey through all five chapters, or choose your own direction. You can pause or leave the experience at any time.</p><button className="primary-button" onClick={() => { closeDialog(); setPlaying(true); }}><Play size={16} /> Start cinematic journey</button><button className="text-button" onClick={() => { closeDialog(); navigate('worlds'); }}>Choose a destination <ArrowUpRight size={17} /></button><span><Check size={13} /> NO SIGN-UP. JUST EXPLORATION.</span></div>}
        </div>
      </dialog>
    </div>
  );
}
