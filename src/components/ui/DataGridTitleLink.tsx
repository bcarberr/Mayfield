import { TruncatedText } from "./TruncatedText";

export function DataGridTitleLink({
  children,
  onClick,
}: {
  children: string;
  onClick: () => void;
}) {
  return (
    <TruncatedText
      as="button"
      className="w-full text-left text-sm font-semibold text-interactive-active hover:underline"
      onClick={onClick}
    >
      {children}
    </TruncatedText>
  );
}
