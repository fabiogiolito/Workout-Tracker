export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-5 h-5 border-2 border-neutral-200 border-t-black rounded-full animate-spin" />
    </div>
  )
}
