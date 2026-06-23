import { forwardRef } from "react";
import { Input, type InputProps } from "./Input";

export type SearchInputProps = Omit<InputProps, "variant">;

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(props, ref) {
    return <Input ref={ref} variant="search" {...props} />;
  },
);
