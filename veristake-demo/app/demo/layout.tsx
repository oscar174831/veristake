import { Providers } from "@/app/providers";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
