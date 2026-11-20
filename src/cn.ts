// class নামগুলো জোড়া লাগায়; false/null/undefined বাদ যায়
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
