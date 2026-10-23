"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatarData, formatarNumero } from "@/lib/formato";
import type { RespostaRegrasPublicas } from "@/lib/respostas";

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Fases da transição lidas da configuração legal vigente (regra 3, D-37). Sem resposta da API,
 * não mostra números. A chamada também acorda a API antes do diagnóstico.
 */
export function LinhaDoTempo() {
  const [regras, setRegras] = useState<RespostaRegrasPublicas | null>(null);

  useEffect(() => {
    api<RespostaRegrasPublicas>("/publico/regras").then(setRegras).catch(() => setRegras(null));
  }, []);

  if (!regras) return <div className="pub-linha-tempo pub-linha-tempo-vazia" aria-hidden="true" />;
  const hoje = Date.parse(regras.dataReferencia);
  return (
    <ol className="pub-linha-tempo" aria-label="Fases da transição">
      {regras.vigente.fases.map((f) => {
        const dias = f.inicio ? Math.round((Date.parse(f.inicio) - hoje) / DIA_MS) : null;
        return (
          <li key={f.id} className={dias === null || dias <= 0 ? "vigente" : ""}>
            <span className="pub-fase-quando">{f.inicio ? `a partir de ${formatarData(f.inicio)}` : "hoje"}</span>
            <strong>{formatarNumero(f.jornadaSemanal, 0)} h/semana</strong>
            <span>
              escala {f.diasTrabalhoSemana}x{7 - f.diasTrabalhoSemana}
            </span>
            {dias !== null && dias > 0 && <span className="selo alerta">faltam {dias} dias</span>}
          </li>
        );
      })}
    </ol>
  );
}
