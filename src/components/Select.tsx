import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  options: (string | SelectOption)[];
  value: string;
  onChange: (val: string) => void;
  className?: string;
  disabled?: boolean;
};

export default function Select({ options, value, onChange, className = '', disabled = false }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions = options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find(o => o.value === value) || normalizedOptions[0];

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="glass-input w-full pl-3 pr-8 py-2 text-sm bg-[#121915]/80 text-on-surface flex justify-between items-center text-left focus:border-primary disabled:opacity-50 cursor-pointer min-h-[38px]"
      >
        <span className="truncate">{selectedOption?.label}</span>
        <span
          className="material-symbols-outlined text-on-surface-variant pointer-events-none transition-transform duration-200"
          style={{ fontSize: 18, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}
        >
          expand_more
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 right-0 mt-1.5 z-50 max-h-60 overflow-y-auto bg-[#0a100d] border border-outline-variant/60 rounded-lg shadow-2xl p-1 custom-scrollbar backdrop-blur-xl"
          >
            {normalizedOptions.map(opt => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${
                    opt.value === value
                      ? 'bg-primary/20 text-primary font-semibold border-l-2 border-primary'
                      : 'text-on-surface-variant hover:bg-surface-variant/45 hover:text-on-surface'
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
