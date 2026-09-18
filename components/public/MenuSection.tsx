"use client";

import { useEffect, useState } from "react";

export interface PublicProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  weight: string;
  imageUrl: string;
  gallery: string[];
  cardType: "gallery" | "string";
  isVisible: boolean;
  isFeatured: boolean;
}

const priceFmt = (p: number) => `${p.toLocaleString("ru-RU")} ₽`;
const images = (p: PublicProduct) => p.gallery.filter(Boolean).concat(p.imageUrl ? [p.imageUrl] : []);

export default function MenuSection({
  slug,
  title,
  products,
}: {
  slug: string;
  title: string;
  products: PublicProduct[];
}) {
  const [modal, setModal] = useState<PublicProduct | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setModal(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = modal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modal]);

  return (
    <section className="section-category" id={slug}>
      <div className="container">
        <div className="row">
          <div className="col-12">
            <h2 className="category-title">{title}</h2>
          </div>
          {products.map((p) =>
            p.cardType === "string" ? (
              <div className="col-lg-4 col-md-4 col-sm-6 mb-4" key={p.id}>
                <div className="product-card product-card--type-string">
                  <div className="product-card--body">
                    <h3 className="product-title" onClick={() => setModal(p)} style={{ cursor: "pointer" }}>
                      <span>{p.title}</span>
                    </h3>
                    <div className="product-meta">
                      <div className="product-price">{priceFmt(p.price)}</div>
                      {p.weight && <div className="product-weight">{p.weight}</div>}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="col-lg-3 col-md-4 col-sm-6 mb-4" key={p.id}>
                <div className="product-card product-card--type-gallery">
                  <div className="product-card--image">
                    {p.isFeatured && <div className="product-mark">NEW</div>}
                    {images(p).length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={images(p)[0]} className="product-card--img" alt={p.title} loading="lazy" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src="/source-assets/img-placeholder.svg" className="product-card--img" alt="" loading="lazy" />
                    )}
                  </div>
                  <div className="product-card--body">
                    <h3 className="product-title">{p.title}</h3>
                    {p.description && <div className="product-description">{p.description}</div>}
                    <div className="product-card--footer">
                      <div className="product-meta">
                        <div className="product-price">{priceFmt(p.price)}</div>
                        {p.weight && <div className="product-weight">{p.weight}</div>}
                      </div>
                      <button
                        className="btn-product"
                        aria-label={`Подробнее: ${p.title}`}
                        onClick={() => setModal(p)}
                      >
                        <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 20L20 8M20 8H10M20 8V18" stroke="#3F2F27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      {modal && <ProductModal product={modal} onClose={() => setModal(null)} />}
    </section>
  );
}

function ProductModal({ product, onClose }: { product: PublicProduct; onClose: () => void }) {
  const list = images(product);
  const [idx, setIdx] = useState(0);

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={product.title}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-gallery">
          <button className="btn-close" aria-label="Закрыть" onClick={onClose}>
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="#3F2F27" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          {product.isFeatured && <div className="product-mark">NEW</div>}
          {list.length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={list[idx]} className="modal-product--image" alt={product.title} />
              {list.length > 1 && (
                <div className="gallery-dots">
                  {list.map((_, i) => (
                    <button key={i} className={i === idx ? "active" : ""} aria-label={`Фото ${i + 1}`} onClick={() => setIdx(i)} />
                  ))}
                </div>
              )}
            </>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/source-assets/img-placeholder.svg" className="modal-product--image" alt="" />
          )}
        </div>
        <div className="modal-body">
          <div className="product-info">
            <h3 className="modal-title">{product.title}</h3>
            {product.description && <div className="modal-description">{product.description}</div>}
            <div className="product-meta">
              <div className="product-weight">{product.weight}</div>
              <div className="product-price">{priceFmt(product.price)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
