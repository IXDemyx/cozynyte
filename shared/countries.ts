/**
 * Länder-Quiz: alle 193 UN-Mitglieder plus Vatikanstadt und Palästina (Beobachterstaaten).
 * Namen und Hauptstädte auf Deutsch und Englisch, Kontinent, ob das Land „bekannt“ ist (leichte
 * Stufe) und weitere Schreibweisen, die beim Tippen auch zählen. Von Client und Server genutzt.
 */

export type Continent = "eu" | "as" | "af" | "na" | "sa" | "oc";

export interface Country {
  /** ISO-3166-Code in Kleinbuchstaben (auch Dateiname von Flagge und Umriss). */
  code: string;
  de: string;
  en: string;
  continent: Continent;
  /** Zählt im Regionen-Filter zusätzlich zu diesem Kontinent (z. B. Russland, Türkei). */
  also?: Continent;
  /** Hauptstadt – fehlt, wenn sie umstritten ist (dann gibt es keine Hauptstadt-Frage). */
  capital?: { de: string; en: string; alt?: string[] };
  /** Leichte Stufe: Länder, die die meisten kennen. */
  known: boolean;
  /** Weitere Schreibweisen des Landes, die beim Tippen zählen. */
  alt?: string[];
}

type Capital = [de: string, en?: string, alt?: string[]];

function c(
  code: string,
  de: string,
  en: string,
  continent: Continent,
  capital: Capital | null,
  known: 0 | 1,
  alt?: string[],
  also?: Continent,
): Country {
  return {
    code,
    de,
    en,
    continent,
    ...(also ? { also } : {}),
    ...(capital
      ? {
          capital: {
            de: capital[0],
            en: capital[1] ?? capital[0],
            ...(capital[2] ? { alt: capital[2] } : {}),
          },
        }
      : {}),
    known: known === 1,
    ...(alt ? { alt } : {}),
  };
}

export const COUNTRIES: Country[] = [
  // Europa
  c("al", "Albanien", "Albania", "eu", ["Tirana"], 1),
  c("ad", "Andorra", "Andorra", "eu", ["Andorra la Vella"], 0),
  c("at", "Österreich", "Austria", "eu", ["Wien", "Vienna"], 1),
  c("by", "Belarus", "Belarus", "eu", ["Minsk"], 0, ["Weißrussland", "Weissrussland"]),
  c("be", "Belgien", "Belgium", "eu", ["Brüssel", "Brussels", ["Bruxelles"]], 1),
  c("ba", "Bosnien und Herzegowina", "Bosnia and Herzegovina", "eu", ["Sarajevo"], 0, [
    "Bosnien",
    "Bosnia",
  ]),
  c("bg", "Bulgarien", "Bulgaria", "eu", ["Sofia"], 1),
  c("hr", "Kroatien", "Croatia", "eu", ["Zagreb"], 1),
  c("cy", "Zypern", "Cyprus", "eu", ["Nikosia", "Nicosia"], 1, undefined, "as"),
  c("cz", "Tschechien", "Czechia", "eu", ["Prag", "Prague", ["Praha"]], 1, [
    "Czech Republic",
    "Tschechische Republik",
  ]),
  c("dk", "Dänemark", "Denmark", "eu", ["Kopenhagen", "Copenhagen"], 1),
  c("ee", "Estland", "Estonia", "eu", ["Tallinn"], 1),
  c("fi", "Finnland", "Finland", "eu", ["Helsinki"], 1),
  c("fr", "Frankreich", "France", "eu", ["Paris"], 1),
  c("de", "Deutschland", "Germany", "eu", ["Berlin"], 1),
  c("gr", "Griechenland", "Greece", "eu", ["Athen", "Athens"], 1),
  c("hu", "Ungarn", "Hungary", "eu", ["Budapest"], 1),
  c("is", "Island", "Iceland", "eu", ["Reykjavík"], 1),
  c("ie", "Irland", "Ireland", "eu", ["Dublin"], 1),
  c("it", "Italien", "Italy", "eu", ["Rom", "Rome", ["Roma"]], 1),
  c("lv", "Lettland", "Latvia", "eu", ["Riga"], 1),
  c("li", "Liechtenstein", "Liechtenstein", "eu", ["Vaduz"], 0),
  c("lt", "Litauen", "Lithuania", "eu", ["Vilnius", "Vilnius", ["Wilna"]], 1),
  c("lu", "Luxemburg", "Luxembourg", "eu", ["Luxemburg", "Luxembourg"], 1),
  c("mt", "Malta", "Malta", "eu", ["Valletta"], 1),
  c("md", "Moldau", "Moldova", "eu", ["Chișinău", "Chișinău", ["Kischinau", "Chisinau"]], 0, [
    "Moldawien",
    "Republik Moldau",
  ]),
  c("mc", "Monaco", "Monaco", "eu", ["Monaco"], 0),
  c("me", "Montenegro", "Montenegro", "eu", ["Podgorica"], 0),
  c("nl", "Niederlande", "Netherlands", "eu", ["Amsterdam"], 1, ["Holland", "The Netherlands"]),
  c("mk", "Nordmazedonien", "North Macedonia", "eu", ["Skopje"], 0, ["Mazedonien", "Macedonia"]),
  c("no", "Norwegen", "Norway", "eu", ["Oslo"], 1),
  c("pl", "Polen", "Poland", "eu", ["Warschau", "Warsaw", ["Warszawa"]], 1),
  c("pt", "Portugal", "Portugal", "eu", ["Lissabon", "Lisbon", ["Lisboa"]], 1),
  c("ro", "Rumänien", "Romania", "eu", ["Bukarest", "Bucharest"], 1),
  c(
    "ru",
    "Russland",
    "Russia",
    "eu",
    ["Moskau", "Moscow"],
    1,
    ["Russische Föderation", "Russian Federation"],
    "as",
  ),
  c("sm", "San Marino", "San Marino", "eu", ["San Marino"], 0),
  c("rs", "Serbien", "Serbia", "eu", ["Belgrad", "Belgrade"], 1),
  c("sk", "Slowakei", "Slovakia", "eu", ["Bratislava", "Bratislava", ["Pressburg"]], 1),
  c("si", "Slowenien", "Slovenia", "eu", ["Ljubljana", "Ljubljana", ["Laibach"]], 1),
  c("es", "Spanien", "Spain", "eu", ["Madrid"], 1),
  c("se", "Schweden", "Sweden", "eu", ["Stockholm"], 1),
  c("ch", "Schweiz", "Switzerland", "eu", ["Bern", "Bern", ["Berne"]], 1),
  c("ua", "Ukraine", "Ukraine", "eu", ["Kyjiw", "Kyiv", ["Kiew", "Kiev"]], 1),
  c("gb", "Vereinigtes Königreich", "United Kingdom", "eu", ["London"], 1, [
    "Großbritannien",
    "Grossbritannien",
    "Great Britain",
    "Britain",
    "UK",
    "GB",
    "England",
  ]),
  c(
    "va",
    "Vatikanstadt",
    "Vatican City",
    "eu",
    ["Vatikanstadt", "Vatican City", ["Vatikan", "Vatican"]],
    0,
    ["Vatikan", "Vatican", "Heiliger Stuhl", "Holy See"],
  ),

  // Asien
  c("af", "Afghanistan", "Afghanistan", "as", ["Kabul"], 1),
  c("am", "Armenien", "Armenia", "as", ["Jerewan", "Yerevan", ["Eriwan"]], 0),
  c("az", "Aserbaidschan", "Azerbaijan", "as", ["Baku"], 0),
  c("bh", "Bahrain", "Bahrain", "as", ["Manama"], 0),
  c("bd", "Bangladesch", "Bangladesh", "as", ["Dhaka", "Dhaka", ["Dakka"]], 0),
  c("bt", "Bhutan", "Bhutan", "as", ["Thimphu"], 0),
  c("bn", "Brunei", "Brunei", "as", ["Bandar Seri Begawan"], 0),
  c("kh", "Kambodscha", "Cambodia", "as", ["Phnom Penh"], 0),
  c("cn", "China", "China", "as", ["Peking", "Beijing"], 1, ["Volksrepublik China"]),
  c("ge", "Georgien", "Georgia", "as", ["Tiflis", "Tbilisi"], 0),
  c("in", "Indien", "India", "as", ["Neu-Delhi", "New Delhi", ["Delhi"]], 1),
  c("id", "Indonesien", "Indonesia", "as", ["Jakarta", "Jakarta", ["Nusantara"]], 1),
  c("ir", "Iran", "Iran", "as", ["Teheran", "Tehran"], 1),
  c("iq", "Irak", "Iraq", "as", ["Bagdad", "Baghdad"], 1),
  c("il", "Israel", "Israel", "as", null, 1),
  c("jp", "Japan", "Japan", "as", ["Tokio", "Tokyo"], 1),
  c("jo", "Jordanien", "Jordan", "as", ["Amman"], 0),
  c("kz", "Kasachstan", "Kazakhstan", "as", ["Astana"], 1),
  c("kw", "Kuwait", "Kuwait", "as", ["Kuwait-Stadt", "Kuwait City", ["Kuwait"]], 0),
  c("kg", "Kirgisistan", "Kyrgyzstan", "as", ["Bischkek", "Bishkek"], 0, ["Kirgistan"]),
  c("la", "Laos", "Laos", "as", ["Vientiane"], 0),
  c("lb", "Libanon", "Lebanon", "as", ["Beirut"], 0),
  c("my", "Malaysia", "Malaysia", "as", ["Kuala Lumpur"], 1),
  c("mv", "Malediven", "Maldives", "as", ["Malé", "Malé", ["Male"]], 0),
  c(
    "mn",
    "Mongolei",
    "Mongolia",
    "as",
    ["Ulaanbaatar", "Ulaanbaatar", ["Ulan Bator", "Ulan-Bator"]],
    1,
  ),
  c("mm", "Myanmar", "Myanmar", "as", ["Naypyidaw"], 0, ["Birma", "Burma"]),
  c("np", "Nepal", "Nepal", "as", ["Kathmandu"], 1),
  c("kp", "Nordkorea", "North Korea", "as", ["Pjöngjang", "Pyongyang"], 1),
  c("om", "Oman", "Oman", "as", ["Maskat", "Muscat"], 0),
  c("pk", "Pakistan", "Pakistan", "as", ["Islamabad"], 1),
  c("ps", "Palästina", "Palestine", "as", null, 0, ["Palästinensische Gebiete"]),
  c("ph", "Philippinen", "Philippines", "as", ["Manila"], 1),
  c("qa", "Katar", "Qatar", "as", ["Doha"], 0),
  c("sa", "Saudi-Arabien", "Saudi Arabia", "as", ["Riad", "Riyadh"], 1),
  c("sg", "Singapur", "Singapore", "as", ["Singapur", "Singapore"], 1),
  c("kr", "Südkorea", "South Korea", "as", ["Seoul"], 1, ["Korea"]),
  c(
    "lk",
    "Sri Lanka",
    "Sri Lanka",
    "as",
    ["Sri Jayawardenepura Kotte", "Sri Jayawardenepura Kotte", ["Kotte", "Colombo"]],
    1,
  ),
  c("sy", "Syrien", "Syria", "as", ["Damaskus", "Damascus"], 0),
  c("tj", "Tadschikistan", "Tajikistan", "as", ["Duschanbe", "Dushanbe"], 0),
  c("th", "Thailand", "Thailand", "as", ["Bangkok"], 1),
  c("tl", "Osttimor", "Timor-Leste", "as", ["Dili"], 0, ["East Timor", "Timor"]),
  c("tr", "Türkei", "Turkey", "as", ["Ankara"], 1, ["Türkiye", "Turkiye"], "eu"),
  c(
    "tm",
    "Turkmenistan",
    "Turkmenistan",
    "as",
    ["Aşgabat", "Ashgabat", ["Aschgabat", "Asgabat"]],
    0,
  ),
  c("ae", "Vereinigte Arabische Emirate", "United Arab Emirates", "as", ["Abu Dhabi"], 1, [
    "VAE",
    "UAE",
    "Emirate",
    "Emirates",
  ]),
  c("uz", "Usbekistan", "Uzbekistan", "as", ["Taschkent", "Tashkent"], 0),
  c("vn", "Vietnam", "Vietnam", "as", ["Hanoi"], 1),
  c("ye", "Jemen", "Yemen", "as", ["Sanaa"], 0),

  // Afrika
  c("dz", "Algerien", "Algeria", "af", ["Algier", "Algiers"], 1),
  c("ao", "Angola", "Angola", "af", ["Luanda"], 0),
  c("bj", "Benin", "Benin", "af", ["Porto-Novo"], 0),
  c("bw", "Botswana", "Botswana", "af", ["Gaborone"], 0),
  c("bf", "Burkina Faso", "Burkina Faso", "af", ["Ouagadougou"], 0),
  c("bi", "Burundi", "Burundi", "af", ["Gitega", "Gitega", ["Bujumbura"]], 0),
  c("cv", "Kap Verde", "Cape Verde", "af", ["Praia"], 0, ["Cabo Verde"]),
  c("cm", "Kamerun", "Cameroon", "af", ["Jaunde", "Yaoundé"], 1),
  c("cf", "Zentralafrikanische Republik", "Central African Republic", "af", ["Bangui"], 0, [
    "ZAR",
    "CAR",
  ]),
  c("td", "Tschad", "Chad", "af", ["N’Djamena", "N’Djamena", ["Ndjamena"]], 0),
  c("km", "Komoren", "Comoros", "af", ["Moroni"], 0),
  c("cg", "Republik Kongo", "Republic of the Congo", "af", ["Brazzaville"], 0, [
    "Kongo-Brazzaville",
    "Congo-Brazzaville",
    "Kongo Brazzaville",
  ]),
  c("cd", "Demokratische Republik Kongo", "DR Congo", "af", ["Kinshasa"], 0, [
    "DR Kongo",
    "Kongo-Kinshasa",
    "Congo-Kinshasa",
    "Democratic Republic of the Congo",
    "DRC",
    "DRK",
  ]),
  c("ci", "Elfenbeinküste", "Ivory Coast", "af", ["Yamoussoukro"], 0, [
    "Côte d’Ivoire",
    "Cote d'Ivoire",
  ]),
  c("dj", "Dschibuti", "Djibouti", "af", ["Dschibuti", "Djibouti"], 0),
  c("eg", "Ägypten", "Egypt", "af", ["Kairo", "Cairo"], 1),
  c("gq", "Äquatorialguinea", "Equatorial Guinea", "af", ["Malabo"], 0),
  c("er", "Eritrea", "Eritrea", "af", ["Asmara"], 0),
  c("sz", "Eswatini", "Eswatini", "af", ["Mbabane", "Mbabane", ["Lobamba"]], 0, [
    "Swasiland",
    "Swaziland",
  ]),
  c("et", "Äthiopien", "Ethiopia", "af", ["Addis Abeba", "Addis Ababa"], 1),
  c("ga", "Gabun", "Gabon", "af", ["Libreville"], 0),
  c("gm", "Gambia", "Gambia", "af", ["Banjul"], 0, ["The Gambia"]),
  c("gh", "Ghana", "Ghana", "af", ["Accra"], 1),
  c("gn", "Guinea", "Guinea", "af", ["Conakry"], 0),
  c("gw", "Guinea-Bissau", "Guinea-Bissau", "af", ["Bissau"], 0),
  c("ke", "Kenia", "Kenya", "af", ["Nairobi"], 1),
  c("ls", "Lesotho", "Lesotho", "af", ["Maseru"], 0),
  c("lr", "Liberia", "Liberia", "af", ["Monrovia"], 0),
  c("ly", "Libyen", "Libya", "af", ["Tripolis", "Tripoli"], 0),
  c("mg", "Madagaskar", "Madagascar", "af", ["Antananarivo"], 1),
  c("mw", "Malawi", "Malawi", "af", ["Lilongwe"], 0),
  c("ml", "Mali", "Mali", "af", ["Bamako"], 0),
  c("mr", "Mauretanien", "Mauritania", "af", ["Nouakchott"], 0),
  c("mu", "Mauritius", "Mauritius", "af", ["Port Louis"], 0),
  c("ma", "Marokko", "Morocco", "af", ["Rabat"], 1),
  c("mz", "Mosambik", "Mozambique", "af", ["Maputo"], 0),
  c("na", "Namibia", "Namibia", "af", ["Windhoek"], 1),
  c("ne", "Niger", "Niger", "af", ["Niamey"], 0),
  c("ng", "Nigeria", "Nigeria", "af", ["Abuja"], 1),
  c("rw", "Ruanda", "Rwanda", "af", ["Kigali"], 0),
  c("st", "São Tomé und Príncipe", "São Tomé and Príncipe", "af", ["São Tomé"], 0, ["Sao Tome"]),
  c("sn", "Senegal", "Senegal", "af", ["Dakar"], 1),
  c("sc", "Seychellen", "Seychelles", "af", ["Victoria"], 0),
  c("sl", "Sierra Leone", "Sierra Leone", "af", ["Freetown"], 0),
  c("so", "Somalia", "Somalia", "af", ["Mogadischu", "Mogadishu"], 0),
  c(
    "za",
    "Südafrika",
    "South Africa",
    "af",
    ["Pretoria", "Pretoria", ["Kapstadt", "Cape Town", "Bloemfontein"]],
    1,
  ),
  c("ss", "Südsudan", "South Sudan", "af", ["Juba"], 0),
  c("sd", "Sudan", "Sudan", "af", ["Khartum", "Khartoum"], 0),
  c("tz", "Tansania", "Tanzania", "af", ["Dodoma"], 1),
  c("tg", "Togo", "Togo", "af", ["Lomé"], 0),
  c("tn", "Tunesien", "Tunisia", "af", ["Tunis"], 1),
  c("ug", "Uganda", "Uganda", "af", ["Kampala"], 0),
  c("zm", "Sambia", "Zambia", "af", ["Lusaka"], 0),
  c("zw", "Simbabwe", "Zimbabwe", "af", ["Harare"], 0),

  // Nord- und Mittelamerika, Karibik
  c(
    "ag",
    "Antigua und Barbuda",
    "Antigua and Barbuda",
    "na",
    ["Saint John’s", "Saint John’s", ["St. John's"]],
    0,
    ["Antigua"],
  ),
  c("bs", "Bahamas", "Bahamas", "na", ["Nassau"], 0, ["The Bahamas"]),
  c("bb", "Barbados", "Barbados", "na", ["Bridgetown"], 0),
  c("bz", "Belize", "Belize", "na", ["Belmopan"], 0),
  c("ca", "Kanada", "Canada", "na", ["Ottawa"], 1),
  c("cr", "Costa Rica", "Costa Rica", "na", ["San José"], 1),
  c("cu", "Kuba", "Cuba", "na", ["Havanna", "Havana", ["La Habana"]], 1),
  c("dm", "Dominica", "Dominica", "na", ["Roseau"], 0),
  c("do", "Dominikanische Republik", "Dominican Republic", "na", ["Santo Domingo"], 1, ["Dom Rep"]),
  c("sv", "El Salvador", "El Salvador", "na", ["San Salvador"], 0, ["Salvador"]),
  c("gd", "Grenada", "Grenada", "na", ["Saint George’s", "Saint George’s", ["St. George's"]], 0),
  c("gt", "Guatemala", "Guatemala", "na", ["Guatemala-Stadt", "Guatemala City", ["Guatemala"]], 0),
  c("ht", "Haiti", "Haiti", "na", ["Port-au-Prince"], 0),
  c("hn", "Honduras", "Honduras", "na", ["Tegucigalpa"], 0),
  c("jm", "Jamaika", "Jamaica", "na", ["Kingston"], 1),
  c(
    "mx",
    "Mexiko",
    "Mexico",
    "na",
    ["Mexiko-Stadt", "Mexico City", ["Ciudad de México", "Mexico"]],
    1,
  ),
  c("ni", "Nicaragua", "Nicaragua", "na", ["Managua"], 0),
  c("pa", "Panama", "Panama", "na", ["Panama-Stadt", "Panama City", ["Panama"]], 1),
  c("kn", "St. Kitts und Nevis", "Saint Kitts and Nevis", "na", ["Basseterre"], 0, [
    "Saint Kitts",
    "St Kitts",
  ]),
  c("lc", "St. Lucia", "Saint Lucia", "na", ["Castries"], 0),
  c(
    "vc",
    "St. Vincent und die Grenadinen",
    "Saint Vincent and the Grenadines",
    "na",
    ["Kingstown"],
    0,
    ["St. Vincent", "Saint Vincent"],
  ),
  c("tt", "Trinidad und Tobago", "Trinidad and Tobago", "na", ["Port of Spain"], 0, ["Trinidad"]),
  c(
    "us",
    "Vereinigte Staaten",
    "United States",
    "na",
    ["Washington, D.C.", "Washington, D.C.", ["Washington", "Washington DC"]],
    1,
    [
      "USA",
      "US",
      "Amerika",
      "America",
      "Vereinigte Staaten von Amerika",
      "United States of America",
    ],
  ),

  // Südamerika
  c("ar", "Argentinien", "Argentina", "sa", ["Buenos Aires"], 1),
  c("bo", "Bolivien", "Bolivia", "sa", ["Sucre", "Sucre", ["La Paz"]], 1),
  c("br", "Brasilien", "Brazil", "sa", ["Brasília", "Brasília", ["Brasilia"]], 1),
  c("cl", "Chile", "Chile", "sa", ["Santiago de Chile", "Santiago", ["Santiago"]], 1),
  c("co", "Kolumbien", "Colombia", "sa", ["Bogotá"], 1),
  c("ec", "Ecuador", "Ecuador", "sa", ["Quito"], 1),
  c("gy", "Guyana", "Guyana", "sa", ["Georgetown"], 0),
  c("py", "Paraguay", "Paraguay", "sa", ["Asunción"], 1),
  c("pe", "Peru", "Peru", "sa", ["Lima"], 1),
  c("sr", "Suriname", "Suriname", "sa", ["Paramaribo"], 0, ["Surinam"]),
  c("uy", "Uruguay", "Uruguay", "sa", ["Montevideo"], 1),
  c("ve", "Venezuela", "Venezuela", "sa", ["Caracas"], 1),

  // Ozeanien
  c("au", "Australien", "Australia", "oc", ["Canberra"], 1),
  c("fj", "Fidschi", "Fiji", "oc", ["Suva"], 1, ["Fiji-Inseln"]),
  c(
    "ki",
    "Kiribati",
    "Kiribati",
    "oc",
    ["South Tarawa", "South Tarawa", ["Tarawa", "Süd-Tarawa"]],
    0,
  ),
  c("mh", "Marshallinseln", "Marshall Islands", "oc", ["Majuro"], 0),
  c("fm", "Mikronesien", "Micronesia", "oc", ["Palikir"], 0, [
    "Föderierte Staaten von Mikronesien",
    "Federated States of Micronesia",
  ]),
  c("nr", "Nauru", "Nauru", "oc", ["Yaren"], 0),
  c("nz", "Neuseeland", "New Zealand", "oc", ["Wellington"], 1),
  c("pw", "Palau", "Palau", "oc", ["Ngerulmud"], 0),
  c("pg", "Papua-Neuguinea", "Papua New Guinea", "oc", ["Port Moresby"], 1, ["Papua"]),
  c("ws", "Samoa", "Samoa", "oc", ["Apia"], 0),
  c("sb", "Salomonen", "Solomon Islands", "oc", ["Honiara"], 0),
  c("to", "Tonga", "Tonga", "oc", ["Nukuʻalofa", "Nukuʻalofa", ["Nukualofa"]], 0),
  c("tv", "Tuvalu", "Tuvalu", "oc", ["Funafuti"], 0),
  c("vu", "Vanuatu", "Vanuatu", "oc", ["Port Vila"], 0),
];

export const COUNTRY_BY_CODE = new Map(COUNTRIES.map((country) => [country.code, country]));

/**
 * Flaggen, die man leicht verwechselt – bei der Auswahl kommen die falschen Antworten bevorzugt
 * von hier (fies, aber genau das macht den Reiz aus).
 */
export const SIMILAR_FLAGS: string[][] = [
  ["td", "ro", "ad", "md"],
  ["id", "mc", "pl", "sg"],
  ["nl", "lu", "py", "hr", "ru", "si", "sk", "rs"],
  ["au", "nz", "fj", "tv"],
  ["ie", "ci", "it", "ne", "in"],
  ["no", "is", "dk", "fi", "se"],
  ["sn", "ml", "gn", "cm", "bj", "gh"],
  ["ve", "co", "ec"],
  ["ar", "uy", "sv", "ni", "hn", "gt"],
  ["jo", "ps", "sd", "kw", "ae"],
  ["eg", "iq", "sy", "ye"],
  ["be", "de", "ug"],
  ["at", "lv", "lb", "pe", "ca"],
  ["hu", "bg", "ir", "tj", "it"],
  ["cz", "ph", "cu", "bs"],
  ["my", "us", "lr"],
  ["cn", "vn", "kg"],
  ["dz", "pk", "mv", "tm"],
  ["tr", "tn", "az"],
  ["gb", "au", "nz"],
  ["lt", "bo", "gh", "et"],
  ["ee", "bw", "ar"],
  ["ga", "ua", "sl"],
  ["za", "sz", "zm"],
  ["kp", "kr", "jp"],
];

/**
 * Länder ohne Umriss-Frage: winzige Staaten und weit verstreute Inselgruppen – als Umriss nur ein
 * paar Punkte, die niemand erkennen kann.
 */
export const NO_OUTLINE = new Set([
  "va",
  "mc",
  "sm",
  "nr",
  "tv",
  "mh",
  "ki",
  "fm",
  "pw",
  "to",
  "mv",
  "sc",
  "mu",
  "st",
  "km",
  "cv",
  "bb",
  "ag",
  "kn",
  "vc",
  "gd",
  "dm",
  "lc",
  "ws",
  "sb",
  "vu",
  "fj",
  "bs",
  "sg",
  "bh",
]);

/** Fragearten: Flagge, Landesumriss oder Hauptstadt. */
export type QuizKind = "flag" | "outline" | "capital";
/** Lobby: eine Art für die ganze Partie oder zufällig gemischt. */
export type QuizMode = QuizKind | "mix";
/** Welt oder ein Kontinent; „am“ = Nord- und Südamerika zusammen. */
export type QuizRegion = "world" | "eu" | "as" | "af" | "am" | "oc";
export type QuizAnswerMode = "type" | "choice";

export const QUIZ_QUESTIONS = [10, 15, 20, 30];
export const QUIZ_SECONDS = [10, 15, 20];
/** 50:50-Joker pro Spieler und Partie (nur bei der Auswahl). */
export const QUIZ_JOKERS = [0, 1, 2, 3];
/** So lange steht die Auflösung einer Frage. */
export const QUIZ_REVEAL_MS = 4_000;
/** Kurze Pause vor der ersten Frage (Countdown). */
export const QUIZ_COUNTDOWN_MS = 3_000;

/** Gehört das Land zur gewählten Region? */
export function inRegion(country: Country, region: QuizRegion): boolean {
  if (region === "world") return true;
  if (region === "am") return country.continent === "na" || country.continent === "sa";
  return country.continent === region || country.also === region;
}

/** Kann zu diesem Land eine Frage dieser Art gestellt werden? */
export function supportsKind(country: Country, kind: QuizKind): boolean {
  if (kind === "outline") return !NO_OUTLINE.has(country.code);
  if (kind === "capital") return Boolean(country.capital);
  return true;
}

/** Länder, die nach Region, Schwierigkeit und Fragenart in Frage kommen. */
export function quizPool(settings: {
  geoRegion: QuizRegion;
  geoKnownOnly: boolean;
  geoMode: QuizMode;
}): Country[] {
  const { geoRegion, geoKnownOnly, geoMode } = settings;
  return COUNTRIES.filter(
    (c) =>
      inRegion(c, geoRegion) &&
      (!geoKnownOnly || c.known) &&
      (geoMode === "mix" || supportsKind(c, geoMode)),
  );
}
