'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CampaignTotals } from '../lib/types';
import { formatMetricValue } from '../lib/calculations';

interface Column {
  id: string;
  label: string;
  render: (row: CampaignTotals) => string;
  numeric: boolean;
  sortKey: keyof CampaignTotals;
}

const COLUMNS: Column[] = [
  { id: 'campaignName', label: 'Campaña', render: (r) => r.campaignName, numeric: false, sortKey: 'campaignName' },
  { id: 'amountSpent', label: 'Gasto', render: (r) => `$${r.amountSpent.toFixed(2)}`, numeric: true, sortKey: 'amountSpent' },
  { id: 'impressions', label: 'Impresiones', render: (r) => r.impressions.toLocaleString('en-US'), numeric: true, sortKey: 'impressions' },
  { id: 'uniqueLinkClicks', label: 'Clics', render: (r) => r.uniqueLinkClicks.toLocaleString('en-US'), numeric: true, sortKey: 'uniqueLinkClicks' },
  { id: 'landingPageViews', label: 'Visitas VSL', render: (r) => r.landingPageViews.toLocaleString('en-US'), numeric: true, sortKey: 'landingPageViews' },
  { id: 'leads', label: 'Leads', render: (r) => r.leads.toLocaleString('en-US'), numeric: true, sortKey: 'leads' },
  { id: 'appointmentsScheduled', label: 'Schedules', render: (r) => r.appointmentsScheduled.toLocaleString('en-US'), numeric: true, sortKey: 'appointmentsScheduled' },
  { id: 'checkoutsInitiated', label: 'Agendas Calif.', render: (r) => r.checkoutsInitiated.toLocaleString('en-US'), numeric: true, sortKey: 'checkoutsInitiated' },
  { id: 'costPerLead', label: 'Costo/Lead', render: (r) => formatMetricValue(r.costPerLead, 'cost'), numeric: true, sortKey: 'costPerLead' },
  { id: 'costPerSchedule', label: 'Costo/Schedule', render: (r) => formatMetricValue(r.costPerSchedule, 'cost'), numeric: true, sortKey: 'costPerSchedule' },
  { id: 'costPerCheckout', label: 'Costo/Agenda Calif.', render: (r) => formatMetricValue(r.costPerCheckout, 'cost'), numeric: true, sortKey: 'costPerCheckout' },
  { id: 'ctr', label: 'CTR', render: (r) => formatMetricValue(r.ctr, 'percent'), numeric: true, sortKey: 'ctr' },
  { id: 'loadRate', label: '% Carga', render: (r) => formatMetricValue(r.loadRate, 'percent'), numeric: true, sortKey: 'loadRate' },
  { id: 'vslToLead', label: '% VSL→Lead', render: (r) => formatMetricValue(r.vslToLead, 'percent'), numeric: true, sortKey: 'vslToLead' },
  { id: 'leadToSchedule', label: '% Lead→Schedule', render: (r) => formatMetricValue(r.leadToSchedule, 'percent'), numeric: true, sortKey: 'leadToSchedule' },
  { id: 'scheduleToCheckout', label: '% Sched→Agenda', render: (r) => formatMetricValue(r.scheduleToCheckout, 'percent'), numeric: true, sortKey: 'scheduleToCheckout' },
];

function SortableHeader({ col, sortKey, sortDir, onSort }: {
  col: Column;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  onSort: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  const isActive = sortKey === col.id;

  return (
    <th
      ref={setNodeRef}
      style={{ ...style, minWidth: col.id === 'campaignName' ? 200 : 100 }}
      className="px-3 py-2.5 text-left select-none"
      {...attributes}
      {...listeners}
    >
      <button
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider w-full"
        style={{ color: isActive ? '#60a5fa' : 'var(--color-text-muted)' }}
        onClick={(e) => {
          e.stopPropagation();
          onSort(col.id);
        }}
      >
        {col.label}
        {isActive && (
          <span style={{ fontSize: 10 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
        )}
      </button>
    </th>
  );
}

interface CampaignTableProps {
  campaigns: CampaignTotals[];
}

export default function CampaignTable({ campaigns }: CampaignTableProps) {
  const [colOrder, setColOrder] = useState<string[]>(COLUMNS.map((c) => c.id));
  const [sortKey, setSortKey] = useState<string>('costPerCheckout');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setColOrder((prev) => arrayMove(prev, prev.indexOf(active.id as string), prev.indexOf(over.id as string)));
  };

  const handleSort = (id: string) => {
    if (sortKey === id) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(id);
      setSortDir('asc');
    }
  };

  const sorted = [...campaigns].sort((a, b) => {
    if (sortKey === 'costPerCheckout') {
      const aVal = a.costPerCheckout;
      const bVal = b.costPerCheckout;
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }

    const col = COLUMNS.find((c) => c.id === sortKey);
    if (!col) return 0;
    const key = col.sortKey;
    const aVal = a[key] as number | null | string;
    const bVal = b[key] as number | null | string;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const orderedCols = colOrder.map((id) => COLUMNS.find((c) => c.id === id)!).filter(Boolean);

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
          RANKING DE CAMPAÑAS
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: 1200 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={colOrder} strategy={horizontalListSortingStrategy}>
                  {orderedCols.map((col) => (
                    <SortableHeader
                      key={col.id}
                      col={col}
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => {
              const isExpanded = expandedRows.has(row.campaignName);
              return (
                <tr
                  key={row.campaignName}
                  className="transition-colors"
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}
                >
                  {orderedCols.map((col) => {
                    const value = col.render(row);
                    const isCampCol = col.id === 'campaignName';

                    return (
                      <td
                        key={col.id}
                        className={`px-3 py-2.5 ${col.numeric ? 'font-mono text-right' : ''}`}
                        style={{
                          color: value === '—' ? '#4b5563' : 'var(--color-text)',
                          maxWidth: isCampCol ? 200 : undefined,
                        }}
                      >
                        {isCampCol ? (
                          <button
                            className="text-left hover:text-blue-400 transition-colors"
                            style={{
                              maxWidth: 190,
                              overflow: 'hidden',
                              textOverflow: isExpanded ? 'initial' : 'ellipsis',
                              whiteSpace: isExpanded ? 'normal' : 'nowrap',
                              display: 'block',
                              fontSize: 12,
                            }}
                            onClick={() =>
                              setExpandedRows((prev) => {
                                const next = new Set(prev);
                                if (next.has(row.campaignName)) next.delete(row.campaignName);
                                else next.add(row.campaignName);
                                return next;
                              })
                            }
                            title={row.campaignName}
                          >
                            {value}
                          </button>
                        ) : (
                          <span className="text-xs">{value}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
