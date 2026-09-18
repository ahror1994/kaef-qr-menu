import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";
import CategoryNav from "@/components/public/CategoryNav";
import MenuSection, { type PublicProduct } from "@/components/public/MenuSection";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const settings = await getSettings();
  const categories = await prisma.category.findMany({
    where: { isVisible: true },
    orderBy: { sort: "asc" },
    include: {
      products: {
        where: { isVisible: true },
        orderBy: { sort: "asc" },
      },
    },
  });

  return (
    <>
      <SiteHeader settings={settings} />
      <CategoryNav categories={categories.map((c) => ({ slug: c.slug, title: c.title }))} />
      <main>
        {categories.map((c) => (
          <MenuSection
            key={c.id}
            slug={c.slug}
            title={c.title}
            products={c.products.map((p): PublicProduct => ({
              id: p.id,
              title: p.title,
              description: p.description,
              price: p.price,
              weight: p.weight,
              imageUrl: p.imageUrl,
              gallery: p.gallery,
              cardType: p.cardType === "string" ? "string" : "gallery",
              isVisible: p.isVisible,
              isFeatured: p.isFeatured,
            }))}
          />
        ))}
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
