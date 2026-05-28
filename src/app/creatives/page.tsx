"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const MotionLink = motion(Link);

// ─── Apply steps ─────────────────────────────────────────────────────────────
const steps = [
  {
    number: "01",
    title: "Submit your application",
    description:
      "Tell us about your craft, your experience, and the kind of brands you want to work with. Takes less than 5 minutes.",
    rotate: "md:-rotate-[8deg]",
  },
  {
    number: "02",
    title: "Get vetted by our team",
    description:
      "We review every application manually. If you're a fit, you'll hear back within 6 business days.",
    rotate: "md:rotate-0",
  },
  {
    number: "03",
    title: "Start getting hired",
    description:
      "Your profile goes live and founders start reaching out. You choose who you work with.",
    rotate: "md:rotate-[8deg]",
  },
];

// ─── Features ─────────────────────────────────────────────────────────────────
const features = [
  {
    title: "Vetted founders only",
    description:
      "Every brand on BrandCove is reviewed before they can reach out. No time-wasters.",
  },
  {
    title: "Transparent, fair pay",
    description:
      "Founders post budgets upfront. No negotiating in the dark or racing to the bottom.",
  },
  {
    title: "You set the terms",
    description:
      "Pick your availability, your rate, and which projects excite you. You're in control.",
  },
  {
    title: "No bidding wars",
    description:
      "Founders come to you directly. Your work speaks — you don't have to fight for attention.",
  },
  {
    title: "Built for six roles",
    description:
      "We focus on six essential creative roles so your profile reaches the exact founders who need your skill.",
  },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: "Is it free to join as a creative?",
    a: "Applying is free. A small platform fee applies once your application is approved and your profile goes live.",
  },
  {
    q: "How long does the vetting process take?",
    a: "We aim to review all applications within 6 business days. You'll receive an email either way.",
  },
  {
    q: "What roles do you accept?",
    a: "We currently accept Graphic designers, social media managers, operations managers, customer service specialists, marketing associates, sales rep",
  },
  {
    q: "Can I be on BrandCove and other platforms?",
    a: "Absolutely. BrandCove is not an exclusive platform — work with whoever you'd like.",
  },
  {
    q: "How do founders contact me?",
    a: "Founders send you a direct inquiry through your profile. You decide whether to respond and move forward.",
  },
  {
    q: "What if a project doesn't work out?",
    a: "You're always free to decline or end a project. We ask that you communicate clearly with the founder.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 bg-white rounded-md px-4 py-5 mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left gap-4"
      >
        <span className="font-editorial text-base lg:text-lg text-gray-900">
          {q}
        </span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="shrink-0 text-gray-400"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="font-sans text-sm text-gray-500 leading-relaxed max-w-2xl mt-3">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CreativesPage() {
  return (
    <main>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-cream overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-0 md:gap-12 items-stretch mt-24">
          {/* Left */}
          <div className="max-w-lg pt-4 md:pt-0 py-0 md:py-10 md:py-32 flex flex-col items-center md:items-start text-center md:text-left justify-center">
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0 }}
              className="inline-block font-sans text-center md:text-left text-xs font-semibold tracking-widest text-maroon/60 uppercase mb-6 w-fit"
            >
              For Creatives
            </motion.span>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h1 className="font-editorial text-center md:text-left text-4xl lg:text-6xl font-normal text-black mb-4 leading-tight">
                Your <span className="font-script text-rose italic">skills.</span> 
                Your <span className="font-script text-rose italic">terms.</span> 
                Your next <span className="font-script text-rose italic">big client.</span>
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-sans text-base text-black/70 leading-relaxed mb-10"
            >
              Join a curated network of creative talent. No bidding wars, no
              chasing invoices — just founders who need exactly what you do.
            </motion.p>
            <MotionLink
              href="/login"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex bg-maroon text-cream font-sans font-medium px-7 py-3.5 rounded-full hover:bg-maroon/90 transition-colors text-sm w-fit"
            >
              Apply to join
            </MotionLink>
          </div>

          {/* Right — hero image */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            className="flex items-center justify-center pt-0 md:pt-8 md:pt-28 lg:pt-0"
          >
            <div className="relative w-full max-w-[480px] h-[480px] lg:h-[560px]">
              <Image
                src="/TalentCard.png"
                alt="Creative professional"
                fill
                className="object-contain object-center"
                priority
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── From apply to hired ──────────────────────────────────────────── */}
      <section className="bg-cream pb-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center flex-col">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-20 text-center"
          >
            <span className="font-sans text-xs font-semibold tracking-widest text-maroon/60 uppercase">
              The Process
            </span>
            <h2 className="font-editorial text-4xl lg:text-5xl font-normal text-gray-900 mt-2">
              From apply to{" "}
              <span className="font-script text-rose italic">hired.</span>
            </h2>
          </motion.div>

          <div className="flex flex-col items-center md:flex-row md:items-center md:justify-center mb-16 relative gap-6 md:gap-0">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`${step.rotate} bg-white border-2 border-dashed border-maroon/40 rounded-2xl p-8 transition-transform hover:rotate-0 duration-300 shrink-0 w-full max-w-sm md:w-[387px] md:h-[306px] md:max-w-none ${
                  index > 0 ? "md:-ml-10" : ""
                }`}
                style={{ zIndex: index + 1 }}
              >
                <span className="font-script text-5xl text-black block mb-4">
                  {step.number}
                </span>
                <h3 className="font-editorial text-xl text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="font-sans text-sm text-gray-500 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
          >
            <MotionLink
              href="/login"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex bg-maroon text-white font-sans font-medium px-7 py-3.5 rounded-full border-2 border-maroon hover:bg-transparent hover:text-maroon transition-colors text-sm"
            >
              Find your next role
            </MotionLink>
          </motion.div>
        </div>
      </section>

      {/* ── Built for creatives ──────────────────────────────────────────── */}
      <section className="bg-maroon py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16">
            {/* Left — sticky heading */}
            <div className="lg:w-80 shrink-0">
              <div className="lg:sticky lg:top-32">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <span className="font-sans text-xs font-semibold tracking-widest text-cream/60 uppercase">
                    Why BrandCove
                  </span>
                  <h2 className="font-editorial text-4xl lg:text-5xl font-normal text-white mt-2 whitespace-nowrap">
                    Built for{" "}
                    <span className="font-script text-rose italic">
                      Creatives.
                    </span>
                  </h2>
                </motion.div>
              </div>
            </div>

            {/* Right — stacked feature cards */}
            <div className="flex-1 flex flex-col gap-4">
              {features.map((f, index) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.08 }}
                  className="bg-white border-2 border-dashed border-maroon/40 rounded-2xl px-8 py-6"
                >
                  <h3 className="font-editorial text-xl text-gray-900 mb-2">
                    {f.title}
                  </h3>
                  <p className="font-sans text-sm text-gray-500 leading-relaxed">
                    {f.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="bg-cream py-10">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-12 text-center"
          >
            <span className="font-sans text-xs font-semibold tracking-widest text-center text-maroon/60 uppercase">
              Questions
            </span>
            <h2 className="font-editorial text-4xl lg:text-5xl font-normal text-center text-gray-900 mt-2">
              FAQ
            </h2>
          </motion.div>

          <div>
            {faqs.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="bg-cream py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-steel-blue rounded-3xl px-10 py-20 text-center"
          >
            <h2 className="font-editorial text-4xl lg:text-5xl font-normal text-black max-w-2xl mx-auto leading-tight">
              Let&apos;s find{" "}
            </h2>
            <h2 className="font-editorial text-4xl lg:text-5xl font-normal text-black max-w-2xl mx-auto leading-tight">
              your next
              <span className="font-script italic text-white"> role</span>
            </h2>
            <p className="font-sans text-sm text-black/60 leading-relaxed mb-10">
              Explore a wide range of opportunities now available
            </p>
            <MotionLink
              href="/login"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex bg-maroon text-white font-sans font-medium px-8 py-3.5 rounded-full hover:bg-maroon/90 transition-colors text-sm"
            >
              Get started
            </MotionLink>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
