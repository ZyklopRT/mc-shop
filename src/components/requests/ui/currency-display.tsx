"use client";

import { getCurrencyConfig, formatPrice } from "~/lib/utils/request-status";

interface CurrencyDisplayProps {
  amount: number | null | undefined;
  currency: string;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function CurrencyDisplay({
  amount,
  currency,
  className = "",
  showIcon = true,
  size = "md",
}: CurrencyDisplayProps) {
  const config = getCurrencyConfig(currency);
  const formattedPrice = formatPrice(amount, currency);

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg font-semibold",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  if (!showIcon) {
    return (
      <span className={`${sizeClasses[size]} ${className}`}>
        {formattedPrice}
      </span>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 ${sizeClasses[size]} ${className}`}
    >
      {typeof config.icon === "string" ? (
        <div className={`rounded ${config.bgColor} ${iconSizes[size]}`} />
      ) : (
        <config.icon className={`${iconSizes[size]} ${config.iconColor}`} />
      )}
      <span>{formattedPrice}</span>
    </div>
  );
}

interface PriceComparisonProps {
  originalPrice: number | null | undefined;
  newPrice: number | null | undefined;
  currency: string;
  className?: string;
}

export function PriceComparison({
  originalPrice,
  newPrice,
  currency,
  className = "",
}: PriceComparisonProps) {
  if (!originalPrice && !newPrice) {
    return <span className={className}>No price specified</span>;
  }

  if (!originalPrice) {
    return (
      <CurrencyDisplay
        amount={newPrice}
        currency={currency}
        className={className}
      />
    );
  }

  if (!newPrice) {
    return (
      <CurrencyDisplay
        amount={originalPrice}
        currency={currency}
        className={className}
      />
    );
  }

  const isIncrease = newPrice > originalPrice;
  const isDecrease = newPrice < originalPrice;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <CurrencyDisplay
        amount={originalPrice}
        currency={currency}
        className="text-sm text-gray-500 line-through"
      />
      <span>→</span>
      <CurrencyDisplay
        amount={newPrice}
        currency={currency}
        className={
          isIncrease ? "text-red-600" : isDecrease ? "text-green-600" : ""
        }
      />
    </div>
  );
}
