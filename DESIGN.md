---
name: Lumi Learning System
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf0'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9ff'
  surface-container-highest: '#d8e3f9'
  on-surface: '#111c2c'
  on-surface-variant: '#424753'
  inverse-surface: '#263141'
  inverse-on-surface: '#ebf1ff'
  outline: '#727785'
  outline-variant: '#c2c6d6'
  surface-tint: '#005ac2'
  primary: '#004fac'
  on-primary: '#ffffff'
  primary-container: '#1267d6'
  on-primary-container: '#e7ecff'
  inverse-primary: '#adc6ff'
  secondary: '#516600'
  on-secondary: '#ffffff'
  secondary-container: '#c3f01f'
  on-secondary-container: '#556b00'
  tertiary: '#725c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#cba81b'
  on-tertiary-container: '#4d3e00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004494'
  secondary-fixed: '#c6f323'
  secondary-fixed-dim: '#acd600'
  on-secondary-fixed: '#161e00'
  on-secondary-fixed-variant: '#3c4d00'
  tertiary-fixed: '#ffe07e'
  tertiary-fixed-dim: '#e9c339'
  on-tertiary-fixed: '#231b00'
  on-tertiary-fixed-variant: '#564500'
  background: '#f9f9ff'
  on-background: '#111c2c'
  surface-variant: '#d8e3f9'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  huge: 40px
  giant: 48px
---

## Brand & Style
The design system is built to facilitate a fun, energetic, and highly accessible learning environment for Libras (Brazilian Sign Language). It targets a broad audience—from children to young adults—by utilizing a **Gamified Modern** aesthetic.

The visual narrative is driven by Lumi, the macaque mascot, whose vibrant blue and yellow tones set the energy of the interface. The style leverages 2D vector illustrations, thick strokes, and high-contrast surfaces to create a "toy-like" feel that reduces the cognitive load of learning a new language. The interface should feel bouncy, responsive, and encouraging, evoking feelings of accomplishment and friendliness.

## Colors
This design system utilizes a high-vibrancy palette designed for legibility and emotional engagement. 

- **Primary Blue (#1267D6)**: Used for core branding, primary actions, and navigational headers.
- **Lime Green (#B7E300)**: Reserved for "Correct" states and high-energy gamification elements (XP bars, level-ups).
- **Yellow (#FFD84D)**: Used for highlights, achievements, and currency (coins/stars).
- **Dark Blue (#0B2D5C)**: Used for deep shadows and high-contrast emphasis on primary buttons to create depth.
- **Semantic Palette**: Clear distinction between success (Green), error (Red), and warning (Orange) to ensure the learning feedback loop is immediate and non-ambiguous.

## Typography
The typography strategy prioritizes approachability and clarity. 

**Plus Jakarta Sans** is the display face, chosen for its friendly, rounded terminals that mirror the soft curves of the mascot. It is used for headlines and titles to provide a strong, modern "voice."

**Work Sans** serves as the functional workhorse. It offers exceptional legibility at small sizes for exercise instructions and feedback text. Weight is used strategically to differentiate between interactive labels and static informational text. For mobile devices, Display and Headline-LG sizes scale down by 20% to prevent overflow.

## Layout & Spacing
The spacing rhythm follows a strict **4px baseline grid**, ensuring mathematical harmony across all components.

- **Mobile First**: Uses a fluid grid with 16px side margins and 12px gutters.
- **Tablet/Desktop**: Transitions to a fixed 12-column grid (max-width 1140px) with 24px gutters.
- **Rhythm**: Elements are grouped using tight spacing (4px-8px), while distinct sections are separated by larger gaps (24px-48px) to provide "breathing room" for Lumi and other illustrations.

## Elevation & Depth
Depth in this design system is achieved through **Tactile Layering** rather than realistic lighting.

- **Interactive Elevation**: Buttons use a hard-edged, 4px bottom border (shadow) in a darker shade of the base color to create a "pressable" 3D effect.
- **Surface Elevation**: Cards and containers use a soft, low-opacity ambient shadow (Alpha 8%) to lift content off the background without feeling heavy.
- **Z-Index Layering**: The mascot (Lumi) often breaks the "container" bounds, sitting on the highest Z-index to create a sense of presence and companionship.

## Shapes
The shape language is consistently rounded to maintain the friendly brand personality. Sharp corners are avoided to prevent the UI from feeling "clinical."

- **Small (8px)**: Used for small input fields and nested chips.
- **Medium (12px)**: The standard for cards and content containers.
- **Large (20px)**: Used for major UI sections and modal sheets.
- **Button (16px)**: Specific radius that balances the roundedness of the typography while maintaining a sturdy click target.

## Components

### Buttons
Primary buttons feature a "3D Click" effect. They have a solid background color and a 4px darker bottom border. When pressed, the button translates down by 2px, giving the user physical satisfaction in the gamified loop.

### Chips & Tags
Used for selecting sign categories or tagging lesson difficulty. These use a light tint of the primary color with a slightly darker stroke.

### Progress Bars
Progress bars are thick (12px height) with fully rounded ends. The track is a light neutral, while the progress fill is the vibrant Lime Green, often featuring a subtle diagonal stripe pattern for texture.

### Exercise Cards
Cards used for Libras video/GIF content must have the 12px radius and a soft shadow. The video player container inside should have an 8px radius to create a nested hierarchy.

### Input Fields
Standard inputs use a 2px stroke in the neutral gray, which thickens and turns Primary Blue upon focus. Feedback for wrong answers should immediately tint the stroke and background of the input to the Error Red.