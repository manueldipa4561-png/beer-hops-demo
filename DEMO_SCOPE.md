# Demo Evoluzione — €950

Questa repository rappresenta il livello **Evoluzione** di Punto Due Studio: sito editoriale più profondo + **un solo modulo avanzato** con una ragione commerciale precisa e uno scope misurabile.

## Incluso
- Sito editoriale principale + pagina HOPPASS, entro il limite massimo di 5 pagine.
- Direzione visuale e contenuti più approfonditi, responsive mobile e SEO base.
- **UN SOLO modulo avanzato: HOPPASS 3D**, evoluzione della precedente loyalty demo.
- HOPPASS 3D comprende nello stesso modulo: QR personale, 6 timbri digitali, vista cliente/staff, riscatto dimostrativo e un artifact 3D WebGL che evolve in base ai timbri.
- L'artifact 3D è parte dell'interfaccia del modulo loyalty: non costituisce un secondo sistema avanzato.
- Nessun booking avanzato, PWA, CRM, POS, multi-sede, SMS automation, pagamenti o secondo modulo avanzato.
- Due giri di revisione sullo scope concordato.

## Natura della demo
- HOPPASS è una simulazione non commissionata e non rappresenta un programma fedeltà realmente attivo di Beer Hops.
- Tessere, timbri e stato demo vengono salvati solo nel browser tramite `localStorage`, con fallback in memoria quando lo storage non è disponibile.
- La vista staff è deliberatamente aperta per consentire la prova del flusso e **non** rappresenta un'autenticazione di produzione.
- Premi, nomi dei livelli e collectible sono concetti di interfaccia dimostrativi, non offerte reali del locale.
- Una versione multi-dispositivo reale richiederebbe backend, autenticazione e gestione dati separati dallo scope di questa demo.

## HOPPASS 3D — comportamento
- Il vessel è renderizzato in tempo reale con Three.js/WebGL sui dispositivi compatibili.
- Drag/touch ruota l'artifact; controlli accessibili permettono la rotazione anche senza drag.
- I livelli 00–06 permettono di esplorare visivamente la progressione senza modificare i timbri della tessera.
- Il conteggio effettivo dei timbri guida il riempimento ambrato, i collectible e l'intensità della scena.
- Sono previsti fallback statico, `prefers-reduced-motion`, DPR limitato, pausa fuori viewport e qualità mobile semplificata.

## Criteri di accettazione
- Il profilo demo `BH-DEMO01` parte da 4/6 timbri.
- Lo staff può aggiungere fino a 6 timbri, rimuoverli e riscattare una volta per ciclo.
- Codici non validi producono un messaggio chiaro.
- Fotocamera solo su azione esplicita; inserimento manuale sempre disponibile.
- Layout utilizzabile da 320 px in su senza dipendere dall'hover.
- Se WebGL non è disponibile, il programma loyalty rimane utilizzabile e mostra un visual fallback premium.
