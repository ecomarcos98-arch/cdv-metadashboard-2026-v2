'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KpiMetrics } from '../lib/types';
import { formatMetricValue, calcPercentChange } from '../lib/calculations';

interface KpiCard {
  id: string;
  label: string;
  tooltip: string;
  value: number | null;
  prevValue: number | null;
  type: 'cost' | 'percent' | 'volume' | 'cpm';
  changeDir: 'cost' | 'percent' | 'volume';
  isGlobal?: boolean;
}

function buildCards(current: KpiMetrics, prev: KpiMetrics): { costs: KpiCard[]; percents: KpiCard[]; volumes: KpiCard[] } {
  const costs: KpiCard[] = [
    { id: 'cpm', label: 'CPM', tooltip: 'Gasto / Impresiones × 1,000', value: current.cpm, prevValue: prev.cpm, type: 'cpm', changeDir: 'cost' },
    { id: 'cpc', label: 'CPC', tooltip: 'Gasto / Clics únicos', value: current.cpc, prevValue: prev.cpc, type: 'cost', changeDir: 'cost' },
    { id: 'costPerLead', label: 'Costo / Lead', tooltip: 'Gasto / Leads', value: current.costPerLead, prevValue: prev.costPerLead, type: 'cost', changeDir: 'cost' },
    { id: 'costPerSchedule', label: 'Costo / Schedule', tooltip: 'Gasto / Schedules', value: current.costPerSchedule, prevValue: prev.costPerSchedule, type: 'cost', changeDir: 'cost' },
    { id: 'costPerCheckout', label: 'Costo / Agenda Calif.', tooltip: 'Gasto / Checkouts iniciados', value: current.costPerCheckout, prevValue: prev.costPerCheckout, type: 'cost', changeDir: 'cost' },
    { id: 'costPerShow', label: 'Costo / Show', tooltip: 'Gasto / Shows asistidos — métrica global, no filtrable por campaña', value: current.costPerShow, prevValue: prev.costPerShow, type: 'cost', changeDir: 'cost', isGlobal: true },
  ];
  const percents: KpiCard[] = [
    { id: 'ctr', label: 'CTR', tooltip: 'Clics únicos / Impresiones × 100', value: current.ctr, prevValue: prev.ctr, type: 'percent', changeDir: 'percent' },
    { id: 'loadRate', label: '% Carga', tooltip: 'Landing Page Views / Clics × 100', value: current.loadRate, prevValue: prev.loadRate, type: 'percent', changeDir: 'percent' },
    { id: 'vslToLead', label: '% VSL → Lead', tooltip: 'Leads / Landing Page Views × 100', value: current.vslToLead, prevValue: prev.vslToLead, type: 'percent', changeDir: 'percent' },
    { id: 'leadToSchedule', label: '% Lead → Schedule', tooltip: 'Schedules / Leads × 100', value: current.leadToSchedule, prevValue: prev.leadToSchedule, type: 'percent', changeDir: 'percent' },
    { id: 'scheduleToCheckout', label: '% Schedule → Agenda Calif.', tooltip: 'Checkouts / Schedules × 100', value: current.scheduleToCheckout, prevValue: prev.scheduleToCheckout, type: 'percent', changeDir: 'percent' },
    { id: 'showRate', label: '% Asistencia', tooltip: 'Shows asistidos / Schedules × 100 — métrica global, no filtrable por campaña', value: current.showRate, prevValue: prev.showRate, type: 'percent', changeDir: 'percent', isGlobal: true },
  ];
  const volumes: KpiCard[] = [
    { id: 'totalSpent', label: 'Gasto Total', tooltip: 'Suma de Amount Spent en el período', value: current.totalSpent, prevValue: prev.totalSpent, type: 'cost', changeDir: 'volume' },
    { id: 'totalLeads', label: 'Leads', tooltip: 'Total de leads (forms completados)', value: current.totalLeads, prevValue: prev.totalLeads, type: 'volume', changeDir: 'volume' },
    { id: 'totalSchedules', label: 'Schedules', tooltip: 'Total de citas programadas', value: current.totalSchedules, prevValue: prev.totalSchedules, type: 'volume', changeDir: 'volume' },
    { id: 'totalCheckouts', label: 'Agendas Calif.', tooltip: 'Total de agendas calificadas (Checkouts iniciados)', value: current.totalCheckouts, prevValue: prev.totalCheckouts, type: 'volume', changeDir: 'volume' },
    { id: 'totalShows', label: 'Shows', tooltip: 'Total de citas asistidas en el período — métrica global, no filtrable por campaña', value: current.totalShows, prevValue: prev.totalShows, type: 'volume', changeDir: 'volume', isGlobal: true },
  ];
  return { costs, percents, volumes };
}

const STORAGE_KEY = 'kpi-card-order-cdv-v1';

function mergeOrder(stored: string[], defaultIds: string[]): string[] {
  // Add any new ids not in stored order, at the end
  const newIds = defaultIds.filter((id) => !stored.includes(id));
  // Remove any ids in stored that no longer exist
  const valid = stored.filter((id) => defaultIds.includes(id));
  return [...valid, ...newIds];
}

function loadOrder(defaultIds: string[], groupKey: string): string[] {
  if (typeof window === 'undefined') return defaultIds;
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}-${groupKey}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return mergeOrder(parsed, defaultIds);
    }
  } catch {}
  return defaultIds;
}

function saveOrder(groupKey: string, order: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_KEY}-${groupKey}`, JSON.stringify(order));
}

function SortableCard({ card }: { card: KpiCard }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  const change = calcPercentChange(card.value, card.prevValue);
  const formattedValue = formatMetricValue(card.value, card.type);

  let changeBadge = null;
  if (change !== null) {
    let color = '#6b7280';
    if (card.changeDir === 'cost') color = change < 0 ? '#22c55e' : '#ef4444';
    else if (card.changeDir === 'percent') color = change > 0 ? '#22c55e' : '#ef4444';
    const arrow = change >= 0 ? '↑' : '↓';
    changeBadge = (
      <span
        className="text-xs font-mono px-1.5 py-0.5 rounded-md"
        style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
      >
        {arrow} {Math.abs(change).toFixed(1)}%
      </span>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="card p-4 cursor-grab active:cursor-grabbing select-none"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-medium leading-tight truncate" style={{ color: 'var(--color-text-muted)' }}>
            {card.label}
          </span>
          {card.isGlobal && (
            <span
              className="flex-shrink-0 text-xs px-1 py-0.5 rounded"
              style={{ background: 'rgba(234,179,8,0.12)', color: '#eab308', fontSize: 8, lineHeight: 1 }}
              title="Métrica global — no se desglosa por campaña porque el CSV de shows no contiene atribución por UTM."
            >
              global
            </span>
          )}
        </div>
        <div className="relative flex-shrink-0">
          <button
            className="w-4 h-4 rounded-full flex items-center justify-center text-xs"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--color-text-muted)' }}
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
          >
            ?
          </button>
          {tooltipVisible && (
            <div
              className="absolute right-0 top-6 z-50 text-xs rounded-lg px-3 py-2"
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--color-text-muted)',
                maxWidth: 220,
                whiteSpace: 'normal',
              }}
            >
              {card.tooltip}
            </div>
          )}
        </div>
      </div>

      <div className="font-mono text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
        {formattedValue}
      </div>

      {changeBadge}
    </div>
  );
}

interface KpiCardsProps {
  current: KpiMetrics;
  previous: KpiMetrics;
}

export default function KpiCards({ current, previous }: KpiCardsProps) {
  const cards = buildCards(current, previous);

  const defaultCosts = cards.costs.map((c) => c.id);
  const defaultPercents = cards.percents.map((c) => c.id);
  const defaultVolumes = cards.volumes.map((c) => c.id);

  const [costsOrder, setCostsOrder] = useState<string[]>(() => loadOrder(defaultCosts, 'costs'));
  const [percentsOrder, setPercentsOrder] = useState<string[]>(() => loadOrder(defaultPercents, 'percents'));
  const [volumesOrder, setVolumesOrder] = useState<string[]>(() => loadOrder(defaultVolumes, 'volumes'));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent, group: 'costs' | 'percents' | 'volumes') => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (group === 'costs') {
      setCostsOrder((prev) => {
        const newOrder = arrayMove(prev, prev.indexOf(active.id as string), prev.indexOf(over.id as string));
        saveOrder('costs', newOrder);
        return newOrder;
      });
    } else if (group === 'percents') {
      setPercentsOrder((prev) => {
        const newOrder = arrayMove(prev, prev.indexOf(active.id as string), prev.indexOf(over.id as string));
        saveOrder('percents', newOrder);
        return newOrder;
      });
    } else {
      setVolumesOrder((prev) => {
        const newOrder = arrayMove(prev, prev.indexOf(active.id as string), prev.indexOf(over.id as string));
        saveOrder('volumes', newOrder);
        return newOrder;
      });
    }
  };

  const getCard = (group: KpiCard[], id: string) => group.find((c) => c.id === id);

  const resetOrder = () => {
    setCostsOrder(defaultCosts);
    setPercentsOrder(defaultPercents);
    setVolumesOrder(defaultVolumes);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${STORAGE_KEY}-costs`);
      localStorage.removeItem(`${STORAGE_KEY}-percents`);
      localStorage.removeItem(`${STORAGE_KEY}-volumes`);
    }
  };

  const Section = ({
    title,
    group,
    order,
    cards: groupCards,
    onDragEnd,
  }: {
    title: string;
    group: 'costs' | 'percents' | 'volumes';
    order: string[];
    cards: KpiCard[];
    onDragEnd: (e: DragEndEvent) => void;
  }) => (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
        {title}
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={horizontalListSortingStrategy}>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${groupCards.length}, minmax(0, 1fr))` }}>
            {order.map((id) => {
              const card = getCard(groupCards, id);
              return card ? <SortableCard key={id} card={card} /> : null;
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>KPIs</h2>
        <button onClick={resetOrder} className="btn text-xs" style={{ padding: '4px 10px' }}>
          ↺ Resetear orden
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <Section title="Costos" group="costs" order={costsOrder} cards={cards.costs} onDragEnd={(e) => handleDragEnd(e, 'costs')} />
        <Section title="Porcentajes" group="percents" order={percentsOrder} cards={cards.percents} onDragEnd={(e) => handleDragEnd(e, 'percents')} />
        <Section title="Volúmenes" group="volumes" order={volumesOrder} cards={cards.volumes} onDragEnd={(e) => handleDragEnd(e, 'volumes')} />
      </div>
    </div>
  );
}
