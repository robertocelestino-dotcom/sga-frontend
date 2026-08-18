// src/components/faturamento/ModalVisualizarXml.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { 
  FaCheck, FaTimes, FaExclamationTriangle, FaCopy, FaCheckCircle, 
  FaFileCode, FaDownload, FaChevronRight, FaChevronDown, FaExpand, FaCompress
} from 'react-icons/fa';
import { RmApiPreVisualizacaoItem, RmApiValidacao } from '../../types/rmApi.types';

interface ModalVisualizarXmlProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  detalhes: RmApiPreVisualizacaoItem[];
  processando: boolean;
  total: number;
}

// ============================================================
// INTERFACES PARA NÓS DO XML
// ============================================================

interface XmlNode {
  type: 'element' | 'text';
  tag?: string;
  attributes?: Record<string, string>;
  children?: XmlNode[];
  text?: string;
}

// ============================================================
// COMPONENTE PARA NÓ DO XML (TREE VIEW)
// ============================================================

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
        className="flex items-center gap-1 py-0.5 hover:bg-gray-800 rounded cursor-pointer"
        onClick={onToggle}
      >
        {hasChildren ? (
          isExpanded ? (
            <FaChevronDown className="text-gray-500 text-xs" />
          ) : (
            <FaChevronRight className="text-gray-500 text-xs" />
          )
        ) : (
          <span className="w-3" />
        )}
        <span className="text-blue-400 text-xs font-mono">&lt;{tagName}</span>
        {node.attributes && Object.entries(node.attributes).map(([key, value]) => (
          <span key={key} className="text-xs font-mono">
            <span className="text-purple-400"> {key}</span>
            <span className="text-gray-500">=</span>
            <span className="text-green-400">"{value}"</span>
          </span>
        ))}
        {hasChildren ? (
          <span className="text-blue-400 text-xs font-mono">&gt;</span>
        ) : (
          <span className="text-blue-400 text-xs font-mono"> /&gt;</span>
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
          <div style={{ paddingLeft }} className="text-blue-400 text-xs font-mono py-0.5">
            &lt;/{tagName}&gt;
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// FUNÇÃO PARA PARSER XML (FORA DO COMPONENTE)
// ============================================================

const parseXmlToTree = (xml: string): XmlNode[] => {
  try {
    let xmlLimpo = xml;
    if (xmlLimpo.includes('<![CDATA[')) {
      xmlLimpo = xmlLimpo.replace('<![CDATA[', '').replace(']]>', '');
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlLimpo, 'text/xml');
    
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      return [{ type: 'text', text: xmlLimpo }];
    }

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
          if (childNode) {
            children.push(childNode);
          }
        }

        return {
          type: 'element',
          tag: element.tagName,
          attributes,
          children: children.length > 0 ? children : undefined
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

// ============================================================
// FUNÇÕES AUXILIARES (FORA DO COMPONENTE)
// ============================================================

const getStatusColor = (valido: boolean, temErros: boolean) => {
  if (temErros) return 'border-red-500 bg-red-50';
  if (valido) return 'border-green-500 bg-green-50';
  return 'border-yellow-500 bg-yellow-50';
};

const getStatusIcon = (valido: boolean, temErros: boolean) => {
  if (temErros) return <FaTimes className="text-red-500" />;
  if (valido) return <FaCheck className="text-green-500" />;
  return <FaExclamationTriangle className="text-yellow-500" />;
};

const getStatusText = (valido: boolean, temErros: boolean) => {
  if (temErros) return '❌ Erros detectados';
  if (valido) return '✅ Dados validados';
  return '⚠️ Atenção';
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

const ModalVisualizarXml: React.FC<ModalVisualizarXmlProps> = ({
  isOpen,
  onClose,
  onConfirm,
  detalhes,
  processando,
  total
}) => {
  // ============================================================
  // TODOS OS HOOKS NO TOPO (ORDEM FIXA)
  // ============================================================

  const [itemSelecionado, setItemSelecionado] = useState<RmApiPreVisualizacaoItem | null>(
    () => detalhes.length > 0 ? detalhes[0] : null
  );
  const [abaAtiva, setAbaAtiva] = useState<'validacao' | 'xml'>('validacao');
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiado, setCopiado] = useState(false);

  // ============================================================
  // MEMOS (DEPOIS DOS HOOKS DE ESTADO)
  // ============================================================

  const treeData = useMemo(() => {
    if (!itemSelecionado) return [];
    return parseXmlToTree(itemSelecionado.xml);
  }, [itemSelecionado]);

  // ============================================================
  // CALLBACKS (DEPOIS DOS MEMOS)
  // ============================================================

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

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // ============================================================
  // RENDER (COM CHECAGEM DE isOpen)
  // ============================================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-800">🔍 Pré-Visualização XML</h3>
              <p className="text-sm text-gray-600 mt-1">
                {total} fatura(s) para integração via API
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row h-[calc(95vh-200px)]">
          {/* Lista de faturas */}
          <div className="w-full md:w-64 border-r border-gray-200 p-4 overflow-y-auto">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">📋 Faturas</h4>
            <div className="space-y-2">
              {detalhes.map((item) => {
                const isSelected = itemSelecionado?.notaId === item.notaId;
                return (
                  <button
                    key={item.notaId}
                    onClick={() => setItemSelecionado(item)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    } ${getStatusColor(item.validacao.valido, item.temErros)}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {item.numeroFatura || `Fatura ${item.faturaId}`}
                      </span>
                      {getStatusIcon(item.validacao.valido, item.temErros)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Nota: {item.notaId}</div>
                    {item.temErros && <div className="text-xs text-red-600 mt-1">⚠️ Erros</div>}
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
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    📊 Validação
                    {itemSelecionado.temErros && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                        {itemSelecionado.validacao.erros?.length || 0}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setAbaAtiva('xml')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      abaAtiva === 'xml'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <FaFileCode className="inline mr-1" /> XML
                  </button>
                </div>

                {/* Validação */}
                {abaAtiva === 'validacao' && (
                  <div className="space-y-4">
                    {/* Status geral */}
                    <div className={`p-4 rounded-lg border ${getStatusColor(itemSelecionado.validacao.valido, itemSelecionado.temErros)}`}>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(itemSelecionado.validacao.valido, itemSelecionado.temErros)}
                        <span className="font-semibold">{getStatusText(itemSelecionado.validacao.valido, itemSelecionado.temErros)}</span>
                      </div>
                    </div>

                    {/* Erros */}
                    {itemSelecionado.validacao.erros && itemSelecionado.validacao.erros.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-red-800 mb-2">❌ Erros ({itemSelecionado.validacao.erros.length}):</h5>
                        <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                          {itemSelecionado.validacao.erros.map((erro, idx) => (
                            <li key={idx}>{erro}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Avisos */}
                    {itemSelecionado.validacao.avisos && itemSelecionado.validacao.avisos.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Avisos ({itemSelecionado.validacao.avisos.length}):</h5>
                        <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                          {itemSelecionado.validacao.avisos.map((aviso, idx) => (
                            <li key={idx}>{aviso}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Dados */}
                    {itemSelecionado.validacao.dados && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-3">📋 Dados da Fatura</h5>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-white p-2 rounded border border-gray-100">
                            <span className="text-gray-500">Associado:</span>
                            <span className="ml-2 font-medium">{itemSelecionado.validacao.dados.associadoNome}</span>
                          </div>
                          <div className="bg-white p-2 rounded border border-gray-100">
                            <span className="text-gray-500">Código SPC:</span>
                            <span className="ml-2 font-mono">{itemSelecionado.validacao.dados.codigoSpc}</span>
                          </div>
                          <div className="bg-white p-2 rounded border border-gray-100">
                            <span className="text-gray-500">Data Emissão:</span>
                            <span className="ml-2">{itemSelecionado.validacao.dados.dataEmissao}</span>
                          </div>
                          <div className="bg-white p-2 rounded border border-gray-100">
                            <span className="text-gray-500">Data Vencimento:</span>
                            <span className="ml-2">{itemSelecionado.validacao.dados.dataVencimento}</span>
                          </div>
                          <div className="bg-white p-2 rounded border border-gray-100 col-span-2">
                            <span className="text-gray-500">Valor Total:</span>
                            <span className="ml-2 font-bold text-green-600">
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
                        Tamanho: {itemSelecionado.xml.length} caracteres
                      </span>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={toggleExpand}
                          className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-3 py-1 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          {isExpanded ? <FaCompress /> : <FaExpand />}
                          {isExpanded ? 'Colapsar' : 'Expandir'}
                        </button>
                        <button
                          onClick={handleCopiarXml}
                          className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-3 py-1 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          {copiado ? <FaCheckCircle className="text-green-500" /> : <FaCopy />}
                          {copiado ? 'Copiado!' : 'Copiar'}
                        </button>
                        <button
                          onClick={handleBaixarXml}
                          className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1 px-3 py-1 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <FaDownload /> Baixar
                        </button>
                      </div>
                    </div>
                    
                    {/* Tree View */}
                    <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[500px]">
                      {treeData.map((node, index) => (
                        <XmlTreeNode 
                          key={index}
                          node={node}
                          isExpanded={isExpanded}
                          onToggle={toggleExpand}
                        />
                      ))}
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-400">
                      💡 Clique nos nós para expandir/colapsar | Use "Copiar" para colar no SoapUI
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-center items-center h-full text-gray-500">
                Selecione uma fatura para visualizar
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {detalhes.filter(d => d.temErros).length} fatura(s) com erros
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={onConfirm}
              disabled={processando || detalhes.some(d => d.temErros)}
              className={`px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2`}
            >
              {processando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                '🚀 Enviar para RM'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalVisualizarXml;