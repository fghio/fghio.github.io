  // Recupera il canvas
  var canvas = document.getElementById('grafico').getContext('2d');

  // Funzione per calcolare i valori del capitale nel tempo
  function calcolaValoriCapitale(capitaleIniziale, inflazione) {
    var valoriCapitale = [];
    for (var x = 0; x <= 10; x++) {
      valoriCapitale.push(capitaleIniziale / Math.pow(1 + inflazione, x));
    }
    return valoriCapitale;
  }

  // Funzione per ottenere il valore del capitale iniziale dall'input dell'utente
  function getCapitaleIniziale() {
    var capitale = parseFloat(document.getElementById('capitaleIniziale').value);
    // Assicurati che il valore non sia inferiore a 0
    return capitale < 0 ? 0 : capitale;
  }

  // Funzione per ottenere il valore del capitale iniziale dall'input dell'utente
  function getInflazione() {
    var inflazione = parseFloat(document.getElementById('inflazione').value) / 100;
    // Assicurati che il valore non sia inferiore a -30
    return inflazione < -0.3 ? -0.3 : inflazione;
  }

  // Funzione per aggiornare il testo con i valori iniziale e finale
  function aggiornaTesto() {
    var capitaleIniziale = getCapitaleIniziale();
    var inflazione = getInflazione();

    // Calcola il valore finale dopo 10 anni
    var valoreFinale = calcolaValoriCapitale(capitaleIniziale, inflazione)[10].toFixed(2);

    // Aggiorna il testo nel paragrafo
    document.getElementById('capitaleInizialeTesto').innerText = capitaleIniziale.toFixed(2);
    document.getElementById('valoreFinale').innerText = valoreFinale;
  }

  // Funzione per aggiornare il grafico
  function aggiornaGrafico() {
    var capitaleIniziale = getCapitaleIniziale();
    var inflazione = getInflazione();

    // Calcola i nuovi valori del capitale nel tempo
    var nuoviValoriCapitale = calcolaValoriCapitale(capitaleIniziale, inflazione);

    // Aggiorna i dati del grafico
    grafico.data.datasets[0].data = nuoviValoriCapitale;

    // Ridisegna il grafico
    grafico.update();

    // Aggiorna il testo con i valori iniziale e finale
    aggiornaTesto();
  }

  // Aggiungi un ascoltatore di eventi che rilevi i cambiamenti nell'input e richiami la funzione di aggiornamento del grafico
  document.getElementById('capitaleIniziale').addEventListener('input', aggiornaGrafico);
  document.getElementById('inflazione').addEventListener('input', aggiornaGrafico);

  // Definisci i dati iniziali del grafico
  var dati = {
    labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    datasets: [{
      label: 'Valore del capitale iniziale negli anni',
      data: calcolaValoriCapitale(getCapitaleIniziale(), getInflazione()),
      backgroundColor: 'rgba(255, 0, 0, 1)',
      borderColor: 'rgba(255, 0, 0, 1)',
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
  var grafico = new Chart(canvas, {
    type: 'line',
    data: dati,
    options: opzioni
  });

  // Inizializza il testo con i valori iniziali
  aggiornaTesto();

