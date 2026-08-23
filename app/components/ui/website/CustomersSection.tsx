"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    id: 1,
    quote:
      "BrandCove helped us place a creative strategist who completely transformed our brand visibility within 60 days.",
    role: "Founder, Fashion brand: HUNI",
    bg: "bg-amber-100",
    initials: "FH",
  },
  {
    id: 2,
    quote:
      "From PR strategy to content execution, the team they connected us with understood our brand from day one.",
    role: "Marketing Lead, GOMONEY",
    bg: "bg-rose-100",
    initials: "GM",
    featured: true,
  },
  {
    id: 3,
    quote:
      "Honestly, the easiest hire I've ever made. The platform made the whole process seamless; I found someone in under two weeks."  ,
    role: "CEO, IMO HILLS FISHERIES",
    bg: "bg-violet-100",
    initials: "IHF",
  },
];

export default function CustomersSection() {
  return (
    <section className="bg-cream py-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-12"
        >
          <span className="font-sans text-xs font-semibold tracking-widest text-[#DC516B] uppercase">
            Customers
          </span>
          <h2 className="font-editorial text-4xl lg:text-5xl font-regular text-gray-900 mt-2 tracking-tight">
            Founders{" "}
            <span className="font-script text-rose italic">love</span>{" "}
            BrandCove.
          </h2>
        </motion.div>

        {/* Testimonial cards — different sizes */}
        <div className="flex flex-col sm:flex-row gap-5 items-stretch">
          {/* Small card */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
            className="flex-none sm:w-[28%] bg-white border border-maroon/30 rounded-2xl p-6 flex flex-col justify-between gap-8 shadow-sm"
          >
            <p className="font-sans text-sm text-gray-600 leading-relaxed">
              {testimonials[0].quote}
            </p>
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full ${testimonials[0].bg} flex items-center justify-center shrink-0`}
              >
                <span className="font-serif text-xs font-bold text-gray-500">
                  {testimonials[0].initials}
                </span>
              </div>
              <span className="font-sans text-xs text-gray-500">{testimonials[0].role}</span>
            </div>
          </motion.div>

          {/* Featured large card */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.12 }}
            className="flex-1 bg-white border border-maroon/40 rounded-2xl p-10 flex flex-col justify-between gap-10 shadow-xl"
          >
            <p className="font-sans text-base text-gray-700 leading-relaxed">
              {testimonials[1].quote}
            </p>
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full ${testimonials[1].bg} flex items-center justify-center shrink-0`}
              >
                <span className="font-serif text-xs font-bold text-gray-500">
                  {testimonials[1].initials}
                </span>
              </div>
              <span className="font-sans text-xs text-gray-500">{testimonials[1].role}</span>
            </div>
          </motion.div>

          {/* Medium card */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.24 }}
            className="flex-none sm:w-[28%] bg-white border border-maroon/30 rounded-2xl p-6 flex flex-col justify-between gap-8 shadow-md"
          >
            <p className="font-sans text-sm text-gray-600 leading-relaxed">
              {testimonials[2].quote}
            </p>
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full ${testimonials[2].bg} flex items-center justify-center shrink-0`}
              >
                <span className="font-serif text-xs font-bold text-gray-500">
                  {testimonials[2].initials}
                </span>
              </div>
              <span className="font-sans text-xs text-gray-500">{testimonials[2].role}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
