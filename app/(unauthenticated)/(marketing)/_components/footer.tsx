import Link from "next/link"

export function Footer() {
  const footerNavigation = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "FAQ", href: "#faq" }
    ],
    company: [
      { name: "About", href: "/about" },
      { name: "Contact", href: "/contact" }
    ],
    legal: [
      { name: "Privacy", href: "#" },
      { name: "Terms", href: "#" }
    ]
  }

  return (
    <footer className="bg-muted/50" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <Link href="/" className="text-xl font-bold">
              OnTarget Resume Studio
            </Link>
            <p className="text-muted-foreground text-sm leading-6">
              Hit the role. Every time.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-8 xl:col-span-2 xl:mt-0">
            <div>
              <h3 className="text-foreground text-sm leading-6 font-semibold">
                Product
              </h3>
              <ul role="list" className="mt-6 space-y-4">
                {footerNavigation.product.map(item => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground text-sm leading-6"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-foreground text-sm leading-6 font-semibold">
                Company
              </h3>
              <ul role="list" className="mt-6 space-y-4">
                {footerNavigation.company.map(item => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground text-sm leading-6"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-foreground text-sm leading-6 font-semibold">
                Legal
              </h3>
              <ul role="list" className="mt-6 space-y-4">
                {footerNavigation.legal.map(item => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground text-sm leading-6"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="border-border mt-16 border-t pt-8 sm:mt-20 lg:mt-24">
          <p className="text-muted-foreground text-xs leading-5">
            &copy; {new Date().getFullYear()} OnTarget Resume Studio. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
