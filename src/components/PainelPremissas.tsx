"use client";

import type { Premissas, VersaoRegras } from "@/lib/tipos";

interface Props {
  premissas: Premissas;
  versao: VersaoRegras | null;
  onChange: (p: Premissas) => void;
}

/** Campo percentual: o usuário digita 12 e o valor guardado é 0,12. */
function CampoPct({ rotulo, valor, onChange, dica }: { rotulo: string; valor: number; onChange: (v: number) => void; dica?: string }) {
  return (
    <div className="campo">
      <label>{rotulo} (%)</label>
      <input
        type="number"
        step="0.5"
        min={0}
        value={Number.isFinite(valor) ? +(valor * 100).toFixed(4) : ""}
        onChange={(e) => onChange(e.target.value === "" ? Number.NaN : Number(e.target.value) / 100)}
      />
      {dica && <div className="dica">{dica}</div>}
    </div>
  );
}

export function PainelPremissas({ premissas: p, versao, onChange }: Props) {
  const set = <K extends keyof Premissas>(k: K, v: Premissas[K]) => onChange({ ...p, [k]: v });

  return (
    <div>
      <CampoPct rotulo="Perdas" valor={p.perdas} onChange={(v) => set("perdas", v)} dica="Férias, afastamentos e absenteísmo." />
      <div className="campo">
        <label>Fator de encargos</label>
        <input type="number" step="0.05" min={1} value={Number.isFinite(p.fatorEncargos) ? p.fatorEncargos : ""} onChange={(e) => set("fatorEncargos", e.target.value === "" ? Number.NaN : Number(e.target.value))} />
        <div className="dica">Custo total do empregado ÷ salário (ex.: 1,8).</div>
      </div>
      <CampoPct rotulo="Adicional de hora extra" valor={p.adicionalHoraExtra} onChange={(v) => set("adicionalHoraExtra", v)} dica="Padrão 50%; ajuste conforme a CCT." />
      <CampoPct rotulo="Margem de segurança" valor={p.margemSeguranca} onChange={(v) => set("margemSeguranca", v)} dica="Compensa restrições de escala não modeladas." />
      <CampoPct rotulo="Mix: parcela por contratação" valor={p.mixPercentualContratacao} onChange={(v) => set("mixPercentualContratacao", v)} dica="O restante do déficit vira hora extra." />
      <div className="campo">
        <label style={{ display: "flex", gap: 8, alignItems: "center", color: "inherit" }}>
          <input type="checkbox" checked={p.encargosSobreHoraExtra} onChange={(e) => set("encargosSobreHoraExtra", e.target.checked)} />
          Aplicar encargos sobre a hora extra
        </label>
      </div>
      {versao && (
        <div className="campo">
          <label>Divisor da hora por fase</label>
          {versao.fases.map((f) => (
            <div key={f.id} className="linha" style={{ marginBottom: 6 }}>
              <span style={{ flex: 1, fontSize: "0.85rem" }}>{f.nome}</span>
              <input
                className="curto"
                type="number"
                min={1}
                placeholder={String(f.divisorHora)}
                value={p.divisores[f.id] ?? ""}
                onChange={(e) => {
                  const divisores = { ...p.divisores };
                  if (e.target.value === "") delete divisores[f.id];
                  else divisores[f.id] = Number(e.target.value);
                  set("divisores", divisores);
                }}
              />
            </div>
          ))}
          <div className="dica">Em branco = padrão da regra legal. Premissa a validar com o jurídico.</div>
        </div>
      )}
    </div>
  );
}
