import { cn } from '@/lib/utils';

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export function SelectOption({
  className,
  ...props
}: React.OptionHTMLAttributes<HTMLOptionElement>) {
  return <option className={cn('bg-popover text-popover-foreground', className)} {...props} />;
}
