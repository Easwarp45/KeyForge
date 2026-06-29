export default function Footer() {
  return (
    <footer className="w-full py-4 bg-surface-container-lowest border-t border-outline-variant/20 flex justify-between items-center px-8 z-10 flex-shrink-0">
      <p className="font-mono text-xs text-on-surface-variant tracking-wider">
        © 2024 KeyForge Security. All rights reserved.
      </p>
      <div className="flex gap-4 md:gap-6">
        <a href="#" className="font-mono text-xs text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100">Privacy Policy</a>
        <a href="#" className="font-mono text-xs text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100">Terms of Service</a>
        <a href="#" className="font-mono text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 opacity-80 hover:opacity-100">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          API Status
        </a>
      </div>
    </footer>
  );
}
