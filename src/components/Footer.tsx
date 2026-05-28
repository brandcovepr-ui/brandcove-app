const links = {
  Platform: ["Browse Talents", "For Creatives", "How it works", "Pricing"],
  Roles: [
    "Social Media Manager",
    "Customer Service",
    "Web Design",
    "Sales",
    "Operations Manager",
  ],
  Company: ["About", "Careers", "Contact"],
};

export default function Footer() {
  return (
    <footer className="bg-maroon text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-8 flex flex-col gap-6">
        {/* Top row */}

        <div className="lg:col-span-1">
            <span className="font-editorial font-bold text-2xl block mb-3 tracking-[-0.02em] text-white">
              BrandCove.
            </span>
            <p className="font-poppins text-sm text-white/[0.88] leading-relaxed max-w-xs tracking-[-0.02em]">
              The curated marketplace for founders who need creative talent —
              fast.
            </p>
          </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-4">
          {/* Brand */}

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-poppins text-xs font-semibold tracking-[-0.02em] uppercase text-white/40 mb-4">
                {category}
              </h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="font-poppins text-sm text-white/[0.88] hover:text-white transition-colors tracking-[-0.02em]"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social icons */}
        <div className="flex w-full items-end justify-end gap-4">
          {/* Instagram */}
          <a
            href="https://www.instagram.com/brandcove.pr?igsh=M2Rla3VzeWp2cmlw"
            aria-label="Instagram"
            className="text-white/50 hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
            </svg>
          </a>
          {/* Facebook */}
          <a
            href="#"
            aria-label="Facebook"
            className="text-white/50 hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          {/* X (Twitter) */}
          <a
            href="#"
            aria-label="X"
            className="text-white/50 hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">

          <div className="flex items-center gap-4 font-poppins text-xs text-white/50 tracking-[-0.02em]">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <span>|</span>
            <a href="#" className="hover:text-white transition-colors">
              Terms &amp; Conditions
            </a>
          </div>
          <div className="flex flex-col items-center flex-wrap justify-end">
             
            <span className="font-poppins text-xs text-white/50 tracking-[-0.02em]">
              © 2026 All rights Reserved. BrandCove | Site by aimeejaydesign_
            </span>
            
            
           
          </div>
        </div>
      </div>
    </footer>
  );
}
