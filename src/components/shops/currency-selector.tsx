"use client";

import { Coins } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { CURRENCY_TYPES, currencyDisplayNames } from "~/lib/validations/shop";

interface CurrencySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const getCurrencyIcon = (currency: string) => {
  switch (currency) {
    case CURRENCY_TYPES.EMERALD_BLOCKS:
      return <div className="h-4 w-4 rounded bg-green-600" />;
    case CURRENCY_TYPES.EMERALDS:
    default:
      return <Coins className="h-4 w-4 text-green-500" />;
  }
};

export function CurrencySelector({
  value,
  onValueChange,
  placeholder = "Select currency",
  disabled = false,
}: CurrencySelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {Object.values(CURRENCY_TYPES).map((currency) => (
          <SelectItem key={currency} value={currency}>
            <div className="flex items-center gap-2">
              {getCurrencyIcon(currency)}
              <span>{currencyDisplayNames[currency]}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
