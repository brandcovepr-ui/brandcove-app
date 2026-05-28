"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const MotionLink = motion(Link);

const talentCards = [
  {
    id: 1,
    name: "Amara M.",
    role: "Social Media Manager",
    platform: "Instagram",
    rating: 4.8,
    reviews: 24,
    bg: "bg-amber-100",
    initials: "AM",
  },
  {
    id: 2,
    name: "Jordan K.",
    role: "Operations Manager",
    platform: "Behance",
    rating: 4.9,
    reviews: 31,
    bg: "bg-rose-100",
    initials: "JK",
  },
  {
    id: 3,
    name: "Priya S.",
    role: "Web Designer",
    platform: "Dribbble",
    rating: 5.0,
    reviews: 18,
    bg: "bg-violet-100",
    initials: "PS",
  },
  {
    id: 4,
    name: "Marcus T.",
    role: "Sales Representative",
    platform: "LinkedIn",
    rating: 4.7,
    reviews: 42,
    bg: "bg-sky-100",
    initials: "MT",
  },
  {
    id: 5,
    name: "Chloe R.",
    role: "Creative Assistant",
    platform: "TikTok",
    rating: 4.9,
    reviews: 15,
    bg: "bg-emerald-100",
    initials: "CR",
  },
  {
    id: 6,
    name: "Demi A.",
    role: "Customer Service",
    platform: "Zendesk",
    rating: 4.8,
    reviews: 27,
    bg: "bg-orange-100",
    initials: "DA",
  },
];

function TalentCard({
  name,
  role,
  platform,
  rating,
  reviews,
  bg,
  initials,
}: (typeof talentCards)[0]) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/5 w-40 lg:w-64 flex-shrink-0">
      {/* Platform badge */}
      <span className="inline-block bg-cream text-gray-600 font-sans text-xs px-2.5 py-1 rounded-full mb-3">
        {platform}
      </span>
      {/* Avatar */}
      <div
        className={`w-full h-20 lg:h-32 ${bg} rounded-xl mb-3 flex items-center justify-center`}
      >
        <span className="font-serif text-xl lg:text-2xl font-bold text-gray-500">
          {initials}
        </span>
      </div>
      {/* Info */}
      <p className="font-sans font-semibold text-xs lg:text-sm text-gray-900">{name}</p>
      <p className="font-sans text-xs text-gray-500 mb-2">{role}</p>
      <div className="flex items-center gap-1">
        <span className="text-amber-400 text-xs">★</span>
        <span className="font-sans text-xs font-medium text-gray-800">
          {rating}
        </span>
        <span className="font-sans text-xs text-gray-400 hidden lg:inline">
          · {reviews} reviews
        </span>
      </div>
    </div>
  );
}

function ScrollColumn({
  cards,
  speed,
  offset,
  className = "",
}: {
  cards: typeof talentCards;
  speed: string;
  offset: boolean;
  className?: string;
}) {
  const doubled = [...cards, ...cards];
  return (
    <div className={`scroll-column overflow-hidden flex-1 flex flex-col ${className}`}>
      <div
        className={`flex flex-col gap-4 ${speed} ${offset ? "mt-[-60px]" : ""}`}
        style={{ willChange: "transform" }}
      >
        {doubled.map((card, i) => (
          <TalentCard key={`${card.id}-${i}`} {...card} />
        ))}
      </div>
    </div>
  );
}

export default function Hero() {
  const col1 = talentCards.slice(0, 3).concat(talentCards.slice(3));
  const col2 = [...talentCards].reverse();

  return (
    <section className="bg-cream min-h-screen flex items-center overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Left — copy */}
        <div className="max-w-lg py-20 pt-32 flex flex-col items-center md:items-start">
          <motion.span
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0 }}
            className="inline-block font-sans text-xs font-semibold tracking-widest text-[#DC516B] uppercase mb-6"
          >
            Curated Creative Talent
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-editorial text-4xl lg:text-6xl font-normal text-gray-900 leading-tight tracking-tight mb-6"
          >
            Hire the{" "}
            <span className="font-script text-rose italic">Talent</span> you
            need.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-sans text-base text-gray-600 leading-relaxed mb-10"
          >
            A curated marketplace of the six creative roles every early-stage
            founder needs. Vetted talent. No noise. Just the right hire.
          </motion.p>
          <MotionLink
            href="/login"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex bg-maroon text-white font-sans font-medium px-7 py-3.5 rounded-full hover:bg-maroon/90 transition-colors text-sm"
          >
            Join as a founder
          </MotionLink>
        </div>

        {/* Right — scrolling talent cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex gap-2 justify-center items-center h-[340px] lg:h-screen"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
          }}
        >
          <ScrollColumn cards={col1} speed="animate-scroll-up" offset={false} />
          <ScrollColumn
            cards={col2}
            speed="animate-scroll-up-slow"
            offset={true}
            className=""
          />
        </motion.div>
      </div>
    </section>
  );
}
