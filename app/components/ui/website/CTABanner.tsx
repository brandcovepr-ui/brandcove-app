"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const MotionLink = motion(Link);

export default function CTABanner() {
  return (
    <section className="bg-cream py-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 16 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-steel-blue rounded-3xl px-10 py-20 text-center"
        >
          <h2 className="font-editorial text-4xl lg:text-5xl font-regular text-black max-w-2xl mx-auto leading-tight mb-10">
            Join 30+ founders and find your next{" "}
            <span className="font-script italic text-white">dream hire</span> with us.
          </h2>
          <MotionLink
            href="/signup"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex bg-maroon text-white font-sans font-medium px-8 py-3.5 rounded-full hover:bg-maroon/90 transition-colors text-sm"
          >
            Get started
          </MotionLink>
        </motion.div>
      </div>
    </section>
  );
}
