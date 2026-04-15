import type { Expense, MonthlySummary } from '@/types';

const WORK_DAYS_PER_MONTH = 22;

export function calcWorkDaysCost(totalExpenses: number, salary: number): number {
  if (salary <= 0) return WORK_DAYS_PER_MONTH;
  return (totalExpenses / salary) * WORK_DAYS_PER_MONTH;
}

export function calcBalance(totalIncome: number, totalExpenses: number): number {
  return totalIncome - totalExpenses;
}

export function calcExpenseByCategory(expenses: Expense[]): Record<string, number> {
  return expenses.reduce<Record<string, number>>((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});
}

export function calcBiggestCategory(expenses: Expense[]): string {
  const byCategory = calcExpenseByCategory(expenses);
  const entries = Object.entries(byCategory);
  if (entries.length === 0) return 'Nenhuma';
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function generateImpactPhrases(summary: MonthlySummary, salary: number): string[] {
  const phrases: string[] = [];
  const workDays = calcWorkDaysCost(summary.total_expenses, salary);

  phrases.push(`Você trabalha ${workDays.toFixed(1)} dias só pra pagar as contas`);
  phrases.push(`Seu estilo de vida custa ${formatCurrency(summary.total_expenses)}/mês`);

  if (summary.balance >= 0) {
    phrases.push(`Sobram ${formatCurrency(summary.balance)} no final do mês`);
  } else {
    phrases.push(`Você está ${formatCurrency(Math.abs(summary.balance))} no vermelho`);
  }

  if (summary.biggest_category && summary.biggest_category !== 'Nenhuma') {
    phrases.push(`Sua maior despesa é ${summary.biggest_category}`);
  }

  return phrases;
}
