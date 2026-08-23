import Link from "next/link";
import Navbar from "@/app/components/ui/website/Navbar";
import Footer from "@/app/components/ui/website/Footer";
import FadeIn from "@/app/components/ui/website/FadeIn";
const plans = [
  {
    name: "Founders",
    description: "For personal use and nonprofits",
    price: "₦3000",
    period: "per month",
  },
  {
    name: "Creatives",
    description: "For personal use and nonprofits",
    price: "₦1000",
    period: "per month",
  },
];

export default function PricingPage() {
  return (
    <main>
      <Navbar />

      <section className="bg-cream flex flex-col items-center justify-center px-6 pt-32 pb-16">
        <FadeIn>
          <h1 className="font-editorial text-5xl lg:text-7xl text-gray-900 mb-12">
            Pricing.
          </h1>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          {plans.map((plan, index) => (
            <FadeIn key={plan.name} delay={0.1 + index * 0.1}>
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col gap-0">
                <div className="pb-5 border-b border-gray-200 mb-5">
                  <h2 className="font-editorial text-2xl text-gray-900">
                    {plan.name}
                  </h2>
                  <p className="font-sans text-sm text-gray-500 mt-1">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <p className="font-editorial text-4xl text-gray-900">
                    {plan.price}
                  </p>
                  <p className="font-sans text-xs text-gray-400 mt-1">
                    {plan.period}
                  </p>
                </div>

                <Link
                  href="/login"
                  className="block w-full border-2 border-gray-900 text-gray-900 font-sans text-sm font-medium py-3 rounded-full hover:bg-gray-900 hover:text-white transition-colors tracking-widest uppercase text-center"
                >
                  Sign up
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
