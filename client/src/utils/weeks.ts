export const WEEKS: {
  num: number;
  inicio: string;
  fim: string;
  mes: string;
}[] = [
  { num: 1, inicio: "28/12/2025", fim: "03/01/2026", mes: "Dezembro" },
  { num: 2, inicio: "04/01/2026", fim: "10/01/2026", mes: "Janeiro" },
  { num: 3, inicio: "11/01/2026", fim: "17/01/2026", mes: "Janeiro" },
  { num: 4, inicio: "18/01/2026", fim: "24/01/2026", mes: "Janeiro" },
  { num: 5, inicio: "25/01/2026", fim: "31/01/2026", mes: "Janeiro" },
  { num: 6, inicio: "01/02/2026", fim: "07/02/2026", mes: "Fevereiro" },
  { num: 7, inicio: "08/02/2026", fim: "14/02/2026", mes: "Fevereiro" },
  { num: 8, inicio: "15/02/2026", fim: "21/02/2026", mes: "Fevereiro" },
  { num: 9, inicio: "22/02/2026", fim: "28/02/2026", mes: "Fevereiro" },
  { num: 10, inicio: "01/03/2026", fim: "07/03/2026", mes: "Março" },
  { num: 11, inicio: "08/03/2026", fim: "14/03/2026", mes: "Março" },
  { num: 12, inicio: "15/03/2026", fim: "21/03/2026", mes: "Março" },
  { num: 13, inicio: "22/03/2026", fim: "28/03/2026", mes: "Março" },
  { num: 14, inicio: "29/03/2026", fim: "04/04/2026", mes: "Abril" },
  { num: 15, inicio: "05/04/2026", fim: "11/04/2026", mes: "Abril" },
  { num: 16, inicio: "12/04/2026", fim: "18/04/2026", mes: "Abril" },
  { num: 17, inicio: "19/04/2026", fim: "25/04/2026", mes: "Abril" },
  { num: 18, inicio: "26/04/2026", fim: "02/05/2026", mes: "Abril" },
  { num: 19, inicio: "03/05/2026", fim: "09/05/2026", mes: "Maio" },
  { num: 20, inicio: "10/05/2026", fim: "16/05/2026", mes: "Maio" },
  { num: 21, inicio: "17/05/2026", fim: "23/05/2026", mes: "Maio" },
  { num: 22, inicio: "24/05/2026", fim: "30/05/2026", mes: "Maio" },
  { num: 23, inicio: "31/05/2026", fim: "06/06/2026", mes: "Junho" },
  { num: 24, inicio: "07/06/2026", fim: "13/06/2026", mes: "Junho" },
  { num: 25, inicio: "14/06/2026", fim: "20/06/2026", mes: "Junho" },
  { num: 26, inicio: "21/06/2026", fim: "27/06/2026", mes: "Junho" },
  { num: 27, inicio: "28/06/2026", fim: "04/07/2026", mes: "Julho" },
  { num: 28, inicio: "05/07/2026", fim: "11/07/2026", mes: "Julho" },
  { num: 29, inicio: "12/07/2026", fim: "18/07/2026", mes: "Julho" },
  { num: 30, inicio: "19/07/2026", fim: "25/07/2026", mes: "Julho" },
  { num: 31, inicio: "26/07/2026", fim: "01/08/2026", mes: "Julho" },
  { num: 32, inicio: "02/08/2026", fim: "08/08/2026", mes: "Agosto" },
  { num: 33, inicio: "09/08/2026", fim: "15/08/2026", mes: "Agosto" },
  { num: 34, inicio: "16/08/2026", fim: "22/08/2026", mes: "Agosto" },
  { num: 35, inicio: "23/08/2026", fim: "29/08/2026", mes: "Agosto" },
  { num: 36, inicio: "30/08/2026", fim: "05/09/2026", mes: "Setembro" },
  { num: 37, inicio: "06/09/2026", fim: "12/09/2026", mes: "Setembro" },
  { num: 38, inicio: "13/09/2026", fim: "19/09/2026", mes: "Setembro" },
  { num: 39, inicio: "20/09/2026", fim: "26/09/2026", mes: "Setembro" },
  { num: 40, inicio: "27/09/2026", fim: "03/10/2026", mes: "Setembro" },
  { num: 41, inicio: "04/10/2026", fim: "10/10/2026", mes: "Outubro" },
  { num: 42, inicio: "11/10/2026", fim: "17/10/2026", mes: "Outubro" },
  { num: 43, inicio: "18/10/2026", fim: "24/10/2026", mes: "Outubro" },
  { num: 44, inicio: "25/10/2026", fim: "31/10/2026", mes: "Outubro" },
  { num: 45, inicio: "01/11/2026", fim: "07/11/2026", mes: "Novembro" },
  { num: 46, inicio: "08/11/2026", fim: "14/11/2026", mes: "Novembro" },
  { num: 47, inicio: "15/11/2026", fim: "21/11/2026", mes: "Novembro" },
  { num: 48, inicio: "22/11/2026", fim: "28/11/2026", mes: "Novembro" },
  { num: 49, inicio: "29/11/2026", fim: "05/12/2026", mes: "Dezembro" },
  { num: 50, inicio: "06/12/2026", fim: "12/12/2026", mes: "Dezembro" },
  { num: 51, inicio: "13/12/2026", fim: "19/12/2026", mes: "Dezembro" },
  { num: 52, inicio: "20/12/2026", fim: "26/12/2026", mes: "Dezembro" },
  { num: 53, inicio: "27/12/2026", fim: "02/01/2027", mes: "Dezembro" },
];

export function findCurrentWeek(): number {
  const today = new Date();

  function parseW(ddmmyyyy: string) {
    const [d, m, y] = ddmmyyyy.split("/").map(Number);
    return new Date(y, m - 1, d);
  }

  for (const w of WEEKS) {
    if (today >= parseW(w.inicio) && today <= parseW(w.fim)) return w.num;
  }

  return 1;
}

export function getCurrentWeekData() {
  const currentWeek = findCurrentWeek();
  return WEEKS.find((w) => w.num === currentWeek) ?? WEEKS[0];
}

export function getCurrentMonthRange() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const mm = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  return {
    dataInicial: `01/${mm}/${year}`,
    dataFinal: `${lastDay}/${mm}/${year}`,
  };
}
