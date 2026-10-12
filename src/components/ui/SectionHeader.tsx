type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  // "small" is used by the About section heading
  size?: "default" | "small";
  titleClassName?: string;
};

// Gold eyebrow label with a serif heading, shared by every home section
export default function SectionHeader({ eyebrow, title, size = "default", titleClassName = "" }: SectionHeaderProps) {
  const sizeClasses =
    size === "small"
      ? "text-[30px] leading-[1.25] md:text-[36px] lg:text-[clamp(40px,2.6vw,50px)] lg:leading-[1.2]"
      : "text-[32px] leading-[1.2] md:text-[38px] lg:text-[clamp(44px,2.9vw,56px)] lg:leading-[1.15]";

  return (
    <div>
      <div className="text-[11px] font-semibold tracking-[2.5px] text-gold uppercase lg:tracking-[3px] 2xl:text-xs">{eyebrow}</div>
      <h2 className={`mt-[14px] font-serif font-medium text-cream md:mt-4 lg:mt-[18px] ${sizeClasses} ${titleClassName}`}>
        {title}
      </h2>
    </div>
  );
}
