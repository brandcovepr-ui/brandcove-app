import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";

export default function ContactPage() {
  return (
    <main>
      <Navbar />

      <section className="bg-cream min-h-screen flex items-center justify-center px-4 lg:px-8 pt-32 pb-28">
        <FadeIn className="w-full max-w-7xl">
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 lg:p-16">
            <h1 className="font-editorial text-5xl lg:text-7xl text-gray-900 mb-6">
              Contact us.
            </h1>

            <p className="font-sans text-sm text-gray-500 mb-14 leading-relaxed">
              You can always send us a message or email.
              <br />
              We&apos;d be happy to help you out.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
              {/* Email */}
              <div>
                <h2 className="font-script text-xl text-gray-900 mb-3">Email</h2>
                <p className="font-sans text-sm text-gray-500 mb-1">Send an email:</p>
                <a
                  href="mailto:hello@brandcovepr.com"
                  className="font-sans text-sm text-gray-900 hover:underline"
                >
                  hello@brandcovepr.com
                </a>
              </div>

              {/* Phone */}
              <div>
                <h2 className="font-script text-xl text-gray-900 mb-3">Phone</h2>
                <p className="font-sans text-sm text-gray-500 mb-1">or call us:</p>
                <a
                  href="tel:+2348000000000"
                  className="font-sans text-sm text-gray-900 hover:underline"
                >
                  +234 800 000 0000
                </a>
              </div>

              {/* Location */}
              <div>
                <h2 className="font-script text-xl text-gray-900 mb-3">Location</h2>
                <p className="font-sans text-sm text-gray-500 mb-1">Find us:</p>
                <span className="font-sans text-sm text-maroon font-medium">
                  Lagos, Nigeria
                </span>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      <Footer />
    </main>
  );
}
