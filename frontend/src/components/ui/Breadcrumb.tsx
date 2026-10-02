import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  homeHref?: string;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  homeHref = '/',
  className = '',
}) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-text-secondary ${className}`}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li>
          <Link
            to={homeHref}
            className="hover:text-text-primary transition-colors flex items-center"
            aria-label="Home"
          >
            <Home className="h-3.5 w-3.5" />
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-text-muted shrink-0" />
              {item.href && !isLast ? (
                <Link to={item.href} className="hover:text-text-primary transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-text-primary font-medium' : ''}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
