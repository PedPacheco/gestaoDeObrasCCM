import { ButtonForBILink } from "@/components/exports/buttonForBILink";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const categories = [
  {
    title: "Segurança",
    accent: "#3b82f6",
    items: [
      { name: "Blitz de Segurança", path: "https://app.powerbi.com/groups/me/apps/2a7a60bb-a7cd-4376-b59a-662f2e8c478b/reports/853706ab-0389-4dc8-a75b-11ebb358aa03/ReportSectionc68ab510d8e1c026b285?experience=power-bi", visible: true },
      { name: "KPI de Segurança", path: "https://app.powerbi.com/groups/me/apps/2a7a60bb-a7cd-4376-b59a-662f2e8c478b/reports/3a1a7515-a468-43e7-864d-1b0c42f7e818/ReportSection?experience=power-bi", visible: true },
      { name: "Queremos te Ouvir", path: "https://app.powerbi.com/reportEmbed?reportId=8bc04354-c9ce-4190-9359-e89456c3f1eb&autoAuth=true&ctid=bf86fbdb-f8c2-440e-923c-05a60dc2bc9b", visible: true },
      { name: "Cority", path: "https://edp.my.cority.com/#/login", visible: true },
      { name: "Dono de Área", path: "https://app.powerbi.com/groups/me/reports/ecba28d6-7cd7-4e7d-93a3-8fa9e1721a47/ReportSectioncf3acd87e138dbe95798?ctid=bf86fbdb-f8c2-440e-923c-05a60dc2bc9b&experience=power-bi", visible: true },
      { name: "IDSP", path: "https://app.powerbi.com/groups/me/reports/bbf29767-901a-455a-a195-496707fb2b1d/ReportSectione1123600e23295a15c91?ctid=bf86fbdb-f8c2-440e-923c-05a60dc2bc9b&experience=power-bi", visible: true },
      { name: "Relatório GAP ANALYSIS", path: "/relatorios/gap-analysis", visible: true },
    ],
  },
  {
    title: "Pessoas",
    accent: "#10b981",
    items: [
      { name: "EDPON", path: "https://edpon.edp.com/pt-br/login?destination=/pt-br?check_logged_in%3D1", visible: true },
      { name: "Portal de Serviços", path: "https://portaldeservicos.edpbr.com.br/?OriginalURL=/PortalDeServicos/", visible: true },
      { name: "About Me", path: "https://performancemanager5.successfactors.eu/", visible: true },
      { name: "Udemy", path: "https://www.udemy.com/join/passwordless-auth/?next=/course/desenvolvedor-android-iniciante/learn/lecture/14615270", visible: true },
    ],
  },
  {
    title: "Cliente",
    accent: "#f59e0b",
    items: [
      { name: "COI – DEC Programado", path: "https://app.powerbi.com/groups/me/apps/dbbb2da8-9f21-40d2-a67c-2581d3eb9763/reports/1da4d483-62d4-43fb-aded-8b8afee9c09f/ReportSectiona1a0d37cb4b057d6535c?experience=power-bi", visible: true },
    ],
  },
  {
    title: "Eficiência",
    accent: "#8b5cf6",
    items: [
      { name: "Capex DSPT", path: "https://app.powerbi.com/groups/me/apps/2a7a60bb-a7cd-4376-b59a-662f2e8c478b/reports/05471fc0-7c31-43e1-9afe-2562ee498d81/ReportSection7623530240a29221ca51?experience=power-bi", visible: true },
      { name: "Controle SMC", path: "https://app.powerbi.com/groups/me/apps/cf6dceda-2355-4078-9a15-d1fd15fc4688/reports/decbfee6-e20b-4fca-bc6d-a0585270e1cb/ReportSection?ctid=bf86fbdb-f8c2-440e-923c-05a60dc2bc9b&experience=power-bi", visible: true },
      { name: "Árteri", path: "https://smc.arteri.com.br/login", visible: true },
      { name: "Equipes para Contingência", path: "https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=lc5ZCKhzwj9hYfcfnalSog6wSPsJntfG&&id=2_uGv8L4DkSSPAWmDcK8m7yDM7CWJflBu3ULJobsEoBUOVJBNDAwVVI2Mzk4Tkg4TUw4V0FRV0k5Uy4u", visible: true },
      { name: "EFEN's / TA's", path: "https://apps.powerapps.com/play/e/default-bf86fbdb-f8c2-440e-923c-05a60dc2bc9b/a/7767095b-9129-4a8c-aeff-c595a862ed6d?tenantId=bf86fbdb-f8c2-440e-923c-05a60dc2bc9b&&sourcetime=1747049457490", visible: true },
    ],
  },
];

export default async function BiReports() {
  return (
    <div className="w-full p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {categories.map((category) => (
          <div key={category.title} className="flex flex-col gap-2">
            <span className="text-[20px] font-black uppercase tracking-[0.2em] text-zinc-700 text-center w-full block">
              {category.title}
            </span>

            <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl overflow-hidden border border-white/5 shadow-xl">
              <div className="px-5 py-2 flex flex-col">
                {category.items.map((item, index) => (
                  <div key={item.name}>
                    {index > 0 && <div style={{ height: 1, background: "rgba(255,255,255,0.15)" }} />}
                    <div className="flex items-center justify-between gap-3 py-3">
                      <span className="text-sm font-semibold text-zinc-200 leading-tight flex-1">
                        {item.name}
                      </span>
                      <ButtonForBILink
                        text=""
                        path={item.path}
                        visible={item.visible}
                        compact
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}