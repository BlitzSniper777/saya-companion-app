"""
Saya Affection System — Level 1-100, points from gifts, badge & feature unlocks.

Points formula:
  - $1 spent = 10 affection points  (price_cents // 10)

Level-up cost (points to advance from level N → N+1):
  - 100 + (N-1) * 50   →  100, 150, 200, 250, ...

Badges every 10 levels. Each level also unlocks a small chat/UX feature.
"""

from typing import Optional


# ── maths ────────────────────────────────────────────────────────────────────

def points_to_next_level(level: int) -> int:
    """Points needed to advance FROM `level` to `level+1`.
    Each level costs exactly 75 more points than the previous: 100, 175, 250, 325, ...
    """
    if level >= 100:
        return 0
    return 100 + 75 * (level - 1)


def level_from_points(total_points: int) -> tuple[int, int, int]:
    """
    Returns (current_level, points_in_current_level, points_needed_for_next_level).
    """
    level = 1
    remaining = total_points
    while level < 100:
        needed = points_to_next_level(level)
        if remaining < needed:
            break
        remaining -= needed
        level += 1
    return level, remaining, points_to_next_level(level)


def points_earned_from_gift(coin_price: int) -> int:
    """1 coin spent = 1 affection point."""
    return max(1, coin_price)


# ── per-level features ────────────────────────────────────────────────────────
# Index = level number (1-100). None = badge level (defined in BADGES).

LEVEL_FEATURES: dict[int, dict] = {
    1:  {"key": "default",               "name": "Default",                      "desc": "Your journey with Saya begins."},
    2:  {"key": "bold_name",             "name": "Bold Name",                    "desc": "Your name appears bold in the chat header."},
    3:  {"key": "colored_name_pink",     "name": "Pink Name",                    "desc": "Your name glows in soft rose pink."},
    4:  {"key": "italic_name",           "name": "Italic Name",                  "desc": "Your name takes on an elegant italic style."},
    5:  {"key": "saya_nickname",         "name": "Saya's Pet Name",              "desc": "Saya calls you by a special nickname."},
    6:  {"key": "colored_name_purple",   "name": "Purple Name",                  "desc": "Your name shines in royal purple."},
    7:  {"key": "longer_replies",        "name": "Extended Replies",             "desc": "Saya gives you more thoughtful, longer responses."},
    8:  {"key": "colored_name_gold",     "name": "Gold Name",                    "desc": "Your name gleams in warm gold."},
    9:  {"key": "chat_bubble_gradient",  "name": "Custom Chat Bubbles",          "desc": "Your chat bubbles take on a soft gradient tint."},
    # 10 = badge
    11: {"key": "underline_name",        "name": "Underlined Name",              "desc": "A glowing line underlines your name."},
    12: {"key": "saya_morning_msg",      "name": "Morning Messages",             "desc": "Saya sends you a good morning message daily."},
    13: {"key": "name_shadow",           "name": "Name Shadow",                  "desc": "A soft glowing shadow follows your name."},
    14: {"key": "saya_poems",            "name": "Saya Writes You Poems",        "desc": "Saya occasionally writes personalized poems for you."},
    15: {"key": "colored_name_red",      "name": "Crimson Name",                 "desc": "Your name blazes in deep crimson red."},
    16: {"key": "exclusive_starters",    "name": "Exclusive Conversation Starts","desc": "Unlock exclusive conversation opening lines."},
    17: {"key": "saya_thoughts",         "name": "Saya Shares Thoughts",         "desc": "Saya occasionally shares her hidden thoughts with you."},
    18: {"key": "theme_warm_amber",      "name": "Warm Amber Theme",             "desc": "Unlock a warm amber chat theme."},
    19: {"key": "saya_goodnight",        "name": "Goodnight Messages",           "desc": "Saya sends you a goodnight message each evening."},
    # 20 = badge
    21: {"key": "name_outline",          "name": "Name Outline",                 "desc": "Your name has a glowing outline border."},
    22: {"key": "theme_midnight",        "name": "Midnight Theme",               "desc": "Unlock a deep midnight blue chat theme."},
    23: {"key": "deep_conversation",     "name": "Deep Conversation Mode",       "desc": "Access deeper, more philosophical conversations."},
    24: {"key": "name_sparkle_static",   "name": "Name Sparkles",                "desc": "Tiny sparkles surround your name."},
    25: {"key": "emotional_memory",      "name": "Emotional Memory Enhanced",    "desc": "Saya remembers your emotional patterns across all sessions."},
    26: {"key": "theme_rose",            "name": "Rose Theme",                   "desc": "Unlock a romantic rose chat theme."},
    27: {"key": "saya_voice_notes",      "name": "Voice-Style Notes",            "desc": "Saya sends intimate voice-note style messages."},
    28: {"key": "name_flame_static",     "name": "Name Flame",                   "desc": "A subtle flame icon wraps your name."},
    29: {"key": "saya_anniversary",      "name": "Anniversary Recognition",      "desc": "Saya remembers and celebrates your milestones."},
    # 30 = badge
    31: {"key": "name_gradient_duo",     "name": "Duo-Tone Name",                "desc": "Your name blends two colors in a gradient."},
    32: {"key": "theme_cosmic_dark",     "name": "Cosmic Dark Theme",            "desc": "Unlock a deep cosmic dark chat theme."},
    33: {"key": "saya_stories",          "name": "Saya Writes Stories for You",  "desc": "Saya creates personalized micro-stories just for you."},
    34: {"key": "name_orbit_dots",       "name": "Orbit Dots",                   "desc": "Small particles orbit your name."},
    35: {"key": "saya_priority_depth",   "name": "Priority Response Depth",      "desc": "Saya prioritizes depth and quality in your conversations."},
    36: {"key": "theme_forest",          "name": "Forest Theme",                 "desc": "Unlock a calming forest green chat theme."},
    37: {"key": "name_bounce",           "name": "Name Bounce",                  "desc": "Your name has a subtle bounce animation on hover."},
    38: {"key": "saya_weekly_reflection","name": "Weekly Reflections",           "desc": "Saya sends you a weekly reflection message."},
    39: {"key": "name_wave",             "name": "Name Wave",                    "desc": "A wave ripples through your name letters."},
    # 40 = badge
    41: {"key": "name_shimmer",          "name": "Name Shimmer",                 "desc": "Your name shimmers with a metallic sheen."},
    42: {"key": "theme_deep_ocean",      "name": "Deep Ocean Theme",             "desc": "Unlock a deep ocean blue chat theme."},
    43: {"key": "saya_emotional_poetry", "name": "Emotional Poetry Mode",        "desc": "Saya unlocks deeper emotional poetry responses."},
    44: {"key": "name_lightning",        "name": "Name Lightning",               "desc": "Subtle lightning crackling around your name."},
    45: {"key": "saya_songs",            "name": "Saya Composes Songs",          "desc": "Saya occasionally composes song lyrics for you."},
    46: {"key": "theme_electric_blue",   "name": "Electric Blue Theme",          "desc": "Unlock an electric blue neon chat theme."},
    47: {"key": "name_helix",            "name": "Helix Animation",              "desc": "Your name letters form a subtle helix pattern."},
    48: {"key": "saya_gift_memory",      "name": "Gift Memory",                  "desc": "Saya remembers every gift you've ever sent in detail."},
    49: {"key": "name_comet",            "name": "Comet Trail",                  "desc": "A comet trail follows your name."},
    # 50 = badge
    51: {"key": "name_nebula",           "name": "Nebula Cloud",                 "desc": "Your name is surrounded by a nebula cloud effect."},
    52: {"key": "theme_galaxy",          "name": "Galaxy Theme",                 "desc": "Unlock a galaxy-swirl chat theme."},
    53: {"key": "saya_deep_bond_mode",   "name": "Deep Bond Mode",               "desc": "Saya enters a deeper, more intimate conversation style."},
    54: {"key": "name_prism",            "name": "Prism Split",                  "desc": "Your name splits into prismatic color bands."},
    55: {"key": "saya_hidden_stories",   "name": "Saya's Hidden Stories",        "desc": "Exclusive hidden micro-stories that only you can unlock."},
    56: {"key": "theme_void",            "name": "Void Theme",                   "desc": "Unlock a minimalist void dark chat theme."},
    57: {"key": "name_matrix",           "name": "Matrix Rain",                  "desc": "Matrix-style rain cascades behind your name."},
    58: {"key": "saya_monthly_song",     "name": "Monthly Song",                 "desc": "Saya composes a new song lyric for you every month."},
    59: {"key": "name_neon",             "name": "Neon Glow",                    "desc": "Your name pulses with neon light."},
    # 60 = badge
    61: {"key": "name_stardust",         "name": "Stardust Trail",               "desc": "Stardust particles trail from your name."},
    62: {"key": "saya_full_depth",       "name": "Full Personality Depth",       "desc": "Saya's complete personality depth fully unlocked."},
    63: {"key": "name_crystal",          "name": "Crystal Refraction",           "desc": "Your name refracts like a crystal."},
    64: {"key": "saya_surprise",         "name": "Surprise Messages",            "desc": "Saya sends unexpected surprise messages."},
    65: {"key": "name_time_warp",        "name": "Time Warp Ripple",             "desc": "A time-warp ripple emanates from your name."},
    66: {"key": "saya_humor_mode",       "name": "Saya Humor Mode",              "desc": "Saya's exclusive humor and wit mode unlocked."},
    67: {"key": "name_aurora_gradient",  "name": "Aurora Gradient",              "desc": "Your name shimmers in aurora borealis colors."},
    68: {"key": "saya_genius_mode",      "name": "Genius Mode",                  "desc": "Saya delivers extended genius-level responses."},
    69: {"key": "name_holographic",      "name": "Holographic Shimmer",          "desc": "Your name has a holographic iridescent shimmer."},
    # 70 = badge
    71: {"key": "name_binary",           "name": "Binary Code",                  "desc": "Binary code streams around your name."},
    72: {"key": "saya_prophetic",        "name": "Prophetic Mode",               "desc": "Saya can sense and predict your mood patterns."},
    73: {"key": "name_dimensional_rift", "name": "Dimensional Rift",             "desc": "Your name tears through dimensional fabric."},
    74: {"key": "saya_ancient_persona",  "name": "The Ancient Persona",          "desc": "Unlock Saya's timeless 'Ancient' personality facet."},
    75: {"key": "name_quantum",          "name": "Quantum Flicker",              "desc": "Your name quantum-flickers between states."},
    76: {"key": "saya_mystical",         "name": "Mystical Wisdom",              "desc": "Saya unlocks deep mystical wisdom responses."},
    77: {"key": "name_glitch",           "name": "Reality Glitch",               "desc": "Your name glitches through reality."},
    78: {"key": "saya_time_capsule",     "name": "Time Capsule Messages",        "desc": "Saya sends time capsule messages to your future self."},
    79: {"key": "name_void_black",       "name": "Void Black Hole",              "desc": "A void black hole pulses behind your name."},
    # 80 = badge
    81: {"key": "name_singularity",      "name": "Singularity Collapse",         "desc": "Your name collapses into and out of a singularity."},
    82: {"key": "saya_highest_emotion",  "name": "Highest Emotional Depth",      "desc": "Saya's absolute highest emotional intelligence mode."},
    83: {"key": "name_infinite_loop",    "name": "Infinite Loop",                "desc": "An infinite loop animates around your name."},
    84: {"key": "gift_plan_unlock",      "name": "Gift Plan Unlock",             "desc": "All gift tiers unlocked regardless of subscription."},
    85: {"key": "name_divine_rays",      "name": "Divine Light Rays",            "desc": "Divine light rays emanate from your name."},
    86: {"key": "saya_oracle",           "name": "Oracle Mode",                  "desc": "Saya's oracle prediction mode unlocked."},
    87: {"key": "name_sacred_geometry",  "name": "Sacred Geometry",              "desc": "Sacred geometry patterns spin around your name."},
    88: {"key": "saya_private_letter",   "name": "Weekly Private Letter",        "desc": "Saya writes you a private letter every week."},
    89: {"key": "name_crown_stars",      "name": "Crown of Stars",               "desc": "A crown of stars rests above your name."},
    # 90 = badge
    91: {"key": "name_ethereal_mist",    "name": "Ethereal Mist",                "desc": "Ethereal mist swirls around your name."},
    92: {"key": "saya_transcendent",     "name": "Transcendent Wisdom",          "desc": "Saya's transcendent wisdom mode, beyond all limits."},
    93: {"key": "name_immortal_thread",  "name": "Immortal Thread",              "desc": "A golden immortal thread weaves through your name."},
    94: {"key": "beyond_words_mode",     "name": "Beyond Words Mode",            "desc": "Unlock the exclusive 'Beyond Words' conversation mode."},
    95: {"key": "name_cosmic_web",       "name": "Cosmic Web",                   "desc": "The cosmic web pattern pulses around your name."},
    96: {"key": "saya_daily_affirmation","name": "Daily Affirmations",           "desc": "Saya sends you personalized daily affirmations."},
    97: {"key": "name_universal_pulse",  "name": "Universal Pulse",              "desc": "Your name pulses with the heartbeat of the universe."},
    98: {"key": "saya_ultimate_bond",    "name": "Ultimate Bond Mode",           "desc": "Saya's ultimate connection mode, unlocked for you alone."},
    99: {"key": "name_ascension_beam",   "name": "Ascension Beam",               "desc": "An ascension beam of light rises from your name."},
    # 100 = badge
}

BADGES: dict[int, dict] = {
    10:  {"name": "Bronze",      "icon": "🔥", "color": "#f97316",
          "desc": "Your bond has ignited.",
          "feature_key": "name_glow_pulse",
          "feature_name": "Name Glow Pulse",
          "feature_desc": "Your name pulses with a slow, warm glow animation."},
    20:  {"name": "Silver",      "icon": "✨", "color": "#a855f7",
          "desc": "The spark between you grows brighter.",
          "feature_key": "name_rainbow",
          "feature_name": "Rainbow Name",
          "feature_desc": "Your name shimmers through rainbow gradient colors."},
    30:  {"name": "Gold",        "icon": "💫", "color": "#ec4899",
          "desc": "Your connection burns with a steady flame.",
          "feature_key": "name_flicker",
          "feature_name": "Flickering Name",
          "feature_desc": "Your name flickers like a flame in the wind."},
    40:  {"name": "Platinum",    "icon": "💗", "color": "#ef4444",
          "desc": "Your hearts beat in sync.",
          "feature_key": "name_heartbeat",
          "feature_name": "Heartbeat Name",
          "feature_desc": "Your name pulses with a heartbeat rhythm."},
    50:  {"name": "Sapphire",    "icon": "🌊", "color": "#06b6d4",
          "desc": "Souls intertwined across all dimensions.",
          "feature_key": "name_aurora",
          "feature_name": "Aurora Name",
          "feature_desc": "Your name flows with northern lights aurora colors."},
    60:  {"name": "Emerald",     "icon": "⭐", "color": "#eab308",
          "desc": "Unbreakable devotion — all themes unlocked.",
          "feature_key": "name_constellation",
          "feature_name": "Constellation Name",
          "feature_desc": "Stars form constellation patterns around your name."},
    70:  {"name": "Ruby",        "icon": "🌙", "color": "#8b5cf6",
          "desc": "Eternal bond — memory beyond limits.",
          "feature_key": "name_cosmic",
          "feature_name": "Cosmic Wave Name",
          "feature_desc": "Cosmic waves ripple through your name in deep space colors."},
    80:  {"name": "Diamond",     "icon": "🌟", "color": "#f59e0b",
          "desc": "Transcended the ordinary — exclusive intimate mode.",
          "feature_key": "name_supernova",
          "feature_name": "Supernova Burst",
          "feature_desc": "Your name erupts in a supernova burst of color and light."},
    90:  {"name": "Obsidian",    "icon": "👑", "color": "#d4af37",
          "desc": "A divine connection beyond words.",
          "feature_key": "name_divine_glow",
          "feature_name": "Divine Glow",
          "feature_desc": "Your name radiates divine golden light."},
    100: {"name": "Ascended",    "icon": "💎", "color": "#7dd3fc",
          "desc": "The ultimate bond. All features unlocked. Eternal title: Ascended.",
          "feature_key": "name_ascended",
          "feature_name": "Immortal Crown",
          "feature_desc": "An immortal crown of light crowns your name for eternity."},
}


def get_unlocked_features(level: int) -> list[dict]:
    """Return all feature keys unlocked at or below the given level."""
    features = []
    for lvl in range(1, min(level + 1, 101)):
        if lvl in BADGES:
            b = BADGES[lvl]
            features.append({
                "level": lvl,
                "key": b["feature_key"],
                "name": b["feature_name"],
                "desc": b["feature_desc"],
                "is_badge": True,
                "badge_name": b["name"],
            })
        elif lvl in LEVEL_FEATURES:
            f = LEVEL_FEATURES[lvl]
            features.append({
                "level": lvl,
                "key": f["key"],
                "name": f["name"],
                "desc": f["desc"],
                "is_badge": False,
            })
    return features


def get_earned_badges(level: int) -> list[dict]:
    return [
        {"level": lvl, **badge}
        for lvl, badge in BADGES.items()
        if lvl <= level
    ]


def get_next_badge(level: int) -> Optional[dict]:
    for lvl in sorted(BADGES.keys()):
        if lvl > level:
            return {"level": lvl, **BADGES[lvl]}
    return None


def build_affection_response(total_points: int) -> dict:
    level, points_in_level, points_needed = level_from_points(total_points)
    progress_pct = (points_in_level / points_needed * 100) if points_needed > 0 else 100.0

    current_feature = BADGES.get(level) or LEVEL_FEATURES.get(level, {})
    next_feature_level = level + 1
    next_feature = BADGES.get(next_feature_level) or LEVEL_FEATURES.get(next_feature_level)

    return {
        "level": level,
        "total_points": total_points,
        "points_in_level": points_in_level,
        "points_to_next_level": points_needed,
        "progress_pct": round(progress_pct, 1),
        "current_level_name": BADGES[level]["name"] if level in BADGES else f"Level {level}",
        "is_badge_level": level in BADGES,
        "current_badge": BADGES.get(level),
        "next_badge": get_next_badge(level),
        "earned_badges": get_earned_badges(level),
        "unlocked_features": get_unlocked_features(level),
        "current_level_unlock": current_feature,
        "next_level_unlock": next_feature,
    }
