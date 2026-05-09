# Kraft Academy

**Kraft Academy** is a student-focused EdTech website built to help school students learn practical AI and coding skills in a structured, accessible, and outcome-oriented way.

The platform is designed for students aged **11–18** and is positioned around one clear idea:

> Help students use AI the right way for school, projects, productivity, and future-ready skills.

The website acts as the primary digital touchpoint for parents and students. It explains the academy, showcases the learning programs, captures leads, supports demo/workshop booking, and guides interested users toward payment and enrollment.

---

## Live Website

**Production:** [kraft-academy.vercel.app](https://kraft-academy.vercel.app)

---

## Repository

GitHub: [connectsumitp/Kraft.Academy](https://github.com/connectsumitp/Kraft.Academy)

---

## Project Overview

Kraft Academy is not just a static landing page. It is an early-stage EdTech funnel built around:

- Parent education
- Student interest generation
- AI and coding program positioning
- Workshop booking
- Demo booking
- Program enrollment
- Payment readiness
- Lead capture
- International student support
- Future CRM and automation readiness

The site is built as a conversion-focused React/Vite web app and includes frontend flows, dynamic forms, country-aware timing logic, payment checkout support, Apps Script integration, and serverless API routes for payment and availability handling.

---

## Problem Statement

Students today are already exposed to AI tools, but most do not know how to use them responsibly or effectively.

Common gaps Kraft Academy addresses:

- Students use AI randomly without structured guidance.
- Parents are unsure whether AI is a distraction, shortcut, or real learning advantage.
- AI and coding are often taught separately, instead of being connected to school outcomes.
- Students need practical workflows for homework, revision, note-making, projects, and exam preparation.
- Schools often provide theoretical computer education, while students need hands-on exposure.
- Parents want future-ready skills but need trust, clarity, and a simple next step.

Kraft Academy positions AI as a **study companion, productivity tool, creativity enabler, and future skill**, not as a cheating shortcut.

---

## Target Audience

### 1. Parents

Parents are the primary decision-makers.

They care about:

- Academic usefulness
- Safety and responsible AI usage
- Whether the course helps in school work
- Practical learning outcomes
- Time commitment
- Pricing and demo availability
- Instructor credibility
- Batch size and guidance quality

The website uses parent-friendly language rather than overly technical AI jargon.

### 2. Students

Students are the end users.

They are interested in:

- Study hacks
- Homework support
- Notes and summaries
- Quiz generation
- Exam preparation
- Creative projects
- Coding confidence
- AI tools that make learning easier and more fun

The product copy connects AI learning with real student use cases.

---

## Core Value Proposition

Kraft Academy helps students become confident, responsible, and future-ready by teaching them how to use AI and coding tools for academics, creativity, productivity, and real-world problem solving.

Simple promise:

> Learn AI and coding in a practical way that improves academic productivity and prepares students for the future.

---

## Programs Offered

### AI Future Skills

A structured program for students who want to go deeper into AI foundations, productivity workflows, and project-based application.

Topics include:

- AI fundamentals
- Prompt thinking
- Productivity tools
- AI for school work
- AI for exams
- Smart revision workflows
- Live projects
- Responsible AI usage
- AI vs cheating
- Future careers with AI

Program positioning from the website:

- Ages 11–18
- 4-week structure
- Guided live sessions
- Academic and project-based application

### Coding Bootcamp

A coding-focused learning track for students who want to build programming fundamentals and logical thinking.

Topics include:

- Coding fundamentals
- Logical thinking
- Mini projects
- Problem solving
- Web development basics
- Competitive mindset

Program positioning from the website:

- Ages 11–18
- 2-month structure
- Beginner-friendly approach
- Mini project-based learning

### AI Demo + Study Skills Workshop

A live workshop route designed as a fast first step for interested parents and students.

The current site positions this as:

- Live AI learning for ages 11–18
- India group workshops
- Friday, Saturday, and Sunday availability
- 15 seats per slot
- ₹99 group workshop price
- Email confirmation after payment
- Session link sent after payment

---

## Funnel Strategy

The website follows a demo/workshop-first conversion funnel.

```text
Discovery
→ Awareness
→ Interest
→ Trust Building
→ Workshop/Demo Booking
→ Checkout
→ Confirmation
→ Enrollment / Follow-up
```

### Step 1: Discovery

Users may discover the site through:

- WhatsApp sharing
- Social media campaigns
- Parent referrals
- School outreach
- Direct website link
- Paid lead campaigns

### Step 2: Awareness

The hero section quickly explains:

- What Kraft Academy is
- Who it is for
- Why AI and coding matter
- What students will learn

### Step 3: Interest

Users explore:

- Program cards
- AI Future Skills
- Coding Bootcamp
- Workshop details
- Parent trust points
- FAQs

### Step 4: Action

The site pushes users toward:

- Reserving a ₹99 workshop seat
- Booking a 1:1/global demo
- Registering for AI Future Skills
- Continuing to checkout

### Step 5: Conversion

Users complete:

- Lead form
- Timing selection
- Payment through Razorpay or PayPal
- Confirmation flow

---

## Key Features

### 1. Hero Section

The Hero section communicates the core pitch:

> Help your child use AI the right way for school, projects, and future-ready skills.

It includes:

- Workshop CTA
- Demo booking CTA
- AI Future Skills program CTA
- Trust chips
- Age group
- Workshop days
- Workshop price
- Live learning positioning

---

### 2. India Group Workshop Booking

The Hero component includes a group workshop booking flow for Indian users.

Features:

- Student name input
- Parent email input
- Indian phone number validation
- Workshop slots grouped by day
- Seat count display
- Closed/full slot handling
- Local storage handoff to checkout
- Lead capture via Google Apps Script
- Scroll-to-checkout behavior after slot selection

Workshop flow:

```text
Enter name/email/contact
→ Select group workshop slot
→ Save slot data
→ Continue to ₹99 checkout
→ Pay through Razorpay or PayPal
→ Receive confirmation
```

---

### 3. 1:1 / Global Demo Booking

The `WorkshopLeadForm` component supports preferred timing booking for India and international students.

Features:

- Expandable booking form
- Name, email, age, contact fields
- Phone-country inference
- Geo-location fallback
- Preferred date selection
- Country-aware timing options
- Availability blocking
- Local storage checkout snapshot
- Google Apps Script lead submission
- Checkout handoff

This route is useful when:

- A parent wants custom timing
- The student is outside India
- A 1:1 demo is preferred over a group workshop

---

### 4. Program Enrollment Booking

The `LeadForm` component supports structured program enrollment.

Features:

- Student details collection
- Contact number validation
- Country detection
- Program selection
- Weekend timing selection
- Google Apps Script lead capture
- Checkout snapshot creation
- Scroll-to-payment handoff

Current programs:

- AI Future Skills
- Coding Bootcamp

---

### 5. Country-Aware Timing

The project includes timing utilities that adapt booking slots based on the user’s country/contact number.

This supports:

- India users
- Global users
- Preferred timing
- Program timing
- Workshop timing
- Date-based availability filtering
- Blocked slots

This makes the site more scalable for international cohorts.

---

### 6. Seat Availability

The app includes workshop seat tracking logic through:

- `src/lib/workshopSeats.js`
- `api/availability.js`
- Apps Script support
- Slot key based seat updates
- Frontend seat display
- Seat confirmation after payment

This allows group workshops to show limited seats and avoid overbooking.

---

### 7. Payment Integration

The project includes payment flows for both Indian and global users.

Supported gateways:

- Razorpay
- PayPal

Payment-related files include:

```text
api/razorpay-order.js
api/paypal-order.js
api/paypal-capture.js
apps-script/razorpay.gs
```

Razorpay is primarily used for Indian payments.

PayPal is available for global payments.

The checkout flow supports:

- Workshop payment
- Program payment
- Currency handling
- Razorpay order creation
- PayPal order creation
- PayPal capture
- Payment success state
- Confirmation email trigger
- Workshop seat confirmation

---

### 8. Pricing Section

The `PricingSection` component manages:

- Workshop pricing
- Program pricing
- India/global region logic
- Currency conversion
- Razorpay checkout
- PayPal checkout
- Checkout locked/unlocked state
- Payment success messaging
- Confirmation email trigger

Pricing can be configured through environment variables.

---

### 9. Lead Capture

The project supports lead capture through Google Apps Script.

Lead data may include:

- Student name
- Parent email
- Contact number
- Age
- Country
- Date
- Timing
- Program
- Lead type
- Source
- Payment status
- Created timestamp

Lead types include:

- `workshop_group`
- `workshop_preferred`
- `program`

This makes the site compatible with a Google Sheets based lightweight CRM.

---

### 10. Confirmation and Thank You Flow

The project includes a `ThankYouSection` component and payment success handling.

After payment success, the app can:

- Update URL hash
- Show thank-you state
- Trigger confirmation email
- Confirm workshop seat
- Display next steps

---

### 11. FAQ Section

The site includes parent-friendly FAQs covering:

- Who can join
- Prerequisites
- Recording/course content
- Workshop language
- AI session benefits
- Academic relevance

This helps reduce hesitation and improve conversion.

---

### 12. Instructor Trust Section

The site highlights instructor credibility:

- Sumit Pandey
- Product Manager
- Industrial experience
- AI instructor positioning
- Practical learning focus

It also includes:

- LinkedIn link
- Contact number
- WhatsApp connection

---

## Product Thinking

This project was designed with a product-led approach rather than only a visual landing page approach.

### Demo-first conversion

Parents may hesitate to pay for a full program immediately. A low-friction workshop/demo helps build trust.

### Parent-centric messaging

The copy explains outcomes in terms of:

- Academic support
- Confidence
- Responsible AI usage
- Future readiness
- Guided learning

### Simple funnel

The site avoids unnecessary complexity:

```text
Landing Page
→ Understand Program
→ Book Workshop/Demo
→ Pay
→ Confirmation
```

### Trust over hype

AI is not positioned as magic. It is positioned as a practical learning tool.

### Academic relevance

AI learning is connected to real student tasks:

- Notes
- Summaries
- Quizzes
- Homework
- Revision
- Projects
- Study planning

### Mobile-first conversion

Parents and students are likely to discover the site through WhatsApp, social media, or mobile browsing. The layout is designed to work well on smaller screens.

---

## Tech Stack

### Frontend

- React 19
- Vite 7
- JavaScript
- Tailwind CSS
- React Phone Number Input

### Backend / Serverless

- Vercel Serverless Functions
- Google Apps Script
- Razorpay API
- PayPal API

### Tooling

- ESLint
- PostCSS
- Autoprefixer
- Git
- GitHub
- Vercel

---

## Dependencies

Main dependencies from `package.json`:

```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-phone-number-input": "^3.4.16"
}
```

Development dependencies include:

```json
{
  "@vitejs/plugin-react": "^5.1.1",
  "tailwindcss": "^3.4.17",
  "vite": "^7.3.1",
  "eslint": "^9.39.1",
  "postcss": "^8.5.8",
  "autoprefixer": "^10.4.27"
}
```

---

## Repository Structure

```text
Kraft.Academy/
├── .github/
│   └── workflows/
├── .postman/
├── api/
│   ├── availability.js
│   ├── paypal-capture.js
│   ├── paypal-order.js
│   └── razorpay-order.js
├── apps-script/
│   ├── README.md
│   ├── razorpay.gs
│   └── workshop-seats.gs
├── postman/
│   └── globals/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── BrandName.jsx
│   │   ├── CountdownBar.jsx
│   │   ├── Header.jsx
│   │   ├── Hero.jsx
│   │   ├── LeadForm.jsx
│   │   ├── PricingSection.jsx
│   │   ├── ProgramCard.jsx
│   │   ├── ThankYouSection.jsx
│   │   ├── WorkshopLeadForm.jsx
│   │   └── countryTiming.js
│   ├── config/
│   │   └── availabilityOverrides.js
│   ├── lib/
│   │   ├── availability.js
│   │   ├── checkoutSnapshot.js
│   │   ├── phoneCountry.js
│   │   └── workshopSeats.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .gitignore
├── README_Kraft_Academy.md
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

---

## Component Overview

### `App.jsx`

Main application shell.

Responsibilities:

- Imports the main page sections
- Defines program data
- Defines trust items
- Defines FAQ content
- Handles cursor visual effect
- Handles reveal-on-scroll animation
- Renders the complete landing page

### `Header.jsx`

Navigation/header component.

Likely handles:

- Brand identity
- Top navigation
- CTA access
- Page section navigation

### `Hero.jsx`

Main landing and workshop booking section.

Responsibilities:

- Hero copy
- Workshop booking inputs
- Group slot display
- Seat status display
- Slot selection
- Local storage handoff
- Checkout focus events
- Apps Script lead capture

### `ProgramCard.jsx`

Reusable card component for program display.

Used for:

- AI Future Skills
- Coding Bootcamp

### `LeadForm.jsx`

Program enrollment booking form.

Responsibilities:

- Collect student details
- Validate contact number
- Detect country
- Show timing options
- Save checkout data
- Submit lead data
- Continue to payment

### `WorkshopLeadForm.jsx`

1:1/global demo booking form.

Responsibilities:

- Collect preferred timing details
- Infer country from phone
- Fetch availability
- Show available dates/times
- Save checkout snapshot
- Submit preferred demo lead
- Continue to checkout

### `PricingSection.jsx`

Checkout and payment management component.

Responsibilities:

- Show workshop/program pricing
- Handle Razorpay checkout
- Handle PayPal checkout
- Handle checkout lock/unlock state
- Trigger confirmation workflows
- Confirm workshop seats
- Show payment status

### `CountdownBar.jsx`

Urgency / limited-time style component.

Useful for:

- Workshop urgency
- Batch countdown
- Campaign urgency

### `BrandName.jsx`

Reusable brand rendering component.

### `ThankYouSection.jsx`

Post-payment or post-booking confirmation component.

---

## Environment Variables

The project uses frontend and server-side environment variables.

Create a `.env` file locally and add the values needed for your flow.

### Frontend Variables

```env
VITE_GOOGLE_SCRIPT_URL=
VITE_GEOIP_URL=
VITE_AVAILABILITY_SCRIPT_URL=

VITE_WORKSHOP_GROUP_INR=99
VITE_WORKSHOP_11_INDIA_INR=499
VITE_WORKSHOP_GLOBAL_INR=1000

VITE_PROGRAM_AMOUNT_INR=
VITE_PROGRAM_GLOBAL_INR=

VITE_RAZORPAY_ORDER_SCRIPT_URL=
VITE_RAZORPAY_EMAIL_SCRIPT_URL=
```

### Server-side Variables for Vercel Functions

```env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
```

### Notes

- `VITE_` variables are exposed to the frontend by Vite.
- Razorpay and PayPal secrets should only be stored as server-side environment variables in Vercel.
- Do not expose payment secrets in frontend code.
- If using Apps Script for Razorpay order creation, `VITE_RAZORPAY_ORDER_SCRIPT_URL` can point to the Apps Script Web App URL.
- If using Vercel serverless API routes, checkout can use `/api/razorpay-order`.

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/connectsumitp/Kraft.Academy.git
cd Kraft.Academy
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment file

Create a `.env` file in the project root.

Minimum for local frontend testing:

```env
VITE_WORKSHOP_GROUP_INR=99
VITE_WORKSHOP_11_INDIA_INR=499
VITE_WORKSHOP_GLOBAL_INR=1000
```

For lead capture and checkout, add the full environment variables listed above.

### 4. Start development server

```bash
npm run dev
```

The app should run on:

```text
http://localhost:5173
```

### 5. Build for production

```bash
npm run build
```

### 6. Preview production build

```bash
npm run preview
```

---

## Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Starts Vite development server |
| `npm run build` | Builds production bundle |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs ESLint checks |

---

## Payment Flow

### Razorpay Flow

```text
User fills booking/enrollment form
→ App stores checkout snapshot
→ User reaches checkout section
→ Frontend calls Razorpay order endpoint
→ Server/API creates Razorpay order
→ Razorpay checkout opens
→ Payment succeeds
→ Success handler runs
→ Confirmation email trigger runs
→ Workshop seat confirmation runs if applicable
→ Thank-you section is shown
```

### PayPal Flow

```text
User fills booking/enrollment form
→ App stores checkout snapshot
→ Frontend calls PayPal order endpoint
→ User is redirected to PayPal approval URL
→ User approves payment
→ User returns to site with PayPal token
→ App calls PayPal capture endpoint
→ Payment is verified
→ Thank-you flow runs
```

---

## Google Apps Script Integration

The repository includes an `apps-script/` folder for backend automation.

### Apps Script files

```text
apps-script/
├── README.md
├── razorpay.gs
└── workshop-seats.gs
```

Apps Script can be used for:

- Razorpay order creation
- Workshop seat tracking
- Google Sheets lead capture
- Confirmation email logic
- Availability management

The `apps-script/README.md` explains how to deploy the Apps Script as a Web App and add Script Properties such as:

```text
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
```

---

## Availability and Seat Logic

The app supports availability and seat management through:

- `src/lib/availability.js`
- `src/lib/workshopSeats.js`
- `src/config/availabilityOverrides.js`
- `api/availability.js`
- `apps-script/workshop-seats.gs`

This supports:

- Fetching available slots
- Blocking unavailable dates/times
- Showing seats left
- Preventing selection of full or closed slots
- Confirming seats after successful payment

---

## Lead Data Model

Lead data sent through the form may include:

| Field | Meaning |
|---|---|
| `name` | Student name |
| `contact` | Parent/student contact number |
| `email` | Parent email |
| `age` | Student age |
| `country` | Country inferred from phone/user |
| `date` | Selected demo date |
| `timing` | Selected timing |
| `program` | Selected program |
| `lead_type` | Workshop/program lead type |
| `source` | Source identifier |
| `created_at` | Timestamp |
| `payment_status` | Payment state placeholder |

Lead types used in the app:

```text
workshop_group
workshop_preferred
program
```

---

## UX and Design Philosophy

The website is designed to feel:

- Modern
- Trustworthy
- Student-friendly
- Parent-friendly
- Bright but credible
- Mobile-first
- Conversion-focused

Design choices include:

- Strong hero section
- Clear CTAs
- Rounded cards
- Live batch positioning
- Trust points
- FAQ section
- Visible instructor credibility
- Smooth scroll-to-checkout behavior
- Reveal-on-scroll animation
- Micro-interactions for checkout focus

---

## Business Goals

Kraft Academy supports the following business goals:

### 1. Lead Generation

Capture interest from parents and students through demo/workshop forms.

### 2. Paid Workshop Conversion

Convert interested parents into ₹99 workshop attendees.

### 3. Program Enrollment

Move workshop/demo attendees toward structured AI Future Skills or Coding Bootcamp programs.

### 4. Market Validation

Test demand for AI and coding education among school students.

### 5. Global Expansion

Support international users through country-aware timing and PayPal checkout.

### 6. Funnel Automation

Create a scalable funnel connected to Google Sheets, email, payments, and future CRM workflows.

---

## Product Metrics to Track

Recommended metrics:

| Funnel Stage | Metric |
|---|---|
| Awareness | Page visits |
| Interest | Program section scroll depth |
| Intent | CTA clicks |
| Lead | Form starts |
| Lead Quality | Completed form submissions |
| Booking | Slot selections |
| Payment | Checkout starts |
| Conversion | Successful payments |
| Retention | Demo-to-program conversion |
| Revenue | Workshop/program revenue |
| Growth | Source-wise lead volume |

---

## Suggested Analytics Events

Future analytics can track:

```text
hero_cta_click
workshop_form_started
workshop_slot_selected
preferred_demo_form_started
program_form_started
checkout_unlocked
razorpay_checkout_started
paypal_checkout_started
payment_success
payment_failed
thank_you_viewed
whatsapp_click
linkedin_click
```

---

## Deployment

The project is deployed on Vercel.

Recommended deployment flow:

```text
Push code to GitHub
→ Vercel detects changes
→ Vercel installs dependencies
→ Vercel runs npm run build
→ Vercel deploys production build
```

### Vercel Build Settings

| Setting | Value |
|---|---|
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### Vercel Environment Variables

Add required variables under:

```text
Vercel Project → Settings → Environment Variables
```

Add frontend `VITE_` variables and server-side Razorpay/PayPal secrets separately.

---

## Security Notes

- Never expose Razorpay key secret in frontend code.
- Never expose PayPal client secret in frontend code.
- Store payment secrets only in Vercel server-side environment variables or Apps Script properties.
- Validate payment status server-side before treating enrollment as confirmed.
- Apps Script Web App URLs should be treated carefully.
- Avoid committing `.env` files.
- If using Google Sheets as CRM, avoid storing unnecessary sensitive data.

---

## Known Implementation Notes

- The site uses localStorage to pass booking details into checkout.
- Custom browser events are used to coordinate form and checkout sections.
- The app includes logic for India and global routing.
- The app supports both group workshop and preferred 1:1/global demo booking flows.
- Program pricing can be controlled through environment variables.
- Availability can be controlled through Apps Script/config-based overrides.
- Payment confirmation email failures are currently handled softly and do not necessarily block the success UI.

---

## Future Improvements

### Product

- Add separate program detail pages
- Add testimonials from parents/students
- Add student project gallery
- Add school partnership page
- Add blog section for AI study tips
- Add downloadable curriculum PDF
- Add parent FAQ expansion
- Add cohort calendar
- Add scholarship/referral system

### Funnel

- Add source tracking with UTM parameters
- Add CRM integration
- Add WhatsApp automation
- Add reminder emails
- Add abandoned checkout follow-up
- Add demo-to-program conversion tracking

### Tech

- Add TypeScript
- Add better form validation schema
- Add payment verification webhook
- Add automated tests
- Add structured analytics events
- Add error monitoring
- Add `.env.example`
- Add admin dashboard for slots/seats
- Add Supabase/Firebase if a stronger backend is needed

### Payments

- Add Razorpay webhook verification
- Add PayPal sandbox/live environment toggle
- Add invoice generation
- Add coupon support
- Add multi-currency pricing table
- Add FIRC/accounting documentation flow for international payments

---

## Portfolio Value

This project demonstrates:

- Product management thinking
- EdTech funnel design
- Conversion-focused copywriting
- Parent/student user journey mapping
- React frontend development
- Lead generation architecture
- Payment gateway integration
- Internationalization-aware booking logic
- Google Sheets/Apps Script automation
- Vercel deployment
- Founder-led product execution

---

## Author

Built by **Sumit Pandey**

- GitHub: [@connectsumitp](https://github.com/connectsumitp)
- Live Website: [kraft-academy.vercel.app](https://kraft-academy.vercel.app)
- Contact: +91 99589 50167

---

## License

No license has been added yet.

If this project will remain portfolio-only or private-commercial, keep it unlicensed. If you want others to use or contribute to it, consider adding an MIT License.

---

## Final Note

Kraft Academy is more than a website.

It is an early-stage EdTech product and conversion funnel designed to help students learn AI and coding in a responsible, practical, and future-ready way.
