import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: Props) {
  return (
    <div
      className={`group bg-surface rounded-lg border border-line/70 shadow-card overflow-hidden transition-all duration-200 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className="aspect-[4/3] bg-bg overflow-hidden">
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04] ${className}`}
      />
    </div>
  );
}

export function CardBody({ children, className = "" }: Props) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export const cardHover = "hover:shadow-elevated hover:-translate-y-0.5";
