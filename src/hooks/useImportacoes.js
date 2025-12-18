import { useEffect, useState } from "react";

export function useImportacoes() {
  const [importacoes, setImportacoes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/notas/importacoes/resumo')
      .then(r => r.json())
      .then(data => setImportacoes(data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return { importacoes, loading };
}
