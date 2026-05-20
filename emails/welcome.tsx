import {
  Body, Button, Container, Head, Heading, Img,
  Html, Link, Preview, Row, Column, Section, Text,
} from "@react-email/components";
import * as React from "react";
import { t, gradient, heroGrad, font } from "./_base";
import { logoFullBlue } from "./logo";

interface WelcomeEmailProps {
  displayName?: string;
  username?: string;
}

export default function WelcomeEmail({
  displayName = "Yuki",
  username = "yuki",
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <Preview>Welcome to Konekto — your campus, connected ✦</Preview>

      <Body style={{ fontFamily: font, margin: 0, padding: "32px 0", backgroundColor: t.bg }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto" }}>

          {/* Gradient hero block */}
          <Section style={{ background: heroGrad, borderRadius: "12px", padding: "36px 32px 40px", marginBottom: "16px" }}>
              <Text style={logoText}>Konekto</Text>
              <Text style={thankYouText}>✦ ありがとう · Thanks for joining, {displayName}!</Text>
              <Heading style={heroHeading}>
                Your campus,{"\n"}connected.
              </Heading>
              <Text style={heroSub}>
                Discover circles, events, deals and opportunities — all in one place.
              </Text>
              <Section style={{ marginTop: "28px" }}>
                <Button style={primaryBtn} href="https://konekto.app/circles">
                  Explore circles →
                </Button>
                {"  "}
                <Button style={secondaryBtn} href="https://konekto.app/events">
                  Browse events
                </Button>
              </Section>
            </Section>

          {/* ── Feature list ── */}
          <Section style={{ padding: "20px 0 0" }}>
            <Text style={{ color: t.ink, fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 14px" }}>
              What's on Konekto
            </Text>
          </Section>
          <Section style={{ padding: "0" }}>
            {steps.map((s) => (
              <Section key={s.t} style={stepCard}>
                <Row>
                  <Column style={{ width: "44px", verticalAlign: "top" }}>
                    <Text style={{ fontSize: "22px", margin: 0, lineHeight: 1, paddingTop: "3px" }}>{s.emoji}</Text>
                  </Column>
                  <Column style={{ verticalAlign: "top" }}>
                    <Text style={stepTitle}>{s.t}</Text>
                    <Text style={stepDesc}>{s.d}</Text>
                    <Link href={s.href} style={stepLink}>{s.a} →</Link>
                  </Column>
                </Row>
              </Section>
            ))}
          </Section>

          {/* ── Footer ── */}
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

// ── Shared footer ─────────────────────────────────────────────────────────────
export function EmailFooter() {
  return (
    <Section style={{ padding: "28px 0", textAlign: "center" }}>
      <Img src={logoFullBlue} alt="Konekto" height={40} width={40} style={{ margin: "0 auto" }} />
    </Section>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const steps = [
  { emoji: "👥", t: "Circles", d: "Find student clubs that match your vibe — tech, sports, arts, and more.", a: "Explore circles", href: "https://konekto.app/circles" },
  { emoji: "📅", t: "Events",  d: "From hanami picnics to hackathons — never miss what's on near you.",        a: "Browse events",  href: "https://konekto.app/events" },
  { emoji: "🏷️", t: "Deals",   d: "Exclusive discounts on food, tech, fashion, and more — just for students.", a: "See deals",      href: "https://konekto.app/discounts" },
];

// ── Styles ────────────────────────────────────────────────────────────────────
const thankYouText: React.CSSProperties = {
  color: t.cyan, fontSize: "13px", fontWeight: 500,
  letterSpacing: "0.04em", margin: "0 0 12px",
  fontFamily: "'Noto Sans JP', 'Inter', sans-serif",
};

const logoText: React.CSSProperties = {
  color: "#FFFFFF", fontSize: "22px", fontWeight: 700,
  letterSpacing: "-0.02em", margin: "0 0 44px",
};


const heroHeading: React.CSSProperties = {
  color: t.ink, fontSize: "48px", fontWeight: 800,
  lineHeight: 1.0, letterSpacing: "-0.035em",
  margin: "0 0 20px",
};

const heroSub: React.CSSProperties = {
  color: t.inkSoft, fontSize: "15px", lineHeight: 1.55, margin: 0,
};

const primaryBtn: React.CSSProperties = {
  background: t.blue, color: t.blueInk,
  borderRadius: "999px", fontSize: "14px", fontWeight: 700,
  padding: "14px 24px", textDecoration: "none", display: "inline-block",
};

const secondaryBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)", color: t.ink,
  borderRadius: "999px", fontSize: "14px", fontWeight: 600,
  padding: "14px 24px", textDecoration: "none", display: "inline-block",
  border: "1px solid rgba(255,255,255,0.12)",
};

const stepCard: React.CSSProperties = {
  background: t.card, border: `1px solid rgba(255,255,255,0.08)`,
  borderRadius: "14px", padding: "20px 20px", marginBottom: "12px",
};

const stepTitle: React.CSSProperties = {
  color: t.ink, fontSize: "15px", fontWeight: 700,
  letterSpacing: "-0.01em", margin: "0 0 4px",
};

const stepDesc: React.CSSProperties = {
  color: t.inkMute, fontSize: "13px", lineHeight: 1.55, margin: "0 0 8px",
};

const stepLink: React.CSSProperties = {
  color: t.blueDeep, fontSize: "13px", fontWeight: 600, textDecoration: "none",
};
