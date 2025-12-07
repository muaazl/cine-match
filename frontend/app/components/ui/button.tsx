import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { Slot as SlotPrimitive } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'cursor-pointer group whitespace-nowrap focus-visible:outline-hidden inline-flex items-center justify-center has-data-[arrow=true]:justify-between whitespace-nowrap text-sm font-medium ring-offset-background transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-60 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
        outline: 'bg-background text-accent-foreground border border-input hover:bg-accent',
        ghost: 'text-accent-foreground hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        lg: 'h-10 rounded-md px-4 text-sm gap-1.5',
        md: 'h-9 rounded-md px-3 gap-1.5',
        sm: 'h-8 rounded-md px-2.5 gap-1.5 text-xs',
        icon: 'h-9 w-9 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? SlotPrimitive : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

interface ButtonArrowProps extends React.SVGProps<SVGSVGElement> {
  icon?: LucideIcon;
}

function ButtonArrow({ icon: Icon = ChevronDown, className, ...props }: ButtonArrowProps) {
  return <Icon className={cn('ms-auto -me-1 h-4 w-4', className)} {...props} />;
}

export { Button, ButtonArrow, buttonVariants };