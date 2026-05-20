/* Konekto email templates — designed at 640px width with email-safe primitives
   wrapped in a mock client chrome (subject line + sender). */

const EK = {
  // base
  bg: '#0B1024',                      // page surround / darkest
  card: '#141A35',                    // primary email body (mid dark)
  cardAlt: '#1A2142',                 // nested panel (slightly lighter)
  ink900: '#0F1530',                  // hero shells (slightly darker than card)

  // text
  ink: '#F5F8FF',                     // primary
  inkSoft: '#D8DEEE',
  inkMute: '#A0A8C2',
  inkFaint: '#6B7295',

  // separators
  line: 'rgba(255,255,255,0.07)',
  lineSoft: 'rgba(255,255,255,0.04)',

  // brand
  blue: '#3B9EFF',
  blueDeep: '#5BA8FF',                // brighter for legibility on dark
  blueInk: '#001327',                 // for text on bright blue button
  blueSoft: 'rgba(59,158,255,0.16)',
  cyan: '#6FD2FF',
  violet: '#A78BFA',                  // brighter on dark
  violetSoft: 'rgba(167,139,250,0.16)',

  // overlays
  textOnDark: '#F5F8FF',
  textOnDarkDim: 'rgba(245,248,255,0.66)',
  panelGrad: 'linear-gradient(135deg, rgba(111,210,255,0.06) 0%, rgba(139,92,246,0.05) 55%, rgba(91,124,250,0.04) 100%)',
  panelGradAlt: 'linear-gradient(160deg, rgba(139,92,246,0.07) 0%, rgba(59,158,255,0.04) 50%, rgba(0,0,0,0) 100%)',
  gradient: 'linear-gradient(135deg, #6FD2FF 0%, #5B7CFA 45%, #8B5CF6 100%)',

  font: '"Inter", "Helvetica Neue", Helvetica, system-ui, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
  jp: '"Noto Sans JP", "Hiragino Sans", "Inter", sans-serif'
};
const LOGO_E = 'assets/konekto-logo.png';

/* ─── Chrome that frames each email ─── */
function EmailFrame({ subject, preheader, from = 'Konekto <hi@konekto.app>', to = 'you@university.edu', children, height = 1500, displayWidth = 480 }) {
  const designWidth = 640;
  const scale = displayWidth / designWidth;
  const designHeight = Math.round(height / scale);
  return (
    <div style={{
      width: displayWidth, height: height, background: EK.bg,
      fontFamily: EK.font, overflow: 'hidden', position: 'relative'
    }}>
      <div style={{
        width: designWidth,
        transform: `scale(${scale})`,
        transformOrigin: 'top left'
      }}>
        {/* Mail client chrome */}
        <div style={{ padding: '20px 28px 18px', background: EK.ink900, borderBottom: `1px solid ${EK.line}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: EK.panelGradAlt, pointerEvents: 'none' }}/>
          <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5F57' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FEBC2E' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#28C840' }} />
            <div style={{ flex: 1 }} />
            <div style={{ fontFamily: EK.mono, fontSize: 11, color: EK.inkFaint, letterSpacing: '0.06em' }}>
              inbox · just now
            </div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: EK.ink, letterSpacing: '-0.01em' }}>
            {subject}
          </div>
          {preheader &&
          <div style={{ marginTop: 4, fontSize: 13, color: EK.inkMute }}>{preheader}</div>
          }
          <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: EK.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: '#fff', fontWeight: 700
            }}>K</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div style={{ fontSize: 12, color: EK.ink, fontWeight: 600 }}>{from}</div>
              <div style={{ fontSize: 11, color: EK.inkFaint }}>to {to}</div>
            </div>
          </div>
          </div>
        </div>

        {/* Email body */}
        <div>{children}</div>
      </div>
    </div>);

}

/* ─── Reusable bits ─── */
function EmailLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <img src={LOGO_E} alt="" style={{ width: 28, height: 28 }} />
      <div style={{
        fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em',
        color: EK.ink
      }}>Konekto</div>
    </div>);
}

function EmailFooter() {
  return (
    <div style={{ padding: '36px 40px', background: EK.ink900, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: EK.panelGradAlt, pointerEvents: 'none' }}/>
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <EmailLogo />
          <div style={{ display: 'flex', gap: 18, fontSize: 13, color: EK.inkMute, fontWeight: 500 }}>
            <div>Twitter</div>
            <div>Instagram</div>
            <div>App Store</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: EK.inkMute, lineHeight: 1.55, maxWidth: 460 }}>
          You're receiving this because you joined Konekto. Manage preferences or{' '}
          <span style={{ color: EK.cyan, textDecoration: 'underline' }}>unsubscribe</span>.<br />
          Konekto, Inc. · 5-2-1 Roppongi, Minato-ku, Tokyo 106-0032, Japan
        </div>
      </div>
    </div>);
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 01 — WELCOME EMAIL                                                ║
   ╚══════════════════════════════════════════════════════════════════╝ */
function WelcomeEmail() {
  return (
    <EmailFrame
      subject="Welcome to Konekto, Yuki ✦"
      preheader="Three things to do in your first 24 hours — and a campus that's ready when you are."
      height={1500}>
      
      {/* Hero */}
      <div style={{ background: EK.ink900, color: EK.textOnDark, padding: '48px 40px 56px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 60% at 110% -20%, rgba(139,92,246,0.55), rgba(0,0,0,0) 60%), radial-gradient(60% 50% at 0% 110%, rgba(59,158,255,0.35), rgba(0,0,0,0) 65%)' }} />
        <div style={{ position: 'relative' }}>
          <EmailLogo />
          <div style={{ marginTop: 56, fontFamily: EK.jp, fontSize: 14, color: EK.cyan, fontWeight: 500, letterSpacing: '0.04em' }}>
            ✦ はじめまして · welcome
          </div>
          <div style={{ marginTop: 14, fontSize: 56, fontWeight: 800, lineHeight: 0.98, letterSpacing: '-0.035em', maxWidth: 480 }}>
            Hi Yuki —<br />your campus,{' '}
            <span style={{ background: EK.gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>connected.</span>
          </div>
          <div style={{ marginTop: 22, fontSize: 16, color: EK.textOnDarkDim, lineHeight: 1.55, maxWidth: 460 }}>You're in. Discover circles, events, deals and opportunities - all in one place. Here's how to make the most of your first week.

          </div>
          <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
            <div style={{ padding: '14px 22px', borderRadius: 999, background: EK.blue, color: EK.blueInk, fontSize: 14, fontWeight: 700 }}>Browse on web  →</div>
            <div style={{ padding: '14px 22px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', color: EK.textOnDark, fontSize: 14, fontWeight: 600, border: '1px solid rgba(255,255,255,0.12)' }}>Browse on web</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ background: EK.card, backgroundImage: EK.panelGrad, padding: '48px 40px 16px', position: 'relative' }}>
        <div style={{ fontFamily: EK.mono, fontSize: 12, color: EK.inkFaint, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          3 things · 5 minutes
        </div>
        <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: EK.ink, letterSpacing: '-0.02em' }}>
          Get set up in three small steps
        </div>

        {[
        { n: '01', t: 'Pick your campus', d: 'Tell us which university you call home so events and deals are relevant to you.', a: 'Set campus' },
        { n: '02', t: 'Follow a few circles', d: 'Start with 3 — hobbies, career, anything. Your feed gets smarter from there.', a: 'Find circles' },
        { n: '03', t: 'RSVP to one event', d: 'Showing up is the whole thing. The next two weeks have 27 events near you.', a: 'See what\'s on' }].
        map((s, i) =>
        <div key={i} style={{
          marginTop: 22, padding: '22px 22px', borderRadius: 16,
          background: EK.bg, border: `1px solid ${EK.line}`,
          display: 'flex', gap: 18, alignItems: 'flex-start'
        }}>
            <div style={{
            fontFamily: EK.mono, fontSize: 13, fontWeight: 700,
            color: EK.blueDeep, background: EK.blueSoft,
            padding: '6px 10px', borderRadius: 8, letterSpacing: '0.04em'
          }}>{s.n}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: EK.ink, letterSpacing: '-0.01em' }}>{s.t}</div>
              <div style={{ marginTop: 6, fontSize: 14, color: EK.inkMute, lineHeight: 1.5 }}>{s.d}</div>
              <div style={{ marginTop: 12, fontSize: 13, color: EK.blueDeep, fontWeight: 600 }}>{s.a} →</div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 40, padding: 24, borderRadius: 16, background: EK.violetSoft, border: '1px solid rgba(167,139,250,0.30)' }}>
          <div style={{ fontFamily: EK.mono, fontSize: 11, color: EK.violet, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
            ★ Friend tip
          </div>
          <div style={{ marginTop: 8, fontSize: 16, color: EK.ink, lineHeight: 1.5, fontWeight: 500 }}>
            "I found my closest friends in my second week. Just RSVP'd to a coffee meetup and walked in."
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: EK.inkMute }}>— Mika, Keio Univ.</div>
        </div>
      </div>

      <EmailFooter />
    </EmailFrame>);

}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 02 — EVENT INVITATION                                              ║
   ╚══════════════════════════════════════════════════════════════════╝ */
function EventEmail() {
  return (
    <EmailFrame
      subject="Save the date — Tokyo Career Forum, Nov 7"
      preheader="50+ companies, 1 day, your future commute. RSVP closes Friday."
      height={1620}>
      
      <div style={{ background: EK.card, backgroundImage: EK.panelGrad, position: 'relative' }}>
        {/* Brand strip */}
        <div style={{ height: 6, background: EK.gradient }} />
        <div style={{ padding: '32px 40px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <EmailLogo />
          <div style={{ fontFamily: EK.mono, fontSize: 11, color: EK.inkFaint, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            Event invitation
          </div>
        </div>

        {/* Hero card */}
        <div style={{ margin: '24px 40px 0', position: 'relative', borderRadius: 24, overflow: 'hidden', background: EK.ink900 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(80% 70% at 110% -10%, rgba(139,92,246,0.55) 0%, rgba(59,158,255,0.20) 40%, rgba(0,0,0,0) 70%)' }} />
          <div style={{ position: 'relative', padding: '40px 36px 36px', color: EK.textOnDark }}>
            <div style={{ fontFamily: EK.mono, fontSize: 11, color: EK.cyan, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
              Career · Tokyo
            </div>
            <div style={{ marginTop: 12, fontSize: 44, fontWeight: 800, lineHeight: 0.98, letterSpacing: '-0.035em' }}>
              Tokyo Career<br />Forum 2026
            </div>
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12, color: EK.textOnDarkDim, fontSize: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 18 }}>📅</span> Saturday, Nov 7 · 10:00 — 17:00 JST
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 18 }}>📍</span> Tokyo Big Sight, Hall B · Ariake
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 18 }}>👥</span> 1,240 going · 50+ companies
              </div>
            </div>
            <div style={{ marginTop: 28, display: 'flex', gap: 10 }}>
              <div style={{ padding: '14px 22px', borderRadius: 999, background: EK.blue, color: EK.blueInk, fontSize: 14, fontWeight: 700 }}>RSVP — it's free</div>
              <div style={{ padding: '14px 22px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', color: EK.textOnDark, fontSize: 14, fontWeight: 600, border: '1px solid rgba(255,255,255,0.12)' }}>Add to calendar</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '40px 40px 12px' }}>
          <div style={{ fontFamily: EK.mono, fontSize: 12, color: EK.inkFaint, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            What to expect
          </div>
          <div style={{ marginTop: 14, fontSize: 15, color: EK.inkSoft, lineHeight: 1.6 }}>
            One floor, 50 companies. From Sony to Mercari to early-stage robotics teams hiring summer interns — every booth is open to undergrads. Bring 10 résumés and an open afternoon; we'll handle the rest.
          </div>

          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
            { k: '50+', v: 'Companies hiring' },
            { k: '12', v: 'On-stage sessions' },
            { k: '4', v: 'Languages supported' },
            { k: 'Free', v: 'For verified students' }].
            map((s, i) =>
            <div key={i} style={{ padding: 18, borderRadius: 14, background: EK.bg, border: `1px solid ${EK.lineSoft}` }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: EK.ink, letterSpacing: '-0.02em' }}>{s.k}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: EK.inkMute }}>{s.v}</div>
              </div>
            )}
          </div>

          {/* Featured companies row */}
          <div style={{ marginTop: 28, fontFamily: EK.mono, fontSize: 12, color: EK.inkFaint, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            Featured this year
          </div>
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Mercari', 'Sony', 'Rakuten', 'SmartHR', 'LayerX', 'Preferred Networks', 'SoftBank', 'LINE', 'Money Forward'].map((c) =>
            <div key={c} style={{ padding: '8px 14px', borderRadius: 999, background: EK.cardAlt, border: `1px solid ${EK.line}`, fontSize: 13, color: EK.inkSoft, fontWeight: 500 }}>
                {c}
              </div>
            )}
          </div>
        </div>
      </div>

      <EmailFooter />
    </EmailFrame>);

}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 03 — WEEKLY DIGEST                                                 ║
   ╚══════════════════════════════════════════════════════════════════╝ */
function DigestEmail() {
  return (
    <EmailFrame
      subject="This week on Konekto — 14 things near you"
      preheader="3 events, 5 new circles, 6 fresh deals — handpicked for Waseda this week."
      height={1700}>
      
      <div style={{ background: EK.card, backgroundImage: EK.panelGrad, position: 'relative' }}>
        <div style={{ padding: '32px 40px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${EK.line}` }}>
          <EmailLogo />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: EK.ink }}>Konekto Weekly</div>
            <div style={{ fontFamily: EK.mono, fontSize: 11, color: EK.inkFaint, letterSpacing: '0.12em' }}>Vol. 042 · Mon May 19</div>
          </div>
        </div>

        {/* Editor's note */}
        <div style={{ padding: '36px 40px 12px' }}>
          <div style={{ fontFamily: EK.jp, fontSize: 13, color: EK.blueDeep, fontWeight: 500, letterSpacing: '0.04em' }}>
            ✦ おはよう · good morning
          </div>
          <div style={{ marginTop: 8, fontSize: 30, fontWeight: 800, color: EK.ink, lineHeight: 1.1, letterSpacing: '-0.025em' }}>
            Your week,<br />three minutes to read.
          </div>
          <div style={{ marginTop: 14, fontSize: 14, color: EK.inkMute, lineHeight: 1.55, maxWidth: 460 }}>
            Midterms are behind us. This week we've got an indie film night, two ML talks, and a coffee deal that'll save you about ¥1,200.
          </div>
        </div>

        {/* Section: events */}
        <div style={{ padding: '24px 40px 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div style={{ fontSize: 14, color: EK.inkFaint, fontFamily: EK.mono, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              ✦ Upcoming events
            </div>
            <div style={{ fontSize: 12, color: EK.blueDeep, fontWeight: 600 }}>See all →</div>
          </div>

          {[
          { emoji: '🎬', tag: 'Film', t: 'Indie Film Night · "Drive My Car"', d: 'Wed May 21 · 19:00 · Waseda Aula', g: '64 going' },
          { emoji: '🤖', tag: 'Tech', t: 'ML in Practice — Dr. Saito (PFN)', d: 'Thu May 22 · 18:30 · Bldg 14, Hall A', g: '212 going' },
          { emoji: '☕', tag: 'Social', t: 'First-years Coffee Meetup', d: 'Fri May 23 · 16:00 · Café Lavande', g: '38 going' }].
          map((e, i) =>
          <div key={i} style={{
            padding: 18, marginBottom: 10, borderRadius: 14,
            border: `1px solid ${EK.line}`, background: EK.cardAlt,
            display: 'flex', gap: 14, alignItems: 'center'
          }}>
              <div style={{
              width: 52, height: 52, borderRadius: 12, background: EK.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              flexShrink: 0
            }}>{e.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 999, background: EK.blueSoft, color: EK.blueDeep, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{e.tag}</div>
                <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700, color: EK.ink, letterSpacing: '-0.01em' }}>{e.t}</div>
                <div style={{ marginTop: 3, fontSize: 12, color: EK.inkMute }}>{e.d} · {e.g}</div>
              </div>
              <div style={{ fontSize: 12, color: EK.blueDeep, fontWeight: 700 }}>RSVP →</div>
            </div>
          )}
        </div>

        {/* Section: deal banner */}
        <div style={{ padding: '24px 40px 8px' }}>
          <div style={{ fontSize: 14, color: EK.inkFaint, fontFamily: EK.mono, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 14 }}>
            ✦ Deal of the week
          </div>
          <div style={{
            padding: '24px 24px',
            borderRadius: 18, background: EK.ink900,
            color: EK.textOnDark, position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 100% at 100% 50%, rgba(139,92,246,0.5), rgba(0,0,0,0) 60%)' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{
                fontSize: 72, fontWeight: 800, lineHeight: 0.9, letterSpacing: '-0.04em',
                background: EK.gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'
              }}>50%</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>Blue Bottle Coffee</div>
                <div style={{ marginTop: 4, fontSize: 13, color: EK.textOnDarkDim, lineHeight: 1.4 }}>
                  Every Wednesday for verified students — Tokyo & Kyoto.
                </div>
                <div style={{ marginTop: 12, display: 'inline-flex', padding: '8px 14px', borderRadius: 999, background: EK.blue, color: EK.blueInk, fontSize: 12, fontWeight: 700 }}>
                  Code · KONEKTO-50 →
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: circles strip */}
        <div style={{ padding: '24px 40px 36px' }}>
          <div style={{ fontSize: 14, color: EK.inkFaint, fontFamily: EK.mono, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 14 }}>
            ✦ New circles
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
            { name: 'Bridge Builders', cat: 'Hackathon', n: '428' },
            { name: 'Slow Cinema', cat: 'Film', n: '92' },
            { name: 'Morning Run Club', cat: 'Sport', n: '156' },
            { name: 'Tea & Translation', cat: 'Language', n: '74' }].
            map((c, i) =>
            <div key={i} style={{
              padding: 16, borderRadius: 14,
              background: EK.bg, border: `1px solid ${EK.line}`
            }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: EK.gradient, marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: EK.ink, letterSpacing: '-0.01em' }}>{c.name}</div>
                <div style={{ marginTop: 2, fontSize: 11, color: EK.inkMute }}>{c.cat} · {c.n} members</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <EmailFooter />
    </EmailFrame>);

}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 04 — DEAL / OFFER EMAIL                                            ║
   ╚══════════════════════════════════════════════════════════════════╝ */
function DealEmail() {
  return (
    <EmailFrame
      subject="50% off Blue Bottle — every Wednesday"
      preheader="A student perk that pays for your week's coffee. Quick redemption inside."
      height={1500}>
      
      <div>
        {/* Vibrant hero */}
        <div style={{ background: EK.gradient, padding: '48px 40px 56px', position: 'relative', overflow: 'hidden' }}>
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
            <defs>
              <pattern id="dotsem" width="22" height="22" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.4" fill="rgba(255,255,255,0.5)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dotsem)" />
          </svg>
          <div style={{ position: 'relative', color: '#fff' }}>
            <EmailLogo />
            <div style={{ marginTop: 56, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <div style={{ fontSize: 168, fontWeight: 800, lineHeight: 0.85, letterSpacing: '-0.05em' }}>50</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 0.9, letterSpacing: '-0.03em' }}>%</div>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6, letterSpacing: '-0.01em' }}>OFF</div>
              </div>
            </div>
            <div style={{ marginTop: 18, fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
              Blue Bottle Coffee<br />every Wednesday.
            </div>
            <div style={{ marginTop: 14, fontSize: 14, opacity: 0.92, lineHeight: 1.5, maxWidth: 380 }}>
              Verified students only. Tokyo & Kyoto locations. Through August 31.
            </div>
          </div>
        </div>

        {/* Code block */}
        <div style={{ background: EK.card, backgroundImage: EK.panelGrad, padding: '36px 40px', position: 'relative' }}>
          <div style={{
            border: `2px dashed ${EK.line}`, borderRadius: 16, padding: '22px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontFamily: EK.mono, fontSize: 11, color: EK.inkFaint, letterSpacing: '0.18em' }}>YOUR CODE</div>
              <div style={{ marginTop: 6, fontFamily: EK.mono, fontSize: 24, fontWeight: 700, color: EK.ink, letterSpacing: '0.04em' }}>KONEKTO-50</div>
            </div>
            <div style={{ padding: '12px 18px', borderRadius: 999, background: EK.blue, color: EK.blueInk, fontSize: 13, fontWeight: 700 }}>Copy code</div>
          </div>

          <div style={{ marginTop: 32, fontFamily: EK.mono, fontSize: 12, color: EK.inkFaint, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            How to redeem
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
            ['Open Konekto, tap Deals.', 'You\'ll see Blue Bottle pinned at the top this week.'],
            ['Tap "Show code at register".', 'A live QR appears — staff scan and apply the discount.'],
            ['Enjoy. Repeat next Wednesday.', 'Limit one redemption per week, per student.']].
            map(([t, d], i) =>
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                width: 26, height: 26, borderRadius: 999, background: EK.blueSoft,
                color: EK.blueDeep, fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: EK.ink }}>{t}</div>
                  <div style={{ marginTop: 2, fontSize: 13, color: EK.inkMute, lineHeight: 1.45 }}>{d}</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 32, padding: '14px 18px', borderRadius: 12, background: EK.bg, fontSize: 12, color: EK.inkMute, lineHeight: 1.55 }}>
            Konekto partners with local shops to bring real perks to verified students. No data shared with merchants beyond redemption count.
          </div>

          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 28px', borderRadius: 999, background: EK.blue, color: EK.blueInk, fontSize: 15, fontWeight: 700 }}>
              Open Konekto →
            </div>
          </div>
        </div>
      </div>

      <EmailFooter />
    </EmailFrame>);

}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 05 — RSVP CONFIRMATION                                             ║
   ╚══════════════════════════════════════════════════════════════════╝ */
function ConfirmEmail() {
  return (
    <EmailFrame
      subject="You're going to Tokyo Career Forum 🎉"
      preheader="Saturday Nov 7, 10:00 — Tokyo Big Sight. Show this email at the entrance."
      height={1420}>
      
      <div>
        {/* Confirmed bar */}
        <div style={{ padding: '22px 40px', background: '#16291F', color: '#A7E0BD', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#34B36A', color: '#0F2A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>✓</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Your spot is confirmed. We saved your seat.</div>
        </div>

        {/* Header */}
        <div style={{ padding: '32px 40px 0', background: EK.card, backgroundImage: EK.panelGrad }}>
          <EmailLogo />
        </div>

        {/* Ticket */}
        <div style={{ background: EK.card, backgroundImage: EK.panelGrad, padding: '24px 40px 0' }}>
          <div style={{
            background: EK.ink900, color: EK.textOnDark, borderRadius: 22, overflow: 'hidden', position: 'relative'
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 60% at 110% 0%, rgba(139,92,246,0.45), rgba(0,0,0,0) 60%), radial-gradient(60% 50% at 0% 100%, rgba(59,158,255,0.35), rgba(0,0,0,0) 60%)' }} />
            <div style={{ position: 'relative', padding: '32px 32px 24px' }}>
              <div style={{ fontFamily: EK.mono, fontSize: 11, color: EK.cyan, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
                Event ticket · KNKT-7F2A
              </div>
              <div style={{ marginTop: 10, fontSize: 36, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' }}>
                Tokyo Career<br />Forum 2026
              </div>
              <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                ['DATE', 'Sat, Nov 7'],
                ['DOORS', '10:00 JST'],
                ['VENUE', 'Tokyo Big Sight'],
                ['HALL', 'Hall B · Ariake']].
                map(([l, v], i) =>
                <div key={i}>
                    <div style={{ fontFamily: EK.mono, fontSize: 10, color: EK.textOnDarkDim, letterSpacing: '0.18em' }}>{l}</div>
                    <div style={{ marginTop: 4, fontSize: 16, fontWeight: 700 }}>{v}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Perf line + QR */}
            <div style={{ position: 'relative', borderTop: '2px dashed rgba(255,255,255,0.15)', padding: '22px 32px 28px', display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{
                width: 92, height: 92, borderRadius: 14, background: '#fff', flexShrink: 0,
                display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)', padding: 8, gap: 1
              }}>
                {Array.from({ length: 64 }).map((_, i) =>
                <div key={i} style={{ background: (i * 7 + 3) % 3 === 0 ? '#000' : '#fff' }} />
                )}
              </div>
              <div>
                <div style={{ fontSize: 13, color: EK.textOnDarkDim, fontWeight: 500, marginBottom: 6 }}>Yuki Nakamura</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>1 attendee · Free</div>
                <div style={{ marginTop: 8, fontSize: 11, color: EK.textOnDarkDim, lineHeight: 1.4 }}>
                  Scan at entrance. No printout needed — show on your phone.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ background: EK.card, backgroundImage: EK.panelGrad, padding: '28px 40px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
            ['Add to Calendar', EK.bg, EK.ink, EK.line],
            ['Get Directions', EK.bg, EK.ink, EK.line],
            ['Invite a friend', EK.blueSoft, EK.blueDeep, 'rgba(59,158,255,0.30)'],
            ['Manage RSVP', EK.bg, EK.ink, EK.line]].
            map(([t, bg, fg, bd], i) =>
            <div key={i} style={{
              padding: '14px 16px', borderRadius: 12, background: bg, color: fg,
              border: `1px solid ${bd}`, fontSize: 13, fontWeight: 600, textAlign: 'center'
            }}>{t}</div>
            )}
          </div>

          <div style={{ marginTop: 28, padding: 20, borderRadius: 14, background: EK.bg, border: `1px solid ${EK.line}` }}>
            <div style={{ fontFamily: EK.mono, fontSize: 11, color: EK.inkFaint, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              Day-of tip
            </div>
            <div style={{ marginTop: 6, fontSize: 14, color: EK.ink, lineHeight: 1.5 }}>
              Bring 10 résumés and water. Doors open 10:00 — the line at Mercari and PFN gets long after 11.
            </div>
          </div>
        </div>
      </div>

      <EmailFooter />
    </EmailFrame>);

}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 06 — CIRCLE ACCEPTANCE                                             ║
   ╚══════════════════════════════════════════════════════════════════╝ */
function CircleAcceptEmail() {
  return (
    <EmailFrame
      subject="You're in — welcome to The Bridge Builders 🎉"
      preheader="Your application was accepted. Here's what happens next, and how to meet the crew."
      height={1640}
    >
      <div>
        {/* Confirmation strip */}
        <div style={{ padding: '20px 40px', background: '#16291F', color: '#A7E0BD', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#34B36A', color: '#0F2A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>✓</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Application accepted · You're officially a member.</div>
        </div>

        {/* Hero */}
        <div style={{ background: EK.ink900, color: EK.textOnDark, padding: '48px 40px 52px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 60% at 110% -20%, rgba(139,92,246,0.5), rgba(0,0,0,0) 60%), radial-gradient(60% 50% at 0% 110%, rgba(59,158,255,0.32), rgba(0,0,0,0) 65%)' }}/>

          {/* faint confetti dots */}
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
            <defs>
              <pattern id="confetti" width="60" height="60" patternUnits="userSpaceOnUse">
                <rect x="6" y="10" width="3" height="9" fill="#6FD2FF" transform="rotate(20 7.5 14.5)"/>
                <rect x="42" y="6" width="3" height="9" fill="#8B5CF6" transform="rotate(-30 43.5 10.5)"/>
                <rect x="22" y="38" width="3" height="9" fill="#F5F8FF" transform="rotate(50 23.5 42.5)"/>
                <circle cx="50" cy="44" r="1.8" fill="#6FD2FF"/>
                <circle cx="12" cy="48" r="1.4" fill="#8B5CF6"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#confetti)"/>
          </svg>

          <div style={{ position: 'relative' }}>
            <EmailLogo />

            <div style={{ marginTop: 48, fontFamily: EK.jp, fontSize: 13, color: EK.cyan, fontWeight: 500, letterSpacing: '0.04em' }}>
              ✦ おめでとう · congratulations
            </div>
            <div style={{ marginTop: 12, fontSize: 48, fontWeight: 800, lineHeight: 0.98, letterSpacing: '-0.035em', maxWidth: 460 }}>
              You're in.<br/>
              Welcome to{' '}
              <span style={{ background: EK.gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                The Bridge Builders.
              </span>
            </div>
            <div style={{ marginTop: 20, fontSize: 15, color: EK.textOnDarkDim, lineHeight: 1.55, maxWidth: 460 }}>
              Akari and the leads reviewed your application this morning — they loved the hackathon writeup. You now have access to the circle's Slack, events and member-only deals.
            </div>
          </div>
        </div>

        {/* Circle card */}
        <div style={{ background: EK.card, backgroundImage: EK.panelGrad, padding: '32px 40px 0' }}>
          <div style={{
            padding: 22, borderRadius: 18,
            background: EK.bg, border: `1px solid ${EK.line}`,
            display: 'flex', gap: 18, alignItems: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 14,
              background: EK.gradient, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em',
            }}>BB</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 999, background: EK.blueSoft, color: EK.blueDeep, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Technology · Hackathon
              </div>
              <div style={{ marginTop: 6, fontSize: 18, fontWeight: 700, color: EK.ink, letterSpacing: '-0.01em' }}>
                The Bridge Builders
              </div>
              <div style={{ marginTop: 3, fontSize: 13, color: EK.inkMute }}>
                428 members · Tokyo, Seoul & Singapore
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <div style={{ display: 'flex' }}>
                {['#6FD2FF','#5B7CFA','#8B5CF6','#3B9EFF'].map((c, i) => (
                  <div key={i} style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${c}, ${EK.violet})`,
                    border: `2px solid ${EK.card}`,
                    marginLeft: i === 0 ? 0 : -8,
                  }}/>
                ))}
              </div>
              <div style={{ fontSize: 11, color: EK.inkMute }}>+424 more</div>
            </div>
          </div>
        </div>

        {/* Body: next steps */}
        <div style={{ background: EK.card, backgroundImage: EK.panelGrad, padding: '32px 40px 16px' }}>
          <div style={{ fontFamily: EK.mono, fontSize: 12, color: EK.inkFaint, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            Your first week
          </div>
          <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700, color: EK.ink, letterSpacing: '-0.02em' }}>
            Three things to do, in order
          </div>

          {[
            { n: '01', t: 'Introduce yourself in #welcome', d: 'A photo, what you\'re working on, one thing you\'re curious about. Keep it short — the rest will come.', a: 'Open Slack' },
            { n: '02', t: 'Join the Friday standup', d: 'Every Friday 18:00 JST · 30 min · members share what they shipped that week. Optional but the best way in.', a: 'Add to calendar' },
            { n: '03', t: 'Browse the project board', d: 'Pick something to contribute to or post your own idea. You\'ll find collaborators fast.', a: 'See projects' },
          ].map((s, i) => (
            <div key={i} style={{
              marginTop: 16, padding: 18, borderRadius: 14,
              background: EK.bg, border: `1px solid ${EK.line}`,
              display: 'flex', gap: 16, alignItems: 'flex-start',
            }}>
              <div style={{
                fontFamily: EK.mono, fontSize: 12, fontWeight: 700,
                color: EK.blueDeep, background: EK.blueSoft,
                padding: '5px 9px', borderRadius: 8, letterSpacing: '0.04em',
              }}>{s.n}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: EK.ink, letterSpacing: '-0.01em' }}>{s.t}</div>
                <div style={{ marginTop: 4, fontSize: 13, color: EK.inkMute, lineHeight: 1.5 }}>{s.d}</div>
                <div style={{ marginTop: 10, fontSize: 12, color: EK.blueDeep, fontWeight: 600 }}>{s.a} →</div>
              </div>
            </div>
          ))}
        </div>

        {/* A word from the leads */}
        <div style={{ background: EK.card, backgroundImage: EK.panelGrad, padding: '12px 40px 32px' }}>
          <div style={{
            marginTop: 16,
            padding: 22, borderRadius: 16,
            background: EK.violetSoft, border: '1px solid rgba(167,139,250,0.30)',
          }}>
            <div style={{ fontFamily: EK.mono, fontSize: 11, color: EK.violet, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
              ★ A note from your leads
            </div>
            <div style={{ marginTop: 8, fontSize: 15, color: EK.ink, lineHeight: 1.55 }}>
              "Glad to have you, Yuki. We're a small group that ships every weekend — show up, ask questions, and bring whatever half-finished idea is on your mind."
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6FD2FF, #8B5CF6)' }}/>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: EK.ink }}>Akari Mori</div>
                <div style={{ fontSize: 11, color: EK.inkMute }}>Co-lead · The Bridge Builders</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 28px', borderRadius: 999, background: EK.blue, color: EK.blueInk, fontSize: 15, fontWeight: 700 }}>
              Open circle in Konekto →
            </div>
          </div>
        </div>
      </div>

      <EmailFooter/>
    </EmailFrame>
  );
}

Object.assign(window, { WelcomeEmail, EventEmail, DigestEmail, DealEmail, ConfirmEmail, CircleAcceptEmail });