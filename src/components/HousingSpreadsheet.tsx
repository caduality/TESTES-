import { Fragment, useMemo, useState } from 'react';
import { ArrowDownUp, ChevronDown, ChevronRight, Download, Search } from 'lucide-react';
import {
  formatBRL,
  formatNumber,
  getComplexTotals,
  HOUSING_COMPLEXES,
} from '../data/habitacionais';

type SortField = 'name' | 'units' | 'value';

interface HousingSpreadsheetProps {
  selectedComplexId: string | null;
  onSelectComplex: (id: string | null) => void;
}

export function HousingSpreadsheet({
  selectedComplexId,
  onSelectComplex,
}: HousingSpreadsheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('units');
  const [sortDesc, setSortDesc] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDesc((v) => !v);
    } else {
      setSortField(field);
      setSortDesc(field !== 'name');
    }
  };

  const groupedRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = HOUSING_COMPLEXES.map((c) => {
      const totals = getComplexTotals(c);
      return {
        complex: c,
        units: totals.units,
        value: totals.value,
      };
    }).filter((row) => {
      if (!q) return true;
      return (
        row.complex.name.toLowerCase().includes(q) ||
        row.complex.neighborhood.toLowerCase().includes(q) ||
        row.complex.stages.some((st) => st.name.toLowerCase().includes(q))
      );
    });

    list.sort((a, b) => {
      let diff = 0;
      if (sortField === 'name') {
        diff = a.complex.name.localeCompare(b.complex.name, 'pt-BR');
      } else if (sortField === 'units') {
        diff = a.units - b.units;
      } else {
        diff = a.value - b.value;
      }
      return sortDesc ? -diff : diff;
    });

    return list;
  }, [searchQuery, sortField, sortDesc]);

  const totals = useMemo(() => {
    return groupedRows.reduce(
      (acc, r) => ({
        units: acc.units + r.units,
        value: acc.value + r.value,
      }),
      { units: 0, value: 0 }
    );
  }, [groupedRows]);

  const handleDownloadCsv = () => {
    const header = [
      'Conjunto / Etapa',
      'Bairro',
      'Casas (UHs)',
      'Valor contratado (R$)',
    ];
    const rows = groupedRows.flatMap((r) => [
      [
        `"${r.complex.name} (TOTAL)"`,
        `"${r.complex.neighborhood}"`,
        r.units,
        r.value.toFixed(2),
      ].join(','),
      ...r.complex.stages.map((st) =>
        [
          `"  - ${st.name}"`,
          `"${r.complex.neighborhood}"`,
          st.units,
          st.value.toFixed(2),
        ].join(',')
      ),
    ]);

    const csv = '\uFEFF' + [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mcmv-juazeiro-casas-e-valores.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="border border-stone-200 rounded-xl bg-white overflow-hidden">
      {/* Header & Controls */}
      <div className="px-4 py-3.5 border-b border-stone-200 bg-stone-50/70 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              Planilha de casas e valores contratados (Minha Casa, Minha Vida)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Clique em um conjunto para destacar no mapa ou expanda para ver as etapas individuais
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar residencial…"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
              />
            </div>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/50 text-[11px] uppercase tracking-wider text-stone-500">
              <th className="py-2.5 px-4 font-semibold">
                <button
                  type="button"
                  onClick={() => handleSort('name')}
                  className="inline-flex items-center gap-1 hover:text-stone-900 cursor-pointer"
                >
                  Conjunto / Etapa
                  <ArrowDownUp className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 font-semibold text-right">
                <button
                  type="button"
                  onClick={() => handleSort('units')}
                  className="inline-flex items-center gap-1 hover:text-stone-900 cursor-pointer"
                >
                  Casas
                  <ArrowDownUp className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-4 font-semibold text-right">
                <button
                  type="button"
                  onClick={() => handleSort('value')}
                  className="inline-flex items-center gap-1 hover:text-stone-900 cursor-pointer"
                >
                  Valor contratado
                  <ArrowDownUp className="w-3 h-3" />
                </button>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100">
            {groupedRows.map((row) => {
              const isSelected = row.complex.id === selectedComplexId;
              const hasMultipleStages = row.complex.stages.length > 1;
              const isExpanded = !!expandedIds[row.complex.id];

              return (
                <Fragment key={row.complex.id}>
                  <tr
                    onClick={() =>
                      onSelectComplex(isSelected ? null : row.complex.id)
                    }
                    className={`transition-colors cursor-pointer ${
                      isSelected ? 'bg-red-50/70' : 'hover:bg-stone-50'
                    }`}
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex items-start gap-2">
                        {hasMultipleStages ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(row.complex.id);
                            }}
                            className="mt-0.5 p-0.5 text-stone-400 hover:text-stone-900 rounded cursor-pointer"
                            aria-label={
                              isExpanded
                                ? 'Ocultar etapas'
                                : 'Ver etapas individuais'
                            }
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        ) : (
                          <span className="w-4.5 inline-block shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold text-stone-900 block">
                            {row.complex.name}
                          </span>
                          <span className="text-[11px] text-stone-500">
                            {row.complex.neighborhood} · {row.complex.statusLabel}
                            {hasMultipleStages && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(row.complex.id);
                                }}
                                className="ml-1.5 text-[#C71E1D] hover:underline cursor-pointer"
                              >
                                {isExpanded
                                  ? 'ocultar etapas'
                                  : `ver ${row.complex.stages.length} etapas`}
                              </button>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular font-semibold text-stone-900 whitespace-nowrap">
                      {formatNumber(row.units)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono-tabular text-stone-900 whitespace-nowrap">
                      {formatBRL(row.value)}
                    </td>
                  </tr>

                  {hasMultipleStages &&
                    isExpanded &&
                    row.complex.stages.map((st) => (
                      <tr key={st.id} className="bg-stone-50/75 text-xs">
                        <td className="py-2 pl-10 pr-4 text-stone-700">
                          {st.name}
                        </td>
                        <td className="py-2 px-3 text-right font-mono-tabular text-stone-700 whitespace-nowrap">
                          {formatNumber(st.units)}
                        </td>
                        <td className="py-2 px-4 text-right font-mono-tabular text-stone-700 whitespace-nowrap">
                          {formatBRL(st.value)}
                        </td>
                      </tr>
                    ))}
                </Fragment>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="border-t-2 border-stone-300 bg-stone-100/80 font-bold text-stone-900">
              <td className="py-2.5 px-4 text-xs sm:text-sm">
                {searchQuery
                  ? 'Total do filtro atual'
                  : 'Total dos 7 conjuntos no mapa'}
              </td>
              <td className="py-2.5 px-3 text-right font-mono-tabular whitespace-nowrap">
                {formatNumber(totals.units)}
              </td>
              <td className="py-2.5 px-4 text-right font-mono-tabular whitespace-nowrap">
                {formatBRL(totals.value)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
