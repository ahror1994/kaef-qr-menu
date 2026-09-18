"use client";

import { useEffect, useState } from "react";

export default function CategoryNav({ categories }: { categories: { slug: string; title: string }[] }) {
  const [active, setActive] = useState(categories[0]?.slug ?? "");

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(c.slug))
      .filter((el): el is HTMLElement => Boolean(el));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [categories]);

  const jump = (slug: string) => {
    setActive(slug);
    document.getElementById(slug)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="category-header">
      <div className="container">
        <nav className="category-carousel" aria-label="Категории меню">
          {categories.map((c) => (
            <a
              key={c.slug}
              href={`#${c.slug}`}
              className={`category-link${active === c.slug ? " active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                jump(c.slug);
              }}
            >
              {c.title}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
