const { test, expect } = require('../support/fixtures');

// Opens one topic of Omnia ("Cities of Indonesia", "Capitals of the World", "Flags of the World", "Nature of the World",
// "Culture of Indonesia", "Animals of the World", "Volcanoes and Disasters", "Islands and Straits" or "Peoples and Languages").
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

// Plays the open level to its result: answers with the first choice or the first dots; a second miss shows the answer and a Next button.
async function playRound(page) {
  await expect(page.locator('#play')).toBeVisible();
  for (let step = 0; step < 40 && !(await page.locator('#result').isVisible()); step++) {
    if (await page.locator('#whyNext').isVisible()) { await page.locator('#whyNext').click(); continue; }
    const opt = page.locator('.opt:not([disabled])').first();
    if (await opt.count()) await opt.click();
    else await page.locator('#map circle').nth(step % 2).press('Enter');
    await page.waitForTimeout(1500);
  }
  await expect(page.locator('#result')).toBeVisible();
}
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem(window.Cendekia.key('omnia.v1'))));
const lastRound = (page) => page.evaluate(() => window.Cendekia.log(window.Cendekia.profile().id).at(-1));

test.describe('Omnia', () => {
  test('lists the nine topics and their levels', async ({ page }) => {
    await openTopic(page, 'Cities of Indonesia');
    await expect(page.locator('#levels .card')).toHaveCount(8); // Explore and seven levels
    await page.getByRole('button', { name: '← Home' }).click();
    await page.locator('#topics .card', { hasText: 'Capitals of the World' }).click();
    await expect(page.locator('#levels .card')).toHaveCount(11);
    await page.getByRole('button', { name: '← Home' }).click();
    await expect(page.locator('#topics .card')).toHaveCount(10); // nine topics and the stickers
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
});
