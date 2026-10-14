// src/components/faturamento/ModalVisualizarXml.tsx - VERSÃO CDL
import React, { useState, useMemo, useCallback } from 'react';
import {
  FaCheck, FaTimes, FaExclamationTriangle, FaCopy, FaCheckCircle,
  FaFileCode, FaDownload, FaChevronRight, FaChevronDown, FaExpand, FaCompress,
} from 'react-icons/fa';
import { X } from 'lucide-react';
import { RmApiPreVisualizacaoItem } from '../../types/rmApi.types';

interface ModalVisualizarXmlProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  detalhes: RmApiPreVisualizacaoItem[];
  processando: boolean;
  total: number;
}

interface XmlNode {
  type: 'element' | 'text';
  tag?: string;
  attributes?: Record<string, string>;
  children?: XmlNode[];
  text?: string;
}

/* ============================================================
   Tree node
   ============================================================ */
const XmlTreeNode: React.FC<{
  node: XmlNode;
  level?: number;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ node, level = 0, isExpanded, onToggle }) => {
  const paddingLeft = level * 20 + 8;

  if (node.type === 'text') {
    return (
      <div style={{ paddingLeft }} className="text-gray-400 text-xs font-mono py-0.5">
        {node.text}
      </div>
    );
  }

  const hasChildren = node.children && node.children.length > 0;
  const tagName = node.tag || '';

  return (
    <div>
      <div
        style={{ paddingLeft }}
        className="flex items-center gap-1 py-0.5 hover:bg-cdl-navy-100/30 rounded cursor-pointer"
        onClick={onToggle}
      >
        {hasChildren ? (
          isExpanded ? <FaChevronDown className="text-cdl-yellow-500 text-xs" />
                     : <FaChevronRight className="text-cdl-yellow-500 text-xs" />
        ) : (
          <span className="w-3" />
        )}
        <span className="text-cdl-yellow-400 text-xs font-mono">&lt;{tagName}</span>
        {node.attributes &&
          Object.entries(node.attributes).map(([key, value]) => (
            <span key={key} className="text-xs font-mono">
              <span className="text-cdl-navy-300"> {key}</span>
              <span className="text-gray-500">=</span>
              <span className="text-cdl-green-400">"{value}"</span>
            </span>
          ))}
        {hasChildren ? (
          <span className="text-cdl-yellow-400 text-xs font-mono">&gt;</span>
        ) : (
          <span className="text-cdl-yellow-400 text-xs font-mono"> /&gt;</span>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child, index) => (
            <XmlTreeNode
              key={index}
              node={child}
              level={level + 1}
              isExpanded={isExpanded}
              onToggle={onToggle}
            />
          ))}
          <div style={{ paddingLeft }} className="text-cdl-yellow-400 text-xs font-mono py-0.5">
            &lt;/{tagName}&gt;
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================
   Parser
   ============================================================ */
const parseXmlToTree = (xml: string): XmlNode[] => {
  try {
    let xmlLimpo = xml;
    if (xmlLimpo.includes('<![CDATA[')) {
      xmlLimpo = xmlLimpo.replace('<![CDATA[', '').replace(']]>', '');
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlLimpo, 'text/xml');

    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) return [{ type: 'text', text: xmlLimpo }];

    const parseNode = (node: Node): XmlNode | null => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        if (text.trim().length === 0) return null;
        return { type: 'text', text: text.trim() };
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const attributes: Record<string, string> = {};
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          attributes[attr.name] = attr.value;
        }
        const children: XmlNode[] = [];
        for (let i = 0; i < element.childNodes.length; i++) {
          const childNode = parseNode(element.childNodes[i]);
          if (childNode) children.push(childNode);
        }
        return {
          type: 'element',
          tag: element.tagName,
          attributes,
          children: children.length > 0 ? children : undefined,
        };
      }
      return null;
    };

    const root = xmlDoc.documentElement;
    if (!root) return [{ type: 'text', text: xmlLimpo }];

    const parsed = parseNode(root);
    return parsed ? [parsed] : [{ type: 'text', text: xmlLimpo }];
  } catch (e) {
    return [{ type: 'text', text: xml }];
  }
};

/* ============================================================
   Helpers de status (CDL)
   ============================================================ */
const getStatusColor = (valido: boolean, temErros: boolean) => {
  if (temErros) return 'border-cdl-danger-300 bg-cdl-danger-50';
  if (valido) return 'border-cdl-green-300 bg-cdl-green-50';
  return 'border-cdl-yellow-300 bg-cdl-yellow-50';
};

const getStatusIcon = (valido: boolean, temErros: boolean) => {
  if (temErros) return <FaTimes className="text-cdl-danger-500" />;
  if (valido) return <FaCheck className="text-cdl-green-500" />;
  return <FaExclamationTriangle className="text-cdl-yellow-500" />;
};

const getStatusText = (valido: boolean, temErros: boolean) => {
  if (temErros) return '❌ Erros detectados';
  if (valido) return '✅ Dados validados';
  return '⚠️ Atenção';
};

/* ============================================================
   Componente principal
   ============================================================ */
const ModalVisualizarXml: React.FC<ModalVisualizarXmlProps> = ({
  isOpen,
  onClose,
  onConfirm,
  detalhes,
  processando,
  total,
}) => {
  const [itemSelecionado, setItemSelecionado] = useState<RmApiPreVisualizacaoItem | null>(
    () => (detalhes.length > 0 ? detalhes[0] : null)
  );
  const [abaAtiva, setAbaAtiva] = useState<'validacao' | 'xml'>('validacao');
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiado, setCopiado] = useState(false);

  const treeData = useMemo(() => {
    if (!itemSelecionado) return [];
    return parseXmlToTree(itemSelecionado.xml);
  }, [itemSelecionado]);

  const handleCopiarXml = useCallback(() => {
    if (itemSelecionado) {
      navigator.clipboard.writeText(itemSelecionado.xml);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  }, [itemSelecionado]);

  const handleBaixarXml = useCallback(() => {
    if (itemSelecionado) {
      const blob = new Blob([itemSelecionado.xml], { type: 'text/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `movimento_${itemSelecionado.faturaId}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [itemSelecionado]);

  const toggleExpand = useCallback(() => setIsExpanded((prev) => !prev), []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full sm:max-w-6xl bg-white rounded-t-2xl sm:rounded-2xl
                      shadow-[0_20px_60px_-15px_rgba(0,0,0,.35)] overflow-hidden
                      max-h-[95vh] sm:max-h-[90vh] flex flex-col border-t-4 border-cdl-navy-700">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center bg-cdl-navy-50 shrink-0">
          <div>
            <h2 className="text-base sm:text-xl font-semibold text-cdl-navy-700 flex items-center gap-2">
              <span>🔍</span> Pré-Visualização XML
            </h2>
            <p className="text-xs text-cdl-navy-600 mt-0.5">
              <strong>{total}</strong> fatura(s) para integração via API
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-cdl-navy-700 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Lista de faturas */}
          <div className="w-full md:w-72 border-r border-gray-200 p-4 overflow-y-auto bg-cdl-neutral-50 shrink-0">
            <h4 className="text-sm font-semibold text-cdl-navy-700 mb-3 flex items-center gap-2">
              <span>📋</span> Faturas
            </h4>
            <div className="space-y-2">
              {detalhes.map((item) => {
                const isSelected = itemSelecionado?.notaId === item.notaId;
                return (
                  <button
                    key={item.notaId}
                    onClick={() => setItemSelecionado(item)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-cdl-navy-700 bg-cdl-navy-50 shadow-cdl'
                        : 'border-gray-200 bg-white hover:bg-cdl-navy-50/40 hover:border-cdl-navy-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate text-cdl-navy-700">
                        {item.numeroFatura || `Fatura ${item.faturaId}`}
                      </span>
                      {getStatusIcon(item.validacao.valido, item.temErros)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 font-mono">Nota: {item.notaId}</div>
                    {item.temErros && (
                      <div className="text-xs text-cdl-danger-500 mt-1 font-medium">⚠️ Erros</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 p-4 overflow-y-auto">
            {itemSelecionado ? (
              <div className="space-y-4">
                {/* Abas */}
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setAbaAtiva('validacao')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      abaAtiva === 'validacao'
                        ? 'border-cdl-navy-700 text-cdl-navy-700'
                        : 'border-transparent text-gray-500 hover:text-cdl-navy-700'
                    }`}
                  >
                    📊 Validação
                    {itemSelecionado.temErros && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-cdl-danger-50 text-cdl-danger-500 rounded-full">
                        {itemSelecionado.validacao.erros?.length || 0}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setAbaAtiva('xml')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      abaAtiva === 'xml'
                        ? 'border-cdl-navy-700 text-cdl-navy-700'
                        : 'border-transparent text-gray-500 hover:text-cdl-navy-700'
                    }`}
                  >
                    <FaFileCode className="inline mr-1" /> XML
                  </button>
                </div>

                {/* Validação */}
                {abaAtiva === 'validacao' && (
                  <div className="space-y-4">
                    {/* Status geral */}
                    <div className={`p-4 rounded-lg border-2 ${getStatusColor(itemSelecionado.validacao.valido, itemSelecionado.temErros)}`}>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(itemSelecionado.validacao.valido, itemSelecionado.temErros)}
                        <span className="font-semibold text-gray-900">
                          {getStatusText(itemSelecionado.validacao.valido, itemSelecionado.temErros)}
                        </span>
                      </div>
                    </div>

                    {/* Erros */}
                    {itemSelecionado.validacao.erros && itemSelecionado.validacao.erros.length > 0 && (
                      <div className="bg-cdl-danger-50 border border-cdl-danger-100 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-cdl-danger-600 mb-2">
                          ❌ Erros ({itemSelecionado.validacao.erros.length}):
                        </h5>
                        <ul className="list-disc list-inside text-sm text-cdl-danger-500 space-y-1">
                          {itemSelecionado.validacao.erros.map((erro, idx) => (
                            <li key={idx}>{erro}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Avisos */}
                    {itemSelecionado.validacao.avisos && itemSelecionado.validacao.avisos.length > 0 && (
                      <div className="bg-cdl-yellow-50 border border-cdl-yellow-100 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-cdl-yellow-700 mb-2">
                          ⚠️ Avisos ({itemSelecionado.validacao.avisos.length}):
                        </h5>
                        <ul className="list-disc list-inside text-sm text-cdl-yellow-700 space-y-1">
                          {itemSelecionado.validacao.avisos.map((aviso, idx) => (
                            <li key={idx}>{aviso}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Dados */}
                    {itemSelecionado.validacao.dados && (
                      <div className="bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-cdl-navy-700 mb-3 flex items-center gap-2">
                          <span>📋</span> Dados da Fatura
                        </h5>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-white p-2.5 rounded border border-cdl-navy-100">
                            <span className="text-cdl-navy-600 text-xs">Associado:</span>
                            <span className="ml-2 font-medium text-cdl-navy-700">
                              {itemSelecionado.validacao.dados.associadoNome}
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded border border-cdl-navy-100">
                            <span className="text-cdl-navy-600 text-xs">Código SPC:</span>
                            <span className="ml-2 font-mono text-cdl-navy-700">
                              {itemSelecionado.validacao.dados.codigoSpc}
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded border border-cdl-navy-100">
                            <span className="text-cdl-navy-600 text-xs">Data Emissão:</span>
                            <span className="ml-2 text-cdl-navy-700">
                              {itemSelecionado.validacao.dados.dataEmissao}
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded border border-cdl-navy-100">
                            <span className="text-cdl-navy-600 text-xs">Data Vencimento:</span>
                            <span className="ml-2 text-cdl-navy-700">
                              {itemSelecionado.validacao.dados.dataVencimento}
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded border border-cdl-navy-100 col-span-2">
                            <span className="text-cdl-navy-600 text-xs">Valor Total:</span>
                            <span className="ml-2 font-bold text-cdl-green-700">
                              R$ {parseFloat(itemSelecionado.validacao.dados.valorTotal).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* XML */}
                {abaAtiva === 'xml' && (
                  <div>
                    <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                      <span className="text-sm text-gray-500">
                        Tamanho: <span className="font-mono text-cdl-navy-700">{itemSelecionado.xml.length}</span> caracteres
                      </span>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={toggleExpand}
                          className="text-sm text-cdl-navy-700 hover:text-cdl-navy-900 flex items-center gap-1
                                     px-3 py-1.5 bg-cdl-navy-50 rounded-lg hover:bg-cdl-navy-100 transition-colors font-medium"
                        >
                          {isExpanded ? <FaCompress /> : <FaExpand />}
                          {isExpanded ? 'Colapsar' : 'Expandir'}
                        </button>
                        <button
                          onClick={handleCopiarXml}
                          className="text-sm text-cdl-navy-700 hover:text-cdl-navy-900 flex items-center gap-1
                                     px-3 py-1.5 bg-cdl-navy-50 rounded-lg hover:bg-cdl-navy-100 transition-colors font-medium"
                        >
                          {copiado ? <FaCheckCircle className="text-cdl-green-500" /> : <FaCopy />}
                          {copiado ? 'Copiado!' : 'Copiar'}
                        </button>
                        <button
                          onClick={handleBaixarXml}
                          className="text-sm text-cdl-green-700 hover:text-cdl-green-800 flex items-center gap-1
                                     px-3 py-1.5 bg-cdl-green-50 rounded-lg hover:bg-cdl-green-100 transition-colors font-medium"
                        >
                          <FaDownload /> Baixar
                        </button>
                      </div>
                    </div>

                    <div className="bg-cdl-navy-900 rounded-lg p-4 overflow-auto max-h-[500px] border border-cdl-navy-700">
                      {treeData.map((node, index) => (
                        <XmlTreeNode
                          key={index}
                          node={node}
                          isExpanded={isExpanded}
                          onToggle={toggleExpand}
                        />
                      ))}
                    </div>

                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      💡 Clique nos nós para expandir/colapsar | Use "Copiar" para colar no SoapUI
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-center items-center h-full text-cdl-navy-600">
                Selecione uma fatura para visualizar
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-cdl-neutral-50 flex justify-between items-center shrink-0">
          <div className="text-sm text-cdl-danger-500 font-medium">
            {detalhes.filter((d) => d.temErros).length} fatura(s) com erros
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 text-cdl-navy-700 bg-white rounded-lg
                         hover:bg-cdl-neutral-50 transition-colors font-medium"
            >
              Fechar
            </button>
            <button
              onClick={onConfirm}
              disabled={processando || detalhes.some((d) => d.temErros)}
              className="px-6 py-2.5 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[.98]
                         flex items-center justify-center gap-2 font-medium"
            >
              {processando ? (
                <>
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Enviando...
                </>
              ) : '🚀 Enviar para RM'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalVisualizarXml;