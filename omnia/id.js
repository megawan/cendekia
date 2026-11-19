// Indonesian for the places of Omnia, loaded by index.html only when the language is Indonesian.
//
//   continents  the English name of a continent to its Indonesian name
//   countries   English name | Indonesian name | Indonesian capital. Only the names that differ are listed; an empty field keeps the English one.
//   the rest    one string for each table of index.html with the same name (NATURE_DATA, CULTURE_DATA...). Its rows come in the same order
//               as the English rows, and are: name | where | the sentence that finishes "<name> adalah ..." (| language, for the peoples).
//               "where" is empty exactly when it is empty in the English row. The icon is the English one.
// No row may contain ; or |.
window.OMNIA_ID = {
  continents: { Africa: 'Afrika', Asia: 'Asia', Europe: 'Eropa', 'North America': 'Amerika Utara', Oceania: 'Oseania', 'South America': 'Amerika Selatan' },

  countries: 'Afghanistan|Afganistan|;Cambodia|Kamboja|;China|Tiongkok|;Iran||Teheran;Iraq|Irak|Bagdad;Japan|Jepang|;Jordan|Yordania|;Kuwait||Kota Kuwait;Kyrgyzstan|Kirgizstan|;'
    + 'Maldives|Maladewa|;North Korea|Korea Utara|;Oman||Muskat;Philippines|Filipina|;Saudi Arabia|Arab Saudi|;Singapore|Singapura|Singapura;South Korea|Korea Selatan|;'
    + 'Syria|Suriah|Damaskus;Turkey|Turki|;United Arab Emirates|Uni Emirat Arab|;Yemen|Yaman|;'
    + 'Austria||Wina;Belgium|Belgia|Brussel;Bosnia and Herzegovina|Bosnia dan Herzegovina|;Croatia|Kroasia|;Cyprus|Siprus|Nikosia;Czechia|Ceko|Praha;Denmark||Kopenhagen;'
    + 'Finland|Finlandia|;France|Prancis|;Germany|Jerman|;Greece|Yunani|Athena;Hungary|Hongaria|;Iceland|Islandia|;Ireland|Irlandia|;Italy|Italia|Roma;Lithuania|Lituania|;'
    + 'Luxembourg|Luksemburg|Luksemburg;Monaco|Monako|Monako;Netherlands|Belanda|;North Macedonia|Makedonia Utara|;Norway|Norwegia|;Poland|Polandia|Warsawa;Portugal||Lisboa;'
    + 'Romania|Rumania|Bukares;Russia|Rusia|Moskwa;Serbia||Beograd;Slovakia|Slowakia|;Spain|Spanyol|;Sweden|Swedia|;Switzerland|Swiss|;Ukraine|Ukraina|;'
    + 'United Kingdom|Britania Raya|;Vatican City|Kota Vatikan|Kota Vatikan;'
    + 'Algeria|Aljazair|Aljir;Cabo Verde|Tanjung Verde|;Cameroon|Kamerun|;Central African Republic|Republik Afrika Tengah|;Comoros|Komoro|;Congo|Kongo|;DR Congo|RD Kongo|;'
    + 'Côte d’Ivoire|Pantai Gading|;Djibouti|Jibuti|Jibuti;Egypt|Mesir|Kairo;Equatorial Guinea|Guinea Khatulistiwa|;Ethiopia|Etiopia|;Madagascar|Madagaskar|;'
    + 'Morocco|Maroko|;Mozambique|Mozambik|;São Tomé and Príncipe|Sao Tome dan Principe|Sao Tome;South Africa|Afrika Selatan|;South Sudan|Sudan Selatan|;'
    + 'Antigua and Barbuda|Antigua dan Barbuda|;Canada|Kanada|;Cuba|Kuba|;Dominican Republic|Republik Dominika|;Guatemala||Kota Guatemala;Jamaica|Jamaika|;'
    + 'Mexico|Meksiko|Kota Meksiko;Panama||Kota Panama;Saint Kitts and Nevis|Saint Kitts dan Nevis|;Saint Vincent and the Grenadines|Saint Vincent dan Grenadine|;'
    + 'Trinidad and Tobago|Trinidad dan Tobago|;United States|Amerika Serikat|;'
    + 'Brazil|Brasil|;Chile|Cile|;Colombia|Kolombia|;Ecuador|Ekuador|;'
    + 'Marshall Islands|Kepulauan Marshall|;Micronesia|Mikronesia|;New Zealand|Selandia Baru|;Papua New Guinea|Papua Nugini|;Solomon Islands|Kepulauan Solomon|',

  nature: {
    mountain: 'Gunung Everest|Asia|gunung tertinggi di Bumi, di Pegunungan Himalaya di Asia.;Mont Blanc|Eropa|gunung tertinggi di Pegunungan Alpen, di perbatasan Prancis dan Italia.;'
      + 'Gunung Kilimanjaro|Afrika|gunung tertinggi di Afrika, di Tanzania.;Aconcagua|Amerika Selatan|gunung tertinggi di Amerika Selatan, di Argentina.;'
      + 'Denali|Amerika Utara|gunung tertinggi di Amerika Utara, di Alaska.;Gunung Fuji|Asia|gunung berapi terkenal dan gunung tertinggi di Jepang.;'
      + 'Gunung Elbrus|Eropa|gunung tertinggi di Eropa, di Rusia.;Gunung Kosciuszko|Oseania|gunung tertinggi di daratan utama Australia.;'
      + 'Puncak Jaya||gunung tertinggi di Indonesia, di Papua.',
    river: 'Sungai Nil|Afrika|salah satu sungai terpanjang di dunia. Sungai ini mengalir melalui Mesir, di Afrika.;Sungai Amazon|Amerika Selatan|sungai yang membawa air paling banyak di dunia, di Amerika Selatan.;'
      + 'Sungai Yangtze|Asia|sungai terpanjang di Asia, di Tiongkok.;Sungai Mississippi|Amerika Utara|sungai besar di Amerika Serikat, di Amerika Utara.;'
      + 'Sungai Kongo|Afrika|sungai raksasa di tengah Afrika.;Sungai Danube|Eropa|sungai yang mengalir melewati banyak negara di Eropa, termasuk Austria dan Hongaria.;'
      + 'Sungai Gangga|Asia|sungai suci di India, di Asia.;Sungai Mekong|Asia|sungai panjang di Asia Tenggara, dari Tiongkok sampai Vietnam.;'
      + 'Sungai Volga|Eropa|sungai terpanjang di Eropa, di Rusia.;Sungai Murray|Oseania|sungai terpanjang di Australia.',
    lake: 'Danau Victoria|Afrika|danau terbesar di Afrika.;Danau Superior|Amerika Utara|danau terbesar di antara Danau-Danau Besar, di antara Amerika Serikat dan Kanada.;'
      + 'Danau Baikal|Asia|danau terdalam di dunia, di Rusia.;Danau Titicaca|Amerika Selatan|danau raksasa di Pegunungan Andes yang tinggi, di antara Peru dan Bolivia.;'
      + 'Danau Toba|Asia|danau vulkanik terbesar di dunia, di Pulau Sumatra, Indonesia.;Danau Ladoga|Eropa|danau terbesar di Eropa, di Rusia.;'
      + 'Danau Chad|Afrika|danau di Afrika yang menjadi jauh lebih kecil dari tahun ke tahun.;Danau Eyre|Oseania|danau garam raksasa di Australia yang sering kering.',
    desert: 'Gurun Sahara|Afrika|gurun panas terbesar di dunia, di Afrika bagian utara.;Gurun Gobi|Asia|gurun dingin di Mongolia dan Tiongkok.;'
      + 'Gurun Arab|Asia|gurun luas yang menutupi sebagian besar Semenanjung Arab, di Asia.;Gurun Kalahari|Afrika|gurun berpasir di Afrika bagian selatan.;'
      + 'Gurun Atacama|Amerika Selatan|salah satu tempat terkering di Bumi, di Cile.;Gurun Victoria Besar|Oseania|gurun terbesar di Australia.;'
      + 'Gurun Thar|Asia|gurun di antara India dan Pakistan.;Gurun Mojave|Amerika Utara|gurun di barat daya Amerika Serikat.;'
      + 'Gurun Taklamakan|Asia|gurun berpasir di Tiongkok bagian barat.',
    ocean: 'Samudra Pasifik||samudra terbesar dan terdalam di Bumi.;Samudra Atlantik||samudra di antara benua Amerika, Eropa, dan Afrika.;'
      + 'Samudra Hindia||samudra di selatan Asia, di antara Afrika dan Australia. Indonesia terletak di tepinya.;Samudra Arktik||samudra terkecil dan terdingin, di sekitar Kutub Utara.',
    sea: 'Laut Tengah||laut di antara Eropa, Afrika, dan Asia.;Laut Karibia||laut hangat di dekat Amerika Tengah, Kuba, dan Jamaika.;'
      + 'Laut Merah||laut panjang yang sempit di antara Afrika dan Asia.;Laut Cina Selatan||laut besar di samping Asia Tenggara, di utara Indonesia.;'
      + 'Laut Utara||laut di antara Britania Raya dan daratan Eropa lainnya.;Laut Hitam||laut di antara Eropa dan Asia.;'
      + 'Laut Arab||bagian dari Samudra Hindia, di antara India dan Jazirah Arab.;Laut Karang||laut di samping Australia, rumah bagi Great Barrier Reef.;'
      + 'Laut Jawa||laut di Indonesia, di utara Pulau Jawa.'
  },

  culture: {
    house: 'Rumah Gadang|Sumatera Barat|rumah besar suku Minangkabau, dengan atap yang melengkung ke atas seperti tanduk kerbau.;'
      + 'Rumah Bolon|Sumatera Utara|rumah adat suku Batak, dibangun di atas tiang tinggi di Pulau Samosir.;'
      + 'Tongkonan|Sulawesi Selatan|rumah suku Toraja, dengan atap berbentuk perahu.;'
      + 'Honai|Papua Pegunungan|rumah bulat beratap jerami, dibuat agar hangat di dataran tinggi Papua yang sejuk.;'
      + 'Rumah Betang|Kalimantan Tengah|rumah suku Dayak yang sangat panjang, tempat banyak keluarga tinggal bersama.;'
      + 'Rumah Joglo|Jawa Tengah|rumah adat Jawa, dengan atap tinggi di bagian tengahnya.',
    dance: 'Kecak|Bali|tarian Bali yang dibawakan puluhan laki-laki duduk melingkar sambil menyanyikan "cak, cak, cak".;'
      + 'Saman|Aceh|tarian dari Aceh yang penarinya duduk berbaris, bertepuk tangan, dan bergoyang sangat cepat.;'
      + 'Reog Ponorogo|Jawa Timur|tarian dengan topeng singa raksasa yang dihiasi bulu burung merak.;'
      + 'Jaipong|Jawa Barat|tarian lincah dari suku Sunda di Jawa Barat.;'
      + 'Pakarena|Sulawesi Selatan|tarian lembut dan anggun dari suku Makassar di Sulawesi Selatan.;'
      + 'Cakalele|Maluku Utara|tarian perang dengan pedang dan perisai, dari Kepulauan Maluku.;'
      + 'Yospan|Papua|tarian kelompok yang riang dari Papua.',
    food: 'Rendang|Sumatera Barat|daging sapi yang dimasak berjam-jam dalam santan dan rempah-rempah, dari suku Minangkabau.;'
      + 'Pempek|Sumatera Selatan|kue ikan dengan kuah cuko yang asam dan pedas, dari Palembang.;'
      + 'Gudeg|DI Yogyakarta|sayur nangka muda yang manis, dari Yogyakarta.;'
      + 'Soto Banjar|Kalimantan Selatan|sup ayam yang harum dari Banjarmasin.;'
      + 'Papeda|Papua Selatan|bubur lengket dari sagu, dimakan di Papua dan Maluku.;'
      + 'Tinutuan|Sulawesi Utara|bubur sayur dari Manado, juga disebut bubur Manado.',
    instrument: 'Angklung|Jawa Barat|tabung bambu yang berbunyi bila digoyangkan, dari Jawa Barat.;'
      + 'Gamelan||orkestra gong dan xilofon logam, dimainkan di Jawa dan Bali.;'
      + 'Sasando|Nusa Tenggara Timur|kecapi dengan penutup daun lontar, dari Pulau Rote.;'
      + 'Kolintang|Sulawesi Utara|bilah-bilah kayu yang dimainkan seperti xilofon, dari Minahasa.;'
      + 'Sape|Kalimantan Timur|kecapi suku Dayak, dimainkan dengan memetik senarnya.;'
      + 'Tifa||gendang dari Maluku dan Papua.',
    cloth: 'Batik||kain yang dihias dengan menggambar corak memakai lilin lalu mencelupnya dengan warna. Batik terkenal di Jawa.;'
      + 'Ulos|Sumatera Utara|kain tenun suku Batak, yang diberikan sebagai hadiah pada hari-hari istimewa.;'
      + 'Songket|Sumatera Selatan|kain yang ditenun dengan benang emas atau perak, terkenal di Palembang.;'
      + 'Tenun Ikat Sumba|Nusa Tenggara Timur|kain tenun dari benang yang dicelup sebelum ditenun, dengan corak hewan, dari Sumba.;'
      + 'Noken|Papua Tengah|tas rajut dari Papua yang digantung di dahi untuk membawa barang.;'
      + 'Sasirangan|Kalimantan Selatan|kain berwarna-warni dari Banjarmasin, dengan corak yang dibuat dengan mengikat dan menjahit sebelum dicelup.'
  },

  animals: {
    rainforest: 'Orangutan|Asia|kera berbulu merah yang tinggal di hutan hujan Kalimantan dan Sumatra, di Indonesia.;'
      + 'Jaguar|Amerika Selatan|kucing liar terbesar di benua Amerika. Ia berburu di hutan hujan Amazon.;'
      + 'Gorila|Afrika|kera terbesar. Ia tinggal di hutan-hutan Afrika bagian tengah.;'
      + 'Makaw|Amerika Selatan|burung beo besar yang berwarna-warni dari hutan hujan Amazon.;'
      + 'Kungkang||hewan lamban yang bergelantungan terbalik di pohon hutan hujan Amerika Tengah dan Amerika Selatan.;'
      + 'Burung cenderawasih||burung dengan bulu yang menakjubkan, ditemukan di hutan hujan Papua.',
    savanna: 'Singa|Afrika|raja savana, kucing besar yang hidup dalam kelompok keluarga yang disebut kawanan.;'
      + 'Gajah|Afrika|hewan darat terbesar. Gajah yang satu ini hidup di savana Afrika.;'
      + 'Jerapah|Afrika|hewan tertinggi di dunia. Ia memakan daun dari puncak pohon di savana Afrika.;'
      + 'Kanguru|Oseania|hewan yang melompat di padang rumput Australia dan membawa anaknya di dalam kantong.;'
      + 'Bison|Amerika Utara|hewan raksasa berbulu lebat yang hidup di padang rumput Amerika Utara.;'
      + 'Komodo|Asia|kadal terbesar di dunia. Ia hidup di beberapa pulau di Indonesia, seperti Pulau Komodo.',
    desert: 'Unta Arab|Asia|unta berpunuk satu. Ia bisa berhari-hari tanpa minum di gurun-gurun Arab.;'
      + 'Unta Baktria|Asia|unta berpunuk dua, dari Gurun Gobi yang dingin.;'
      + 'Rubah fennec|Afrika|rubah kecil bertelinga sangat besar yang tinggal di Sahara.;'
      + 'Roadrunner|Amerika Utara|burung cepat yang berlari melintasi gurun-gurun Amerika Utara.;'
      + 'Dingo|Oseania|anjing liar yang hidup di pedalaman Australia yang kering.',
    polar: 'Beruang kutub||beruang terbesar di dunia. Ia berburu anjing laut di es Arktik.;'
      + 'Rubah kutub||rubah kecil dengan bulu putih yang tebal di musim dingin. Ia hidup di Arktik yang dingin.;'
      + 'Rusa kutub||rusa yang hidup di belahan utara Eropa, Asia, dan Amerika Utara yang dingin.;'
      + 'Burung hantu salju||burung hantu putih yang hidup di tundra Arktik yang dingin.',
    ocean: 'Paus biru||hewan terbesar yang pernah hidup. Ia berenang di semua samudra.;'
      + 'Lumba-lumba||hewan pintar dan suka bermain yang melompat keluar dari laut.;'
      + 'Hiu putih besar||hiu besar bergigi tajam yang berburu di laut.;'
      + 'Penyu||kura-kura yang hidup di laut dan datang ke pantai untuk bertelur.;'
      + 'Ikan badut||ikan kecil berwarna oranye dengan garis putih yang bersembunyi di antara karang.;'
      + 'Pinguin||burung yang tidak bisa terbang tetapi pandai berenang. Jenis ini hidup di pantai Cile dan Argentina.',
    forest: 'Panda raksasa|Asia|beruang hitam putih yang memakan bambu di hutan pegunungan Tiongkok.;'
      + 'Harimau|Asia|kucing liar terbesar di dunia, berbulu oranye dengan garis hitam. Banyak yang hidup di India.;'
      + 'Macan tutul salju|Asia|kucing liar pemalu berbulu tebal yang hidup tinggi di pegunungan Asia.;'
      + 'Llama|Amerika Selatan|hewan berbulu wol yang mengangkut barang di Pegunungan Andes yang tinggi.;'
      + 'Koala|Oseania|hewan pengantuk yang hidup di pohon eukaliptus di Australia dan memakan daunnya.;'
      + 'Beruang grizzly|Amerika Utara|beruang cokelat besar yang hidup di pegunungan dan hutan Amerika Utara.'
  },

  disasters: {
    sumatra: 'Sinabung|Sumatera Utara|gunung berapi di dekat Danau Toba yang sudah meletus berkali-kali sejak 2010.;'
      + 'Marapi|Sumatera Barat|gunung berapi aktif di dekat Bukittinggi, di Sumatra Barat.;'
      + 'Kerinci||gunung berapi tertinggi di Indonesia, setinggi 3.805 meter.;'
      + 'Toba|Sumatera Utara|gunung berapi raksasa yang meletus sekitar 74.000 tahun yang lalu. Kawahnya sekarang menjadi Danau Toba.;'
      + 'Krakatau|Lampung|gunung berapi yang letusan dahsyatnya pada tahun 1883 terdengar sampai ribuan kilometer jauhnya.',
    java: 'Merapi||salah satu gunung berapi paling aktif di Indonesia, di dekat Yogyakarta.;'
      + 'Bromo|Jawa Timur|gunung berapi yang berasap di dalam kawah pasir yang sangat luas, terkenal dengan matahari terbitnya.;'
      + 'Ijen|Jawa Timur|gunung berapi dengan danau kawah berwarna toska dan api biru di malam hari.;'
      + 'Slamet|Jawa Tengah|gunung berapi tertinggi di Jawa Tengah.;'
      + 'Tangkuban Perahu|Jawa Barat|gunung berapi di dekat Bandung yang bentuknya seperti perahu terbalik.',
    nusa: 'Agung|Bali|gunung berapi tertinggi di Bali, dan gunung suci.;'
      + 'Rinjani|Nusa Tenggara Barat|gunung berapi tinggi di Lombok dengan danau kawah.;'
      + 'Tambora|Nusa Tenggara Barat|gunung berapi yang letusannya pada tahun 1815 adalah yang terbesar dalam sejarah yang tercatat.;'
      + 'Kelimutu|Nusa Tenggara Timur|gunung berapi di Flores dengan tiga danau kawah yang warnanya berbeda-beda.',
    east: 'Lokon|Sulawesi Utara|gunung berapi di samping Kota Tomohon, dekat Manado.;'
      + 'Karangetang|Sulawesi Utara|salah satu gunung berapi paling aktif di Indonesia, di Pulau Siau.;'
      + 'Gamalama|Maluku Utara|gunung berapi yang membentuk seluruh Pulau Ternate.;'
      + 'Banda Api|Maluku|gunung berapi kecil di Kepulauan Banda, tempat pala tumbuh.',
    disaster: 'Tsunami Aceh|Aceh|gelombang raksasa pada 26 Desember 2004, salah satu bencana paling mematikan dalam sejarah.;'
      + 'Gempa Nias|Sumatera Utara|gempa kuat tahun 2005 yang melanda Pulau Nias.;'
      + 'Tsunami Mentawai|Sumatera Barat|gempa dan tsunami tahun 2010 yang melanda Kepulauan Mentawai.;'
      + 'Gempa Palu|Sulawesi Tengah|gempa dan tsunami pada bulan September 2018 yang melanda Kota Palu.;'
      + 'Banjir Jakarta|DKI Jakarta|air yang kadang menggenangi sebagian Jakarta pada musim hujan.;'
      + 'Kabut asap Kalimantan|Kalimantan Tengah|asap tebal dari kebakaran hutan dan lahan gambut, kebanyakan terjadi pada musim kemarau.'
  },

  water: {
    big: 'Sumatra||pulau terbesar yang hanya dimiliki Indonesia.;Jawa||pulau dengan penduduk terbanyak di Indonesia, dan rumah bagi Jakarta.;'
      + 'Kalimantan||bagian Indonesia dari Pulau Borneo, pulau terbesar ketiga di dunia.;Sulawesi||pulau yang bentuknya seperti huruf K.;'
      + 'Papua||bagian Indonesia dari Pulau Nugini, pulau terbesar kedua di dunia.',
    small: 'Bali||pulau kecil yang terkenal dengan pura, tarian, dan pantainya.;Lombok||pulau di sebelah timur Bali, tempat Gunung Rinjani berada.;Sumbawa||pulau di antara Lombok dan Flores, dengan gunung berapi Tambora.;'
      + 'Sumba||pulau yang terkenal dengan kudanya dan kain tenun ikatnya.;Flores||pulau dengan danau berwarna Kelimutu, dan pintu gerbang menuju Komodo.;'
      + 'Timor||pulau yang dibagi antara Indonesia dan Timor-Leste.;Halmahera||pulau terbesar di Maluku Utara.;'
      + 'Seram||pulau terbesar di Maluku.;Bangka||pulau di lepas pantai timur Sumatra, terkenal dengan timah dan pantainya.;'
      + 'Nias||pulau di lepas pantai barat Sumatra, terkenal dengan selancar dan lompat batunya.',
    strait: 'Selat Malaka|Sumatra dan Semenanjung Malaya|jalur laut yang sangat sibuk.;Selat Sunda|Sumatra dan Jawa|laut sempit dengan gunung berapi Krakatau di dalamnya.;'
      + 'Selat Bali|Jawa dan Bali|laut sempit yang diseberangi kapal feri dalam waktu kurang dari satu jam.;Selat Lombok|Bali dan Lombok|jalur laut yang dalam.;'
      + 'Selat Makassar|Kalimantan dan Sulawesi|jalur laut yang lebar.;Selat Karimata|Belitung dan Kalimantan|laut yang menghubungkan Laut Jawa dan Laut Cina Selatan.',
    sea: 'Laut Jawa||laut dangkal di utara Pulau Jawa.;Laut Banda||laut dalam di Kepulauan Maluku, rumah bagi Kepulauan Banda.;'
      + 'Laut Flores||laut di antara Sulawesi dan pulau-pulau Nusa Tenggara.;Laut Sulawesi||laut di utara Sulawesi.;'
      + 'Laut Arafura||laut dangkal di antara Papua dan Australia.;Laut Timor||laut di antara Timor dan Australia.;'
      + 'Laut Natuna||laut di utara Kalimantan, di sekitar Kepulauan Natuna.;Laut Maluku||laut di antara Sulawesi dan Halmahera.'
  },

  peoples: {
    sumatra: 'Aceh|Aceh|suku yang tinggal di Aceh. "Teurimong geunaseh" artinya "terima kasih" dalam bahasa mereka.|Aceh;'
      + 'Batak|Sumatera Utara|suku yang tinggal di sekitar Danau Toba. Mereka mengucapkan "Horas!" untuk saling menyapa.|Batak;'
      + 'Nias|Sumatera Utara|suku dari Pulau Nias, terkenal dengan lompat batunya.|Nias;'
      + 'Minangkabau|Sumatera Barat|suku dari Sumatra Barat, terkenal dengan Rumah Gadang dan rendangnya. "Tarimo kasih" artinya "terima kasih".|Minang;'
      + 'Melayu|Riau|suku Melayu di Riau, yang bahasanya menjadi dasar bahasa nasional Indonesia.|Melayu',
    javabali: 'Jawa||suku terbesar di Indonesia. "Matur nuwun" artinya "terima kasih" dalam bahasa Jawa.|Jawa;'
      + 'Sunda|Jawa Barat|suku dari Jawa Barat. "Hatur nuhun" artinya "terima kasih" dalam bahasa Sunda.|Sunda;'
      + 'Betawi|DKI Jakarta|suku asli Jakarta.|Betawi;'
      + 'Madura|Jawa Timur|suku dari Pulau Madura, terkenal dengan karapan sapinya.|Madura;'
      + 'Bali|Bali|suku dari Pulau Bali, yang mengucapkan "suksma" untuk "terima kasih".|Bali',
    kalimantan: 'Dayak||suku-suku pertama di Kalimantan, yang tinggal dalam banyak kelompok dengan bahasanya masing-masing.|;'
      + 'Banjar|Kalimantan Selatan|suku dari Kalimantan Selatan, terkenal dengan pasar terapungnya.|Banjar;'
      + 'Kutai|Kalimantan Timur|suku dari Kalimantan Timur, tempat sebuah kerajaan kuno dengan nama yang sama pernah berdiri.|Kutai',
    sulawesi: 'Bugis|Sulawesi Selatan|suku dari Sulawesi Selatan, pelaut ulung yang membuat kapal pinisi.|Bugis;'
      + 'Toraja|Sulawesi Selatan|suku dari dataran tinggi Sulawesi Selatan, terkenal dengan rumah tongkonan.|Toraja;'
      + 'Mandar|Sulawesi Barat|suku dari Sulawesi Barat, pelaut dan nelayan yang terampil.|Mandar;'
      + 'Minahasa|Sulawesi Utara|suku di sekitar Manado, di Sulawesi Utara.|Minahasa;'
      + 'Gorontalo|Gorontalo|suku dari pesisir utara Sulawesi, di sekitar Kota Gorontalo.|Gorontalo',
    east: 'Sasak|Nusa Tenggara Barat|suku dari Pulau Lombok.|Sasak;Tetun|Nusa Tenggara Timur|suku dari Pulau Timor.|Tetun;'
      + 'Ambon|Maluku|suku dari Ambon dan Kepulauan Maluku, yang berbicara dalam bahasa Melayu setempat.|Melayu Ambon;'
      + 'Dani|Papua Pegunungan|suku dari Lembah Baliem di dataran tinggi Papua, yang tinggal di rumah honai.|Dani;'
      + 'Asmat|Papua Selatan|suku dari rawa-rawa di Papua bagian selatan, terkenal dengan ukiran kayunya.|Asmat'
  },

  landmarks: {
    asia: 'Borobudur|Indonesia|candi Buddha raksasa dari abad ke-9, dibangun dari batu, di Jawa Tengah.;'
      + 'Tembok Besar|Tiongkok|tembok yang sangat panjang, dibangun selama berabad-abad untuk melindungi bagian utara Tiongkok.;'
      + 'Taj Mahal|India|makam marmer putih yang dibangun pada tahun 1600-an oleh seorang kaisar untuk istrinya.;'
      + 'Angkor Wat|Kamboja|monumen keagamaan terbesar di dunia, sebuah candi raksasa.;'
      + 'Menara Petronas|Malaysia|gedung pencakar langit kembar di Kuala Lumpur yang dihubungkan oleh sebuah jembatan.;'
      + 'Burj Khalifa|Uni Emirat Arab|gedung tertinggi di dunia, di Dubai.;'
      + 'Petra|Yordania|kota kuno yang dipahat di batu berwarna merah muda.;'
      + 'Hagia Sophia|Turki|bangunan megah di Istanbul yang pernah menjadi gereja sekaligus masjid.',
    europe: 'Menara Eiffel|Prancis|menara besi di Paris yang selesai dibangun pada tahun 1889.;'
      + 'Koloseum|Italia|arena kuno raksasa di Roma tempat para gladiator dulu bertarung.;'
      + 'Big Ben|Britania Raya|lonceng terkenal di menara jam Istana Westminster di London.;'
      + 'Sagrada Família|Spanyol|gereja menakjubkan di Barcelona yang masih terus dibangun.;'
      + 'Akropolis|Yunani|kota kuno di atas bukit di Athena, dengan kuil yang bernama Parthenon.;'
      + 'Gerbang Brandenburg|Jerman|gerbang terkenal di Berlin.;'
      + 'Katedral Santo Basil|Rusia|gereja berwarna-warni dengan kubah berbentuk bawang di Moskwa.',
    africaoc: 'Piramida Giza|Mesir|makam kuno raksasa para firaun, dibangun lebih dari 4.000 tahun yang lalu.;'
      + 'Gunung Table|Afrika Selatan|gunung berpuncak datar di atas Kota Cape Town.;'
      + 'Lalibela|Etiopia|kota dengan gereja-gereja yang dipahat ke dalam batu padat.;'
      + 'Zimbabwe Raya|Zimbabwe|reruntuhan kota batu yang megah dari Abad Pertengahan.;'
      + 'Gedung Opera Sydney|Australia|bangunan terkenal dengan atap berbentuk layar, di pelabuhan Sydney.;'
      + 'Uluru|Australia|batu merah raksasa di tengah Australia, yang suci bagi suku Anangu.',
    america: 'Patung Liberty|Amerika Serikat|patung raksasa di pelabuhan New York, hadiah dari Prancis.;'
      + 'Jembatan Golden Gate|Amerika Serikat|jembatan gantung berwarna merah di San Francisco.;'
      + 'Gunung Rushmore|Amerika Serikat|gunung dengan wajah empat presiden yang dipahat di dalamnya.;'
      + 'Menara CN|Kanada|menara yang sangat tinggi di Kota Toronto.;'
      + 'Chichen Itza|Meksiko|kota Maya kuno dengan piramida besar berundak.;'
      + 'Terusan Panama|Panama|terusan yang memungkinkan kapal menyeberang dari Samudra Atlantik ke Samudra Pasifik.;'
      + 'Patung Kristus Penebus|Brasil|patung Yesus yang sangat besar di atas gunung di atas Rio de Janeiro.;'
      + 'Machu Picchu|Peru|kota Inca kuno yang tinggi di Pegunungan Andes.;'
      + 'Moai|Cile|patung kepala raksasa dari batu di Pulau Paskah.'
  },

  foods: {
    asia: 'Sushi|Jepang|gulungan atau potongan kecil nasi dengan ikan mentah atau matang dan sayuran.;'
      + 'Kimchi|Korea Selatan|sayuran fermentasi yang pedas, biasanya sawi putih, dimakan hampir setiap kali makan.;'
      + 'Pangsit|Tiongkok|bungkusan adonan berisi isian, dikukus, direbus, atau digoreng.;'
      + 'Biryani|India|nasi yang dimasak dengan rempah-rempah dan daging atau sayuran.;'
      + 'Pad Thai|Thailand|bihun goreng dengan telur, kacang, dan jeruk nipis.;'
      + 'Pho|Vietnam|sup mi dengan rempah dan daging sapi atau ayam.;'
      + 'Nasi lemak|Malaysia|nasi yang dimasak dengan santan, disajikan dengan sambal, telur, dan ikan teri.;'
      + 'Nasi goreng|Indonesia|nasi yang digoreng dengan kecap manis, sering dimakan dengan telur.;'
      + 'Kebab|Turki|daging panggang yang disajikan pada tusukan atau di dalam roti.;'
      + 'Adobo|Filipina|ayam atau babi yang dimasak dengan cuka, kecap asin, dan bawang putih.',
    europe: 'Pizza|Italia|roti pipih yang dipanggang dengan tomat dan keju, pertama kali dibuat di Napoli.;'
      + 'Croissant|Prancis|kue pastri renyah berlapis mentega yang berbentuk bulan sabit.;'
      + 'Paella|Spanyol|nasi yang dimasak dalam wajan lebar dengan makanan laut, ayam, atau sayuran, dari Valencia.;'
      + 'Ikan dan kentang goreng|Britania Raya|ikan goreng dengan kentang goreng tebal, hidangan klasik Inggris.;'
      + 'Pierogi|Polandia|pangsit berisi kentang, keju, daging, atau buah.;'
      + 'Pretzel|Jerman|roti asin berbentuk simpul, dari Bavaria.;'
      + 'Moussaka|Yunani|hidangan panggang dari terung, daging cincang, dan saus putih.;'
      + 'Wafel|Belgia|kue renyah berbentuk persegi dengan kotak-kotak yang dalam, dimakan dengan gula atau buah.;'
      + 'Goulash|Hungaria|sup atau semur kental dari daging, sayuran, dan paprika.;'
      + 'Fondue|Swiss|keju leleh tempat kamu mencelupkan roti.',
    africaoc: 'Couscous|Maroko|butiran kecil semolina yang dikukus, disajikan dengan sayuran dan daging.;'
      + 'Injera|Etiopia|roti pipih yang lembut dan asam, dipakai untuk menyendok semur.;'
      + 'Koshari|Mesir|campuran nasi, lentil, pasta, dan saus tomat yang pedas.;'
      + 'Bobotie|Afrika Selatan|hidangan panggang dari daging cincang berbumbu dengan lapisan telur di atasnya.;'
      + 'Ugali|Kenya|bubur jagung yang kental, dimakan dengan semur di Afrika Timur.;'
      + 'Nasi jollof|Nigeria|nasi yang dimasak dengan saus tomat pedas, disukai di seluruh Afrika Barat.;'
      + 'Pai daging|Australia|pai seukuran telapak tangan yang berisi daging cincang dan kuah kental.;'
      + 'Hāngī|Selandia Baru|hidangan yang dimasak dalam oven tanah, dari suku Māori.;'
      + 'Kokoda|Fiji|ikan mentah yang direndam dalam air jeruk nipis dan santan.',
    america: 'Taco|Meksiko|tortilla yang dilipat di sekeliling daging, sayuran, dan salsa.;'
      + 'Poutine|Kanada|kentang goreng dengan keju gumpal dan kuah kental, dari Quebec.;'
      + 'Hamburger|Amerika Serikat|patty daging di dalam roti bun, dengan sayuran dan saus, digemari di Amerika Serikat.;'
      + 'Ceviche|Peru|ikan mentah yang “dimasak” dalam air jeruk nipis, dengan bawang dan cabai.;'
      + 'Feijoada|Brasil|semur kacang hitam dan daging babi, sering dimakan pada hari Sabtu.;'
      + 'Empanada|Argentina|pastri panggang atau goreng yang berisi daging, keju, atau sayuran.;'
      + 'Arepa|Venezuela|kue jagung bulat yang diisi atau dimakan dengan keju.;'
      + 'Ayam jerk|Jamaika|ayam yang dilumuri rempah pedas lalu dipanggang.'
  },

  rivers: {
    river: 'Kapuas|Kalimantan Barat|sungai terpanjang di Indonesia. Sungai ini mengalir melalui Kalimantan Barat sampai ke laut dekat Pontianak.;'
      + 'Mahakam|Kalimantan Timur|sungai besar di Kalimantan Timur yang mengalir melalui Samarinda. Pesut, lumba-lumba air tawar yang langka, hidup di dalamnya.;'
      + 'Barito||sungai panjang di Kalimantan Tengah dan Selatan yang bermuara di laut dekat Banjarmasin.;'
      + 'Musi|Sumatera Selatan|sungai Palembang, yang dilintasi Jembatan Ampera.;'
      + 'Batang Hari|Jambi|sungai terpanjang di Pulau Sumatra. Sungai ini mengalir melalui Kota Jambi.;'
      + 'Kampar|Riau|sungai di Riau yang terkenal dengan Bono, gelombang pasang raksasa yang bergulung menyusuri sungai.;'
      + 'Citarum|Jawa Barat|sungai terpenting di Jawa Barat, yang mengisi tiga bendungan besar.;'
      + 'Bengawan Solo||sungai terpanjang di Pulau Jawa. Sungai ini mengalir melalui Jawa Tengah dan Jawa Timur.;'
      + 'Brantas|Jawa Timur|sungai di Jawa Timur yang mengalir melewati Malang dan Kediri sampai ke laut dekat Surabaya.;'
      + 'Digul|Papua Selatan|sungai panjang di Papua bagian selatan yang mengalir melalui rawa dan hutan hujan.;'
      + 'Mamberamo|Papua|sungai terbesar di Papua bagian utara. Sungai ini mengalir melalui hutan hujan sampai ke laut.',
    lakesw: 'Danau Toba|Sumatera Utara|danau terbesar di Indonesia, kawah raksasa yang dibuat oleh gunung berapi besar.;'
      + 'Danau Laut Tawar|Aceh|danau pegunungan di Aceh, di samping Kota Takengon.;'
      + 'Danau Maninjau|Sumatera Barat|danau kawah yang dalam di Sumatra Barat, dicapai lewat jalan dengan 44 kelokan tajam.;'
      + 'Danau Ranau||danau vulkanik besar di perbatasan Lampung dan Sumatra Selatan.;'
      + 'Rawa Pening|Jawa Tengah|danau di Jawa Tengah yang sebagian tertutup eceng gondok.;'
      + 'Danau Batur|Bali|danau kawah di Bali, di kaki gunung berapi Batur.;'
      + 'Segara Anak|Nusa Tenggara Barat|danau kawah di dalam Gunung Rinjani, di Lombok.;'
      + 'Danau Kelimutu|Nusa Tenggara Timur|tiga danau kawah dengan warna berbeda di puncak sebuah gunung berapi di Flores.',
    lakese: 'Danau Poso|Sulawesi Tengah|danau besar dan dalam di Sulawesi Tengah.;'
      + 'Danau Matano|Sulawesi Selatan|danau terdalam di Asia Tenggara.;'
      + 'Danau Tempe|Sulawesi Selatan|danau dangkal di Sulawesi Selatan yang membesar dan mengecil mengikuti musim.;'
      + 'Danau Tondano|Sulawesi Utara|danau di dekat Manado, di dataran tinggi Minahasa.;'
      + 'Danau Limboto|Gorontalo|danau di Gorontalo yang pelan-pelan makin mengecil.;'
      + 'Danau Sentani|Papua|danau di dekat Jayapura dengan pulau-pulau kecil, tempat festival diadakan setiap tahun.;'
      + 'Danau Paniai|Papua Tengah|danau tinggi di pegunungan Papua.;'
      + 'Danau Sentarum|Kalimantan Barat|lahan basah raksasa berisi danau-danau yang terisi saat Sungai Kapuas banjir.;'
      + 'Danau Jempang|Kalimantan Timur|danau besar di lahan basah Sungai Mahakam.'
  },

  // Matahari, the planets in order, and Pluto (the order of SOLAR_DATA): name | the sentence
  solar: 'Matahari|bintang di tengah tata surya. Matahari memberi kita cahaya dan panas.;'
    + 'Merkurius|planet terkecil dan paling dekat dengan Matahari. Satu tahun di sana hanya berlangsung 88 hari.;'
    + 'Venus|planet terpanas, terbungkus awan tebal. Planet ini berputar ke arah sebaliknya.;'
    + 'Bumi|rumah kita, satu-satunya planet yang kita tahu memiliki kehidupan. Sebagian besar permukaannya tertutup air.;'
    + 'Mars|planet merah, dengan gunung berapi terbesar di tata surya.;'
    + 'Yupiter|planet terbesar. Bintik Merah Besarnya adalah badai yang lebih besar daripada Bumi.;'
    + 'Saturnus|planet dengan cincin yang indah, terbuat dari es dan batu.;'
    + 'Uranus|raksasa es yang berputar dengan posisi miring ke samping.;'
    + 'Neptunus|planet terjauh dari Matahari. Planet ini gelap, dingin, dan sangat berangin.;'
    + 'Pluto|planet kerdil kecil yang dulu disebut planet kesembilan.'
};
