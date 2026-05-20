import {
  Body, Button, Container, Head, Heading, Img,
  Html, Link, Preview, Row, Column, Section, Text,
} from "@react-email/components";
import * as React from "react";
import { t, heroGrad, gradient, font } from "./_base";
import { EmailFooter } from "./welcome";
import { logoFullBlue } from "./logo";

interface ApprovedEmailProps {
  displayName?: string;
  type?: "circle" | "event";
  itemName?: string;
  itemHandle?: string;
  itemDescription?: string;
  itemCategory?: string;
  itemMembers?: number;
  eventDate?: string;
  eventLocation?: string;
  eventDoors?: string;
  eventHall?: string;
  leadName?: string;
  leadRole?: string;
  leadNote?: string;
  recommendedCircles?: { id: string; name: string; abbrev: string; category: string; members: number; handle: string }[];
}

export default function ApprovedEmail({
  displayName     = "Yuki",
  type            = "circle",
  itemName        = "The Bridge Builders",
  itemHandle      = "the-bridge-builders",
  itemDescription = "Hackathons, side projects, and AI study sessions every week.",
  itemCategory    = "Technology · Hackathon",
  itemMembers     = 428,
  eventDate       = "Sat, Nov 7",
  eventLocation   = "Tokyo Big Sight",
  eventDoors      = "10:00 JST",
  eventHall       = "Hall B · Ariake",
  leadName        = "Akari Mori",
  leadRole        = "Co-lead",
  leadNote        = "Glad to have you. We're a small group that ships every weekend — show up, ask questions, and bring whatever half-finished idea is on your mind.",
  recommendedCircles = [
    { id: "1", name: "Slow Cinema",       abbrev: "SC", category: "Film",      members: 92,  handle: "slow-cinema" },
    { id: "2", name: "Morning Run Club",  abbrev: "MR", category: "Sport",     members: 156, handle: "morning-run-club" },
    { id: "3", name: "Tea & Translation", abbrev: "TT", category: "Language",  members: 74,  handle: "tea-translation" },
    { id: "4", name: "Tokyo AI Lab",      abbrev: "AI", category: "Technology",members: 310, handle: "tokyo-ai-lab" },
  ],
}: ApprovedEmailProps) {
  const isCircle = type === "circle";
  const baseUrl  = isCircle
    ? `https://konekto.app/circles/${itemHandle}`
    : `https://konekto.app/events/${itemHandle}`;


  const eventActions = [
    { label: "Add to Calendar", href: baseUrl },
    { label: "Get Directions",  href: baseUrl },
    { label: "Invite a friend", href: baseUrl },
    { label: "Manage RSVP",    href: baseUrl },
  ];

  return (
    <Html>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <Preview>{isCircle ? `You're in — welcome to ${itemName} 🎉` : `You're going to ${itemName} ✅`}</Preview>

      <Body style={{ fontFamily: font, margin: 0, padding: "32px 0", backgroundColor: t.bg }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto" }}>

          {/* ── Hero ── */}
          <Section style={{ background: heroGrad, borderRadius: "12px", padding: "36px 32px 40px", marginBottom: "16px" }}>
            <Text style={logoText}>Konekto</Text>
            <Text style={jpGreeting}>
              {isCircle ? "✦ おめでとう · congratulations" : "✦ かんげい · you're confirmed"}
            </Text>
            <Heading style={heroHeading}>
              {isCircle ? `You're in —\nwelcome to ${itemName}.` : `You're going\nto ${itemName}.`}
            </Heading>
            <Text style={heroSub}>
              {isCircle
                ? `The leads reviewed your application — you now have full access to the circle's events and member-only deals.`
                : `${eventDate} · ${eventLocation}. Show this email at the entrance.`}
            </Text>
            <Section style={{ marginTop: "28px" }}>
              <Button style={primaryBtn} href={baseUrl}>
                {isCircle ? "Open circle →" : "View event →"}
              </Button>
            </Section>
          </Section>

          {/* ── Item card ── */}
          <Section style={{ padding: "4px 0 0" }}>
            <Text style={sectionTitle}>{isCircle ? "Your new circle" : "Event details"}</Text>
          </Section>

          {isCircle ? (
            <Section style={itemCard}>
              <Row>
                <Column style={{ width: "52px", verticalAlign: "middle" }}>
                  <Text style={circleAvatar}>BB</Text>
                </Column>
                <Column style={{ verticalAlign: "middle", paddingLeft: "14px" }}>
                  <Text style={chipText}>{itemCategory}</Text>
                  <Text style={itemTitle}>{itemName}</Text>
                  <Text style={itemMeta}>{itemDescription}</Text>
                  <Text style={itemMeta}>{itemMembers} members</Text>
                </Column>
              </Row>
            </Section>
          ) : (
            <Section style={itemCard}>
              {[["Date", eventDate], ["Venue", eventLocation], ["Doors", eventDoors], ["Hall", eventHall]].map(([l, v]) => (
                <Row key={l} style={{ marginBottom: "10px" }}>
                  <Column style={{ width: "80px", verticalAlign: "top" }}>
                    <Text style={fieldLabel}>{l}</Text>
                  </Column>
                  <Column style={{ verticalAlign: "top" }}>
                    <Text style={fieldVal}>{v}</Text>
                  </Column>
                </Row>
              ))}
            </Section>
          )}

          {/* ── Recommended circles / Event actions ── */}
          <Section style={{ padding: "20px 0 0" }}>
            <Text style={sectionTitle}>{isCircle ? "You might also like" : "Useful links"}</Text>
          </Section>

          {isCircle ? (
            <Section style={{ padding: "0" }}>
              {[0, 2].map((offset) => (
                <Row key={offset} style={{ marginBottom: "10px" }}>
                  {recommendedCircles.slice(offset, offset + 2).map((c, i) => (
                    <Column key={c.id} style={{ width: "50%", paddingRight: i === 0 ? "6px" : "0", verticalAlign: "top" }}>
                      <Section style={circleCard}>
                        <Text style={circleAbbrev}>{c.abbrev}</Text>
                        <Text style={circleName}>{c.name}</Text>
                        <Text style={circleMeta}>{c.category} · {String(c.members)} members</Text>
                        <Link href={`https://konekto.app/circles/${c.handle}`} style={circleLink}>View →</Link>
                      </Section>
                    </Column>
                  ))}
                </Row>
              ))}
            </Section>
          ) : (
            <Row>
              {eventActions.map((a) => (
                <Column key={a.label} style={{ width: "50%", paddingRight: "6px", paddingBottom: "10px", verticalAlign: "top" }}>
                  <Section style={actionCard}>
                    <Link href={a.href} style={actionLink}>{a.label} →</Link>
                  </Section>
                </Column>
              ))}
            </Row>
          )}

          {/* ── Note ── */}
          {isCircle && (
            <Section style={noteCard}>
              <Text style={jpGreeting}>★ A note from your leads</Text>
              <Text style={noteText}>"{leadNote}"</Text>
              <Text style={noteAttr}>— {leadName}, {leadRole}</Text>
            </Section>
          )}

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
  lineHeight: 1.05, letterSpacing: "-0.035em", margin: "0 0 16px",
};

const heroSub: React.CSSProperties = {
  color: t.inkSoft, fontSize: "15px", lineHeight: 1.55, margin: 0,
};

const primaryBtn: React.CSSProperties = {
  background: t.blue, color: t.blueInk,
  borderRadius: "999px", fontSize: "14px", fontWeight: 700,
  padding: "14px 24px", textDecoration: "none", display: "inline-block",
};

const sectionTitle: React.CSSProperties = {
  color: t.ink, fontSize: "16px", fontWeight: 700,
  letterSpacing: "-0.01em", margin: "0 0 12px",
};

const itemCard: React.CSSProperties = {
  background: t.card, border: `1px solid rgba(255,255,255,0.08)`,
  borderRadius: "14px", padding: "20px 22px", marginBottom: "4px",
};

const circleAvatar: React.CSSProperties = {
  width: "52px", height: "52px", borderRadius: "12px",
  background: gradient, color: "#fff",
  fontSize: "16px", fontWeight: 800,
  margin: 0, textAlign: "center", lineHeight: "52px", display: "inline-block",
};

const chipText: React.CSSProperties = {
  display: "inline-block", background: t.blueSoft, color: t.blueDeep,
  fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em",
  textTransform: "uppercase", padding: "3px 9px", borderRadius: "999px",
  margin: "0 0 5px",
};

const itemTitle: React.CSSProperties = {
  color: t.ink, fontSize: "16px", fontWeight: 700,
  letterSpacing: "-0.01em", margin: "0 0 3px",
};

const itemMeta: React.CSSProperties = {
  color: t.inkMute, fontSize: "13px", margin: "0 0 2px",
};

const fieldLabel: React.CSSProperties = {
  color: t.inkFaint, fontSize: "12px", fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.06em", margin: 0,
};

const fieldVal: React.CSSProperties = {
  color: t.ink, fontSize: "14px", fontWeight: 600, margin: 0,
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
  color: t.inkMute, fontSize: "11px", margin: "0 0 8px",
};

const circleLink: React.CSSProperties = {
  color: t.blueDeep, fontSize: "12px", fontWeight: 600, textDecoration: "none",
};

const actionCard: React.CSSProperties = {
  background: t.card, border: `1px solid rgba(255,255,255,0.08)`,
  borderRadius: "12px", padding: "14px 16px", textAlign: "center",
};

const actionLink: React.CSSProperties = {
  color: t.ink, fontSize: "13px", fontWeight: 600, textDecoration: "none",
};

const noteCard: React.CSSProperties = {
  background: t.violetSoft, border: `1px solid ${t.violetBorder}`,
  borderRadius: "14px", padding: "20px 22px", marginTop: "16px",
};

const noteText: React.CSSProperties = {
  color: t.ink, fontSize: "15px", lineHeight: 1.55, margin: "0 0 10px",
};

const noteAttr: React.CSSProperties = {
  color: t.inkMute, fontSize: "13px", fontWeight: 600, margin: 0,
};
