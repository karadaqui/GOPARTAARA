import type { ReactNode } from "react";

export interface HelpArticle {
  q: string;
  a: ReactNode;
}

export interface HelpCategoryData {
  slug: string;
  title: string;
  description: string;
  articles: HelpArticle[];
}

// Inline link style used across all help article answers
const linkStyle: React.CSSProperties = {
  color: "#cc1111",
  textDecoration: "underline",
  fontWeight: 500,
  cursor: "pointer",
};

const L = ({ href, children }: { href: string; children: ReactNode }) => (
  <a
    href={href}
    style={linkStyle}
    onMouseOver={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#e01111")}
    onMouseOut={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#cc1111")}
  >
    {children}
  </a>
);

export const helpCategories: Record<string, HelpCategoryData> = {
  "getting-started": {
    slug: "getting-started",
    title: "Getting Started",
    description:
      "Learn how to search for parts, use UK reg plate lookup, photo search and understand price quality badges.",
    articles: [
      {
        q: "How do I search for car parts on GOPARTARA?",
        a: (
          <>
            Type the part name, part number, or your vehicle model into{" "}
            <L href="/search">the search bar on the homepage</L> or at{" "}
            <L href="/search">gopartara.com/search</L>. Press Search and we'll check 7
            suppliers simultaneously and show you results ranked by price.
          </>
        ),
      },
      {
        q: "How does the reg plate lookup work?",
        a: (
          <>
            Click <L href="/search">"Reg Plate UK"</L> on the search page and enter your
            vehicle's registration number (e.g. AB12 CDE). We'll automatically identify
            your vehicle's make, model, year, engine size, MOT status and tax status using
            DVLA data. You can then search for parts compatible with your exact vehicle.
          </>
        ),
      },
      {
        q: "What is Photo Search and how does it work?",
        a: (
          <>
            <L href="/search">Photo Search</L> is available to{" "}
            <L href="/pricing">Pro and Elite subscribers</L>. Click "Photo Search" on the
            search page and upload a photo of any car part. Our system will identify the
            part and search for matching results across our suppliers.
          </>
        ),
      },
      {
        q: "What do the price badges mean (Good Price, Great Price)?",
        a: 'We compare each listing\'s price against the average price for that part across all suppliers. "Great Price" means the listing is significantly below average. "Good Price" means it\'s below average. No badge means it\'s around or above the average market price.',
      },
    ],
  },
  "pricing-plans": {
    slug: "pricing-plans",
    title: "Pricing & Plans",
    description:
      "Everything you need to know about Free, Pro and Elite plans and how to manage your subscription.",
    articles: [
      {
        q: "What's included in the Free plan?",
        a: (
          <>
            The Free plan lets you make up to 10 searches per month, save up to 5 parts,
            set up to 5 price alerts, add 1 vehicle to{" "}
            <L href="/garage">My Garage</L>, and create up to 5{" "}
            <L href="/marketplace">marketplace listings</L>. No credit card required.
          </>
        ),
      },
      {
        q: "What's included in Pro (£9.99/mo)?",
        a: (
          <>
            Pro gives you unlimited searches,{" "}
            <L href="/search">photo search</L>, unlimited{" "}
            <L href="/marketplace">marketplace listings</L>, unlimited saved parts and
            alerts, <L href="/garage">unlimited garage vehicles</L>, search history,
            ad-free experience, and up to 10 photos per listing.
          </>
        ),
      },
      {
        q: "What's included in Elite (£19.99/mo)?",
        a: (
          <>
            Elite includes everything in Pro plus{" "}
            <L href="/compare">bulk price comparison</L> (up to 20 parts at once),{" "}
            <L href="/dashboard">export search history as CSV</L>, 30-day price history
            charts, <L href="/dashboard">garage analytics dashboard</L>, priority email
            support, and early access to new features.
          </>
        ),
      },
      {
        q: "How do I cancel my subscription?",
        a: (
          <>
            You can cancel anytime from your dashboard. Go to{" "}
            <L href="/dashboard">Dashboard</L> → Subscription → Cancel Plan. Your plan
            stays active until the end of your current billing period. We don't offer
            refunds for partial months.
          </>
        ),
      },
    ],
  },
  "price-alerts": {
    slug: "price-alerts",
    title: "Price Alerts",
    description:
      "Set target prices on parts you're tracking and get notified when suppliers drop below your target.",
    articles: [
      {
        q: "How do I set a price alert?",
        a: (
          <>
            <L href="/search">Search for a part</L>, then click the bell icon (🔔) on any
            result card. A modal will appear showing the current price. Enter your target
            price — we'll email you when any supplier drops below it. We check prices
            every 6 hours.
          </>
        ),
      },
      {
        q: "How many price alerts can I set?",
        a: "Free plan: up to 5 alerts. Pro and Elite plans: unlimited price alerts.",
      },
      {
        q: "How do I delete a price alert?",
        a: (
          <>
            Go to <L href="/dashboard">your Dashboard</L> and scroll to the{" "}
            <L href="/dashboard">"Price Alerts" section</L>. Click the X or delete button
            next to any alert to remove it.
          </>
        ),
      },
    ],
  },
  "my-garage": {
    slug: "my-garage",
    title: "My Garage",
    description:
      "Save your vehicles, filter searches by vehicle, and track MOT and tax expiry dates.",
    articles: [
      {
        q: "How do I add a vehicle to My Garage?",
        a: (
          <>
            Go to <L href="/garage">gopartara.com/garage</L> and click{" "}
            <L href="/garage">"Add Vehicle"</L>. Enter your vehicle's make, model, year
            and engine size. You can also enter it using{" "}
            <L href="/search">your reg plate</L>. Once saved, you can filter searches to
            show only parts compatible with that vehicle.
          </>
        ),
      },
      {
        q: "How do MOT and tax reminders work?",
        a: (
          <>
            In <L href="/garage">My Garage</L>, you can set your vehicle's MOT expiry date
            and tax renewal date. We'll display a colour-coded status (green = more than
            3 months, amber = 1-3 months, red = less than 1 month). Reminder emails are
            not currently available but are coming soon.
          </>
        ),
      },
      {
        q: "How many vehicles can I add?",
        a: (
          <>
            Free plan: 1 vehicle.{" "}
            <L href="/pricing">Pro and Elite plans</L>: unlimited vehicles.
          </>
        ),
      },
    ],
  },
  marketplace: {
    slug: "marketplace",
    title: "Marketplace",
    description:
      "Buy and sell car parts directly with other GOPARTARA users on our peer-to-peer marketplace.",
    articles: [
      {
        q: "How do I list a part for sale?",
        a: (
          <>
            Go to <L href="/marketplace">Marketplace</L> and click{" "}
            <L href="/marketplace">"List Your Parts"</L>. Add a title, description,
            price, condition (new/used), and up to 10 photos (Pro/Elite). Your listing
            goes live immediately and is visible to all GOPARTARA users.
          </>
        ),
      },
      {
        q: "How many listings can I have?",
        a: (
          <>
            Free plan: up to 5 active listings.{" "}
            <L href="/pricing">Pro and Elite</L>: unlimited.
          </>
        ),
      },
      {
        q: "How does buying work on the marketplace?",
        a: (
          <>
            Browse listings at{" "}
            <L href="/marketplace">gopartara.com/marketplace</L>. Click a listing to see
            full details and contact the seller directly via the messaging system.
            GOPARTARA does not process payments — transactions are arranged between buyer
            and seller.
          </>
        ),
      },
      {
        q: "Is the marketplace safe?",
        a: (
          <>
            We verify seller accounts and moderate listings. However, as with any
            peer-to-peer marketplace, we recommend meeting in person for collection,
            using bank transfer only after inspection, and reporting any suspicious
            listings to{" "}
            <L href="mailto:info@gopartara.com">info@gopartara.com</L>.
          </>
        ),
      },
    ],
  },
  "account-privacy": {
    slug: "account-privacy",
    title: "Account & Privacy",
    description:
      "Manage your account, change your details, control your data and understand your privacy rights under UK GDPR.",
    articles: [
      {
        q: "How do I change my email or password?",
        a: (
          <>
            Go to <L href="/dashboard">Dashboard</L> →{" "}
            <L href="/dashboard">Edit Profile</L>. You can update your display name and
            profile photo. Email and password changes are handled through our
            authentication system — contact{" "}
            <L href="mailto:info@gopartara.com">info@gopartara.com</L> if you need to
            change your login email.
          </>
        ),
      },
      {
        q: "How do I delete my account and data?",
        a: (
          <>
            Email{" "}
            <L href="mailto:info@gopartara.com">info@gopartara.com</L> with subject
            "Delete my account" from your registered email address. We'll delete your
            account and all associated data within 30 days, in accordance with UK GDPR.
            This action is irreversible.
          </>
        ),
      },
      {
        q: "What data do you store about me?",
        a: (
          <>
            We store your email address, search history (for Pro/Elite users), saved
            parts, price alerts, garage vehicles, and marketplace listings. We do not
            sell your data to third parties. See our{" "}
            <L href="/privacy">Privacy Policy</L> at{" "}
            <L href="/privacy">gopartara.com/privacy</L> for full details.
          </>
        ),
      },
    ],
  },
};
