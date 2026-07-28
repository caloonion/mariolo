/* ==========================================================================
   GESTIONE BOZZE E SALVATAGGIO AUTOMATICO (localStorage)
   ========================================================================== */

const DRAFT_KEY = "verbale75.draft.v1";
let restoreInProgress = false;
let autosaveTimer = null;

// Aggiorna la barra di stato del salvataggio nel form
function setSaveStatus(text){
  const el = document.getElementById("saveStatus");
  if(el) el.textContent = text || "";
}

// Raccoglie tutti i valori inseriti nei campi dell'interfaccia
function collectDraft(){
  const fields = {};
  document.querySelectorAll(".left input[id], .left textarea[id], .left select[id]").forEach(el => {
    if(el.type === "radio" || el.type === "checkbox"){
      fields[el.id] = { type: el.type, checked: el.checked };
    } else {
      fields[el.id] = { type: el.tagName.toLowerCase(), value: el.value };
    }
  });

  const operanti = Array.from(document.querySelectorAll("#operantiBox .operanteRow")).map(row => ({
    selected: row.querySelector("select")?.value || "",
    other: row.querySelector("input")?.value || ""
  }));

  const sostanzeExtra = Array.from(document.querySelectorAll("#sostanzeBox .sost-block")).map(row => {
    const inputs = row.querySelectorAll("input");
    return {
      tipo: row.querySelector("select")?.value || "",
      peso: inputs[0]?.value || "",
      altro: inputs[1]?.value || ""
    };
  });

  const perqSostanze = Array.from(document.querySelectorAll("#perq_sost_box input[type='checkbox']")).map(cb => cb.checked);

  const narcoCampioni = Array.from(document.querySelectorAll("#narco_campioni_box > div")).map(el => ({
    kit: el.querySelector(".narco-kit")?.value || ""
  }));

  return {
    savedAt: new Date().toISOString(),
    currentPratica,
    fields,
    operanti,
    sostanzeExtra,
    perqSostanze,
    narcoCampioni,
    docAttivo
  };
}

// Salva la bozza immediatamente
function saveDraftNow(showStatus = false){
  if(restoreInProgress) return;
  try{
    localStorage.setItem(DRAFT_KEY, JSON.stringify(collectDraft()));
    if(showStatus) setSaveStatus("Bozza salvata su questo dispositivo.");
  }catch(err){
    setSaveStatus("Salvataggio non riuscito: spazio locale non disponibile.");
  }
}

// Pianifica il salvataggio automatico (debounced)
function scheduleDraftSave(){
  if(restoreInProgress) return;
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(()=>{
    saveDraftNow();
    setSaveStatus("Bozza salvata automaticamente.");
  }, 500);
}

// Applica i dati di una bozza agli elementi della pagina
function applySavedDraft(draft){
  if(!draft || !draft.fields) return false;

  // Se la sessione non è sbloccata col PIN, forza la schermata di blocco
  if(sessionStorage.getItem("v75_unlocked") !== "1"){
    if (typeof showLock === "function") showLock();
    return false;
  }

  restoreInProgress = true;

  if(draft.currentPratica) {
    currentPratica = draft.currentPratica;
    if (typeof showAppPratica === "function") showAppPratica(currentPratica);
  }

  Object.entries(draft.fields).forEach(([id, item]) => {
    const el = document.getElementById(id);
    if(!el || !item) return;
    if(item.type === "radio" || item.type === "checkbox"){
      el.checked = !!item.checked;
    } else if("value" in item){
      el.value = item.value;
    }
  });

  // Ripristino operanti
  const operantiBox = document.getElementById("operantiBox");
  if(operantiBox){
    operantiBox.innerHTML = "";
    const savedOperanti = Array.isArray(draft.operanti) && draft.operanti.length 
      ? draft.operanti 
      : [{selected: ""}];
    savedOperanti.forEach(op => {
      if (typeof addOperanteSelect === "function") {
        addOperanteSelect(Math.max(0, OPERATORI_BASE.indexOf(op.selected)));
      }
      const row = operantiBox.lastElementChild;
      const sel = row?.querySelector("select");
      const other = row?.querySelector("input");
      if(sel) sel.value = OPERATORI_BASE.includes(op.selected) ? op.selected : "altro";
      if(other) other.value = op.other || (!OPERATORI_BASE.includes(op.selected) ? op.selected : "");
      sel?.dispatchEvent(new Event("change"));
    });
  }

  // Ripristino sostanze
  const sostanzeBox = document.getElementById("sostanzeBox");
  if(sostanzeBox){
    sostanzeBox.innerHTML = "";
    (draft.sostanzeExtra || []).forEach(s => {
      if (typeof addSostanzaRow === "function") addSostanzaRow();
      const row = sostanzeBox.lastElementChild;
      const sel = row?.querySelector("select");
      const inputs = row?.querySelectorAll("input");
      if(sel) sel.value = s.tipo || "";
      if(inputs?.[0]) inputs[0].value = s.peso || "";
      if(inputs?.[1]) inputs[1].value = s.altro || "";
      sel?.dispatchEvent(new Event("change"));
    });
  }

  // Sincronizzazione dell'interfaccia utente
  if (typeof setDocAltroVisibility === "function") {
    setDocAltroVisibility("s1");
    setDocAltroVisibility("s2");
  }
  const s2Box = document.getElementById("s2_box");
  if(s2Box) s2Box.style.display = document.getElementById("s2_enable")?.checked ? "block" : "none";

  const vLuogoBox = document.getElementById("verbaleLuogoBox");
  if(vLuogoBox && typeof isVerbaleInUffici === "function") {
    vLuogoBox.style.display = isVerbaleInUffici() ? "none" : "block";
  }

  const intLuogoBox = document.getElementById("interventoLuogoBox");
  if(intLuogoBox) {
    intLuogoBox.style.display = document.getElementById("interventoUgualeVerbale")?.checked ? "none" : "block";
  }

  const altroWrap = document.getElementById("altroWrap");
  if(altroWrap) {
    altroWrap.style.display = (document.getElementById("tipoSostanza")?.value === "altro") ? "block" : "none";
  }

  if (typeof syncVeicoloUI === "function") syncVeicoloUI();
  if (typeof syncDichiarazioniUI === "function") syncDichiarazioniUI();
  if (typeof syncVerbale161UI === "function") syncVerbale161UI();
  if (typeof syncPerquisizioneUI === "function") syncPerquisizioneUI();
  if (typeof syncNarcotestUI === "function") syncNarcotestUI();
  if (typeof syncEtichettaUI === "function") syncEtichettaUI();
  
  if(draft.docAttivo && typeof setDocAttivo === "function") setDocAttivo(draft.docAttivo);
  if (typeof buildPreview === "function") buildPreview();

  // Ripristino opzioni perquisizione
  if(Array.isArray(draft.perqSostanze)){
    draft.perqSostanze.forEach((checked, i) => {
      const cb = document.getElementById("perq_sost_" + i);
      if(cb) cb.checked = !!checked;
    });
  }

  // Ripristino campioni narcotest
  if(Array.isArray(draft.narcoCampioni)){
    if (typeof renderNarcoCampioni === "function") renderNarcoCampioni();
    Array.from(document.querySelectorAll("#narco_campioni_box > div")).forEach((el, i) => {
      const d = draft.narcoCampioni[i];
      if(!d) return;
      const kit = el.querySelector(".narco-kit");
      if(kit) kit.value = d.kit || "";
    });
  }

  restoreInProgress = false;
  return true;
}

// Ripristina l'ultima bozza salvata dal localStorage
function restoreDraft(showStatus = true){
  try{
    const raw = localStorage.getItem(DRAFT_KEY);
    if(!raw){
      if(showStatus) setSaveStatus("Nessuna bozza salvata.");
      return false;
    }
    const ok = applySavedDraft(JSON.parse(raw));
    if(showStatus && ok) setSaveStatus("Ultima bozza ripristinata.");
    return ok;
  }catch(err){
    setSaveStatus("Bozza salvata non leggibile.");
    restoreInProgress = false;
    return false;
  }
}

let _newConfirmTimer = null;

// Svuota tutti i campi del modulo per un nuovo verbale
function newVerbale(){
  const btn = document.getElementById("btn_new");

  if(!btn || btn.dataset.confirm !== "1"){
    if(btn){
      btn.dataset.confirm = "1";
      btn.textContent = "Sicuro?";
      btn.style.background = "#fee2e2";
      btn.style.borderColor = "#f87171";
      btn.style.color = "#b91c1c";
    }
    clearTimeout(_newConfirmTimer);
    _newConfirmTimer = setTimeout(()=>{
      if(btn){
        btn.dataset.confirm = "";
        btn.textContent = "Nuovo";
        btn.style.background = "";
        btn.style.borderColor = "";
        btn.style.color = "";
      }
    }, 3000);
    return;
  }

  clearTimeout(_newConfirmTimer);
  btn.dataset.confirm = "";
  btn.textContent = "Nuovo";
  btn.style.background = "";
  btn.style.borderColor = "";
  btn.style.color = "";

  const KEEP = new Set([
    "narco_info_ora","narco_info_luogo","perq_info_ora","perq_info_luogo"
  ]);

  document.querySelectorAll(".left input[id], .left textarea[id], .left select[id]").forEach(el => {
    if(KEEP.has(el.id)) return;
    if(el.type === "radio" || el.type === "checkbox"){
      el.checked = el.defaultChecked;
    } else {
      el.value = el.defaultValue;
    }
  });

  const sostanzeBox = document.getElementById("sostanzeBox");
  if(sostanzeBox) sostanzeBox.innerHTML = "";
  
  const operantiBox = document.getElementById("operantiBox");
  if(operantiBox){
    operantiBox.innerHTML = "";
    const currentUser = sessionStorage.getItem("v75_user_operante");
    if(currentUser){
      if (typeof setUserOperanteFirst === "function") setUserOperanteFirst(currentUser);
    } else {
      if (typeof addOperanteSelect === "function") addOperanteSelect(0);
    }
  }

  if (typeof applyAutoDateTime === "function") applyAutoDateTime();
  if (typeof setDocAltroVisibility === "function") {
    setDocAltroVisibility("s1");
    setDocAltroVisibility("s2");
  }

  const s2Box = document.getElementById("s2_box");
  if(s2Box) s2Box.style.display = "none";

  const vLuogoBox = document.getElementById("verbaleLuogoBox");
  if(vLuogoBox) vLuogoBox.style.display = "block";

  const intLuogoBox = document.getElementById("interventoLuogoBox");
  if(intLuogoBox) intLuogoBox.style.display = "block";

  const altroWrap = document.getElementById("altroWrap");
  if(altroWrap) altroWrap.style.display = "none";

  if (typeof syncVeicoloUI === "function") syncVeicoloUI();
  if (typeof syncDichiarazioniUI === "function") syncDichiarazioniUI();
  if (typeof syncVerbale161UI === "function") syncVerbale161UI();
  if (typeof syncPerquisizioneUI === "function") syncPerquisizioneUI();

  if (typeof setDocAttivo === "function") {
    setDocAttivo(currentPratica === "161" ? "verbale161" : "verbale");
  }

  localStorage.removeItem(DRAFT_KEY);
  clearTimeout(autosaveTimer);

  if (typeof buildPreview === "function") buildPreview();
  saveDraftNow(false);
  setSaveStatus("Nuovo verbale creato. Tutti i campi sono stati svuotati.");
}