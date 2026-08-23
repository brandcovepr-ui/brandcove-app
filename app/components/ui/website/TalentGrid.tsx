"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const roles = [
  "Operations Manager",
  "Social Media Manager",
  "Graphics Designer",
  "Customer Service Specialist",
  "Sales Representative",
  "Marketing Associate",
];

const talents = [
  {
    id: 1,
    name: "Amara M.",
    role: "Graphics Designer",
    description: "Grew three DTC brands from 0 to 50K followers in under 8 months.",
    tags: ["Instagram", "TikTok", "Growth"],
    bg: "bg-amber-200",
    initials: "AM",
  },
  {
    id: 2,
    name: "Jordan K.",
    role: "Operations Manager",
    description: "Designed brand identities for 20+ startups across SaaS and e-commerce.",
    tags: ["Figma", "Branding", "Print"],
    bg: "bg-rose-200",
    initials: "JK",
  },
  {
    id: 3,
    name: "Priya S.",
    role: "Social Media Manager",
    description: "Scaled a B2C newsletter from 0 to 30K subscribers in 6 months.",
    tags: ["Content", "Analytics", "Paid"],
    bg: "bg-violet-200",
    initials: "PS",
  },
  {
    id: 4,
    name: "Marcus T.",
    role: "Sales Representative",
    description: "Closed $500K ARR in outbound for two early-stage SaaS companies.",
    tags: ["Outbound", "CRM", "SaaS"],
    bg: "bg-sky-200",
    initials: "MT",
  },
  {
    id: 5,
    name: "Chloe R.",
    role: "Creative Assistant",
    description: "Supported 4 founder teams with content calendars and creative ops.",
    tags: ["Notion", "Canva", "Ops"],
    bg: "bg-emerald-200",
    initials: "CR",
  },
  {
    id: 6,
    name: "Demi A.",
    role: "Customer Service",
    description: "Maintained 98% CSAT across 3 DTC brands with 10K+ monthly tickets.",
    tags: ["Zendesk", "Email", "Chat"],
    bg: "bg-orange-200",
    initials: "DA",
  },
];

export default function TalentGrid() {
  const [activeRole, setActiveRole] = useState("Operations Manager");

  const filtered = activeRole
    ? talents.filter((t) => t.role === activeRole)
    : talents;

  const displayed = filtered.length >= 6 ? filtered : talents;

  return (
    <section id="creatives" className="bg-maroon py-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-10"
        >
          <span className="font-sans text-xs font-semibold tracking-widest text-[#DC516B] uppercase">
            The Core Six
          </span>
          <h2 className="font-editorial text-4xl lg:text-5xl font-regular text-white mt-2">
            Discover our{" "}
            <span className="font-script text-rose italic">vetted</span>{" "}
            creatives.
          </h2>
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-10"
        >
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`font-sans text-sm px-4 py-2 rounded-full border transition-colors ${
                activeRole === role
                  ? "bg-cream text-maroon border-cream font-medium"
                  : "bg-transparent text-white/80 border-white/30 hover:border-white/60"
              }`}
            >
              {role}
            </button>
          ))}
        </motion.div>

        {/* Talent grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {displayed.map((talent, index) => (
              <motion.div
                key={talent.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.06 }}
                className="bg-white rounded-2xl p-5 flex border-[1px] border-dashed border-maroon flex-col gap-4"
              >
                {/* Card header: avatar + name/role */}
                <div className="flex items-center gap-4">
                  <div
                    className={`w-20 h-20 shrink-0 ${talent.bg} rounded-xl flex items-center justify-center`}
                  >
                    <span className="font-serif text-2xl font-bold text-gray-500">
                      {talent.initials}
                    </span>
                  </div>
                  <div>
                    <p className="font-editorial font-regular text-gray-900 text-base leading-tight">
                      {talent.name}
                    </p>
                    <p className="font-sans text-xs text-gray-400 uppercase tracking-wider mt-0.5">
                      {talent.role}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="font-sans text-sm text-[#111111] leading-relaxed">
                  {talent.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {talent.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-sans text-xs rounded-[4px] text-maroon px-3 py-1 rounded-full bg-[#F7F3ED]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
