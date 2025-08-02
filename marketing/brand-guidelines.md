# KALDRIX Brand Guidelines & Visual Assets

## Brand Identity

### Brand Essence
KALDRIX represents the pinnacle of blockchain security - quantum-resistant technology that protects digital assets against future threats. Our brand is built on innovation, security, and trust.

### Brand Personality
- **Innovative**: Cutting-edge technology and forward-thinking
- **Trustworthy**: Reliable, secure, and professional
- **Intelligent**: Smart, sophisticated, and technically advanced
- **Approachable**: User-friendly despite complex technology
- **Visionary**: Leading the quantum revolution in blockchain

### Brand Voice
- **Tone**: Professional yet approachable, confident but not arrogant
- **Language**: Clear, concise, and educational
- **Messaging**: Focus on security, innovation, and future-readiness
- **Emphasis**: Benefits over features, simplicity over complexity

## Visual Identity

### Logo System

#### Primary Logo
![KALDRIX Primary Logo](assets/logo/kaldrix-logo-primary.png)

**Usage:**
- Main brand identifier
- Website header and footer
- Marketing materials and presentations
- Business cards and stationery
- Mobile app icons

**Specifications:**
- Format: PNG, SVG, EPS
- Minimum size: 32px for digital, 1 inch for print
- Clear space: Equal to height of "K" in logo
- Do not stretch, distort, or modify

#### Secondary Logo
![KALDRIX Secondary Logo](assets/logo/kaldrix-logo-secondary.png)

**Usage:**
- When primary logo doesn't fit
- Vertical layouts
- Social media profiles
- App icons and favicons

#### Logomark
![KALDRIX Logomark](assets/logo/kaldrix-logomark.png)

**Usage:**
- Small spaces and icons
- Social media avatars
- Favicon and app badges
- Pattern backgrounds

#### Wordmark
![KALDRIX Wordmark](assets/logo/kaldrix-wordmark.png)

**Usage:**
- Text-based applications
- Email signatures
- Document headers
- When logo is not appropriate

### Color Palette

#### Primary Colors
```css
/* Deep Purple */
.kaldrix-purple {
    color: #6B46C1; /* Primary brand color */
    background-color: #6B46C1;
}

.kaldrix-purple-light {
    color: #A78BFA; /* Lighter shade */
    background-color: #A78BFA;
}

.kaldrix-purple-dark {
    color: #4C1D95; /* Darker shade */
    background-color: #4C1D95;
}

/* Electric Blue */
.kaldrix-blue {
    color: #3B82F6; /* Secondary brand color */
    background-color: #3B82F6;
}

.kaldrix-blue-light {
    color: #60A5FA; /* Lighter shade */
    background-color: #60A5FA;
}

.kaldrix-blue-dark {
    color: #1E40AF; /* Darker shade */
    background-color: #1E40AF;
}
```

#### Neutral Colors
```css
/* White */
.kaldrix-white {
    color: #FFFFFF;
    background-color: #FFFFFF;
}

/* Light Gray */
.kaldrix-gray-light {
    color: #F3F4F6;
    background-color: #F3F4F6;
}

/* Medium Gray */
.kaldrix-gray {
    color: #9CA3AF;
    background-color: #9CA3AF;
}

/* Dark Gray */
.kaldrix-gray-dark {
    color: #1F2937;
    background-color: #1F2937;
}

/* Black */
.kaldrix-black {
    color: #111827;
    background-color: #111827;
}
```

#### Accent Colors
```css
/* Success Green */
.kaldrix-green {
    color: #10B981;
    background-color: #10B981;
}

/* Warning Yellow */
.kaldrix-yellow {
    color: #F59E0B;
    background-color: #F59E0B;
}

/* Error Red */
.kaldrix-red {
    color: #EF4444;
    background-color: #EF4444;
}

/* Info Cyan */
.kaldrix-cyan {
    color: #06B6D4;
    background-color: #06B6D4;
}
```

#### Color Usage Guidelines
- **Primary Colors**: Use for main branding, CTAs, and important elements
- **Secondary Colors**: Use for supporting elements and backgrounds
- **Neutral Colors**: Use for text, backgrounds, and subtle elements
- **Accent Colors**: Use for status indicators, highlights, and emphasis
- **Accessibility**: Ensure 4.5:1 contrast ratio for text readability

### Typography

#### Primary Typeface: Inter
Inter is a modern, clean sans-serif typeface that conveys innovation and approachability.

```css
/* Import Inter from Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

/* Typography Scale */
.kaldrix-h1 {
    font-family: 'Inter', sans-serif;
    font-size: 3rem;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.02em;
}

.kaldrix-h2 {
    font-family: 'Inter', sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: -0.01em;
}

.kaldrix-h3 {
    font-family: 'Inter', sans-serif;
    font-size: 2rem;
    font-weight: 600;
    line-height: 1.4;
    letter-spacing: 0;
}

.kaldrix-h4 {
    font-family: 'Inter', sans-serif;
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.5;
    letter-spacing: 0;
}

.kaldrix-body-large {
    font-family: 'Inter', sans-serif;
    font-size: 1.125rem;
    font-weight: 400;
    line-height: 1.6;
    letter-spacing: 0;
}

.kaldrix-body {
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.6;
    letter-spacing: 0;
}

.kaldrix-body-small {
    font-family: 'Inter', sans-serif;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.5;
    letter-spacing: 0;
}

.kaldrix-caption {
    font-family: 'Inter', sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.4;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}
```

#### Secondary Typeface: SF Pro Display / Roboto
For platform-specific applications:

```css
/* iOS: SF Pro Display */
.ios-heading {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
}

/* Android: Roboto */
.android-heading {
    font-family: 'Roboto', sans-serif;
}
```

#### Typography Guidelines
- **Headings**: Use bold weights for emphasis and hierarchy
- **Body Text**: Use regular weights for readability
- **Captions**: Use uppercase for emphasis and small text
- **Line Height**: 1.4-1.6 for body text, tighter for headings
- **Letter Spacing**: Minimal for body text, slight tracking for headings

### Iconography

#### Icon Style
- **Style**: Clean, modern, geometric
- **Weight**: Medium to bold for consistency
- **Rounding**: Slightly rounded corners for approachability
- **Detail**: Simplified for clarity at small sizes

#### Icon Categories
- **Core Icons**: Wallet, send, receive, security
- **Feature Icons**: DeFi, NFT, staking, governance
- **Action Icons**: Settings, help, profile, notifications
- **Status Icons**: Success, warning, error, info

#### Icon Usage
- **Size**: 16px, 24px, 32px, 48px, 64px
- **Color**: Primary brand color for active, neutral for inactive
- **Spacing**: Consistent padding and margins
- **Alignment**: Centered within touch targets

### Imagery Style

#### Photography Style
- **Subject**: Technology, innovation, security, future
- **Lighting**: Bright, clean, high-tech
- **Composition**: Clean, minimalist, focused
- **Color Palette**: Cool tones with purple and blue accents
- **People**: Diverse, professional, approachable

#### Illustration Style
- **Type**: Flat design with subtle gradients
- **Complexity**: Simplified, not overly detailed
- **Color**: Brand colors with complementary accents
- **Style**: Modern, geometric, slightly futuristic
- **Usage**: Explainers, diagrams, feature highlights

#### Background Patterns
- **Style**: Subtle, geometric, tech-inspired
- **Complexity**: Low contrast, non-distracting
- **Animation**: Gentle, smooth transitions
- **Usage**: Website backgrounds, app screens, presentations

## Digital Assets

### Website Assets

#### Hero Section
- **Background**: Quantum circuit animation
- **Headline**: "Secure Your Digital Future"
- **Subheadline**: "World's First Quantum-Resistant Blockchain"
- **CTA**: "Download Wallet" / "Learn More"
- **Visual**: Floating 3D logo or device mockups

#### Feature Cards
- **Layout**: 3-column grid on desktop, stacked on mobile
- **Icons**: Custom feature icons
- **Headlines**: Benefit-focused, short
- **Descriptions**: Clear, concise explanations
- **CTAs**: Secondary, subtle

#### Team Section
- **Layout**: Grid with photos and bios
- **Photos**: Professional, consistent style
- **Bios**: Brief, credentials-focused
- **Social Links**: LinkedIn, Twitter, GitHub
- **Background**: Subtle pattern or gradient

### Mobile App Assets

#### App Icons
- **iOS**: 1024x1024 PNG, no transparency
- **Android**: 512x512 PNG with adaptive icon XML
- **Style**: Logomark on solid brand color background
- **Rounding**: Platform-specific corner radius

#### Screenshots
- **iPhone**: 1290x2796 (6.7"), 1284x2778 (6.5"), 1242x2208 (5.5")
- **Android**: Various sizes for different devices
- **Content**: Real app interface, no mockups
- **Frames**: Device-specific frames for App Store/Play Store
- **Annotations**: Callouts for key features

#### Onboarding Screens
- **Style**: Clean, minimal, brand-consistent
- **Illustrations**: Custom illustrations for each step
- **Colors**: Brand colors with white backgrounds
- **Text**: Short, benefit-focused copy
- **Progress**: Clear progress indicators

### Social Media Assets

#### Profile Pictures
- **Square**: 500x500px minimum
- **Style**: Logomark on solid background
- **Platforms**: Consistent across all platforms
- **Recognition**: Clear and recognizable at small sizes

#### Cover Photos
- **Dimensions**: Platform-specific (Twitter: 1500x500, LinkedIn: 1584x396)
- **Style**: Abstract quantum patterns with logo
- **Text**: Minimal, brand-focused
- **Update Frequency**: Seasonal or campaign-specific

#### Post Templates
- **Layout**: Consistent grid system
- **Colors**: Brand colors with complementary accents
- **Typography**: Inter font family
- **Imagery**: Custom illustrations or photography
- **CTAs**: Clear, action-oriented

### Video Assets

#### Explainer Videos
- **Length**: 60-90 seconds
- **Style**: Motion graphics with voiceover
- **Animation**: Smooth, brand-consistent
- **Music**: Modern, tech-inspired, subtle
- **Call to Action**: Clear, time-appropriate

#### Demo Videos
- **Length**: 2-3 minutes
- **Style**: Screen recording with annotations
- **Voiceover**: Professional, clear, enthusiastic
- **Pacing**: Moderate, not rushed
- **Focus**: Key features and benefits

#### Testimonial Videos
- **Length**: 30-60 seconds
- **Style**: Professional interview setup
- **Subjects**: Diverse, authentic users
- **Subtitles**: Always include for accessibility
- **B-roll**: Relevant product footage

## Print Assets

### Business Cards
- **Size**: 3.5" x 2" standard
- **Stock**: 16pt premium cardstock
- **Finish**: Matte or soft-touch laminate
- **Front**: Logo, name, title
- **Back**: Contact info, QR code

### Brochures
- **Size**: Letter fold (8.5" x 11")
- **Pages**: 4-6 pages
- **Paper**: 100lb gloss text
- **Finish**: Aqueous coating
- **Content**: Benefits, features, use cases

### Presentation Templates
- **Slides**: 16:9 aspect ratio
- **Master**: Title, content, divider slides
- **Colors**: Brand colors with white backgrounds
- **Typography**: Inter font family
- **Graphics**: Custom illustrations and charts

### Event Banners
- **Size**: Various (trade show specific)
- **Material**: Vinyl or fabric
- **Design**: Large logo, website, QR code
- **Colors**: High contrast for visibility
- **Hardware**: Professional banner stands

## Asset Specifications

### File Formats
- **Vector**: SVG, EPS, AI (for logos and illustrations)
- **Raster**: PNG, JPG (for photos and screenshots)
- **Video**: MP4, MOV (H.264 codec)
- **Documents**: PDF, DOCX (for print and text)

### Resolution Guidelines
- **Print**: 300 DPI minimum
- **Digital**: 72 DPI (standard), 144 DPI (retina)
- **Video**: 1080p minimum, 4K for hero content
- **Social Media**: Platform-specific requirements

### Color Profiles
- **Digital**: sRGB for web, P3 for video
- **Print**: CMYK for process printing
- **Consistency**: Use color swatches for accuracy

### Naming Conventions
- **Format**: kaldrix-[asset-type]-[description]-[size].[extension]
- **Examples**: 
  - kaldrix-logo-primary-512px.png
  - kaldrix-screenshot-wallet-iphone-14.png
  - kaldrix-video-explainer-60sec.mp4
- **Organization**: Folder structure by asset type

## Usage Guidelines

### Logo Usage
- **Do**: Use on solid white or dark backgrounds
- **Do**: Maintain clear space around logo
- **Do**: Use appropriate size for context
- **Don't**: Stretch, distort, or modify
- **Don't**: Use in cluttered environments
- **Don't**: Change colors or add effects

### Color Usage
- **Primary**: Use for main branding elements
- **Secondary**: Use for supporting elements
- **Accent**: Use sparingly for emphasis
- **Neutral**: Use for text and backgrounds
- **Accessibility**: Always check contrast ratios

### Typography Usage
- **Hierarchy**: Use consistent heading structure
- **Readability**: Ensure adequate contrast and size
- **Consistency**: Use same fonts across all materials
- **Emphasis**: Use weight and size, not just color
- **Alignment**: Left-align for readability

### Imagery Usage
- **Relevance**: Ensure images support the message
- **Quality**: Use high-resolution, professional images
- **Diversity**: Include diverse subjects and perspectives
- **Authenticity**: Avoid stock photos when possible
- **Brand**: Apply consistent treatment and filters

## Asset Delivery

### Package Structure
```
kaldrix-brand-assets/
├── logo/
│   ├── kaldrix-logo-primary.svg
│   ├── kaldrix-logo-primary.png
│   ├── kaldrix-logo-secondary.svg
│   └── kaldrix-logomark.svg
├── color/
│   ├── kaldrix-color-palette.pdf
│   └── kaldrix-color-swatches.ase
├── typography/
│   ├── inter-fonts/
│   └── typography-specs.pdf
├── icons/
│   ├── svg/
│   └── png/
├── imagery/
│   ├── photography/
│   ├── illustrations/
│   └── backgrounds/
├── digital/
│   ├── website/
│   ├── mobile-app/
│   └── social-media/
├── print/
│   ├── business-cards/
│   ├── brochures/
│   └── presentations/
└── video/
    ├── explainers/
    ├── demos/
    └── testimonials/
```

### Version Control
- **Major Updates**: Full brand refresh (every 2-3 years)
- **Minor Updates**: Color or typography tweaks (annually)
- **Asset Updates**: New photography or illustrations (quarterly)
- **Archive**: Keep previous versions for reference

### Distribution
- **Internal**: Shared drive or brand management system
- **External**: Brand portal or asset delivery system
- **Partners**: Secure access for approved partners
- **Agency**: Full package with guidelines

---

This comprehensive brand guide ensures consistency across all KALDRIX touchpoints while providing the flexibility needed for various applications and contexts. All assets should be used in accordance with these guidelines to maintain brand integrity and recognition.