import Link from "next/link";
import type { SettingsInput } from "@/lib/validation";

export default function SiteHeader({ settings }: { settings: SettingsInput }) {
  return (
    <header className="header">
      <div className="container header--box">
        <div className="logo-box">
          <Link href="/" className="logo-link" aria-label="На главную">
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoUrl} alt={settings.siteTitle} className="logo-img" />
            ) : (
              <span className="logo-plug">{settings.siteTitle}</span>
            )}
          </Link>
        </div>

        {settings.footerSocials.length > 0 && (
          <div className="social-list">
            {settings.footerSocials.map((s, i) => (
              <a
                key={i}
                className="social-item"
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                title={s.label}
              >
                {s.label.slice(0, 2).toUpperCase()}
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
