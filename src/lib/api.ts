"use client";

export class ErroApi extends Error {
  constructor(public status: number, mensagem: string, public detalhes: string[] = []) {
    super(mensagem);
  }
}

/** Chama a jornada-api via proxy /api (cookie de sessão httpOnly). */
export async function api<T>(caminho: string, opcoes: { method?: string; body?: unknown } = {}): Promise<T> {
  const resp = await fetch(`/api${caminho}`, {
    method: opcoes.method ?? "GET",
    headers: opcoes.body !== undefined ? { "content-type": "application/json" } : undefined,
    body: opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined,
    credentials: "same-origin",
  });
  if (resp.status === 401 && !caminho.startsWith("/auth/")) {
    window.location.href = "/entrar";
    throw new ErroApi(401, "Sessão expirada");
  }
  const dados = resp.headers.get("content-type")?.includes("application/json") ? await resp.json() : null;
  if (!resp.ok) {
    const detalhes = Array.isArray(dados?.detalhes) ? dados.detalhes : [];
    throw new ErroApi(resp.status, dados?.erro ?? `Erro ${resp.status}`, detalhes);
  }
  return dados as T;
}
