import type { SettingsInput } from "@/lib/validation";

export default function SiteFooter({ settings }: { settings: SettingsInput }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-12">
            {(settings.footerAddress || settings.footerPhone || settings.footerWorkingHours) && (
              <div className="footer-info">
                {settings.footerAddress && <span>{settings.footerAddress}</span>}
                {settings.footerPhone && (
                  <a href={`tel:${settings.footerPhone.replace(/[^\d+]/g, "")}`}>{settings.footerPhone}</a>
                )}
                {settings.footerWorkingHours && <span>{settings.footerWorkingHours}</span>}
              </div>
            )}
            {(settings.footerLinks.length > 0 || settings.footerSocials.length > 0) && (
              <div className="footer-links">
                {settings.footerLinks.map((l, i) => (
                  <a key={`l${i}`} href={l.url} target="_blank" rel="noopener noreferrer">
                    {l.label}
                  </a>
                ))}
                {settings.footerSocials.map((s, i) => (
                  <a key={`s${i}`} href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                ))}
              </div>
            )}
            <div className="copyright">
              © {settings.year} {settings.footerCopyright}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
