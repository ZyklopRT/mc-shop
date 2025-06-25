// Helper function to generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to format OTP message for Minecraft using tellraw
export function formatOTPTellrawCommand(
  playerName: string,
  otpCode: string,
): string {
  const tellrawData = {
    text: "",
    extra: [
      { text: "[MC-Shop] ", color: "green", bold: true },
      { text: "Your verification code is: ", color: "white" },
      {
        text: otpCode,
        color: "yellow",
        bold: true,
        clickEvent: {
          action: "copy_to_clipboard",
          value: otpCode,
        },
        hoverEvent: {
          action: "show_text",
          value: "Click to copy OTP code",
        },
      },
      { text: ". This code expires in 10 minutes.", color: "white" },
    ],
  };

  return `tellraw ${playerName} ${JSON.stringify(tellrawData)}`;
}

// Helper function to check if OTP is expired
export function isOTPExpired(expiresAt: Date): boolean {
  return expiresAt < new Date();
}

// Helper function to create OTP expiration date (10 minutes from now)
export function createOTPExpiration(): Date {
  return new Date(Date.now() + 10 * 60 * 1000);
}
