// Popula o banco com dados de exemplo para desenvolvimento, demonstração e o vídeo.
//
// ATENÇÃO: apaga todas as tabelas antes de inserir. Nunca rodar contra um banco
// com dados reais.
//
// As datas são relativas ao dia em que o seed roda: dois meses de histórico
// (com mensalidades fechadas) e duas semanas de viagens à frente.
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  CategoriaDespesa,
  MotivoJustificativa,
  OrigemDeclaracao,
  PerfilUsuario,
  PrismaClient,
  SituacaoDiaria,
  StatusAluno,
  StatusJustificativa,
  StatusMensalidade,
  StatusVeiculo,
  StatusViagem,
  TipoVeiculo,
  Turno,
} from "../lib/generated/prisma/client";
import { dia, diaSemanaIso, hojeLocal, horaLocal, somarDias, UM_DIA_MS as UM_DIA } from "../lib/datas";

config({ path: ".env.local" });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// ---------------------------------------------------------------- Datas
// Os horários abaixo são escritos no horário de Brasília; lib/datas converte.

/** Coluna @db.Time: só a hora importa, a data é descartada pelo Postgres. */
function horario(hhmm: string) {
  return horaLocal(new Date(0), hhmm);
}

function competenciaDe(data: Date) {
  return data.toISOString().slice(0, 7);
}

const agora = new Date();
const hoje = hojeLocal(agora);
const ano = hoje.getUTCFullYear();
const mes = hoje.getUTCMonth() + 1;

// Date.UTC aceita mês fora de 1..12 e ajusta o ano sozinho.
const inicioDoMes = (deslocamento: number) => dia(ano, mes + deslocamento, 1);
const mesRetrasado = inicioDoMes(-2);
const mesAnterior = inicioDoMes(-1);
const mesAtual = inicioDoMes(0);
const fimDasViagens = somarDias(hoje, 14);

// ---------------------------------------------------------------- Dinheiro
// Valores em centavos (inteiros) e convertidos para string só na gravação:
// somar Float não fecha centavo.

const reais = (centavos: number) => (centavos / 100).toFixed(2);

// ---------------------------------------------------------------- CPF
// Gera CPFs com dígitos verificadores válidos, para não quebrar a validação do
// módulo de Alunos.

function cpf(base: string) {
  const nums = base.split("").map(Number);
  for (const tamanho of [9, 10]) {
    const soma = nums
      .slice(0, tamanho)
      .reduce((total, n, i) => total + n * (tamanho + 1 - i), 0);
    const resto = (soma * 10) % 11;
    nums.push(resto === 10 ? 0 : resto);
  }
  return nums.join("");
}

// ---------------------------------------------------------------- Seed

async function limpar() {
  // Ordem inversa das dependências.
  await prisma.diaria.deleteMany();
  await prisma.mensalidade.deleteMany();
  await prisma.justificativa.deleteMany();
  await prisma.declaracao.deleteMany();
  await prisma.viagem.deleteMany();
  await prisma.planoRota.deleteMany();
  await prisma.rotaPonto.deleteMany();
  await prisma.rota.deleteMany();
  await prisma.despesa.deleteMany();
  await prisma.ponto.deleteMany();
  await prisma.aluno.deleteMany();
  await prisma.veiculo.deleteMany();
  await prisma.instituicao.deleteMany();
  await prisma.usuario.deleteMany();
}

async function main() {
  await limpar();

  // ---------- Admin
  const admin = await prisma.usuario.create({
    data: {
      nome: "Administrador Busaum",
      email: "admin@busaum.dev",
      emailVerificado: true,
      perfil: PerfilUsuario.ADMIN,
    },
  });
  const criadoPor = admin.id;

  // ---------- Instituições
  const urs = await prisma.instituicao.create({
    data: { nome: "Universidade Regional do Sul", sigla: "URS", cidade: "Tubarão" },
  });
  const ifcl = await prisma.instituicao.create({
    data: { nome: "Instituto Federal Campus Litoral", sigla: "IFCL", cidade: "Laguna" },
  });

  // ---------- Veículos
  const onibus = await prisma.veiculo.create({
    data: {
      placa: "BUS1A23",
      tipo: TipoVeiculo.ONIBUS,
      modelo: "Marcopolo Torino",
      capacidade: 44,
      criadoPor,
    },
  });
  const van = await prisma.veiculo.create({
    data: {
      placa: "VAN2B34",
      tipo: TipoVeiculo.VAN,
      modelo: "Mercedes-Benz Sprinter 416",
      capacidade: 15,
      criadoPor,
    },
  });
  const micro = await prisma.veiculo.create({
    data: {
      placa: "MIC3C45",
      tipo: TipoVeiculo.ONIBUS,
      modelo: "Volare W9",
      capacidade: 28,
      status: StatusVeiculo.MANUTENCAO,
      criadoPor,
    },
  });

  // ---------- Pontos (de cadastro completo até só a descrição)
  const praca = await prisma.ponto.create({
    data: {
      descricao: "Praça da Matriz",
      logradouro: "Rua Ernesto Lacombe",
      numero: "s/n",
      bairro: "Centro",
      cidade: "Capivari de Baixo",
      uf: "SC",
      cep: "88745000",
      referencia: "Em frente à igreja",
      criadoPor,
    },
  });
  const posto = await prisma.ponto.create({
    data: {
      descricao: "Posto da BR-101 (km 330)",
      referencia: "Ao lado da loja de conveniência",
      criadoPor,
    },
  });
  const terminal = await prisma.ponto.create({
    data: { descricao: "Terminal Rodoviário", cidade: "Capivari de Baixo", uf: "SC", criadoPor },
  });
  const portaoUrs = await prisma.ponto.create({
    data: {
      descricao: "Portão principal da URS",
      cidade: "Tubarão",
      uf: "SC",
      instituicaoId: urs.id,
      criadoPor,
    },
  });
  const entradaIfcl = await prisma.ponto.create({
    data: { descricao: "Entrada do IFCL", cidade: "Laguna", uf: "SC", instituicaoId: ifcl.id, criadoPor },
  });

  // ---------- Rotas e trajetos
  const noturna = await prisma.rota.create({
    data: {
      nome: "Noturno Capivari → URS",
      veiculoId: onibus.id,
      horarioIda: horario("18:00"),
      horarioVolta: horario("22:40"),
      diasOperacao: [1, 2, 3, 4, 5],
      antecedenciaMinutos: 120,
      valorDiaria: reais(1800),
      criadoPor,
      pontos: {
        create: [
          { pontoId: praca.id, ordem: 1 },
          { pontoId: posto.id, ordem: 2 },
          { pontoId: terminal.id, ordem: 3 },
          { pontoId: portaoUrs.id, ordem: 4 },
        ],
      },
    },
  });
  const matutina = await prisma.rota.create({
    data: {
      nome: "Matutino Capivari → IFCL",
      veiculoId: van.id,
      horarioIda: horario("06:30"),
      horarioVolta: horario("12:30"),
      diasOperacao: [1, 2, 3, 4, 5],
      antecedenciaMinutos: 60,
      valorDiaria: reais(2400),
      criadoPor,
      pontos: {
        create: [
          { pontoId: terminal.id, ordem: 1 },
          { pontoId: praca.id, ordem: 2 },
          { pontoId: entradaIfcl.id, ordem: 3 },
        ],
      },
    },
  });

  // ---------- Alunos
  type DadosAluno = {
    nome: string;
    email: string;
    cpfBase: string;
    telefone: string;
    matricula: string;
    curso: string;
    turno: Turno;
    instituicaoId: string;
    status?: StatusAluno;
  };

  async function criarAluno(d: DadosAluno) {
    return prisma.aluno.create({
      data: {
        cpf: cpf(d.cpfBase),
        telefone: d.telefone,
        matricula: d.matricula,
        curso: d.curso,
        turno: d.turno,
        status: d.status ?? StatusAluno.ATIVO,
        inicioEm: mesRetrasado,
        criadoPor,
        instituicao: { connect: { id: d.instituicaoId } },
        usuario: {
          create: { nome: d.nome, email: d.email, perfil: PerfilUsuario.ALUNO, emailVerificado: true },
        },
      },
      include: { usuario: true },
    });
  }

  const ana = await criarAluno({
    nome: "Ana Souza", email: "ana.souza@aluno.busaum.dev", cpfBase: "529982247",
    telefone: "48991010001", matricula: "URS2023001", curso: "Direito",
    turno: Turno.NOTURNO, instituicaoId: urs.id,
  });
  const bruno = await criarAluno({
    nome: "Bruno Lima", email: "bruno.lima@aluno.busaum.dev", cpfBase: "111444777",
    telefone: "48991010002", matricula: "URS2022045", curso: "Engenharia Civil",
    turno: Turno.NOTURNO, instituicaoId: urs.id,
  });
  const carla = await criarAluno({
    nome: "Carla Mendes", email: "carla.mendes@aluno.busaum.dev", cpfBase: "390533447",
    telefone: "48991010003", matricula: "URS2024012", curso: "Psicologia",
    turno: Turno.NOTURNO, instituicaoId: urs.id,
  });
  const diego = await criarAluno({
    nome: "Diego Ramos", email: "diego.ramos@aluno.busaum.dev", cpfBase: "714602380",
    telefone: "48991010004", matricula: "IFCL2024108", curso: "Técnico em Informática",
    turno: Turno.MATUTINO, instituicaoId: ifcl.id,
  });
  const eduarda = await criarAluno({
    nome: "Eduarda Costa", email: "eduarda.costa@aluno.busaum.dev", cpfBase: "245876190",
    telefone: "48991010005", matricula: "IFCL2023077", curso: "Licenciatura em Química",
    turno: Turno.MATUTINO, instituicaoId: ifcl.id,
  });
  // Inativo e sem plano: aparece no cadastro, fica fora da apuração.
  await criarAluno({
    nome: "Felipe Rocha", email: "felipe.rocha@aluno.busaum.dev", cpfBase: "863015472",
    telefone: "48991010006", matricula: "URS2021230", curso: "Administração",
    turno: Turno.NOTURNO, instituicaoId: urs.id, status: StatusAluno.INATIVO,
  });

  // ---------- Planos
  const inicioDosPlanos = horaLocal(mesRetrasado, "00:00");
  // Carla troca de plano no dia 15 do mês anterior, às 19h: a viagem desse dia
  // já tinha passado do prazo, então ainda é cobrada pelo plano antigo.
  const trocaDaCarla = horaLocal(dia(ano, mes - 1, 15), "19:00");

  await prisma.planoRota.createMany({
    data: [
      {
        alunoId: ana.id, rotaId: noturna.id, pontoEmbarqueId: praca.id,
        pontoDestinoId: portaoUrs.id, diasSemana: [1, 2, 3, 4, 5],
        vigenteDe: inicioDosPlanos, criadoPor,
      },
      {
        alunoId: bruno.id, rotaId: noturna.id, pontoEmbarqueId: posto.id,
        pontoDestinoId: portaoUrs.id, diasSemana: [2, 4],
        vigenteDe: inicioDosPlanos, criadoPor,
      },
      {
        alunoId: carla.id, rotaId: noturna.id, pontoEmbarqueId: terminal.id,
        pontoDestinoId: portaoUrs.id, diasSemana: [1, 2, 3, 4, 5],
        vigenteDe: inicioDosPlanos, vigenteAte: trocaDaCarla, criadoPor,
      },
      {
        alunoId: carla.id, rotaId: noturna.id, pontoEmbarqueId: terminal.id,
        pontoDestinoId: portaoUrs.id, diasSemana: [1, 3, 5],
        vigenteDe: trocaDaCarla, criadoPor,
      },
      {
        // Volta para um ponto diferente do embarque.
        alunoId: diego.id, rotaId: matutina.id, pontoEmbarqueId: terminal.id,
        pontoDestinoId: entradaIfcl.id, pontoRetornoId: praca.id,
        diasSemana: [1, 2, 3, 4, 5], vigenteDe: inicioDosPlanos, criadoPor,
      },
      {
        alunoId: eduarda.id, rotaId: matutina.id, pontoEmbarqueId: praca.id,
        pontoDestinoId: entradaIfcl.id, diasSemana: [1, 2, 3],
        vigenteDe: inicioDosPlanos, criadoPor,
      },
    ],
  });
  const planos = await prisma.planoRota.findMany();

  // ---------- Viagens: do início do mês retrasado até daqui a duas semanas
  const rotas = [
    { rota: noturna, ida: "18:00", volta: "22:40", veiculo: onibus },
    { rota: matutina, ida: "06:30", volta: "12:30", veiculo: van },
  ];
  // Feriado: a primeira segunda-feira do mês anterior é cancelada no noturno.
  let feriado = mesAnterior;
  while (diaSemanaIso(feriado) !== 1) feriado = somarDias(feriado, 1);

  const dadosViagens = [];
  for (const { rota, ida, volta, veiculo } of rotas) {
    for (let d = mesRetrasado; d <= fimDasViagens; d = somarDias(d, 1)) {
      if (!rota.diasOperacao.includes(diaSemanaIso(d))) continue;
      const horarioIda = horaLocal(d, ida);
      const horarioVolta = horaLocal(d, volta);
      const cancelada = rota.id === noturna.id && d.getTime() === feriado.getTime();
      dadosViagens.push({
        rotaId: rota.id,
        veiculoId: veiculo.id,
        data: d,
        horarioIda,
        horarioVolta,
        prazoDeclaracao: new Date(horarioIda.getTime() - rota.antecedenciaMinutos * 60 * 1000),
        capacidade: veiculo.capacidade,
        status: cancelada
          ? StatusViagem.CANCELADA
          : horarioVolta < agora
            ? StatusViagem.REALIZADA
            : StatusViagem.AGENDADA,
        motivoCancelamento: cancelada ? "Feriado municipal" : null,
      });
    }
  }
  const viagens = await prisma.viagem.createManyAndReturn({ data: dadosViagens });

  /** N-ésima viagem (a partir de 0) da rota no intervalo, no dia da semana pedido. */
  function viagemEm(rotaId: string, de: Date, ate: Date, diaIso: number, n = 0) {
    const encontradas = viagens.filter(
      (v) => v.rotaId === rotaId && v.data >= de && v.data < ate && diaSemanaIso(v.data) === diaIso,
    );
    return encontradas[n];
  }
  /** Próxima viagem da rota ainda dentro do prazo de declaração. */
  function proximaViagem(rotaId: string, diaIso?: number) {
    return viagens.find(
      (v) =>
        v.rotaId === rotaId &&
        v.prazoDeclaracao > agora &&
        (diaIso === undefined || diaSemanaIso(v.data) === diaIso),
    );
  }
  function antesDoPrazo(viagem: { prazoDeclaracao: Date }, horas: number) {
    return new Date(viagem.prazoDeclaracao.getTime() - horas * 60 * 60 * 1000);
  }

  // ---------- Declarações e justificativas
  // Ausência = usaIda e usaVolta falsos. Avulso = dia não contratado com uso.

  // Ana falta na 2ª terça do mês anterior com atestado aprovado → diária isenta.
  const faltaAna = viagemEm(noturna.id, mesAnterior, mesAtual, 2, 1);
  await prisma.declaracao.create({
    data: {
      viagemId: faltaAna.id, alunoId: ana.id, usaIda: false, usaVolta: false,
      origem: OrigemDeclaracao.ALUNO, declaradoEm: antesDoPrazo(faltaAna, 5),
      justificativa: {
        create: {
          motivo: MotivoJustificativa.ATESTADO,
          descricao: "Consulta médica com afastamento de um dia.",
          anexoUrl: "/uploads/seed/atestado-ana.pdf",
          status: StatusJustificativa.APROVADA,
          observacaoDecisao: "Atestado conferido.",
          decididoPor: admin.id,
          decididoEm: somarDias(faltaAna.horarioVolta, 1),
        },
      },
    },
  });

  // Bruno avisa ausência sem justificar → a diária continua cobrada.
  const avisoBruno = viagemEm(noturna.id, mesAnterior, mesAtual, 4, 1);
  await prisma.declaracao.create({
    data: {
      viagemId: avisoBruno.id, alunoId: bruno.id, usaIda: false, usaVolta: false,
      origem: OrigemDeclaracao.ALUNO, declaradoEm: antesDoPrazo(avisoBruno, 3),
    },
  });

  // Bruno vai numa quarta, que não contratou → diária avulsa.
  const avulsoBruno = viagemEm(noturna.id, mesAnterior, mesAtual, 3, 2);
  await prisma.declaracao.create({
    data: {
      viagemId: avulsoBruno.id, alunoId: bruno.id, usaIda: true, usaVolta: true,
      origem: OrigemDeclaracao.ALUNO, declaradoEm: antesDoPrazo(avulsoBruno, 6),
    },
  });

  // Carla usa só a ida numa sexta → muda o planejamento, não a conta.
  const soIdaCarla = viagemEm(noturna.id, mesAnterior, mesAtual, 5, 2);
  await prisma.declaracao.create({
    data: {
      viagemId: soIdaCarla.id, alunoId: carla.id, usaIda: true, usaVolta: false,
      origem: OrigemDeclaracao.ALUNO, declaradoEm: antesDoPrazo(soIdaCarla, 2),
    },
  });

  // Eduarda tem uma justificativa recusada no mês retrasado → diária cobrada.
  const faltaEduarda = viagemEm(matutina.id, mesRetrasado, mesAnterior, 2, 2);
  await prisma.declaracao.create({
    data: {
      viagemId: faltaEduarda.id, alunoId: eduarda.id, usaIda: false, usaVolta: false,
      origem: OrigemDeclaracao.ALUNO, declaradoEm: antesDoPrazo(faltaEduarda, 10),
      justificativa: {
        create: {
          motivo: MotivoJustificativa.OUTRO,
          descricao: "Compromisso pessoal.",
          anexoUrl: "/uploads/seed/declaracao-eduarda.pdf",
          status: StatusJustificativa.RECUSADA,
          observacaoDecisao: "Motivo não se enquadra nas regras de isenção.",
          decididoPor: admin.id,
          decididoEm: somarDias(faltaEduarda.horarioVolta, 2),
        },
      },
    },
  });

  // Diego tem uma justificativa pendente na última viagem que já aconteceu:
  // é o que aparece na fila de aprovação do admin.
  const ultimaDoDiego = viagens
    .filter((v) => v.rotaId === matutina.id && v.horarioVolta < agora)
    .at(-1)!;
  await prisma.declaracao.create({
    data: {
      viagemId: ultimaDoDiego.id, alunoId: diego.id, usaIda: false, usaVolta: false,
      origem: OrigemDeclaracao.ALUNO, declaradoEm: antesDoPrazo(ultimaDoDiego, 12),
      justificativa: {
        create: {
          motivo: MotivoJustificativa.AULA_CANCELADA,
          descricao: "O professor cancelou a aula pelo sistema acadêmico.",
          anexoUrl: "/uploads/seed/aviso-cancelamento-diego.pdf",
        },
      },
    },
  });

  // Futuro: Ana avisa que não vai na próxima viagem; Eduarda pede uma quinta avulsa.
  const proximaAna = proximaViagem(noturna.id);
  if (proximaAna) {
    await prisma.declaracao.create({
      data: {
        viagemId: proximaAna.id, alunoId: ana.id, usaIda: false, usaVolta: false,
        origem: OrigemDeclaracao.ALUNO, declaradoEm: agora,
      },
    });
  }
  const quintaEduarda = proximaViagem(matutina.id, 4);
  if (quintaEduarda) {
    await prisma.declaracao.create({
      data: {
        viagemId: quintaEduarda.id, alunoId: eduarda.id, usaIda: true, usaVolta: true,
        origem: OrigemDeclaracao.ALUNO, declaradoEm: agora,
      },
    });
  }

  // ---------- Mensalidades: apuração dos dois meses fechados
  // Mesma regra de docs/modelagem.md ("Fechamento"); o módulo de Mensalidades
  // vai implementar isso no Service, aqui ela só gera o histórico.
  const declaracoes = await prisma.declaracao.findMany({ include: { justificativa: true } });
  const alunosAtivos = [ana, bruno, carla, diego, eduarda];
  const valorDaRota = new Map([
    [noturna.id, 1800],
    [matutina.id, 2400],
  ]);

  for (const inicio of [mesRetrasado, mesAnterior]) {
    const fim = dia(inicio.getUTCFullYear(), inicio.getUTCMonth() + 2, 1);
    const competencia = competenciaDe(inicio);
    const vencimentoEm = horaLocal(dia(fim.getUTCFullYear(), fim.getUTCMonth() + 1, 10), "23:59");
    const doMes = viagens.filter((v) => v.data >= inicio && v.data < fim);

    for (const aluno of alunosAtivos) {
      const diarias = [];
      for (const viagem of doMes) {
        const plano = planos.find(
          (p) =>
            p.alunoId === aluno.id &&
            p.rotaId === viagem.rotaId &&
            p.vigenteDe <= viagem.prazoDeclaracao &&
            (p.vigenteAte === null || p.vigenteAte > viagem.prazoDeclaracao) &&
            p.diasSemana.includes(diaSemanaIso(viagem.data)),
        );
        const declaracao = declaracoes.find(
          (d) => d.alunoId === aluno.id && d.viagemId === viagem.id && d.canceladoEm === null,
        );
        const avulso = !plano && declaracao && (declaracao.usaIda || declaracao.usaVolta);
        if (!plano && !avulso) continue;

        const aprovada =
          declaracao?.justificativa?.status === StatusJustificativa.APROVADA
            ? declaracao.justificativa
            : null;
        const situacao =
          viagem.status === StatusViagem.CANCELADA
            ? SituacaoDiaria.ISENTA_VIAGEM_CANCELADA
            : aprovada
              ? SituacaoDiaria.ISENTA_JUSTIFICADA
              : SituacaoDiaria.COBRADA;

        diarias.push({
          viagemId: viagem.id,
          planoRotaId: plano?.id ?? null,
          data: viagem.data,
          centavos: valorDaRota.get(viagem.rotaId)!,
          situacao,
          justificativaId: aprovada?.id ?? null,
        });
      }

      const cobradas = diarias.filter((d) => d.situacao === SituacaoDiaria.COBRADA);
      const subtotal = cobradas.reduce((total, d) => total + d.centavos, 0);

      // Eduarda ganha um desconto no mês anterior, para mostrar o ajuste assinado.
      const ajuste = aluno === eduarda && inicio === mesAnterior ? -2400 : null;

      // Mês retrasado: tudo pago, menos o Bruno (vencida). Mês anterior: só a Ana pagou.
      const paga =
        inicio === mesRetrasado ? aluno !== bruno : aluno === ana;
      const pagoEm = paga ? new Date(vencimentoEm.getTime() - 3 * UM_DIA) : null;

      await prisma.mensalidade.create({
        data: {
          alunoId: aluno.id,
          competencia,
          diariasCobradas: cobradas.length,
          diariasIsentas: diarias.length - cobradas.length,
          subtotal: reais(subtotal),
          ajuste: ajuste === null ? null : reais(ajuste),
          motivoAjuste: ajuste === null ? null : "Desconto de uma diária por atraso do veículo.",
          ajustadoPor: ajuste === null ? null : admin.id,
          ajustadoEm: ajuste === null ? null : somarDias(fim, 1),
          valor: reais(subtotal + (ajuste ?? 0)),
          vencimentoEm,
          status: paga
            ? StatusMensalidade.PAGA
            : vencimentoEm < agora
              ? StatusMensalidade.VENCIDA
              : StatusMensalidade.ABERTA,
          pagoEm,
          referenciaGateway: paga ? `FAKE-${competencia}-${aluno.matricula}` : null,
          baixaPor: paga ? admin.id : null,
          baixaEm: pagoEm,
          diarias: {
            create: diarias.map(({ centavos, ...d }) => ({ ...d, valorDiaria: reais(centavos) })),
          },
        },
      });
    }
  }

  // ---------- Despesas (página de transparência)
  const despesas = [];
  for (const inicio of [mesRetrasado, mesAnterior, mesAtual]) {
    const noMes = (d: number) => dia(inicio.getUTCFullYear(), inicio.getUTCMonth() + 1, d);
    const variacao = inicio === mesAnterior ? 1.06 : 1; // mês com mais quilometragem
    despesas.push(
      { categoria: CategoriaDespesa.COMBUSTIVEL, descricao: "Diesel — ônibus", valor: Math.round(185000 * variacao), data: noMes(5), veiculoId: onibus.id },
      { categoria: CategoriaDespesa.COMBUSTIVEL, descricao: "Diesel — van", valor: Math.round(92000 * variacao), data: noMes(5), veiculoId: van.id },
      { categoria: CategoriaDespesa.PEDAGIO, descricao: "Pedágio BR-101", valor: 18640, data: noMes(8), veiculoId: onibus.id },
      { categoria: CategoriaDespesa.SEGURO, descricao: "Seguro da frota (parcela)", valor: 64000, data: noMes(10), veiculoId: null },
      { categoria: CategoriaDespesa.SALARIO, descricao: "Motorista — ônibus", valor: 320000, data: noMes(28), veiculoId: null },
      { categoria: CategoriaDespesa.SALARIO, descricao: "Motorista — van", valor: 260000, data: noMes(28), veiculoId: null },
    );
  }
  despesas.push(
    { categoria: CategoriaDespesa.MANUTENCAO, descricao: "Revisão dos 60.000 km", valor: 78000, data: dia(ano, mes - 2, 18), veiculoId: van.id },
    { categoria: CategoriaDespesa.MANUTENCAO, descricao: "Troca de embreagem", valor: 235000, data: dia(ano, mes - 1, 22), veiculoId: micro.id },
    { categoria: CategoriaDespesa.OUTROS, descricao: "Lavagem e higienização", valor: 15000, data: dia(ano, mes - 1, 12), veiculoId: null },
  );
  await prisma.despesa.createMany({
    data: despesas
      .filter((d) => d.data <= hoje) // nada lançado no futuro
      .map(({ valor, ...d }) => ({ ...d, valor: reais(valor), criadoPor })),
  });

  // ---------- Resumo
  const contagem = {
    usuarios: await prisma.usuario.count(),
    alunos: await prisma.aluno.count(),
    veiculos: await prisma.veiculo.count(),
    pontos: await prisma.ponto.count(),
    rotas: await prisma.rota.count(),
    planos: await prisma.planoRota.count(),
    viagens: await prisma.viagem.count(),
    declaracoes: await prisma.declaracao.count(),
    justificativas: await prisma.justificativa.count(),
    mensalidades: await prisma.mensalidade.count(),
    diarias: await prisma.diaria.count(),
    despesas: await prisma.despesa.count(),
  };
  console.table(contagem);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
