# Omnia

General knowledge for children, in English, with Pacha the llama. The topics are about places, flags, nature, culture and animals, on maps a child can drag, pinch and zoom.

## Topics and levels

| Topic | Levels | What is asked |
| --- | --- | --- |
| 🏝️ Cities of Indonesia | Sumatra, Java, Bali and Nusa Tenggara, Kalimantan, Sulawesi, Maluku and Papua, All of Indonesia | The capital of each of the 38 provinces and some other well-known cities (Bogor, Malang, Batam, Balikpapan, Nusantara, …) |
| 🌍 Capitals of the World | Southeast Asia, All of Asia, Europe (well known, all), Africa (well known, all), North America (well known, all), South America, Oceania | 193 countries: the members of the United Nations and the Vatican, except Israel, whose capital is disputed |
| 🚩 Flags of the World | The same ten regions as the capitals | The flags of the 193 countries (not Israel or Palestine), matched with their countries |
| ⛰️ Nature of the World | Mountains, Rivers, Lakes, Deserts, Oceans, Seas, All of nature | 9 mountains, 10 rivers, 8 lakes, 9 deserts, 4 oceans and 9 seas, as dots on the world map |
| 🎭 Culture of Indonesia | Traditional houses, Dances, Foods, Music instruments, Clothes and cloth, All of culture | 31 things, as dots on the map of Indonesia: Rumah Gadang, Kecak, Rendang, Angklung, Batik and more |
| 🦁 Animals of the World | Rainforests, Savannas and grasslands, Deserts, Polar lands, Oceans and coasts, Forests and mountains, All animals | 33 animals, as dots on the world map where they live |

A round has six questions (fewer when a level has fewer places), mixing three kinds:

- **Find it**: "Where is Bandung?" The child taps the dot, or for a country its shape or its capital's dot.
- **Which is it?**: one place is lit up on the map; the child picks its name from four.
- **Capital**: "What is the capital of Jawa Barat?" or "What is the capital of Kenya?", four answers, with the place lit up on the map.

- **Flags**: "Which country has this flag?" (four names), "Which one is the flag of Norway?" (four flags) and "Which country has this flag? Tap it on the map."
- **Nature**: "Where is Mount Everest?" (tap the dot), "Which river is this?" (a dot is lit up) and "Which continent is Lake Victoria in?" (not asked for oceans and seas, or for places that are not on one continent, like Puncak Jaya). A river's dot marks one spot along it, a desert's or a sea's dot its middle.
- **Culture**: "Where is Kecak from?" (tap the dot), "Which dance is from here?" (a dot is lit up) and "Which province is Kecak from?" (the other provinces come from the same part of Indonesia first). Gamelan, Tifa and Batik belong to more than one province, so they are not asked for one.
- **Animals**: "Where does the lion live?" (tap a dot where it lives), "Which animal lives here?", "Which continent does the lion live on?" (not for animals that live on more than one, or in the sea) and, in All animals, "Where does the lion live?" with a choice of habitats.

Flags that are too alike (Indonesia and Monaco; Romania, Chad and Andorra) are never offered together. Flags are emoji, so a device without flag emoji (some Windows browsers) shows two letters instead.

A wrong answer gets a second try, and a wrong tap says which place was tapped instead ("That is Malang"). A second miss shows the place on the map and a sentence to remember. Every level is open from the start.

🔎 **Explore the map** on each topic shows every place: tap a dot or a country to see its name, flag, capital and continent, its province, or what a mountain, river, lake, desert, ocean or sea is.

Where a country names more than one capital, the official one is used (Sucre for Bolivia, Pretoria for South Africa, Sri Jayawardenepura Kotte for Sri Lanka, Gitega for Burundi). Jakarta is Indonesia's capital, and Nusantara is shown as the new capital being built.

## The maps

`maps.js` holds the country shapes: the world (Natural Earth projection) and Indonesia with its neighbours (Mercator), drawn from [Natural Earth](https://www.naturalearthdata.com/) data, which is in the public domain, through the `world-atlas` package. It is made by `tools/make-maps.mjs`, which says how to run it; there is no build step for the page itself. Each map keeps its projection's scale and offset, and `project()` in `index.html` uses the same formulas to place cities and capitals from their latitude and longitude, which are written in the page (`CITY_DATA`, `COUNTRY_DATA`, `NATURE_DATA`, `CULTURE_DATA`, `ANIMAL_DATA`).

The page has one map (`MapView` in `index.html`), moved into the screen that shows it. One finger drags, two fingers pinch, the mouse wheel zooms, and the buttons zoom in, out and back to the whole level. A tap picks the nearest dot within reach of the finger, otherwise the country under it. Dots keep the same size on screen at every zoom. In a quiz the dots are labelled "Place 1", "Place 2", … for screen readers, so the label does not give the answer away; they can be reached with Tab and chosen with Enter, and the arrow keys move the map.

## Stars and stickers

Three stars for every question right on the first try, two for up to two misses, one for finishing. Eighteen travel stickers unlock as the total star count grows (141 stars at most). Days in a row are counted as in the other apps.

## Children and parents

Omnia uses the children shared by every Cendekia app (`shared/profile.js`). Each child's stars and days in a row are kept in `localStorage` under `omnia.v1.<child id>` (`best` holds the stars of each level by its id, such as `id.java`, `w.sea`, `f.sea`, `n.river`, `c.dance` or `a.savanna`; never rename them). Every finished round goes to the shared log (`Cendekia.round`) and every first miss to the shared list of things that went wrong (`Cendekia.weak`, labelled with the level and the place; flags, culture and animals levels start with "Flags: ", "Culture: " and "Animals: " so they are not mixed up with the others), so Mundia shows on the [parents' page](../parents/). The daily time limit set there applies here too.

## Sound, motion and offline

Sound effects are made with the Web Audio API; there is no voice. With "reduce motion" turned on in the device settings, all animation is off, and the map jumps instead of gliding.

`sw.js` precaches the page, `maps.js`, the icons and the shared scripts. After changing them, bump `CACHE` in `sw.js` so installed copies refresh.
