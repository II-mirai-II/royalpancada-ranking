const CATEGORIES = {
  war: "Guerra de Clãs",
  cwl: "CWL",
  games: "Jogos do Clã",
  raids: "Raides",
  donations: "Doações",
};

const $ = (id) => document.getElementById(id);
const fmt = (value) => Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
const medal = (position) => ({ 1: "🥇 1", 2: "🥈 2", 3: "🥉 3" }[position] || position);
let data = null;

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rankAttrs = (position) => position <= 3 ? ` data-rank="${position}"` : "";
const statusBadge = (r) => `<span class="badge ${r.active && !r.deleted ? "" : "off"}">${r.deleted ? "Excluído" : (r.active ? "Ativo" : "Inativo")}</span>`;

function renderRanking(view) {
  const month = $("monthSelect").value || data.current_month;
  const rows = data.rankings?.[month]?.[view] || [];
  $("title").textContent = view === "general" ? "Ranking Geral" : CATEGORIES[view];
  $("subtitle").textContent = `Ranking mensal • ${month}`;
  if (view === "general") {
    $("content").innerHTML = `<table><thead><tr>
      <th>Pos.</th><th>Jogador</th><th>Status</th><th class="num">Nota geral</th><th class="num">Bruto total</th>
      <th class="num">Guerra</th><th class="num">CWL</th><th class="num">Jogos</th><th class="num">Raides</th><th class="num">Doações</th>
    </tr></thead><tbody>${rows.map((r) => `<tr${rankAttrs(r.position)}>
      <td><strong class="rank-pos">${medal(r.position)}</strong></td>
      <td>${esc(r.name)}${r.tag ? `<br><small>${esc(r.tag)}</small>` : ""}</td>
      <td>${statusBadge(r)}</td>
      <td class="num"><strong>${fmt(r.score)}</strong></td><td class="num">${fmt(r.raw_score)}</td>
      <td class="num">${fmt(r.notes_by_category.war)}</td><td class="num">${fmt(r.notes_by_category.cwl)}</td>
      <td class="num">${fmt(r.notes_by_category.games)}</td><td class="num">${fmt(r.notes_by_category.raids)}</td>
      <td class="num">${fmt(r.notes_by_category.donations)}</td>
    </tr>`).join("") || `<tr><td colspan="10" class="empty">Sem pontuação neste mês.</td></tr>`}</tbody></table>`;
    return;
  }
  $("content").innerHTML = `<table><thead><tr>
    <th>Pos.</th><th>Jogador</th><th>Status</th><th class="num">Pontos brutos</th><th class="num">Nota</th><th class="num">Lançamentos</th>
  </tr></thead><tbody>${rows.map((r) => `<tr${rankAttrs(r.position)}>
    <td><strong class="rank-pos">${medal(r.position)}</strong></td>
    <td>${esc(r.name)}${r.tag ? `<br><small>${esc(r.tag)}</small>` : ""}</td>
    <td>${statusBadge(r)}</td><td class="num"><strong>${fmt(r.raw_score)}</strong></td>
    <td class="num">${fmt(r.score)}</td><td class="num">${fmt(r.counts?.[view] || 0)}</td>
  </tr>`).join("") || `<tr><td colspan="6" class="empty">Sem pontuação nesta categoria.</td></tr>`}</tbody></table>`;
}

function renderLaunches() {
  const category = $("categoryFilter").value;
  const member = $("memberFilter").value;
  const month = $("monthSelect").value;
  const rows = data.launches.filter((l) => (!month || l.month_ref === month) && (category === "all" || l.category === category) && (member === "all" || String(l.member_id) === member));
  $("title").textContent = "Lançamentos";
  $("subtitle").textContent = `Histórico publicado • ${month || "todos os meses"}`;
  $("content").innerHTML = `<table><thead><tr>
    <th>Data</th><th>Jogador</th><th>Categoria</th><th>Descrição</th><th>Observação</th><th class="num">Pontos</th>
  </tr></thead><tbody>${rows.map((l) => `<tr>
    <td>${esc(l.event_date)}</td><td>${esc(l.member_name)}</td><td>${esc(CATEGORIES[l.category] || l.category)}</td>
    <td>${esc(l.description)}</td><td>${esc(l.notes || "")}</td><td class="num"><strong>${fmt(l.points)}</strong></td>
  </tr>`).join("") || `<tr><td colspan="6" class="empty">Nenhum lançamento encontrado.</td></tr>`}</tbody></table>`;
}

function renderRules() {
  $("title").textContent = "Regulamento";
  $("subtitle").textContent = "Regras oficiais do clã";
  $("content").innerHTML = `<article class="rules">${esc(data.regulation_md || "Regulamento não publicado.")}</article>`;
}

function render() {
  const view = $("viewSelect").value;
  $("monthWrap").style.display = view === "rules" ? "none" : "grid";
  $("categoryWrap").style.display = view === "launches" ? "grid" : "none";
  $("memberWrap").style.display = view === "launches" ? "grid" : "none";
  if (view === "launches") renderLaunches();
  else if (view === "rules") renderRules();
  else renderRanking(view);
}

async function init() {
  data = await fetch("./data.json", { cache: "no-store" }).then((r) => r.json());
  $("publishedAt").textContent = `Última atualização: ${new Date(data.published_at).toLocaleString("pt-BR")}`;
  $("monthSelect").innerHTML = data.months.map((m) => `<option value="${esc(m)}">${esc(m)}</option>`).join("");
  $("monthSelect").value = data.current_month;
  $("memberFilter").innerHTML = `<option value="all">Todos</option>` + data.members.filter((m) => !m.deleted).map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join("");
  ["viewSelect", "monthSelect", "categoryFilter", "memberFilter"].forEach((id) => $(id).addEventListener("change", render));
  render();
}

init().catch((error) => {
  $("content").innerHTML = `<p class="empty">${esc(error.message)}</p>`;
});
