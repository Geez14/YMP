"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes } from "react";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

export function NyxContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx("rounded-2xl p-4", className)}
      {...props}
    />
  );
}

export function NyxButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx(
        "rounded-full bg-[#dbe2fa] px-4 py-2 text-sm font-semibold text-[#4a5165]",
        "transition hover:-translate-y-0.5 hover:bg-[#dfe3e9]",
        className,
      )}
      {...props}
    />
  );
}

export function NyxIconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center rounded-xl bg-[#eef1f6] px-3 py-2 text-sm text-[#4a5165]",
        "transition hover:-translate-y-0.5 hover:bg-[#dfe3e9]",
        className,
      )}
      {...props}
    />
  );
}

export function NyxSlider({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="range"
      className={cx("w-full accent-[#3652be]", className)}
      {...props}
    />
  );
}

export function NyxToggle({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx(
        "rounded-full bg-[#eef1f6] px-3 py-1.5 text-xs text-[#4a5165]",
        "transition hover:bg-[#dfe3e9]",
        className,
      )}
      {...props}
    />
  );
}
