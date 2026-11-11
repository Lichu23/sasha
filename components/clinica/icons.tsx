type IconProps = React.SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const ToothIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7.5 3.5c-2.2 0-3.5 1.7-3.5 4 0 2 .8 3.3 1.3 5.2.5 2 .7 7.8 2.4 7.8 1.4 0 1.3-4.6 2.3-5.6.5-.5 1.1-.5 1.6 0 1 1 .9 5.6 2.3 5.6 1.7 0 1.9-5.8 2.4-7.8.5-1.9 1.3-3.2 1.3-5.2 0-2.3-1.3-4-3.5-4-1.7 0-2.3.9-4 .9s-2.3-.9-4-.9Z" />
  </Icon>
);

export const BackIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m15 5-7 7 7 7" />
  </Icon>
);

export const SendIcon = (p: IconProps) => (
  <Icon {...p} fill="currentColor" stroke="none">
    <path d="M3.4 20.4 21 12 3.4 3.6 3.3 10l12.6 2-12.6 2 .1 6.4Z" />
  </Icon>
);

export const MicIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
  </Icon>
);

export const DoubleCheckIcon = (p: IconProps) => (
  <svg viewBox="0 0 18 11" width="16" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="m1 6 3 3 6.5-7.5M7 8.5l1 .5L14.5 1.5" />
  </svg>
);

export const VerifiedIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...p}>
    <path fill="currentColor" d="m12 1.8 2.4 1.7 2.9-.1 1 2.8 2.4 1.7-.8 2.8.8 2.8-2.4 1.7-1 2.8-2.9-.1L12 22.2l-2.4-1.7-2.9.1-1-2.8-2.4-1.7.8-2.8-.8-2.8 2.4-1.7 1-2.8 2.9.1L12 1.8Z" />
    <path d="m8.3 12.2 2.5 2.5 4.9-5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);

export const ChevronIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

export const CalendarIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Icon>
);
