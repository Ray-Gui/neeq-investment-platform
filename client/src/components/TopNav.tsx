import { Link, useLocation } from "wouter";

const NAV_ITEMS = [
  { href: "/", label: "仪表盘" },
  { href: "/neeq", label: "企业库" },
  { href: "/bse", label: "北交所" },
  { href: "/bse_policy_impact.html", label: "政策研究", external: true },
];

export default function TopNav() {
  const [location] = useLocation();
  return (
    <nav className="border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-6 flex items-center gap-1 h-11 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const active =
            !item.external &&
            (item.href === "/"
              ? location === "/"
              : location === item.href || location.startsWith(item.href + "/"));
          const cls = `whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            active
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`;
          if (item.external) {
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cls}
              >
                {item.label}
              </a>
            );
          }
          return (
            <Link key={item.href} href={item.href} className={cls}>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
