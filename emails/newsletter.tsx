import {
  Body, Container, Head, Heading,
  Html, Link, Preview, Row, Column, Section, Text,
} from "@react-email/components";
import * as React from "react";
import { t, heroGrad, gradient, font } from "./_base";
import { EmailFooter } from "./welcome";

interface NLEvent {
  id: string; title: string; emoji: string;
  date: string; location: string; category: string; handle: string;
  going: string;
}
interface NLDeal {
  id: string; brand: string; title: string; discount: string;
  detail: string; code?: string; handle: string;
}
interface NLCircle {
  id: string; name: string; abbrev: string;
  category: string; members: number; handle: string;
}

interface NewsletterProps {
  volLabel?: string;
  dateLabel?: string;
  editorNote?: string;
  events?: NLEvent[];
  deal?: NLDeal;
  newCircles?: NLCircle[];
  totalNewEvents?: number;
  totalNewDeals?: number;
}

export default function WeeklyNewsletter({
  volLabel       = "Vol. 042",
  dateLabel      = "Mon May 19",
  editorNote     = "Midterms are behind us. This week we've got an indie film night, two ML talks, and a coffee deal that'll save you about ¥1,200.",
  events = [
    { id: "1", title: "Indie Film Night · \"Drive My Car\"", emoji: "🎬", date: "Wed May 21 · 19:00", location: "Waseda Aula",      category: "Film",   handle: "indie-film-night", going: "64 going" },
    { id: "2", title: "ML in Practice — Dr. Saito (PFN)",  emoji: "🤖", date: "Thu May 22 · 18:30", location: "Bldg 14, Hall A", category: "Tech",   handle: "ml-in-practice",   going: "212 going" },
    { id: "3", title: "First-years Coffee Meetup",         emoji: "☕", date: "Fri May 23 · 16:00", location: "Café Lavande",    category: "Social", handle: "coffee-meetup",     going: "38 going" },
  ],
  deal = {
    id: "1", brand: "Blue Bottle Coffee", title: "50% off every Wednesday",
    discount: "50%", detail: "Every Wednesday for verified students — Tokyo & Kyoto.",
    code: "KONEKTO-50", handle: "blue-bottle-50",
  },
  newCircles = [
    { id: "1", name: "Bridge Builders",   abbrev: "BB", category: "Hackathon", members: 428, handle: "bridge-builders" },
    { id: "2", name: "Slow Cinema",       abbrev: "SC", category: "Film",      members: 92,  handle: "slow-cinema" },
    { id: "3", name: "Morning Run Club",  abbrev: "MR", category: "Sport",     members: 156, handle: "morning-run-club" },
    { id: "4", name: "Tea & Translation", abbrev: "TT", category: "Language",  members: 74,  handle: "tea-translation" },
  ],
  totalNewEvents = 14,
  totalNewDeals  = 6,
}: NewsletterProps) {
  return (
    <Html>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <Preview>{`This week on Konekto — ${totalNewEvents} events, ${totalNewDeals} deals near you 🗓️`}</Preview>

      <Body style={{ fontFamily: font, margin: 0, padding: "32px 0", backgroundColor: t.bg }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto" }}>

          {/* ── Hero ── */}
          <Section style={{ background: heroGrad, borderRadius: "12px", padding: "36px 32px 40px", marginBottom: "16px" }}>
            <Text style={logoText}>Konekto</Text>
            <Text style={jpGreeting}>✦ こんにちは · good morning</Text>
            <Heading style={heroHeading}>
              Your week,{"\n"}three minutes to read.
            </Heading>
            <Text style={heroSub}>{editorNote}</Text>
            <Text style={issueBadge}>{volLabel} · {dateLabel}</Text>
          </Section>

          {/* ── Events ── */}
          <Section style={{ padding: "4px 0 0" }}>
            <Row>
              <Column><Text style={sectionTitle}>Upcoming events</Text></Column>
              <Column style={{ textAlign: "right" }}>
                <Link href="https://konekto.app/events" style={seeAll}>See all →</Link>
              </Column>
            </Row>
          </Section>

          <Section style={{ padding: "0" }}>
            {events.map((ev) => (
              <Section key={ev.id} style={eventCard}>
                <Row>
                  <Column style={{ width: "52px", verticalAlign: "middle" }}>
                    <Text style={emojiBox}>{ev.emoji}</Text>
                  </Column>
                  <Column style={{ verticalAlign: "top", paddingLeft: "4px" }}>
                    <Text style={catChip}>{ev.category}</Text>
                    <Text style={eventTitle}>{ev.title}</Text>
                    <Text style={eventMeta}>{ev.date} · {ev.location} · {ev.going}</Text>
                  </Column>
                  <Column style={{ width: "56px", textAlign: "right", verticalAlign: "middle" }}>
                    <Link href={`https://konekto.app/events/${ev.handle}`} style={rsvpLink}>RSVP →</Link>
                  </Column>
                </Row>
              </Section>
            ))}
          </Section>

          {/* ── Deal ── */}
          {deal && <>
            <Section style={{ padding: "20px 0 0" }}>
              <Text style={sectionTitle}>Deal of the week</Text>
            </Section>
            <Section style={dealCard}>
              <Row>
                <Column style={{ width: "90px", verticalAlign: "middle" }}>
                  <Text style={dealDiscount}>{deal.discount}</Text>
                </Column>
                <Column style={{ verticalAlign: "top", paddingLeft: "16px" }}>
                  <Text style={dealBrand}>{deal.brand}</Text>
                  <Text style={dealDetail}>{deal.detail}</Text>
                  {deal.code && <Text style={dealCode}>Code: {deal.code}</Text>}
                </Column>
              </Row>
            </Section>
          </>}

          {/* ── Circles ── */}
          {newCircles.length > 0 && <>
            <Section style={{ padding: "20px 0 0" }}>
              <Row>
                <Column><Text style={sectionTitle}>New circles</Text></Column>
                <Column style={{ textAlign: "right" }}>
                  <Link href="https://konekto.app/circles" style={seeAll}>Explore →</Link>
                </Column>
              </Row>
            </Section>
            <Section style={{ padding: "0" }}>
              {[0, 2].map((offset) => (
                <Row key={offset} style={{ marginBottom: "10px" }}>
                  {newCircles.slice(offset, offset + 2).map((c, i) => (
                    <Column key={c.id} style={{ width: "50%", paddingRight: i === 0 ? "6px" : "0", verticalAlign: "top" }}>
                      <Section style={circleCard}>
                        <Text style={circleAbbrev}>{c.abbrev}</Text>
                        <Text style={circleName}>{c.name}</Text>
                        <Text style={circleMeta}>{c.category} · {String(c.members)} members</Text>
                      </Section>
                    </Column>
                  ))}
                </Row>
              ))}
            </Section>
          </>}

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const logoText: React.CSSProperties = {
  color: "#FFFFFF", fontSize: "22px", fontWeight: 700,
  letterSpacing: "-0.02em", margin: "0 0 44px",
};

const jpGreeting: React.CSSProperties = {
  color: t.cyan, fontSize: "13px", fontWeight: 500,
  letterSpacing: "0.04em", margin: "0 0 12px",
  fontFamily: "'Noto Sans JP', 'Inter', sans-serif",
};

const heroHeading: React.CSSProperties = {
  color: t.ink, fontSize: "44px", fontWeight: 800,
  lineHeight: 1.05, letterSpacing: "-0.03em", margin: "0 0 14px",
};

const heroSub: React.CSSProperties = {
  color: t.inkSoft, fontSize: "15px", lineHeight: 1.6, margin: "0 0 20px",
};

const issueBadge: React.CSSProperties = {
  color: t.inkFaint, fontSize: "12px", fontWeight: 500,
  letterSpacing: "0.08em", margin: 0,
};

const sectionTitle: React.CSSProperties = {
  color: t.ink, fontSize: "16px", fontWeight: 700,
  letterSpacing: "-0.01em", margin: "0 0 12px",
};

const seeAll: React.CSSProperties = {
  color: t.blueDeep, fontSize: "13px", fontWeight: 600, textDecoration: "none",
};

const eventCard: React.CSSProperties = {
  background: t.card, border: `1px solid rgba(255,255,255,0.08)`,
  borderRadius: "14px", padding: "16px 16px", marginBottom: "10px",
};

const emojiBox: React.CSSProperties = {
  width: "48px", height: "48px", borderRadius: "12px",
  background: t.bg, fontSize: "22px", margin: 0,
  textAlign: "center", lineHeight: "48px", display: "inline-block",
};

const catChip: React.CSSProperties = {
  display: "inline-block", background: t.blueSoft, color: t.blueDeep,
  fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em",
  textTransform: "uppercase", padding: "3px 9px", borderRadius: "999px",
  margin: "0 0 5px",
};

const eventTitle: React.CSSProperties = {
  color: t.ink, fontSize: "14px", fontWeight: 700,
  letterSpacing: "-0.01em", margin: "0 0 3px",
};

const eventMeta: React.CSSProperties = {
  color: t.inkMute, fontSize: "12px", margin: 0,
};

const rsvpLink: React.CSSProperties = {
  color: t.blueDeep, fontSize: "12px", fontWeight: 700, textDecoration: "none",
};

const dealCard: React.CSSProperties = {
  background: t.card, border: `1px solid rgba(255,255,255,0.08)`,
  borderRadius: "14px", padding: "22px 22px",
};

const dealDiscount: React.CSSProperties = {
  color: t.blue, fontSize: "52px", fontWeight: 800,
  lineHeight: 0.9, letterSpacing: "-0.04em", margin: 0,
};

const dealBrand: React.CSSProperties = {
  color: t.ink, fontSize: "16px", fontWeight: 700,
  letterSpacing: "-0.01em", margin: "0 0 4px",
};

const dealDetail: React.CSSProperties = {
  color: t.inkMute, fontSize: "13px", lineHeight: 1.5, margin: "0 0 8px",
};

const dealCode: React.CSSProperties = {
  color: t.blueDeep, fontSize: "13px", fontWeight: 700, margin: 0,
};

const circleCard: React.CSSProperties = {
  background: t.card, border: `1px solid rgba(255,255,255,0.08)`,
  borderRadius: "14px", padding: "16px 16px",
};

const circleAbbrev: React.CSSProperties = {
  width: "32px", height: "32px", borderRadius: "8px",
  background: gradient, color: "#fff",
  fontSize: "12px", fontWeight: 800,
  margin: "0 0 10px", textAlign: "center", lineHeight: "32px",
  display: "inline-block",
};

const circleName: React.CSSProperties = {
  color: t.ink, fontSize: "14px", fontWeight: 700,
  letterSpacing: "-0.01em", margin: "0 0 2px",
};

const circleMeta: React.CSSProperties = {
  color: t.inkMute, fontSize: "11px", margin: 0,
};
