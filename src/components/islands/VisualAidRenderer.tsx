/**
 * VisualAidRenderer Component
 *
 * SolidJS component for rendering various types of visual aids including
 * number lines, diagrams, charts, and images.
 *
 * Requirements:
 * - 4.3: Add visual aids for geometric and visual problems
 * - 8.5: Include visual aids in feedback when relevant
 */

import { Match, Switch, Show, For, createMemo } from 'solid-js';
import type { VisualAid } from '@/lib/exercises/types';
import { useStore } from '@nanostores/solid';
import { $t } from '@/lib/i18n';
import { generateVisualAidDescription, generateLongDescription } from '@/lib/accessibility/visual-aid-descriptions';

export interface VisualAidRendererProps {
  /** The visual aid to render */
  visualAid: VisualAid;
  /** Optional CSS class for styling */
  class?: string;
}

/**
 * VisualAidRenderer - Renders different types of visual aids
 *
 * Supports rendering of:
 * - Number lines (for addition/subtraction)
 * - Place value diagrams
 * - Fraction diagrams
 * - Charts and graphs
 * - Images
 *
 * @example
 * ```tsx
 * <VisualAidRenderer
 *   visualAid={{
 *     type: 'number-line',
 *     data: { start: 5, end: 10, hops: [3, 2] }
 *   }}
 * />
 * ```
 */
export default function VisualAidRenderer(props: VisualAidRendererProps) {
  const t = useStore($t);

  // Generate descriptive aria-label based on visual aid type and data
  const description = createMemo(() => {
    return generateVisualAidDescription(props.visualAid, t());
  });

  // Generate long description for complex diagrams (if applicable)
  const longDescription = createMemo(() => {
    return generateLongDescription(props.visualAid, t());
  });

  // Generate unique ID for long description
  const descriptionId = `visual-aid-desc-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div class={`visual-aid ${props.class || ''}`}>
      {/* Main visual aid with aria-label and optional aria-describedby */}
      <div
        role="img"
        aria-label={description()}
        aria-describedby={longDescription() ? descriptionId : undefined}
      >
        <Switch>
          <Match when={props.visualAid.type === 'number-line'}>
            <NumberLineRenderer data={props.visualAid.data as NumberLineData} />
          </Match>
          <Match when={props.visualAid.type === 'diagram'}>
            <DiagramRenderer data={props.visualAid.data as DiagramData} />
          </Match>
          <Match when={props.visualAid.type === 'chart'}>
            <ChartRenderer data={props.visualAid.data as ChartData} />
          </Match>
          <Match when={props.visualAid.type === 'image'}>
            <ImageRenderer data={props.visualAid.data as ImageData} />
          </Match>
        </Switch>
      </div>

      {/* Long description for screen readers (visually hidden) */}
      <Show when={longDescription()}>
        <div id={descriptionId} class="sr-only">
          {longDescription()}
        </div>
      </Show>
    </div>
  );
}

// Type definitions for visual aid data
interface NumberLineData {
  start: number;
  end: number;
  hops: number[];
  range: [number, number];
}

interface DiagramData {
  diagramType: 'place-value' | 'fraction' | 'generic';
  [key: string]: unknown;
}

interface ChartData {
  chartType: 'bar' | 'line' | 'pie';
  [key: string]: unknown;
}

interface ImageData {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

/**
 * NumberLineRenderer - Renders an interactive number line
 */
function NumberLineRenderer(props: { data: NumberLineData }) {
  const t = useStore($t);
  const [rangeStart, rangeEnd] = props.data.range;
  const points = rangeEnd - rangeStart + 1;
  const lineWidth = 500;
  const pointSpacing = lineWidth / (points - 1);

  // Calculate positions
  const getXPosition = (value: number) => {
    return ((value - rangeStart) / (rangeEnd - rangeStart)) * lineWidth;
  };

  // Generate tick marks
  const ticks = Array.from({ length: points }, (_, i) => rangeStart + i);

  // Calculate hop paths
  let currentPos = props.data.start;
  const hopPaths = props.data.hops.map((hop) => {
    const startPos = currentPos;
    currentPos += hop;
    return { start: startPos, end: currentPos, value: hop };
  });

  return (
    <div class="number-line-container p-4">
      <svg
        viewBox={`0 0 ${lineWidth + 40} 120`}
        class="w-full h-auto"
        role="img"
        aria-label={t()('solutions.numberLine')}
      >
        {/* Main horizontal line */}
        <line
          x1="20"
          y1="60"
          x2={lineWidth + 20}
          y2="60"
          stroke="currentColor"
          stroke-width="2"
          class="text-gray-700"
        />

        {/* Tick marks and labels */}
        <For each={ticks}>
          {(tick) => {
            const x = getXPosition(tick) + 20;
            return (
              <>
                <line
                  x1={x}
                  y1="55"
                  x2={x}
                  y2="65"
                  stroke="currentColor"
                  stroke-width="2"
                  class="text-gray-700"
                />
                <text
                  x={x}
                  y="85"
                  text-anchor="middle"
                  class="text-sm font-medium fill-gray-700"
                >
                  {tick}
                </text>
              </>
            );
          }}
        </For>

        {/* Hop arrows */}
        <For each={hopPaths}>
          {(hop, index) => {
            const startX = getXPosition(hop.start) + 20;
            const endX = getXPosition(hop.end) + 20;
            const y = 35 - (index() * 10);
            const isPositive = hop.value > 0;

            return (
              <>
                {/* Curved arrow path */}
                <path
                  d={`M ${startX} ${y} Q ${(startX + endX) / 2} ${y - 15} ${endX} ${y}`}
                  fill="none"
                  stroke={isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
                  stroke-width="2"
                  marker-end="url(#arrowhead)"
                />
                {/* Arrow label */}
                <text
                  x={(startX + endX) / 2}
                  y={y - 20}
                  text-anchor="middle"
                  class="text-sm font-bold"
                  fill={isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
                >
                  {isPositive ? '+' : ''}{hop.value}
                </text>
              </>
            );
          }}
        </For>

        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

/**
 * DiagramRenderer - Renders different types of diagrams
 */
function DiagramRenderer(props: { data: DiagramData }) {
  return (
    <div class="diagram-container p-4">
      <Switch>
        <Match when={props.data.diagramType === 'place-value'}>
          <PlaceValueDiagram data={props.data} />
        </Match>
        <Match when={props.data.diagramType === 'fraction'}>
          <FractionDiagram data={props.data} />
        </Match>
        <Match when={true}>
          <div class="p-4 bg-gray-100 rounded text-center text-gray-600">
            <p>Diagram type: {props.data.diagramType}</p>
            <p class="text-sm">(Visualization coming soon)</p>
          </div>
        </Match>
      </Switch>
    </div>
  );
}

/**
 * PlaceValueDiagram - Shows place value breakdown
 */
function PlaceValueDiagram(props: { data: DiagramData }) {
  const breakdown = props.data.breakdown as Record<string, number>;
  const placeValues = Object.entries(breakdown).reverse(); // Highest place value first

  return (
    <div class="place-value-diagram flex gap-4 justify-center items-end p-4">
      <For each={placeValues}>
        {([place, count]) => (
          <div class="place-column flex flex-col items-center gap-2">
            <div class="text-sm font-bold text-gray-700 capitalize">{place}</div>
            <div class="blocks flex flex-col-reverse gap-1">
              <For each={Array(count)}>
                {() => (
                  <div
                    class="block w-16 h-16 rounded border-2 flex items-center justify-center font-bold text-lg"
                    classList={{
                      'bg-blue-200 border-blue-500 text-blue-900': place === 'hundreds',
                      'bg-green-200 border-green-500 text-green-900': place === 'tens',
                      'bg-yellow-200 border-yellow-500 text-yellow-900': place === 'ones',
                    }}
                  >
                    {place === 'hundreds' ? '100' : place === 'tens' ? '10' : '1'}
                  </div>
                )}
              </For>
            </div>
            <div class="text-lg font-bold text-gray-800">
              {count}
            </div>
          </div>
        )}
      </For>
    </div>
  );
}

/**
 * FractionDiagram - Shows fraction visualization
 */
function FractionDiagram(props: { data: DiagramData }) {
  const numerator = props.data.numerator as number;
  const denominator = props.data.denominator as number;
  const shapeType = props.data.shapeType as 'circle' | 'rectangle';

  if (shapeType === 'circle') {
    return <FractionCircle numerator={numerator} denominator={denominator} />;
  }

  return <FractionRectangle numerator={numerator} denominator={denominator} />;
}

/**
 * FractionCircle - Circular fraction visualization
 */
function FractionCircle(props: { numerator: number; denominator: number }) {
  const anglePerSection = 360 / props.denominator;
  const sections = Array.from({ length: props.denominator }, (_, i) => i);

  return (
    <svg viewBox="0 0 200 200" class="w-48 h-48 mx-auto">
      <circle cx="100" cy="100" r="90" fill="white" stroke="currentColor" stroke-width="2" class="text-gray-700" />
      <For each={sections}>
        {(i) => {
          const startAngle = i * anglePerSection - 90;
          const endAngle = (i + 1) * anglePerSection - 90;
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          const x1 = 100 + 90 * Math.cos(startRad);
          const y1 = 100 + 90 * Math.sin(startRad);
          const x2 = 100 + 90 * Math.cos(endRad);
          const y2 = 100 + 90 * Math.sin(endRad);

          return (
            <>
              <line x1="100" y1="100" x2={x1} y2={y1} stroke="currentColor" stroke-width="1" class="text-gray-700" />
              <Show when={i < props.numerator}>
                <path
                  d={`M 100 100 L ${x1} ${y1} A 90 90 0 0 1 ${x2} ${y2} Z`}
                  fill="rgb(147, 51, 234)"
                  opacity="0.7"
                />
              </Show>
            </>
          );
        }}
      </For>
    </svg>
  );
}

/**
 * FractionRectangle - Rectangular fraction visualization
 */
function FractionRectangle(props: { numerator: number; denominator: number }) {
  const sections = Array.from({ length: props.denominator }, (_, i) => i);
  const sectionWidth = 100 / props.denominator;

  return (
    <svg viewBox="0 0 200 80" class="w-full h-24 mx-auto">
      <rect x="0" y="10" width="200" height="60" fill="white" stroke="currentColor" stroke-width="2" class="text-gray-700" />
      <For each={sections}>
        {(i) => {
          const x = (i * 200) / props.denominator;
          const width = 200 / props.denominator;

          return (
            <>
              <Show when={i > 0}>
                <line x1={x} y1="10" x2={x} y2="70" stroke="currentColor" stroke-width="1" class="text-gray-700" />
              </Show>
              <Show when={i < props.numerator}>
                <rect x={x + 1} y="11" width={width - 2} height="58" fill="rgb(147, 51, 234)" opacity="0.7" />
              </Show>
            </>
          );
        }}
      </For>
    </svg>
  );
}

/**
 * ChartRenderer - Renders charts (placeholder for now)
 */
function ChartRenderer(props: { data: ChartData }) {
  const t = useStore($t);
  return (
    <div class="chart-container p-4 bg-gray-100 rounded text-center">
      <p class="text-gray-600">{t()('solutions.chartType')}: {props.data.chartType}</p>
      <p class="text-sm text-gray-500">(Chart visualization coming soon)</p>
    </div>
  );
}

/**
 * ImageRenderer - Renders images
 */
function ImageRenderer(props: { data: ImageData }) {
  return (
    <div class="image-container p-4">
      <img
        src={props.data.src}
        alt={props.data.alt}
        width={props.data.width}
        height={props.data.height}
        class="max-w-full h-auto rounded shadow-md"
        loading="lazy"
      />
    </div>
  );
}
