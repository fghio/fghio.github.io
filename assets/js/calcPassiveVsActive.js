// Funzione per ottenere il valore del capitale iniziale dall'input dell'utente
function getCapitaleInvestito() {
  var capitale = parseFloat(document.getElementById('capitaleInvestito').value);
  // Assicurati che il valore non sia inferiore a 0
  return capitale < 0 ? 0 : capitale;
}

// Funzione per ottenere il rendimento netto
function getRendimento() {
  var rendimento = parseFloat(document.getElementById('rendimento').value) / 100;
  return rendimento;
}

// Funzione per ottenere il costo ETF
function getETFCost() {
  var costoTERETF = parseFloat(document.getElementById('costoTERETF').value) / 100;
  return costoTERETF < 0 ? 0 : costoTERETF;
}

// Funzione per ottenere il costo consulenza
function getCostoConsulente() {
  var costoConsulente = parseFloat(document.getElementById('costoConsulente').value) / 100;
  return costoConsulente < 0 ? 0 : costoConsulente;
}

// Funzione per ottenere il costo fondo
function getCostoFondo() {
  var costoFondo = parseFloat(document.getElementById('costoFondo').value) / 100;
  return costoFondo < 0 ? 0 : costoFondo;
}

// Funzione per ottenere il costo ingresso
function getCostoIngresso() {
  var costoIngresso = parseFloat(document.getElementById('costoIngresso').value) / 100;
  return costoIngresso < 0 ? 0 : costoIngresso;
}

// Funzione per calcolare i valori del capitale nel tempo
function calcolaValoriTesto(capitale,rendimento,costoTERETF,costoConsulente,costoFondo,costoIngresso){
  var valoriFinali = [];
  valoriFinali.push(capitale*Math.pow(1 + rendimento, 10));
  valoriFinali.push(capitale*Math.pow(1 + (rendimento-costoTERETF), 10));
  valoriFinali.push(capitale*Math.pow(1 + (rendimento-costoConsulente), 10));
  valoriFinali.push(capitale*Math.pow(1 + (rendimento-costoFondo), 10));
  valoriFinali.push(capitale*(1-costoIngresso)*Math.pow(1 + (rendimento-costoFondo), 10));
  
  return valoriFinali;
}

// Funzione per aggiornare il testo con i valori iniziale e finale
function aggiornaTesto2() {
  var capitale = getCapitaleInvestito();
  var rendimento = getRendimento();
  var costoTERETF = getETFCost();
  var costoConsulente = getCostoConsulente();
  var costoFondo = getCostoFondo();
  var costoIngresso = getCostoIngresso();

  // Calcola il valore finale dopo 10 anni
  var valoriFinali = calcolaValoriTesto(capitale,rendimento,costoTERETF,costoConsulente,costoFondo,costoIngresso);

  // Aggiorna il testo nel paragrafo
  document.getElementById('guadagnoFinaleNetto').innerText = valoriFinali[0].toFixed(2);
  document.getElementById('guadagnoFinaleETF').innerText = valoriFinali[1].toFixed(2);
  document.getElementById('guadagnoFinaleConsulente').innerText = valoriFinali[2].toFixed(2);
  document.getElementById('differenzaETFConsulenza').innerText = (valoriFinali[2] - valoriFinali[1]).toFixed(2);

  document.getElementById('guadagnoFinaleFondo').innerText = valoriFinali[3].toFixed(2);
  document.getElementById('guadagnoFinaleFondoConIngresso').innerText = valoriFinali[4].toFixed(2);
  document.getElementById('differenzaFondoETF').innerText = (valoriFinali[4]-valoriFinali[1]).toFixed(2);
}





// Recupera il canvas
var canvas2 = document.getElementById('graficoPassivoVsAttivo').getContext('2d');

function calcolaValoriGrafico
(
	capitale,
	rendimento,
	costoTERETF,
	costoConsulente,
	costoFondo,
	costoIngresso
)
{
  var valoreNetto = [];
  var valoreETF = [];
  var valoreConsulente = [];
  var valoreFondo = [];
  var valoreFondoCI = [];
  
  var capitaleDecapitato = capitale * (1-costoIngresso);
  
  for (var x = 0; x <= 10; x++) {
    valoreNetto.push(capitale * Math.pow(1 + rendimento, x));
    valoreETF.push(capitale * Math.pow(1 + (rendimento - costoTERETF), x));
    valoreConsulente.push(capitale * Math.pow(1 + (rendimento - costoConsulente), x));
    valoreFondo.push(capitale * Math.pow(1 + (rendimento - costoFondo), x));
    valoreFondoCI.push(capitaleDecapitato * Math.pow(1 + (rendimento - costoFondo), x));
  }
  
  return [valoreNetto, valoreETF, valoreConsulente, valoreFondo, valoreFondoCI];
}

// Funzione per aggiornare il grafico
function aggiornaGrafico2() {
  var capitale = getCapitaleInvestito();
  var rendimento = getRendimento();
  var costoTERETF = getETFCost();
  var costoConsulente = getCostoConsulente();
  var costoFondo = getCostoFondo();
  var costoIngresso = getCostoIngresso();

  // Calcola i nuovi valori del capitale nel tempo
  var valoriGrafico = calcolaValoriGrafico(capitale,rendimento,costoTERETF,costoConsulente,costoFondo,costoIngresso);

  // Aggiorna i dati del grafico
  grafico2.data.datasets[0].data = valoriGrafico[0]; //valore netto
  grafico2.data.datasets[1].data = valoriGrafico[1]; //valore etf
  grafico2.data.datasets[2].data = valoriGrafico[2]; //valore consulente
  grafico2.data.datasets[3].data = valoriGrafico[3]; //valore fondo (no costo ingresso)
  grafico2.data.datasets[4].data = valoriGrafico[4]; //valore fondo (con costo ingresso)

  // Ridisegna il grafico
  grafico2.update();

  // Aggiorna il testo con i valori iniziale e finale
  aggiornaTesto2();
}

// Aggiungi un ascoltatore di eventi che rilevi i cambiamenti nell'input e richiami la funzione di aggiornamento del grafico
document.getElementById('capitaleInvestito').addEventListener('input', aggiornaGrafico2);
document.getElementById('rendimento').addEventListener('input', aggiornaGrafico2);
document.getElementById('costoTERETF').addEventListener('input', aggiornaGrafico2);
document.getElementById('costoConsulente').addEventListener('input', aggiornaGrafico2);
document.getElementById('costoFondo').addEventListener('input', aggiornaGrafico2);
document.getElementById('costoIngresso').addEventListener('input', aggiornaGrafico2);

// Definisci i dati iniziali del grafico
var dati = {
  labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  datasets: [{
    label: 'Investimento negli anni (no costi)',
    data: calcolaValoriGrafico(
	    getCapitaleInvestito(),
	    getRendimento(),
	    getETFCost(),
	    getCostoConsulente(),
	    getCostoFondo(),
	    getCostoIngresso()
  	)[0],
    backgroundColor: 'rgba(255, 0, 0, 1)',
    borderColor: 'rgba(255, 0, 0, 1)',
    borderWidth: 1
  },
  {
    label: 'ETF',
    data: calcolaValoriGrafico(
	    getCapitaleInvestito(),
	    getRendimento(),
	    getETFCost(),
	    getCostoConsulente(),
	    getCostoFondo(),
	    getCostoIngresso()
  	)[1],
    backgroundColor: 'rgba(0, 0, 255, 1)', //blu
    borderColor: 'rgba(0, 0, 255, 1)', //blu
    borderWidth: 1
  },
  {
    label: 'Consulenza',
    data: calcolaValoriGrafico(
	    getCapitaleInvestito(),
	    getRendimento(),
	    getETFCost(),
	    getCostoConsulente(),
	    getCostoFondo(),
	    getCostoIngresso()
  	)[2],
    backgroundColor: 'rgba(0, 150, 255, 1)', 
    borderColor: 'rgba(0, 150, 255, 1)', 
    borderWidth: 1
  },
  {
    label: 'Fondo Attivo (no costo ingresso)',
    data: calcolaValoriGrafico(
	    getCapitaleInvestito(),
	    getRendimento(),
	    getETFCost(),
	    getCostoConsulente(),
	    getCostoFondo(),
	    getCostoIngresso()
  	)[3],
    backgroundColor: 'rgba(150, 150, 255, 1)', 
    borderColor: 'rgba(150, 150, 255, 1)', 
    borderWidth: 1
  },
  {
    label: 'Fondo Attivo (con costo ingresso)',
    data: calcolaValoriGrafico(
	    getCapitaleInvestito(),
	    getRendimento(),
	    getETFCost(),
	    getCostoConsulente(),
	    getCostoFondo(),
	    getCostoIngresso()
  	)[4],
    backgroundColor: 'rgba(255, 150, 255, 1)', 
    borderColor: 'rgba(255, 150, 255, 1)', 
    borderWidth: 1
  }]
};


// Configura le opzioni del grafico
var opzioni = {
  scales: {
    y: {
      ticks: {
        beginAtZero: true
      }
    }
  }
};

// Crea il grafico
var grafico2 = new Chart(canvas2, {
  type: 'line',
  data: dati,
  options: opzioni
});

// Inizializza il testo con i valori iniziali
aggiornaTesto2();

