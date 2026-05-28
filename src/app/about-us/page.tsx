import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";

export default function AboutPage() {
  return (
    <main>
      <Navbar />

      {/* Hero */}
      <section className="bg-cream pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-7xl text-gray-900 text-center leading-tight tracking-tight">
              We&apos;re on a mission to{" "}
              <span className="font-script italic text-rose">empower</span>{" "}
              early stage founders with the talents they deserve.
            </h1>
          </FadeIn>
        </div>
      </section>

      {/* Bio section */}
      <section className="bg-maroon py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Photo card */}
          <FadeIn delay={0.05} className="flex justify-center">
            <div className="relative w-72 sm:w-80">
              {/* Decorative frame */}
              <div className="absolute -top-3 -left-3 w-full h-full border-2 border-white/20 rounded-xl" />
              <div className="relative rounded-xl overflow-hidden aspect-[3/4] flex items-end">
                <Image
                  src="/founder.jpg"
                  alt="Founder"
                  fill
                  className="object-cover object-top"
                />
                {/* BrandCove label */}
                <div className="relative z-10 w-full bg-maroon/80 backdrop-blur-sm px-5 py-3 border-t border-white/10">
                  <span className="font-editorial text-white text-lg">BrandCove.</span>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Bio text */}
          <FadeIn delay={0.15} className="text-white">
            <h2 className="font-editorial text-5xl lg:text-6xl mb-6 leading-tight">
              Hi, I&apos;m{" "}
              <span className="font-script italic text-rose">Chidera!</span>
            </h2>
            <div className="space-y-4 font-sans text-sm text-white/80 leading-relaxed max-w-md">
              <p>
                With years of cross-industry experience across marketing,
                operations, and creative strategy, I built BrandCove to solve
                a problem I kept seeing — founders who desperately needed
                talented creative support but had no reliable, curated way to
                find it.
              </p>
              <p>
                BrandCove is the marketplace I wished existed when I was
                growing teams from scratch — vetted, diverse creative talent,
                matched to early-stage founders who are ready to grow and need
                the right people to grow with.
              </p>
              <p>
                Whether you need a social media manager, a graphic designer, or
                a customer service lead, we&apos;ve done the hard work of
                finding and vetting the best so you don&apos;t have to.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </main>
  );
}
