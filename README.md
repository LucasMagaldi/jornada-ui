# jornada-ui

Interface web do **Simulador de impacto do fim da escala 6x1**. Usa a [jornada-api](https://github.com/LucasMagaldi/jornada-api),
onde estão o motor de cálculo, as regras legais versionadas e o registro de decisões (`DECISOES.md`).

> Não constitui parecer jurídico.

## Como rodar

```bash
cp .env.example .env.local      # API_URL=http://localhost:3333
npm install
npm run dev                     # http://localhost:3000
```

Com a API rodando e o seed aplicado, entre com `demo@exemplo.com` / `demo12345`.

## Telas

- **Cadastro / Entrar**: e-mail e senha; cada conta é uma rede.
- **Importar CSV**: modelos para download (`cobertura.csv` e `quadro.csv`), validação antes de gravar, importação tudo-ou-nada.
- **Unidades**: horário por dia da semana, cobertura mínima por faixa (atalhos "mesma cobertura todos os dias",
  "copiar este dia para todos" e "duplicar de outra unidade"), quadro atual, horário reduzido para o cenário e resultado com memória de cálculo.
- **Resultado**: três fotografias (hoje, fase 1, fase 2), comparação dos quatro cenários, tabela por unidade com memória de cálculo,
  premissas editáveis com recálculo imediato, premissas utilizadas, limitações e exportação em PDF e CSV.
- **Conta**: sair e excluir conta e dados (LGPD).

## Arquitetura

Todas as chamadas vão para `/api/*`, que o Next.js encaminha para `API_URL` (`next.config.mjs`). Assim o cookie de sessão
(httpOnly) fica no domínio da interface, sem CORS. `src/lib/tipos.ts` é cópia dos tipos do motor da API: mantenha os dois iguais.
