"use client";

import { useState } from "react";
import {
  Frown, AlertTriangle, HelpCircle, CloudRain,
  Sparkles, Heart, Sunrise, CheckCircle2,
  ArrowRight, Check, Plus, Minus,
} from "lucide-react";
import { CRISIS_TEXT, DISCLAIMER_TEXT } from "@/lib/legal";

const MYRTHE_PHOTO_URL =
  "https://beyondpsychology.eu/wp-content/uploads/2025/07/Myrthe-team-photo-3.png";

const painCards = [
  { icon: Frown, title: "Something keeps not working, and you've tried everything", body: "A business that almost grows and then stalls. A relationship pattern you keep rebuilding under a new name." },
  { icon: AlertTriangle, title: "A fear showed up that doesn't match the moment", body: "Suddenly scared of flying, of driving, of losing someone, and you can't quite explain why now." },
  { icon: HelpCircle, title: "You keep playing the same role with the same people", body: "Around your parents, your family, certain old friends, you become a version of yourself you thought you'd outgrown." },
  { icon: CloudRain, title: "You already know the word for it, but naming it hasn't changed anything", body: "You've read the books, done the therapy, and you can still feel it running." },
];

const shiftCards = [
  { icon: Sparkles, title: "You know what you actually want", body: "Not what you've talked yourself into accepting, clearly enough to act on it." },
  { icon: Heart, title: "You stop feeling like a guest in your own life", body: "You're in the room, in the decision, in the conversation, as yourself." },
  { icon: Sunrise, title: "You see exactly where the pattern still has grip", body: "You stop being surprised by the moments you go small." },
  { icon: CheckCircle2, title: "You understand why you built it, without shame", body: "The pattern made sense when it started. Seeing that clearly changes what it means about you." },
];

const steps = [
  { title: "Describe the situation you keep finding yourself in", body: "A recurring moment where you hold back, shrink, perform, or act against what you actually want." },
  { title: "Name what you tell yourself about why you do it", body: "The story you've been carrying, so the tool can show you what's underneath it." },
  { title: "Name where you first learned this was the safest way to be", body: "A memory, a person, a period, whatever comes to mind first." },
  { title: "Choose what feels most true, then receive your reading", body: "Pick the explanation that lands, even if it stings, then get five sections back, sent to your inbox as a PDF too." },
  { title: "Use the practice to try, then run it again with new information", body: "Each pass goes deeper. Different situations, different layers, the same pattern seen from a new angle." },
];

const objections = [
  { q: "I've done therapy, read all the books, journaled for years. Why would this be any different?", a: "Everything you've tried asked you to do more. This doesn't ask you to fix anything. It shows you what's been happening." },
  { q: "What if I've been performing for so long I don't even know what's real about me anymore?", a: "That's exactly the state this was built for. You describe what you keep doing, the reading builds the picture from there." },
  { q: "I'm scared that if I look at this, I'll have to blow up the life I've built.", a: "Seeing the pattern doesn't force you to do anything. It gives you back the ability to choose." },
  { q: "What if the problem really is that I'm too sensitive or too needy?", a: "Sensitivity and neediness are labels you put on a response that made complete sense given what happened. The Pattern Spotter doesn't confirm the story that something is wrong with you. It shows you where the response came from and what it was protecting. That's not a character flaw. That's a pattern, and patterns can be seen." },
];

const faqs = [
  { q: "How does the Pattern Spotter actually work?", a: "You answer four questions, choose which explanation feels most true, and get five sections back: the pattern, where it came from, where it's still running, where you're less of a victim than you think, and a practice to try. Each section sits in its own card with a copy button, and you also get the whole thing as a PDF, downloadable on the spot and emailed to you." },
  { q: "Is this private? Who sees what I type in?", a: "We ask for your email to give you your reading, that's it. What you write is used only to generate it." },
  { q: "Can I run it more than once?", a: "Each purchase includes 5 readings. Run it again any time you want to go deeper, different situations, different layers, the same pattern seen from a new angle." },
];

function FaqItem({ item }: { item: { q: string; a: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ps2-faq-item">
      <button className="ps2-faq-head" onClick={() => setOpen(!open)}>
        <span>{item.q}</span>
        {open ? <Minus size={18} /> : <Plus size={18} />}
      </button>
      {open && <div className="ps2-faq-body">{item.a}</div>}
    </div>
  );
}

const PS2_STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Cormorant+Garamond:ital@1&family=Open+Sans:wght@300;400;600;700&display=swap');
        .ps2-root {
          --dark: #2C3535;
          --cream: #F5F0E8;
          --terracotta: #D9735C;
          --mint: #d4e4e0;
          --brown: #7a6248;
          --eyebrow: #c89878;
          --text: #1a1208;
          --sage: #4a7c6f;
          --mint-btn: #c89878;
          --terracotta-bright: #c4522a;
          --peach: #f2e2da;
          font-family: 'Open Sans', sans-serif;
          font-weight: 300;
          color: var(--text);
          background: #fff;
        }
        .ps2-root * { box-sizing: border-box; }
        .ps2-h { font-family: 'Abril Fatface', serif; }
        .ps2-container { max-width: 760px; margin: 0 auto; padding: 0 24px; }

        .ps2-urgency {
          background: var(--terracotta); color: #fff; text-align: center;
          font-weight: 700; font-size: 15px; padding: 16px 20px; line-height: 1.5;
        }

        .ps2-section { padding: 64px 0; }
        @media (min-width: 768px) { .ps2-section { padding: 88px 0; } }
        .ps2-section.mint { background: var(--mint); }
        .ps2-section.white { background: #fff; }
        .ps2-section.cream { background: var(--cream); }
        .ps2-section.sage { background: var(--sage); color: #fff; }
        .ps2-section.dark { background: var(--dark); color: var(--cream); }

        .ps2-eyebrow {
          text-transform: uppercase; letter-spacing: 0.12em; font-size: 12px;
          font-weight: 700; color: var(--eyebrow); text-align: center; margin-bottom: 16px;
        }
        .ps2-h1 { font-size: 32px; line-height: 1.15; text-align: center; color: var(--dark); margin: 0 0 20px; }
        @media (min-width: 768px) { .ps2-h1 { font-size: 46px; } }
        .ps2-h2 { font-size: 26px; line-height: 1.2; color: var(--dark); margin: 0 0 16px; }
        @media (min-width: 768px) { .ps2-h2 { font-size: 32px; } }
        .ps2-h2.center { text-align: center; }
        .ps2-divider { width: 100px; height: 1px; background: rgba(44,53,53,0.25); margin: 24px auto; }
        .ps2-sub { font-size: 17px; line-height: 1.65; text-align: center; color: #4a453c; max-width: 560px; margin: 0 auto; }
        .ps2-p { font-size: 16px; line-height: 1.7; color: #4a453c; margin: 0 0 16px; }

        .ps2-btn {
          display: inline-flex; align-items: center; gap: 8px; justify-content: center;
          background: var(--brown); color: #fff; font-weight: 700; font-size: 14px;
          letter-spacing: 0.06em; text-transform: uppercase;
          padding: 18px 36px; border-radius: 6px; text-decoration: none; border: none; cursor: pointer;
          transition: all 200ms ease;
        }
        .ps2-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .ps2-btn.outline { background: transparent; border: 1.5px solid rgba(255,255,255,0.6); }
        .ps2-btn.on-mint { background: var(--mint-btn); }
        .ps2-btn.bright { background: var(--terracotta-bright); }
        .ps2-cta-wrap { text-align: center; margin-top: 32px; }
        .ps2-cta-subtext { font-size: 13px; color: #6a6357; margin-top: 14px; max-width: 480px; margin-left: auto; margin-right: auto; }
        .ps2-section.dark .ps2-cta-subtext, .ps2-section.sage .ps2-cta-subtext { color: rgba(255,255,255,0.75); }
        .ps2-stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 40px; }
        @media (min-width: 560px) { .ps2-stat-grid { grid-template-columns: repeat(4, 1fr); } }
        .ps2-stat-card { background: #fff; border-radius: 16px; padding: 28px 12px; text-align: center; box-shadow: 0 4px 14px rgba(0,0,0,0.05); }
        .ps2-stat-num { font-family: 'Abril Fatface', serif; font-size: 30px; color: var(--terracotta); margin-bottom: 4px; }
        .ps2-stat-label { font-size: 13px; color: #4a453c; }

        .ps2-grid2 { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 40px; }
        @media (min-width: 640px) { .ps2-grid2 { grid-template-columns: 1fr 1fr; } }

        .ps2-card {
          background: #fff; border-radius: 16px; padding: 24px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.06);
        }
        .ps2-icon-chip {
          width: 42px; height: 42px; border-radius: 10px; background: rgba(212,228,224,0.6);
          display: flex; align-items: center; justify-content: center; margin-bottom: 14px; color: var(--dark);
        }
        .ps2-card-title { font-weight: 700; font-size: 16px; margin: 0 0 8px; color: var(--dark); }
        .ps2-card-body { font-size: 14px; line-height: 1.6; color: #4a453c; margin: 0; }

        .ps2-steps { margin-top: 40px; display: flex; flex-direction: column; gap: 0; }
        .ps2-step { display: flex; gap: 20px; padding: 24px 0; border-top: 1px solid rgba(44,53,53,0.12); }
        .ps2-step:last-child { border-bottom: 1px solid rgba(44,53,53,0.12); }
        .ps2-step-num { font-family: 'Abril Fatface', serif; font-size: 22px; color: var(--terracotta); flex-shrink: 0; width: 36px; }
        .ps2-step-title { font-weight: 700; font-size: 17px; margin: 0 0 6px; color: var(--dark); }
        .ps2-step-body { font-size: 14.5px; color: #4a453c; margin: 0; line-height: 1.6; }

        .ps2-checklist { margin-top: 32px; display: flex; flex-direction: column; gap: 14px; }
        .ps2-check-item { display: flex; gap: 12px; align-items: flex-start; font-size: 15.5px; line-height: 1.6; }
        .ps2-check-icon { color: var(--terracotta); flex-shrink: 0; margin-top: 2px; }

        .ps2-testimonial {
          background: #fff; border-radius: 16px; padding: 28px; margin-top: 20px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.05);
        }
        .ps2-testimonial-placeholder {
          text-align: center; padding: 40px 24px; border-radius: 16px;
          border: 1.5px dashed rgba(44,53,53,0.25); color: #8a8073; font-style: italic; margin-top: 20px;
        }

        .ps2-price-box { text-align: center; margin-top: 32px; }
        .ps2-price-strike { font-size: 15px; color: rgba(245,240,232,0.55); text-decoration: line-through; margin-bottom: 4px; }
        .ps2-price-big { font-family: 'Abril Fatface', serif; font-size: 56px; margin: 8px 0 24px; }

        .ps2-founder-wrap { display: flex; flex-direction: column; gap: 32px; align-items: center; }
        @media (min-width: 768px) { .ps2-founder-wrap { flex-direction: row; align-items: flex-start; } }
        .ps2-founder-photo { width: 220px; height: 220px; border-radius: 16px; object-fit: cover; flex-shrink: 0; }
        .ps2-signature { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 28px; margin-top: 20px; color: var(--dark); }

        .ps2-obj-card { background: #fff; border-radius: 16px; padding: 22px; margin-top: 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.05); }
        .ps2-obj-q { font-weight: 700; font-size: 15px; color: var(--dark); margin-bottom: 10px; }
        .ps2-obj-a { font-size: 14.5px; color: #4a453c; line-height: 1.6; }

        .ps2-faq-item { border-bottom: 1px solid rgba(44,53,53,0.15); }
        .ps2-faq-head {
          width: 100%; background: none; border: none; padding: 22px 0; text-align: left; cursor: pointer;
          display: flex; align-items: center; justify-content: space-between; font-weight: 600; font-size: 16px; color: var(--dark);
        }
        .ps2-faq-body { padding: 0 0 22px; font-size: 14.5px; color: #4a453c; line-height: 1.65; max-width: 620px; }

        .ps2-footer-note { text-align: center; padding: 32px 24px; font-size: 12px; color: #9a9284; }
`;

export default function PatternSpotterSalespageV2() {
  return (
    <div className="ps2-root">
      <style dangerouslySetInnerHTML={{ __html: PS2_STYLES }} />

      <div className="ps2-urgency">
        Want to stop guessing why you're stuck, so you can finally see the pattern, without another round of therapy that talks around it?
      </div>

      {/* HERO */}
      <section className="ps2-section mint">
        <div className="ps2-container">
          <p className="ps2-eyebrow">Introducing</p>
          <h1 className="ps2-h1 ps2-h">The Pattern Spotter</h1>
          <div className="ps2-divider" />
          <p className="ps2-sub">
            Answer four questions and find out exactly which pattern is still running your life, where it started, and the one place you have more power than you think. Yours to keep, too — sent to your inbox as a PDF.
          </p>
          <div className="ps2-cta-wrap">
            <a href="/tool" className="ps2-btn on-mint">Yes, I want to see my pattern</a>
            <p className="ps2-cta-subtext">5 readings for €27. Instant access, no account needed. Each reading: four questions, five sections back. Written by a psychologist, not a chatbot.</p>
          </div>
          <div className="ps2-stat-grid">
            <div className="ps2-stat-card"><div className="ps2-stat-num">4</div><div className="ps2-stat-label">Questions</div></div>
            <div className="ps2-stat-card"><div className="ps2-stat-num">5</div><div className="ps2-stat-label">Readings</div></div>
            <div className="ps2-stat-card"><div className="ps2-stat-num">€27</div><div className="ps2-stat-label">Price</div></div>
            <div className="ps2-stat-card"><div className="ps2-stat-num">Instant</div><div className="ps2-stat-label">Access</div></div>
          </div>
        </div>
      </section>

      {/* THE STRUGGLE */}
      <section className="ps2-section white">
        <div className="ps2-container">
          <p className="ps2-eyebrow" style={{ textAlign: "left" }}>Real talk</p>
          <h2 className="ps2-h2 ps2-h">You know something is off. You just can't name it.</h2>
          <p className="ps2-p">And until you can name it, nothing actually changes.</p>
          <p className="ps2-p">Maybe it's the business that won't grow no matter what you try. Maybe it's a fear that showed up out of nowhere and doesn't seem to match the moment. Maybe it's the same role you keep playing with your parents, no matter how much distance you've put between you.</p>
          <p className="ps2-p" style={{ fontWeight: 700, color: "var(--dark)" }}>This is probably closer to your reality than you'd expect:</p>

          <div className="ps2-grid2">
            {painCards.map((c, i) => (
              <div className="ps2-card" key={i}>
                <div className="ps2-icon-chip"><c.icon size={20} /></div>
                <p className="ps2-card-title">{c.title}</p>
                <p className="ps2-card-body">{c.body}</p>
              </div>
            ))}
          </div>

          <p className="ps2-p" style={{ textAlign: "center", fontStyle: "italic", marginTop: 40, color: "var(--dark)" }}>&quot;You&apos;re not broken. You&apos;re just still inside a pattern you haven&apos;t been able to see.&quot;</p>
          <p className="ps2-p" style={{ textAlign: "center" }}>That&apos;s exactly what the Pattern Spotter gives you: the name of the pattern, where it came from, and where it&apos;s still running.</p>
        </div>
      </section>

      {/* WHAT SHIFTS */}
      <section className="ps2-section cream">
        <div className="ps2-container">
          <h2 className="ps2-h2 ps2-h center">What shifts when you can finally see the pattern</h2>
          <div className="ps2-grid2">
            {shiftCards.map((c, i) => (
              <div className="ps2-card" key={i}>
                <div className="ps2-icon-chip"><c.icon size={20} /></div>
                <p className="ps2-card-title">{c.title}</p>
                <p className="ps2-card-body">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="ps2-section white">
        <div className="ps2-container">
          <h2 className="ps2-h2 ps2-h center">5 steps to your pattern, named precisely and in full</h2>
          <p className="ps2-sub">You walk away knowing what the pattern is, where it came from, and where you&apos;re less stuck than you think.</p>
          <div className="ps2-steps">
            {steps.map((s, i) => (
              <div className="ps2-step" key={i}>
                <div className="ps2-step-num">{String(i + 1).padStart(2, "0")}</div>
                <div>
                  <p className="ps2-step-title">{s.title}</p>
                  <p className="ps2-step-body">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR YOU IF */}
      <section className="ps2-section cream">
        <div className="ps2-container">
          <h2 className="ps2-h2 ps2-h center">This is for you if</h2>
          <div className="ps2-checklist">
            {[
              "Something in your life keeps not working, no matter how many times you rebuild it differently",
              "A fear or reaction showed up that doesn't seem to match what's actually happening right now",
              "You become a different version of yourself around certain people, especially family",
              "You've read the books, done the therapy, and can still feel the pattern running",
              "You want to know what's actually driving it, not another label",
            ].map((t, i) => (
              <div className="ps2-check-item" key={i}>
                <Check size={18} className="ps2-check-icon" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="ps2-section mint">
        <div className="ps2-container">
          <h2 className="ps2-h2 ps2-h center">What people are saying</h2>
          <div className="ps2-testimonial">
            <p className="ps2-p" style={{ fontStyle: "italic", marginBottom: 0 }}>&quot;The story I might be telling myself really resonated. A beautiful insight came out of it.&quot;</p>
          </div>
          <div className="ps2-testimonial">
            <p className="ps2-p" style={{ fontStyle: "italic", marginBottom: 0 }}>&quot;I was hesitant to trust an AI tool. What I liked is that you get multiple possible answers, two didn&apos;t land, the third did. It&apos;s clearly reasoned, so you can choose the one that actually fits you. I came out of it more self-aware.&quot;</p>
          </div>
          <div className="ps2-testimonial">
            <p className="ps2-p" style={{ fontStyle: "italic", marginBottom: 0 }}>&quot;I really love the thorough explanation, and the way it lovingly acknowledges why the pattern developed in the first place.&quot;</p>
          </div>
          <div className="ps2-testimonial">
            <p className="ps2-p" style={{ fontStyle: "italic", marginBottom: 0 }}>&quot;You don&apos;t get the feeling you did something wrong, but you do get complete honesty.&quot;</p>
          </div>
          <div className="ps2-cta-wrap">
            <a href="/tool" className="ps2-btn on-mint">Yes, I want to see my pattern</a>
            <p className="ps2-cta-subtext">5 readings for €27. Instant access, no account needed. Each reading: four questions, five sections back. Written by a psychologist, not a chatbot.</p>
          </div>
        </div>
      </section>

      {/* GET IT NOW / bright terracotta CTA block */}
      <section className="ps2-section" style={{ background: "var(--terracotta-bright)", color: "#fff" }} id="tool">
        <div className="ps2-container">
          <p className="ps2-eyebrow" style={{ color: "rgba(255,255,255,0.75)" }}>You are invited to</p>
          <h2 className="ps2-h1 ps2-h" style={{ color: "#fff" }}>Get the Pattern Spotter now</h2>
          <p className="ps2-p" style={{ textAlign: "center", color: "rgba(255,255,255,0.9)", maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>A psychologist-led session that covers pattern identification, origin tracing, and blind spot mapping costs upward of €150 per hour, and rarely covers all five in one sitting. The Pattern Spotter delivers all five sections for €27, instantly, the moment you answer your questions.</p>
          <div className="ps2-price-box">
            <p className="ps2-eyebrow" style={{ color: "rgba(255,255,255,0.75)", marginBottom: 0 }}>5 readings for</p>
            <div className="ps2-price-big">€27</div>
            <a href="/tool" className="ps2-btn outline">I am ready</a>
            <p className="ps2-cta-subtext" style={{ color: "rgba(255,255,255,0.85)" }}>5 readings for €27. Instant access, no account needed. Each reading: four questions, five sections back. Written by a psychologist, not a chatbot.</p>
          </div>
        </div>
      </section>

      {/* NOTE FROM MYRTHE */}
      <section className="ps2-section white">
        <div className="ps2-container">
          <h2 className="ps2-h2 ps2-h">A note from Myrthe</h2>
          <div className="ps2-founder-wrap" style={{ marginTop: 32 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ps2-founder-photo" src={MYRTHE_PHOTO_URL} alt="Myrthe Glasbergen" />
            <div>
              <p className="ps2-p" style={{ fontWeight: 700, color: "var(--dark)" }}>Hey, I&apos;m Myrthe.</p>
              <p className="ps2-p">I&apos;m a psychologist and the founder of Beyond Psychology. My work is about helping people break free from the systems that kept them small, patriarchy, capitalism, gender conditioning, by unshaming what was never actually wrong with them. I built the Pattern Spotter because most people already know the word for what they do: people-pleasing, fawning, performing. What they don&apos;t have is someone looking at their specific situation and saying clearly, here is your pattern, here is where it came from, and here is the place you&apos;re less stuck than you think.</p>
              <p className="ps2-p">That&apos;s what the Pattern Spotter gives you. Not soft coaching. Precise, accurate, and without judgment.</p>
              <p className="ps2-signature">Myrthe</p>
            </div>
          </div>
        </div>
      </section>

      {/* EVERY DAY WITHOUT A NAME */}
      <section className="ps2-section dark">
        <div className="ps2-container">
          <h2 className="ps2-h1 ps2-h" style={{ color: "var(--cream)" }}>Every day without a name for it is another day inside it</h2>
          <p className="ps2-p" style={{ textAlign: "center", color: "rgba(245,240,232,0.8)" }}>
            Three months from now, without naming this, you are still editing yourself mid-sentence. The pattern doesn&apos;t dissolve on its own. Naming it doesn&apos;t take months. It takes four questions.
          </p>
        </div>
      </section>

      {/* OBJECTIONS */}
      <section className="ps2-section cream">
        <div className="ps2-container">
          <h2 className="ps2-h2 ps2-h center">Are you ready, even if you&apos;ve tried everything before?</h2>
          {objections.map((o, i) => (
            <div className="ps2-obj-card" key={i}>
              <div className="ps2-obj-q">&quot;{o.q}&quot;</div>
              <div className="ps2-obj-a">{o.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT'S INSIDE / sage RECAP */}
      <section className="ps2-section sage">
        <div className="ps2-container">
          <h2 className="ps2-h1 ps2-h" style={{ color: "#fff" }}>RECAP: what&apos;s inside</h2>
          <div className="ps2-checklist" style={{ marginTop: 32 }}>
            {[
              "Precise pattern identification: what you do, and what it's costing you now",
              "Origin tracing: where the pattern came from, and why it was intelligent then",
              "Blind spot mapping: exactly where it's still running in your life today",
              "A real lever: the specific place the pattern loses its grip",
              "A practice to try: one concrete thing to do with what you just saw",
              "Delivered straight to your inbox as a PDF too, yours to keep",
            ].map((t, i) => (
              <div className="ps2-check-item" key={i} style={{ color: "#fff" }}>
                <Check size={18} style={{ color: "var(--peach)", flexShrink: 0, marginTop: 2 }} />
                <span>{t}</span>
              </div>
            ))}
          </div>
          <div className="ps2-cta-wrap">
            <a href="/tool" className="ps2-btn outline">Yes, I want to see my pattern</a>
            <p className="ps2-cta-subtext">5 readings for €27. Instant access, no account needed. Each reading: four questions, five sections back. Written by a psychologist, not a chatbot.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="ps2-section white">
        <div className="ps2-container">
          <h2 className="ps2-h2 ps2-h">Do you have questions? Here are some answers.</h2>
          <div style={{ marginTop: 24 }}>
            {faqs.map((f, i) => <FaqItem key={i} item={f} />)}
          </div>
          <div className="ps2-cta-wrap">
            <a href="/tool" className="ps2-btn">Yes, I want to see my pattern</a>
            <p className="ps2-cta-subtext">5 readings for €27. Instant access, no account needed. Each reading: four questions, five sections back. Written by a psychologist, not a chatbot.</p>
          </div>
        </div>
      </section>

      <div className="ps2-footer-note">
        <p>Beyond Psychology · The Pattern Spotter</p>
        <p style={{ maxWidth: 560, margin: "12px auto 0" }}>{CRISIS_TEXT}</p>
        <p style={{ maxWidth: 560, margin: "8px auto 0" }}>{DISCLAIMER_TEXT}</p>
      </div>
    </div>
  );
}
