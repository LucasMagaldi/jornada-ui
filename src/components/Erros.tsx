import { ErroApi } from "@/lib/api";

export function Erros({ erro }: { erro: unknown }) {
  if (!erro) return null;
  const e = erro instanceof ErroApi ? erro : new ErroApi(0, erro instanceof Error ? erro.message : String(erro));
  return (
    <div className="erro" role="alert">
      <strong>{e.message}</strong>
      {e.detalhes.length > 0 && (
        <ul>
          {e.detalhes.slice(0, 30).map((d, i) => (
            <li key={i}>{d}</li>
          ))}
          {e.detalhes.length > 30 && <li>… e mais {e.detalhes.length - 30} erro(s).</li>}
        </ul>
      )}
    </div>
  );
}
