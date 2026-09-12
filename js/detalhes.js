const parametros = new URLSearchParams(window.location.search);
const tipo = parametros.get("tipo");
const itemId = parametros.get("id");

const configuracoes = {
  projetos: { fonte: "dados/projetos.json", chaveLocal: "org-projetos", rotulo: "Projeto", plural: "Projetos", voltar: "projetos/" },
  jogos: { fonte: "dados/jogos.json", chaveLocal: "org-jogos", rotulo: "Jogo", plural: "Jogos", voltar: "jogos/" },
  historias: { fonte: "dados/historias.json", chaveLocal: "org-historias", rotulo: "História", plural: "Histórias", voltar: "historias/" },
  jornal: { fonte: "dados/jornal.json", chaveLocal: "org-jornal", rotulo: "Matéria", plural: "Matérias", voltar: "jornais/" }
};

const configuracao = configuracoes[tipo];
const carregando = document.querySelector("#detalhes-carregando");
const erro = document.querySelector("#detalhes-erro");
const conteudo = document.querySelector("#detalhes-item");

function escapar(valor = "") { return String(valor).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function tituloChave(chave) {
  const especiais = { id:"Identificador", criadoEm:"Criado em", dataCriacao:"Data de criação", etapas_do_projeto:"Etapas", componentes_planejados:"Componentes planejados", materiais_esteticos:"Materiais estéticos", imagens_e_rascunhos:"Imagens e rascunhos", componentes_pesquisados_e_decisoes:"Componentes pesquisados e decisões", criterios_de_sucesso:"Critérios de sucesso", ideias_futuras:"Ideias futuras", forcas_e_mecanica:"Forças e mecânica", visao_do_mundo:"Visão do mundo", regras_gnomidias:"Regras gnomídias", familia_de_tom:"Família de Tom", organizacao_antagonista:"Organização antagonista", magia_e_ocultismo:"Magia e ocultismo", historia_escolar_e_romance:"História escolar e romance", capitulos_ate_agora:"Capítulos até agora" };
  return especiais[chave] || chave.replaceAll("_", " ").replace(/\b\w/g, letra => letra.toUpperCase());
}
function valorVazio(valor) { if (valor === null || valor === undefined || valor === "") return true; if (Array.isArray(valor)) return valor.length === 0; if (typeof valor === "object") return Object.keys(valor).length === 0; return false; }
function renderizarValor(valor) {
  if (valorVazio(valor)) return '<p class="sem-registro">Sem registro.</p>';
  if (Array.isArray(valor)) return "<ul>" + valor.map(item => "<li>" + renderizarValor(item) + "</li>").join("") + "</ul>";
  if (typeof valor === "object") return '<div class="detalhes-aninhados">' + Object.entries(valor).filter(([, conteudo]) => !valorVazio(conteudo)).map(([chave, conteudo]) => '<section class="bloco-detalhe"><h4>' + escapar(tituloChave(chave)) + "</h4>" + renderizarValor(conteudo) + "</section>").join("") + "</div>";
  if (typeof valor === "boolean") return "<p>" + (valor ? "Sim" : "Não") + "</p>";
  return "<p>" + escapar(valor) + "</p>";
}
function bloco(titulo, valor) { if (valorVazio(valor)) return ""; return '<section class="bloco-detalhe"><h3>' + escapar(titulo) + "</h3>" + renderizarValor(valor) + "</section>"; }
function normalizarDados(dados) { if (Array.isArray(dados)) return dados; if (!dados || typeof dados !== "object") return []; if (Array.isArray(dados[tipo])) return dados[tipo]; if (tipo === "jornal" && Array.isArray(dados.materias)) return dados.materias; if (tipo === "jornal" && Array.isArray(dados.edicoes)) return dados.edicoes; return []; }
function lerLocais() { try { return JSON.parse(localStorage.getItem(configuracao.chaveLocal) || "[]"); } catch { return []; } }
function resumoDoItem(item) { return item.objetivo || item.descricao || item.resumo || item.funcionamento?.resumo || "Sem resumo registrado."; }
function montarVisaoGeral(item) {
  const campos = [["Resumo", resumoDoItem(item)], ["Inspiração", item.inspiracao], ["Funcionamento", item.funcionamento], ["Visão do mundo", item.visao_do_mundo], ["Critérios de sucesso", item.criterios_de_sucesso]];
  document.querySelector("#visao-geral").innerHTML = '<div class="grade-detalhes">' + campos.map(([titulo, valor]) => bloco(titulo, valor)).join("") + "</div>";
}
function montarEtapas(item) { const etapas = item.etapas_do_projeto || item.etapas || []; document.querySelector("#etapas").innerHTML = etapas.length ? '<div class="grade-detalhes">' + bloco("Etapas", etapas) + "</div>" : '<p class="sem-registro">Nenhuma etapa registrada.</p>'; }
function montarMateriais(item) { const materiais = { componentes_planejados:item.componentes_planejados, materiais_esteticos:item.materiais_esteticos, componentes_pesquisados_e_decisoes:item.componentes_pesquisados_e_decisoes, materiais:item.materiais }; document.querySelector("#materiais").innerHTML = '<div class="grade-detalhes">' + Object.entries(materiais).filter(([, valor]) => !valorVazio(valor)).map(([chave, valor]) => bloco(tituloChave(chave), valor)).join("") + "</div>"; }
function montarImagens(item) { const imagens = item.imagens_e_rascunhos || item.imagens || []; document.querySelector("#imagens").innerHTML = valorVazio(imagens) ? '<p class="sem-registro">Nenhuma imagem registrada.</p>' : '<div class="grade-detalhes">' + bloco("Imagens e rascunhos", imagens) + "</div>"; }
function montarAnotacoes(item) { const anotacoes = { decisoes:item.decisoes, pendencias:item.pendencias, ideias_futuras:item.ideias_futuras, forcas_e_mecanica:item.forcas_e_mecanica, anotacoes:item.anotacoes }; document.querySelector("#anotacoes").innerHTML = '<div class="grade-detalhes">' + Object.entries(anotacoes).filter(([, valor]) => !valorVazio(valor)).map(([chave, valor]) => bloco(tituloChave(chave), valor)).join("") + "</div>"; }
function montarConteudoCompleto(item) {
  const ignorar = new Set(["id","nome","titulo","status","categoria","origem","descricao","objetivo","resumo","inspiracao","funcionamento","visao_do_mundo","criterios_de_sucesso","etapas_do_projeto","etapas","componentes_planejados","materiais_esteticos","componentes_pesquisados_e_decisoes","materiais","imagens_e_rascunhos","imagens","decisoes","pendencias","ideias_futuras","forcas_e_mecanica","anotacoes"]);
  const extras = Object.entries(item).filter(([chave, valor]) => !ignorar.has(chave) && !valorVazio(valor));
  document.querySelector("#conteudo-completo").innerHTML = extras.length ? '<div class="grade-detalhes">' + extras.map(([chave, valor]) => bloco(tituloChave(chave), valor)).join("") + "</div>" : '<p class="sem-registro">Todas as informações deste item já estão organizadas nas outras seções.</p>';
}
function ativarAbas() { document.querySelectorAll(".aba-detalhe").forEach(botao => { botao.addEventListener("click", () => { document.querySelectorAll(".aba-detalhe").forEach(item => item.classList.remove("ativa")); document.querySelectorAll(".painel-detalhe").forEach(item => item.classList.remove("ativo")); botao.classList.add("ativa"); document.querySelector("#" + botao.dataset.painel).classList.add("ativo"); }); }); }
async function carregarItem() {
  if (!configuracao || !itemId) { carregando.hidden = true; erro.hidden = false; return; }
  try {
    const resposta = await fetch(configuracao.fonte + "?v=" + Date.now(), { cache:"no-store" });
    if (!resposta.ok) throw new Error("Falha ao carregar o arquivo de dados.");
    const texto = await resposta.text(); const dados = texto.trim() ? JSON.parse(texto) : []; const remotos = normalizarDados(dados); const locais = lerLocais(); const item = [...locais, ...remotos].find(registro => String(registro.id) === String(itemId));
    carregando.hidden = true; if (!item) { erro.hidden = false; return; }
    const titulo = item.nome || item.titulo || "Sem título"; document.title = titulo + " | Minha Oficina"; document.querySelector("#voltar-lista").href = configuracao.voltar; document.querySelector("#voltar-lista").textContent = "← Voltar para " + configuracao.plural.toLowerCase(); document.querySelector("#titulo-item").textContent = titulo; document.querySelector("#status-item-detalhe").textContent = item.status || "Registrado"; document.querySelector("#categoria-item").textContent = item.categoria || configuracao.rotulo; document.querySelector("#objetivo-item").textContent = resumoDoItem(item);
    montarVisaoGeral(item); montarConteudoCompleto(item); montarEtapas(item); montarMateriais(item); montarImagens(item); montarAnotacoes(item); ativarAbas(); instalarEditor(item); conteudo.hidden = false;
  } catch (falha) { console.error(falha); carregando.hidden = true; erro.hidden = false; }
}


// Editor compartilhado por todas as divisões.
let registroEmEdicao;
function instalarEditor(item) {
  registroEmEdicao = item;
  const barra = document.createElement("div");
  barra.style.cssText = "display:flex;gap:12px;flex-wrap:wrap;margin:20px 0";
  const editar = document.createElement("button");
  editar.className = "botao-novo";
  editar.textContent = "Editar e escrever";
  editar.onclick = abrirEditor;
  const exportar = document.createElement("button");
  exportar.className = "botao-novo";
  exportar.textContent = "Baixar cópia do registro";
  exportar.onclick = () => {
    const blob = new Blob([JSON.stringify(registroEmEdicao, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = tipo + "-" + String(itemId).replace(/[^a-z0-9_-]/gi,"_") + ".json";
    a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const aviso = document.createElement("p");
  aviso.textContent = "Suas edições ficam neste navegador. Baixe uma cópia para guardar ou enviar ao chat; elas não atualizam o GitHub automaticamente.";
  barra.append(editar, exportar);
  conteudo.prepend(barra, aviso);
}
function abrirEditor() {
  const copia = JSON.parse(JSON.stringify(registroEmEdicao));
  const janela = document.createElement("dialog");
  janela.style.width = "min(900px, 95vw)";
  const form = document.createElement("form");
  const titulo = document.createElement("h2"); titulo.textContent = "Editar e escrever";
  const campos = document.createElement("div");
  const mensagem = document.createElement("p"); mensagem.setAttribute("role","alert");
  let numeroCampo = 0;
  function desenhar(valor, definir, nome) {
    const grupo = document.createElement("fieldset");
    grupo.style.cssText = "min-width:0;margin:12px 0;padding:14px;border:1px solid #decba5";
    if (Array.isArray(valor)) {
      const legenda = document.createElement("legend"); legenda.textContent = nome; grupo.append(legenda);
      function atualizar() {
        grupo.replaceChildren(legenda);
        valor.forEach((entrada, i) => {
          const linha = desenhar(entrada, novo => { valor[i] = novo; }, "Item " + (i+1));
          const remover = document.createElement("button"); remover.type = "button"; remover.textContent = "Remover item";
          remover.onclick = () => { valor.splice(i,1); atualizar(); };
          linha.append(remover); grupo.append(linha);
        });
        const adicionar = document.createElement("button"); adicionar.type = "button"; adicionar.textContent = "Adicionar item";
        adicionar.onclick = () => {
          function vazio(v) { if (Array.isArray(v)) return []; if(v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k,x]) => [k,vazio(x)])); return typeof v === "boolean" ? false : typeof v === "number" ? 0 : ""; }
          valor.push(valor.length ? vazio(valor[0]) : ""); atualizar();
        };
        grupo.append(adicionar);
      }
      atualizar(); return grupo;
    }
    if (valor && typeof valor === "object") {
      const legenda = document.createElement("legend"); legenda.textContent = nome; grupo.append(legenda);
      Object.entries(valor).forEach(([k,v]) => {
        if (["id","origem","criadoEm","dataCriacao","atualizadoEm"].includes(k)) return;
        grupo.append(desenhar(v, novo => { valor[k] = novo; }, tituloChave(k)));
      });
      return grupo;
    }
    const label = document.createElement("label");
    const campo = document.createElement(typeof valor === "boolean" || typeof valor === "number" ? "input" : "textarea");
    campo.id = "editar-campo-" + (++numeroCampo);
    label.htmlFor = campo.id; label.textContent = nome;
    if (typeof valor === "boolean") { campo.type="checkbox"; campo.checked=valor; campo.onchange=()=>definir(campo.checked); }
    else if(typeof valor === "number") { campo.type="number"; campo.step="any"; campo.value=valor; campo.oninput=()=>{if(campo.value !== "" && Number.isFinite(campo.valueAsNumber)) definir(campo.valueAsNumber);}; }
    else { campo.rows=4; campo.value=valor ?? ""; campo.oninput=()=>definir(campo.value); }
    grupo.append(label,campo); return grupo;
  }
  if (!("nome" in copia) && !("titulo" in copia)) copia.nome = "";
  if (!("anotacoes" in copia)) copia.anotacoes = "";
  campos.append(desenhar(copia, () => {}, "Conteúdo do registro"));
  const novaSecao = document.createElement("button"); novaSecao.type="button"; novaSecao.textContent="Acrescentar seção de texto";
  novaSecao.onclick=()=>{
    const nome=prompt("Nome da nova seção:");
    if(!nome || !nome.trim()) return;
    const chave=nome.trim();
    if(["__proto__","constructor","prototype"].includes(chave) || Object.hasOwn(copia,chave)) {mensagem.textContent="Esse nome já existe ou não pode ser usado.";return;}
    copia[chave]="";
    campos.append(desenhar("", novo=>{copia[chave]=novo;},chave));
  };
  const salvar=document.createElement("button"); salvar.type="submit"; salvar.textContent="Salvar neste navegador";
  const cancelar=document.createElement("button"); cancelar.type="button"; cancelar.textContent="Cancelar";
  cancelar.onclick=()=>janela.close();
  form.append(titulo,campos,novaSecao,mensagem,salvar,cancelar);
  form.onsubmit=evento=>{
    evento.preventDefault();
    if (!String(copia.nome || copia.titulo || "").trim()) { mensagem.textContent="Preencha o nome ou título."; return; }
    try {
      const locais=lerLocais();
      if(!Array.isArray(locais)) throw new Error("Formato inválido");
      copia.atualizadoEm=new Date().toISOString(); copia.origem="local";
      const indice=locais.findIndex(x=>String(x.id)===String(itemId));
      if(indice < 0) locais.unshift(copia); else locais[indice]=copia;
      localStorage.setItem(configuracao.chaveLocal,JSON.stringify(locais));
      janela.close(); location.reload();
    } catch { mensagem.textContent="Não foi possível salvar. O navegador pode estar sem espaço ou com armazenamento bloqueado. Seus textos continuam aqui para copiar."; }
  };
  janela.append(form); document.body.append(janela);
  janela.addEventListener("close",()=>janela.remove(),{once:true});
  janela.showModal();
}

carregarItem();
