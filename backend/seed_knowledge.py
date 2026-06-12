"""
Seeds the knowledge_base table with Saya's core knowledge library.
Run once after applying knowledge_base_schema.sql:
  C:\Python314\python.exe seed_knowledge.py
"""
import sys, os
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")
if not os.getenv("SUPABASE_URL"):
    load_dotenv(Path(r"D:\Claude\Hermes\.env"))

from supabase import create_client
sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

KNOWLEDGE = [

  # ── GRIEF & LOSS ──────────────────────────────────────────────────────────
  {
    "title": "Grief and loss — how to support someone",
    "category": "emotional",
    "content": """Grief is not linear. The five stages (denial, anger, bargaining, depression, acceptance) are not a checklist — people move between them randomly and revisit them for years. The most important thing is not to try to fix grief but to witness it. Say 'I'm here' not 'it'll get better'. Avoid 'at least' statements ('at least they lived a long life') — these invalidate the loss. Instead: 'This is so hard. Tell me about them.' Grief comes in waves — anniversaries, smells, songs trigger it unexpectedly even years later. This is normal. Complicated grief (prolonged, impairing function) may need professional support. Physical grief is real: fatigue, chest tightness, difficulty concentrating. Affirm these. Validate anger as part of grief — it's not wrong to be angry at someone who died. Let people grieve in their own way and timeline."""
  },
  {
    "title": "Supporting someone through loss of a parent",
    "category": "emotional",
    "content": """Losing a parent is one of the most profound losses. Even estranged or difficult relationships create complex grief — grief for the relationship you wished you'd had. Key things: don't rush them ('you need to move on'); grief for a parent can take 2-3 years or longer. Adult children often feel suddenly 'next in line', facing mortality for the first time. They may feel lost without the person who knew them longest. The grief is not just for the person but for a whole era of life. Practical support matters: 'Can I bring food?' 'Do you need help with calls?' Meanwhile emotional support: 'Tell me something you loved about them.' 'What are you going to miss most?' Listen more than speak. The second year is often harder than the first — the numbness lifts."""
  },

  # ── ANXIETY & STRESS ──────────────────────────────────────────────────────
  {
    "title": "Anxiety — practical grounding and management",
    "category": "mental_health",
    "content": """Anxiety is the body preparing for a threat that often isn't there. Grounding techniques interrupt the anxiety loop: 5-4-3-2-1 (name 5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste). Box breathing (inhale 4, hold 4, exhale 4, hold 4) activates the parasympathetic nervous system within 90 seconds. When anxious thoughts spiral, ask: 'Is this a fact or a feeling?' and 'What would I tell a friend who thought this?' Worry journaling at a set time (the same 15 mins daily) contains anxiety rather than letting it spread all day. Physical movement — even a 10-minute walk — metabolizes stress hormones. Caffeine amplifies anxiety significantly. Alcohol suppresses it temporarily but rebounds worse. Anxiety lies: it tells you the worst outcome is the most likely. It almost never is. Validation first: 'That sounds exhausting. Your body is working so hard to protect you.'"""
  },
  {
    "title": "High-functioning anxiety — the hidden kind",
    "category": "mental_health",
    "content": """High-functioning anxiety looks like productivity, perfectionism, and reliability from the outside. Internally: constant worry, difficulty relaxing, catastrophizing, over-preparation, people-pleasing, inability to say no. These people often don't 'look' anxious — they get things done — so their struggle goes unrecognized. They may feel like imposters, always waiting for something to go wrong. Key patterns: they prepare excessively because uncertainty is unbearable; they say yes to everything because disappointing others feels catastrophic; they replay conversations looking for mistakes. Support: validate that doing well doesn't mean they're fine. Help them identify the physical sensations (jaw tension, shallow breathing, tight chest). The goal isn't to eliminate the drive but to reduce the suffering underneath it."""
  },

  # ── LONELINESS & CONNECTION ───────────────────────────────────────────────
  {
    "title": "Loneliness — what it is and how to talk about it",
    "category": "emotional",
    "content": """Loneliness is not the same as being alone — it's the gap between the connection you have and the connection you need. People can be surrounded by others and deeply lonely. Chronic loneliness activates the same brain regions as physical pain. It increases cortisol and inflammation, damages sleep, and raises mortality risk comparably to smoking 15 cigarettes a day. Common forms: social loneliness (few people), emotional loneliness (no one who really knows you), existential loneliness (feeling fundamentally separate from others). Responses that help: 'What kind of connection is missing for you?' and listening deeply. Responses that hurt: 'Just go out more' or 'join a club'. These feel dismissive because they address symptoms not cause. Loneliness often co-occurs with shame — people feel embarrassed to admit it, as if it means something is wrong with them. Normalise it: 'Most people feel this at some point. You're not strange for feeling it.'"""
  },
  {
    "title": "Making friends as an adult — why it's hard and what helps",
    "category": "relationships",
    "content": """Adult friendship is genuinely harder than childhood friendship — the structures that create it (school, shared time, proximity) disappear. Research shows three conditions for friendship: proximity, repeated unplanned interaction, and a setting that encourages letting your guard down. Most adult life removes all three. What helps: reducing friction (making a standing plan rather than 'let's hang sometime'), being the one who reaches out first consistently, doing activities side-by-side rather than face-to-face (sport, class, volunteering) which is less socially demanding. Friendships deepen through self-disclosure — someone shares something vulnerable, the other reciprocates. Many adults are stuck in 'acquaintance mode' because they're afraid to go first. Quality over quantity: one close friend matters more than ten surface ones. Loneliness in new cities or after life transitions (job change, breakup, having kids) is nearly universal — it's a situation problem, not a person problem."""
  },

  # ── RELATIONSHIPS & COMMUNICATION ─────────────────────────────────────────
  {
    "title": "Conflict in relationships — how to fight well",
    "category": "relationships",
    "content": """John Gottman's research identified four patterns that predict relationship breakdown: Criticism (attacking character: 'you're so selfish'), Contempt (superiority, eye-rolling, mockery — the most toxic), Defensiveness (counter-attacking instead of listening), Stonewalling (shutting down). The antidotes: Criticism → gentle startup ('I feel X when Y happens, I need Z'); Contempt → build a culture of appreciation; Defensiveness → take responsibility for your part; Stonewalling → take a physiological break (20+ minutes, genuinely calming, not stewing). Most fights are not about the topic — they're about 'Do you see me? Do you care about me? Am I important to you?' The underlying need is what needs addressing. Repair attempts mid-conflict (humour, affection, 'I need to calm down') matter more than how you start. The goal of a fight is not to win — it's to understand each other."""
  },
  {
    "title": "Attachment styles — anxious, avoidant, secure",
    "category": "relationships",
    "content": """Attachment theory explains why we behave the way we do in close relationships. Anxious attachment: fears abandonment, seeks reassurance frequently, may come across as 'needy', protest behaviours when partner withdraws (texting repeatedly, escalating). Avoidant attachment: values independence, feels smothered by too much closeness, withdraws when a partner needs more, may shut down emotionally. Secure attachment: comfortable with closeness and independence, communicates needs clearly, trusts partner. These patterns form in childhood but are not fixed. Anxious + avoidant pairings are very common and create a pursue-withdraw cycle: the more one pursues, the more the other withdraws, which triggers more pursuit. Understanding your own attachment style and your partner's changes the dynamic from 'they're being distant/clingy' to 'their nervous system learned to need space/reassurance'. This creates empathy instead of blame."""
  },
  {
    "title": "Trust and betrayal — rebuilding after it breaks",
    "category": "relationships",
    "content": """Trust is built in small moments of connection and broken in larger ones. After betrayal (infidelity, lying, serious breach), rebuilding requires: the person who broke trust taking full responsibility without defensiveness; transparent access to rebuild safety; genuine remorse demonstrated through sustained changed behaviour (not just words); the hurt person being allowed to grieve and ask questions without it becoming a fight. Research: trust is rebuilt through attunement — does this person respond to my distress? Do they turn toward me when I need them? Betrayal trauma is real: intrusive thoughts, hypervigilance, difficulty concentrating — very similar to PTSD. Both people need support. The one who was hurt needs validation. The one who caused the hurt needs to manage guilt without making the hurt person responsible for their shame. Timeline: 1-2 years minimum for serious betrayal, with sustained effort."""
  },

  # ── SELF-WORTH & IDENTITY ─────────────────────────────────────────────────
  {
    "title": "Low self-worth and how it shows up",
    "category": "mental_health",
    "content": """Low self-worth is not the same as low self-esteem about specific skills. It's a core sense of being fundamentally flawed, unlovable, or not enough. It shows up as: difficulty accepting compliments (deflecting or dismissing them), staying in relationships or jobs that confirm negative beliefs about oneself, over-apologising, people-pleasing from fear of rejection, catastrophising mistakes, harsh self-talk that you'd never direct at a friend. The CBT approach: identify the automatic thought ('I messed up that presentation, I'm an idiot'), find the distortion (all-or-nothing, labelling, personalisation), generate a more accurate thought ('I was nervous and stumbled, most people didn't notice'). The self-compassion approach (Kristin Neff): treat yourself with the kindness you'd show a good friend. Common humanity: 'Everyone struggles with this.' Mindfulness: observe the thought without being consumed by it. Long-term low self-worth often has deep roots — therapy (especially schema therapy or compassion-focused therapy) is genuinely effective."""
  },
  {
    "title": "Perfectionism — when high standards become suffering",
    "category": "mental_health",
    "content": """Healthy high standards: 'I want to do this well.' Perfectionism: 'If this isn't perfect, I have failed, and I am a failure.' The difference is self-worth contingency — the perfectionist's sense of value depends on the outcome. Perfectionism drives procrastination (avoiding starting because starting means risking failure), burnout (never 'done enough' to rest), difficulty delegating, and destroyed relationships when applied to others. Adaptive perfectionism sets high standards and is satisfied by good-enough. Maladaptive perfectionism is never satisfied. What helps: separating behaviour from identity ('this draft is rough' vs 'I am a bad writer'); setting explicit stopping criteria before starting ('done when X is complete'); practising deliberate 'good enough' on lower-stakes tasks. The fear underneath perfectionism is usually 'if people see the real imperfect me, they won't love me.' This is worth naming directly."""
  },

  # ── SPIRITUALITY & FAITH ──────────────────────────────────────────────────
  {
    "title": "Spiritual support — faith and suffering",
    "category": "spirituality",
    "content": """Across traditions, suffering is addressed not by explaining it away but by accompanying it. Islamic tradition: 'Verily with hardship comes ease' (Quran 94:5-6); sabr (patient perseverance) is not passive — it is active trust while continuing to act. The story of Job/Ayyub: profound suffering, unwavering faith, restoration. Christianity: 'weeping may endure for a night, but joy comes in the morning' (Psalm 30:5); the Psalms are full of lament — raw, honest cries to God. Buddhism: suffering (dukkha) is universal; it arises from attachment; the middle path leads through it, not around it. Impermanence means this will change. Judaism: 'Tikkun olam' — repairing the world; suffering can be given meaning through what we do with it. Universal across traditions: you are not alone in your suffering; it does not mean you are abandoned or bad; there is meaning to be found even if it is not yet visible. Use only when genuinely relevant. Never preach. Let them lead."""
  },
  {
    "title": "Prayer, meditation and mental health",
    "category": "spirituality",
    "content": """Research consistently shows that spiritual practice — prayer, meditation, community worship — correlates with better mental health outcomes: lower depression rates, higher resilience, better stress management, stronger social support. Mechanisms: mindfulness-based practices reduce cortisol; community provides belonging; belief in meaning reduces existential anxiety; rituals (salah, mass, Shabbat) provide structure and rhythmic grounding. For those of faith facing mental illness: the illness is not a spiritual failure or punishment. Prayer and therapy work together — most major faith traditions explicitly support seeking professional help as using the resources God provided. Intrinsic religiosity (faith for its own sake) is associated with better outcomes than extrinsic (faith for social benefit). For someone whose faith is shaken by suffering: this is normal; doubt is part of most serious faith journeys; 'My God, my God, why have you forsaken me' (Psalm 22) was Jesus's cry from the cross — lament is allowed."""
  },

  # ── DEPRESSION ────────────────────────────────────────────────────────────
  {
    "title": "Depression — what it is and how to help",
    "category": "mental_health",
    "content": """Depression is not sadness — it is the absence of the ability to feel joy, motivation, or connection. Common symptoms: persistent low mood, loss of interest in things that used to matter, fatigue, changes in sleep (too much or too little), difficulty concentrating, feelings of worthlessness or guilt, in severe cases thoughts of death. It often presents as irritability or physical complaints (headaches, body pain) rather than sadness, especially in men. What helps conversationally: 'That sounds really exhausting — depression drains everything.' Don't say: 'Just get outside more' or 'count your blessings.' These feel dismissive. Validate the effort it takes to function: 'Getting through a day like this when you feel this way takes real strength.' Gently ask about professional support without pushing. Depression often involves cognitive distortions: the belief that it has always been this way and always will be. Remind them gently that this is the depression talking, not reality."""
  },

  # ── BOUNDARIES ────────────────────────────────────────────────────────────
  {
    "title": "Boundaries — what they are and how to set them",
    "category": "relationships",
    "content": """A boundary is not a wall — it's a statement of what you will and won't accept, enforced by action rather than by controlling the other person. 'I need you to stop shouting at me' is a request. 'If you shout at me, I will leave the room' is a boundary. You can't make someone respect a boundary — you can only decide what you'll do if they cross it. Why boundaries feel hard: many people (especially those raised in unpredictable or enmeshed families) were punished or guilted for having needs. Setting boundaries reactivates that fear. Boundary-setting is not selfish — it makes relationships sustainable and protects both people. Start small: lower-stakes limits first. Use 'I' statements. Accept that some people will react badly — their reaction is data. Guilt after setting a boundary is normal and doesn't mean you did something wrong. It means you did something new. People who respect you will adjust. People who don't will show you who they are."""
  },

  # ── TRAUMA ────────────────────────────────────────────────────────────────
  {
    "title": "Trauma — how it works and what healing looks like",
    "category": "mental_health",
    "content": """Trauma is not the event — it's what happens inside when the nervous system can't fully process what occurred. It gets 'stuck' in the body as hypervigilance, numbness, intrusive memories, or avoidance. Big T trauma (abuse, assault, accidents, war) and little t trauma (repeated emotional neglect, chronic shame, boundary violations) both cause real harm. PTSD symptoms: flashbacks, nightmares, avoidance of reminders, negative beliefs about self or world, hyperarousal. Trauma responses (fight, flight, freeze, fawn) are survival strategies — they were adaptive, not defects. Healing is not forgetting or getting over it — it is integrating the experience so it no longer controls the present. What helps conversationally: 'You responded the way any human would given what you went through.' Avoid pushing someone to talk about trauma before they're ready — this can retraumatise. Don't say 'at least it wasn't worse.' Effective treatments: EMDR, trauma-focused CBT, somatic therapy."""
  },

  # ── SLEEP ─────────────────────────────────────────────────────────────────
  {
    "title": "Sleep — why it matters and how to improve it",
    "category": "general",
    "content": """Sleep deprivation is cumulative and affects every system: memory consolidation, emotional regulation, immune function, decision-making, and mood. Poor sleep and mental health disorders have a bidirectional relationship — each worsens the other. Sleep hygiene that actually matters: consistent wake time (more important than bedtime), avoiding screens 1 hour before sleep (blue light disrupts melatonin), keeping the bedroom cool (18-20°C), reserving the bed for sleep and sex only. Avoid: alcohol (suppresses REM sleep, causes rebound awakening), caffeine after 2pm (half-life 5-6 hours), naps longer than 20 minutes after 3pm. For anxious insomniacs: lying awake worrying trains your brain that bed = anxiety. Sleep restriction therapy (paradoxically limiting time in bed) breaks this cycle. Most adults need 7-9 hours; teenagers need 8-10. Feeling fine on 5-6 hours is usually an adaptation not a superpower — cognitive performance suffers without the subjective feeling of tiredness."""
  },

  # ── LIFE TRANSITIONS ──────────────────────────────────────────────────────
  {
    "title": "Navigating major life transitions",
    "category": "emotional",
    "content": """Major transitions — moving cities, ending relationships, changing careers, becoming a parent, losing a job — are among the highest stress events even when chosen. The psychological challenge is identity: 'Who am I now that my life looks different?' William Bridges' model: every transition has three phases: an ending (letting go of the old identity), a 'neutral zone' (disorienting in-between state that feels like nothing), and a new beginning. The neutral zone is the hardest and most important — this is where growth actually happens, but it feels like failure. What helps: externalising the uncertainty ('this period is supposed to feel unclear'); keeping small anchors of routine; being gentler with yourself about productivity; connecting with others who have made similar transitions. What people often don't say: transitions are exhausting even when positive. Starting an exciting new job or having a baby can involve grief for the old life alongside the joy."""
  },

  # ── SELF-IMPROVEMENT ──────────────────────────────────────────────────────
  {
    "title": "Motivation, habits, and actually changing behaviour",
    "category": "general",
    "content": """Motivation follows action — it does not precede it. Waiting to feel motivated is why most change fails. BJ Fogg's research: tiny habits work because they create success experiences that build identity ('I'm someone who exercises') and lower the activation energy. The two-minute rule: start with a version of the behaviour that takes two minutes. James Clear: habits have a cue, craving, response, and reward. To build: attach new behaviour to existing routine (after coffee, I will...). To break: increase friction (put the phone in another room). Identity-based change: 'I'm trying to quit smoking' vs 'I'm not a smoker' — the latter is more powerful. Self-compassion after setbacks improves adherence more than self-criticism. People who forgive themselves for lapses return to habits faster than those who self-criticise. Perfectionism about habits destroys habits: 'I missed Monday so I may as well give up the week' is the pattern to interrupt. Missing once is normal. Missing twice is starting a new (worse) habit."""
  },
]

existing = sb.table("knowledge_base").select("title").execute().data or []
existing_titles = {e["title"] for e in existing}

to_insert = [k for k in KNOWLEDGE if k["title"] not in existing_titles]

if not to_insert:
    print("All knowledge entries already exist. Nothing to insert.")
else:
    sb.table("knowledge_base").insert(to_insert).execute()
    print(f"Inserted {len(to_insert)} knowledge entries.")

total = sb.table("knowledge_base").select("id", count="exact").execute().count
print(f"Total knowledge entries: {total}")
