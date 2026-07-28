/* ==========================================================================
   LOGICA DI CONTROLLO INTERFACCIA, EVENTI E ESPORTAZIONE
   ========================================================================== */

const OPERATORI_BASE = [
  "--- Seleziona ---",
  "altro"
];

let docAttivo = "verbale";
let _perqSostSig = "";
let _narcoSostSig = "";

/* --------------------------------------------------------------------------
   Sincronizzazione della Vista e dei Documenti
   -------------------------------------------------------------------------- */

function setDocAttivo(doc){
  docAttivo = doc;
  document.querySelectorAll(".docTab").forEach(t => {
    t.classList.toggle("active", t.dataset.doc === doc);
  });
  buildPreview();
  scheduleDraftSave();
}

function buildPreview(){
  try {
    renderPerqSostanze();
    updatePerqAutoInfo();
    renderNarcoCampioni();
    updateNarcoAutoInfo();
    
    const html = docAttivo === "verbale161"     ? generaVerbale161()
               : docAttivo === "perquisizione"  ? generaPerquisizione()
               : docAttivo === "narcotest"      ? generaNarcotest()
               : docAttivo === "etichetta"      ? generaEtichetta()
               : generaVerbale75();
    
    const pEl = $("preview");
    pEl.classList.toggle("preview-etichetta", docAttivo === "etichetta");
    pEl.innerHTML = html;
  } catch(err) {
    const p = document.getElementById("preview");
    if(p){
      p.innerHTML = `<div style="font-family:system-ui;color:#b00"><b>Errore JS:</b> ${String(err.message || err)}</div>`;
    }
    console.error(err);
  }
}

function setDocAltroVisibility(prefix){
  const sel = document.getElementById(prefix + "_doc_tipo");
  const alt = document.getElementById(prefix + "_doc_altro");
  if(!sel || !alt) return;
  alt.style.display = sel.value === "altro" ? "block" : "none";
}

/* --------------------------------------------------------------------------
   Gestione Dynamic Elements (Operanti e Sostanze)
   -------------------------------------------------------------------------- */

function addOperanteSelect(selectedIndex = 0){
  const box = document.getElementById("operantiBox");
  if(!box) return;

  const wrap = document.createElement("div");
  wrap.className = "operanteRow";

  const sel = document.createElement("select");
  OPERATORI_BASE.forEach((name, idx) => {
    const o = document.createElement("option");
    o.value = (idx === 0) ? "" : name;
    o.textContent = (name === "altro") ? "Altro (scrivi tu)" : name;
    if(idx === selectedIndex) o.selected = true;
    sel.appendChild(o);
  });

  const other = document.createElement("input");
  other.placeholder = "Altro operante...";
  other.style.display = "none";

  const del = document.createElement("button");
  del.type = "button";
  del.textContent = "✕";
  del.title = "Rimuovi";
  del.style.padding = "8px 10px";

  const syncOther = ()=>{
    other.style.display = (sel.value === "altro") ? "block" : "none";
    buildPreview();
  };

  sel.addEventListener("change", syncOther);
  other.addEventListener("input", buildPreview);

  del.addEventListener("click", () => {
    wrap.remove();
    scheduleDraftSave();
    buildPreview();
  });

  wrap.appendChild(sel);
  wrap.appendChild(other);
  wrap.appendChild(del);
  box.appendChild(wrap);

  syncOther();
}

function getOperantiList(){
  const box = document.getElementById("operantiBox");
  if(!box) return "_________________________";

  const rows = Array.from(box.children);
  const names = rows.map(row => {
    const sel = row.querySelector("select");
    const other = row.querySelector("input");
    if(!sel) return "";
    if(!sel.value || sel.value === "--- Seleziona ---") return "";
    if(sel.value !== "altro") return sel.value;
    return (other?.value || "").trim();
  }).filter(Boolean);

  if(names.length === 0) return "_________________________";
  if(names.length === 1) return names[0];
  return names.slice(0,-1).join(", ") + " e " + names[names.length-1];
}

function addSostanzaRow(){
  const box = document.getElementById("sostanzeBox");
  if(!box) return;

  const wrapper = document.createElement("div");
  wrapper.className = "sost-block";
  wrapper.style.border = "1px dashed #ddd";
  wrapper.style.padding = "10px";
  wrapper.style.borderRadius = "12px";
  wrapper.style.background = "#fff";

  const row = document.createElement("div");
  row.className = "sostanzaRow";

  const sel = document.createElement("select");
  sel.innerHTML = `
    <option value="" selected>--- Seleziona Sostanza ---</option>
    <option value="marijuana">Marijuana</option>
    <option value="hashish">Hashish</option>
    <option value="cocaina">Cocaina</option>
    <option value="eroina">Eroina</option>
    <option value="altro">Altro (scrivi tu)</option>
  `;

  const peso = document.createElement("input");
  peso.placeholder = "grammi (es. 1,00)";
  peso.value = "";

  const del = document.createElement("button");
  del.type = "button";
  del.textContent = "✕";
  del.style.padding = "8px 10px";

  const altro = document.createElement("input");
  altro.placeholder = "Se Altro: specifica...";
  altro.style.display = "none";

  const sync = ()=>{
    altro.style.display = (sel.value === "altro") ? "block" : "none";
    buildPreview();
  };

  sel.addEventListener("change", sync);
  peso.addEventListener("input", buildPreview);
  altro.addEventListener("input", buildPreview);

  del.addEventListener("click", ()=>{
    wrapper.remove();
    scheduleDraftSave();
    buildPreview();
  });

  row.appendChild(sel);
  row.appendChild(peso);
  row.appendChild(del);

  wrapper.appendChild(row);
  wrapper.appendChild(altro);

  box.appendChild(wrapper);
  sync();
}

function applyAutoDateTime(){
  if(!document.getElementById("autoDataOra")?.checked) return;
  const d = new Date();
  document.getElementById("dataVerbale").value = nowDateIt(d);
  document.getElementById("oraVerbale").value = nowTimeIt(d);
}

/* --------------------------------------------------------------------------
   Sincronizzazione Componenti UI
   -------------------------------------------------------------------------- */

function syncVeicoloUI(){
  const yes = document.getElementById("veh_yes")?.checked === true;
  document.getElementById("veh_fields").style.display = yes ? "block" : "none";

  const same = document.getElementById("veh_owner_same")?.checked === true;
  document.getElementById("veh_owner_other_box").style.display = same ? "none" : "block";

  const rit = document.getElementById("ritiro_patente")?.checked === true;
  document.getElementById("ritiro_patente_box").style.display = rit ? "block" : "none";
}

function syncDichiarazioniUI(){
  const sel = document.getElementById("Dichiarazioni");
  const wrap = document.getElementById("Dichiarazioni_altro_wrap");
  if(!sel || !wrap) return;
  wrap.style.display = (sel.value === "altro") ? "block" : "none";
}

function syncVerbale161UI(){
  const isUfficio = document.getElementById("v161_difesa_ufficio")?.checked === true;
  const domTipo = document.getElementById("v161_dom_tipo")?.value;
  const isEletto = (domTipo === "elegge");
  
  const accettaBox = document.getElementById("v161_ufficio_accetta_box");
  const showAccetta = isUfficio && isEletto;
  if(accettaBox) accettaBox.style.display = showAccetta ? "block" : "none";

  const nonAccetta = document.getElementById("v161_accetta_no")?.checked === true;
  const dom2Box = document.getElementById("v161_dom2_box");
  if(dom2Box) dom2Box.style.display = (showAccetta && nonAccetta) ? "block" : "none";

  const dom1Ind = document.getElementById("v161_dom_indirizzo");
  if(dom1Ind) dom1Ind.style.display = (domTipo === "dichiara" || domTipo === "elegge") ? "block" : "none";

  const dom2Tipo = document.getElementById("v161_dom2_tipo")?.value;
  const dom2Ind = document.getElementById("v161_dom2_indirizzo");
  if(dom2Ind) dom2Ind.style.display = (dom2Tipo === "dichiara" || dom2Tipo === "elegge") ? "block" : "none";
}

function updatePerqAutoInfo(){
  const auto = document.getElementById("perq_dati_auto")?.checked !== false;
  const oraEl = document.getElementById("perq_info_ora");
  const luogoEl = document.getElementById("perq_info_luogo");
  [oraEl, luogoEl].forEach(el => {
    if(!el) return;
    el.readOnly = auto;
    el.style.background = auto ? "#f3f3f3" : "#fff";
  });
  if(auto){
    if(oraEl) oraEl.value = subtractMinutes(document.getElementById("oraVerbale")?.value || "", 10) || "";
    if(luogoEl) luogoEl.value = getLuogoVerbaleText();
  }
}

function renderPerqSostanze(){
  const box = document.getElementById("perq_sost_box");
  if(!box) return;
  const sost = getSostanzeArray();
  const sig = JSON.stringify(sost);
  if(sig === _perqSostSig && box.children.length === sost.length) return;
  const prev = Array.from(box.querySelectorAll("input[type=checkbox]")).map(c => c.checked);
  box.innerHTML = "";
  sost.forEach((s, i) => {
    const lab = document.createElement("label");
    lab.className = "inlineCheck";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.id = "perq_sost_" + i;
    cb.checked = (prev.length > i) ? prev[i] : true;
    cb.addEventListener("change", buildPreview);
    const span = document.createElement("span");
    span.textContent = `${s.peso || "0"} g ${s.tipo}`;
    lab.appendChild(cb);
    lab.appendChild(span);
    box.appendChild(lab);
  });
  _perqSostSig = sig;
}

function syncPerquisizioneUI(){
  const on = document.getElementById("perq_enable")?.checked === true;
  const box = document.getElementById("perq_box");
  if(box) box.style.display = on ? "block" : "none";

  const tab = document.getElementById("tab_perquisizione");
  if(tab) tab.style.display = on ? "inline-block" : "none";

  if(!on && docAttivo === "perquisizione"){
    setDocAttivo(currentPratica === "161" ? "verbale161" : "verbale");
  }

  const difBox = document.getElementById("perq_dif_box");
  if(difBox) difBox.style.display = (document.getElementById("perq_dif_si")?.checked === true) ? "block" : "none";

  const intBox = document.getElementById("perq_interprete_box");
  if(intBox) intBox.style.display = (document.getElementById("perq_lingua_no")?.checked === true) ? "block" : "none";

  const donnaBox = document.getElementById("perq_donna_box");
  if(donnaBox) donnaBox.style.display = (getSesso("s1") === "F") ? "block" : "none";

  const tipoVeicSync = document.getElementById("perq_tipo_veic")?.checked === true;
  const veicBox = document.getElementById("perq_veic_box");
  if(veicBox) veicBox.style.display = tipoVeicSync ? "block" : "none";
  const veicAutoSync = document.getElementById("perq_veic_auto")?.checked === true;
  const veicManual = document.getElementById("perq_veic_manual_box");
  if(veicManual) veicManual.style.display = veicAutoSync ? "none" : "block";

  const esitoNeg = document.getElementById("perq_esito_neg")?.checked === true;
  const esitoAuto = document.getElementById("perq_esito_auto")?.checked === true;
  const modalitaSpont = (document.getElementById("modalita")?.value === "consegna spontanea");
  const mostraPos = !(esitoNeg || (esitoAuto && modalitaSpont));
  const doveBox = document.getElementById("perq_dove_box");
  if(doveBox) doveBox.style.display = mostraPos ? "block" : "none";

  renderPerqSostanze();
}

function renderNarcoCampioni(){
  const box = document.getElementById("narco_campioni_box");
  if(!box) return;
  const sost = getSostanzeArray();
  const sig = JSON.stringify(sost);
  if(sig === _narcoSostSig && box.children.length === sost.length) return;
  const prev = Array.from(box.children).map(el => ({
    kit: el.querySelector(".narco-kit")?.value || ""
  }));
  box.innerHTML = "";
  sost.forEach((s, i) => {
    const wrap = document.createElement("div");
    wrap.style.cssText = "border:1px dashed #ddd;padding:8px;border-radius:10px;background:#fff";
    const lbl = document.createElement("div");
    lbl.className = "small";
    lbl.style.marginBottom = "6px";
    lbl.textContent = `Campione ${String.fromCharCode(65+i)}): ${s.peso || "0"} g di ${s.tipo.toUpperCase()}`;
    const inp = document.createElement("input");
    inp.className = "narco-kit";
    inp.placeholder = "Nome kit (es. MMC Cannabis Test)";
    inp.value = prev[i]?.kit || "";
    inp.addEventListener("input", buildPreview);
    wrap.appendChild(lbl);
    wrap.appendChild(inp);
    box.appendChild(wrap);
  });
  _narcoSostSig = sig;
}

function updateNarcoAutoInfo(){
  const auto = document.getElementById("narco_dati_auto")?.checked !== false;
  const oraEl  = document.getElementById("narco_info_ora");
  const luogoEl = document.getElementById("narco_info_luogo");
  [oraEl, luogoEl].forEach(el => {
    if(!el) return;
    el.readOnly = auto;
    el.style.background = auto ? "#f3f3f3" : "#fff";
  });
  if(auto){
    if(oraEl)  oraEl.value  = subtractMinutes(document.getElementById("oraVerbale")?.value || "", -5) || "";
    if(luogoEl) luogoEl.value = getLuogoVerbaleText();
  }
}

function syncNarcotestUI(){
  const on = document.getElementById("narco_enable")?.checked === true;
  const box = document.getElementById("narco_box");
  if(box) box.style.display = on ? "block" : "none";
  const tab = document.getElementById("tab_narcotest");
  if(tab) tab.style.display = on ? "inline-block" : "none";
  if(!on && docAttivo === "narcotest") setDocAttivo("verbale");
  renderNarcoCampioni();
}

function syncEtichettaUI(){
  const on = document.getElementById("etichetta_enable")?.checked === true;
  const box = document.getElementById("etichetta_box");
  if(box) box.style.display = on ? "block" : "none";
  const tab = document.getElementById("tab_etichetta");
  if(tab) tab.style.display = on ? "inline-block" : "none";
  if(!on && docAttivo === "etichetta") setDocAttivo("verbale");
}

function setMobilePane(pane){
  const next = pane === "preview" ? "preview" : "form";
  document.body.classList.toggle("mobile-pane-preview", next === "preview");
  document.body.classList.toggle("mobile-pane-form", next === "form");
  document.querySelectorAll(".mobilePaneBtn").forEach(btn => {
    const active = btn.dataset.pane === next;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
  if(next === "preview") buildPreview();
}

function updateMobilePreviewScale(){
  const scale = Math.max(0.32, Math.min(1, (window.innerWidth - 24) / 794));
  document.documentElement.style.setProperty("--previewScale", String(scale));
}

function initResizer(){
  const resizer = document.getElementById("resizer");
  const left = document.querySelector(".left");
  if(!resizer || !left) return;
  let dragging=false;

  const start=()=>{ dragging=true; document.body.style.cursor="col-resize"; document.body.style.userSelect="none"; };
  const move=(e)=>{
    if(!dragging) return;
    const x=e.clientX;
    const min=340;
    const max=Math.min(window.innerWidth*0.7, 980);
    left.style.width = Math.max(min, Math.min(max, x)) + "px";
  };
  const stop=()=>{ dragging=false; document.body.style.cursor=""; document.body.style.userSelect=""; };

  resizer.addEventListener("mousedown", start);
  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", stop);
}

/* --------------------------------------------------------------------------
   Esportazione, Stampa e Generazione Documenti (Word/PDF)
   -------------------------------------------------------------------------- */

function getExportHtmlBase(forPrint){
  const content = document.getElementById("preview").innerHTML;

  const pageCss = forPrint
    ? `@page { size: A4; margin: 0; }
         body { margin: 0; padding: 1cm 2cm 1cm 2cm; font-family: "Times New Roman"; font-size: 11pt; line-height: 1.1; }`
    : `@page { size: A4; margin: 1cm 2cm 1cm 2cm; }
         body { margin: 0; font-family: "Times New Roman"; font-size: 11pt; line-height: 1.1; }`;

  return `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          ${pageCss}
          p { widows: 2; orphans: 2; margin: 0; }
        </style>
      </head>
      <body>${content}</body>
    </html>
  `;
}

async function tryFetchDataUri(url){
  try{
    const res = await fetch(url, { cache: "no-store" });
    if(!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject)=>{
      const r = new FileReader();
      r.onloadend = ()=> resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }catch(e){
    return null;
  }
}

async function getExportHtmlForWord(){
  let html = getExportHtmlBase();

  const dataUri = await tryFetchDataUri("./emblem.png");

  if(dataUri){
    html = html
      .replaceAll('src="./emblem.png"', `src="${dataUri}"`)
      .replaceAll("src='emblem.png'", `src="${dataUri}"`);
  }
  return html;
}

async function exportWord(){
  const html = await getExportHtmlForWord();
  if (typeof window.htmlDocx === "undefined") {
    alert("Errore nel caricamento della libreria Word. Verificare la connessione internet.");
    return;
  }
  const blob = window.htmlDocx.asBlob(html, {
    orientation: "portrait",
    width: 11906,  
    height: 16838, 
    margins: { top: 567, right: 1134, bottom: 567, left: 1134, header: 720, footer: 204, gutter: 0 }
  });
  saveAs(blob, currentPratica === "161" ? "verbale_art161.docx" : "verbale_art75.docx");
}

function printWithFrame(html, docTitle){
  let fr = document.getElementById("_printFrame");
  if(fr) fr.remove();
  fr = document.createElement("iframe");
  fr.id = "_printFrame";
  fr.setAttribute("aria-hidden", "true");
  fr.style.cssText = "position:fixed;width:0;height:0;top:-1px;left:-1px;border:0;opacity:0;pointer-events:none";
  document.body.appendChild(fr);
  const doc = fr.contentDocument || fr.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  if(docTitle) doc.title = docTitle;
  setTimeout(()=>{ fr.contentWindow.focus(); fr.contentWindow.print(); }, 300);
}

function printPreview(){
  printWithFrame(getExportHtmlBase(true));
}

function exportPDF(){
  printWithFrame(getExportHtmlBase(true), currentPratica === "161" ? "verbale_art161" : "verbale_art75");
}

function stampaTutto(){
  const pageBreak = `<div style="page-break-after:always"></div>`;
  let parts = [];

  if(currentPratica === "161") {
    parts.push(generaVerbale161());
  } else {
    parts.push(generaVerbale75());
    if(document.getElementById("perq_enable")?.checked) parts.push(generaPerquisizione());
    if(document.getElementById("narco_enable")?.checked) parts.push(generaNarcotest());
    if(document.getElementById("etichetta_enable")?.checked){
      parts.push(`
        <div style="font-family:'Times New Roman';font-size:10pt;margin-bottom:6mm;color:#555">
          ✂ Ritagliare lungo il bordo e applicare sulla busta del reperto
        </div>
        ${generaEtichetta()}
      `);
    }
  }

  const body = parts
    .map(p => `<div style="padding:1cm 2cm 1cm 2cm">${p}</div>`)
    .join(pageBreak);

  printWithFrame(`
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: A4; margin: 0; }
          body { margin:0; font-family:"Times New Roman"; font-size:11pt; line-height:1.1; }
          p { widows:2; orphans:2; margin:0; }
        </style>
      </head>
      <body>${body}</body>
    </html>
  `);
}

/* --------------------------------------------------------------------------
   Collegamento degli Eventi (wireEvents)
   -------------------------------------------------------------------------- */

function wireEvents(){
  ["s1_nato_il","s1_doc_rilascio_il","s2_nato_il","s2_doc_rilascio_il","dataVerbale","pat_ril_il"]
    .forEach(attachDateMask);

  ["s1","s2"].forEach(p=>{
    document.getElementById(p+"_doc_tipo")?.addEventListener("change", ()=>{ setDocAltroVisibility(p); buildPreview(); });
    document.getElementById(p+"_doc_altro")?.addEventListener("input", buildPreview);
  });

  document.getElementById("s2_enable")?.addEventListener("change", ()=>{
    document.getElementById("s2_box").style.display = document.getElementById("s2_enable").checked ? "block" : "none";
    buildPreview();
  });

  document.getElementById("verbaleInUffici")?.addEventListener("change", ()=>{
    document.getElementById("verbaleLuogoBox").style.display = isVerbaleInUffici() ? "none" : "block";
    buildPreview();
  });

  document.getElementById("interventoUgualeVerbale")?.addEventListener("change", ()=>{
    const on = document.getElementById("interventoUgualeVerbale").checked;
    document.getElementById("interventoLuogoBox").style.display = on ? "none" : "block";
    buildPreview();
  });

  document.getElementById("tipoSostanza")?.addEventListener("change", ()=>{
    document.getElementById("altroWrap").style.display = (document.getElementById("tipoSostanza").value==="altro") ? "block" : "none";
    buildPreview();
  });

  document.getElementById("btn_add_sostanza")?.addEventListener("click", ()=>{
    addSostanzaRow();
    scheduleDraftSave();
  });

  document.getElementById("autoDataOra")?.addEventListener("change", ()=>{ applyAutoDateTime(); buildPreview(); });

  document.getElementById("btn_add_operante")?.addEventListener("click", ()=>{ addOperanteSelect(0); scheduleDraftSave(); buildPreview(); });

  document.getElementById("dep_narcotest")?.addEventListener("change", buildPreview);
  document.getElementById("dep_laboratorio")?.addEventListener("change", buildPreview);

  ["veh_no","veh_yes","veh_owner_same","ritiro_patente","invito_patente","verbale_180","extracomunitario"].forEach(id=>{
    document.getElementById(id)?.addEventListener("change", ()=>{ syncVeicoloUI(); buildPreview(); });
  });

  document.getElementById("Dichiarazioni")?.addEventListener("change", ()=>{
    syncDichiarazioniUI();
    buildPreview();
  });
  document.getElementById("Dichiarazioni_altro")?.addEventListener("input", buildPreview);

  document.querySelectorAll(".docTab").forEach(tab=>{
    tab.addEventListener("click", ()=> setDocAttivo(tab.dataset.doc));
  });

  ["s1_sesso","s2_sesso"].forEach(id=>{
    document.getElementById(id)?.addEventListener("change", ()=>{ syncPerquisizioneUI(); buildPreview(); });
  });

  [
    "v161_difesa_fiducia","v161_difesa_ufficio","v161_dom_tipo","v161_accetta_si","v161_accetta_no","v161_dom2_tipo",
    "v161_rdc_no","v161_rdc_si"
  ].forEach(id=>{
    document.getElementById(id)?.addEventListener("change", ()=>{ syncVerbale161UI(); buildPreview(); });
  });

  [
    "perq_enable","perq_dati_auto","perq_tipo_pers","perq_tipo_veic","perq_base",
    "perq_m1","perq_m2","perq_m3","perq_m4",
    "perq_dif_no","perq_dif_si",
    "perq_esito_auto","perq_esito_pos","perq_esito_neg",
    "perq_lingua_si","perq_lingua_no",
    "perq_tipo_veic","perq_veic_auto"
  ].forEach(id=>{
    document.getElementById(id)?.addEventListener("change", ()=>{ syncPerquisizioneUI(); buildPreview(); });
  });
  ["perq_veic_marca","perq_veic_modello","perq_veic_targa"].forEach(id=>{
    document.getElementById(id)?.addEventListener("input", buildPreview);
  });

  document.getElementById("narco_enable")?.addEventListener("change", ()=>{ syncNarcotestUI(); buildPreview(); });
  document.getElementById("narco_dati_auto")?.addEventListener("change", ()=>{ updateNarcoAutoInfo(); buildPreview(); });
  ["narco_esito_pos","narco_esito_neg"].forEach(id=>{
    document.getElementById(id)?.addEventListener("change", buildPreview);
  });
  ["narco_info_ora","narco_info_luogo"].forEach(id=>{
    document.getElementById(id)?.addEventListener("input", buildPreview);
  });

  document.getElementById("etichetta_enable")?.addEventListener("change", ()=>{ syncEtichettaUI(); buildPreview(); });
  ["etichetta_n_pratica","etichetta_n_registro"].forEach(id=>{
    document.getElementById(id)?.addEventListener("input", buildPreview);
  });

  document.getElementById("btn_stampa_tutto")?.addEventListener("click", stampaTutto);
  document.getElementById("btn_stampa_tutto_prev")?.addEventListener("click", stampaTutto);

  document.getElementById("btn_print")?.addEventListener("click", printPreview);
  document.getElementById("btn_pdf")?.addEventListener("click", exportPDF);
  document.getElementById("btn_word")?.addEventListener("click", exportWord);
  document.getElementById("btn_print_prev")?.addEventListener("click", printPreview);
  document.getElementById("btn_pdf_prev")?.addEventListener("click", exportPDF);
  document.getElementById("btn_word_prev")?.addEventListener("click", exportWord);
  document.getElementById("btn_new")?.addEventListener("click", newVerbale);

  document.querySelectorAll(".mobilePaneBtn").forEach(btn=>{
    btn.addEventListener("click", ()=> setMobilePane(btn.dataset.pane));
  });

  const ids = [
    "legione","comando","squadra",
    "s1_cognome","s1_nome","s1_nato_a","s1_nato_il","s1_res_comune","s1_res_via","s1_res_civ",
    "s1_doc_num","s1_doc_rilascio_il","s1_doc_rilascio_da","s1_tel",
    "s2_cognome","s2_nome","s2_nato_a","s2_nato_il","s2_res_comune","s2_res_via","s2_res_civ",
    "s2_doc_num","s2_doc_rilascio_il","s2_doc_rilascio_da","s2_tel",
    "dataVerbale","oraVerbale","verbale_via","verbale_comune",
    "intervento_luogo","intervento_ora",
    "modalita","pesoGrammi","tipoAltro","depositoPresso",
    "veh_marca","veh_modello","veh_targa","veh_owner_other",
    "pat_nr","pat_ril_il","pat_ril_da",
    "Dichiarazioni","noteExtra",
    "v161_reato","v161_luogo_reato","v161_avv_nome","v161_avv_foro","v161_avv_studio","v161_avv_tel","v161_avv_pec",
    "v161_dom_indirizzo","v161_dom2_indirizzo","v161_trib_citta","v161_trib_indirizzo",
    "perq_info_ora","perq_info_luogo",
    "perq_dif_nome","perq_ora_inizio","perq_ora_fine","perq_circostanze",
    "perq_dove","perq_dich","perq_interprete","perq_lingua_parlata","perq_eseguita_da",
    "narco_info_ora","narco_info_luogo","narco_colore_esito",
    "etichetta_n_pratica","etichetta_n_registro"
  ];
  ids.forEach(id=>{
    const el=document.getElementById(id);
    if(el){
      el.addEventListener("input", buildPreview);
      el.addEventListener("change", buildPreview);
    }
  });

  document.querySelector(".left")?.addEventListener("input", scheduleDraftSave);
  document.querySelector(".left")?.addEventListener("change", scheduleDraftSave);
  window.addEventListener("beforeunload", ()=> saveDraftNow(false));
  window.addEventListener("pagehide", ()=> saveDraftNow(false));
  document.addEventListener("visibilitychange", ()=>{
    if(document.visibilityState === "hidden") saveDraftNow(false);
  });
}

/* --------------------------------------------------------------------------
   Inizializzazione al caricamento del DOM
   -------------------------------------------------------------------------- */

window.addEventListener("DOMContentLoaded", ()=>{
  updateMobilePreviewScale();
  window.addEventListener("resize", updateMobilePreviewScale);
  window.visualViewport?.addEventListener("resize", updateMobilePreviewScale);
  setMobilePane("form");

  setDocAltroVisibility("s1");
  setDocAltroVisibility("s2");

  document.getElementById("verbaleLuogoBox").style.display = isVerbaleInUffici() ? "none" : "block";

  document.getElementById("interventoLuogoBox").style.display =
    document.getElementById("interventoUgualeVerbale").checked ? "none" : "block";

  applyAutoDateTime();

  const currentUser = sessionStorage.getItem("v75_user_operante");
  if(document.getElementById("operantiBox")?.children.length === 0){
    if(currentUser){
      setUserOperanteFirst(currentUser);
    } else {
      addOperanteSelect(0);
    }
  }

  syncVeicoloUI();
  syncDichiarazioniUI();
  syncVerbale161UI();
  syncPerquisizioneUI();
  syncNarcotestUI();
  syncEtichettaUI();

  document.querySelectorAll(".sectionHead").forEach(head => {
    head.addEventListener("click", () => {
      const body = document.getElementById(head.dataset.body);
      const collapsed = head.classList.toggle("collapsed");
      if(body) body.style.display = collapsed ? "none" : "";
    });
  });

  initResizer();
  wireEvents();
  const restored = restoreDraft(false);
  if(restored){
    setSaveStatus("Ultima bozza ripristinata.");
  } else {
    setSaveStatus("Bozza salvata automaticamente su questo dispositivo.");
    buildPreview();
    saveDraftNow(false);
  }
});