import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { DiagnosticoRapido } from "@/components/publico/DiagnosticoRapido";
import { LinhaDoTempo } from "@/components/publico/LinhaDoTempo";
import { linkWhatsApp } from "@/lib/contato";
import { AVISO_JURIDICO, LIMITACOES } from "@/lib/textos";

export const metadata: Metadata = {
  title: "Jornada · Impacto do fim da escala 6x1",
  description:
    "Quantas pessoas a mais cada unidade precisa com a nova jornada, quanto custa por mês e o que sai mais barato: contratar, hora extra, reduzir horário ou um mix. Diagnóstico rápido grátis.",
};

const WHATSAPP_PILOTO = linkWhatsApp("Olá! Vi o site do Jornada e quero saber como funciona o piloto para a minha rede.");

const ARMADILHAS = [
  {
    titulo: "A sobra de um setor não cobre a falta de outro",
    texto:
      "Somando a loja inteira, pode parecer que sobra gente. Separando caixa e açougue, balconista e farmacêutico, cozinha e salão, aparece a falta que a planilha esconde.",
  },
  {
    titulo: "O pico de fim de ano muda a conta",
    texto: "Com o mesmo quadro e o horário estendido do Natal ou de feriados, a falta pode ser várias vezes maior. Veja antes onde a operação não fecha.",
  },
  {
    titulo: "Hora extra tem limite legal",
    texto:
      "Cobrir a diferença só com hora extra parece barato até passar do limite diário. O cenário acima do limite aparece no resultado, mas nunca é indicado como o mais barato.",
  },
];

const PASSOS = [
  {
    titulo: "Envie dois arquivos",
    texto: "cobertura.csv (pessoas por faixa horária e setor, em cada unidade) e quadro.csv (cargo, quantidade, salário médio e jornada). Também dá para cadastrar na tela.",
  },
  {
    titulo: "Calculamos loja a loja",
    texto: "Pessoas necessárias em cada fase da jornada, por setor, na semana típica e no pico, e o custo mensal de contratar, fazer hora extra, reduzir horário ou um mix.",
  },
  {
    titulo: "Decida com a conta aberta",
    texto: "Painel da rede, por bandeira e regional, memória de cálculo passo a passo e relatório em PDF e CSV com todas as premissas usadas.",
  },
];

const PUBLICOS = [
  { titulo: "Farmácias regionais", texto: "Abertas das 7h às 23h, todos os dias, com farmacêutico presente durante todo o horário. O balconista não o substitui." },
  { titulo: "Supermercados regionais", texto: "Caixa, açougue, padaria e reposição com coberturas diferentes, e o Natal coincidindo com a transição." },
  { titulo: "Restaurantes e franquias", texto: "Cozinha e salão, noites que viram o dia e uma visão por bandeira para a franqueadora." },
  { titulo: "Contadores e consultorias", texto: "Um diagnóstico com premissas explícitas para apresentar a vários clientes, sem montar uma planilha para cada um." },
];

const PERGUNTAS = [
  {
    pergunta: "Já temos uma planilha. O que muda?",
    resposta:
      "A planilha costuma somar a loja inteira e olhar a semana típica. O Jornada separa por setor, para que sobra num setor não esconda falta em outro, simula a semana de pico com o mesmo quadro e respeita o limite legal de hora extra ao indicar a alternativa mais barata.",
  },
  {
    pergunta: "E a convenção coletiva da minha categoria?",
    resposta:
      "As premissas são editáveis: perdas, encargos, adicional de hora extra, margem de segurança, divisores e o percentual do mix. Regras específicas por convenção coletiva estão no roadmap.",
  },
  {
    pergunta: "Isso é um parecer jurídico?",
    resposta: "Não. As regras legais (datas, jornadas, divisores e limite de hora extra) são premissas que devem ser validadas com o jurídico da empresa e com a convenção coletiva aplicável.",
  },
  {
    pergunta: "E a LGPD?",
    resposta:
      "Trabalhamos com salário médio por cargo, sem dados de pessoas. Salários não vão para log, cada rede só vê os próprios dados e a conta pode ser apagada por inteiro a qualquer momento. O diagnóstico rápido desta página não grava nada.",
  },
  {
    pergunta: "O Jornada gera a escala?",
    resposta: "Não. Ele diz quantas pessoas faltam em cada unidade e fase, quanto isso custa e qual alternativa sai mais barata. A escala nominal continua com a sua equipe ou o seu sistema de ponto.",
  },
];

export default function PaginaPublica() {
  return (
    <div className="pub">
      <header className="topo">
        <div className="topo-interno pub-topo">
          <Link href="/" className="marca" aria-label="Jornada: início">
            <Logo />
          </Link>
          <nav className="nav pub-nav" aria-label="Seções">
            <a href="#diagnostico">Diagnóstico</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#para-quem">Para quem</a>
            <a href="#perguntas">Perguntas</a>
          </nav>
          <div className="pub-topo-acoes">
            <Link href="/entrar" className="botao secundario">
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <main className="pub-main">
      <section className="pub-hero">
        <div className="pub-largura">
          <p className="pub-sobretitulo">Fim da escala 6x1, sem redução salarial</p>
          <h1>Quantas pessoas a mais cada loja vai precisar, e quanto isso custa?</h1>
          <p className="pub-lead">
            O Jornada calcula, unidade a unidade e para a rede inteira, o impacto da nova jornada em cada fase da transição e compara quatro saídas: contratar, hora extra,
            reduzir horário ou um mix.
          </p>
          <div className="acoes">
            <a className="botao pub-botao-grande" href="#diagnostico">
              Fazer o diagnóstico rápido
            </a>
            <a className="botao secundario pub-botao-grande" href={linkWhatsApp()} target="_blank" rel="noopener noreferrer">
              Falar no WhatsApp
            </a>
          </div>
          <p className="dica pub-hero-dica">Cerca de 3 minutos, sem cadastro e sem planilha.</p>
          <LinhaDoTempo />
        </div>
      </section>

      <section className="pub-secao">
        <div className="pub-largura">
          <h2 className="pub-h2">Por que a conta simples engana</h2>
          <div className="grade grade-3">
            {ARMADILHAS.map((a) => (
              <div key={a.titulo} className="cartao pub-card">
                <h3>{a.titulo}</h3>
                <p>{a.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pub-secao pub-secao-destaque" id="diagnostico">
        <div className="pub-largura">
          <h2 className="pub-h2">Diagnóstico rápido</h2>
          <p className="subtitulo">
            Responda sobre uma unidade típica da sua rede. O cálculo é o mesmo do simulador completo, com as regras legais vigentes, e nada do que você digitar é gravado.
          </p>
          <DiagnosticoRapido />
        </div>
      </section>

      <section className="pub-secao" id="como-funciona">
        <div className="pub-largura">
          <h2 className="pub-h2">Como funciona o simulador completo</h2>
          <ol className="pub-passos">
            {PASSOS.map((p) => (
              <li key={p.titulo} className="cartao pub-card">
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="pub-secao" id="para-quem">
        <div className="pub-largura">
          <h2 className="pub-h2">Feito para redes que operam em turnos</h2>
          <div className="grade pub-grade-publicos">
            {PUBLICOS.map((p) => (
              <div key={p.titulo} className="cartao pub-card">
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </div>
            ))}
          </div>

          <div className="cartao pub-cta pub-piloto">
            <div>
              <h3>Piloto com 3 a 5 unidades</h3>
              <ul>
                <li>Você envia os dois arquivos CSV.</li>
                <li>Em uma semana: relatório por unidade, consolidado da rede, alternativas de custo e o cenário de Natal.</li>
                <li>O valor do piloto é abatido da implantação.</li>
              </ul>
              <p className="pub-piloto-menor">
                <strong>Rede com 1 ou 2 lojas?</strong> Fazemos um diagnóstico das suas unidades, com o mesmo relatório. Chame no WhatsApp.
              </p>
            </div>
            <div className="acoes">
              <a className="botao pub-botao-grande pub-botao-whatsapp" href={WHATSAPP_PILOTO} target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="pub-secao" id="perguntas">
        <div className="pub-largura">
          <h2 className="pub-h2">Perguntas frequentes</h2>
          <div className="pub-perguntas">
            {PERGUNTAS.map((p) => (
              <details key={p.pergunta} className="cartao">
                <summary>{p.pergunta}</summary>
                <p>{p.resposta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      </main>

      <a className="pub-whatsapp-flutuante" href={linkWhatsApp()} target="_blank" rel="noopener noreferrer" aria-label="Falar com o Jornada no WhatsApp">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3c-.2.3-.9.9-.9 2.2s1 2.6 1.1 2.7c.1.2 1.9 2.9 4.6 4 1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.4-.3Z"
          />
        </svg>
        <span>WhatsApp</span>
      </a>

      <footer className="rodape">
        <p>
          <strong>Aviso:</strong> {AVISO_JURIDICO}
        </p>
        <p>
          <strong>Limitações:</strong> {LIMITACOES}
        </p>
        <p>
          <Link href="/entrar">Entrar</Link> · <Link href="/cadastro">Criar conta</Link>
        </p>
      </footer>
    </div>
  );
}
