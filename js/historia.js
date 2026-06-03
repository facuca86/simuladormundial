// ─── Historia de la Copa del Mundo ────────────────────────────────────────────

const MUNDIALES = [
  {
    año: 1930,
    sede: "Uruguay",
    img: "img/uruguay1930.jpg",
    resumen: "El primer Campeonato Mundial de Fútbol de la FIFA se celebró en Uruguay, país que había ganado el oro olímpico en 1924 y 1928. Participaron 13 selecciones invitadas directamente por la FIFA, sin ronda de clasificación. Uruguay construyó el Estadio Centenario en solo 9 meses para albergar la competición.",
    campeon: "🇺🇾 Uruguay",
    subcampeon: "🇦🇷 Argentina",
    tercero: "🇺🇸 Estados Unidos",
    final: {
      resultado: "Uruguay 4 – 2 Argentina",
      estadio: "Estadio Centenario, Montevideo",
      asistentes: "68.346",
      fecha: "30 de julio de 1930",
      hora: "15:00"
    }
  },
  {
    año: 1934,
    sede: "Italia",
    img: "img/italia1934.jpg",
    resumen: "El primer mundial con fase de clasificación previa. Italia, bajo el mando de Vittorio Pozzo, ganó en casa su primer título usando un formato de eliminación directa desde la primera ronda. Uruguay, campeón defensor, se negó a participar en protesta por la baja participación europea en 1930.",
    campeon: "🇮🇹 Italia",
    subcampeon: "🇨🇿 Checoslovaquia",
    tercero: "🇩🇪 Alemania",
    final: {
      resultado: "Italia 2 – 1 (AET) Checoslovaquia",
      estadio: "Stadio Nazionale del PNF, Roma",
      asistentes: "55.000",
      fecha: "10 de junio de 1934",
      hora: "17:00"
    }
  },
  {
    año: 1938,
    sede: "Francia",
    img: "img/francia1938.jpg",
    resumen: "Último mundial antes de la Segunda Guerra Mundial. Italia revalidó su título convirtiéndose en el primer equipo bicampeón. Brasil, con Leônidas da Silva como gran figura, quedó tercero. La guerra impidió la celebración de los torneos de 1942 y 1946.",
    campeon: "🇮🇹 Italia",
    subcampeon: "🇭🇺 Hungría",
    tercero: "🇧🇷 Brasil",
    final: {
      resultado: "Italia 4 – 2 Hungría",
      estadio: "Stade Olympique de Colombes, París",
      asistentes: "45.000",
      fecha: "19 de junio de 1938",
      hora: "17:00"
    }
  },
  {
    año: 1950,
    sede: "Brasil",
    img: "img/brasil1950.jpg",
    resumen: "El único Mundial con fase final de round-robin en lugar de una final directa. El 'Maracanazo' quedó grabado en la historia: Uruguay venció a Brasil ante 173.850 espectadores en el Maracaná, en la mayor remontada final de la historia del torneo. Brasil entró en un duelo de duelo colectivo.",
    campeon: "🇺🇾 Uruguay",
    subcampeon: "🇧🇷 Brasil",
    tercero: "🇸🇪 Suecia",
    final: {
      resultado: "Uruguay 2 – 1 Brasil (fase final)",
      estadio: "Estadio Maracaná, Río de Janeiro",
      asistentes: "173.850",
      fecha: "16 de julio de 1950",
      hora: "15:00"
    }
  },
  {
    año: 1954,
    sede: "Suiza",
    img: "img/suiza1954.jpg",
    resumen: "El 'Milagro de Berna': Alemania Occidental venció a la invicta Hungría de Ferenc Puskás, considerada el mejor equipo del mundo. Hungría había ganado 4-2 a Alemania en la fase de grupos. Este torneo fue el primero transmitido por televisión en Europa.",
    campeon: "🇩🇪 Alemania Occ.",
    subcampeon: "🇭🇺 Hungría",
    tercero: "🇦🇹 Austria",
    final: {
      resultado: "Alemania Occ. 3 – 2 Hungría",
      estadio: "Wankdorf Stadion, Berna",
      asistentes: "62.472",
      fecha: "4 de julio de 1954",
      hora: "17:00"
    }
  },
  {
    año: 1958,
    sede: "Suecia",
    img: "img/suecia1958.jpg",
    resumen: "El debut mundial de Pelé a los 17 años fue apoteósico: marcó 6 goles en 4 partidos, incluyendo un hat-trick en semis y 2 goles en la final. Brasil ganó su primer título mundial con una generación dorada que incluía a Garrincha, Didi y Vavá.",
    campeon: "🇧🇷 Brasil",
    subcampeon: "🇸🇪 Suecia",
    tercero: "🇫🇷 Francia",
    final: {
      resultado: "Brasil 5 – 2 Suecia",
      estadio: "Råsunda Stadion, Solna",
      asistentes: "51.800",
      fecha: "29 de junio de 1958",
      hora: "15:00"
    }
  },
  {
    año: 1962,
    sede: "Chile",
    img: "img/chile1962.jpg",
    resumen: "A pesar del devastador terremoto de 1960, Chile organizó el torneo. Brasil revalidó el título con Garrincha como figura principal tras la lesión de Pelé. La 'Batalla de Santiago' entre Chile e Italia es uno de los partidos más violentos de la historia mundialista.",
    campeon: "🇧🇷 Brasil",
    subcampeon: "🇨🇿 Checoslovaquia",
    tercero: "🇨🇱 Chile",
    final: {
      resultado: "Brasil 3 – 1 Checoslovaquia",
      estadio: "Estadio Nacional, Santiago",
      asistentes: "68.679",
      fecha: "17 de junio de 1962",
      hora: "15:00"
    }
  },
  {
    año: 1966,
    sede: "Inglaterra",
    img: "img/inglaterra1966.jpg",
    resumen: "El único título mundialista de Inglaterra, en casa. El famoso gol de Geoff Hurst en la prórroga —cuyo rebote en el larguero generó polémica sobre si cruzó la línea— sigue siendo uno de los más debatidos. Eusébio fue el gran goleador del torneo con 9 goles.",
    campeon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra",
    subcampeon: "🇩🇪 Alemania Occ.",
    tercero: "🇵🇹 Portugal",
    final: {
      resultado: "Inglaterra 4 – 2 (AET) Alemania Occ.",
      estadio: "Wembley Stadium, Londres",
      asistentes: "96.924",
      fecha: "30 de julio de 1966",
      hora: "15:00"
    }
  },
  {
    año: 1970,
    sede: "México",
    img: "img/mexico1970.jpg",
    resumen: "Considerado el mejor Mundial de la historia. Brasil con Pelé, Tostão, Rivelino, Jairzinho y Gérson presentó un fútbol total de belleza insuperable. Jairzinho marcó en todos los partidos —único jugador en lograrlo— y Brasil se quedó con el trofeo Jules Rimet de forma permanente al ganar su tercer título.",
    campeon: "🇧🇷 Brasil",
    subcampeon: "🇮🇹 Italia",
    tercero: "🇩🇪 Alemania Occ.",
    final: {
      resultado: "Brasil 4 – 1 Italia",
      estadio: "Estadio Azteca, Ciudad de México",
      asistentes: "107.412",
      fecha: "21 de junio de 1970",
      hora: "12:00"
    }
  },
  {
    año: 1974,
    sede: "Alemania Occ.",
    img: "img/alemania1974.jpg",
    resumen: "La era del Fútbol Total holandés de Rinus Michels y Johan Cruyff. Los Países Bajos llegaron a la final como favoritos, pero Alemania Occidental se impuso en su propio estadio. Se estrenó el nuevo trofeo FIFA World Cup Trophy, ya que Brasil conservó el Jules Rimet.",
    campeon: "🇩🇪 Alemania Occ.",
    subcampeon: "🇳🇱 Países Bajos",
    tercero: "🇵🇱 Polonia",
    final: {
      resultado: "Alemania Occ. 2 – 1 Países Bajos",
      estadio: "Olympiastadion, Múnich",
      asistentes: "78.200",
      fecha: "7 de julio de 1974",
      hora: "16:00"
    }
  },
  {
    año: 1978,
    sede: "Argentina",
    img: "img/argentina1978.jpg",
    resumen: "Argentina conquistó su primer título mundial en casa bajo la dictadura militar. Mario Kempes fue el goleador del torneo con 6 tantos. La final se disputó con lluvia de papelitos blancos en el Monumental. Países Bajos, sin Cruyff (que se negó a ir por razones políticas), fue subcampeón por segunda vez.",
    campeon: "🇦🇷 Argentina",
    subcampeon: "🇳🇱 Países Bajos",
    tercero: "🇧🇷 Brasil",
    final: {
      resultado: "Argentina 3 – 1 (AET) Países Bajos",
      estadio: "Estadio Monumental, Buenos Aires",
      asistentes: "71.483",
      fecha: "25 de junio de 1978",
      hora: "15:00"
    }
  },
  {
    año: 1982,
    sede: "España",
    img: "img/espana1982.jpg",
    resumen: "Italia ganó su tercer título con Paolo Rossi como protagonista absoluto: 6 goles en 5 partidos tras regresar de una suspensión. Brasil presentó uno de los equipos más brillantes de su historia (Zico, Sócrates, Falcão), pero cayó ante Italia en una de las mayores sorpresas del torneo.",
    campeon: "🇮🇹 Italia",
    subcampeon: "🇩🇪 Alemania Occ.",
    tercero: "🇵🇱 Polonia",
    final: {
      resultado: "Italia 3 – 1 Alemania Occ.",
      estadio: "Santiago Bernabéu, Madrid",
      asistentes: "90.089",
      fecha: "11 de julio de 1982",
      hora: "20:00"
    }
  },
  {
    año: 1986,
    sede: "México",
    img: "img/mexico1986.jpg",
    resumen: "El Mundial de Maradona. En cuartos de final ante Inglaterra marcó dos goles legendarios en el mismo partido: el 'Gol del Siglo' con una gambeta magistral de 60 metros, y la 'Mano de Dios' con la mano. Argentina ganó su segundo título. Fue el torneo donde más goles marcó un solo jugador en la historia reciente.",
    campeon: "🇦🇷 Argentina",
    subcampeon: "🇩🇪 Alemania Occ.",
    tercero: "🇫🇷 Francia",
    final: {
      resultado: "Argentina 3 – 2 Alemania Occ.",
      estadio: "Estadio Azteca, Ciudad de México",
      asistentes: "114.600",
      fecha: "29 de junio de 1986",
      hora: "12:00"
    }
  },
  {
    año: 1990,
    sede: "Italia",
    img: "img/italia1990.jpg",
    resumen: "El Mundial del juego defensivo y los penales. Solo promediaron 2,21 goles por partido, el registro más bajo de la historia. Salvatore Schillaci, el gran héroe local, ganó la Bota de Oro con 6 goles. Alemania ganó con el único gol de Brehme de penal en una fina muy decepcionante.",
    campeon: "🇩🇪 Alemania Occ.",
    subcampeon: "🇦🇷 Argentina",
    tercero: "🇮🇹 Italia",
    final: {
      resultado: "Alemania Occ. 1 – 0 Argentina",
      estadio: "Stadio Olimpico, Roma",
      asistentes: "73.603",
      fecha: "8 de julio de 1990",
      hora: "20:00"
    }
  },
  {
    año: 1994,
    sede: "Estados Unidos",
    img: "img/usa1994.jpg",
    resumen: "Brasil ganó su cuarto título en la primera final que se resolvió por penaltis. Roberto Baggio, el héroe de Italia, falló el último penal con el cielo de California como testigo. Romário y Bebeto formaron la dupla goleadora más letal del torneo.",
    campeon: "🇧🇷 Brasil",
    subcampeon: "🇮🇹 Italia",
    tercero: "🇸🇪 Suecia",
    final: {
      resultado: "Brasil 0 – 0 (AET) Italia (3-2 pen.)",
      estadio: "Rose Bowl, Pasadena",
      asistentes: "94.194",
      fecha: "17 de julio de 1994",
      hora: "12:30"
    }
  },
  {
    año: 1998,
    sede: "Francia",
    img: "img/francia1998.jpg",
    resumen: "Francia ganó su primer título en casa con Zinedine Zidane marcando dos goles de cabeza en la final. Brasil llegó a la final con Ronaldo en circunstancias misteriosas —sufrió un episodio convulsivo la noche anterior— y perdió claramente. Ronaldo terminó ganando la Bota de Plata con 4 goles.",
    campeon: "🇫🇷 Francia",
    subcampeon: "🇧🇷 Brasil",
    tercero: "🇭🇷 Croacia",
    final: {
      resultado: "Francia 3 – 0 Brasil",
      estadio: "Stade de France, Saint-Denis",
      asistentes: "80.000",
      fecha: "12 de julio de 1998",
      hora: "21:00"
    }
  },
  {
    año: 2002,
    sede: "Corea/Japón",
    img: "img/coreajapon2002.jpg",
    resumen: "El primer Mundial coorganizado y el primero en Asia. La redención de Ronaldo: después de su colapso en 1998, marcó 8 goles incluyendo el doblete en la final. Corea del Sur sorprendió al mundo llegando a las semifinales. Turquía terminó tercera en su única participación histórica.",
    campeon: "🇧🇷 Brasil",
    subcampeon: "🇩🇪 Alemania",
    tercero: "🇹🇷 Turquía",
    final: {
      resultado: "Brasil 2 – 0 Alemania",
      estadio: "International Stadium Yokohama",
      asistentes: "69.029",
      fecha: "30 de junio de 2002",
      hora: "20:00"
    }
  },
  {
    año: 2006,
    sede: "Alemania",
    img: "img/alemania2006.jpg",
    resumen: "Italia ganó su cuarto título en dramáticos penaltis. El momento más recordado fue el cabezazo de Zidane al pecho de Materazzi en la prórroga de la final, lo que le valió la expulsión en su último partido profesional. Alemania fue un anfitrión brillante y terminó tercero.",
    campeon: "🇮🇹 Italia",
    subcampeon: "🇫🇷 Francia",
    tercero: "🇩🇪 Alemania",
    final: {
      resultado: "Italia 1 – 1 (AET) Francia (5-3 pen.)",
      estadio: "Olympiastadion, Berlín",
      asistentes: "69.000",
      fecha: "9 de julio de 2006",
      hora: "20:00"
    }
  },
  {
    año: 2010,
    sede: "Sudáfrica",
    img: "img/sudafrica2010.jpg",
    resumen: "El primer Mundial en África. España ganó su primer título con el 'tiki-taka' de Xavi, Iniesta e Iniesta. El gol de Iniesta en el minuto 116 de la prórroga decidió la final. El vuvuzela se convirtió en el símbolo sonoro del torneo. Paul el Pulpo acertó todos los resultados.",
    campeon: "🇪🇸 España",
    subcampeon: "🇳🇱 Países Bajos",
    tercero: "🇩🇪 Alemania",
    final: {
      resultado: "España 1 – 0 (AET) Países Bajos",
      estadio: "Soccer City, Johannesburgo",
      asistentes: "84.490",
      fecha: "11 de julio de 2010",
      hora: "20:30"
    }
  },
  {
    año: 2014,
    sede: "Brasil",
    img: "img/brasil2014.jpg",
    resumen: "El 'Mineirazo': Brasil cayó 1-7 ante Alemania en semis en el estadio Mineirão, la mayor goleada en unas semifinales mundialistas. Alemania ganó su cuarto título con el gol de Götze en la prórroga. Messi ganó el Balón de Oro pero quedó sin título.",
    campeon: "🇩🇪 Alemania",
    subcampeon: "🇦🇷 Argentina",
    tercero: "🇳🇱 Países Bajos",
    final: {
      resultado: "Alemania 1 – 0 (AET) Argentina",
      estadio: "Estadio Maracaná, Río de Janeiro",
      asistentes: "74.738",
      fecha: "13 de julio de 2014",
      hora: "20:00"
    }
  },
  {
    año: 2018,
    sede: "Rusia",
    img: "img/rusia2018.jpg",
    resumen: "Francia ganó su segundo título con una generación liderada por Kylian Mbappé, quien a los 19 años se convirtió en el segundo jugador en marcar en una final mundialista tras Pelé. Croacia llegó sorpresivamente a la final. Bélgica terminó tercera en su mejor participación histórica.",
    campeon: "🇫🇷 Francia",
    subcampeon: "🇭🇷 Croacia",
    tercero: "🇧🇪 Bélgica",
    final: {
      resultado: "Francia 4 – 2 Croacia",
      estadio: "Estadio Luzhniki, Moscú",
      asistentes: "78.011",
      fecha: "15 de julio de 2018",
      hora: "17:00"
    }
  },
  {
    año: 2022,
    sede: "Qatar",
    img: "img/qatar2022.jpg",
    resumen: "El Mundial más emocionante de la historia y la redención de Lionel Messi. Argentina y Francia protagonizaron la final más épica jamás jugada: 3-3 tras 120 minutos, con Mbappé logrando un hat-trick y Messi marcando dos. Argentina ganó en penaltis. Messi finalmente levantó la Copa del Mundo y completó su leyenda.",
    campeon: "🇦🇷 Argentina",
    subcampeon: "🇫🇷 Francia",
    tercero: "🇭🇷 Croacia",
    final: {
      resultado: "Argentina 3 – 3 (AET) Francia (4-2 pen.)",
      estadio: "Estadio Lusail, Qatar",
      asistentes: "88.966",
      fecha: "18 de diciembre de 2022",
      hora: "18:00"
    }
  }
];

const ESTADISTICAS = {
  img: "img/messi.jpg",
  titulo: "Estadísticas y Récords",
  datos: [
    { icono: "⚽", titulo: "Máximo Goleador Histórico", valor: "Miroslav Klose (Alemania)", detalle: "16 goles en 4 mundiales (2002, 2006, 2010, 2014)" },
    { icono: "🏆", titulo: "País con Más Títulos", valor: "Brasil — 5 títulos", detalle: "1958, 1962, 1970, 1994, 2002" },
    { icono: "🎮", titulo: "Más Partidos Jugados", valor: "Lothar Matthäus (Alemania)", detalle: "25 partidos en 5 mundiales (1982-1998)" },
    { icono: "🌍", titulo: "Más Mundiales Jugados", valor: "5 mundiales", detalle: "Matthäus, Maldini, Shilton, Carbajal, Milla, Cafu, Ramos y Messi (5 c/u)" },
    { icono: "👶", titulo: "Jugador Más Joven", valor: "Norman Whiteside (N. Irlanda)", detalle: "17 años y 41 días en el Mundial 1982" },
    { icono: "👴", titulo: "Jugador Más Viejo", valor: "Essam El-Hadary (Egipto)", detalle: "45 años y 161 días en el Mundial 2018" },
    { icono: "💥", titulo: "Más Goles en un Solo Mundial", valor: "Just Fontaine (Francia) — 13 goles", detalle: "En el Mundial de Suecia 1958 (aún imbatido)" },
    { icono: "🥅", titulo: "Más Goles en una Final", valor: "Kylian Mbappé (Francia)", detalle: "Hat-trick en la final de Qatar 2022 (perdida vs Argentina)" },
    { icono: "📊", titulo: "Final con Más Goles", valor: "Brasil 5 – 2 Suecia (1958)", detalle: "7 goles en la final de Suecia 1958" },
    { icono: "😲", titulo: "Mayor Goleada de la Historia", valor: "Australia 31 – 0 American Samoa", detalle: "Clasificación para el Mundial 2002, no en fase final" },
    { icono: "🤯", titulo: "Mayor Goleada en Mundiales", valor: "Hungría 10 – 1 El Salvador (1982)", detalle: "Fase de grupos del Mundial de España 1982" },
    { icono: "🔴", titulo: "Jugador con Más Expulsiones", valor: "Rigobert Song (Camerún)", detalle: "2 expulsiones en mundiales (1994 y 1998)" },
    { icono: "🧤", titulo: "Portero con Más Vallas Invictas", valor: "Peter Shilton (Inglaterra)", detalle: "10 partidos sin goles en 3 mundiales (1982, 1986, 1990)" },
    { icono: "⏱️", titulo: "Gol Más Rápido en un Mundial", valor: "Hakan Şükür (Turquía)", detalle: "11 segundos vs Corea del Sur — 3er puesto 2002" }
  ]
};

const TROFEO = {
  img: "img/julesrimet.jpg",
  titulo: "El Trofeo de la Copa del Mundo",
  historia: [
    {
      subtitulo: "El Trofeo Jules Rimet (1930–1970)",
      texto: "El primer trofeo mundialista fue diseñado por el escultor francés Abel Lafleur y representaba a Nike, la diosa griega de la victoria, sosteniendo un octogonal vaso. Fue bautizado como 'Copa del Mundo' o 'Diosa de la Victoria'. En 1946, la FIFA lo renombró 'Trofeo Jules Rimet' en honor al presidente que impulsó la creación del torneo. Estaba hecho de oro esterlino sobre un núcleo de lapis lázuli. Durante la Segunda Guerra Mundial, el vicepresidente de la FIFA italiana, Ottorino Barassi, lo escondió en una caja de zapatos bajo su cama para evitar que los nazis lo confiscaran. Brasil lo ganó de forma permanente en 1970 al conquistar su tercer título. En 1983 fue robado en Río de Janeiro y nunca fue recuperado; se cree que fue fundido."
    },
    {
      subtitulo: "El Trofeo FIFA World Cup (1974–presente)",
      texto: "Tras saber que Brasil retendría el Jules Rimet permanentemente, la FIFA encargó un nuevo trofeo en 1971. Resultó ganador el diseño del escultor italiano Silvio Gazzaniga: dos figuras humanas con los brazos extendidos sosteniendo el globo terráqueo. Mide 36,8 cm de altura y pesa 6,175 kg. Está fabricado en oro de 18 quilates macizo con una base de malaquita verde. En la base están grabados los nombres de todos los campeones mundiales. El trofeo original permanece en la sede de la FIFA en Zúrich. Los campeones reciben una réplica bañada en oro. Solo los jefes de Estado, los ganadores del torneo y el presidente de la FIFA tienen permitido tocar el trofeo original."
    },
    {
      subtitulo: "Curiosidades del Trofeo",
      texto: "El trofeo tiene capacidad para grabar los nombres de 17 campeones en su base (hasta 2038). A partir de ese año necesitará una nueva base o un nuevo diseño. El diseñador Silvio Gazzaniga dijo que quiso representar 'el momento sublime de la victoria'. El trofeo estuvo en peligro durante el Mundial de 2010 en Sudáfrica cuando fue transportado en un avión sin las medidas de seguridad adecuadas. Cada nación campeona recibe una réplica dorada de tamaño real que puede exhibir públicamente, pero el trofeo original siempre regresa a la FIFA."
    }
  ]
};

// ─── Renderizado ───────────────────────────────────────────────────────────────

export function renderHistoriaView(container) {
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "historia-wrapper";

  const titulo = document.createElement("h2");
  titulo.className = "historia-titulo";
  titulo.textContent = "Historia de la Copa del Mundo FIFA";
  wrapper.appendChild(titulo);

  const subtitulo = document.createElement("p");
  subtitulo.className = "historia-subtitulo";
  subtitulo.textContent = "Haz clic en cualquier póster para ver los detalles del torneo";
  wrapper.appendChild(subtitulo);

  // Sección mundiales
  const seccionMundiales = document.createElement("div");
  seccionMundiales.className = "historia-seccion";
  const labelMundiales = document.createElement("h3");
  labelMundiales.className = "historia-seccion__label";
  labelMundiales.textContent = "⚽ Torneos Oficiales";
  seccionMundiales.appendChild(labelMundiales);

  const grid = document.createElement("div");
  grid.className = "historia-grid";

  for (const mundial of MUNDIALES) {
    grid.appendChild(crearTarjetaMundial(mundial));
  }

  seccionMundiales.appendChild(grid);
  wrapper.appendChild(seccionMundiales);

  // Sección especial
  const seccionEspecial = document.createElement("div");
  seccionEspecial.className = "historia-seccion";
  const labelEspecial = document.createElement("h3");
  labelEspecial.className = "historia-seccion__label";
  labelEspecial.textContent = "★ Especiales";
  seccionEspecial.appendChild(labelEspecial);

  const gridEspecial = document.createElement("div");
  gridEspecial.className = "historia-grid historia-grid--especial";

  gridEspecial.appendChild(crearTarjetaEspecial(ESTADISTICAS, "stats"));
  gridEspecial.appendChild(crearTarjetaEspecial(TROFEO, "trofeo"));

  seccionEspecial.appendChild(gridEspecial);
  wrapper.appendChild(seccionEspecial);

  container.appendChild(wrapper);

  // Modal container
  if (!document.getElementById("historia-modal-overlay")) {
    document.body.appendChild(crearModalContainer());
  }
}

function crearTarjetaMundial(mundial) {
  const card = document.createElement("div");
  card.className = "historia-card";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", `Mundial ${mundial.año} ${mundial.sede}`);

  const imgWrapper = document.createElement("div");
  imgWrapper.className = "historia-card__img-wrapper";

  const img = document.createElement("img");
  img.src = mundial.img;
  img.alt = `Póster Mundial ${mundial.año} ${mundial.sede}`;
  img.loading = "lazy";
  img.onerror = function () {
    if (/\.(jpg|jpeg)$/i.test(this.src)) {
      this.src = this.src.replace(/\.(jpg|jpeg)$/i, ".png");
      this.onerror = function () {
        this.style.display = "none";
        imgWrapper.classList.add("historia-card__img-fallback");
        imgWrapper.dataset.year = mundial.año;
      };
    } else {
      this.style.display = "none";
      imgWrapper.classList.add("historia-card__img-fallback");
      imgWrapper.dataset.year = mundial.año;
    }
  };
  imgWrapper.appendChild(img);
  card.appendChild(imgWrapper);

  const info = document.createElement("div");
  info.className = "historia-card__info";

  const año = document.createElement("span");
  año.className = "historia-card__año";
  año.textContent = mundial.año;
  info.appendChild(año);

  const sede = document.createElement("span");
  sede.className = "historia-card__sede";
  sede.textContent = mundial.sede;
  info.appendChild(sede);

  const campeon = document.createElement("span");
  campeon.className = "historia-card__campeon";
  campeon.textContent = mundial.campeon;
  info.appendChild(campeon);

  card.appendChild(info);

  card.addEventListener("click", () => abrirModalMundial(mundial));
  card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") abrirModalMundial(mundial); });

  return card;
}

function crearTarjetaEspecial(data, tipo) {
  const card = document.createElement("div");
  card.className = "historia-card historia-card--especial";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");

  const imgWrapper = document.createElement("div");
  imgWrapper.className = "historia-card__img-wrapper";

  const img = document.createElement("img");
  img.src = data.img;
  img.alt = data.titulo;
  img.loading = "lazy";
  img.onerror = function () {
    if (/\.(jpg|jpeg)$/i.test(this.src)) {
      this.src = this.src.replace(/\.(jpg|jpeg)$/i, ".png");
      this.onerror = function () {
        this.style.display = "none";
        imgWrapper.classList.add("historia-card__img-fallback");
        imgWrapper.dataset.icon = tipo === "stats" ? "📊" : "🏆";
      };
    } else {
      this.style.display = "none";
      imgWrapper.classList.add("historia-card__img-fallback");
      imgWrapper.dataset.icon = tipo === "stats" ? "📊" : "🏆";
    }
  };
  imgWrapper.appendChild(img);
  card.appendChild(imgWrapper);

  const info = document.createElement("div");
  info.className = "historia-card__info historia-card__info--especial";

  const titulo = document.createElement("span");
  titulo.className = "historia-card__titulo-especial";
  titulo.textContent = data.titulo;
  info.appendChild(titulo);

  card.appendChild(info);

  if (tipo === "stats") {
    card.addEventListener("click", () => abrirModalEstadisticas());
    card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") abrirModalEstadisticas(); });
  } else {
    card.addEventListener("click", () => abrirModalTrofeo());
    card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") abrirModalTrofeo(); });
  }

  return card;
}

function crearModalContainer() {
  const overlay = document.createElement("div");
  overlay.id = "historia-modal-overlay";
  overlay.className = "historia-modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  overlay.addEventListener("click", e => {
    if (e.target === overlay) cerrarModal();
  });

  const modal = document.createElement("div");
  modal.id = "historia-modal";
  modal.className = "historia-modal";

  overlay.appendChild(modal);
  return overlay;
}

function abrirModalMundial(mundial) {
  const modal = document.getElementById("historia-modal");
  modal.innerHTML = `
    <button class="historia-modal__close" aria-label="Cerrar">&times;</button>
    <div class="historia-modal__header">
      <div class="historia-modal__año-badge">${mundial.año}</div>
      <div class="historia-modal__header-text">
        <h2 class="historia-modal__title">Copa del Mundo ${mundial.año}</h2>
        <p class="historia-modal__sede">📍 ${mundial.sede}</p>
      </div>
    </div>
    <div class="historia-modal__body">
      <div class="historia-modal__resumen">
        <p>${mundial.resumen}</p>
      </div>
      <div class="historia-modal__podio">
        <div class="podio-item podio-item--oro">
          <span class="podio-item__medalla">🥇</span>
          <span class="podio-item__label">Campeón</span>
          <span class="podio-item__equipo">${mundial.campeon}</span>
        </div>
        <div class="podio-item podio-item--plata">
          <span class="podio-item__medalla">🥈</span>
          <span class="podio-item__label">Subcampeón</span>
          <span class="podio-item__equipo">${mundial.subcampeon}</span>
        </div>
        ${mundial.tercero ? `
        <div class="podio-item podio-item--bronce">
          <span class="podio-item__medalla">🥉</span>
          <span class="podio-item__label">Tercer Puesto</span>
          <span class="podio-item__equipo">${mundial.tercero}</span>
        </div>` : ""}
      </div>
      <div class="historia-modal__final">
        <h3 class="historia-modal__section-title">⚽ Final</h3>
        <div class="final-grid">
          <div class="final-item final-item--resultado">
            <span class="final-item__label">Resultado</span>
            <span class="final-item__value final-item__value--big">${mundial.final.resultado}</span>
          </div>
          <div class="final-item">
            <span class="final-item__label">🏟️ Estadio</span>
            <span class="final-item__value">${mundial.final.estadio}</span>
          </div>
          <div class="final-item">
            <span class="final-item__label">👥 Asistentes</span>
            <span class="final-item__value">${mundial.final.asistentes}</span>
          </div>
          <div class="final-item">
            <span class="final-item__label">📅 Fecha</span>
            <span class="final-item__value">${mundial.final.fecha}</span>
          </div>
          <div class="final-item">
            <span class="final-item__label">🕐 Hora</span>
            <span class="final-item__value">${mundial.final.hora} (local)</span>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.querySelector(".historia-modal__close").addEventListener("click", cerrarModal);
  abrirOverlay();
}

function abrirModalEstadisticas() {
  const modal = document.getElementById("historia-modal");
  const filasHTML = ESTADISTICAS.datos.map(d => `
    <div class="stat-row">
      <span class="stat-row__icono">${d.icono}</span>
      <div class="stat-row__texto">
        <span class="stat-row__titulo">${d.titulo}</span>
        <span class="stat-row__valor">${d.valor}</span>
        <span class="stat-row__detalle">${d.detalle}</span>
      </div>
    </div>
  `).join("");

  modal.innerHTML = `
    <button class="historia-modal__close" aria-label="Cerrar">&times;</button>
    <div class="historia-modal__header historia-modal__header--especial">
      <span class="historia-modal__header-icon">📊</span>
      <h2 class="historia-modal__title">${ESTADISTICAS.titulo}</h2>
    </div>
    <div class="historia-modal__body">
      <div class="stats-grid">${filasHTML}</div>
    </div>
  `;

  modal.querySelector(".historia-modal__close").addEventListener("click", cerrarModal);
  abrirOverlay();
}

function abrirModalTrofeo() {
  const modal = document.getElementById("historia-modal");
  const seccionesHTML = TROFEO.historia.map(s => `
    <div class="trofeo-seccion">
      <h3 class="trofeo-seccion__titulo">🏆 ${s.subtitulo}</h3>
      <p class="trofeo-seccion__texto">${s.texto}</p>
    </div>
  `).join("");

  modal.innerHTML = `
    <button class="historia-modal__close" aria-label="Cerrar">&times;</button>
    <div class="historia-modal__header historia-modal__header--especial">
      <span class="historia-modal__header-icon">🏆</span>
      <h2 class="historia-modal__title">${TROFEO.titulo}</h2>
    </div>
    <div class="historia-modal__body">
      ${seccionesHTML}
    </div>
  `;

  modal.querySelector(".historia-modal__close").addEventListener("click", cerrarModal);
  abrirOverlay();
}

function abrirOverlay() {
  const overlay = document.getElementById("historia-modal-overlay");
  overlay.classList.add("historia-modal-overlay--visible");
  document.body.style.overflow = "hidden";

  const onKey = e => {
    if (e.key === "Escape") {
      cerrarModal();
      document.removeEventListener("keydown", onKey);
    }
  };
  document.addEventListener("keydown", onKey);
}

function cerrarModal() {
  const overlay = document.getElementById("historia-modal-overlay");
  overlay.classList.remove("historia-modal-overlay--visible");
  document.body.style.overflow = "";
}
