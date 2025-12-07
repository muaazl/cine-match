import * as React from 'react';
import { cn } from '../../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot as SlotPrimitive } from '@radix-ui/react-slot';

const badgeVariants = cva(
  'inline-flex items-center justify-center border border-transparent font-medium rounded-full',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'bg-transparent border border-border text-foreground hover:bg-secondary/50',
      },
      size: {
        lg: 'px-4 py-1 text-sm',
        md: 'px-2.5 py-0.5 text-xs',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive : 'span';

  return (
    <Comp
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };