import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface HelpArticle {
  q: string;
  a: React.ReactNode;
}

interface HelpCategoryPageProps {
  slug: string;
  title: string;
  description: string;
  articles: HelpArticle[];
}

const HelpCategoryPage = ({
  slug,
  title,
  description,
  articles,
}: HelpCategoryPageProps) => {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <SEOHead
        title={`${title} — Help Center | GOPARTARA`}
        description={description}
        path={`/help/${slug}`}
      />
      <Navbar />

      <section className="pt-24 pb-10 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Breadcrumbs
            className="mb-6"
            items={[
              { label: "Home", href: "/" },
              { label: "Help", href: "/help" },
              { label: title },
            ]}
          />
          <Link
            to="/help"
            className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            Back to Help Center
          </Link>
          <h1
            className="font-display font-extrabold text-white"
            style={{
              fontSize: "clamp(32px, 4.5vw, 44px)",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            {title}
          </h1>
          <p className="mt-4 text-[15px] text-zinc-400 leading-relaxed">
            {description}
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="space-y-2">
            {articles.map((a, i) => (
              <AccordionItem
                key={i}
                value={`art-${i}`}
                className="border border-[#1f1f1f] rounded-xl px-5 bg-[#0f0f0f]"
              >
                <AccordionTrigger className="text-[15px] font-semibold text-white hover:no-underline py-4 text-left">
                  {a.q}
                </AccordionTrigger>
                <AccordionContent className="text-[14px] text-zinc-400 pb-4 leading-relaxed">
                  {a.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 rounded-2xl border border-[#1f1f1f] bg-[#0f0f0f] p-6 text-center">
            <p className="text-[14px] text-zinc-400">
              Still need help? Email{" "}
              <a
                href="mailto:info@gopartara.com"
                className="text-[#cc1111] hover:underline"
              >
                info@gopartara.com
              </a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HelpCategoryPage;
