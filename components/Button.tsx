import clsx from "clsx";

export function Button({ className, ...props }: any) {
  return (
    <button
      className={clsx(
        "bg-gradient-to-r from-cyan-500 to-blue-500",
        "inline-flex items-center gap-2 justify-center rounded-md py-2 px-3 text-sm outline-offset-2 transition active:transition-none",
        className
      )}
      {...props}
    />
  );
}
