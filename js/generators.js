/* ==========================================================================
   FUNZIONI DI UTILITÀ E GENERATORI DI TESTO DEI VERBALI
   ========================================================================== */

// Utility di selezione rapida nel DOM
function $(id){
  const el = document.getElementById(id);
  if(!el) throw new Error("Elemento mancante: #" + id);
  return el;
}

// Formattazione date, ore e numeri
const fmt2 = (n) => String(n).padStart(2, "0");
const nowDateIt = (d) => `${fmt2(d.getDate())}/${fmt2(d.getMonth()+1)}/${d.getFullYear()}`;
const nowTimeIt = (d) => `${fmt2(d.getHours())}:${fmt2(d.getMinutes())}`;
function normPeso(s){ return (s || "").trim().replace(".", ","); }

function daysInMonth(m, y){
  if(m === 2) return (y == null) ? 29 : ((((y%4===0) && (y%100!==0)) || (y%400===0)) ? 29 : 28);
  return [31,28,31,30,31,30,31,31,30,31,30,31][m-1] || 31;
}

function maskDateValue(raw){
  const d = (raw || "").replace(/\D/g, "").slice(0, 8);
  let dd = d.slice(0,2), mm = d.slice(2,4), yy = d.slice(4,8);
  if(dd.length === 2){
    const n = parseInt(dd, 10);
    if(n === 0) dd = "01";
    else if(n > 31) dd = "31";
  }
  if(mm.length === 2){
    const n = parseInt(mm, 10);
    if(n === 0) mm = "01";
    else if(n > 12) mm = "12";
  }
  if(dd.length === 2 && mm.length === 2){
    const y = (yy.length === 4) ? parseInt(yy, 10) : null;
    const maxd = daysInMonth(parseInt(mm, 10), y);
    if(parseInt(dd, 10) > maxd) dd = String(maxd).padStart(2, "0");
  }
  let out = dd;
  if(d.length > 2) out += "/" + mm;
  if(d.length > 4) out += "/" + yy;
  return out;
}

function attachDateMask(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.setAttribute("inputmode", "numeric");
  el.addEventListener("input", ()=>{
    const masked = maskDateValue(el.value);
    if(masked !== el.value) el.value = masked;
  });
}

function ensureDotEnd(s){
  const t = (s || "").trim();
  if(!t) return "";
  return t.endsWith(".") ? t : (t + ".");
}

function ensureEndsVerbaleMark(s){
  const t = (s || "").trim();
  if(!t) return "";
  if(t.endsWith("-------//")) return t;
  if(t.endsWith(".")) return t + "-------//";
  return t + ".-------//";
}

function subtractMinutes(timeStr, mins){
  const m = /^(\d{1,2}):(\d{2})$/.exec((timeStr || "").trim());
  if(!m) return "";
  let tot = (parseInt(m[1],10) * 60 + parseInt(m[2],10) - mins) % 1440;
  if(tot < 0) tot += 1440;
  return `${fmt2(Math.floor(tot/60))}:${fmt2(tot%60)}`;
}

// Estrazione tipo documento
function getDocTipo(prefix){
  const sel = $(prefix + "_doc_tipo").value;
  if(!sel) return "";
  if(sel !== "altro") return sel;
  const a = ($(prefix + "_doc_altro").value || "").trim();
  return a || "altro";
}

// Estrazione e formattazione dati anagrafici soggetto
function getSoggetto(prefix){
  const cogn = ($(prefix + "_cognome").value || "").trim().toUpperCase();
  const nome = ($(prefix + "_nome").value || "").trim();
  const natoA = ($(prefix + "_nato_a").value || "").trim();
  const natoIl = ($(prefix + "_nato_il").value || "").trim();
  const resCom = ($(prefix + "_res_comune").value || "").trim();
  const resVia = ($(prefix + "_res_via").value || "").trim();
  const resCiv = ($(prefix + "_res_civ").value || "").trim();

  const docTipo = getDocTipo(prefix);
  const docNum = ($(prefix + "_doc_num").value || "").trim();
  const docRilIl = ($(prefix + "_doc_rilascio_il").value || "").trim();
  const docRilDa = ($(prefix + "_doc_rilascio_da").value || "").trim();
  const tel = ($(prefix + "_tel").value || "").trim();

  const boldName = `${cogn} ${nome}`.trim() || "________________________";

  let dati = "";
  if(natoA || natoIl) dati += `nato a ${natoA || "________"} il ${natoIl || "________"}, `;
  if(resCom) dati += `residente a ${resCom} `;
  if(resVia || resCiv) dati += `in ${resVia} ${resCiv}`.trim() + ", ";
  if(docNum || docRilIl || docRilDa){
    dati += `identificato mediante ${docTipo || "documento"} nr. ${docNum || "____"} rilasciato il ${docRilIl || "____"} da ${docRilDa || "____"}`;
  } else {
    dati += `identificato mediante ${docTipo || "documento di riconoscimento"}`;
  }
  if(tel) dati += ` – tel. ${tel}`;
  dati = ensureDotEnd(dati);

  return { boldName, dati };
}

// Estrazione lista sostanze
function getSostanzeArray(){
  const arr = [];
  const baseTipo = $("tipoSostanza").value;
  const baseAltro = ($("tipoAltro").value || "").trim();
  arr.push({
    tipo: (baseTipo === "altro") ? (baseAltro || "altro") : (baseTipo || "________"),
    peso: normPeso($("pesoGrammi").value)
  });
  const box = document.getElementById("sostanzeBox");
  if(box){
    box.querySelectorAll(".sost-block").forEach((b)=>{
      const sel = b.querySelector("select");
      const inps = b.querySelectorAll("input");
      const peso = inps[0];
      const altro = inps[1];
      if(!sel || !peso) return;
      const t = (sel.value === "altro") ? ((altro?.value || "").trim() || "altro") : (sel.value || "________");
      arr.push({ tipo: t, peso: normPeso(peso.value) });
    });
  }
  return arr;
}

function getSesso(prefix){
  const el = document.getElementById(prefix + "_sesso");
  return (el && el.value === "F") ? "F" : "M";
}

function buildSequestroParas(modalita){
  const modText = modalita || "______________________";
  return [
    `La sostanza in questione, sottoposta a sequestro amministrativo ai sensi degli artt. 13 e 19 della Legge 24.11.1981 nr. 689, è stata rinvenuta a seguito di ${modText} ed è stata quantificata mediante pesatura con strumentazione in dotazione.------//`,
    `Tale provvedimento trova giustificazione in quanto la condotta integra l’illecito amministrativo di cui all’art. 75, comma 1, del citato decreto, essendo la sostanza detenuta per uso esclusivamente personale, al di fuori delle ipotesi di cui all’art. 73 e fuori dalle condizioni dell’art. 72 del medesimo dispositivo.------//`
  ];
}

function buildDeposito(presso){
  const narcotest = document.getElementById("dep_narcotest")?.checked === true;
  if(narcotest){
    return `La sostanza sequestrata viene depositata presso gli Uffici del ${presso || "_____________________"} per sottoporla ad analisi con reagente narcotest.------//`;
  }
  return `La sostanza sequestrata viene depositata presso gli Uffici del ${presso || "_____________________"} per curare la successiva trasmissione al Laboratorio di Analisi Sostanze Stupefacenti competente, al fine di determinarne l’esatta natura, la quantità e la qualità di principio attivo.------//`;
}

function isVerbaleInUffici(){
  return document.getElementById("verbaleInUffici")?.checked === true;
}

function getLuogoVerbaleText(){
  if(isVerbaleInUffici()){
    return "negli Uffici del Comando in intestazione";
  }
  const via = (document.getElementById("verbale_via")?.value || "").trim();
  const com = (document.getElementById("verbale_comune")?.value || "").trim();
  if(!via && !com) return "______________________";
  return `in ${via || "via __________________________"} del Comune di ${com || "______________________"}`;
}

function getLuogoIntervento(){
  const uguale = document.getElementById("interventoUgualeVerbale")?.checked === true;
  if(uguale){
    const com = (document.getElementById("verbale_comune")?.value || "______________________").trim();
    return com || "______________________";
  }
  return (document.getElementById("intervento_luogo")?.value || "______________________").trim();
}

function getOraIntervento(){
  const uguale = document.getElementById("interventoUgualeVerbale")?.checked === true;
  if(uguale){
    return (document.getElementById("oraVerbale")?.value || "__:__").trim();
  }
  return (document.getElementById("intervento_ora")?.value || "__:__").trim();
}

function getDichiarazioniValue(){
  const sel = document.getElementById("Dichiarazioni");
  if(!sel || !sel.value) return "";
  if(sel.value !== "altro") return ensureEndsVerbaleMark(sel.value);

  const txt = (document.getElementById("Dichiarazioni_altro")?.value || "").trim();
  return ensureEndsVerbaleMark(txt);
}


/* ==========================================================================
   1. GENERATORE VERBALE ART. 75 D.P.R. 309/90
   ========================================================================== */
function generaVerbale75(){
    const legione = $("legione").value || "______________________";
    const comando = $("comando").value || "______________________";
    const squadra = $("squadra").value || "______________________";

    const plurale = document.getElementById("s2_enable")?.checked === true;

    const s1 = getSoggetto("s1");
    const soggetti = [s1];
    if(plurale) soggetti.push(getSoggetto("s2"));

    const OGGETTO_FISSO =
      "Verbale di accertamento e contestazione di illecito amministrativo, eseguito ex art. 75, comma 1, del D.P.R. 09.10.1990 nr. 309, e contestuale sequestro amministrativo ex artt. 13 e 19 della Legge 24.11.1981 nr. 689, redatto a carico di:";

    const dataVerbale = (document.getElementById("dataVerbale")?.value || "___/___/_____").trim();
    const oraVerbale  = (document.getElementById("oraVerbale")?.value || "__:__").trim();
    const luogoVerbale = getLuogoVerbaleText();

    const operanti = getOperantiList();

    const luogoInterv = getLuogoIntervento();
    const oraInterv = getOraIntervento();

    const modalita = $("modalita").value;

    const sostArr = getSostanzeArray();
    const descrList = sostArr.map((s, i) => {
      const fine = (i === sostArr.length - 1) ? "." : ";";
      return `- grammi <b>${s.peso || "____"}</b> di sostanza verosimilmente stupefacente del tipo <b>${s.tipo.toUpperCase()}</b>${fine}`;
    });

    const depositoPresso = $("depositoPresso").value;

    const dichiarazioni = getDichiarazioniValue();
    const noteExtra = (document.getElementById("noteExtra")?.value || "").trim();

    const corpoStd =
      `In data ${dataVerbale}, alle ore ${oraVerbale}, ${luogoVerbale}, i sottoscritti Ufficiali e/o Agenti di Polizia Giudiziaria ${operanti}, in forza al Comando in intestazione, danno atto di quanto segue.------//`;

    const personaMargine = plurale ? "delle persone a margine indicate" : "della persona a margine indicata";
    const trovata = plurale ? "trovate" : "trovata";

    const introOperazione =
      `Nel corso di operazione di polizia finalizzata anche alla prevenzione e repressione del traffico illecito di sostanze stupefacenti o psicotrope, espletata in ${luogoInterv} alle precedenti ore ${oraInterv} e successive, al termine delle operazioni di rito si è proceduto alla contestazione dell'illecito amministrativo di cui all'art. 75 D.P.R. 309/90 (uso personale di sostanze stupefacenti) nei confronti ${personaMargine}, in quanto ${trovata} in possesso di:`;

    const resoE =
      `${plurale ? "Le persone sottoposte agli accertamenti vengono rese edotte" : "La persona sottoposta agli accertamenti viene resa edotta"} che:------//`;

    const vehYes = document.getElementById("veh_yes")?.checked === true;
    const vehNo  = document.getElementById("veh_no")?.checked === true;
    const extracom = document.getElementById("extracomunitario")?.checked === true;

    const marca = (document.getElementById("veh_marca")?.value || "").trim();
    const modello = (document.getElementById("veh_modello")?.value || "").trim();
    const targa = (document.getElementById("veh_targa")?.value || "").trim();

    const ownerSame = document.getElementById("veh_owner_same")?.checked === true;
    const ownerOther = (document.getElementById("veh_owner_other")?.value || "").trim();

    const ritiro = document.getElementById("ritiro_patente")?.checked === true;
    const patNr = (document.getElementById("pat_nr")?.value || "").trim();
    const patRilIl = (document.getElementById("pat_ril_il")?.value || "").trim();
    const patRilDa = (document.getElementById("pat_ril_da")?.value || "").trim();

    const invitoPat = document.getElementById("invito_patente")?.checked === true;
    const verb180 = document.getElementById("verbale_180")?.checked === true;

    let veicoloParas = [];
    if(vehNo){
      veicoloParas.push(
        `In ottemperanza a quanto disposto dall'art. 75 del citato decreto, quest'organo di polizia accerta che il trasgressore, al momento del controllo, non aveva la diretta ed immediata disponibilità di veicoli.------//`
      );
    } else if(vehYes){
      const prop = ownerSame ? "di proprietà del trasgressore" : `di proprietà di ${ownerOther || "_________________________"}`;
      veicoloParas.push(
        `In ottemperanza a quanto disposto dall'art. 75 del citato decreto, quest'organo di polizia accerta che il trasgressore, al momento del controllo, aveva la diretta ed immediata disponibilità del veicolo marca ${marca || "____"} modello ${modello || "____"} targa ${targa || "____"}, ${prop}.------//`
      );
      if(ritiro){
        veicoloParas.push(
          `Si procede pertanto all'immediato ritiro della patente di guida nr. ${patNr || "____"}, rilasciata in data ${patRilIl || "____"} da ${patRilDa || "____"}, intestata al soggetto summenzionato.------//`
        );
      }
      if(invitoPat){
        veicoloParas.push(
          `Si invita il trasgressore, avendo dichiarato di non avere con sé la patente di guida, a presentare il documento mancante presso gli Uffici del Comando in intestazione per le incombenze previste dalle vigenti disposizioni di legge.------//`
        );
      }
      if(verb180){
        veicoloParas.push(
          `Circostanza perseguita anche in materia di circolazione stradale, per la quale è stato elevato separato verbale di contestazione ex art. 180 C.d.S.------//`
        );
      }
    }

    let extracomText = "";
    if(extracom){
      extracomText =
        `Trattandosi di straniero extracomunitario, maggiorenne, proveniente da uno Stato non membro dell'Unione Europea, in ottemperanza a quanto previsto dal comma 8 del citato articolo, il medesimo viene informato che la presente violazione è comunicata altresì al Questore competente per territorio, in relazione al luogo come determinato al comma 13 del medesimo testo, per le valutazioni di competenza in sede di rinnovo del permesso di soggiorno.------//`;
    }

    const fontMain = `font-family:"Times New Roman";font-size:11pt;line-height:1.1;`;
    const pJust = `text-align:justify;${fontMain}`;
    const p0 = (text, extra="") => `<p style="margin:0;${extra}">${text}</p>`;
    const pj = (text, extra="") => `<p style="margin:0;${pJust}${extra}">${text}</p>`;

    let html = "";

    html += `
      <div style="text-align:center">
        <img src="./emblem.png" style="height:1.71cm;width:1.5cm;margin:0 0 6pt 0" alt="Emblema della Repubblica Italiana">
        ${p0(legione, `font-weight:bold;font-size:16pt;${fontMain}`)}
        ${p0(comando,  `font-weight:bold;font-size:16pt;${fontMain}`)}
        ${p0(squadra,  `font-style:italic;font-size:14pt;${fontMain}`)}
      </div>
      <div style="height:5pt"></div>
    `;

    html += pj(`<b>OGGETTO:</b> ${OGGETTO_FISSO}`);

    soggetti.forEach((s, idx) => {
      const mb = (idx < soggetti.length - 1) ? "margin-bottom:3pt;" : "";
      html += `<p style="margin:4pt 0 0 0;${pJust}${mb}">• <b>${s.boldName},</b> ${s.dati}</p>`;
    });

    html += `<p style="margin:4pt 0 0 0;${pJust}">${corpoStd}</p>`;
    html += `<p style="margin:4pt 0 2pt 0;${pJust}">${introOperazione}</p>`;
    html += `<p style="margin:2pt 0 2pt 0;${pJust}font-weight:bold;">${descrList.join("<br>")}</p>`;

    const seq = buildSequestroParas(modalita);
    html += `<p style="margin:4pt 0 2pt 0;${pJust}">${seq[0]}</p>`;
    html += `<p style="margin:0;${pJust}">${seq[1]}</p>`;

    const deposito = buildDeposito(depositoPresso);
    html += `<p style="margin:4pt 0 0 0;${pJust}">${deposito}</p>`;

    const haHanno = plurale ? "hanno" : "ha";
    const loroSuoi = plurale ? "loro" : "suoi";
    const sentitaSentite = plurale ? "sentite" : "sentita";
    html += `<p style="margin:4pt 0 2pt 0;${pJust}">${resoE}</p>`;
    html += `<p style="margin:0 0 2pt 0;${pJust}">➢ sarà instaurato nei ${loroSuoi} confronti, dal Prefetto della Provincia di residenza, un procedimento amministrativo che comporterà l’irrogazione di una delle sanzioni previste dall’art. 75, comma 1, del D.P.R. 309/90;------//</p>`;
    html += `<p style="margin:0 0 2pt 0;${pJust}">➢ ${haHanno} l’obbligo di aderire alle successive richieste del Prefetto, concernenti la presentazione al colloquio di cui al comma 6 del medesimo articolo, dinanzi allo stesso Prefetto o a persona da lui delegata, al fine di discutere il programma di trattamento o comunque le ragioni della violazione, per individuare e prevenirne ulteriori violazioni;------//</p>`;
    html += `<p style="margin:0 0 2pt 0;${pJust}">➢ ${haHanno} la possibilità, ai sensi del combinato disposto degli artt. 18, comma 1, L. 24.11.1981 nr. 689 e 75, comma 4, D.P.R. 309/90, di far pervenire entro 30 giorni dalla contestazione, all’Autorità Prefettizia, scritti difensivi e/o documenti;------//</p>`;
    html += `<p style="margin:0 0 3pt 0;${pJust}">➢ ${haHanno} la facoltà di chiedere di essere ${sentitaSentite} dalla suddetta Autorità, che provvederà alla relativa convocazione.------//</p>`;

    if(veicoloParas.length){
      veicoloParas.forEach((t, i)=>{
        html += `<p style="margin:${i===0?"4pt":"0"} 0 0 0;${pJust}">${t}</p>`;
      });
    }

    if(extracomText){
      html += `<p style="margin:4pt 0 0 0;${pJust}">${extracomText}</p>`;
    }

    let raw = dichiarazioni.replaceAll("\n","<br>").trim();
    let suffix = "";
    if (raw.includes("-------//")) {
      raw = raw.replaceAll("-------//", "").trim();
      suffix = "-------//";
    }
    if(raw){
      const rawCap = raw.charAt(0).toUpperCase() + raw.slice(1);
      html += `<p style="margin:4pt 0 0 0;${pJust}">La parte, invitata a dichiarare quanto di sua spontanea volontà, dichiara: <span style="font-weight:bold">"${rawCap}"</span>${suffix ? " " + suffix : ""}</p>`;
    }

    if(noteExtra){
      html += `<p style="margin:4pt 0 0 0;${pJust}">${noteExtra.replaceAll("\n","<br>")}</p>`;
    }

    html += `
      <p style="margin:4pt 0 0 0;${pJust}">
        Il presente verbale e gli eventuali documenti ritirati saranno trasmessi, a cura dell’Arma Territoriale, alla Prefettura-U.T.G. competente entro i termini di legge.------//<br>
        Fatto, letto, confermato e sottoscritto in data e luogo di cui sopra.------//
      </p>
    `;

    html += `
      <div style="margin-top:8pt;${fontMain}font-size:11pt">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="width:50%;text-align:center;padding-top:8pt">
              <b>Trasgressore</b><br><br>
              ________________________________
            </td>
            <td style="width:50%;text-align:center;padding-top:8pt">
              <b>Verbalizzanti</b><br><br>
              ________________________________
            </td>
          </tr>
        </table>
      </div>
    `;

    return html;
}


/* ==========================================================================
   2. GENERATORE VERBALE ART. 161 C.P.P. (ELEZIONE DI DOMICILIO)
   ========================================================================== */
function generaVerbale161(){
  const legione = $("legione").value || "______________________";
  const comando = $("comando").value || "______________________";
  const squadra = $("squadra").value || "______________________";

  const s1 = getSoggetto("s1");
  
  const dataVerbale = (document.getElementById("dataVerbale")?.value || "___/___/_____").trim();
  const oraVerbale  = (document.getElementById("oraVerbale")?.value || "__:__").trim();
  const luogoVerbale = getLuogoVerbaleText();
  const operanti = getOperantiList();

  const reato = (document.getElementById("v161_reato")?.value || "________________________________________________").trim();
  const luogoReato = (document.getElementById("v161_luogo_reato")?.value || "________________________________________________").trim();
  
  const isFiducia = document.getElementById("v161_difesa_fiducia")?.checked === true;
  const isUfficio = document.getElementById("v161_difesa_ufficio")?.checked === true;
  
  const avvNome = (document.getElementById("v161_avv_nome")?.value || "_____________________________").trim();
  const avvForo = (document.getElementById("v161_avv_foro")?.value || "________________").trim();
  const avvStudio = (document.getElementById("v161_avv_studio")?.value || "_______________________________________").trim();
  const avvTel = (document.getElementById("v161_avv_tel")?.value || "_________________").trim();
  const avvPec = (document.getElementById("v161_avv_pec")?.value || "__________________________________________").trim();

  const domTipo = document.getElementById("v161_dom_tipo")?.value || "dichiara";
  const domInd = (document.getElementById("v161_dom_indirizzo")?.value || "________________________________________________").trim();
  
  const accettaUfficioSi = document.getElementById("v161_accetta_si")?.checked === true;
  const accettaUfficioNo = document.getElementById("v161_accetta_no")?.checked === true;

  const dom2Tipo = document.getElementById("v161_dom2_tipo")?.value || "dichiara";
  const dom2Ind = (document.getElementById("v161_dom2_indirizzo")?.value || "________________________________________________").trim();

  const isRdc = document.getElementById("v161_rdc_si")?.checked === true;

  const tribCitta = (document.getElementById("v161_trib_citta")?.value || "________________").trim();
  const tribIndirizzo = (document.getElementById("v161_trib_indirizzo")?.value || "__________________________________").trim();

  const fontMain = `font-family:"Times New Roman";font-size:11pt;line-height:1.1;`;
  const pJust = `text-align:justify;${fontMain}`;
  const ck = (cond) => cond ? "&#9746;" : "&#9744;"; 
  const b0 = (text, extra="") => `<div style="margin:0;${extra}">${text}</div>`;

  let html = "";

  html += `
    <div style="text-align:center">
      <img src="./emblem.png" style="height:1.71cm;width:1.5cm;margin:0 0 6pt 0" alt="Emblema della Repubblica Italiana">
      ${b0(legione, `font-weight:bold;font-size:14pt;${fontMain}`)}
      ${b0(comando,  `font-weight:bold;font-size:14pt;${fontMain}`)}
      ${b0(squadra,  `font-size:11pt;${fontMain}`)}
    </div>
    <div style="height:10pt"></div>
  `;

  html += `
    <div style="text-align:justify;font-weight:bold;font-size:11pt;${fontMain}border-bottom:1px solid #000;border-top:1px solid #000;padding:4pt 0;margin-bottom:8pt;">
      INFORMATIVA AI FINI DELLA CONOSCENZA DEL PROCEDIMENTO E VERBALE DI IDENTIFICAZIONE E DICHIARAZIONE O ELEZIONE DI DOMICILIO AI SENSI DEGLI ARTT. 349, 161 e 162 C.P.P. NONCHÈ INFORMAZIONE SUL DIRITTO DI DIFESA AI SENSI DEGLI ARTT. 369 E 369 BIS C.P.P.
    </div>
  `;

  html += `<div style="${pJust}margin-bottom:6pt;">Il giorno ${dataVerbale}, alle ore ${oraVerbale}, in ${luogoVerbale}, avanti al sottoscritto Agente/Ufficiale di P.G. ${operanti}, effettivo al Comando in intestazione, è presente:</div>`;
  html += `<div style="${pJust}margin-bottom:6pt;font-weight:bold;">${s1.boldName}, ${s1.dati}</div>`;

  html += `<div style="${pJust}margin-bottom:6pt;">Previo ammonimento delle conseguenze cui si espone chi rifiuta e rende dichiarazioni false, la persona viene invitata a dichiarare le proprie generalità, il recapito della casa di abitazione, il luogo in cui esercita abitualmente l’attività lavorativa e i luoghi in cui ha temporanea dimora o domicilio, oltre che ad indicare i recapiti telefonici o gli indirizzi di posta elettronica nella sua disponibilità; dichiara quanto segue:</div>`;
  html += `<div style="${pJust}margin-bottom:6pt;"><i>"Confermo le generalità sopra riportate."</i></div>`;

  html += `<div style="${pJust}margin-bottom:6pt;">La persona presente viene quindi avvertita che sono in corso indagini preliminari nei suoi confronti in ordine al seguente reato: <b>${reato}</b>, commesso in: <b>${luogoReato}</b>.</div>`;

  html += `<div style="${pJust}margin-bottom:6pt;">La persona sottoposta ad indagini viene quindi avvisata:
    <ul style="margin:2pt 0;padding-left:20pt;">
      <li>che le successive notificazioni, diverse da quelle riguardanti l’avviso di fissazione dell’udienza preliminare, la citazione in giudizio ai sensi degli articoli 450, comma 2, 456, 552 e 601 cpp e il decreto penale di condanna, saranno effettuate mediante consegna al difensore di fiducia o a quello nominato d’ufficio;</li>
      <li>che è suo onere indicare al difensore ogni recapito, anche telefonico, o indirizzo di posta elettronica o altro servizio elettronico di recapito certificato qualificato, nella loro disponibilità, ove il difensore possa effettuare le comunicazioni, nonché informarlo di ogni loro successivo mutamento;</li>
      <li>che, nella sua qualità di persona sottoposta alle indagini o di imputato, ha l'obbligo di comunicare ogni mutamento del domicilio dichiarato o eletto e che in mancanza di tale comunicazione o nel caso di rifiuto di dichiarare o eleggere domicilio, nonché nel caso in cui il domicilio sia o divenga inidoneo le notificazioni degli atti indicati verranno eseguite mediante consegna al difensore, già nominato o che è contestualmente nominato, anche d’ufficio.</li>
    </ul>
  </div>`;

  html += `<div style="${pJust}margin-bottom:6pt;">Invitato ad esercitare la facoltà di nominare un difensore di fiducia, la persona sottoposta alle indagini dichiara:</div>`;
  
  html += `<div style="${pJust}margin-bottom:2pt;">${ck(isFiducia)} nomino difensore l'Avv. <b>${isFiducia ? avvNome : "________________________"}</b> del Foro di <b>${isFiducia ? avvForo : "____________"}</b> con studio in <b>${isFiducia ? avvStudio : "________________________"}</b> tel. <b>${isFiducia ? avvTel : "_____________"}</b> PEC: <b>${isFiducia ? avvPec : "________________________"}</b>.</div>`;
  html += `<div style="${pJust}margin-bottom:6pt;">${ck(isUfficio)} non sono in grado di nominare un difensore di fiducia.</div>`;

  if(isUfficio) {
    html += `<div style="${pJust}margin-bottom:6pt;">Stante la mancata nomina del difensore di fiducia, si provvede, tramite sito internet "www.centronominedifese.it”: è nominato il difensore d’ufficio l’avv. <b>${avvNome}</b> del Foro di <b>${avvForo}</b>, con studio in <b>${avvStudio}</b> cell. <b>${avvTel}</b> PEC: <b>${avvPec}</b>.</div>`;
  }

  html += `<div style="${pJust}margin-bottom:6pt;">Invitato a dichiarare uno dei luoghi indicati nell'articolo 157, comma 1, o un indirizzo di posta elettronica certificata o altro servizio elettronico di recapito certificato qualificato, ovvero ad eleggere domicilio per le notificazioni riguardante i seguenti atti:
  <ul style="margin:2pt 0;padding-left:20pt;">
    <li>avviso di fissazione dell’udienza preliminare;</li>
    <li>atti di citazione in giudizio ai sensi degli articoli 450, comma 2, 456, 552 e 601;</li>
    <li>decreto penale di condanna,</li>
  </ul>
  avvisandolo che ha l'obbligo di comunicare ogni mutamento del domicilio dichiarato o eletto e che in mancanza di tale comunicazione o nel caso di rifiuto di dichiarare o eleggere domicilio, nonché nel caso in cui il domicilio sia o divenga inidoneo, le notificazioni degli atti indicati verranno eseguite mediante consegna al difensore, già nominato o che è contestualmente nominato, anche d’ufficio, l’indagato dichiara:</div>`;

  html += `<div style="${pJust}">
    ${ck(domTipo==="dichiara")} “dichiaro domicilio presso: <b>${domTipo==="dichiara" ? domInd : "_____________________________________________________"}</b>”<br>
    ${ck(domTipo==="elegge")} “eleggo domicilio presso: <b>${domTipo==="elegge" ? domInd : "_______________________________________________________"}</b>”<br>
    ${ck(domTipo==="non_grado")} “non sono in grado di dichiarare/eleggere domicilio”<br>
    ${ck(domTipo==="rifiuta")} “mi rifiuto di dichiarare/eleggere domicilio”
  </div>`;

  if(isUfficio && domTipo==="elegge") {
    html += `<div style="${pJust}margin-top:6pt;">Nel caso in cui l’indagato abbia eletto domicilio presso il difensore di ufficio di cui sopra (art.162 comma 4 bis c.p.p. e 164 c.p.p.): qui presente/contattato, il difensore d’ufficio ha dichiarato di:<br>
    ${ck(accettaUfficioSi)} ACCETTARE<br>
    ${ck(accettaUfficioNo)} non accettare<br>
    la domiciliazione dell’indagato presso il proprio studio legale.</div>`;

    if(accettaUfficioNo) {
      html += `<div style="${pJust}margin-top:6pt;">Nel caso in cui il difensore di ufficio non abbia accettato la domiciliazione: La persona sottoposta ad indagini viene espressamente avvertita del fatto che il difensore non ha accettato la domiciliazione per cui viene invitato a dichiarare uno dei luoghi indicati dall’art. 157 comma 1 c.p.p. (luogo di abitazione o di esercizio abituale dell’attività lavorativa) ovvero a eleggere domicilio per le notificazioni di cui all’art. 164 c.p.p., avvertendola che, nella sua qualità di persona sottoposta alle indagini, ha l’obbligo di comunicare ogni mutamento del domicilio dichiarato o eletto e che, in mancanza di tale comunicazione o nel caso di rifiuto di dichiarare il domicilio ovvero in caso di mancanza o di impossibilità/inidoneità del domicilio dichiarato, le notificazioni verranno eseguite mediante consegna al difensore ex art. 161 comma 4 c.p.p.<br>
      In proposito, l’indagato risponde:<br>
      ${ck(dom2Tipo==="dichiara")} dichiaro domicilio <b>${dom2Tipo==="dichiara" ? dom2Ind : "______________________________________________"}</b><br>
      ${ck(dom2Tipo==="elegge")} eleggo domicilio <b>${dom2Tipo==="elegge" ? dom2Ind : "______________________________________________"}</b><br>
      ${ck(dom2Tipo==="non_grado")} non sono in grado di dichiarare/eleggere domicilio.<br>
      ${ck(dom2Tipo==="rifiuta")} mi rifiuto di dichiarare/eleggere domicilio.</div>`;
    }
  }

  html += `<div style="${pJust}margin-top:6pt;">Nel caso in cui il difensore abbia accettato la domiciliazione: La persona sottoposta ad indagini viene espressamente avvertita del fatto che il difensore ha accettato la domiciliazione e viene altresì informato che tutte le successive comunicazioni relative al procedimento ex art.164 c.p.p. (avviso fissazione udienza preliminare, degli atti di citazione a giudizio ai sensi degli artt.450 comma 2, 456. 552 e 601, del decreto penale di condanna) verranno effettuate nel luogo e presso la persona sopra indicata e che, ai fini della conoscenza dell’ulteriore corso del procedimento e dell’eventuale successivo processo, sarà suo onere acquisire periodicamente informazioni presso il domiciliatario.</div>`;

  html += `<div style="${pJust}margin-top:6pt;">Invitato a dichiarare se gode del beneficio del reddito di cittadinanza o equivalenti (Assegno di Inclusione), con la precisazione che è beneficiario non solo chi lo abbia richiesto per il nucleo familiare, ma anche uno dei componenti di quest’ultimo che, in tal modo, se ne giovi, dichiara:<br>
  ${ck(!isRdc)} non sono beneficiario.<br>
  ${ck(isRdc)} sono beneficiario.</div>`;

  html += `<div style="${pJust}margin-top:6pt;">La persona presente sottoposta ad indagini viene quindi <b>AVVISATA</b> che:
  <ul style="margin:2pt 0;padding-left:20pt;">
    <li>la difesa tecnica nel processo penale è obbligatoria; che ciascun soggetto sottoposto ad indagini, ha diritto di nominare non più di due difensori di sua fiducia, la nomina dei quali è fatta con dichiarazione resa all’ Autorità procedente, ovvero consegnata alla stessa da difensore o trasmessa con raccomandata;</li>
    <li>al difensore competono le facoltà e i diritti che la legge riconosce all’ indagato a meno che essi siano riservati personalmente a quest’ ultimo e che l’indagato ha las facoltà ed i diritti attribuiti dalla legge, tra cui, in particolare:
      <ul style="margin:2pt 0;padding-left:20pt;list-style-type:circle;">
        <li>Diritto di presentare memorie, istanze, richieste ed impugnazioni;</li>
        <li>Diritto ad ottenere l’assistenza di un interprete se straniero;</li>
        <li>Diritto a conferire con il difensore, anche se detenuto;</li>
        <li>Diritto di ricevere avvisi e notificazioni;</li>
        <li>Diritto di togliere effettualità con espressa dichiarazione contraria all’atto compiuto dal difensore prima che sia intervenuto un provvedimento del giudice;</li>
        <li>Diritto di richiedere a proprie spese copia degli atti depositati;</li>
        <li>Facoltà di presentare istanza di patteggiamento e di MAP nei casi consentiti dalla legge;</li>
        <li>Facoltà di rendere dichiarazioni alla Polizia Giudiziaria ed al Pubblico Ministero;</li>
        <li>Facoltà di non rispondere all’ interrogatorio ovvero di presentarsi spontaneamente al Pubblico Ministero per rendere dichiarazioni;</li>
        <li>Facoltà di presentare istanza di oblazione nei casi in cui è consentito dalla legge;</li>
        <li>Facoltà di avere notizie sulle iscrizioni a suo carico;</li>
        <li>Facoltà di accedere ai programmi di giustizia riparativa;</li>
      </ul>
    </li>
    <li>vi è l’obbligo di retribuzione del difensore nominato d’ Ufficio ove non sussistano le condizioni per accedere al patrocinio a spese dello Stato di cui al punto successivo, e che in caso di insolvenza si procederà ad esecuzione forzata;</li>
    <li>ai sensi e per gli effetti di cui alla L. n. 217 del 30/07/1990, potrà essere richiesta l’ammissione al patrocinio a spese dello Stato qualora ricorrano le condizioni previste dalla citata legge;</li>
  </ul>
  Informa la persona sottoposta alle indagini che, qualora si trovi nelle condizioni reddituali di cui agli artt. 74 e seguenti del D.Lgs 113/02 ha facoltà di presentare domanda di ammissione al patrocinio a spese dello Stato, e godere quindi gratuitamente della assistenza di un difensore scelto fra gli iscritti negli appositi elenchi.</div>`;

  html += `<div style="${pJust}margin-top:6pt;">La persona sottoposta a indagini prende atto che:
  <ul style="margin:2pt 0;padding-left:20pt;">
    <li>in relazione ai suoi comportamenti sarà aperto un processo penale;</li>
    <li>tale processo si svilupperà in più udienze, le quali avranno luogo presso il <b>Tribunale di ${tribCitta}</b>, sito in <b>${tribIndirizzo}</b>;</li>
    <li>è possibile conoscere l’andamento del processo e le date di celebrazione delle udienze mantenendo i contatti con il proprio difensore, anche d’ufficio, nonché chiedendo informazioni agli appositi uffici e cancellerie.</li>
  </ul>
  </div>`;

  html += `<div style="${pJust}margin-top:6pt;">Fatto, letto, confermato e sottoscritto, in data e luogo di cui sopra. Copia del presente atto viene rilasciata all’ indagato per i soli usi consentiti dalla legge.</div>`;

  html += `
    <div style="margin-top:12pt;${fontMain}font-size:11pt">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="width:50%;text-align:center;padding-top:8pt">
            <b>La Parte</b><br><br><br>
            ________________________________
          </td>
          <td style="width:50%;text-align:center;padding-top:8pt">
            <b>I Verbalizzanti</b><br><br><br>
            ________________________________
          </td>
        </tr>
      </table>
    </div>
  `;

  return html;
}


/* ==========================================================================
   3. GENERATORE VERBALE DI PERQUISIZIONE
   ========================================================================== */
function generaPerquisizione(){
  const legione = $("legione").value || "______________________";
  const comando = $("comando").value || "______________________";
  const squadra = $("squadra").value || "______________________";

  const F = (getSesso("s1") === "F");
  const s1 = getSoggetto("s1");

  const stessoa   = F ? "la stessa" : "lo stesso";
  const Nominato  = F ? "La nominata" : "Il nominato";
  const avvertito = F ? "avvertita" : "avvertito";

  const dataVerbale = (document.getElementById("dataVerbale")?.value || "___/___/_____").trim();
  const oraStesura = (document.getElementById("perq_info_ora")?.value || "").trim() || "______";
  const luogo = (document.getElementById("perq_info_luogo")?.value || "").trim() || "______________________";
  const operanti = getOperantiList();

  const tipoPers = document.getElementById("perq_tipo_pers")?.checked === true;
  const tipoVeic = document.getElementById("perq_tipo_veic")?.checked === true;

  const perqVeicAuto = document.getElementById("perq_veic_auto")?.checked === true;
  const perqVeicMarca  = perqVeicAuto
    ? (document.getElementById("veh_marca")?.value  || "").trim()
    : (document.getElementById("perq_veic_marca")?.value  || "").trim();
  const perqVeicModello = perqVeicAuto
    ? (document.getElementById("veh_modello")?.value || "").trim()
    : (document.getElementById("perq_veic_modello")?.value || "").trim();
  const perqVeicTarga  = perqVeicAuto
    ? (document.getElementById("veh_targa")?.value   || "").trim()
    : (document.getElementById("perq_veic_targa")?.value   || "").trim();

  let tipoLow;
  if(tipoPers && tipoVeic) tipoLow = "personale e veicolare";
  else if(tipoVeic) tipoLow = "veicolare";
  else tipoLow = "personale";

  const base = document.getElementById("perq_base")?.value;
  const comma = tipoPers ? "3" : "2";
  const baseTxt = (base === "art4")
    ? "art. 4 della Legge 22.05.1975 nr. 152"
    : (base === "art103" ? `art. 103, comma ${comma}, del D.P.R. 09.10.1990 nr. 309` : "__________________________________________");

  const motivi = [];
  if(document.getElementById("perq_m1")?.checked) motivi.push("veniva sorpreso senza apparente motivo e/o in circostanze equivoche");
  if(document.getElementById("perq_m2")?.checked) motivi.push("si mostrava insofferente all'identificazione e schivo al controllo di polizia");
  if(document.getElementById("perq_m3")?.checked) motivi.push("consegnava spontaneamente sostanza verosimilmente stupefacente, rendendo opportuno un controllo più approfondito");
  if(document.getElementById("perq_m4")?.checked) motivi.push("risultava gravato da precedenti di polizia o di giustizia");

  const circostanze = (document.getElementById("perq_circostanze")?.value || "").trim();

  const difSi = document.getElementById("perq_dif_si")?.checked === true;
  const difNome = (document.getElementById("perq_dif_nome")?.value || "________________________").trim();

  const oraInizio = (document.getElementById("perq_ora_inizio")?.value || "______").trim();
  const oraFine = (document.getElementById("perq_ora_fine")?.value || "______").trim();

  const modalita = $("modalita").value;
  const esAuto = document.getElementById("perq_esito_auto")?.checked === true;
  const esPos = document.getElementById("perq_esito_pos")?.checked === true;
  const positivo = esAuto ? (modalita !== "consegna spontanea") : esPos;

  const dove = (document.getElementById("perq_dove")?.value || "").trim();
  const sost = getSostanzeArray();

  const sostScelte = sost.filter((s, i) => {
    const cb = document.getElementById("perq_sost_" + i);
    return cb ? cb.checked : true;
  });
  const sostScelteTxt = (sostScelte.length ? sostScelte : [{peso:"______", tipo:"________"}])
    .map(s => `grammi ${s.peso || "____"} di sostanza verosimilmente stupefacente del tipo ${s.tipo.toUpperCase()}`)
    .join("; ");

  const dich = (document.getElementById("perq_dich")?.value || "").trim() || "Nulla da dichiarare.";

  const linguaNo = document.getElementById("perq_lingua_no")?.checked === true;
  const interprete = (document.getElementById("perq_interprete")?.value || "________________________").trim();
  const linguaParlata = (document.getElementById("perq_lingua_parlata")?.value || "____________").trim();

  const eseguitaDa = (document.getElementById("perq_eseguita_da")?.value || "").trim();

  const fontMain = `font-family:"Times New Roman";font-size:11pt;line-height:1.1;`;
  const pJust = `text-align:justify;${fontMain}`;

  let html = "";

  html += `
    <div style="text-align:center">
      <img src="./emblem.png" style="height:1.71cm;width:1.5cm;margin:0 0 6pt 0" alt="Emblema della Repubblica Italiana">
      <p style="margin:0;font-weight:bold;font-size:16pt;${fontMain}">${legione}</p>
      <p style="margin:0;font-weight:bold;font-size:16pt;${fontMain}">${comando}</p>
      <p style="margin:0;font-style:italic;font-size:14pt;${fontMain}">${squadra}</p>
    </div>
    <div style="height:5pt"></div>
  `;

  html += `<p style="margin:0;${pJust}"><b>OGGETTO:</b> Verbale di perquisizione ${tipoLow} eseguita d'iniziativa della Polizia Giudiziaria ai sensi dell'${baseTxt}, operata a carico di:</p>`;
  html += `<p style="margin:4pt 0 0 0;${pJust}">• <b>${s1.boldName},</b> ${s1.dati}</p>`;
  if(tipoVeic){
    const desc = [perqVeicMarca, perqVeicModello].filter(Boolean).join(" ");
    html += `<p style="margin:2pt 0 0 0;${pJust}">A bordo della vettura${desc ? " " + desc : ""} targa ${perqVeicTarga || "____"}.</p>`;
  }

  html += `<p style="margin:4pt 0 0 0;${pJust}">In data ${dataVerbale}, alle ore ${oraStesura}, ${luogo}, i sottoscritti Ufficiali e/o Agenti di Polizia Giudiziaria ${operanti}, in forza al Comando in intestazione, danno atto di quanto segue.</p>`;

  html += `<p style="margin:4pt 0 0 0;${pJust}">Sussistendo il fondato motivo di ritenere che ${F ? "la nominata" : "il nominato"} potesse detenere e occultare sulla propria persona sostanze stupefacenti, e ricorrendo ragioni di urgenza che non consentivano di richiedere il tempestivo intervento dell'Autorità Giudiziaria, si è proceduto a perquisizione ${tipoLow}${motivi.length ? `, in considerazione del fatto che ${stessoa}:` : "."}</p>`;

  if(motivi.length){
    motivi.forEach((m, i) => {
      const fine = (i === motivi.length - 1) ? "." : ";";
      html += `<p style="margin:0 0 2pt 0;${pJust}">➢ ${m}${fine}</p>`;
    });
  }

  if(circostanze){
    html += `<p style="margin:4pt 0 0 0;${pJust}"><b>Circostanze del controllo:</b> ${ensureDotEnd(circostanze.replaceAll("\n","<br>"))}</p>`;
  }

  html += `<p style="margin:4pt 0 0 0;${pJust}">${Nominato}, preliminarmente ${avvertito} della facoltà di farsi assistere da un difensore di fiducia o da persona idonea a testimoniare, purché prontamente reperibile, dichiara ${difSi ? `di avvalersi di tale facoltà, nominando l'Avv./Sig. ${difNome}` : "di non avvalersi di tale facoltà"}.</p>`;

  let esitoTxt;
  if(positivo){
    esitoTxt = `ha dato esito <b>POSITIVO</b>: venivano rinvenuti ${sostScelteTxt}${dove ? `, occultati ${dove}` : ""}. La sostanza rinvenuta è stata sottoposta a sequestro amministrativo con contestuale atto di contestazione ex art. 75 D.P.R. 309/90, redatto in pari data.------//`;
  } else {
    esitoTxt = `ha dato esito <b>NEGATIVO</b>, non essendo rinvenuto null'altro oltre alla sostanza che ${stessoa} aveva spontaneamente consegnato, già sottoposta a sequestro amministrativo con atto di contestazione ex art. 75 D.P.R. 309/90, redatto in pari data.------//`;
  }
  html += `<p style="margin:4pt 0 0 0;${pJust}">La perquisizione ${tipoLow}, iniziata alle ore ${oraInizio} e conclusa alle successive ore ${oraFine}, ${esitoTxt}</p>`;

  html += `<p style="margin:4pt 0 0 0;${pJust}">Si dà atto che la perquisizione è stata eseguita nel rispetto della dignità e del pudore della persona e che non è stato arrecato alcun danno a cose.</p>`;

  if(F && eseguitaDa){
    html += `<p style="margin:4pt 0 0 0;${pJust}">La perquisizione, trattandosi di persona di sesso femminile, è stata materialmente eseguita da ${eseguitaDa}.</p>`;
  }

  html += `<p style="margin:4pt 0 0 0;${pJust}">${Nominato}, invitat${F ? "a" : "o"} a dichiarare quanto di sua spontanea volontà, dichiara: <span style="font-weight:bold">"${dich.replaceAll("\n","<br>")}"</span></p>`;

  if(linguaNo){
    html += `<p style="margin:4pt 0 0 0;${pJust}">Si dà atto che ${stessoa} dichiara di non comprendere la lingua italiana; alla redazione e lettura del presente atto era pertanto presente ${interprete}, che dimostra di comprendere l'italiano e la lingua ${linguaParlata} parlata dall'interessato.</p>`;
  } else {
    html += `<p style="margin:4pt 0 0 0;${pJust}">Si dà atto che ${stessoa} dichiara di comprendere la lingua italiana, parlata e scritta.</p>`;
  }

  html += `<p style="margin:4pt 0 0 0;${pJust}">Il presente verbale, previa lettura, viene sottoscritto dalla Polizia Giudiziaria operante e da tutte le persone intervenute (art. 137 c.p.p.) e ne viene rilasciata copia all'interessato. Copia del presente atto sarà trasmessa all'Autorità Giudiziaria competente per la prescritta convalida.------//<br>Fatto, letto, confermato e sottoscritto.------//</p>`;

  const colWidth = linguaNo ? "33%" : "50%";
  let firme = `<td style="width:${colWidth};text-align:center;padding-top:8pt"><b>La Parte</b><br><br>______________________</td>`;
  if(linguaNo){
    firme += `<td style="width:${colWidth};text-align:center;padding-top:8pt"><b>L'Interprete</b><br><br>______________________</td>`;
  }
  firme += `<td style="width:${colWidth};text-align:center;padding-top:8pt"><b>I Verbalizzanti</b><br><br>______________________</td>`;
  html += `
    <div style="margin-top:8pt;${fontMain}font-size:11pt">
      <table style="width:100%;border-collapse:collapse"><tr>${firme}</tr></table>
    </div>
  `;

  return html;
}


/* ==========================================================================
   4. GENERATORE VERBALE DI NARCOTEST
   ========================================================================== */
function generaNarcotest(){
  const legione = $("legione").value || "______________________";
  const comando = $("comando").value || "______________________";
  const squadra = $("squadra").value || "______________________";

  const plurale = document.getElementById("s2_enable")?.checked === true;
  const F = (getSesso("s1") === "F");
  const s1 = getSoggetto("s1");
  const soggetti = [s1];
  if(plurale) soggetti.push(getSoggetto("s2"));

  const dataVerbale = (document.getElementById("dataVerbale")?.value || "___/___/_____").trim();
  const oraStesura  = (document.getElementById("narco_info_ora")?.value  || "______").trim();
  const luogo       = (document.getElementById("narco_info_luogo")?.value || "______________________").trim();
  const operanti    = getOperantiList();
  const oraInterv   = getOraIntervento();
  const depositoPresso = $("depositoPresso").value || "_____________________";

  const sost = getSostanzeArray();
  const campioni = Array.from(document.querySelectorAll("#narco_campioni_box > div")).map((el, i) => ({
    tipo: sost[i]?.tipo || "",
    peso: sost[i]?.peso || "",
    kit:  el.querySelector(".narco-kit")?.value.trim() || "______"
  }));
  if(!campioni.length) campioni.push({tipo:"______", peso:"______", kit:"______"});

  const esitoPOS    = document.getElementById("narco_esito_neg")?.checked !== true;
  const coloreEsito = (document.getElementById("narco_colore_esito")?.value || "").trim() || "______";

  const fontMain = `font-family:"Times New Roman";font-size:11pt;line-height:1.1;`;
  const pJust    = `text-align:justify;${fontMain}`;
  const p0 = (text, extra="") => `<p style="margin:0;${extra}">${text}</p>`;

  let html = "";

  html += `
    <div style="text-align:center">
      <img src="./emblem.png" style="height:1.71cm;width:1.5cm;margin:0 0 6pt 0" alt="Emblema della Repubblica Italiana">
      ${p0(legione, `font-weight:bold;font-size:16pt;${fontMain}`)}
      ${p0(comando, `font-weight:bold;font-size:16pt;${fontMain}`)}
      ${p0(squadra, `font-style:italic;font-size:14pt;${fontMain}`)}
    </div>
    <div style="height:5pt"></div>
  `;

  html += `<p style="margin:0;${pJust}"><b>OGGETTO:</b> Verbale di accertamento tecnico speditivo con NARCOTEST effettuato su sostanza stupefacente sequestrata a:</p>`;
  soggetti.forEach((s, idx) => {
    const mb = idx < soggetti.length - 1 ? "margin-bottom:3pt;" : "";
    html += `<p style="margin:4pt 0 0 0;${pJust}${mb}">• <b>${s.boldName},</b> ${s.dati}</p>`;
  });

  html += `<p style="margin:4pt 0 0 0;${pJust}">In data ${dataVerbale}, alle ore ${oraStesura}, ${luogo}, i sottoscritti Ufficiali e/o Agenti di Polizia Giudiziaria ${operanti}, in forza al Comando in intestazione, danno atto di quanto segue.------//</p>`;
  const nominat = plurale ? "i nominati in oggetto" : (F ? "della nominata in oggetto" : "del nominato in oggetto");
  html += `<p style="margin:4pt 0 0 0;${pJust}">Riferiamo che in data ${dataVerbale}, alle precedenti ore ${oraInterv}, a seguito del sequestro a carico ${nominat} di sostanza verosimilmente stupefacente, si è proceduto ad effettuare l'accertamento tecnico speditivo con NARCOTEST con le modalità e gli esiti di seguito indicati.------//</p>`;

  const reagentDesc = (tipo) => {
    const t = (tipo || "").toLowerCase();
    if(t === "marijuana" || t === "hashish") return "idoneo alla ricerca di cannabinoidi (THC)";
    if(t === "cocaina")  return "idoneo alla ricerca di cocaina (benzoilecgonina)";
    if(t === "eroina")   return "idoneo alla ricerca di oppiacei (morfina/eroina)";
    if(t.includes("mdma") || t.includes("ecstasy") || t.includes("amfetamin")) return "idoneo alla ricerca di amfetamine/MDMA";
    if(t === "ketamina") return "idoneo alla ricerca di ketamina";
    return "idoneo all'accertamento speditivo di sostanze stupefacenti";
  };

  html += `<p style="margin:4pt 0 2pt 0;${pJust}"><b>CAMPIONE/I DA ANALIZZARE:------//</b></p>`;
  campioni.forEach((c, i) => {
    const lettera = String.fromCharCode(65 + i);
    html += `<p style="margin:0 0 2pt 0;${pJust}">Campione ${lettera}): Sostanza verosimilmente stupefacente del tipo <b>${c.tipo.toUpperCase()}</b>, del peso di grammi <b>${c.peso || "____"}</b>.------//</p>`;
  });

  html += `<p style="margin:4pt 0 2pt 0;${pJust}"><b>TIPO DI NARCOTEST:------//</b></p>`;
  campioni.forEach((c, i) => {
    const lettera = String.fromCharCode(65 + i);
    html += `<p style="margin:0 0 2pt 0;${pJust}">Campione ${lettera}): Kit <b>${c.kit}</b>, ${reagentDesc(c.tipo)}.------//</p>`;
  });

  const tipiStr   = campioni.map(c => `"${c.tipo.toUpperCase()}"`).join(", ");
  const kitStr    = campioni.map(c => c.kit).join("; ");
  const sonoStat = campioni.length > 1 ? "sono stati utilizzati i reagenti" : "è stato utilizzato il reagente";
  const Tali     = campioni.length > 1 ? "Tali reagenti costituiscono" : "Tale reagente costituisce";
  html += `<p style="margin:4pt 0 2pt 0;${pJust}"><b>REAGENTE UTILIZZATO:------//</b></p>`;
  html += `<p style="margin:0;${pJust}">Per l'accertamento tecnico speditivo, trattandosi di sostanza verosimilmente stupefacente del tipo ${tipiStr}, ${sonoStat}: <b>${kitStr}</b>. ${Tali} uno strumento di analisi speditiva idoneo a rilevare la presenza di principi attivi stupefacenti, nel rispetto delle procedure standardizzate fornite dal produttore.------//</p>`;

  html += `<p style="margin:4pt 0 2pt 0;${pJust}"><b>PROCEDIMENTO:------//</b></p>`;
  if(campioni.length > 1){
    html += `<p style="margin:0;${pJust}">Per ciascun campione, prelevati i flaconi di reagente, è stato sollevato con cura il tappo e si è provveduto a rompere la fiala interna, introducendo successivamente una sufficiente quantità di sostanza sospetta, prelevata dal rispettivo campione oggetto di sequestro, mediante apposito oggetto pulito. I flaconi sono stati quindi agitati per provocare la reazione chimica del composto, secondo le modalità indicate dal produttore.------//</p>`;
  } else {
    html += `<p style="margin:0;${pJust}">Prelevato il flacone di reagente, tolto con cura il tappo, si è provveduto a rompere la fiala interna introducendo una sufficiente quantità di sostanza sospetta, prelevata dall'involucro oggetto di sequestro, mediante apposito oggetto pulito. Introdotto il campione e reinserito il tappo, il flacone è stato agitato per provocare la reazione chimica del composto, secondo le modalità indicate dal produttore.------//</p>`;
  }

  const tipiPresenti = campioni.map(c => `<b>${c.tipo.toUpperCase()}</b>`).join(" e ");
  html += `<p style="margin:4pt 0 2pt 0;${pJust}"><b>ESITO NARCOTEST:------//</b></p>`;
  if(esitoPOS){
    html += `<p style="margin:0;${pJust}">Il narcotest dava esito <b>POSITIVO</b>: la miscela ottenuta, a seguito degli intervenuti reagenti, assumeva la colorazione <b>${coloreEsito}</b>, prevista dalla tabella di riferimento del kit utilizzato, comprovando la verosimile presenza di ${tipiPresenti}.------//</p>`;
  } else {
    html += `<p style="margin:0;${pJust}">Il narcotest dava esito <b>NEGATIVO</b>: la miscela ottenuta, a seguito degli intervenuti reagenti, non assumeva alcuna colorazione indicativa della presenza di sostanze stupefacenti, secondo le tabelle di riferimento dei kit utilizzati.------//</p>`;
  }

  const provette = campioni.length > 1 ? "Le provette sono state poste" : "La provetta è stata posta";
  html += `<p style="margin:4pt 0 0 0;${pJust}">${provette} in apposito sacchetto di polietilene sigillato per la successiva alienazione, secondo le procedure di smaltimento previste.------//</p>`;

  html += `<p style="margin:4pt 0 0 0;${pJust}">La sostanza oggetto di analisi rimane depositata presso gli Uffici del ${depositoPresso} unitamente alla relativa documentazione, in attesa delle successive determinazioni dell'Autorità competente.------//</p>`;

  const allaAl = plurale ? "alle parti" : "alla parte";
  const interessata = plurale ? "interessate" : "interessata";
  html += `<p style="margin:4pt 0 0 0;${pJust}">Il presente atto viene notificato ${allaAl} ${interessata}, cui viene rilasciata copia.------//</p>`;

  html += `<p style="margin:4pt 0 0 0;${pJust}">Fatto, letto, confermato e sottoscritto in data e luogo di cui sopra.------//</p>`;
  html += `
    <div style="margin-top:8pt;${fontMain}font-size:11pt">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="width:50%;text-align:center;padding-top:8pt">
            <b>La Parte</b><br><br>
            ________________________________
          </td>
          <td style="width:50%;text-align:center;padding-top:8pt">
            <b>I Verbalizzanti</b><br><br>
            ________________________________
          </td>
        </tr>
      </table>
    </div>
  `;

  return html;
}


/* ==========================================================================
   5. GENERATORE ETICHETTA REPERTO
   ========================================================================== */
function generaEtichetta(){
  const comando  = $("comando").value.trim() || "______________________";
  const nPratica = (document.getElementById("etichetta_n_pratica")?.value  || "").trim();
  const nReg     = (document.getElementById("etichetta_n_registro")?.value || "").trim();

  const anno = (() => {
    const d = (document.getElementById("dataVerbale")?.value || "").trim();
    const m = d.match(/(\d{4})$/);
    return m ? m[1] : new Date().getFullYear().toString();
  })();

  const sost = getSostanzeArray();
  const sostDesc = sost.map(s => `grammi ${s.peso || "____"} di sostanza verosimilmente stupefacente del tipo ${s.tipo.toUpperCase()}`).join(", ");
  const s1 = getSoggetto("s1");
  const dataVerbale = (document.getElementById("dataVerbale")?.value || "").trim();
  const luogoInterv = getLuogoIntervento();

  const city = (() => {
    const m = comando.match(/Carabinieri\s+(.+)$/i);
    return m ? m[1].trim() : comando;
  })();

  const f = `font-family:"Times New Roman";`;
  const cell = `padding:1.5mm 2mm;vertical-align:top;`;

  return `
    <div style="${f}font-size:9pt;line-height:1.35;width:8cm;border:2px solid #000;padding:2mm 2.5mm;">
      <div style="text-align:center;font-weight:bold;font-size:11pt;
                  border-bottom:1px solid #000;padding-bottom:2mm;margin-bottom:2mm">
        CARABINIERI<br>
        <span style="font-weight:normal;font-size:9pt">${comando}</span>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:9pt">
        <tr>
          <td style="${cell}border-right:1px solid #000;border-bottom:1px solid #000">
            <b>N. pratica:</b><br>${nPratica || "___________"}&nbsp;/&nbsp;${anno}
          </td>
          <td style="${cell}border-bottom:1px solid #000">
            <b>N. registro:</b><br>${nReg || "___________"}
          </td>
        </tr>
        <tr>
          <td colspan="2" style="${cell}border-bottom:1px solid #000">
            <b>PRATICA:</b><br>
            Sequestro ${sostDesc} a carico di
            <b>${s1.boldName}</b>,
            in data ${dataVerbale}${luogoInterv ? ", in " + luogoInterv : ""}.
          </td>
        </tr>
        <tr>
          <td colspan="2" style="${cell}border-bottom:1px solid #000">
            <b>REPERTO:</b>&nbsp;${sostDesc}
          </td>
        </tr>
        <tr>
          <td colspan="2" style="${cell}">
            <b>POSIZIONE:</b> Locale Reperti Stazione Carabinieri di ${city}
          </td>
        </tr>
      </table>
    </div>
  `;
}