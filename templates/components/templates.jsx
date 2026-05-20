/* Konekto Instagram post templates — 1080×1080 artboards.
   Display in the canvas at 540 (50%) via CSS transform on inner content. */

const K = {
  bg: '#06090F',
  bgDeep: '#03050A',
  panel: '#0C1424',
  panelLine: 'rgba(120,160,255,0.10)',
  text: '#F5F8FF',
  textDim: 'rgba(245,248,255,0.62)',
  textFaint: 'rgba(245,248,255,0.40)',
  blue: '#3B9EFF',
  blueDeep: '#1366E0',
  cyan: '#6FD2FF',
  violet: '#8B5CF6',
  indigo: '#5B7CFA',
  gradient: 'linear-gradient(135deg, #6FD2FF 0%, #5B7CFA 45%, #8B5CF6 100%)',
  gradientSoft: 'radial-gradient(120% 80% at 20% 0%, rgba(59,158,255,0.28) 0%, rgba(139,92,246,0.18) 45%, rgba(0,0,0,0) 75%)',
  font: '"Inter", "Helvetica Neue", Helvetica, system-ui, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
  jp: '"Noto Sans JP", "Hiragino Sans", "Inter", sans-serif',
};

const LOGO = 'assets/konekto-logo.png';

/* ─── Base canvas: a true 1080×1080 surface that we visually scale to 540 ─── */
function Post({ children, bg = K.bg, displaySize = 540 }) {
  return (
    <div style={{
      width: displaySize, height: displaySize, overflow: 'hidden',
      background: K.bgDeep, position: 'relative',
    }}>
      <div style={{
        width: 1080, height: 1080,
        transform: `scale(${displaySize / 1080})`,
        transformOrigin: 'top left',
        background: bg, position: 'relative',
        fontFamily: K.font, color: K.text,
        WebkitFontSmoothing: 'antialiased',
      }}>
        {children}
      </div>
    </div>
  );
}

/* Small reusable bits */
function Brandmark({ size = 44, withWord = true, color = K.text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.36 }}>
      <img src={LOGO} alt="" style={{ width: size, height: size, display: 'block' }}/>
      {withWord && (
        <div style={{
          fontFamily: K.font, fontWeight: 700, fontSize: size * 0.78,
          color, letterSpacing: '-0.02em',
        }}>Konekto</div>
      )}
    </div>
  );
}

function Pill({ children, accent = false }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 12,
      padding: '14px 24px',
      borderRadius: 999,
      border: `1px solid ${accent ? 'rgba(59,158,255,0.35)' : 'rgba(255,255,255,0.12)'}`,
      background: accent ? 'rgba(59,158,255,0.10)' : 'rgba(255,255,255,0.03)',
      color: accent ? K.blue : K.textDim,
      fontSize: 22, fontWeight: 500, letterSpacing: '0.02em',
    }}>{children}</div>
  );
}

function GridBg({ opacity = 0.06 }) {
  return (
    <svg width="1080" height="1080" viewBox="0 0 1080 1080"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <pattern id="kgrid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M60 0H0V60" fill="none" stroke="white" strokeWidth="1" opacity={opacity}/>
        </pattern>
      </defs>
      <rect width="1080" height="1080" fill="url(#kgrid)"/>
    </svg>
  );
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 01 — EVENT ANNOUNCEMENT                                           ║
   ╚══════════════════════════════════════════════════════════════════╝ */
function EventPost() {
  return (
    <Post>
      {/* gradient halo top-right */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(70% 50% at 85% -10%, rgba(139,92,246,0.45) 0%, rgba(59,158,255,0.18) 35%, rgba(0,0,0,0) 70%)',
      }}/>
      <GridBg opacity={0.05}/>

      {/* Header */}
      <div style={{ position: 'absolute', top: 64, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Brandmark size={48}/>
        <div style={{ fontFamily: K.mono, fontSize: 20, color: K.textFaint, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          Event · Tokyo
        </div>
      </div>

      {/* Eyebrow */}
      <div style={{ position: 'absolute', top: 260, left: 72, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: K.blue, boxShadow: `0 0 24px ${K.blue}` }}/>
        <div style={{ fontFamily: K.jp, fontSize: 26, color: K.blue, fontWeight: 500, letterSpacing: '0.04em' }}>
          イベントのお知らせ · upcoming
        </div>
      </div>

      {/* Title */}
      <div style={{ position: 'absolute', top: 320, left: 72, right: 72 }}>
        <div style={{
          fontSize: 132, fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.035em',
          textWrap: 'balance',
        }}>
          Tokyo Career<br/>Forum 2026
        </div>
      </div>

      {/* Meta row */}
      <div style={{ position: 'absolute', bottom: 260, left: 72, right: 72, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ fontSize: 28, color: K.textDim, fontFamily: K.mono, width: 36 }}>📅</div>
          <div style={{ fontSize: 32, fontWeight: 500 }}>Sat, Nov 7 · 10:00 — 17:00 JST</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ fontSize: 28, color: K.textDim, fontFamily: K.mono, width: 36 }}>📍</div>
          <div style={{ fontSize: 32, fontWeight: 500 }}>Tokyo Big Sight · Hall B</div>
        </div>
      </div>

      {/* CTA strip */}
      <div style={{
        position: 'absolute', bottom: 72, left: 72, right: 72,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 18,
          padding: '24px 38px', borderRadius: 999,
          background: K.blue, color: '#001327',
          fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em',
        }}>
          RSVP on Konekto
          <span style={{ fontSize: 28 }}>→</span>
        </div>
        <div style={{ fontFamily: K.mono, fontSize: 20, color: K.textFaint, letterSpacing: '0.1em' }}>
          konekto.app/e/tcf-2026
        </div>
      </div>
    </Post>
  );
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 02 — WELCOME / BIG TYPE                                           ║
   ╚══════════════════════════════════════════════════════════════════╝ */
function WelcomePost() {
  return (
    <Post>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(80% 60% at 110% 110%, rgba(139,92,246,0.55) 0%, rgba(91,124,250,0.25) 35%, rgba(0,0,0,0) 70%)',
      }}/>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(60% 40% at -10% -10%, rgba(111,210,255,0.30) 0%, rgba(0,0,0,0) 60%)',
      }}/>

      {/* big logo watermark */}
      <img src={LOGO} alt="" style={{
        position: 'absolute', top: -160, right: -160,
        width: 760, height: 760, opacity: 0.10,
      }}/>

      {/* Header */}
      <div style={{ position: 'absolute', top: 72, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Brandmark size={52}/>
        <div style={{ fontFamily: K.mono, fontSize: 20, color: K.textFaint, letterSpacing: '0.18em' }}>
          ／ HELLO
        </div>
      </div>

      {/* Eyebrow */}
      <div style={{ position: 'absolute', top: 380, left: 72, fontFamily: K.jp, fontSize: 32, fontWeight: 500, color: K.cyan, letterSpacing: '0.04em' }}>
        ✦ おかえり
      </div>

      {/* Headline */}
      <div style={{ position: 'absolute', top: 440, left: 72, right: 72 }}>
        <div style={{
          fontSize: 168, fontWeight: 800, lineHeight: 0.92, letterSpacing: '-0.045em',
        }}>
          Your<br/>campus,<br/>
          <span style={{
            background: K.gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text',
            color: 'transparent',
          }}>connected.</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: 72, left: 72, right: 72,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      }}>
        <div style={{ fontSize: 28, color: K.textDim, fontWeight: 500, maxWidth: 620 }}>
          Circles, events, deals and opportunities — all in one place.
        </div>
        <div style={{ fontFamily: K.mono, fontSize: 22, color: K.textDim, letterSpacing: '0.1em' }}>
          @konekto
        </div>
      </div>
    </Post>
  );
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 03 — CIRCLE SPOTLIGHT                                             ║
   ╚══════════════════════════════════════════════════════════════════╝ */
function CirclePost() {
  return (
    <Post bg={K.bg}>
      <GridBg opacity={0.04}/>

      {/* Header */}
      <div style={{ position: 'absolute', top: 64, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Brandmark size={44}/>
        <Pill accent>● Circle of the week</Pill>
      </div>

      {/* Hero card */}
      <div style={{
        position: 'absolute', top: 188, left: 72, right: 72, height: 580,
        borderRadius: 36, padding: 56,
        background: 'linear-gradient(160deg, #0E1830 0%, #0A0F1F 60%, #0F0825 100%)',
        border: `1px solid ${K.panelLine}`,
        overflow: 'hidden',
      }}>
        {/* gradient blob */}
        <div style={{
          position: 'absolute', top: -180, right: -160, width: 560, height: 560, borderRadius: '50%',
          background: K.gradient, filter: 'blur(80px)', opacity: 0.50,
        }}/>

        {/* category tag */}
        <div style={{ position: 'relative', display: 'inline-flex', padding: '10px 20px', borderRadius: 999,
          background: 'rgba(59,158,255,0.14)', color: K.blue, fontSize: 22, fontWeight: 600, letterSpacing: '0.02em' }}>
          Technology · Hackathon
        </div>

        {/* circle name */}
        <div style={{ position: 'relative', marginTop: 40, fontSize: 110, fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.035em' }}>
          The Bridge<br/>Builders
        </div>

        {/* members row */}
        <div style={{ position: 'absolute', bottom: 56, left: 56, right: 56, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex' }}>
              {['#6FD2FF','#5B7CFA','#8B5CF6','#3B9EFF','#a78bfa'].map((c,i) => (
                <div key={i} style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${c}, ${K.violet})`,
                  border: '4px solid #0C1424',
                  marginLeft: i === 0 ? 0 : -18,
                }}/>
              ))}
            </div>
            <div style={{ fontSize: 26, color: K.textDim, fontWeight: 500 }}>
              +428 members
            </div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12,
            padding: '18px 30px', borderRadius: 999, background: K.text, color: '#06090F',
            fontSize: 24, fontWeight: 700 }}>
            Join circle <span>→</span>
          </div>
        </div>
      </div>

      {/* description */}
      <div style={{ position: 'absolute', bottom: 152, left: 72, right: 72, fontSize: 28, color: K.textDim, lineHeight: 1.35, maxWidth: 820 }}>
        Cross-campus hackers from Tokyo, Seoul & Singapore — shipping weekend projects together.
      </div>

      {/* footer */}
      <div style={{ position: 'absolute', bottom: 72, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: K.mono, fontSize: 20, color: K.textFaint, letterSpacing: '0.14em' }}>
          DISCOVER 240+ CIRCLES
        </div>
        <div style={{ fontFamily: K.mono, fontSize: 20, color: K.textFaint, letterSpacing: '0.1em' }}>
          konekto.app
        </div>
      </div>
    </Post>
  );
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 04 — QUOTE / TIP                                                  ║
   ╚══════════════════════════════════════════════════════════════════╝ */
function QuotePost() {
  return (
    <Post bg="#F5F8FF">
      {/* subtle gradient corner */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(60% 50% at 100% 0%, rgba(139,92,246,0.16) 0%, rgba(255,255,255,0) 60%)',
      }}/>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(60% 50% at 0% 100%, rgba(59,158,255,0.18) 0%, rgba(255,255,255,0) 60%)',
      }}/>

      {/* Header */}
      <div style={{ position: 'absolute', top: 72, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Brandmark size={44} color="#0A0F1F"/>
        <div style={{ fontFamily: K.mono, fontSize: 20, color: 'rgba(10,15,31,0.5)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          № 014 · tip of the week
        </div>
      </div>

      {/* Big quote mark */}
      <div style={{
        position: 'absolute', top: 180, left: 60, fontSize: 280, lineHeight: 1, fontFamily: 'Georgia, serif',
        color: K.blue, opacity: 0.18, fontWeight: 700,
      }}>“</div>

      {/* Quote */}
      <div style={{ position: 'absolute', top: 300, left: 96, right: 96 }}>
        <div style={{
          fontSize: 88, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.03em',
          color: '#0A0F1F', textWrap: 'balance',
        }}>
          The fastest<br/>way to find your<br/>people is to{' '}
          <span style={{
            background: K.gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text',
            color: 'transparent',
          }}>show up.</span>
        </div>
      </div>

      {/* attribution */}
      <div style={{ position: 'absolute', bottom: 170, left: 96, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: K.gradient }}/>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0A0F1F' }}>Mika Tanaka</div>
          <div style={{ fontSize: 22, color: 'rgba(10,15,31,0.55)', marginTop: 4 }}>Keio Univ. · Class of '27</div>
        </div>
      </div>

      {/* footer */}
      <div style={{ position: 'absolute', bottom: 72, left: 96, right: 96, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: K.mono, fontSize: 20, color: 'rgba(10,15,31,0.5)', letterSpacing: '0.1em' }}>
          ↳ swipe for 3 more tips
        </div>
        <div style={{ fontFamily: K.mono, fontSize: 20, color: 'rgba(10,15,31,0.5)', letterSpacing: '0.1em' }}>
          @konekto
        </div>
      </div>
    </Post>
  );
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 05 — DEAL / OFFER                                                 ║
   ╚══════════════════════════════════════════════════════════════════╝ */
function DealPost() {
  return (
    <Post bg={K.bg}>
      <GridBg opacity={0.04}/>

      {/* Header */}
      <div style={{ position: 'absolute', top: 64, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Brandmark size={44}/>
        <Pill>🏷️ Student deal</Pill>
      </div>

      {/* big % */}
      <div style={{
        position: 'absolute', top: 170, left: 72, right: 72,
        display: 'flex', alignItems: 'flex-start', gap: 24,
      }}>
        <div style={{
          fontSize: 460, fontWeight: 800, lineHeight: 0.85, letterSpacing: '-0.06em',
          background: K.gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text',
          color: 'transparent',
        }}>50</div>
        <div style={{ paddingTop: 36, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 120, fontWeight: 800, lineHeight: 0.9, color: K.text, letterSpacing: '-0.04em' }}>%</div>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 0.9, color: K.text, letterSpacing: '-0.02em', marginTop: 12 }}>OFF</div>
        </div>
      </div>

      {/* Brand line */}
      <div style={{ position: 'absolute', top: 660, left: 72, right: 72 }}>
        <div style={{ fontFamily: K.mono, fontSize: 22, color: K.textFaint, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          partner · food & drink
        </div>
        <div style={{ marginTop: 14, fontSize: 76, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
          Blue Bottle Coffee
        </div>
        <div style={{ marginTop: 18, fontSize: 28, color: K.textDim, fontWeight: 500 }}>
          Every Wednesday for verified students · Tokyo & Kyoto locations.
        </div>
      </div>

      {/* code / CTA */}
      <div style={{
        position: 'absolute', bottom: 72, left: 72, right: 72,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '28px 36px', borderRadius: 24,
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${K.panelLine}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ fontFamily: K.mono, fontSize: 20, color: K.textFaint, letterSpacing: '0.18em' }}>CODE</div>
          <div style={{ fontFamily: K.mono, fontSize: 38, fontWeight: 700, letterSpacing: '0.05em', color: K.cyan }}>
            KONEKTO-50
          </div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14,
          padding: '18px 30px', borderRadius: 999, background: K.blue, color: '#001327',
          fontSize: 24, fontWeight: 700 }}>
          Claim in app →
        </div>
      </div>
    </Post>
  );
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 06 — CAROUSEL COVER                                               ║
   ╚══════════════════════════════════════════════════════════════════╝ */
function CarouselPost() {
  return (
    <Post bg="#0A0F1F">
      {/* full bleed gradient panel */}
      <div style={{
        position: 'absolute', inset: 0,
        background: K.gradient,
        opacity: 0.95,
      }}/>
      {/* subtle noise grid */}
      <svg width="1080" height="1080" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="dotpat" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" fill="rgba(255,255,255,0.12)"/>
          </pattern>
        </defs>
        <rect width="1080" height="1080" fill="url(#dotpat)"/>
      </svg>

      {/* Header */}
      <div style={{ position: 'absolute', top: 72, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Brandmark size={48}/>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          padding: '12px 22px', borderRadius: 999,
          background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(8px)',
          fontFamily: K.mono, fontSize: 20, color: '#fff', letterSpacing: '0.14em',
        }}>
          1 / 7 →
        </div>
      </div>

      {/* Step indicator strip */}
      <div style={{ position: 'absolute', top: 200, left: 72, right: 72, display: 'flex', gap: 10 }}>
        {Array.from({length: 7}).map((_,i) => (
          <div key={i} style={{
            flex: 1, height: 6, borderRadius: 999,
            background: i === 0 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.25)',
          }}/>
        ))}
      </div>

      {/* Eyebrow */}
      <div style={{ position: 'absolute', top: 280, left: 72, fontFamily: K.mono, fontSize: 26, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        a guide ·  swipe →
      </div>

      {/* Big number */}
      <div style={{ position: 'absolute', top: 330, left: 60, fontSize: 380, fontWeight: 800, lineHeight: 0.85, color: 'rgba(255,255,255,0.12)', letterSpacing: '-0.06em', fontFamily: K.font }}>
        7
      </div>

      {/* Headline */}
      <div style={{ position: 'absolute', bottom: 220, left: 72, right: 72 }}>
        <div style={{ fontSize: 132, fontWeight: 800, lineHeight: 0.92, letterSpacing: '-0.04em', color: '#fff' }}>
          7 ways to<br/>
          find your<br/>
          people at uni
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: 72, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
          A field guide for first-years
        </div>
        <div style={{ fontFamily: K.mono, fontSize: 20, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em' }}>
          @konekto
        </div>
      </div>
    </Post>
  );
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 07 — MINIMAL ANNOUNCEMENT                                          ║
   ╚══════════════════════════════════════════════════════════════════╝ */
function MinimalPost() {
  return (
    <Post bg="#F5F8FF">
      {/* corner accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: K.gradient,
      }}/>

      {/* Header */}
      <div style={{ position: 'absolute', top: 72, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Brandmark size={44} color="#0A0F1F"/>
        <div style={{ fontFamily: K.mono, fontSize: 20, color: 'rgba(10,15,31,0.5)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          May 19, 2026
        </div>
      </div>

      {/* divider */}
      <div style={{ position: 'absolute', top: 196, left: 72, right: 72, height: 1, background: 'rgba(10,15,31,0.1)' }}/>

      {/* eyebrow */}
      <div style={{ position: 'absolute', top: 240, left: 72, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 10, height: 10, borderRadius: 999, background: K.blue }}/>
        <div style={{ fontSize: 24, color: K.blueDeep, fontWeight: 600, letterSpacing: '0.04em' }}>NEW · Announcement</div>
      </div>

      {/* headline */}
      <div style={{ position: 'absolute', top: 320, left: 72, right: 200 }}>
        <div style={{
          fontSize: 124, fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.04em',
          color: '#0A0F1F',
        }}>
          Konekto is<br/>
          <span style={{ color: K.blueDeep }}>live in Seoul</span>{' '}
          <span style={{ background: K.gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>🎉</span>
        </div>
      </div>

      {/* body copy */}
      <div style={{ position: 'absolute', bottom: 280, left: 72, right: 96, fontSize: 30, lineHeight: 1.35, color: 'rgba(10,15,31,0.7)', maxWidth: 760, fontWeight: 500 }}>
        Six new universities, forty-two circles and a fresh batch of student deals — Korea, we're so glad you're here.
      </div>

      {/* CTA strip */}
      <div style={{ position: 'absolute', bottom: 72, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14,
          padding: '20px 32px', borderRadius: 999, background: '#0A0F1F', color: '#F5F8FF',
          fontSize: 26, fontWeight: 700 }}>
          Download Konekto →
        </div>
        <div style={{ fontFamily: K.mono, fontSize: 20, color: 'rgba(10,15,31,0.5)', letterSpacing: '0.1em' }}>
          konekto.app
        </div>
      </div>
    </Post>
  );
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 08 — STORY / TESTIMONIAL                                           ║
   ╚══════════════════════════════════════════════════════════════════╝ */
function TestimonialPost() {
  return (
    <Post bg={K.bg}>
      {/* big translucent logo as a vibe element */}
      <img src={LOGO} alt="" style={{
        position: 'absolute', bottom: -200, left: -160,
        width: 720, height: 720, opacity: 0.08,
      }}/>

      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(70% 50% at 100% 50%, rgba(59,158,255,0.18) 0%, rgba(0,0,0,0) 60%)',
      }}/>

      {/* Header */}
      <div style={{ position: 'absolute', top: 64, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Brandmark size={44}/>
        <Pill>★ Member story</Pill>
      </div>

      {/* avatar */}
      <div style={{
        position: 'absolute', top: 200, left: 72,
        width: 140, height: 140, borderRadius: '50%',
        background: 'linear-gradient(135deg, #6FD2FF, #8B5CF6)',
        border: '4px solid rgba(255,255,255,0.12)',
      }}/>

      {/* name block */}
      <div style={{ position: 'absolute', top: 230, left: 240 }}>
        <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em' }}>Ren Kobayashi</div>
        <div style={{ marginTop: 8, fontSize: 26, color: K.textDim, fontWeight: 500 }}>
          The University of Tokyo · ML lab
        </div>
      </div>

      {/* quote */}
      <div style={{ position: 'absolute', top: 440, left: 72, right: 72 }}>
        <div style={{
          fontSize: 68, fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.025em',
          color: K.text, textWrap: 'balance',
        }}>
          “I met my{' '}
          <span style={{ background: K.gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', fontWeight: 700 }}>
            co-founder
          </span>{' '}
          at a Konekto coffee meetup. Three months later we shipped our first product.”
        </div>
      </div>

      {/* footer */}
      <div style={{ position: 'absolute', bottom: 72, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: K.mono, fontSize: 20, color: K.textFaint, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          stories · vol. 03
        </div>
        <div style={{ fontFamily: K.mono, fontSize: 20, color: K.textFaint, letterSpacing: '0.1em' }}>
          @konekto
        </div>
      </div>
    </Post>
  );
}

Object.assign(window, { EventPost, WelcomePost, CirclePost, QuotePost, DealPost, CarouselPost, MinimalPost, TestimonialPost });
