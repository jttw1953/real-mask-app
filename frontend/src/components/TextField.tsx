// TextField.tsx
type Props = React.InputHTMLAttributes<HTMLInputElement> & { value: string };
export default function TextField(props: Props) {
  return (
    <input
      {...props}
      className={"w-full rounded-xl bg-slate-800 text-slate-100 placeholder:text-slate-500 px-4 py-3 " +
        "outline-none ring-1 ring-black/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] focus:ring-2 focus:ring-blue-500 " +
        (props.className ?? "")}
    />
  );
}
