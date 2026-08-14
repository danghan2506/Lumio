# Design Spec: AI Teacher Audio Lesson Screen

This document specifies the design and implementation details for the AI Teacher Audio Lesson Screen in the Lumio application. It delivers a high-fidelity, interactive, audio-only language learning session.

---

## 1. Overview & Objective

The goal is to create a polished, audio-only lesson screen where the user practices speech with Lumi, the AI Tutor. The experience should feel like a real voice call, displaying the lesson details (title, language, XP rewards, vocabulary phrases) dynamically fetched from Supabase, without modifying any database tables.

- **Route:** `app/lesson/[id].tsx` (accessible by tapping a lesson card on the Learn tab).
- **Style Constraint:** Strict adherence to the `DESIGN.md` rules (Deep Indigo canvas, Lumio Coral accent, daylight amber for XP badges, rounded pill buttons, custom typography, safe-area boundary rules).
- **Core Concept:** Audio-only interface. Video calling is disabled/mocked out. Highly interactive simulated speaking states with feedback cards.

---

## 2. Supabase Integration & Data Flow

To load the lesson dynamically, the screen will execute the following read-only queries using the Supabase client:

```typescript
// 1. Fetch the lesson details
const { data: lesson } = await supabase
  .from('lessons')
  .select('*')
  .eq('id', lessonId)
  .single();

// 2. Fetch the target phrases (vocabularies) associated with the lesson
const { data: vocabularies } = await supabase
  .from('vocabularies')
  .select('*')
  .eq('lesson_id', lessonId);

// 3. Fetch the unit details to find the language_id
const { data: unit } = await supabase
  .from('units')
  .select('*')
  .eq('id', lesson.unit_id)
  .single();

// 4. Fetch the language details
const { data: language } = await supabase
  .from('languages')
  .select('*')
  .eq('id', unit.language_id)
  .single();
```

### Component Data Mapping
- **XP Reward:** Displayed in the top-right header badge (fetched from `lessons.xp_reward`).
- **Language name & Flag:** Displayed in the header banner (e.g., `${language.flag} ${language.name}`).
- **Lesson Title:** Displayed in the header banner (`${lesson.title}`).
- **AI Teacher Prompt / Context:** Used to initialize the conversation text in the speech bubble (`lessons.ai_teacher_prompt`).
- **Phrases:** Loaded from `vocabularies` table. Displayed in an interactive list at the bottom for the user to simulate speech selection.

---

## 3. UI & Component Structure

### A. Header Bar
- **Left Control:** Chevron back button (`chevron-back` icon) that invokes `router.back()`.
- **Center Title:** "AI Teacher" display header in `Fredoka` font, with a green blinking dot `• Online`.
- **Right Control Group:**
  - Disabled video camera icon button.
  - Circular XP Badge (colored in Daylight Amber `#FFB74D` with the fetched `xp_reward` number).
  - Silhouette profile icon.

### B. Information Banner
- A rounded pill container styled with a semi-transparent Lavender Mist overlay:
  - Content: `[Language Flag] [Language Name] • Lesson [Order]: [Title]`
  - Font: `Plus Jakarta Sans`, size `13px`, medium weight.

### C. Mascot & Speech Bubble
- **Mascot Presentation:** `images.lumiTutor` centered on the deep indigo background canvas. Includes a soft breathing/pulsing animation loop.
- **Teacher Speech Bubble:** 
  - Placed below the mascot with a speech bubble tail pointing up.
  - Background: Cream `#FFFBF4` with text in Deep Indigo `#241B4A`.
  - Content: Lumi's current speech (initialized using the lesson prompt context, e.g. "Hello! Let's practice greetings in English. Try saying one of the phrases below!").
  - Sound Button: Speaker icon `🔊` on the right side of the bubble. Pressing it triggers a simulated audio playback ring pulse.

### D. Interactive Phrases (Speaking Selector)
- **Title Label:** "TAP TO SPEAK PHRASE" (Micro label in Slate, uppercase, +4% tracking).
- **Phrase Grid:** A scrollable horizontal/grid list of vocabulary cards.
  - Card Style: Rounded squircle shape (`rounded-xl` / `12px`), dark border, subtle ambient shadow.
  - Content: The word (bold, `Plus Jakarta Sans`) and its pronunciation (in Slate).
  - Tap action: Simulates speaking this phrase. Shows a pulsing voice waveform overlay, prints "Listening..." on the session status, and adds the spoken phrase into the conversation.

### E. Call Control Bar
- **Mic Button:** Toggle between active mic (white background, deep indigo icon) and muted (red outline, slashed mic icon).
- **Subtitles Button:** Toggle showing/hiding the native translation of the phrases/Lumi's text in the speech bubble.
- **End Call Button:** A large circular red button (`bg-red-500`) with a phone hang-up icon.

### F. Lesson Feedback Card
- A wide card container (`rounded-3xl`) at the bottom of the screen.
- Layout: 3 columns with vertical separation lines.
  - **Speaking:** Displays "Excellent" (Mint green text `#35D0A0`).
  - **Pronunciation:** Displays "Great" (Daylight Amber or Light Blue text).
  - **Grammar:** Displays "Good" (Lavender Mist or Purple text).

### G. End-of-Call Summary Sheet
- A modal sheet that transitions up from the bottom when "End Call" is tapped.
- Features:
  - Celebration banner with `lumiCelebration` mascot asset.
  - Title: "Lesson Completed!" in `Fredoka` font.
  - Subtitle: "Awesome job practicing your spoken English today."
  - Reward Detail: "+[XP_REWARD] XP Earned" displayed with a daylight amber ember ignition bloom.
  - Feedback input field: Soft text input for the user to leave lesson feedback (e.g. 5-star ratings or thumbs up).
  - Primary CTA Button: "Claim Rewards" (Lumio Coral pill button, returns to the Learn tab and updates progress).

---

## 4. Implementation Steps

1. **Routing Scaffold:** Create `app/lesson/[id].tsx`. Ensure safe-area padding is defined using inline styling on `SafeAreaView`.
2. **Data Integration:** Implement custom hook `useLessonAudioDetails(id)` to load lesson, language, unit, and vocabularies from Supabase.
3. **Simulated Interactions:**
   - Conversation state tracking: `tutorText` state, `userSpokenText` state, `isMuted` state, `showSubtitles` state.
   - Interactive loop: User taps a phrase -> Speech bubble updates to "Listening..." -> User response bubble is added -> Tutor text updates to a response congratulating the user -> Feedback metrics adjust slightly.
4. **Motion & Polish:** Integrate Reanimated springs for buttons and the speech indicator. Use exact colors from the design system (`#241B4A`, `#FF6B57`, `#FFB74D`, `#35D0A0`, `#FFFBF4`).
5. **Testing & Linting:** Verify typescript types, run `npm run lint` and verify build on physical layout simulator.
