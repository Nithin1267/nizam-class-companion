import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer
      className={cn(
        'w-full border-t border-border bg-card/60 py-3 px-4 text-center text-xs text-muted-foreground',
        className,
      )}
    >
      © {new Date().getFullYear()} Nizam College <span className="mx-1">|</span> Osmania University
    </footer>
  );
}

export default Footer;