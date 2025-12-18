import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { importacaoSPCService } from "../services/api";
import { errorHandler } from "../services/api";

import ResumoGeral from "../components/importacao/ResumoGeral";
import AssociadosDivergentes from "../components/importacao/AssociadosDivergentes";
import NotasSomenteArquivo from "../components/importacao/NotasSomenteArquivo";
import NotasSomenteBanco from "../components/importacao/NotasSomenteBanco";

export default function VerificacaoImportacao() {

  // 🔥 CAPTURAR O NOME CORRETO DA ROTA
  const { importacaoId } = useParams();

  const id = importacaoId ? Number(importacaoId) : NaN;

  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarTudo() {

    console.log("📌 ID recebido da rota:", importacaoId);

    if (!importacaoId || isNaN(id)) {
      console.error("❌ ID inválido:", importacaoId);
      setErro("ID inválido na rota.");
      setCarregando(false);
      return;
    }

    try {
      console.log(`📥 Carregando verificação da importação ID = ${id}`);

      const resposta = await importacaoSPCService.verificarImportacao(id);

      console.log("📦 Resposta da API:", resposta);

      const normalizado = {
        resumoGeral: resposta.resumoGeral ?? [],
        associadosDivergentes: resposta.associadosDivergentes ?? [],
        notasSomenteArquivo: resposta.notasSomenteArquivo ?? [],
        notasSomenteBanco: resposta.notasSomenteBanco ?? []
      };

      setDados(normalizado);

    } catch (e) {
      console.error("❌ Erro ao carregar:", e);
      setErro(errorHandler.getErrorMessage(e));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarTudo();
  }, [importacaoId]);

  if (carregando) return <p>⏳ Carregando verificação...</p>;
  if (erro) return <p style={{ color: "red" }}>❌ {erro}</p>;
  if (!dados) return <p>❌ Nenhuma informação encontrada.</p>;

  return (
    <div>
      <ResumoGeral dados={dados.resumoGeral} />
      <AssociadosDivergentes dados={dados.associadosDivergentes} />
      <NotasSomenteArquivo dados={dados.notasSomenteArquivo} />
      <NotasSomenteBanco dados={dados.notasSomenteBanco} />
    </div>
  );
}
