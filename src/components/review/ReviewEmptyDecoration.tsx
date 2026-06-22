type ReviewEmptyDecorationProps = {
  visible: boolean;
  fillRemaining?: boolean;
};

export function ReviewEmptyDecoration({
  visible,
  fillRemaining = false,
}: ReviewEmptyDecorationProps) {
  if (!visible) return null;

  return (
    <div
      className={
        fillRemaining
          ? "flex min-h-0 flex-1 items-start justify-center overflow-hidden pt-1"
          : "flex justify-center pt-0"
      }
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/review/review-background-alphabet.png"
        alt=""
        className={
          fillRemaining
            ? "w-full max-w-[420px] max-h-full object-contain object-top opacity-90"
            : "h-auto w-full max-w-[390px] max-h-[min(52dvh,560px)] object-contain opacity-90"
        }
      />
    </div>
  );
}
