/** Kleine Wortlisten, damit Testbots bei Stadt Land Fluss etwas eintragen können (nur Testmodus). */

import type { SlfPreset } from "../../../shared/slf";

// prettier-ignore
export const SLF_WORDS: Partial<Record<SlfPreset, string[]>> = {
  city: [
    "Aachen", "Berlin", "Cottbus", "Dresden", "Essen", "Frankfurt", "Göttingen", "Hamburg",
    "Ingolstadt", "Jena", "Köln", "Leipzig", "München", "Nürnberg", "Oldenburg", "Potsdam",
    "Quedlinburg", "Rostock", "Stuttgart", "Trier", "Ulm", "Vechta", "Wien", "Xanten", "Ypern",
    "Zürich",
  ],
  country: [
    "Albanien", "Belgien", "Chile", "Dänemark", "Estland", "Frankreich", "Griechenland",
    "Holland", "Italien", "Japan", "Kanada", "Lettland", "Mexiko", "Norwegen", "Österreich",
    "Polen", "Rumänien", "Schweden", "Tunesien", "Ungarn", "Vietnam", "Wales", "Zypern",
  ],
  river: [
    "Aller", "Bode", "Donau", "Elbe", "Fulda", "Ganges", "Havel", "Isar", "Jangtse", "Kocher",
    "Lahn", "Main", "Neckar", "Oder", "Po", "Rhein", "Saale", "Themse", "Ulster", "Vils",
    "Weser", "Ybbs", "Zschopau",
  ],
  name: [
    "Anna", "Ben", "Clara", "David", "Emma", "Felix", "Greta", "Hannah", "Ida", "Jonas", "Karl",
    "Lena", "Max", "Nina", "Otto", "Paul", "Quentin", "Rosa", "Sophie", "Tom", "Ute", "Vincent",
    "Wilma", "Xaver", "Yannik", "Zoe",
  ],
  job: [
    "Arzt", "Bäcker", "Coach", "Dachdecker", "Elektriker", "Friseur", "Gärtner", "Hebamme",
    "Imker", "Journalist", "Koch", "Lehrer", "Maler", "Notar", "Optiker", "Pilot", "Richter",
    "Schreiner", "Tischler", "Uhrmacher", "Verkäufer", "Winzer", "Zahnarzt",
  ],
  animal: [
    "Affe", "Bär", "Chamäleon", "Dachs", "Elefant", "Fuchs", "Giraffe", "Hund", "Igel", "Jaguar",
    "Katze", "Löwe", "Maus", "Nashorn", "Otter", "Pinguin", "Qualle", "Rabe", "Schaf", "Tiger",
    "Uhu", "Vogel", "Wal", "Yak", "Zebra",
  ],
  plant: [
    "Ahorn", "Birke", "Clematis", "Distel", "Eiche", "Farn", "Geranie", "Hortensie", "Iris",
    "Jasmin", "Kaktus", "Lavendel", "Mohn", "Nelke", "Orchidee", "Palme", "Rose", "Sonnenblume",
    "Tulpe", "Veilchen", "Weide", "Zypresse",
  ],
  food: [
    "Apfel", "Brezel", "Croissant", "Döner", "Erdbeere", "Falafel", "Gulasch", "Honig", "Ingwer",
    "Joghurt", "Kartoffel", "Lasagne", "Mango", "Nudeln", "Orange", "Pizza", "Quark", "Reis",
    "Spätzle", "Tomate", "Vanilleeis", "Waffel", "Zwiebel",
  ],
  brand: [
    "Adidas", "BMW", "Coca-Cola", "Dior", "Edeka", "Fanta", "Google", "Haribo", "IKEA",
    "Jägermeister", "Kinder", "Lego", "Milka", "Nike", "Opel", "Puma", "Rolex", "Samsung",
    "Tesla", "Uber", "Volkswagen", "Würth", "Zara",
  ],
  sport: [
    "Angeln", "Basketball", "Curling", "Darts", "Eishockey", "Fußball", "Golf", "Handball",
    "Joggen", "Karate", "Leichtathletik", "Minigolf", "Nordic Walking", "Polo", "Rudern",
    "Schwimmen", "Tennis", "Volleyball", "Wasserball", "Yoga",
  ],
  thing: [
    "Ast", "Ball", "Computer", "Dose", "Eimer", "Fahrrad", "Gabel", "Hammer", "Iglu", "Jacke",
    "Kamm", "Lampe", "Messer", "Nagel", "Ofen", "Pinsel", "Radio", "Schere", "Tasse", "Uhr",
    "Vase", "Wecker", "Zange",
  ],
};
