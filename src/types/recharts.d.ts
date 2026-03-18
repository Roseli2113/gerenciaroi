import * as React from 'react';

declare module 'recharts' {
  export type LegendProps = {
    payload?: any[];
    verticalAlign?: 'top' | 'middle' | 'bottom';
    [key: string]: any;
  };

  export const ResponsiveContainer: React.ComponentType<any>;
  export const CartesianGrid: React.ComponentType<any>;
  export const Tooltip: React.ComponentType<any>;
  export const XAxis: React.ComponentType<any>;
  export const YAxis: React.ComponentType<any>;
  export const BarChart: React.ComponentType<any>;
  export const ComposedChart: React.ComponentType<any>;
  export const Bar: React.ComponentType<any>;
  export const Line: React.ComponentType<any>;
  export const Area: React.ComponentType<any>;
  export const Cell: React.ComponentType<any>;
  export const Legend: React.ComponentType<any>;
}
