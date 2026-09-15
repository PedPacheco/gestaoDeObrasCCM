"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Edit,
  X,
  Code,
  Database,
  Copy,
  Check,
  TrendingUp,
  MapPin,
  BarChart3,
  HardHat,
  ArrowUpDown,
  FileText,
  Activity
} from 'lucide-react';
import { Nucleo } from './types';
import {
  INITIAL_NUCLEOS,
  REGIONAIS,
  MUNICIPIOS,
  TIPOS_REDE,
  TECNOLOGIAS,
  STATUS_NUCLEO,
  PARCEIRAS_SIGO,
  PARCEIRAS_RESPONSAVEIS,
  STATUS_RESTRIÇÃO,
  OPORTUNIDADES_CHI,
  CONJUNTOS
} from './mockData';
import {
  SQL_SCHEMA_POSTGRES,
  SQL_INSERT_SEEDS,
  BACKEND_CONTROLLER_CODE
} from './developerAssets';

// ─── Paleta dark (alinhada aos demais dashboards) ────────────────────────────
const SURFACE_PAGE = '#0a1628';
const SURFACE_CARD = '#0f1d2e';
const SURFACE_HEAD = '#071220';
const SURFACE_INPUT = '#1e2f42';
const SURFACE_HOVER = '#162535';

const cellInputCls =
  'w-full bg-transparent border-0 text-xs text-slate-200 py-1.5 px-1.5 rounded outline-none focus:ring-2 focus:ring-blue-500/40';

const newCellInputCls =
  'w-full border border-white/10 text-xs text-slate-200 py-1.5 px-1.5 rounded-md outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 placeholder:text-white/25';

function emptyNewRow(): Partial<Nucleo> {
  return {
    regional: REGIONAIS[0],
    municipio: MUNICIPIOS[REGIONAIS[0]][0] || '',
    nucleo: '',
    tipoRede: TIPOS_REDE[0],
    tecnologia: TECNOLOGIAS[0],
    statusNucleo: 'Planejado',
    dataEntregaPerdas: '',
    respEntrega: '',
    parceiraSigo: PARCEIRAS_SIGO[0],
    parceiraResponsavel: PARCEIRAS_RESPONSAVEIS[0],
    envioPendenciaRelatorioFinal: '',
    prazoConclusaoPendenciasRelatorioFinal: '',
    ligacoesExecutadasCampo: 0,
    ligacoesNotasBaixadas: 0,
    meioAmbienteStatus: 'Liberado',
    meioAmbienteRestricaoClientes: 0,
    poderPublicoStatus: 'Liberado',
    poderPublicoRestricaoClientes: 0,
    chiStatus: 'Liberado',
    chiRestricaoClientes: 0,
    conjunto: '',
    chiNecessario: 0,
    chiLimiteBtzero: 0,
    chiConsumidoBtzero: 0,
    chiDisponivelBtZero: 0,
    oportunidadeChi: 'Não',
    statusAndamentoConstrucao: 0,
    prazoConclusaoConstrucao: '',
    statusAndamentoRegularizacao: 0,
    prazoConclusaoRegularizacao: '',
    statusAndamentoDesativacao: 0,
    prazoConclusaoDesativacao: '',
    prioridadeFinalizacao: 'Média',
    observacoesGerais: ''
  };
}

export default function SigoNucleosDashboard() {
  // --- STATE ---
  const [nucleos, setNucleos] = useState<Nucleo[]>([]);
  const [selectedNucleo, setSelectedNucleo] = useState<Nucleo | null>(null);
  const [activeTab, setActiveTab] = useState<'tabela' | 'graficos' | 'desenvolvedor'>('tabela');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegional, setFilterRegional] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPrioridade, setFilterPrioridade] = useState('');
  const [quickFilter, setQuickFilter] = useState<'todos' | 'restricoes' | 'chi' | 'alta'>('todos');

  // Sorting
  const [sortField, setSortField] = useState<keyof Nucleo>('id');
  const [sortAsc, setSortAsc] = useState(true);

  // Linha de cadastro inline (substitui o botão "Novo Núcleo")
  const [newRow, setNewRow] = useState<Partial<Nucleo>>(emptyNewRow);
  const [newRowError, setNewRowError] = useState('');

  // Form State (edição via drawer)
  const [formValues, setFormValues] = useState<Partial<Nucleo>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Feedback notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Developer Portal state
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // --- INITIALIZATION (LocalStorage) ---
  useEffect(() => {
    const saved = localStorage.getItem('sigo_nucleos_data_v2');
    if (saved) {
      try {
        setNucleos(JSON.parse(saved));
      } catch (e) {
        setNucleos(INITIAL_NUCLEOS);
      }
    } else {
      setNucleos(INITIAL_NUCLEOS);
      localStorage.setItem('sigo_nucleos_data_v2', JSON.stringify(INITIAL_NUCLEOS));
    }
  }, []);

  const saveToStorage = (updatedList: Nucleo[]) => {
    setNucleos(updatedList);
    localStorage.setItem('sigo_nucleos_data_v2', JSON.stringify(updatedList));
  };

  const handleUpdateField = (id: string, field: keyof Nucleo, value: any) => {
    const updated = nucleos.map(n => {
      if (n.id === id) {
        const updatedItem = { ...n, [field]: value };
        if (field === 'regional') {
          const availableMunicipios = MUNICIPIOS[value] || [];
          if (!availableMunicipios.includes(updatedItem.municipio)) {
            updatedItem.municipio = availableMunicipios[0] || '';
          }
        }
        return updatedItem;
      }
      return n;
    });
    saveToStorage(updated);
    triggerNotification(`Campo ${field} atualizado inline com sucesso!`, 'success');
  };

  // --- NOTIFICATION HELPER ---
  const triggerNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // --- FORM VALUE CALCULATIONS (drawer de edição) ---
  useEffect(() => {
    if (!selectedNucleo) return;

    const limite = Number(formValues.chiLimiteBtzero || 0);
    const consumido = Number(formValues.chiConsumidoBtzero || 0);
    const disponivel = Math.max(0, limite - consumido);

    if (formValues.chiDisponivelBtZero !== disponivel) {
      setFormValues(prev => ({ ...prev, chiDisponivelBtZero: disponivel }));
    }

    if (!formValues.oportunidadeChi || formValues.oportunidadeChi === '') {
      let rec = 'Não';
      if (disponivel === 0 && limite > 0) rec = 'Sim';
      else if (disponivel < 50 && limite > 0) rec = 'Em Análise';

      setFormValues(prev => ({ ...prev, oportunidadeChi: rec }));
    }
  }, [formValues.chiLimiteBtzero, formValues.chiConsumidoBtzero, selectedNucleo]);

  // Handle City auto-selection based on Regional
  const handleRegionalChange = (reg: string) => {
    const cities = MUNICIPIOS[reg] || [];
    setFormValues(prev => ({
      ...prev,
      regional: reg,
      municipio: cities[0] || ''
    }));
  };

  // --- LINHA DE CADASTRO INLINE ---
  const handleNewRowChange = (field: keyof Nucleo, value: any) => {
    setNewRowError('');
    setNewRow(prev => {
      const next: Partial<Nucleo> = { ...prev, [field]: value };

      if (field === 'regional') {
        const cities = MUNICIPIOS[value] || [];
        if (!cities.includes(next.municipio || '')) {
          next.municipio = cities[0] || '';
        }
      }

      if (field === 'chiLimiteBtzero' || field === 'chiConsumidoBtzero') {
        next.chiDisponivelBtZero = Math.max(
          0,
          Number(next.chiLimiteBtzero || 0) - Number(next.chiConsumidoBtzero || 0)
        );
      }

      return next;
    });
  };

  const handleCommitNewRow = () => {
    const nome = (newRow.nucleo || '').trim();

    if (!nome) {
      setNewRowError('Informe o nome do núcleo.');
      triggerNotification('Informe o nome do núcleo para cadastrar a linha.', 'error');
      return;
    }
    if (nucleos.some(n => n.nucleo.trim().toLowerCase() === nome.toLowerCase())) {
      setNewRowError('Núcleo já cadastrado.');
      triggerNotification('Este nome de núcleo já está cadastrado no sistema.', 'error');
      return;
    }

    const created: Nucleo = {
      ...(newRow as Nucleo),
      nucleo: nome,
      id: 'nuc_' + Date.now().toString()
    };

    saveToStorage([created, ...nucleos]);
    setNewRow(emptyNewRow());
    setNewRowError('');
    triggerNotification(`Núcleo ${created.nucleo} cadastrado com sucesso!`);
  };

  const handleClearNewRow = () => {
    setNewRow(emptyNewRow());
    setNewRowError('');
  };

  // --- FILTER & SORT LOGIC ---
  const filteredNucleos = useMemo(() => {
    return nucleos.filter(item => {
      const matchesSearch =
        item.nucleo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.municipio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.regional.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRegional = filterRegional ? item.regional === filterRegional : true;
      const matchesStatus = filterStatus ? item.statusNucleo === filterStatus : true;
      const matchesPrioridade = filterPrioridade ? item.prioridadeFinalizacao === filterPrioridade : true;

      let matchesQuick = true;
      if (quickFilter === 'restricoes') {
        matchesQuick =
          item.meioAmbienteStatus === 'Pendente' ||
          item.poderPublicoStatus === 'Pendente' ||
          item.chiStatus === 'Pendente' ||
          item.meioAmbienteRestricaoClientes > 0 ||
          item.poderPublicoRestricaoClientes > 0 ||
          item.chiRestricaoClientes > 0; 
      } else if (quickFilter === 'chi') {
        const remaining = item.chiLimiteBtzero - item.chiConsumidoBtzero;
        matchesQuick = item.chiLimiteBtzero > 0 && (remaining <= 0 || (remaining / item.chiLimiteBtzero) <= 0.15);
      } else if (quickFilter === 'alta') {
        matchesQuick = item.prioridadeFinalizacao === 'Alta';
      }

      return matchesSearch && matchesRegional && matchesStatus && matchesPrioridade && matchesQuick;
    }).sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortAsc ? -1 : 1;
      if (strA > strB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [nucleos, searchTerm, filterRegional, filterStatus, filterPrioridade, quickFilter, sortField, sortAsc]);

  const toggleSort = (field: keyof Nucleo) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // --- ACTIONS ---
  const handleResetData = () => {
    if (window.confirm('Deseja realmente restaurar os dados originais da planilha? Todas as alterações manuais serão perdidas.')) {
      saveToStorage(INITIAL_NUCLEOS);
      setSelectedNucleo(null);
      triggerNotification('Dados de núcleos restaurados para o padrão com sucesso!', 'info');
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = [
        'Regional', 'Municipio', 'Nucleo', 'Tipo de Rede', 'Tecnologia',
        'Status do Nucleo', 'Data Entrega Perdas', 'Resp pela Entrega',
        'Parceira SIGO', 'Parceira Responsavel', 'Envio Pendencia Relatorio Final (data)',
        'Prazo Conclusao Pendencias Relatorio Final (data)', 'Ligacoes Executadas Campo',
        'Ligacoes Notas Baixadas', 'Meio Ambiente', 'Quant Restricao Clientes Meio Ambiente',
        'Poder Publico', 'Quant Restricao Clientes Poder Publico', 'CHI', 'Quant Restricao CHI',
        'Conjunto', 'CHI Necessario', 'CHI Disponivel BTZero', 'CHI Limite Btzero',
        'CHI Consumido Btzero', 'Oportunidade de CHI', 'Status de andamento Construcao %',
        'Prazo conclusao Construcao (data)', 'Status de andamento Regularizacao %',
        'Prazo conclusao Regularizacao (data)', 'Status de andamento Desativação %',
        'Prazo conclusao Desativacao (data)', 'Prioridade de finalizacao', 'Observacoes gerais'
      ];

      const csvRows = [headers.join(';')];

      filteredNucleos.forEach(item => {
        const row = [
          item.regional, item.municipio, item.nucleo, item.tipoRede, item.tecnologia,
          item.statusNucleo, item.dataEntregaPerdas, item.respEntrega,
          item.parceiraSigo, item.parceiraResponsavel, item.envioPendenciaRelatorioFinal,
          item.prazoConclusaoPendenciasRelatorioFinal, item.ligacoesExecutadasCampo,
          item.ligacoesNotasBaixadas, item.meioAmbienteStatus, item.meioAmbienteRestricaoClientes,
          item.poderPublicoStatus, item.poderPublicoRestricaoClientes, item.chiStatus, item.chiRestricaoClientes,
          item.conjunto, item.chiNecessario, item.chiDisponivelBtZero, item.chiLimiteBtzero,
          item.chiConsumidoBtzero, item.oportunidadeChi, `${item.statusAndamentoConstrucao}%`,
          item.prazoConclusaoConstrucao, `${item.statusAndamentoRegularizacao}%`,
          item.prazoConclusaoRegularizacao, `${item.statusAndamentoDesativacao}%`,
          item.prazoConclusaoDesativacao, item.prioridadeFinalizacao, item.observacoesGerais.replace(/;/g, ',').replace(/\n/g, ' ')
        ];
        csvRows.push(row.join(';'));
      });

      const csvContent = "data:text/csv;charset=utf-8,﻿" + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `sigo_nucleos_sms_geral_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerNotification('Planilha exportada com sucesso como CSV delimitado por ponto e vírgula (;)', 'success');
    } catch (e) {
      triggerNotification('Erro ao exportar planilha.', 'error');
    }
  };

  const handleCopyCode = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(key);
    triggerNotification('Código copiado para a área de transferência!', 'success');
    setTimeout(() => {
      setCopiedSection(null);
    }, 3000);
  };

  // --- SAVE OR EDIT SUBMIT ---
  const handleOpenEdit = (item: Nucleo) => {
    setSelectedNucleo(item);
    setFormValues(item);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formValues.regional) errors.regional = 'Regional é obrigatória';
    if (!formValues.municipio) errors.municipio = 'Município é obrigatório';
    if (!formValues.nucleo || formValues.nucleo.trim() === '') {
      errors.nucleo = 'Nome do Núcleo é obrigatório';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      triggerNotification('Por favor, corrija os erros no formulário.', 'error');
      return;
    }

    if (selectedNucleo) {
      const updated = nucleos.map(item => {
        if (item.id === selectedNucleo.id) {
          return { ...item, ...formValues } as Nucleo;
        }
        return item;
      });
      saveToStorage(updated);
      setSelectedNucleo(null);
      triggerNotification(`Núcleo ${formValues.nucleo} atualizado com sucesso!`);
    }
  };

  const handleDeleteNucleo = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir permanentemente o núcleo "${name}" do SIGO?`)) {
      const updated = nucleos.filter(item => item.id !== id);
      saveToStorage(updated);
      setSelectedNucleo(null);
      triggerNotification(`Núcleo ${name} excluído com sucesso!`, 'info');
    }
  };

  const handleDuplicateNucleo = (item: Nucleo) => {
    const duplicated: Nucleo = {
      ...item,
      id: 'nuc_' + Date.now().toString(),
      nucleo: `${item.nucleo}_COPIA`,
    };
    saveToStorage([duplicated, ...nucleos]);
    triggerNotification(`Núcleo ${item.nucleo} duplicado com sucesso como cópia!`, 'success');
  };

  // --- KPI CALCULATIONS ---
  const stats = useMemo(() => {
    const total = nucleos.length;

    const avgConstruction = total > 0
      ? Math.round(nucleos.reduce((acc, curr) => acc + curr.statusAndamentoConstrucao, 0) / total)
      : 0;

    const activeRestrictions = nucleos.reduce((acc, curr) => {
      const maRest = curr.meioAmbienteStatus === 'Pendente' ? curr.meioAmbienteRestricaoClientes : 0;
      const ppRest = curr.poderPublicoStatus === 'Pendente' ? curr.poderPublicoRestricaoClientes : 0;
      const chiRest = curr.chiStatus === 'Pendente' ? curr.chiRestricaoClientes : 0;
      return acc + maRest + ppRest + chiRest;
    }, 0);

    const totalLimiteChi = nucleos.reduce((acc, curr) => acc + curr.chiLimiteBtzero, 0);
    const totalConsumidoChi = nucleos.reduce((acc, curr) => acc + curr.chiConsumidoBtzero, 0);
    const totalDisponivelChi = Math.max(0, totalLimiteChi - totalConsumidoChi);

    const chiSaturation = totalLimiteChi > 0
      ? Math.round((totalConsumidoChi / totalLimiteChi) * 100)
      : 0;

    return {
      total,
      avgConstruction,
      activeRestrictions,
      totalLimiteChi,
      totalConsumidoChi,
      totalDisponivelChi,
      chiSaturation
    };
  }, [nucleos]);

  // --- CUSTOM SVG CHARTS DATA ---
  const chartsData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    STATUS_NUCLEO.forEach(s => { statusCounts[s] = 0; });
    nucleos.forEach(n => {
      statusCounts[n.statusNucleo] = (statusCounts[n.statusNucleo] || 0) + 1;
    });

    const regionalProgress: Record<string, { sum: number; count: number }> = {};
    REGIONAIS.forEach(r => { regionalProgress[r] = { sum: 0, count: 0 }; });

    nucleos.forEach(n => {
      if (regionalProgress[n.regional]) {
        regionalProgress[n.regional].sum += n.statusAndamentoConstrucao;
        regionalProgress[n.regional].count += 1;
      }
    });

    const regionalBars = Object.keys(regionalProgress).map(reg => {
      const item = regionalProgress[reg];
      const avg = item.count > 0 ? Math.round(item.sum / item.count) : 0;
      return { label: reg, value: avg, count: item.count };
    });

    return {
      statusPie: Object.keys(statusCounts).map(status => ({
        label: status,
        count: statusCounts[status]
      })),
      regionalBars
    };
  }, [nucleos]);

  const tabBtnCls = (tab: typeof activeTab) =>
    `px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 flex items-center gap-2 ${
      activeTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
    }`;

  return (
    <div className="min-h-full text-slate-200 font-sans flex flex-col selection:bg-blue-500/30" style={{ background: SURFACE_PAGE }}>

      <div className="max-w-[1600px] w-full mx-auto p-4 flex flex-col gap-5">

        {/* HEADER CARD */}
        <header className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl border border-white/5 shadow-xl">
          <div className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-xl font-bold flex items-center justify-center shadow-md">
                <HardHat className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-wider text-xl text-blue-400">SIGO</span>
                  <span className="text-slate-500 font-light text-sm">|</span>
                  <span className="text-slate-300 text-sm font-semibold tracking-wide">SISTEMA DE GESTÃO DE OBRAS</span>
                </div>
                <h1 className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">
                  Controle de Núcleos SMS - Geral • Acompanhamento Operacional
                </h1>
              </div>
            </div>

            {/* Tab Selection */}
            <div className="flex items-center p-1 rounded-lg border border-white/10 w-fit self-start md:self-auto" style={{ background: SURFACE_HEAD }}>
              <button onClick={() => setActiveTab('tabela')} className={tabBtnCls('tabela')}>
                <FileText className="w-3.5 h-3.5" />
                Tabela de Núcleos
              </button>
              <button onClick={() => setActiveTab('graficos')} className={tabBtnCls('graficos')}>
                <BarChart3 className="w-3.5 h-3.5" />
                Gráficos & KPIs
              </button>
              <button onClick={() => setActiveTab('desenvolvedor')} className={tabBtnCls('desenvolvedor')}>
                <Database className="w-3.5 h-3.5" />
                Estrutura para o Dev
              </button>
            </div>
          </div>
        </header>

        {/* GLOBAL ALERTS / FEEDBACK NOTIFICATIONS */}
        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm max-w-md ${
              notification.type === 'success'
                ? 'border-emerald-500/30 text-emerald-300'
                : notification.type === 'info'
                ? 'border-blue-500/30 text-blue-300'
                : 'border-rose-500/30 text-rose-300'
            }`}
            style={{ background: SURFACE_CARD }}
          >
            {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
            {notification.type === 'info' && <Clock className="w-5 h-5 text-blue-400 shrink-0" />}
            {notification.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
            <div>
              <p className="font-semibold">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="ml-auto text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ----------------- TAB 1: INTERACTIVE TABLE VIEW ----------------- */}
        {activeTab === 'tabela' && (
          <div className="space-y-4">

            {/* Control, Search & Preset Filters Header */}
            <div className="rounded-xl border border-white/8 px-5 py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4" style={{ background: SURFACE_HEAD }}>

              {/* Search & Filters Group */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">

                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar por Núcleo, Cidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder:text-slate-500"
                    style={{ background: SURFACE_INPUT }}
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2 text-slate-500 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filter Regional */}
                <select
                  value={filterRegional}
                  onChange={(e) => setFilterRegional(e.target.value)}
                  className="w-full py-2 px-3 text-xs text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                  style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                >
                  <option value="">Todas Regionais</option>
                  {REGIONAIS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                {/* Filter Status */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full py-2 px-3 text-xs text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                  style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                >
                  <option value="">Todos Statuses</option>
                  {STATUS_NUCLEO.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                {/* Filter Prioridade */}
                <select
                  value={filterPrioridade}
                  onChange={(e) => setFilterPrioridade(e.target.value)}
                  className="w-full py-2 px-3 text-xs text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                  style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                >
                  <option value="">Todas Prioridades</option>
                  <option value="Alta">Prioridade Alta</option>
                  <option value="Média">Prioridade Média</option>
                  <option value="Baixa">Prioridade Baixa</option>
                </select>

              </div>

              {/* Actions Group */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="text-slate-300 hover:text-white border border-white/10 hover:border-white/20 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  style={{ background: SURFACE_INPUT }}
                  title="Exportar dados como arquivo .csv delimitado por ponto e vírgula"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
                <button
                  onClick={handleResetData}
                  className="text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  style={{ background: SURFACE_INPUT }}
                  title="Recarregar dados originais"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Restaurar
                </button>
              </div>
            </div>

            {/* SPREADSHEET TABLE CARD */}
            <div className="rounded-2xl border border-white/8 shadow-2xl overflow-hidden flex flex-col" style={{ background: SURFACE_CARD }}>

              <div className="overflow-x-auto relative max-w-full">
                <table className="w-full text-left border-collapse text-xs min-w-[3300px]">

                  <thead className="sticky top-0 z-20">

                    {/* FIELD / COLUMN HEADERS */}
                    <tr className="border-b border-white/10 font-bold uppercase tracking-wide text-[11px] select-none" style={{ background: SURFACE_HEAD }}>

                      {/* Ações */}
                      <th className="w-10 border-r border-white/8 px-2 py-3" style={{ background: SURFACE_HEAD }}>
                        <Trash2 className="w-3.5 h-3.5 text-white/20 mx-auto" />
                      </th>

                      {/* 1. Identification */}
                      <th onClick={() => toggleSort('regional')} className="px-3 py-3 hover:bg-white/5 cursor-pointer w-[150px] border-r border-white/8">
                        <div className="flex items-center gap-1 text-emerald-400">
                          Regional <ArrowUpDown className="w-3.5 h-3.5" />
                        </div>
                      </th>
                      <th onClick={() => toggleSort('municipio')} className="px-3 py-3 hover:bg-white/5 cursor-pointer w-[160px] border-r border-white/8">
                        <div className="flex items-center gap-1 text-emerald-400">
                          Município <ArrowUpDown className="w-3.5 h-3.5" />
                        </div>
                      </th>
                      <th onClick={() => toggleSort('nucleo')} className="px-3 py-3 hover:bg-white/5 cursor-pointer w-[190px] border-r border-white/8">
                        <div className="flex items-center gap-1 text-emerald-400">
                          Núcleo <ArrowUpDown className="w-3.5 h-3.5" />
                        </div>
                      </th>
                      <th onClick={() => toggleSort('tipoRede')} className="px-3 py-3 hover:bg-white/5 cursor-pointer w-[120px] border-r border-white/8 text-slate-300">
                        Tipo de rede
                      </th>
                      <th onClick={() => toggleSort('tecnologia')} className="px-3 py-3 hover:bg-white/5 cursor-pointer w-[120px] border-r border-white/15 text-slate-300">
                        Tecnologia
                      </th>

                      {/* 2. Status & Delivery */}
                      <th onClick={() => toggleSort('statusNucleo')} className="px-3 py-3 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer w-[170px] border-r border-white/8 text-amber-400">
                        Status do núcleo
                      </th>
                      <th onClick={() => toggleSort('dataEntregaPerdas')} className="px-3 py-3 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer w-[150px] border-r border-white/8 text-amber-400">
                        Data entrega a Perdas
                      </th>
                      <th onClick={() => toggleSort('respEntrega')} className="px-3 py-3 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer w-[170px] border-r border-white/15 text-amber-400">
                        Resp. pela entrega
                      </th>

                      {/* 3. Partners */}
                      <th onClick={() => toggleSort('parceiraSigo')} className="px-3 py-3 hover:bg-white/5 cursor-pointer w-[150px] border-r border-white/8 text-slate-300">
                        Parceira SIGO
                      </th>
                      <th onClick={() => toggleSort('parceiraResponsavel')} className="px-3 py-3 hover:bg-white/5 cursor-pointer w-[160px] border-r border-white/15 text-slate-300">
                        Parceira responsável
                      </th>

                      {/* 5. Connections */}
                      <th onClick={() => toggleSort('ligacoesExecutadasCampo')} className="px-3 py-3 bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer w-[160px] text-right border-r border-white/8 text-blue-400">
                        Ligações (Exec. campo)
                      </th>
                      <th onClick={() => toggleSort('ligacoesNotasBaixadas')} className="px-3 py-3 bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer w-[160px] text-right border-r border-white/15 text-blue-400">
                        Ligações (Notas baixadas)
                      </th>

                      {/* 6. Restrictions */}
                      <th onClick={() => toggleSort('meioAmbienteStatus')} className="px-3 py-3 bg-rose-500/5 hover:bg-rose-500/10 cursor-pointer w-[140px] border-r border-white/8 text-rose-400">
                        Meio Ambiente
                      </th>
                      <th onClick={() => toggleSort('meioAmbienteRestricaoClientes')} className="px-3 py-3 bg-rose-500/5 hover:bg-rose-500/10 cursor-pointer w-[150px] text-right border-r border-white/8 text-rose-400">
                        Quant. Restrição (clientes)
                      </th>
                      <th onClick={() => toggleSort('poderPublicoStatus')} className="px-3 py-3 bg-rose-500/5 hover:bg-rose-500/10 cursor-pointer w-[140px] border-r border-white/8 text-rose-400">
                        Poder Público
                      </th>
                      <th onClick={() => toggleSort('poderPublicoRestricaoClientes')} className="px-3 py-3 bg-rose-500/5 hover:bg-rose-500/10 cursor-pointer w-[150px] text-right border-r border-white/8 text-rose-400">
                        Quant. Restrição (clientes)
                      </th>
                      <th onClick={() => toggleSort('chiStatus')} className="px-3 py-3 bg-rose-500/5 hover:bg-rose-500/10 cursor-pointer w-[120px] border-r border-white/8 text-rose-400">
                        CHI
                      </th>
                      <th onClick={() => toggleSort('chiRestricaoClientes')} className="px-3 py-3 bg-rose-500/5 hover:bg-rose-500/10 cursor-pointer w-[150px] text-right border-r border-white/15 text-rose-400">
                        Quant. Restrição (CHI)
                      </th>

                      {/* 7. Conjunto & CHI */}
                      <th onClick={() => toggleSort('conjunto')} className="px-3 py-3 bg-violet-500/5 hover:bg-violet-500/10 cursor-pointer w-[180px] border-r border-white/8 text-violet-400">
                        Conjunto
                      </th>
                      <th onClick={() => toggleSort('chiNecessario')} className="px-3 py-3 bg-violet-500/5 hover:bg-violet-500/10 cursor-pointer w-[130px] text-right border-r border-white/8 text-violet-400">
                        CHI Necessário
                      </th>
                      <th onClick={() => toggleSort('chiDisponivelBtZero')} className="px-3 py-3 bg-violet-500/5 hover:bg-violet-500/10 cursor-pointer w-[150px] text-right border-r border-white/8 text-violet-400">
                        CHI Disponível BTZero
                      </th>
                      <th onClick={() => toggleSort('chiLimiteBtzero')} className="px-3 py-3 bg-violet-500/5 hover:bg-violet-500/10 cursor-pointer w-[140px] text-right border-r border-white/8 text-violet-400">
                        CHI Limite Btzero
                      </th>
                      <th onClick={() => toggleSort('chiConsumidoBtzero')} className="px-3 py-3 bg-violet-500/5 hover:bg-violet-500/10 cursor-pointer w-[150px] text-right border-r border-white/8 text-violet-400">
                        CHI Consumido Btzero
                      </th>
                      <th onClick={() => toggleSort('oportunidadeChi')} className="px-3 py-3 bg-violet-500/5 hover:bg-violet-500/10 cursor-pointer w-[150px] border-r border-white/15 text-violet-400">
                        Oportunidade de CHI
                      </th>

                      {/* 8. Progress and deadlines */}
                      <th onClick={() => toggleSort('statusAndamentoConstrucao')} className="px-3 py-3 hover:bg-white/5 cursor-pointer w-[170px] text-right border-r border-white/8 text-slate-300">
                        Status Construção %
                      </th>
                      <th onClick={() => toggleSort('prazoConclusaoConstrucao')} className="px-3 py-3 hover:bg-white/5 cursor-pointer w-[150px] border-r border-white/8 text-slate-300">
                        Prazo Construção
                      </th>
                      <th onClick={() => toggleSort('statusAndamentoRegularizacao')} className="px-3 py-3 hover:bg-white/5 cursor-pointer w-[175px] text-right border-r border-white/8 text-slate-300">
                        Status Regularização %
                      </th>
                      <th onClick={() => toggleSort('prazoConclusaoRegularizacao')} className="px-3 py-3 hover:bg-white/5 cursor-pointer w-[150px] border-r border-white/8 text-slate-300">
                        Prazo Regularização
                      </th>
                      <th onClick={() => toggleSort('statusAndamentoDesativacao')} className="px-3 py-3 hover:bg-white/5 cursor-pointer w-[170px] text-right border-r border-white/8 text-slate-300">
                        Status Desativação %
                      </th>
                      <th onClick={() => toggleSort('prazoConclusaoDesativacao')} className="px-3 py-3 hover:bg-white/5 cursor-pointer w-[150px] border-r border-white/8 text-slate-300">
                        Prazo Desativação
                      </th>
                      <th onClick={() => toggleSort('prioridadeFinalizacao')} className="px-3 py-3 hover:bg-white/5 cursor-pointer w-[140px] border-r border-white/8 text-slate-300">
                        Prioridade finalização
                      </th>
                      <th onClick={() => toggleSort('envioPendenciaRelatorioFinal')} className="px-3 py-3 bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer w-[180px] border-r border-white/8 text-blue-400/80">
                        Envio de pendência (data)
                      </th>
                      <th onClick={() => toggleSort('prazoConclusaoPendenciasRelatorioFinal')} className="px-3 py-3 bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer w-[185px] border-r border-white/15 text-blue-400/80">
                        Prazo de conclusão (data)
                      </th>
                      <th className="px-3 py-3 w-[250px] text-slate-300">
                        Observações gerais
                      </th>

                    </tr>
                  </thead>

                  {/* TABLE BODY ROWS */}
                  <tbody>

                    {/* ── LINHA DE CADASTRO INLINE ────────────────────────── */}
                    <tr className="border-b-2 border-white/15 bg-blue-500/[0.06]">
                      {/* Ações: confirmar / limpar */}
                      <td className="border-r border-white/8 border-l-2 border-l-blue-500 p-1 align-middle">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={handleCommitNewRow}
                            title="Cadastrar núcleo"
                            className="w-6 h-6 flex items-center justify-center rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleClearNewRow}
                            title="Limpar linha"
                            className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-white transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Regional */}
                      <td className="p-1 border-r border-white/8">
                        <select
                          value={newRow.regional || ''}
                          onChange={(e) => handleNewRowChange('regional', e.target.value)}
                          className={`${newCellInputCls} font-semibold`}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        >
                          {REGIONAIS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>

                      {/* Município */}
                      <td className="p-1 border-r border-white/8">
                        <select
                          value={newRow.municipio || ''}
                          onChange={(e) => handleNewRowChange('municipio', e.target.value)}
                          className={newCellInputCls}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        >
                          {(MUNICIPIOS[newRow.regional || ''] || []).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </td>

                      {/* Núcleo */}
                      <td className="p-1 border-r border-white/8">
                        <input
                          type="text"
                          value={newRow.nucleo || ''}
                          onChange={(e) => handleNewRowChange('nucleo', e.target.value.toUpperCase())}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleCommitNewRow(); }}
                          placeholder="NUC-SPO-..."
                          className={`${newCellInputCls} font-mono font-bold ${newRowError ? 'border-rose-500/60' : ''}`}
                          style={{ background: SURFACE_INPUT }}
                        />
                        {newRowError && (
                          <span className="block text-[10px] font-bold text-rose-400 mt-0.5 px-0.5">{newRowError}</span>
                        )}
                      </td>

                      {/* Tipo de rede */}
                      <td className="p-1 border-r border-white/8">
                        <select
                          value={newRow.tipoRede || ''}
                          onChange={(e) => handleNewRowChange('tipoRede', e.target.value)}
                          className={newCellInputCls}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        >
                          {TIPOS_REDE.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>

                      {/* Tecnologia */}
                      <td className="p-1 border-r border-white/15">
                        <select
                          value={newRow.tecnologia || ''}
                          onChange={(e) => handleNewRowChange('tecnologia', e.target.value)}
                          className={newCellInputCls}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        >
                          {TECNOLOGIAS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>

                      {/* Status do núcleo */}
                      <td className="p-1 border-r border-white/8">
                        <select
                          value={newRow.statusNucleo || ''}
                          onChange={(e) => handleNewRowChange('statusNucleo', e.target.value)}
                          className={newCellInputCls}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        >
                          {STATUS_NUCLEO.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>

                      {/* Data entrega a Perdas */}
                      <td className="p-1 border-r border-white/8">
                        <input
                          type="date"
                          value={newRow.dataEntregaPerdas || ''}
                          onChange={(e) => handleNewRowChange('dataEntregaPerdas', e.target.value)}
                          className={newCellInputCls}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        />
                      </td>

                      {/* Resp. pela entrega */}
                      <td className="p-1 border-r border-white/15">
                        <input
                          type="text"
                          value={newRow.respEntrega || ''}
                          onChange={(e) => handleNewRowChange('respEntrega', e.target.value)}
                          placeholder="Responsável"
                          className={newCellInputCls}
                          style={{ background: SURFACE_INPUT }}
                        />
                      </td>

                      {/* Parceira SIGO */}
                      <td className="p-1 border-r border-white/8">
                        <select
                          value={newRow.parceiraSigo || ''}
                          onChange={(e) => handleNewRowChange('parceiraSigo', e.target.value)}
                          className={newCellInputCls}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        >
                          {PARCEIRAS_SIGO.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>

                      {/* Parceira responsável */}
                      <td className="p-1 border-r border-white/15">
                        <select
                          value={newRow.parceiraResponsavel || ''}
                          onChange={(e) => handleNewRowChange('parceiraResponsavel', e.target.value)}
                          className={newCellInputCls}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        >
                          {PARCEIRAS_RESPONSAVEIS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>

                      {/* Ligações exec. campo */}
                      <td className="p-1 border-r border-white/8">
                        <input
                          type="number"
                          value={newRow.ligacoesExecutadasCampo ?? 0}
                          onChange={(e) => handleNewRowChange('ligacoesExecutadasCampo', Number(e.target.value))}
                          className={`${newCellInputCls} text-right font-mono`}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        />
                      </td>

                      {/* Ligações notas baixadas */}
                      <td className="p-1 border-r border-white/15">
                        <input
                          type="number"
                          value={newRow.ligacoesNotasBaixadas ?? 0}
                          onChange={(e) => handleNewRowChange('ligacoesNotasBaixadas', Number(e.target.value))}
                          className={`${newCellInputCls} text-right font-mono`}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        />
                      </td>

                      {/* Meio Ambiente */}
                      <td className="p-1 border-r border-white/8">
                        <select
                          value={newRow.meioAmbienteStatus || ''}
                          onChange={(e) => handleNewRowChange('meioAmbienteStatus', e.target.value)}
                          className={newCellInputCls}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        >
                          {STATUS_RESTRIÇÃO.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="p-1 border-r border-white/8">
                        <input
                          type="number"
                          disabled={newRow.meioAmbienteStatus !== 'Pendente'}
                          value={newRow.meioAmbienteRestricaoClientes ?? 0}
                          onChange={(e) => handleNewRowChange('meioAmbienteRestricaoClientes', Number(e.target.value))}
                          className={`${newCellInputCls} text-right font-mono disabled:opacity-40`}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        />
                      </td>

                      {/* Poder Público */}
                      <td className="p-1 border-r border-white/8">
                        <select
                          value={newRow.poderPublicoStatus || ''}
                          onChange={(e) => handleNewRowChange('poderPublicoStatus', e.target.value)}
                          className={newCellInputCls}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        >
                          {STATUS_RESTRIÇÃO.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="p-1 border-r border-white/8">
                        <input
                          type="number"
                          disabled={newRow.poderPublicoStatus !== 'Pendente'}
                          value={newRow.poderPublicoRestricaoClientes ?? 0}
                          onChange={(e) => handleNewRowChange('poderPublicoRestricaoClientes', Number(e.target.value))}
                          className={`${newCellInputCls} text-right font-mono disabled:opacity-40`}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        />
                      </td>

                      {/* CHI restrição */}
                      <td className="p-1 border-r border-white/8">
                        <select
                          value={newRow.chiStatus || ''}
                          onChange={(e) => handleNewRowChange('chiStatus', e.target.value)}
                          className={newCellInputCls}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        >
                          {STATUS_RESTRIÇÃO.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="p-1 border-r border-white/15">
                        <input
                          type="number"
                          disabled={newRow.chiStatus !== 'Pendente'}
                          value={newRow.chiRestricaoClientes ?? 0}
                          onChange={(e) => handleNewRowChange('chiRestricaoClientes', Number(e.target.value))}
                          className={`${newCellInputCls} text-right font-mono disabled:opacity-40`}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        />
                      </td>

                      {/* Conjunto */}
                      <td className="p-1 border-r border-white/8">
                        <select
                          value={newRow.conjunto || ''}
                          onChange={(e) => handleNewRowChange('conjunto', e.target.value)}
                          className={newCellInputCls}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        >
                          <option value="">Sem Conjunto</option>
                          {CONJUNTOS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>

                      {/* CHI Necessário */}
                      <td className="p-1 border-r border-white/8">
                        <input
                          type="number"
                          value={newRow.chiNecessario ?? 0}
                          onChange={(e) => handleNewRowChange('chiNecessario', Number(e.target.value))}
                          className={`${newCellInputCls} text-right font-mono`}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        />
                      </td>

                      {/* CHI Disponível (calculado) */}
                      <td className="p-1 border-r border-white/8">
                        <div className="w-full text-xs font-mono font-bold text-violet-300 py-1.5 px-1.5 rounded-md border border-white/5 text-right" style={{ background: '#0a1628' }}>
                          {newRow.chiDisponivelBtZero ?? 0}
                        </div>
                      </td>

                      {/* CHI Limite */}
                      <td className="p-1 border-r border-white/8">
                        <input
                          type="number"
                          value={newRow.chiLimiteBtzero ?? 0}
                          onChange={(e) => handleNewRowChange('chiLimiteBtzero', Number(e.target.value))}
                          className={`${newCellInputCls} text-right font-mono`}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        />
                      </td>

                      {/* CHI Consumido */}
                      <td className="p-1 border-r border-white/8">
                        <input
                          type="number"
                          value={newRow.chiConsumidoBtzero ?? 0}
                          onChange={(e) => handleNewRowChange('chiConsumidoBtzero', Number(e.target.value))}
                          className={`${newCellInputCls} text-right font-mono`}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        />
                      </td>

                      {/* Oportunidade CHI */}
                      <td className="p-1 border-r border-white/15">
                        <select
                          value={newRow.oportunidadeChi || ''}
                          onChange={(e) => handleNewRowChange('oportunidadeChi', e.target.value)}
                          className={newCellInputCls}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        >
                          {OPORTUNIDADES_CHI.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>

                      {/* Progresso construção */}
                      <td className="p-1 border-r border-white/8">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={newRow.statusAndamentoConstrucao ?? 0}
                          onChange={(e) => handleNewRowChange('statusAndamentoConstrucao', Number(e.target.value))}
                          className={`${newCellInputCls} text-right font-mono`}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        />
                      </td>
                      <td className="p-1 border-r border-white/8">
                        <input
                          type="date"
                          value={newRow.prazoConclusaoConstrucao || ''}
                          onChange={(e) => handleNewRowChange('prazoConclusaoConstrucao', e.target.value)}
                          className={newCellInputCls}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        />
                      </td>

                      {/* Progresso regularização */}
                      <td className="p-1 border-r border-white/8">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={newRow.statusAndamentoRegularizacao ?? 0}
                          onChange={(e) => handleNewRowChange('statusAndamentoRegularizacao', Number(e.target.value))}
                          className={`${newCellInputCls} text-right font-mono`}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        />
                      </td>
                      <td className="p-1 border-r border-white/8">
                        <input
                          type="date"
                          value={newRow.prazoConclusaoRegularizacao || ''}
                          onChange={(e) => handleNewRowChange('prazoConclusaoRegularizacao', e.target.value)}
                          className={newCellInputCls}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        />
                      </td>

                      {/* Progresso desativação */}
                      <td className="p-1 border-r border-white/8">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={newRow.statusAndamentoDesativacao ?? 0}
                          onChange={(e) => handleNewRowChange('statusAndamentoDesativacao', Number(e.target.value))}
                          className={`${newCellInputCls} text-right font-mono`}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        />
                      </td>
                      <td className="p-1 border-r border-white/8">
                        <input
                          type="date"
                          value={newRow.prazoConclusaoDesativacao || ''}
                          onChange={(e) => handleNewRowChange('prazoConclusaoDesativacao', e.target.value)}
                          className={newCellInputCls}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        />
                      </td>

                      {/* Prioridade */}
                      <td className="p-1 border-r border-white/8">
                        <select
                          value={newRow.prioridadeFinalizacao || 'Média'}
                          onChange={(e) => handleNewRowChange('prioridadeFinalizacao', e.target.value)}
                          className={newCellInputCls}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        >
                          <option value="Alta">Alta</option>
                          <option value="Média">Média</option>
                          <option value="Baixa">Baixa</option>
                        </select>
                      </td>

                      {/* Pendências relatório */}
                      <td className="p-1 border-r border-white/8">
                        <input
                          type="date"
                          value={newRow.envioPendenciaRelatorioFinal || ''}
                          onChange={(e) => handleNewRowChange('envioPendenciaRelatorioFinal', e.target.value)}
                          className={newCellInputCls}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        />
                      </td>
                      <td className="p-1 border-r border-white/15">
                        <input
                          type="date"
                          value={newRow.prazoConclusaoPendenciasRelatorioFinal || ''}
                          onChange={(e) => handleNewRowChange('prazoConclusaoPendenciasRelatorioFinal', e.target.value)}
                          className={newCellInputCls}
                          style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                        />
                      </td>

                      {/* Observações */}
                      <td className="p-1">
                        <input
                          type="text"
                          value={newRow.observacoesGerais || ''}
                          onChange={(e) => handleNewRowChange('observacoesGerais', e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleCommitNewRow(); }}
                          placeholder="Observações..."
                          className={newCellInputCls}
                          style={{ background: SURFACE_INPUT }}
                        />
                      </td>
                    </tr>

                    {/* ── LINHAS CADASTRADAS ──────────────────────────────── */}
                    {filteredNucleos.length > 0 ? (
                      filteredNucleos.map((item) => (
                        <tr
                          key={item.id}
                          onClick={(e) => {
                            const target = e.target as HTMLElement;
                            if (target.closest('select') || target.closest('input') || target.closest('button')) {
                              return;
                            }
                            handleOpenEdit(item);
                          }}
                          className="cursor-pointer group transition-colors border-t border-white/6"
                          style={{ background: SURFACE_CARD }}
                          onMouseEnter={e => (e.currentTarget.style.background = SURFACE_HOVER)}
                          onMouseLeave={e => (e.currentTarget.style.background = SURFACE_CARD)}
                        >
                          {/* Excluir */}
                          <td className="w-10 border-r border-white/8 p-0 text-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteNucleo(item.id, item.nucleo); }}
                              className="w-full h-10 flex items-center justify-center text-white/20 hover:text-rose-400 transition-colors"
                              title="Excluir núcleo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>

                          {/* Identification columns */}
                          <td className="p-1 border-r border-white/8" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={item.regional}
                              onChange={(e) => handleUpdateField(item.id, 'regional', e.target.value)}
                              className={`${cellInputCls} font-bold text-emerald-300 cursor-pointer`}
                              style={{ colorScheme: 'dark' }}
                            >
                              {REGIONAIS.map(r => (
                                <option key={r} value={r} style={{ background: SURFACE_INPUT }}>{r}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-1 border-r border-white/8" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={item.municipio}
                              onChange={(e) => handleUpdateField(item.id, 'municipio', e.target.value)}
                              className={`${cellInputCls} font-semibold cursor-pointer`}
                              style={{ colorScheme: 'dark' }}
                            >
                              {Object.values(MUNICIPIOS).flat().map(m => (
                                <option key={m} value={m} style={{ background: SURFACE_INPUT }}>{m}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-white border-r border-white/8">
                            <div className="flex items-center gap-1.5 justify-between">
                              <span className="underline decoration-dotted decoration-blue-400/60 font-bold">{item.nucleo}</span>
                              <Edit className="w-3 h-3 text-white/20 group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100" />
                            </div>
                          </td>
                          <td className="px-3 py-2.5 border-r border-white/8 text-slate-400">
                            {item.tipoRede}
                          </td>
                          <td className="px-3 py-2.5 font-semibold border-r border-white/15 text-slate-400">
                            {item.tecnologia}
                          </td>

                          {/* Status block */}
                          <td className="px-3 py-2.5 border-r border-white/8 bg-amber-500/[0.03]">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.statusNucleo === 'Ativo' || item.statusNucleo === 'Concluído'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                : item.statusNucleo === 'Em Construção'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                                : item.statusNucleo === 'Suspenso'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full mr-1 bg-current"></span>
                              {item.statusNucleo}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 border-r border-white/8 font-mono text-slate-400 bg-amber-500/[0.03]">
                            {item.dataEntregaPerdas ? new Date(item.dataEntregaPerdas).toLocaleDateString('pt-BR') : '—'}
                          </td>
                          <td className="px-3 py-2.5 border-r border-white/15 text-slate-300 font-medium truncate max-w-[160px] bg-amber-500/[0.03]" title={item.respEntrega}>
                            {item.respEntrega || '—'}
                          </td>

                          {/* Partners */}
                          <td className="p-1 border-r border-white/8" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={item.parceiraSigo}
                              onChange={(e) => handleUpdateField(item.id, 'parceiraSigo', e.target.value)}
                              className={`${cellInputCls} text-slate-400 cursor-pointer`}
                              style={{ colorScheme: 'dark' }}
                            >
                              {PARCEIRAS_SIGO.map(p => (
                                <option key={p} value={p} style={{ background: SURFACE_INPUT }}>{p}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2.5 border-r border-white/15 text-slate-400 font-medium">
                            {item.parceiraResponsavel}
                          </td>

                          {/* Connections */}
                          <td className="px-3 py-2.5 border-r border-white/8 text-right font-mono font-bold text-slate-200 bg-blue-500/[0.03]">
                            {item.ligacoesExecutadasCampo.toLocaleString('pt-BR')}
                          </td>
                          <td className="px-3 py-2.5 border-r border-white/15 text-right font-mono font-semibold text-slate-200 bg-blue-500/[0.03]">
                            {item.ligacoesNotasBaixadas.toLocaleString('pt-BR')}
                          </td>

                          {/* Restrictions */}
                          <td className="px-3 py-2.5 border-r border-white/8 bg-rose-500/[0.03]">
                            <span className={`font-semibold ${
                              item.meioAmbienteStatus === 'Pendente'
                                ? 'text-rose-400'
                                : item.meioAmbienteStatus === 'Liberado'
                                ? 'text-emerald-400'
                                : 'text-slate-500'
                            }`}>{item.meioAmbienteStatus}</span>
                          </td>
                          <td className={`px-3 py-2.5 border-r border-white/8 text-right font-mono font-bold bg-rose-500/[0.03] ${
                            item.meioAmbienteRestricaoClientes > 0 && item.meioAmbienteStatus === 'Pendente' ? 'text-rose-400' : 'text-slate-400'
                          }`}>
                            {item.meioAmbienteRestricaoClientes}
                          </td>
                          <td className="px-3 py-2.5 border-r border-white/8 bg-rose-500/[0.03]">
                            <span className={`font-semibold ${
                              item.poderPublicoStatus === 'Pendente'
                                ? 'text-rose-400'
                                : item.poderPublicoStatus === 'Liberado'
                                ? 'text-emerald-400'
                                : 'text-slate-500'
                            }`}>{item.poderPublicoStatus}</span>
                          </td>
                          <td className={`px-3 py-2.5 border-r border-white/8 text-right font-mono font-bold bg-rose-500/[0.03] ${
                            item.poderPublicoRestricaoClientes > 0 && item.poderPublicoStatus === 'Pendente' ? 'text-rose-400' : 'text-slate-400'
                          }`}>
                            {item.poderPublicoRestricaoClientes}
                          </td>
                          <td className="px-3 py-2.5 border-r border-white/8 bg-rose-500/[0.03]">
                            <span className={`font-semibold ${
                              item.chiStatus === 'Pendente'
                                ? 'text-rose-400'
                                : item.chiStatus === 'Liberado'
                                ? 'text-emerald-400'
                                : 'text-slate-500'
                            }`}>{item.chiStatus}</span>
                          </td>
                          <td className={`px-3 py-2.5 border-r border-white/15 text-right font-mono font-bold bg-rose-500/[0.03] ${
                            item.chiRestricaoClientes > 0 && item.chiStatus === 'Pendente' ? 'text-rose-400' : 'text-slate-400'
                          }`}>
                            {item.chiRestricaoClientes}
                          </td>

                          {/* Conjunto & CHI */}
                          <td className="p-1 border-r border-white/8 bg-violet-500/[0.03]" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={item.conjunto || ''}
                              onChange={(e) => handleUpdateField(item.id, 'conjunto', e.target.value)}
                              className={`${cellInputCls} font-semibold text-violet-300 cursor-pointer`}
                              style={{ colorScheme: 'dark' }}
                            >
                              <option value="" style={{ background: SURFACE_INPUT }}>Sem Conjunto</option>
                              {CONJUNTOS.map(c => (
                                <option key={c} value={c} style={{ background: SURFACE_INPUT }}>{c}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2.5 border-r border-white/8 text-right font-mono text-slate-400 bg-violet-500/[0.03]">
                            {item.chiNecessario}
                          </td>
                          <td className={`px-3 py-2.5 border-r border-white/8 text-right font-mono font-bold bg-violet-500/[0.03] ${
                            item.chiDisponivelBtZero === 0 ? 'text-rose-400' : 'text-slate-200'
                          }`}>
                            {item.chiDisponivelBtZero}
                          </td>
                          <td className="px-3 py-2.5 border-r border-white/8 text-right font-mono text-slate-400 bg-violet-500/[0.03]">
                            {item.chiLimiteBtzero}
                          </td>
                          <td className="px-3 py-2.5 border-r border-white/8 text-right font-mono text-slate-400 bg-violet-500/[0.03]">
                            {item.chiConsumidoBtzero}
                          </td>
                          <td className="px-3 py-2.5 border-r border-white/15 bg-violet-500/[0.03]">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                              item.oportunidadeChi === 'Sim'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                : item.oportunidadeChi === 'Em Análise'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                : 'bg-white/5 text-slate-500 border-white/10'
                            }`}>
                              {item.oportunidadeChi}
                            </span>
                          </td>

                          {/* Progress & Deadlines */}
                          <td className="px-3 py-2.5 border-r border-white/8 text-right font-mono font-semibold">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className={item.statusAndamentoConstrucao === 100 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                                {item.statusAndamentoConstrucao}%
                              </span>
                              <div className="w-10 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${item.statusAndamentoConstrucao}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 border-r border-white/8 font-mono text-slate-400">
                            {item.prazoConclusaoConstrucao ? new Date(item.prazoConclusaoConstrucao).toLocaleDateString('pt-BR') : '—'}
                          </td>

                          <td className="px-3 py-2.5 border-r border-white/8 text-right font-mono font-semibold">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className={item.statusAndamentoRegularizacao === 100 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                                {item.statusAndamentoRegularizacao}%
                              </span>
                              <div className="w-10 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${item.statusAndamentoRegularizacao}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 border-r border-white/8 font-mono text-slate-400">
                            {item.prazoConclusaoRegularizacao ? new Date(item.prazoConclusaoRegularizacao).toLocaleDateString('pt-BR') : '—'}
                          </td>

                          <td className="px-3 py-2.5 border-r border-white/8 text-right font-mono font-semibold">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-slate-300">{item.statusAndamentoDesativacao}%</span>
                              <div className="w-10 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                <div className="bg-violet-500 h-full rounded-full" style={{ width: `${item.statusAndamentoDesativacao}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 border-r border-white/8 font-mono text-slate-400">
                            {item.prazoConclusaoDesativacao ? new Date(item.prazoConclusaoDesativacao).toLocaleDateString('pt-BR') : '—'}
                          </td>

                          <td className="px-3 py-2.5 border-r border-white/8 font-bold">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                              item.prioridadeFinalizacao === 'Alta'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                                : item.prioridadeFinalizacao === 'Média'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                : 'bg-white/5 text-slate-400 border-white/10'
                            }`}>
                              {item.prioridadeFinalizacao}
                            </span>
                          </td>

                          {/* Report Pendencies */}
                          <td className="px-3 py-2.5 border-r border-white/8 font-mono text-slate-400 bg-blue-500/[0.03]">
                            {item.envioPendenciaRelatorioFinal ? new Date(item.envioPendenciaRelatorioFinal).toLocaleDateString('pt-BR') : '—'}
                          </td>
                          <td className="px-3 py-2.5 border-r border-white/15 font-mono text-slate-400 bg-blue-500/[0.03]">
                            {item.prazoConclusaoPendenciasRelatorioFinal ? new Date(item.prazoConclusaoPendenciasRelatorioFinal).toLocaleDateString('pt-BR') : '—'}
                          </td>

                          <td className="px-3 py-2.5 text-slate-500 truncate max-w-[240px]" title={item.observacoesGerais}>
                            {item.observacoesGerais || '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr style={{ background: SURFACE_CARD }}>
                        <td colSpan={35} className="px-4 py-12 text-center text-slate-500 font-medium">
                          <AlertTriangle className="w-8 h-8 text-white/15 mx-auto mb-2" />
                          Nenhum núcleo cadastrado. Preencha a linha destacada acima para adicionar o primeiro.
                        </td>
                      </tr>
                    )}
                  </tbody>

                </table>
              </div>

              {/* Table Footer Stats / Status summary */}
              <div className="border-t border-white/8 px-4 py-3 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2" style={{ background: SURFACE_HEAD }}>
                <div>
                  Exibindo <span className="font-bold text-slate-200">{filteredNucleos.length}</span> de <span className="font-bold text-slate-200">{nucleos.length}</span> núcleos cadastrados.
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Ativos/Concluídos ({nucleos.filter(n => n.statusNucleo === 'Ativo' || n.statusNucleo === 'Concluído').length})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Em Construção ({nucleos.filter(n => n.statusNucleo === 'Em Construção').length})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pendentes ({nucleos.filter(n => n.statusNucleo === 'Pendente Regularização').length})
                  </span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ----------------- TAB 2: ANALYTICS & CHARTS VIEW ----------------- */}
        {activeTab === 'graficos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Visual breakdown by Regional */}
            <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-6 border border-white/5 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 uppercase tracking-wide">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Progresso Médio de Obras por Regional
              </h3>
              <p className="text-xs text-slate-500">
                Média do percentual de conclusão da fase de construção (%) em cada regional cadastrada.
              </p>

              <div className="space-y-4 pt-2">
                {chartsData.regionalBars.map(bar => (
                  <div key={bar.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-300">
                      <span>{bar.label} ({bar.count} núcleos)</span>
                      <span>{bar.value}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${bar.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Core Status distribution */}
            <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-6 border border-white/5 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 uppercase tracking-wide">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                Distribuição de Status dos Núcleos
              </h3>
              <p className="text-xs text-slate-500">
                Detalhamento numérico da situação operacional de todos os núcleos cadastrados.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                {chartsData.statusPie.map(item => {
                  const percentage = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                  return (
                    <div key={item.label} className="border border-white/8 p-3 rounded-xl text-center flex flex-col justify-center items-center gap-1.5" style={{ background: SURFACE_HEAD }}>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate max-w-full" title={item.label}>
                        {item.label}
                      </span>
                      <span className="text-2xl font-black text-white">{item.count}</span>
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/25 px-1.5 py-0.5 rounded-full">
                        {percentage}% do total
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Saturation, Limits & Opportunities of CHI */}
            <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-6 border border-white/5 shadow-xl space-y-4 lg:col-span-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 uppercase tracking-wide">
                <Activity className="w-4 h-4 text-blue-400" />
                Controle de CHI (Consumo vs Limite por Núcleo)
              </h3>
              <p className="text-xs text-slate-500">
                Acompanhamento individualizado de saturação de CHI. Núcleos em vermelho esgotaram o CHI e necessitam liberação ou possuem status crítico.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
                {nucleos.map(n => {
                  const saturation = n.chiLimiteBtzero > 0 ? Math.round((n.chiConsumidoBtzero / n.chiLimiteBtzero) * 100) : 0;
                  const isSaturated = saturation >= 100;
                  const isLow = !isSaturated && saturation >= 80;

                  return (
                    <div
                      key={n.id}
                      className={`p-4 rounded-xl border ${
                        isSaturated
                          ? 'border-rose-500/30'
                          : isLow
                          ? 'border-amber-500/30'
                          : 'border-white/8'
                      }`}
                      style={{ background: SURFACE_HEAD }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-bold text-slate-200 truncate max-w-[120px]" title={n.nucleo}>{n.nucleo}</span>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
                          isSaturated
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                            : isLow
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                        }`}>
                          {saturation}% Consumido
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div
                          className={`h-full rounded-full ${
                            isSaturated ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, saturation)}%` }}
                        ></div>
                      </div>

                      <div className="grid grid-cols-3 text-[10px] text-slate-500 font-semibold gap-1">
                        <div>
                          <span>Limite:</span>
                          <span className="block font-mono text-xs text-slate-200">{n.chiLimiteBtzero}</span>
                        </div>
                        <div>
                          <span>Consumido:</span>
                          <span className="block font-mono text-xs text-slate-200">{n.chiConsumidoBtzero}</span>
                        </div>
                        <div>
                          <span>Disponível:</span>
                          <span className={`block font-mono text-xs font-bold ${
                            n.chiDisponivelBtZero === 0 ? 'text-rose-400' : 'text-slate-200'
                          }`}>{n.chiDisponivelBtZero}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ----------------- TAB 3: DEVELOPER PORTAL VIEW ----------------- */}
        {activeTab === 'desenvolvedor' && (
          <div className="space-y-6">

            {/* Developer guide header */}
            <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl flex items-start gap-4">
              <div className="p-3 bg-blue-600 text-white rounded-xl shrink-0">
                <Code className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-blue-400">Portal do Desenvolvedor de Sistemas SIGO</h2>
                <p className="text-xs text-slate-400">
                  O objetivo desta tela é fornecer ao desenvolvedor do SIGO toda a estrutura pronta de banco de dados e APIs necessários para subir esta rotina de acompanhamento dos Núcleos no sistema real.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded-full border border-white/10" style={{ background: SURFACE_HEAD }}>Database: PostgreSQL / MySQL / SQL Server</span>
                  <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded-full border border-white/10" style={{ background: SURFACE_HEAD }}>API: JSON RESTful</span>
                  <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded-full border border-white/10" style={{ background: SURFACE_HEAD }}>Architecture: MVC Pattern</span>
                </div>
              </div>
            </div>

            {[
              { key: 'postgres_ddl', icon: Database, title: '1. Script SQL DDL de Criação da Tabela (PostgreSQL)', code: SQL_SCHEMA_POSTGRES, label: 'Copiar SQL', maxH: 'max-h-[350px]' },
              { key: 'insert_seeds', icon: Database, title: '2. Script SQL de Seeds (Insert de Exemplo)', code: SQL_INSERT_SEEDS, label: 'Copiar SQL Seeds', maxH: 'max-h-[300px]' },
              { key: 'express_controller', icon: Code, title: '3. Backend Controller & Endpoints (Node.js Express / pg)', code: BACKEND_CONTROLLER_CODE, label: 'Copiar Código', maxH: 'max-h-[350px]' },
            ].map(section => {
              const Icon = section.icon;
              return (
                <div key={section.key} className="rounded-2xl border border-white/8 shadow-2xl overflow-hidden flex flex-col" style={{ background: SURFACE_CARD }}>
                  <div className="border-b border-white/8 px-4 py-3 flex items-center justify-between" style={{ background: SURFACE_HEAD }}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span className="font-bold text-xs text-slate-200">{section.title}</span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(section.code, section.key)}
                      className="text-slate-300 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all"
                      style={{ background: SURFACE_INPUT }}
                    >
                      {copiedSection === section.key ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          {section.label}
                        </>
                      )}
                    </button>
                  </div>
                  <pre className={`p-4 text-slate-300 text-[11.5px] font-mono overflow-x-auto leading-relaxed ${section.maxH}`} style={{ background: '#050d18' }}>
                    <code>{section.code}</code>
                  </pre>
                </div>
              );
            })}

          </div>
        )}

      </div>

      {/* ----------------- SIDEBAR MODAL: EDIT DRAWER ----------------- */}
      {selectedNucleo && (
        <div className="fixed inset-0 z-40 flex justify-end">

          {/* Backdrop */}
          <div
            onClick={() => setSelectedNucleo(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Sliding Content Container */}
          <div className="relative w-full max-w-2xl h-full shadow-2xl flex flex-col z-10 overflow-hidden border-l border-white/10" style={{ background: SURFACE_CARD }}>

            {/* Drawer Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-white/8" style={{ background: SURFACE_HEAD }}>
              <div>
                <h3 className="font-extrabold tracking-wide text-sm uppercase text-blue-400">
                  Acompanhamento do Núcleo
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Editando dados de controle de: {selectedNucleo.nucleo}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDuplicateNucleo(selectedNucleo)}
                  className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                  title="Duplicar este registro como cópia"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedNucleo(null)}
                  className="p-1 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Drawer Body Form */}
            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-5 space-y-6">

              {/* SECTION 1: IDENTIFICATION */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-white/8 pb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  1. Identificação Geral
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Regional *</label>
                    <select
                      value={formValues.regional || ''}
                      onChange={(e) => handleRegionalChange(e.target.value)}
                      className="w-full text-xs py-2 px-2.5 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                    >
                      {REGIONAIS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    {formErrors.regional && <span className="text-[10px] font-bold text-rose-400 mt-1 block">{formErrors.regional}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Município *</label>
                    <select
                      value={formValues.municipio || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, municipio: e.target.value }))}
                      className="w-full text-xs py-2 px-2.5 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                    >
                      {(MUNICIPIOS[formValues.regional || ''] || []).map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    {formErrors.municipio && <span className="text-[10px] font-bold text-rose-400 mt-1 block">{formErrors.municipio}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">Nome do Núcleo *</label>
                    <input
                      type="text"
                      value={formValues.nucleo || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, nucleo: e.target.value.toUpperCase() }))}
                      placeholder="Ex: NUC-SPO-PAULISTA-08"
                      className="w-full text-xs font-mono py-2 px-2.5 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ background: SURFACE_INPUT }}
                    />
                    {formErrors.nucleo && <span className="text-[10px] font-bold text-rose-400 mt-1 block">{formErrors.nucleo}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Tecnologia</label>
                    <select
                      value={formValues.tecnologia || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, tecnologia: e.target.value }))}
                      className="w-full text-xs py-2 px-2.5 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                    >
                      {TECNOLOGIAS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Tipo de rede</label>
                    <select
                      value={formValues.tipoRede || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, tipoRede: e.target.value }))}
                      className="w-full text-xs py-2 px-2.5 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                    >
                      {TIPOS_REDE.map(tr => (
                        <option key={tr} value={tr}>{tr}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Prioridade finalização</label>
                    <select
                      value={formValues.prioridadeFinalizacao || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, prioridadeFinalizacao: e.target.value as any }))}
                      className="w-full text-xs py-2 px-2.5 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                    >
                      <option value="Alta">Alta</option>
                      <option value="Média">Média</option>
                      <option value="Baixa">Baixa</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: STATUS & ENTREGA */}
              <div className="space-y-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-amber-500/20 pb-1 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  2. Status Operacional & Entrega Perdas
                </h4>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Status do núcleo</label>
                    <select
                      value={formValues.statusNucleo || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, statusNucleo: e.target.value }))}
                      className="w-full text-xs py-2 px-2 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                    >
                      {STATUS_NUCLEO.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Data entrega Perdas</label>
                    <input
                      type="date"
                      value={formValues.dataEntregaPerdas || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, dataEntregaPerdas: e.target.value }))}
                      className="w-full text-xs py-1.5 px-2 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Resp. pela entrega</label>
                    <input
                      type="text"
                      value={formValues.respEntrega || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, respEntrega: e.target.value }))}
                      placeholder="Nome do responsável"
                      className="w-full text-xs py-2 px-2 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ background: SURFACE_INPUT }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Parceira SIGO</label>
                    <select
                      value={formValues.parceiraSigo || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, parceiraSigo: e.target.value }))}
                      className="w-full text-xs py-2 px-2 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                    >
                      {PARCEIRAS_SIGO.map(ps => (
                        <option key={ps} value={ps}>{ps}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Parceira responsável</label>
                    <select
                      value={formValues.parceiraResponsavel || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, parceiraResponsavel: e.target.value }))}
                      className="w-full text-xs py-2 px-2 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                    >
                      {PARCEIRAS_RESPONSAVEIS.map(pr => (
                        <option key={pr} value={pr}>{pr}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: PENDÊNCIAS & LIGAÇÕES */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-white/8 pb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  3. Relatórios & Ligações de Clientes
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Data Envio Pendência Relatório</label>
                    <input
                      type="date"
                      value={formValues.envioPendenciaRelatorioFinal || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, envioPendenciaRelatorioFinal: e.target.value }))}
                      className="w-full text-xs py-1.5 px-2.5 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Prazo de Conclusão Relatório</label>
                    <input
                      type="date"
                      value={formValues.prazoConclusaoPendenciasRelatorioFinal || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, prazoConclusaoPendenciasRelatorioFinal: e.target.value }))}
                      className="w-full text-xs py-1.5 px-2.5 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.04]">
                  <div>
                    <label className="block text-xs font-bold text-blue-300 mb-1">Ligações (Executadas campo)</label>
                    <input
                      type="number"
                      value={formValues.ligacoesExecutadasCampo || 0}
                      onChange={(e) => setFormValues(prev => ({ ...prev, ligacoesExecutadasCampo: Number(e.target.value) }))}
                      className="w-full text-xs py-2 px-2.5 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-300 mb-1">Ligações (Notas baixadas)</label>
                    <input
                      type="number"
                      value={formValues.ligacoesNotasBaixadas || 0}
                      onChange={(e) => setFormValues(prev => ({ ...prev, ligacoesNotasBaixadas: Number(e.target.value) }))}
                      className="w-full text-xs py-2 px-2.5 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: RESTRIÇÕES */}
              <div className="space-y-4 p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.04]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 border-b border-rose-500/20 pb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  4. Controle de Restrições Técnicas
                </h4>

                {([
                  { statusField: 'meioAmbienteStatus', qtyField: 'meioAmbienteRestricaoClientes', label: 'Meio Ambiente (Status)', qtyLabel: 'Quant. Restrição (clientes)' },
                  { statusField: 'poderPublicoStatus', qtyField: 'poderPublicoRestricaoClientes', label: 'Poder Público (Status)', qtyLabel: 'Quant. Restrição (clientes)' },
                  { statusField: 'chiStatus', qtyField: 'chiRestricaoClientes', label: 'CHI', qtyLabel: 'Quant. Restrição (CHI)' },
                ] as const).map(row => (
                  <div key={row.statusField} className="grid grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">{row.label}</label>
                      <select
                        value={(formValues[row.statusField] as string) || 'Liberado'}
                        onChange={(e) => setFormValues(prev => ({ ...prev, [row.statusField]: e.target.value }))}
                        className="w-full text-xs py-2 px-2 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                      >
                        {STATUS_RESTRIÇÃO.map(sr => (
                          <option key={sr} value={sr}>{sr}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">{row.qtyLabel}</label>
                      <input
                        type="number"
                        disabled={formValues[row.statusField] !== 'Pendente'}
                        value={(formValues[row.qtyField] as number) || 0}
                        onChange={(e) => setFormValues(prev => ({ ...prev, [row.qtyField]: Number(e.target.value) }))}
                        className="w-full text-xs py-2 px-2 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-40"
                        style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* SECTION 5: CONJUNTO & CHI DETAILS */}
              <div className="space-y-4 p-4 rounded-xl border border-violet-500/20 bg-violet-500/[0.04]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400 border-b border-violet-500/20 pb-1 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  5. Conjunto Elétrico & Cálculo de CHI
                </h4>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">Conjunto Elétrico</label>
                    <select
                      value={formValues.conjunto || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, conjunto: e.target.value }))}
                      className="w-full text-xs py-2 px-2.5 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                    >
                      <option value="">Selecione um Conjunto...</option>
                      {CONJUNTOS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">CHI Necessário</label>
                    <input
                      type="number"
                      value={formValues.chiNecessario || 0}
                      onChange={(e) => setFormValues(prev => ({ ...prev, chiNecessario: Number(e.target.value) }))}
                      className="w-full text-xs py-2 px-2 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 p-3 rounded-lg border border-white/8" style={{ background: SURFACE_HEAD }}>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">CHI Limite Btzero</label>
                    <input
                      type="number"
                      value={formValues.chiLimiteBtzero || 0}
                      onChange={(e) => setFormValues(prev => ({ ...prev, chiLimiteBtzero: Number(e.target.value) }))}
                      className="w-full text-xs py-2 px-2 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">CHI Consumido Btzero</label>
                    <input
                      type="number"
                      value={formValues.chiConsumidoBtzero || 0}
                      onChange={(e) => setFormValues(prev => ({ ...prev, chiConsumidoBtzero: Number(e.target.value) }))}
                      className="w-full text-xs py-2 px-2 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">CHI Disponível</label>
                    <div className="w-full text-xs py-2 px-2.5 font-bold font-mono text-violet-300 rounded-lg border border-violet-500/25 bg-violet-500/10 text-center">
                      {formValues.chiDisponivelBtZero}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Oportunidade de CHI</label>
                  <select
                    value={formValues.oportunidadeChi || 'Não'}
                    onChange={(e) => setFormValues(prev => ({ ...prev, oportunidadeChi: e.target.value }))}
                    className="w-full text-xs py-2 px-2.5 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                  >
                    {OPORTUNIDADES_CHI.map(op => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SECTION 6: CONSTRUCTION PROGRESS & DEADLINES */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/8 pb-1 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  6. Progresso Físico de Obras & Prazos
                </h4>

                {([
                  { pctField: 'statusAndamentoConstrucao', dateField: 'prazoConclusaoConstrucao', label: 'Construção', accent: 'accent-emerald-500' },
                  { pctField: 'statusAndamentoRegularizacao', dateField: 'prazoConclusaoRegularizacao', label: 'Regularização', accent: 'accent-blue-500' },
                  { pctField: 'statusAndamentoDesativacao', dateField: 'prazoConclusaoDesativacao', label: 'Desativação', accent: 'accent-violet-500' },
                ] as const).map(row => (
                  <div key={row.pctField} className="grid grid-cols-2 gap-4 p-3 rounded-lg border border-white/8" style={{ background: SURFACE_HEAD }}>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Progresso {row.label} %</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={(formValues[row.pctField] as number) || 0}
                          onChange={(e) => setFormValues(prev => ({ ...prev, [row.pctField]: Number(e.target.value) }))}
                          className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-white/10 ${row.accent}`}
                        />
                        <span className="font-mono font-bold text-xs w-10 text-right text-slate-200">{(formValues[row.pctField] as number) || 0}%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Prazo Conclusão {row.label}</label>
                      <input
                        type="date"
                        value={(formValues[row.dateField] as string) || ''}
                        onChange={(e) => setFormValues(prev => ({ ...prev, [row.dateField]: e.target.value }))}
                        className="w-full text-xs py-1.5 px-2 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        style={{ background: SURFACE_INPUT, colorScheme: 'dark' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* COMMENTS */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Observações gerais</label>
                <textarea
                  value={formValues.observacoesGerais || ''}
                  onChange={(e) => setFormValues(prev => ({ ...prev, observacoesGerais: e.target.value }))}
                  rows={3}
                  className="w-full text-xs p-2.5 text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder:text-slate-500"
                  style={{ background: SURFACE_INPUT }}
                  placeholder="Escreva detalhes técnicos relevantes ou observações adicionais..."
                />
              </div>

            </form>

            {/* Drawer Footer Actions */}
            <div className="border-t border-white/8 px-5 py-3.5 flex items-center justify-between" style={{ background: SURFACE_HEAD }}>
              <button
                type="button"
                onClick={() => handleDeleteNucleo(selectedNucleo.id, selectedNucleo.nucleo)}
                className="text-rose-400 hover:text-white hover:bg-rose-600 border border-rose-500/30 hover:border-rose-600 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Núcleo
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedNucleo(null)}
                  className="text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: SURFACE_INPUT }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  onClick={handleSaveForm}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-lg text-xs shadow-sm transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
