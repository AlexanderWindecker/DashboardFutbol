'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
    children: React.ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block" ref={containerRef}>
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child) && child.type === DropdownMenuTrigger) {
                    return React.cloneElement(child as React.ReactElement<any>, {
                        onClick: () => setIsOpen(!isOpen)
                    });
                }
                if (React.isValidElement(child) && child.type === DropdownMenuContent) {
                    return (
                        <AnimatePresence>
                            {isOpen && React.cloneElement(child as React.ReactElement<any>, {
                                close: () => setIsOpen(false)
                            })}
                        </AnimatePresence>
                    );
                }
                return child;
            })}
        </div>
    );
}

export function DropdownMenuTrigger({ children, asChild, onClick }: {
    children: React.ReactNode;
    asChild?: boolean;
    onClick?: () => void;
}) {
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, { onClick });
    }
    return <button onClick={onClick}>{children}</button>;
}

export function DropdownMenuContent({ children, align = 'end', className, close }: {
    children: React.ReactNode;
    align?: 'start' | 'end';
    className?: string;
    close?: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.1 }}
            className={cn(
                "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-md p-1 text-slate-200 shadow-2xl ring-1 ring-black ring-opacity-5",
                align === 'end' ? "right-0" : "left-0",
                className
            )}
        >
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<any>, {
                        close
                    });
                }
                return child;
            })}
        </motion.div>
    );
}

export function DropdownMenuItem({ children, className, onClick, close }: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    close?: () => void;
}) {
    return (
        <button
            className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-slate-800 focus:bg-slate-800",
                className
            )}
            onClick={() => {
                onClick?.();
                close?.();
            }}
        >
            {children}
        </button>
    );
}
