/**
 * Retorna a data local no formato YYYY-MM-DD (valor de <input type="date">).
 * Evita `toISOString().slice(0, 10)`, que usa UTC e, no fuso de Brasília,
 * antecipa a data para o dia seguinte após as 21h.
 */
export function dataLocalISO(data: Date = new Date()): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}
