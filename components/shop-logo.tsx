import Image from "next/image";
import { shop } from "@/lib/shop";

/** The shop's round logo, or its initial on the brand color when it has none. */
export function ShopLogo({ size, className = "" }: { size: number; className?: string }) {
  if (shop.logo) {
    return <Image src={shop.logo} alt="" width={size} height={size} style={{ width: size, height: size }} className={`rounded-full ${className}`} />;
  }
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      className={`grid shrink-0 place-items-center rounded-full bg-brand font-display font-semibold text-white ${className}`}
    >
      {shop.name.charAt(0)}
    </span>
  );
}

/**
 * The shop's identity in a header: its wordmark when it has one (the name is already in it),
 * otherwise the round logo followed by the name.
 */
export function ShopBrand({ size, name }: { size: number; name: React.ReactNode }) {
  if (shop.wordmark) {
    const { src, width, height, scale = 1.1 } = shop.wordmark;
    // A bit taller than the round logo so its lettering reads; never squeezed by its neighbours.
    const h = Math.round(size * scale);
    return (
      <Image
        src={src}
        alt=""
        width={Math.round((h * width) / height)}
        height={h}
        style={{ height: h, width: "auto" }}
        // Very wide wordmarks (name + tagline) are capped on phones so the nav and the cart still fit.
        className="max-w-34 shrink-0 object-contain object-left sm:max-w-none"
        preload
      />
    );
  }
  return (
    <>
      <ShopLogo size={size} />
      {name}
    </>
  );
}
