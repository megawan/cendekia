const { test, expect } = require('../support/fixtures');

// Opens one topic of Omnia ("Cities of Indonesia", "Capitals of the World", "Flags of the World", "Nature of the World",
// "Culture of Indonesia", "Animals of the World", "Volcanoes and Disasters", "Islands and Straits", "Peoples and Languages",
// "Landmarks of the World", "Foods of the World", "Map Jigsaw", "Who Am I?", "Neighbours", "Rivers and Lakes", "Bigger or Farther?", "Island Routes", "The Solar System", "The Water Cycle", "Food Chains", "Day, Night and Seasons" or "Life Cycles").
async function openTopic(page, name) {
  await page.goto('/omnia/');
  await page.locator('#topics .card', { hasText: name }).click();
  await expect(page.locator('#topic')).toBeVisible();
}

// Whether the dot of a place lies on the land of a country shape (ISO number), in the map's own coordinates.
const onLand = (page, place, shape) => page.evaluate(([place, shape]) => {
  const svg = document.getElementById('map');
  const dot = [...svg.querySelectorAll('circle')].find((c) => c.getAttribute('aria-label') === place);
  const pt = svg.createSVGPoint();
  pt.x = +dot.getAttribute('cx'); pt.y = +dot.getAttribute('cy');
  return [...svg.querySelectorAll('path')].some((p) => p.dataset.id === shape && p.isPointInFill(pt));
}, [place, shape]);

// Whether the dot of a place lies on the land of any country.
const onAnyLand = (page, place) => page.evaluate((place) => {
  const svg = document.getElementById('map');
  const dot = [...svg.querySelectorAll('circle')].find((c) => c.getAttribute('aria-label') === place);
  const pt = svg.createSVGPoint();
  pt.x = +dot.getAttribute('cx'); pt.y = +dot.getAttribute('cy');
  return [...svg.querySelectorAll('path')].some((p) => p.isPointInFill(pt));
}, place);

// Plays the open level to its result: answers with the first choice, or presses on dots, and a second miss shows the answer and a Next button.
async function playRound(page) {
  await expect(page.locator('#play')).toBeVisible();
  for (let step = 0; step < 150 && !(await page.locator('#result').isVisible()); step++) {
    if (await page.locator('#whyNext').isVisible()) { await page.locator('#whyNext').click(); continue; }
    const opt = page.locator('.opt:not([disabled])').first();
    if (await opt.count()) { await opt.click(); await page.waitForTimeout(1500); continue; }
    const dots = page.locator('#map circle');
    await dots.nth((step * 7) % await dots.count()).press('Enter');
    await page.waitForTimeout(250);
  }
  await expect(page.locator('#result')).toBeVisible();
}
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem(window.Cendekia.key('omnia.v1'))));
const lastRound = (page) => page.evaluate(() => window.Cendekia.log(window.Cendekia.profile().id).at(-1));

test.describe('Omnia', () => {
  test('lists the twenty-two topics and their levels', async ({ page }) => {
    test.setTimeout(90000); // every return to the home screen waits for its cards to appear
    await openTopic(page, 'Cities of Indonesia');
    await expect(page.locator('#levels .card')).toHaveCount(8); // Explore and seven levels
    await page.getByRole('button', { name: '← Home' }).click();
    await page.locator('#topics .card', { hasText: 'Capitals of the World' }).click();
    await expect(page.locator('#levels .card')).toHaveCount(11);
    await page.getByRole('button', { name: '← Home' }).click();
    await expect(page.locator('#topics .card')).toHaveCount(23); // twenty-two topics and the stickers
    await page.locator('#topics .card', { hasText: 'Flags of the World' }).click();
    await expect(page.locator('#levels .card')).toHaveCount(11);
    await page.getByRole('button', { name: '← Home' }).click();
    await page.locator('#topics .card', { hasText: 'Nature of the World' }).click();
    await expect(page.locator('#levels .card')).toHaveCount(8); // Explore and seven levels
    await page.getByRole('button', { name: '← Home' }).click();
    await page.locator('#topics .card', { hasText: 'Culture of Indonesia' }).click();
    await expect(page.locator('#levels .card')).toHaveCount(7); // Explore and six levels
    await page.getByRole('button', { name: '← Home' }).click();
    await page.locator('#topics .card', { hasText: 'Animals of the World' }).click();
    await expect(page.locator('#levels .card')).toHaveCount(8); // Explore and seven levels
    await page.getByRole('button', { name: '← Home' }).click();
    await page.locator('#topics .card', { hasText: 'Volcanoes and Disasters' }).click();
    await expect(page.locator('#levels .card')).toHaveCount(7); // Explore and six levels
    await page.getByRole('button', { name: '← Home' }).click();
    await page.locator('#topics .card', { hasText: 'Islands and Straits' }).click();
    await expect(page.locator('#levels .card')).toHaveCount(6); // Explore and five levels
    await page.getByRole('button', { name: '← Home' }).click();
    await page.locator('#topics .card', { hasText: 'Peoples and Languages' }).click();
    await expect(page.locator('#levels .card')).toHaveCount(7); // Explore and six levels
    for (const [topic, levels] of [['Landmarks of the World', 6], ['Foods of the World', 6], ['Map Jigsaw', 5], ['Who Am I?', 7], ['Neighbours', 4], ['Rivers and Lakes', 5], ['Bigger or Farther?', 4], ['Island Routes', 3], ['The Solar System', 6], ['The Water Cycle', 5], ['Food Chains', 6], ['Day, Night and Seasons', 5], ['Life Cycles', 5]]) { // a game has no Explore card; the water cycle and food chains have Watch
      await page.getByRole('button', { name: '← Home' }).click();
      await page.locator('#topics .card', { hasText: topic }).click();
      await expect(page.locator('#levels .card')).toHaveCount(levels);
    }
  });

  test('mountains, rivers and deserts lie on land and oceans and seas do not', async ({ page }) => {
    await openTopic(page, 'Nature of the World');
    await page.getByRole('button', { name: /Explore the map/ }).click();
    for (const place of ['Mount Everest', 'Mont Blanc', 'Mount Kilimanjaro', 'Aconcagua', 'Denali', 'Mount Fuji', 'Mount Elbrus', 'Mount Kosciuszko', 'Puncak Jaya',
      'Nile', 'Amazon', 'Yangtze', 'Mississippi', 'Congo', 'Danube', 'Ganges', 'Mekong', 'Volga', 'Murray',
      'Sahara', 'Gobi', 'Arabian Desert', 'Kalahari', 'Atacama', 'Great Victoria Desert', 'Thar', 'Mojave', 'Taklamakan']) {
      expect(await onAnyLand(page, place), place).toBe(true);
    }
    for (const place of ['Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Mediterranean Sea', 'Caribbean Sea', 'Red Sea',
      'South China Sea', 'North Sea', 'Black Sea', 'Arabian Sea', 'Coral Sea', 'Java Sea']) {
      expect(await onAnyLand(page, place), place).toBe(false);
    }
    await page.locator('#map circle[aria-label="Mount Everest"]').press('Enter');
    await expect(page.locator('#xInfo')).toContainText('highest mountain on Earth');
  });

  test('culture is placed in Indonesia and says where it is from', async ({ page }) => {
    await openTopic(page, 'Culture of Indonesia');
    await page.getByRole('button', { name: /Explore the map/ }).click();
    for (const place of ['Rumah Gadang', 'Rumah Bolon', 'Tongkonan', 'Honai', 'Rumah Betang', 'Rumah Joglo', 'Kecak', 'Saman', 'Reog Ponorogo', 'Jaipong', 'Pakarena',
      'Cakalele', 'Yospan', 'Rendang', 'Pempek', 'Gudeg', 'Soto Banjar', 'Papeda', 'Tinutuan', 'Angklung', 'Gamelan', 'Sasando', 'Kolintang', 'Sape', 'Tifa',
      'Batik', 'Ulos', 'Songket', 'Tenun Ikat Sumba', 'Noken', 'Sasirangan']) {
      expect(await onLand(page, place, '360'), place).toBe(true);
    }
    await page.locator('#map circle[aria-label="Tongkonan"]').press('Enter');
    await expect(page.locator('#xInfo')).toContainText('Sulawesi Selatan');
  });

  test('land animals are on land and sea animals are not', async ({ page }) => {
    await openTopic(page, 'Animals of the World');
    await page.getByRole('button', { name: /Explore the map/ }).click();
    for (const place of ['Orangutan', 'Jaguar', 'Gorilla', 'Macaw', 'Sloth', 'Bird of paradise', 'Lion', 'Elephant', 'Giraffe', 'Kangaroo', 'Bison', 'Komodo dragon',
      'Arabian camel', 'Bactrian camel', 'Fennec fox', 'Roadrunner', 'Dingo', 'Polar bear', 'Arctic fox', 'Reindeer', 'Snowy owl',
      'Giant panda', 'Tiger', 'Snow leopard', 'Llama', 'Koala', 'Grizzly bear']) {
      expect(await onAnyLand(page, place), place).toBe(true);
    }
    for (const place of ['Blue whale', 'Dolphin', 'Great white shark', 'Sea turtle', 'Clownfish']) expect(await onAnyLand(page, place), place).toBe(false);
    await page.locator('#map circle[aria-label="Lion"]').press('Enter');
    await expect(page.locator('#xInfo')).toContainText('king of the savanna');
  });

  test('volcanoes are on land, tsunamis at sea, and each says its province', async ({ page }) => {
    await openTopic(page, 'Volcanoes and Disasters');
    await page.getByRole('button', { name: /Explore the map/ }).click();
    for (const place of ['Sinabung', 'Marapi', 'Kerinci', 'Toba', 'Merapi', 'Bromo', 'Ijen', 'Slamet', 'Tangkuban Perahu', 'Agung', 'Rinjani', 'Tambora', 'Kelimutu', 'Lokon',
      'Karangetang', 'Gamalama', 'Palu earthquake', 'Jakarta flood', 'Kalimantan haze']) expect(await onAnyLand(page, place), place).toBe(true);
    for (const place of ['Aceh tsunami', 'Nias earthquake', 'Mentawai tsunami']) expect(await onAnyLand(page, place), place).toBe(false);
    await page.locator('#map circle[aria-label="Bromo"]').press('Enter');
    await expect(page.locator('#xInfo')).toContainText('Jawa Timur');
  });

  test('islands are on land and straits and seas are not', async ({ page }) => {
    await openTopic(page, 'Islands and Straits');
    await page.getByRole('button', { name: /Explore the map/ }).click();
    for (const place of ['Sumatra', 'Java', 'Kalimantan', 'Sulawesi', 'Papua', 'Bali', 'Lombok', 'Sumba', 'Flores', 'Timor', 'Halmahera', 'Seram', 'Bangka', 'Nias']) {
      expect(await onAnyLand(page, place), place).toBe(true);
    }
    for (const place of ['Malacca Strait', 'Sunda Strait', 'Bali Strait', 'Lombok Strait', 'Makassar Strait', 'Karimata Strait', 'Java Sea', 'Banda Sea', 'Flores Sea',
      'Celebes Sea', 'Arafura Sea', 'Timor Sea', 'Natuna Sea', 'Molucca Sea']) expect(await onAnyLand(page, place), place).toBe(false);
    await page.locator('#map circle[aria-label="Sunda Strait"]').press('Enter');
    await expect(page.locator('#xInfo')).toContainText('Sumatra and Java');
  });

  test('peoples live on land and say what language they speak', async ({ page }) => {
    await openTopic(page, 'Peoples and Languages');
    await page.getByRole('button', { name: /Explore the map/ }).click();
    for (const place of ['Acehnese', 'Batak', 'Nias', 'Minangkabau', 'Malay', 'Javanese', 'Sundanese', 'Betawi', 'Madurese', 'Balinese', 'Dayak', 'Banjar', 'Kutai', 'Bugis',
      'Toraja', 'Mandar', 'Minahasa', 'Gorontalo', 'Sasak', 'Tetun', 'Ambonese', 'Dani', 'Asmat']) expect(await onAnyLand(page, place), place).toBe(true);
    await page.locator('#map circle[aria-label="Balinese"]').press('Enter');
    await expect(page.locator('#xInfo')).toContainText('suksma');
  });

  test('landmarks and foods are on land, and each says its country', async ({ page }) => {
    await openTopic(page, 'Landmarks of the World');
    await page.getByRole('button', { name: /Explore the map/ }).click();
    for (const place of ['Borobudur', 'Great Wall', 'Taj Mahal', 'Angkor Wat', 'Petronas Towers', 'Burj Khalifa', 'Petra', 'Eiffel Tower', 'Colosseum', 'Big Ben', 'Sagrada Família',
      'Acropolis', 'Brandenburg Gate', 'St Basil’s Cathedral', 'Pyramids of Giza', 'Lalibela', 'Great Zimbabwe', 'Sydney Opera House', 'Uluru', 'Mount Rushmore', 'CN Tower',
      'Chichen Itza', 'Panama Canal', 'Christ the Redeemer', 'Machu Picchu']) expect(await onAnyLand(page, place), place).toBe(true);
    await page.locator('#map circle[aria-label="Eiffel Tower"]').press('Enter');
    await expect(page.locator('#xInfo')).toContainText('France');
    await page.getByRole('button', { name: '← Back' }).click();
    await page.getByRole('button', { name: '← Home' }).click();
    await page.locator('#topics .card', { hasText: 'Foods of the World' }).click();
    await page.getByRole('button', { name: /Explore the map/ }).click();
    for (const place of ['Sushi', 'Kimchi', 'Dumplings', 'Biryani', 'Pad Thai', 'Pho', 'Nasi lemak', 'Kebab', 'Adobo', 'Pizza', 'Croissant', 'Paella', 'Fish and chips', 'Pierogi',
      'Pretzel', 'Moussaka', 'Waffles', 'Goulash', 'Fondue', 'Couscous', 'Injera', 'Koshari', 'Bobotie', 'Ugali', 'Jollof rice', 'Meat pie', 'Tacos', 'Hamburger', 'Ceviche',
      'Feijoada', 'Empanadas', 'Arepas', 'Jerk chicken']) expect(await onAnyLand(page, place), place).toBe(true);
    await page.locator('#map circle[aria-label="Sushi"]').press('Enter');
    await expect(page.locator('#xInfo')).toContainText('Japan');
  });

  test('rivers and lakes are on land, and each says its province', async ({ page }) => {
    await openTopic(page, 'Rivers and Lakes');
    await page.getByRole('button', { name: /Explore the map/ }).click();
    for (const place of ['Kapuas', 'Mahakam', 'Barito', 'Musi', 'Batang Hari', 'Kampar', 'Citarum', 'Bengawan Solo', 'Brantas', 'Digul', 'Mamberamo', 'Lake Toba', 'Lake Laut Tawar',
      'Lake Maninjau', 'Lake Ranau', 'Rawa Pening', 'Lake Batur', 'Segara Anak', 'Kelimutu lakes', 'Lake Poso', 'Lake Matano', 'Lake Tempe', 'Lake Tondano', 'Lake Limboto',
      'Lake Sentani', 'Lake Paniai', 'Lake Sentarum', 'Lake Jempang']) expect(await onAnyLand(page, place), place).toBe(true);
    await page.locator('#map circle[aria-label="Lake Toba"]').press('Enter');
    await expect(page.locator('#xInfo')).toContainText('Sumatera Utara');
  });

  test('the land borders are right, without the overseas ones', async ({ page }) => {
    await page.goto('/omnia/');
    const b = await page.evaluate(() => window.OMNIA_BORDERS);
    expect(b['458']).toEqual(['096', '360', '764']); // Malaysia: Brunei, Indonesia, Thailand
    expect(b['250']).not.toContain('076'); // France does not touch Brazil
    expect(b['076']).not.toContain('250');
    expect(b['392']).toEqual([]); // Japan is an island country
  });

  test('flags are shown for the countries, and Israel is not among them', async ({ page }) => {
    await openTopic(page, 'Flags of the World');
    await page.getByRole('button', { name: /Explore the map/ }).click();
    await expect(page.locator('#map circle[aria-label="Japan"]')).toHaveCount(1);
    await expect(page.locator('#map circle[aria-label="Israel"]')).toHaveCount(0);
    await page.locator('#map circle[aria-label="Japan"]').press('Enter');
    await expect(page.locator('#xInfo .flag')).toHaveText('🇯🇵');
  });

  test('cities and capitals are placed on the right country', async ({ page }) => {
    await openTopic(page, 'Cities of Indonesia');
    await page.getByRole('button', { name: /Explore the map/ }).click();
    for (const city of ['Jakarta', 'Bandung', 'Palangka Raya', 'Wamena']) expect(await onLand(page, city, '360'), city).toBe(true);
    await page.getByRole('button', { name: '← Back' }).click();
    await page.getByRole('button', { name: '← Home' }).click();
    await page.locator('#topics .card', { hasText: 'Capitals of the World' }).click();
    await page.getByRole('button', { name: /Explore the map/ }).click();
    for (const [country, shape] of [['France', '250'], ['Brazil', '076'], ['Japan', '392'], ['Kenya', '404'], ['Australia', '036']]) {
      expect(await onLand(page, country, shape), country).toBe(true);
    }
  });

  test('exploring shows a country and its capital', async ({ page }) => {
    await openTopic(page, 'Capitals of the World');
    await page.getByRole('button', { name: /Explore the map/ }).click();
    await page.locator('#map circle[aria-label="Japan"]').press('Enter');
    await expect(page.locator('#xInfo')).toContainText('Tokyo');
    await expect(page.locator('#map text')).toHaveText('Japan');
  });

  test('a round can be played to the end and its stars are saved', async ({ page }) => {
    await openTopic(page, 'Cities of Indonesia');
    await page.locator('#levels .card', { hasText: 'Java' }).click();
    await playRound(page);
    expect((await saved(page)).best['id.java']).toBeGreaterThanOrEqual(1);
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Java' });
  });

  test('a flags round is saved under its own level and stage', async ({ page }) => {
    await openTopic(page, 'Flags of the World');
    await page.locator('#levels .card', { hasText: 'Southeast Asia' }).click();
    await playRound(page);
    const s = await saved(page);
    expect(s.best['f.sea']).toBeGreaterThanOrEqual(1);
    expect(s.best['w.sea']).toBeUndefined();
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Flags: Southeast Asia' });
  });

  test('a nature round can be played to the end', async ({ page }) => {
    await openTopic(page, 'Nature of the World');
    await page.locator('#levels .card', { hasText: 'Mountains' }).click();
    await playRound(page);
    expect((await saved(page)).best['n.mountain']).toBeGreaterThanOrEqual(1);
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Mountains' });
  });

  test('a culture round can be played to the end', async ({ page }) => {
    await openTopic(page, 'Culture of Indonesia');
    await page.locator('#levels .card', { hasText: 'Dances' }).click();
    await playRound(page);
    expect((await saved(page)).best['c.dance']).toBeGreaterThanOrEqual(1);
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Culture: Dances' });
  });

  test('an all-animals round can be played to the end', async ({ page }) => {
    await openTopic(page, 'Animals of the World');
    await page.locator('#levels .card', { hasText: 'All animals' }).click();
    await playRound(page);
    expect((await saved(page)).best['a.all']).toBeGreaterThanOrEqual(1);
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Animals: All animals' });
  });

  test('a volcano round can be played to the end', async ({ page }) => {
    await openTopic(page, 'Volcanoes and Disasters');
    await page.locator('#levels .card', { hasText: 'Volcanoes of Java' }).click();
    await playRound(page);
    expect((await saved(page)).best['v.java']).toBeGreaterThanOrEqual(1);
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Volcanoes: Volcanoes of Java' });
  });

  test('a straits round can be played to the end', async ({ page }) => {
    await openTopic(page, 'Islands and Straits');
    await page.locator('#levels .card b', { hasText: /^Straits$/ }).click();
    await playRound(page);
    expect((await saved(page)).best['i.strait']).toBeGreaterThanOrEqual(1);
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Islands: Straits' });
  });

  test('an all-peoples round can be played to the end', async ({ page }) => {
    await openTopic(page, 'Peoples and Languages');
    await page.locator('#levels .card', { hasText: 'All peoples' }).click();
    await playRound(page);
    expect((await saved(page)).best['p.all']).toBeGreaterThanOrEqual(1);
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Peoples: All peoples' });
  });

  test('a landmarks round and a foods round are saved under their own ids', async ({ page }) => {
    await openTopic(page, 'Landmarks of the World');
    await page.locator('#levels .card', { hasText: 'Landmarks of Europe' }).click();
    await playRound(page);
    expect((await saved(page)).best['l.europe']).toBeGreaterThanOrEqual(1);
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Landmarks: Landmarks of Europe' });
  });

  test('a foods round can be played to the end', async ({ page }) => {
    await openTopic(page, 'Foods of the World');
    await page.locator('#levels .card', { hasText: 'Foods of Asia' }).click();
    await playRound(page);
    expect((await saved(page)).best['fd.asia']).toBeGreaterThanOrEqual(1);
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Foods: Foods of Asia' });
  });

  test('a jigsaw piece dropped on its place is right, and a wrong place is not', async ({ page }) => {
    await openTopic(page, 'Map Jigsaw');
    await page.locator('#levels .card', { hasText: 'South America' }).click();
    const piece = page.locator('.piece');
    const box = await piece.boundingBox();
    const grab = async () => {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await expect(piece).toHaveAttribute('data-tx', /\d+/); // where the piece belongs on the screen
      return [+(await piece.getAttribute('data-tx')), +(await piece.getAttribute('data-ty'))];
    };
    // Dropped on the sea at the corner of the map first: no country there, so it is a miss with a second try.
    await grab();
    const map = await page.locator('#mapbox').boundingBox();
    await page.mouse.move(map.x + 8, map.y + map.height - 8, { steps: 4 });
    await page.mouse.up();
    await expect(page.locator('#say')).toContainText('Not quite');
    const [tx, ty] = await grab();
    await page.mouse.move(tx, ty, { steps: 6 });
    await page.mouse.up();
    await expect(piece).toHaveClass(/placed/); // after the miss, so it counts as one miss but is placed
    await expect(page.locator('.prog i.miss')).toHaveCount(1);
  });

  test('a jigsaw round can be played to the end', async ({ page }) => {
    await openTopic(page, 'Map Jigsaw');
    await page.locator('#levels .card', { hasText: 'Southeast Asia' }).click();
    await playRound(page);
    expect((await saved(page)).best['j.sea']).toBeGreaterThanOrEqual(1);
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Jigsaw: Southeast Asia' });
  });

  test('Who Am I? gives clues one at a time and a round can be played to the end', async ({ page }) => {
    await openTopic(page, 'Who Am I?');
    await page.locator('#levels .card', { hasText: 'Well-known countries' }).click();
    await expect(page.locator('#clues li')).toHaveCount(1);
    await page.getByRole('button', { name: 'Another clue' }).click();
    await expect(page.locator('#clues li')).toHaveCount(2);
    await playRound(page);
    expect((await saved(page)).best['q.w1']).toBeGreaterThanOrEqual(1);
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Who am I: Well-known countries' });
  });

  test('a neighbours round can be played to the end', async ({ page }) => {
    await openTopic(page, 'Neighbours');
    await page.locator('#levels .card', { hasText: 'Europe' }).click();
    await expect(page.locator('#nbNote')).toContainText('Found 0 of');
    await playRound(page);
    expect((await saved(page)).best['b.europe']).toBeGreaterThanOrEqual(1);
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Neighbours: Europe' });
  });

  test('Bigger or Farther? takes the bigger island, and shows the numbers', async ({ page }) => {
    const area = { Sumatra: 443066, Java: 128297, Kalimantan: 539460, Sulawesi: 174600, Papua: 420540, Bali: 5780, Lombok: 4725, Sumbawa: 15448, Sumba: 10710, Flores: 13540,
      Timor: 30777, Halmahera: 17780, Seram: 17100, Bangka: 11910, Nias: 5121 };
    await openTopic(page, 'Bigger or Farther?');
    await page.locator('#levels .card', { hasText: 'Bigger islands' }).click();
    await expect(page.locator('#say')).toHaveText('Which island is bigger?');
    const names = await page.locator('.opt').allInnerTexts();
    expect(names).toHaveLength(2);
    const bigger = names.reduce((a, b) => (area[a] >= area[b] ? a : b));
    await page.locator('.opt', { hasText: new RegExp('^' + bigger + '$') }).click();
    await expect(page.locator('.prog i.ok')).toHaveCount(1);
    await expect(page.locator('#say')).toContainText('km²');
  });

  test('a comparing round can be played to the end', async ({ page }) => {
    await openTopic(page, 'Bigger or Farther?');
    await page.locator('#levels .card', { hasText: 'Farther capitals' }).click();
    await playRound(page);
    expect((await saved(page)).best['k.capitals']).toBeGreaterThanOrEqual(1);
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Compare: Farther capitals' });
  });

  test('Island Routes takes the islands in order, and an island out of order is a miss', async ({ page }) => {
    const via = { 'Medan to Jakarta': ['Sumatra', 'Java'], 'Palembang to Surabaya': ['Sumatra', 'Java'], 'Jakarta to Denpasar': ['Java', 'Bali'], 'Medan to Denpasar': ['Sumatra', 'Java', 'Bali'],
      'Padang to Semarang': ['Sumatra', 'Java'], 'Denpasar to Padang': ['Bali', 'Java', 'Sumatra'], 'Bandar Lampung to Bandung': ['Sumatra', 'Java'] };
    await openTopic(page, 'Island Routes');
    await page.locator('#levels .card', { hasText: 'Sumatra, Java and Bali' }).click();
    const [, from, to] = (await page.locator('#say').innerText()).match(/from (.+) to (.+)\. Tap/);
    const route = via[from + ' to ' + to];
    expect(route, from + ' to ' + to).toBeTruthy();
    const last = route[route.length - 1];
    // The last island first is out of order for a trip of more than one island: a miss, with a second try.
    await page.locator('#map circle[aria-label="' + last + '"]').press('Enter');
    await expect(page.locator('#say')).toContainText('comes later');
    for (const island of route) await page.locator('#map circle[aria-label="' + island + '"]').press('Enter');
    await expect(page.locator('.prog i.miss')).toHaveCount(1); // right in the end, but not on the first try
    await expect(page.locator('#map path.route')).toHaveAttribute('d', /^M/);
  });

  test('a routes round can be played to the end', async ({ page }) => {
    await openTopic(page, 'Island Routes');
    await page.locator('#levels .card', { hasText: 'Nusa Tenggara' }).click();
    await playRound(page);
    expect((await saved(page)).best['t.nusa']).toBeGreaterThanOrEqual(1);
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Routes: Nusa Tenggara' });
  });

  test('a rivers round can be played to the end', async ({ page }) => {
    await openTopic(page, 'Rivers and Lakes');
    await page.locator('#levels .card', { hasText: 'Rivers of Indonesia' }).click();
    await playRound(page);
    expect((await saved(page)).best['r.river']).toBeGreaterThanOrEqual(1);
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Rivers: Rivers of Indonesia' });
  });

  test('the solar system is a map of the Sun and the planets', async ({ page }) => {
    await openTopic(page, 'The Solar System');
    await page.getByRole('button', { name: /Explore the map/ }).click();
    await expect(page.locator('#map')).toHaveClass(/space/);
    await expect(page.locator('#map circle')).toHaveCount(10); // the Sun, eight planets and Pluto
    await page.locator('#map circle[aria-label="Earth"]').press('Enter');
    await expect(page.locator('#xInfo')).toContainText('our home');
  });

  test('exploring the solar system, the planets are coloured and go round the Sun; in a quiz they stand still and are not coloured', async ({ page }) => {
    await openTopic(page, 'The Solar System');
    await page.getByRole('button', { name: /Explore the map/ }).click();
    const earth = page.locator('#map circle[aria-label="Earth"]');
    expect(await earth.evaluate((c) => c.style.getPropertyValue('--fill'))).toBe('#3a9ad9');
    const at = () => earth.evaluate((c) => c.getAttribute('cx') + ',' + c.getAttribute('cy'));
    const first = await at();
    await expect.poll(at).not.toBe(first);
    await page.getByRole('button', { name: /Back|←/ }).first().click();
    await page.locator('#levels .card', { hasText: 'The planets' }).click();
    const quiz = page.locator('#map circle').nth(3);
    expect(await quiz.evaluate((c) => c.style.getPropertyValue('--fill'))).toBe('');
    const still = await quiz.evaluate((c) => c.getAttribute('cx'));
    await page.waitForTimeout(600);
    expect(await quiz.evaluate((c) => c.getAttribute('cx'))).toBe(still);
  });

  test('planets put in order, nearest to the Sun first, are right', async ({ page }) => {
    const order = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
    await openTopic(page, 'The Solar System');
    await page.locator('#levels .card', { hasText: 'Put in order' }).click();
    const names = (await page.locator('#say').innerText()).split(': ')[1].replace(/\.$/, '').split(', ');
    const sorted = names.slice().sort((a, b) => order.indexOf(a) - order.indexOf(b));
    for (const n of sorted) await page.locator('#map circle[aria-label="' + n + '"]').press('Enter');
    await expect(page.locator('.prog i.ok')).toHaveCount(1);
    await expect(page.locator('#map path.route')).toHaveAttribute('d', /^M/);
  });

  test('a planet out of order is a miss, and a bigger planet is a right answer', async ({ page }) => {
    const order = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
    const diam = { Mercury: 4879, Venus: 12104, Earth: 12742, Mars: 6779, Jupiter: 139820, Saturn: 116460, Uranus: 50724, Neptune: 49244 };
    await openTopic(page, 'The Solar System');
    await page.locator('#levels .card', { hasText: 'Put in order' }).click();
    const names = (await page.locator('#say').innerText()).split(': ')[1].replace(/\.$/, '').split(', ');
    const last = names.slice().sort((a, b) => order.indexOf(a) - order.indexOf(b)).pop();
    await page.locator('#map circle[aria-label="' + last + '"]').press('Enter');
    await expect(page.locator('#say')).toContainText('comes later');
    await page.getByRole('button', { name: '← Levels' }).click();
    await page.locator('#levels .card', { hasText: 'Bigger planets' }).click();
    const pair = await page.locator('.opt').allInnerTexts();
    await page.locator('.opt', { hasText: new RegExp('^' + pair.reduce((a, b) => (diam[a] >= diam[b] ? a : b)) + '$') }).click();
    await expect(page.locator('.prog i.ok')).toHaveCount(1);
    await expect(page.locator('#say')).toContainText('km wide');
  });

  test('a solar system round and a space round can be played to the end', async ({ page }) => {
    await openTopic(page, 'The Solar System');
    await page.locator('#levels .card', { hasText: 'The planets' }).click();
    await playRound(page);
    expect((await saved(page)).best['s.planets']).toBeGreaterThanOrEqual(1);
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Space: The planets' });
  });

  test('a Who Am I? space round can be played to the end', async ({ page }) => {
    await openTopic(page, 'Who Am I?');
    await page.locator('#levels .card b', { hasText: /^Space$/ }).click();
    await playRound(page);
    expect((await saved(page)).best['q.space']).toBeGreaterThanOrEqual(1);
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Who am I: Space' });
  });

  test('watching the water cycle, a step lights up and says what happens, and the water moves', async ({ page }) => {
    await openTopic(page, 'The Water Cycle');
    await page.getByRole('button', { name: /Watch the water cycle/ }).click();
    await expect(page.locator('#watch')).toBeVisible();
    await page.locator('#wSlot .hit[data-tab="condensation"]').press('Enter');
    await expect(page.locator('#wInfo')).toContainText('tiny drops of water');
    await expect(page.locator('#wSlot [data-stage="condensation"]')).toHaveClass(/lit/);
    await expect(page.locator('#wSlot [data-stage="evaporation"]')).toHaveClass(/dim/);
    await page.getByRole('button', { name: /3\. Precipitation/ }).click();
    await expect(page.locator('#wInfo')).toContainText('fall as rain');
    const vapour = page.locator('#wSlot .vap').first();
    const at = () => vapour.evaluate((c) => c.getAttribute('cy'));
    const first = await at();
    await expect.poll(at).not.toBe(first);
  });

  test('watching food chains, an animal can be tapped to meet it, and sparks run along the arrows', async ({ page }) => {
    await openTopic(page, 'Food Chains');
    await page.getByRole('button', { name: /Watch the food chains/ }).click();
    await page.getByRole('button', { name: /Rice field/ }).click();
    await expect(page.locator('#wSlot .nd')).toHaveCount(4);
    await page.locator('#wSlot .nd[aria-label="Snake"]').press('Enter');
    await expect(page.locator('#wInfo')).toContainText('Carnivore');
    await expect(page.locator('#wInfo')).toContainText('eaten by the eagle');
    const spark = page.locator('#wSlot .spk').first();
    const at = () => spark.evaluate((c) => c.getAttribute('cx'));
    const first = await at();
    await expect.poll(at).not.toBe(first);
  });

  test('every science question has one right choice and three different wrong ones', async ({ page }) => {
    await page.goto('/omnia/');
    const bad = await page.evaluate(() => {
      const out = [], S = window.OMNIA_SCIENCE;
      for (const id of Object.keys(S.questions)) {
        for (const q of S.questions[id]()) {
          const all = [q.right, ...q.wrong];
          if (q.wrong.length !== 3 || new Set(all).size !== 4 || all.some((a) => !a) || !q.text || !q.note) out.push(id + ': ' + q.text);
        }
      }
      return out;
    });
    expect(bad).toEqual([]);
  });

  test('a food chain question hides its answer until it is answered', async ({ page }) => {
    await openTopic(page, 'Food Chains');
    await page.locator('#levels .card', { hasText: 'Who eats whom?' }).click();
    await expect(page.locator('#sSlot .qm')).toHaveCount(1);
    const say = await page.locator('#say').innerText();
    const want = await page.evaluate((say) => {
      const S = window.OMNIA_SCIENCE;
      return S.questions['c.eats']().find((q) => q.text === say).right;
    }, say);
    await page.locator('.opt', { hasText: new RegExp('^' + want + '$') }).click();
    await expect(page.locator('.prog i.ok')).toHaveCount(1);
    await expect(page.locator('#sSlot .qm')).toHaveCount(0);
  });

  test('a water cycle round can be played to the end', async ({ page }) => {
    await openTopic(page, 'The Water Cycle');
    await page.locator('#levels .card', { hasText: 'The four steps' }).click();
    await expect(page.locator('#sSlot svg.water')).toBeVisible();
    await playRound(page);
    expect((await saved(page)).best['w.steps']).toBeGreaterThanOrEqual(1);
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Water: The four steps' });
  });

  test('a food chain round can be played to the end', async ({ page }) => {
    await openTopic(page, 'Food Chains');
    await page.locator('#levels .card', { hasText: 'Producers and eaters' }).click();
    await playRound(page);
    expect((await saved(page)).best['c.roles']).toBeGreaterThanOrEqual(1);
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Food chains: Producers and eaters' });
  });

  test('watching the sky, the Earth, the seasons and the Moon are drawn and can be stopped at a moment', async ({ page }) => {
    await openTopic(page, 'Day, Night and Seasons');
    await page.getByRole('button', { name: /Watch the Earth and the Moon/ }).click();
    // The canvas has more than one colour in it, so something was drawn.
    const drawn = () => page.locator('#wSlot canvas').evaluate((c) => {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, seen = new Set();
      for (let i = 0; i < d.length; i += 4 * 997) seen.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]);
      return seen.size;
    });
    await expect.poll(drawn).toBeGreaterThan(20);
    await page.getByRole('button', { name: 'Night', exact: true }).click();
    await expect(page.locator('#wInfo')).toContainText('dark side');
    await page.getByRole('button', { name: /The seasons/ }).click();
    await page.getByRole('button', { name: 'June', exact: true }).click();
    await expect(page.locator('#wInfo')).toContainText('north leans towards the Sun');
    await expect.poll(drawn).toBeGreaterThan(20);
    await page.getByRole('button', { name: /Moon phases/ }).click();
    await page.getByRole('button', { name: 'Full Moon', exact: true }).click();
    await expect(page.locator('#wInfo')).toContainText('whole side we see is lit');
    await page.getByRole('button', { name: /Keep going/ }).click();
    await expect(page.locator('#wInfo')).toContainText('about once a month');
  });

  test('the sky is still drawn when the device asks for less motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openTopic(page, 'Day, Night and Seasons');
    await page.getByRole('button', { name: /Watch the Earth and the Moon/ }).click();
    const colours = await page.locator('#wSlot canvas').evaluate((c) => {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, seen = new Set();
      for (let i = 0; i < d.length; i += 4 * 997) seen.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]);
      return seen.size;
    });
    expect(colours).toBeGreaterThan(20);
  });

  test('a Moon phase question shows the phase without its name', async ({ page }) => {
    await openTopic(page, 'Day, Night and Seasons');
    await page.locator('#levels .card', { hasText: 'Phases of the Moon' }).click();
    await expect(page.locator('#sSlot canvas')).toBeVisible();
    await expect(page.locator('#sSlot canvas')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('.opt')).toHaveCount(4);
  });

  test('a sky round can be played to the end', async ({ page }) => {
    await openTopic(page, 'Day, Night and Seasons');
    await page.locator('#levels .card', { hasText: 'The seasons' }).click();
    await playRound(page);
    expect((await saved(page)).best['d.seasons']).toBeGreaterThanOrEqual(1);
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Sky: The seasons' });
  });

  test('watching life cycles, a stage lights up and says what happens, and the butterfly flaps its wings', async ({ page }) => {
    await openTopic(page, 'Life Cycles');
    await page.getByRole('button', { name: /Watch the life cycles/ }).click();
    await expect(page.locator('#wSlot .stg')).toHaveCount(4);
    await page.getByRole('button', { name: 'Caterpillar', exact: true }).click();
    await expect(page.locator('#wInfo')).toContainText('eats leaves all day');
    await expect(page.locator('#wSlot .stg[data-i="1"]')).toHaveClass(/lit/);
    await expect(page.locator('#wSlot .stg[data-i="0"]')).toHaveClass(/dim/);
    const wing = page.locator('#wSlot .wingL');
    const at = () => wing.evaluate((w) => getComputedStyle(w).transform);
    const first = await at();
    await expect.poll(at).not.toBe(first);
    await page.getByRole('button', { name: /Frog/ }).first().click();
    await expect(page.locator('#wSlot .stg')).toHaveCount(5);
    await page.getByRole('button', { name: 'Tadpole', exact: true }).click();
    await expect(page.locator('#wInfo')).toContainText('breathes with gills');
    await page.getByRole('button', { name: /Keep going/ }).click();
    await expect(page.locator('#wInfo')).toContainText('frogspawn, tadpole, tadpole with legs, froglet, frog');
  });

  test('a life cycle question shows the stage without its name', async ({ page }) => {
    await openTopic(page, 'Life Cycles');
    await page.locator('#levels .card', { hasText: 'The frog' }).click();
    await expect(page.locator('#sSlot svg.life')).toBeVisible();
    await expect(page.locator('#sSlot svg.life .nm')).toHaveCount(0);
    await expect(page.locator('.opt')).toHaveCount(4);
  });

  test('a life cycle round can be played to the end', async ({ page }) => {
    await openTopic(page, 'Life Cycles');
    await page.locator('#levels .card', { hasText: 'What comes next?' }).click();
    await playRound(page);
    expect((await saved(page)).best['lc.order']).toBeGreaterThanOrEqual(1);
    expect(await lastRound(page)).toMatchObject({ app: 'omnia', stage: 'Life cycles: What comes next?' });
  });
});
