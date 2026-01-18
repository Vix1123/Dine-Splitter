# Dine Split - Design Guidelines

## 1. Brand Identity

**Purpose**: Dine Split eliminates the awkward math and social friction of splitting restaurant bills. It's a trustworthy companion for group dining.

**Aesthetic Direction**: Friendly utility with editorial clarity. Think: clean receipts meet colorful sticky notes. The interface feels organized and reliable, with personality injected through the color-coded person system.

**Memorable Element**: The rainbow of person chips that visually track who owes what - playful organization that makes splitting feel less like accounting and more like collaboration.

## 2. Navigation Architecture

**Root Navigation**: Stack-only (single-purpose utility app)

**Screen Flow**:
1. **Main Split Screen** - Core experience where all splitting happens
2. **Summary Sheet** - Native bottom sheet showing per-person breakdown
3. **Tip Adjustment Sheet** - Native modal for custom tip entry
4. **Settings Screen** - Dark mode toggle, about info

## 3. Screen-by-Screen Specifications

### Main Split Screen
**Purpose**: Capture receipt, assign items to people, calculate splits

**Layout**:
- Header: Transparent custom header
  - Left: Settings icon button
  - Center: "Dine Split" wordmark with fork icon
  - Right: Share button (disabled until bill is fully allocated)
- Top inset: headerHeight + Spacing.xl
- Bottom inset: Spacing.xl (no tab bar)

**Main Content** (scrollable):
1. **Receipt Section**:
   - If no receipt: Large dashed border rectangle with camera icon, "Tap to scan receipt" text, "or upload from gallery" secondary text
   - If receipt uploaded: Thumbnail (80px height) with retake button, detected currency badge, total amount display
   
2. **People Section**:
   - "Add Person" button (orange #FF6B35, full-width, rounded)
   - Person chips row (horizontal scroll if >4 people): Name with color dot, tap to filter. Each chip is tappable toggle.
   - Person colors (in order): #FF6B6B, #4ECDC4, #FFE66D, #A8DADC, #F4A261, #C77DFF, #06FFA5, #E76F51

3. **Items List**:
   - Each item row: Description (bold), price, quantity indicator
   - If quantity=1: Checkbox (round)
   - If quantity>1: Stepper with -/+ buttons and number
   - If partially assigned: Show "2/3 allocated" in gray
   - If fully assigned: Show colored border matching person's color, hide checkbox/stepper
   - Empty state: "Scan a receipt to get started" with receipt illustration

4. **Summary Card** (collapsible):
   - Header: "Summary" with chevron, Bill Total, Allocated, Outstanding
   - Outstanding amount: Orange if >0, green if 0
   - Expanded: Per-person breakdown with name, color dot, items list, subtotal, tip, total

**Floating Elements**:
- Bottom-center: "Assign X items" button (green #35A853, elevated shadow)
  - Only visible when items selected
  - If no people added: Disabled state showing "Add people above to assign items"
  - Tapping opens assignment dialog

**Assignment Dialog** (native bottom sheet):
- Grid of person cards, tap to assign selected items
- Each card: Person name, color dot, current total

### Settings Screen
**Purpose**: App preferences

**Layout**:
- Header: Standard with back button, "Settings" title
- Content (scrollable list):
  - Dark Mode toggle row
  - About section: Version, Privacy Policy, Terms of Service (placeholder links)

## 4. Color Palette

**Primary**: 
- Green: #35A853 (main actions, assigned items borders)
- Orange: #FF6B35 (add person, warnings)

**Semantic**:
- Error: #DC2626
- Warning: #F59E0B (total mismatch alerts)
- Success: #10B981

**Background** (light mode):
- Primary: #FFFFFF
- Secondary: #F9FAFB
- Surface: #FFFFFF with subtle shadow

**Background** (dark mode):
- Primary: #111827
- Secondary: #1F2937
- Surface: #374151

**Text** (light mode):
- Primary: #111827
- Secondary: #6B7280
- Tertiary: #9CA3AF

**Text** (dark mode):
- Primary: #F9FAFB
- Secondary: #D1D5DB
- Tertiary: #9CA3AF

## 5. Typography

**Font**: System font (SF Pro for iOS, Roboto for Android)

**Type Scale**:
- Title: 28pt, Bold
- Headline: 20pt, Semibold
- Body: 16pt, Regular
- Caption: 14pt, Regular
- Small: 12pt, Regular

**Hierarchy**:
- Receipt total: Headline
- Item descriptions: Body, Semibold
- Prices: Body, Regular
- Person names: Caption, Medium
- Allocation indicators: Small, Regular

## 6. Assets to Generate

**icon.png** - App icon: Stylized fork overlapping a receipt, green (#35A853) on white background

**splash-icon.png** - Splash screen: Same fork icon, centered

**empty-receipt.png** - Empty state illustration for items list: Minimal line drawing of a folded receipt with sparkles, light gray, used when no receipt scanned

**receipt-error.png** - Error state: Receipt with question mark, used when OCR fails or image quality too low

**fork-logo.svg** - Header wordmark icon: Simple fork silhouette (12pt height), placed left of "Dine Split" text

**share-success.png** - Success illustration: Checkmark with confetti, shown in share confirmation toast

## 7. Interaction Patterns

- All buttons: Scale down to 0.95 on press
- Person chips: Highlight with 2px colored border when filtering active
- Item rows: Subtle gray background on press
- Assignment dialog: Slide up from bottom with spring animation
- Summary card: Rotate chevron 180° when expanding/collapsing
- Floating assign button: Slide up from bottom when items selected, slide down when cleared

## 8. Quality Indicators

**Total Mismatch Warning**: If sum of item prices differs from receipt total by >5%, show orange banner below receipt section: "Total doesn't match items. Try a clearer photo."

**Image Quality Error**: If OCR fails, show error state illustration with "Can't read receipt. Try better lighting or flatter angle."

**Reconciliation Status**: Summary card header background changes from orange (outstanding >0) to green (everything assigned).