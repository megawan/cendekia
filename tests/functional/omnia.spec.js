const { test, expect } = require('../support/fixtures');

// Opens one topic of Omnia ("Cities of Indonesia", "Capitals of the World", "Flags of the World", "Nature of the World",
// "Culture of Indonesia", "Animals of the World", "Volcanoes and Disasters", "Islands and Straits", "Peoples and Languages",
// "Landmarks of the World", "Foods of the World", "Map Jigsaw", "Who Am I?" or "Neighbours").
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
  test('lists the fourteen topics and their levels', async ({ page }) => {
    await openTopic(page, 'Cities of Indonesia');
    await expect(page.locator('#levels .card')).toHaveCount(8); // Explore and seven levels
    await page.getByRole('button', { name: '← Home' }).click();
    await page.locator('#topics .card', { hasText: 'Capitals of the World' }).click();
    await expect(page.locator('#levels .card')).toHaveCount(11);
    await page.getByRole('button', { name: '← Home' }).click();
    await expect(page.locator('#topics .card')).toHaveCount(15); // fourteen topics and the stickers
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
    for (const [topic, levels] of [['Landmarks of the World', 6], ['Foods of the World', 6], ['Map Jigsaw', 5], ['Who Am I?', 6], ['Neighbours', 4]]) { // a game has no Explore card
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
});
