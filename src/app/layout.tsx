import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simulador 6x1",
  description: "Impacto do fim da escala 6x1 em pessoal e custo, por unidade e consolidado.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
