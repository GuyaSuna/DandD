const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
require("dotenv/config");

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const races = [
  {
    name: "Humano",
    description: "Versatil, ambicioso y adaptable a casi cualquier camino.",
    speed: 30,
    traits: { bonuses: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 } },
    subraces: [],
  },
  {
    name: "Elfo",
    description: "Agil, perceptivo y ligado a la magia y a los bosques antiguos.",
    speed: 30,
    traits: { bonuses: { dexterity: 2 }, senses: ["vision en la oscuridad"] },
    subraces: [
      {
        name: "Alto elfo",
        description: "Educado en tradiciones arcanas y de mente aguda.",
        traits: { bonuses: { intelligence: 1 }, proficiencies: ["truco arcano"] },
      },
      {
        name: "Elfo del bosque",
        description: "Silencioso, veloz y comodo entre arboles.",
        traits: { bonuses: { wisdom: 1 }, proficiencies: ["sigilo"] },
      },
    ],
  },
  {
    name: "Enano",
    description: "Resistente, tenaz y criado entre piedra, forja y juramentos.",
    speed: 25,
    traits: { bonuses: { constitution: 2 }, resistances: ["veneno"] },
    subraces: [
      {
        name: "Enano de la colina",
        description: "Firme de espiritu y dificil de derribar.",
        traits: { bonuses: { wisdom: 1 }, extraHpPerLevel: 1 },
      },
      {
        name: "Enano de la montana",
        description: "Fuerte, marcial y acostumbrado a armaduras.",
        traits: { bonuses: { strength: 2 }, proficiencies: ["armaduras ligeras", "armaduras medias"] },
      },
    ],
  },
  {
    name: "Mediano",
    description: "Pequeno, valiente y sorprendentemente afortunado.",
    speed: 25,
    traits: { bonuses: { dexterity: 2 }, features: ["afortunado", "valiente"] },
    subraces: [
      {
        name: "Piesligeros",
        description: "Sociable, discreto y de sonrisa facil.",
        traits: { bonuses: { charisma: 1 }, proficiencies: ["sigilo social"] },
      },
      {
        name: "Fornido",
        description: "Mas resistente que otros medianos.",
        traits: { bonuses: { constitution: 1 }, resistances: ["veneno"] },
      },
    ],
  },
];

const classes = [
  {
    name: "Guerrero",
    description: "Combatiente experto, resistente y flexible en cualquier batalla.",
    hitDie: 10,
    primaryStat: "strength",
  },
  {
    name: "Mago",
    description: "Estudioso de la magia arcana, fragil pero de enorme poder.",
    hitDie: 6,
    primaryStat: "intelligence",
  },
  {
    name: "Picaro",
    description: "Especialista habilidoso, veloz y letal cuando encuentra ventaja.",
    hitDie: 8,
    primaryStat: "dexterity",
  },
  {
    name: "Clerigo",
    description: "Canaliza poder divino para sanar, proteger y castigar.",
    hitDie: 8,
    primaryStat: "wisdom",
  },
];

async function main() {
  for (const race of races) {
    const savedRace = await prisma.race.upsert({
      where: { name: race.name },
      update: {
        description: race.description,
        speed: race.speed,
        traits: race.traits,
      },
      create: {
        name: race.name,
        description: race.description,
        speed: race.speed,
        traits: race.traits,
        subraces: { create: race.subraces },
      },
    });

    for (const subrace of race.subraces) {
      await prisma.subrace.upsert({
        where: { raceId_name: { raceId: savedRace.id, name: subrace.name } },
        update: subrace,
        create: { ...subrace, raceId: savedRace.id },
      });
    }
  }

  for (const characterClass of classes) {
    await prisma.characterClass.upsert({
      where: { name: characterClass.name },
      update: characterClass,
      create: characterClass,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
