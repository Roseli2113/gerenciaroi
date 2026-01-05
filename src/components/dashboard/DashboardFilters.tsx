import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function DashboardFilters() {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-card border border-border">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <Select defaultValue="today">
          <SelectTrigger className="w-40 border-0 bg-muted/50">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="yesterday">Ontem</SelectItem>
            <SelectItem value="7days">Últimos 7 dias</SelectItem>
            <SelectItem value="30days">Últimos 30 dias</SelectItem>
            <SelectItem value="thisMonth">Este mês</SelectItem>
            <SelectItem value="lastMonth">Mês passado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Select defaultValue="all">
        <SelectTrigger className="w-48 border-0 bg-muted/50">
          <SelectValue placeholder="Conta de Anúncio" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as contas</SelectItem>
          <SelectItem value="account1">Conta Principal</SelectItem>
          <SelectItem value="account2">Conta Secundária</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue="all">
        <SelectTrigger className="w-48 border-0 bg-muted/50">
          <SelectValue placeholder="Campanha" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as campanhas</SelectItem>
          <SelectItem value="campaign1">Conversão - Produto A</SelectItem>
          <SelectItem value="campaign2">Tráfego - Blog</SelectItem>
          <SelectItem value="campaign3">Remarketing</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue="all">
        <SelectTrigger className="w-40 border-0 bg-muted/50">
          <SelectValue placeholder="Produto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="product1">Produto A</SelectItem>
          <SelectItem value="product2">Produto B</SelectItem>
          <SelectItem value="product3">Produto C</SelectItem>
        </SelectContent>
      </Select>

      <Button className="ml-auto gradient-primary text-primary-foreground hover:opacity-90">
        Aplicar Filtros
      </Button>
    </div>
  );
}
