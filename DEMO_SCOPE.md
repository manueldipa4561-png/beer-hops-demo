# Demo Evoluzione — €950

Questa repository rappresenta il livello **Evoluzione** di Punto Due Studio: sito più profondo + **un solo modulo avanzato** con una ragione commerciale precisa e uno scope misurabile.

## Incluso
- Sito editoriale principale + pagina Club, entro il limite massimo di 5 pagine.
- Design e contenuti più approfonditi.
- UN SOLO modulo avanzato: loyalty con QR personale, timbri digitali, vista cliente/staff e riscatto dimostrativo.
- Nessun booking avanzato, PWA, CRM, POS, multi-sede, SMS automation, pagamenti o secondo modulo avanzato.
- Due giri di revisione sullo scope concordato.

## Demo e produzione
La simulazione usa esclusivamente dati fittizi salvati nel browser. Nessuna email è richiesta. Il QR identifica una tessera locale e non sincronizza dispositivi. La vista staff è aperta e **non costituisce autenticazione**. Nessun premio è reale. Il reset elimina soltanto i dati della simulazione. Se lo storage è bloccato, la prova continua in memoria mostrando un avviso.

Questa scelta è intenzionalmente demo-only: in una produzione multi-device non si deve usare `localStorage` come fonte dati condivisa. Se il modulo reale richiede dati condivisi servono database, autorizzazioni server e autenticazione staff appropriati.

## Acceptance criteria / QA
- Aprire il profilo demo a 4 timbri.
- Aggiungere timbri fino a 6 e impedire di superare il limite.
- Riscattare il premio una sola volta per ciclo.
- Rimuovere timbri e azzerare la simulazione.
- Codice sconosciuto: stato di errore chiaro.
- Storage non disponibile: fallback in memoria e messaggio esplicito.
- Fotocamera: accesso solo dopo azione esplicita, gestione rifiuto/non supporto e stop quando la pagina viene nascosta.
- Il codice manuale resta alternativa al QR.
- Verifica dei flussi cliente/staff, stati vuoti/errori e responsive mobile.

## Prima della produzione / handover
- Definire prima il risultato commerciale del modulo e i criteri di accettazione.
- Approvazione del locale, regole loyalty e trattamento dati verificati.
- Backend soltanto se realmente necessario.
- Mai esporre service key, password o segreti nel client o su GitHub.
- Se ci sono dati condivisi: database + autorizzazioni server + autenticazione staff.
- Documentare accessi, dipendenze esterne, eventuali costi terzi, rinnovi, proprietà degli account e responsabilità operative.
- Dominio e servizi che devono appartenere al cliente restano intestati al cliente.
- Nuove funzioni oltre il modulo loyalty sono un nuovo preventivo.
