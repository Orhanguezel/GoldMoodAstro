#!/usr/bin/env bun

type SectionKey = "personality" | "love" | "career" | "health";

type Draft = {
  key: string;
  title: string;
  dates: string;
  meta: string;
  image: string;
  summary: string;
  main: string[];
  supplement?: string[];
  sections: Record<SectionKey, string[]>;
};

const drafts: Draft[] = [
  {
    key: "aries",
    title: "Koç",
    dates: "21 Mart - 19 Nisan",
    meta: "Ateş · Öncü · Mars",
    image: "/uploads/zodiac/aries.png",
    summary: "Koç enerjisi ilk adım, bedensel cesaret ve canlı tepkiyle kendini gösterir.",
    main: [
      "Koç burcu, hayatın kapısını bekleyerek değil, kapıya omuz vererek açan bir ritmi anlatır. Sende bu tema çalıştığında bir odadaki sessizliği ilk bozan kişi olabilirsin; bir fikrin uzun toplantılarda solmasına izin vermek yerine onu küçük bir denemeye çevirmek istersin. Bu hız yalnızca acelecilik değildir. Çoğu zaman bedenin, zihninden önce yönü algılar ve sana hareketle düşünmeyi öğretir.",
      "Bu burcun sembolik alanında rekabet, başkasını ezmekten çok kendi canlılığını ölçme yolu olarak okunabilir. Spor salonundaki ilk tekrar, zor bir konuşmada söze başlamak, yeni bir işe taslakla girmek veya bir krizde herkes duraksarken sorumluluk almak Koç dilinin günlük örnekleridir. Buradaki incelik, ateşi yakarken etrafı yakmamaktır. Gücün, ani tepkiyi bilinçli başlangıca dönüştürdüğünde daha parlak görünür.",
      "Koç rehberliği sana şunu hatırlatır: her savaş gerçek savaş değildir, her meydan okuma da cevap istemez. Bazen en cesur hamle bir adım geri çekilip neden hızlandığını fark etmektir. Öfke, sıkışmış yön duygusunun işareti olabilir; onu bastırmak yerine adlandırmak seçim alanını genişletir. Kısa bir yürüyüş, birkaç derin nefes veya eldeki işi küçük bir ilk adıma bölmek bu enerjiyi kullanılabilir hale getirir.",
      "İlişkilerde ve işte Koç temasının en temiz hali açıklıktır. Dolaylı mesajlar, uzayan ima oyunları ve belirsiz bekleyişler seni yorabilir. Fakat netlik sertlik anlamına gelmek zorunda değildir. Bir ihtiyacı doğrudan söylemek, karşı tarafı hızına zorlamadan da yapılabilir. Böylece hem kendi ateşini korur hem de ilişkide güvenli bir alan açarsın.",
      "Bu metni genel Güneş burcu rehberi olarak okuyabilirsin. Yükselen burcun, Ay yerleşimin, Mars'ın konumu ve haritadaki evler bu anlatının tonunu değiştirir. Yine de Koç sayfası, içinde nerede daha canlı, nerede daha sabırsız, nerede daha öncü davrandığını fark etmek için iyi bir başlangıç sunar. Ayda bir kez bu rehbere dönüp son haftalarda hangi konuda ilk adımı attığını ve hangi konuda gereksiz hızlandığını not etmek faydalı olabilir.",
    ],
    supplement: [
      "Koç için özgün çalışma önerisi, bir ay boyunca yalnızca başlangıçlarını izlemektir. Hangi fikre hemen atlıyorsun, hangi işi ertelediğinde içindeki basınç artıyor, hangi tartışmada hızın seni yanlış anlaşılır kılıyor? Bu notlar sana cesaretini kaybetmeden daha rafine davranmanın yolunu gösterir. Koç enerjisi bilinçli kullanıldığında kısa kıvılcımı uzun soluklu yön duygusuna çevirebilir.",
      "Bir başka Koç pratiği, haftalık 'ilk adım günlüğü' tutmaktır. Yeni başladığın şeyleri, yarım bıraktıklarını ve başkası başlatmadan sahiplendiğin işleri ayrı ayrı yazabilirsin. Böylece cesaretin hangi koşulda verimli, hangi koşulda yorucu çalıştığını görürsün. Koç için farkındalık çoğu zaman düşünceyi yavaşlatmak değil, hareketin amacını netleştirmektir.",
    ],
    sections: {
      personality: [
        "Koç kişiliği doğrudanlık, hareket ve bedensel sezgiyle okunur. Bir şeyin doğru olup olmadığını uzun analizlerden önce içindeki kıpırtıdan anlayabilirsin. Bu, düşünmediğin anlamına gelmez; düşüncen çoğu zaman eylem sırasında netleşir. İnsanlar sende hızlı karar alan, riskten kaçmayan, durumu ateşleyen bir taraf görebilir.",
        "Gölge taraf, her gecikmeyi engel gibi algılamak ve her itirazı kişisel meydan okuma saymaktır. Gün içinde üç soruluk kısa bir kontrol işine yarayabilir: Şu an gerçekten başlamam mı gerekiyor, yoksa sadece beklemekten mi sıkıldım? Bu soru, Koç ateşini daha berrak kullanmana yardım eder.",
      ],
      love: [
        "Aşkta Koç dili heyecan, açıklık ve birlikte deneyim yaratma üzerinden akar. Uzun tahmin oyunları yerine sade bir cümle, sıcak bir davet veya plansız bir yürüyüş ilişkiyi canlandırabilir. Sevildiğini hissetmek için karşı tarafın yanında canlı, istekli ve dürüst kalabilmen önemlidir.",
        "Zorlandığın yer, yakınlığı hızla başlatıp aynı hızla sabırsızlanmak olabilir. Bir ilişkinin ritmi yalnızca ilk kıvılcımdan oluşmaz; arada dinleme, bekleme ve karşı tarafın temposunu tanıma da vardır. İhtiyacını açık söyleyip cevaba alan tanıdığında bağ daha güvenli büyür.",
      ],
      career: [
        "Kariyerde Koç enerjisi girişim, kriz çözümü, liderlik, satış ve sahada karar alma gibi alanlarda parlayabilir. Boş sayfadan korkmak yerine ilk çizgiyi atmak sana yakındır. Projeleri başlatma, ekibi hareketlendirme ve kısa sürede görünür sonuç üretme becerin dikkat çekebilir.",
        "Sürdürülebilir başarı için hızın yanına takip sistemi eklemek gerekir. Başlattığın işi kimin devralacağı, hangi tarihte kontrol edeceğin ve enerjin düştüğünde neyi sadeleştireceğin baştan belliyse Koç cesareti dağılmaz. Küçük kilometre taşları motivasyonunu korur.",
      ],
      health: [
        "Ruhsal ve gündelik bakımda Koç için beden ana kapıdır. Uzun düşünce döngülerinden önce yürümek, esnemek, kısa bir antrenman yapmak veya omuzlardaki gerginliği fark etmek zihni toparlayabilir. Buradaki amaç performans değil, biriken ateşe güvenli çıkış vermektir.",
        "Duygusal olarak hızlandığında nefesi uzatmak, telefonu kısa süre kenara koymak ve karar almadan önce bedendeki basıncı izlemek destekleyici olabilir. Bu öneriler tıbbi tavsiye değil; kendini gözlemlemen için basit farkındalık pratikleridir.",
      ],
    },
  },
  {
    key: "taurus",
    title: "Boğa",
    dates: "20 Nisan - 20 Mayıs",
    meta: "Toprak · Sabit · Venüs",
    image: "/uploads/zodiac/taurus.png",
    summary: "Boğa enerjisi ritim, duyular, güven ve kalıcı değer kurma ihtiyacını anlatır.",
    main: [
      "Boğa burcu, hayatı aceleyle tüketmek yerine tadını, dokusunu ve sürekliliğini hissederek kuran bir semboldür. Sende bu tema belirginleştiğinde güvenilir bir sabah rutini, iyi hazırlanmış bir masa, toprağa temas eden bir yürüyüş veya zamana yayılan bir birikim planı içini toparlayabilir. Boğa'nın bilgeliği, hızlı parlayan şeylerden çok uzun süre elde kalan değeri tanımasında saklıdır.",
      "Bu burcun gündelik dili basit ama güçlüdür: sözünü tutmak, bedeni dinlemek, sevdiğin eşyaya özen göstermek, kaynaklarını dikkatli kullanmak. Dışarıdan bakıldığında yavaş görünmen mümkündür; oysa çoğu zaman sen, zeminin sağlam olup olmadığını anlamaya çalışırsın. Bir kararın içine sinmesi için kokusunu, ağırlığını ve pratik sonucunu sezmen gerekebilir.",
      "Boğa gölgesi, güven ihtiyacının konfor alanına fazla tutunmasıyla ortaya çıkar. Değişim geldiğinde yalnızca düzenin bozulduğunu değil, değerinin de tehdit edildiğini hissedebilirsin. Bu noktada küçük geçişler büyük kopuşlardan daha iyi çalışır. Bir alışkanlığı bir gecede değiştirmek yerine haftalık küçük bir ayar yapmak, sinir sistemine yeni zemini tanıma fırsatı verir.",
      "İlişkilerde Boğa teması sadakat, temas ve somut emekle güçlenir. Sevgi sadece söylenen sözde değil, aynı fincanı hatırlamakta, yoğun bir günün ardından sessizce yanında kalmakta, ortak hayatı güvenilir hale getirmekte görünür. Yine de sevgi adına sahiplenmeyi artırmak yerine, karşı tarafın kendi ritmini de duymak ilişkiyi daha ferah tutar.",
      "Bu rehber genel Güneş burcu çerçevesidir. Venüs, Ay ve yükselen yerleşimlerin Boğa anlatısını yumuşatabilir veya hızlandırabilir. Kendin için kullanırken şu sorulara dönebilirsin: Nerede bedenim evet diyor? Nerede sadece alıştığım için kalıyorum? Hangi değerimi bugün küçük ama somut bir davranışla besleyebilirim?",
    ],
    supplement: [
      "Boğa için iyi bir aylık gözlem, sahip olduklarınla kurduğun ilişkiye bakmaktır. Hangi eşya, alışkanlık veya bağ seni gerçekten besliyor; hangisi yalnızca tanıdık olduğu için yer kaplıyor? Bir çekmeceyi sadeleştirmek, bütçede küçük bir alan açmak veya sevdiğin bir ritüeli bilinçli tekrar etmek bu burcun somut bilgelik tarafını güçlendirir.",
      "Boğa enerjisinde bedenin verdiği evet ve hayır sinyalleri özellikle kıymetlidir. Bir planı kabul etmeden önce omuzlarının, çenenin ve nefesinin nasıl değiştiğini izleyebilirsin. Değer algın yalnızca para veya konforla sınırlı değildir; zamanını, huzurunu ve emeğini nereye koyduğun da aynı derecede önemlidir.",
      "Boğa taslağında özellikle 'yavaşlık' savunulmalıdır. Yavaşlık burada tembellik değil, bir şeyin gerçek değerini tanıma biçimidir. Toprak, seramik, kumaş, koku ve para gibi somut imgeler metni soyut burç klişesinden çıkarır. Kullanıcıya kendi temposunu küçümsemeden, ama değişime de tamamen kapanmadan ilerleme alanı açılır.",
    ],
    sections: {
      personality: [
        "Boğa kişiliğinde sakin güç, duyusal farkındalık ve dayanıklılık öne çıkar. Gürültülü motivasyonlardan çok tutarlı tekrar sana daha yakın olabilir. Bir işi aynı kaliteyle sürdürmek, başkalarının sıkıldığı yerde emek vermek ve sonuç olgunlaşana kadar beklemek güçlü taraflarındandır.",
        "Zorlandığın yer, değişimi önce kayıp gibi algılamak olabilir. Bir kapı kapanırken başka bir ritmin kurulabileceğini hatırlamak önemlidir. Kendine küçük deneme alanları açmak, inadı üretken kararlılığa dönüştürür.",
      ],
      love: [
        "Aşkta Boğa dili güvenilirlik, temas ve huzurlu zamanla anlaşılır. Güzel bir yemek, sade bir yürüyüş, hatırlanmış bir detay veya tutulmuş bir söz kalbini rahatlatabilir. Sevgi senin için soyut bir vaat değil, gündelik hayatta hissedilen bir devamlılıktır.",
        "Gölge tarafta sevdiğini korumak isterken onu sabitlemeye çalışabilirsin. İlişkinin canlı kalması için güven kadar esneklik de gerekir. Kendi ihtiyacını söylemek ve karşı tarafın değişen ihtiyacını merakla dinlemek yakınlığı güçlendirir.",
      ],
      career: [
        "Kariyerde Boğa enerjisi finans, tasarım, gastronomi, zanaat, tarım, estetik üretim ve uzun vadeli yapı kurma alanlarında destekleyici olabilir. Kalıcı sonuç, kaliteli malzeme ve istikrarlı gelir modeli ilgini çekebilir.",
        "Tekrar eden işlerde güçlü olsan da yalnızca güvenli olduğu için aynı yerde kalmak enerjini ağırlaştırabilir. Belli aralıklarla becerilerini güncellemek, konforu gelişime bağlar. Böylece sağlamlık durağanlığa dönüşmez.",
      ],
      health: [
        "Gündelik bakımda Boğa için bedenin duyuları önemli pusuladır. Yavaş yemek, yürürken çevrenin kokusunu fark etmek, uyku alanını sadeleştirmek ve dokunsal rahatlık yaratmak iç dengeyi destekleyebilir.",
        "Stres arttığında boyun, çene veya omuz bölgesinde tutunma hissi oluşabilir. Bu bir teşhis değil, dikkat edebileceğin bir sinyal olarak okunmalıdır. Nazik esneme, sıcak bir duş ve ekrandan uzak kısa molalar seni zemine döndürebilir.",
      ],
    },
  },
  {
    key: "gemini",
    title: "İkizler",
    dates: "21 Mayıs - 20 Haziran",
    meta: "Hava · Değişken · Merkür",
    image: "/uploads/zodiac/gemini.png",
    summary: "İkizler enerjisi merak, dil, bağlantı ve zihinsel esneklik üzerinden çalışır.",
    main: [
      "İkizler burcu, tek bir cevaba yerleşmekten çok sorular arasında köprü kuran bir zihni anlatır. Sende bu tema güçlü olduğunda bir podcast cümlesi, yarım kalmış bir kitap, yeni tanıştığın birinin hikayesi veya not defterine düşen küçük bir fikir bütün gününü değiştirebilir. Bilgi senin için kuru veri değil, hayatla temas kurma biçimidir.",
      "Bu burcun ritmi hareketlidir. Aynı anda birkaç pencere açık olabilir; bir konuda konuşurken başka bir ihtimali de düşünürsün. İnsanlar bunu dağınıklık sanabilir, fakat çoğu zaman sen bağlantı ararsın. İki ayrı fikri yan yana getirip üçüncü bir yol bulmak, İkizler'in günlük mucizesidir. Burada önemli olan zihnin hızını suçlamak değil, ona uygun bir düzen kurmaktır.",
      "Gölge alanda konuşmak, hissetmemek için kullanılan bir perdeye dönüşebilir. Bir şey canını sıktığında hemen açıklamak, şakalaşmak veya konuyu değiştirmek rahatlatıcı görünür; ama duygunun bedendeki izini görmeden geçmek iç gürültüyü artırabilir. Kısa sessizlikler, telefon molaları ve düşünce boşaltma notları zihnini daha şefkatli kullanmana yardım eder.",
      "İlişkilerde İkizler dili merak edilmek ve merak etmektir. Aynı hikayeyi yeni bir açıdan konuşabildiğin, mizahın alan bulduğu, zihinsel oyunların yakınlığı beslediği bağlar sana iyi gelebilir. Yine de her şeyi kelimeyle çözmeye çalışmak yerine bazen yanında kalmak, dinlemek ve cevapsızlığı paylaşmak da bağ kurmanın bir yoludur.",
      "Bu metin genel Güneş burcu okumasıdır. Haritandaki Merkür, Ay ve yükselen yerleşimleri bu anlatıya farklı tonlar ekler. Rehberi kullanırken şu soruları deneyebilirsin: Bugün hangi bilgi gerçekten işime yaradı? Hangi konuşma beni canlandırdı? Hangi konuda çok konuşup az hissettim? Bu sorular İkizler enerjisini daha bilinçli bir yola taşır.",
    ],
    supplement: [
      "İkizler için özgün pratik, bilgi diyeti tutmaktır. Bir hafta boyunca seni açan içerikleri ve seni parçalayan içerikleri ayrı ayrı yazabilirsin. Böylece merakın rastgele akışta kaybolmaz; seçilmiş sorulara dönüşür. Bir konuşmadan sonra yalnızca ne öğrendiğini değil, o konuşmanın sende hangi duyguyu hareketlendirdiğini de not etmek zihni kalbe bağlar.",
      "İkizler enerjisi için küçük bir yöntem de 'tek cümle özeti' çalışmasıdır. Uzun bir sohbetin, okuduğun yazının veya karışık bir fikrin sonunda onu tek cümleye indir. Bu, zihinsel hızını kısıtlamaz; aksine dağınık bağlantıları daha anlaşılır bir çizgiye taşır. Böylece merakın başkaları için de paylaşılabilir hale gelir.",
      "İkizler taslağında ses, defter, pencere, kısa yol ve soru imgeleri kullanılabilir. Bu burç için bilgi, rafta duran bir kitap değil, insanlar arasında dolaşan canlı bir akımdır. Metin, kullanıcıyı daha çok tüketmeye değil, duyduğu ve öğrendiği şeyleri seçmeye, sadeleştirmeye ve anlamlı bağlantıya dönüştürmeye çağırmalıdır.",
    ],
    sections: {
      personality: [
        "İkizler kişiliğinde merak, çeviklik ve anlatma isteği belirgindir. Yeni bir ortama girdiğinde önce insanların dilini, jestlerini ve aralarındaki görünmez bağlantıları okuyabilirsin. Sıkıcı görünen bir konudan bile ilginç bir ayrıntı çıkarma yeteneğin olabilir.",
        "Gölge taraf, her seçeneği açık tutarken hiçbirine yeterince temas etmemektir. Günlük hayatta üç öncelik belirlemek ve diğer fikirleri not defterine park etmek zihnini rahatlatabilir. Böylece hareket kaybolmaz, yön kazanır.",
      ],
      love: [
        "Aşkta İkizler için sohbet, mizah ve zihinsel tazelik önemlidir. Partnerinle küçük keşifler yapmak, birbirinize soru sormak, yeni bir yeri birlikte denemek yakınlığı besleyebilir. Tekdüze iletişim zamanla enerjini düşürebilir.",
        "Zorlandığın alan, duygusal yoğunluk arttığında hafifliğe kaçmak olabilir. Her konuşmanın parlak olması gerekmez; bazen sade bir cümle, uzun açıklamalardan daha çok yakınlık kurar. Dinlemek de iletişimin aktif bir parçasıdır.",
      ],
      career: [
        "Kariyerde İkizler enerjisi yazı, eğitim, sosyal medya, satış, çeviri, araştırma, podcast, haber ve çoklu proje koordinasyonu gibi alanlarda akabilir. Hızlı öğrenme ve bilgiyi başkasına anlaşılır aktarma güçlü yanlarındandır.",
        "Verimini korumak için proje sayısını görünür hale getirmek önemlidir. Açık sekmeler yalnızca bilgisayarda değil zihinde de çoğalabilir. Haftalık kısa plan, iletişim takvimi ve net teslim tarihleri yeteneğini toplar.",
      ],
      health: [
        "Gündelik bakımda İkizler için zihinsel boşaltma değerlidir. Sabah üç sayfa serbest yazı, gün içinde ekrandan uzak kısa yürüyüş ve akşam bilgi tüketimini azaltmak sinir sistemini sakinleştirebilir.",
        "Nefesin hızlandığını, omuzların yükseldiğini veya aynı düşüncenin dönüp durduğunu fark edersen bunu durma daveti gibi okuyabilirsin. Bu öneriler tıbbi yönlendirme değil, kendini gözlemleme pratiğidir.",
      ],
    },
  },
  {
    key: "cancer",
    title: "Yengeç",
    dates: "21 Haziran - 22 Temmuz",
    meta: "Su · Öncü · Ay",
    image: "/uploads/zodiac/cancer.png",
    summary: "Yengeç enerjisi hafıza, aidiyet, koruma ve duygusal güvenlik arayışını anlatır.",
    main: [
      "Yengeç burcu, dış dünyanın gürültüsü içinde iç evi korumayı öğrenen bir semboldür. Sende bu tema çalıştığında eski bir fotoğraf, tanıdık bir koku, sevdiklerin için hazırladığın bir sofra veya eve döndüğünde hissettiğin sessizlik bütün ruh halini değiştirebilir. Hafızan yalnızca geçmişi saklamaz; bugün kime, neye ve hangi ortama güvenebileceğini de işaret eder.",
      "Bu burcun gücü yumuşak görünse de pasif değildir. Yengeç suyu akarken yön verir, korur, büyütür ve gerektiğinde kabuğunu kullanır. Bir arkadaşının duygusunu fark etmek, aile içinde görünmeyen emeği üstlenmek, ekibin moralini sezmek veya yeni bir başlangıcı güvenli hale getirmek bu enerjinin günlük örnekleridir.",
      "Gölge tarafta içe çekilmek, açık konuşmak yerine alınganlıkla susmak veya geçmişteki bir kırgınlığı bugünün üzerine taşımak mümkündür. Duygunu küçümsemek yerine ona isim vermek, ama her duyguyu da tek gerçek sanmamak denge getirir. 'Şu an ne hissediyorum, bu his bana hangi ihtiyacı gösteriyor?' sorusu Yengeç için güçlü bir anahtar olabilir.",
      "İlişkilerde Yengeç teması hatırlanmak, önemsenmek ve duygusal olarak güvenli hissetmek ister. Büyük gösterilerden çok içten bir mesaj, zor günde yanında kalınması veya ev hissi veren küçük bir ritüel kalbini açabilir. Fakat korumakla kontrol etmek arasındaki çizgiyi fark etmek ilişkiyi daha sağlıklı tutar.",
      "Bu rehber genel Güneş burcu anlatısıdır. Ay burcu, yükselen ve dördüncü ev vurguları Yengeç temasını belirginleştirebilir. Kendin için kullanırken şu sorulara dönebilirsin: Nerede gerçekten güvendeyim? Nerede eski bir anı bugünkü kararımı etkiliyor? Kime bakım verirken kendimi unutuyorum?",
    ],
    supplement: [
      "Yengeç için aylık çalışma, ev hissini yalnızca mekanda değil bedende aramaktır. Hangi insanın yanında omuzların düşüyor, hangi ortamdan sonra kabuğuna çekiliyorsun, hangi anı bugünkü kararına fazla karışıyor? Bu sorular duygusal hafızanı yük olmaktan çıkarıp incelikli bir pusulaya dönüştürebilir.",
      "Yengeç enerjisinde bakım verme ile kendini unutma arasındaki çizgi sık sık kontrol edilmeye değer. Birine destek olduktan sonra kendi ihtiyacını da yazmak, görünmeyen emeği görünür kılar. Böylece şefkatin tek yönlü akmaz; senin iç evini de besleyen karşılıklı bir düzene dönüşür.",
      "Yengeç taslağında ev, kabuk, mutfak, su bardağı, eski fotoğraf ve gece lambası gibi imgeler kullanılabilir. Bu imgeler nostaljiyi ağırlaştırmak için değil, güven ihtiyacını somutlaştırmak içindir. Kullanıcıya geçmişi inkar etmeden bugünkü ihtiyacını ayırma, bakım verirken kendi merkezini de koruma alanı açılır.",
    ],
    sections: {
      personality: [
        "Yengeç kişiliğinde sezgi, koruyuculuk ve duygusal hafıza öne çıkar. İnsanların söylediklerinden çok söylemediklerini duyabilirsin. Bir ortamın güvenli olup olmadığını çoğu zaman mantıksal açıklamadan önce içindeki çekilme veya açılma hissiyle anlarsın.",
        "Zorlandığın yer, hassasiyetini zayıflık gibi görmek veya kabuğa çekildikten sonra kimsenin seni anlamasını beklemek olabilir. Duygunu sade bir cümleyle ifade etmek, korunma ihtiyacını ilişki kurma becerisine dönüştürür.",
      ],
      love: [
        "Aşkta Yengeç için samimiyet, hatırlanmak ve duygusal süreklilik değerlidir. Partnerinin küçük detayları fark etmesi, yanında savunmasız kalabilmen ve ortak bir yuva hissi kurmanız bağı derinleştirebilir.",
        "Gölge tarafta geçmiş kırgınlıkları bugünkü ilişkiye taşıyabilirsin. Yeni bir yakınlığa eski kanıtlarla yaklaşmak yerine, o anki davranışı ayrı değerlendirmek ferahlık getirir. Güven yavaş kurulabilir; bu, onun eksik olduğu anlamına gelmez.",
      ],
      career: [
        "Kariyerde Yengeç enerjisi bakım, danışmanlık, psikososyal destek, konaklama, aile işletmeleri, arşiv, mutfak, emlak ve topluluk yönetimi gibi alanlarda çalışabilir. İnsan ihtiyaçlarını sezmek önemli yeteneğindir.",
        "Profesyonel alanda sınır çizmek özellikle önemlidir. Her duygusal ihtiyacı üstlenmek seni yorabilir. İş tanımını, mesai sınırını ve geri çekilme zamanını açık tutmak verimini korur.",
      ],
      health: [
        "Gündelik bakımda Yengeç için güvenli alan düzeni destekleyicidir. Evde küçük bir köşe, sakin ışık, suyla temas, duygu günlüğü veya sevdiğin bir tarif iç dünyanı toparlayabilir.",
        "Duygu yoğunlaştığında onu bedende nerede hissettiğini gözlemlemek faydalı olabilir. Bu tıbbi bir yorum değil, farkındalık çalışmasıdır. İhtiyacını adlandırıp kendine yumuşak bir sınır koymak seni rahatlatabilir.",
      ],
    },
  },
];

const more: Draft[] = [
  build("leo", "Aslan", "23 Temmuz - 22 Ağustos", "Ateş · Sabit · Güneş", "/uploads/zodiac/leo.png", "görünürlük, yaratıcı oyun ve kalpten liderlik", ["sahne ışığı", "alkışı üretime çevirmek", "çocuklarla oyun", "dostunu cesaretlendirmek"], ["gurur", "dramatizasyon", "ilgi eksikliğini kişisel almak"], ["marka", "sahne", "eğitim", "yaratıcı ekip"], "kalp merkezli nefes ve yaratıcı oyun"),
  build("virgo", "Başak", "23 Ağustos - 22 Eylül", "Toprak · Değişken · Merkür", "/uploads/zodiac/virgo.png", "düzen, analiz ve küçük iyileştirmelerin büyük etkisi", ["kontrol listesi", "temiz masa", "editlenmiş metin", "tarif ölçüsü"], ["aşırı eleştiri", "kaygı", "kusursuzluk baskısı"], ["operasyon", "veri", "editörlük", "kalite kontrol"], "sade rutin ve görev azaltma"),
  build("libra", "Terazi", "23 Eylül - 22 Ekim", "Hava · Öncü · Venüs", "/uploads/zodiac/libra.png", "denge, estetik seçim ve adil ilişki kurma", ["karar terazisi", "renk uyumu", "barış kuran mesaj", "nazik sınır"], ["kararsızlık", "memnun etme çabası", "çatışmadan kaçmak"], ["hukuk", "tasarım", "arabuluculuk", "müşteri ilişkileri"], "estetik düzen ve karar pratiği"),
  build("scorpio", "Akrep", "23 Ekim - 21 Kasım", "Su · Sabit · Mars / Plüton", "/uploads/zodiac/scorpio.png", "yoğunluk, dönüşüm ve saklı olanı sezme cesareti", ["kapalı kapı ardındaki motivasyon", "krizden sonra yeni düzen", "derin araştırma", "güven konuşması"], ["kontrol", "kıskançlık", "güvensizlik testleri"], ["psikoloji", "araştırma", "strateji", "finansal kriz yönetimi"], "gölge günlüğü ve güvenli paylaşım"),
  build("sagittarius", "Yay", "22 Kasım - 21 Aralık", "Ateş · Değişken · Jüpiter", "/uploads/zodiac/sagittarius.png", "ufuk, anlam, keşif ve hareketli inanç", ["sırt çantası", "harita", "yabancı kelime", "açık hava"], ["patavatsızlık", "bağlanma korkusu", "ayrıntıyı küçümsemek"], ["eğitim", "yayıncılık", "seyahat", "rehberlik"], "açık hava ve anlam soruları"),
  build("capricorn", "Oğlak", "22 Aralık - 19 Ocak", "Toprak · Öncü · Satürn", "/uploads/zodiac/capricorn.png", "yapı, sorumluluk ve uzun vadede yükselme", ["dağ patikası", "yıllık plan", "bütçe tablosu", "ustalık"], ["katılık", "duyguyu ertelemek", "başarıyla değer ölçmek"], ["yönetim", "finans", "mühendislik", "kurumsal planlama"], "dinlenmeyi takvime almak"),
  build("aquarius", "Kova", "20 Ocak - 18 Şubat", "Hava · Sabit · Satürn / Uranüs", "/uploads/zodiac/aquarius.png", "özgünlük, topluluk ve gelecek fikri", ["açık kaynak fikri", "ekip sistemi", "farklı çözüm", "arkadaşlıkta özgür alan"], ["duygusal mesafe", "ters köşe olma ihtiyacı", "kopukluk"], ["teknoloji", "sosyal etki", "bilim", "inovasyon"], "toplulukla temas ve bedene dönüş"),
  build("pisces", "Balık", "19 Şubat - 20 Mart", "Su · Değişken · Jüpiter / Neptün", "/uploads/zodiac/pisces.png", "sezgi, merhamet ve görünmeyen bağları hissetme", ["müzikle duygu düzenleme", "deniz kenarı", "rüya imgesi", "sınır cümlesi"], ["sınır kaybı", "kaçış", "başkalarının yükünü taşımak"], ["sanat", "müzik", "yardım", "yaratıcı akış"], "su teması, müzik ve sınır ritüeli"),
];

function build(
  key: string,
  title: string,
  dates: string,
  meta: string,
  image: string,
  theme: string,
  images: string[],
  shadows: string[],
  careers: string[],
  care: string,
): Draft {
  return {
    key,
    title,
    dates,
    meta,
    image,
    summary: `${title} enerjisi ${theme} üzerinden kişisel farkındalık alanı açar.`,
    main: [
      `${title} burcu, ${theme} temasını gündelik hayatın içinde görünür kılan özel bir semboldür. Sende bu enerji çalıştığında ${images[0]}, ${images[1]} veya ${images[2]} gibi imgeler yalnızca güzel örnekler değil, karar alma biçimini anlatan işaretlere dönüşebilir. Bu burcun rehberliği, kendini tek bir sıfata sıkıştırman için değil, hangi koşullarda daha canlı ve hangi koşullarda daha kapalı hissettiğini fark etmen için vardır.`,
      `${title} alanı çoğu zaman dışarıdan basit bir davranış gibi görünür; oysa arka planda ihtiyaç, korku, arzu ve alışkanlık birlikte hareket eder. ${images[3]} imgesi bu yüzden önemlidir: sana ait ritim bir sahnede, bir masada, bir konuşmada ya da yalnız kaldığın kısa bir anda kendini belli edebilir. Burada mesele sembolü ezberlemek değil, sembolün sende hangi davranışa dönüştüğünü gözlemlemektir.`,
      `Gölge tarafta ${shadows.join(", ")} gibi eğilimler belirebilir. Bunları kusur listesi gibi okumak yerine yön levhası gibi görmek daha yararlıdır. Bir davranış tekrar ediyorsa, altında korunmak isteyen bir ihtiyaç bulunabilir. Kendi tepkini suçlamadan izlemek, aynı enerjiyi daha olgun bir seçime dönüştürür. Bazen tek gereken, cevap vermeden önce bir nefeslik mesafe açmaktır.`,
      `İlişkilerde ${title} teması, görülme ve anlaşılma biçimini etkiler. Yakınlık, yalnızca romantik bağda değil arkadaşlıkta, aile içinde ve iş birliklerinde de sınanır. Kendini ifade ederken karşı tarafın ritmini duymak, güçlü tarafını daha güvenli hale getirir. Bu burcun hediyesi, içindeki doğal eğilimi ilişkiyi daraltmak için değil, daha dürüst bir temas kurmak için kullanmandır.`,
      `Kariyer ve üretim alanında ${careers.join(", ")} gibi başlıklar bu sembolün farklı yüzlerini gösterebilir. Yine de meslek listesi tek başına yeterli değildir; önemli olan çalışma ortamının sende hangi niteliği çağırdığıdır. Bu rehber genel Güneş burcu okumasıdır. Yükselen, Ay, yönetici gezegen ve ev yerleşimleri tabloyu değiştirir. Ayda bir kez bu metne dönüp hangi davranışın tekrar ettiğini, hangi sınırın ihmal edildiğini ve hangi küçük pratiğin seni toparladığını not edebilirsin.`,
    ],
    supplement: supplementFor(key),
    sections: {
      personality: [
        `${title} kişilik alanında ${theme} görünür hale gelir. İnsanlar sende bu temanın bazen güçlü, bazen de savunmada kalan tarafını fark edebilir. Günlük hayatta seçtiğin kelimeler, acele ettiğin veya yavaşladığın anlar ve seni rahatlatan ortamlar bu burcun ipuçlarını taşır.`,
        `Denge için kendini tek bir role hapsetmemek önemlidir. ${shadows[0]} belirdiğinde onu bastırmak yerine neyi korumaya çalıştığını sorabilirsin. Kısa notlar, güvenilir geri bildirim ve bedensel farkındalık bu kişilik temasını daha esnek kullanmana yardım eder.`,
      ],
      love: [
        `Aşkta ${title} enerjisi yakınlığı kendine özgü bir dille kurar. Sevildiğini hissetmek için yalnızca güzel söz değil, ritmine saygı ve iç dünyana gerçek merak gerekebilir. Partnerinle ${images[0]} veya ${images[1]} gibi küçük ortak imgeler oluşturmak bağı sıcak tutabilir.`,
        `Gölge tarafta ${shadows[1]} ilişkiyi yorabilir. Bu eğilim belirdiğinde sonucu zorlamak yerine ihtiyacı sade cümleyle anlatmak daha iyi çalışır. Yakınlık, iki kişinin aynı tempoya sahip olması değil, birbirinin temposunu okumayı öğrenmesiyle derinleşir.`,
      ],
      career: [
        `Kariyerde ${title} teması ${careers.join(", ")} alanlarında üretken bir kapı açabilir. Buradaki ortak nokta, sembolün sana verdiği doğal bakış açısını somut işe dönüştürmektir. Uygun ortamda sezgin, becerin veya düzen kurma biçimin görünür sonuç yaratabilir.`,
        `Verimi korumak için yalnızca güçlü yanına yaslanmak yeterli olmaz. ${shadows[2]} çalışma düzenini etkilediğinde hedefi küçük aşamalara bölmek, geri bildirim almak ve yükünü görünür kılmak iyi gelebilir. Böylece yetenek dağılmadan gelişir.`,
      ],
      health: [
        `Ruhsal ve gündelik bakımda ${title} için ${care} destekleyici bir pratik olabilir. Buradaki amaç kendini düzeltmek değil, gün içinde hangi uyaranların seni topladığını ve hangilerinin dağıttığını fark etmektir.`,
        `Bedenindeki sinyalleri izlemek, ekran molası vermek, kısa yürüyüş yapmak veya duygunu birkaç kelimeyle yazmak sana alan açabilir. Bu bölüm tıbbi yönlendirme değildir; genel farkındalık ve öz bakım çerçevesinde okunmalıdır.`,
      ],
    },
  };
}

function supplementFor(key: string): string[] {
  const byKey: Record<string, string[]> = {
    leo: [
      "Aslan için özgün gözlem, görünür olduğun anlarda kalbinin ne kadar açık kaldığını izlemektir. Bir sunumda, bir kutlamada veya arkadaşını desteklediğin bir anda yalnızca alkışı değil, verdiğin sıcaklığı da fark edebilirsin. Sahne senin için sadece başkalarının baktığı yer değildir; içindeki yaratıcı çocuğun oyun kurabildiği alandır.",
      "Bu burçta gelişim, ilgi ihtiyacını saklamakla değil, onu olgun bir üretime çevirmekle gelir. Yaptığın işi paylaşmak, birine cesaret vermek, küçük bir ritüelle neşeyi çağırmak Aslan enerjisini besler. Gurur yükseldiğinde ise kendine şu soruyu sorabilirsin: Şu an korunmak isteyen onurum mu, yoksa gerçekten duyulması gereken bir ihtiyacım mı var?",
      "Aslan sayfası için özgün metafor, ateş başındaki anlatıcıdır. Herkesin ısındığı ama kimsenin yanmadığı bir merkez kurmak bu burcun olgun halidir. Bir ekipte moral düştüğünde hikaye anlatman, bir arkadaşının yeteneğini görünür kılman veya kendi üretimini saklamadan paylaşman bu sıcak merkezi oluşturabilir.",
      "Yaratıcı bakım açısından Aslan'a iyi gelen şey düzenli küçük gösterimlerdir. Bitmiş büyük eser beklemek yerine haftalık bir eskiz, kısa bir kayıt, prova edilmiş bir sunum veya sevdiğin bir kıyafeti bilinçli seçmek iç ışığını besler. Görünürlük, yalnızca dış onay değil, kendine 'buradayım' deme biçimidir.",
      "İlişkide Aslan enerjisini çalışırken takdir ve samimiyet aynı anda önem kazanır. Övgü almak hoşuna gidebilir, fakat yalnızca övülmek değil gerçek haliyle sevilmek istersin. Partnerinle oyun kurmak, beraber üretmek veya birbirinizin cesaretini büyütmek yakınlığı doğal biçimde canlandırır.",
      "Zor günlerde Aslan için en iyi soru şudur: Kalbim şu an kapanıyor mu, yoksa korunmak için biraz ilgi mi istiyor? Bu ayrımı yapmak dramatik tepkiyi azaltır. Kendini ifade etmekten vazgeçmeden daha sade, daha sıcak ve daha duyulur bir yol seçebilirsin.",
      "Ay sonu değerlendirmesinde Aslan, 'nerede parladım, nerede rol yaptım?' sorusuyla çalışabilir. Parlamak doğal akıştır; rol yapmak ise çoğu zaman kabul görme arzusunun yorucu zırhıdır. Bu ayrımı fark ettiğinde yaratıcılığın daha içten, liderliğin daha davetkar ve sevgin daha cömert hale gelir.",
      "Aslan taslağında özellikle kalp cesareti korunmalıdır: metin, kullanıcıyı yalnızca görünmeye değil, görünürken sıcak kalmaya çağırır. Bu yüzden örnekler alkıştan çok üretim, oyun, sahicilik ve cömert liderlik etrafında kalmalıdır.",
    ],
    virgo: [
      "Başak için özgün çalışma, kusur avlamak yerine iyileştirme ritmini seçmektir. Bir masayı düzenlemek, bir metni sadeleştirmek veya haftanın işlerini üç başlığa indirmek yalnızca pratik davranış değildir; zihnin karmaşadan anlam çıkarma biçimidir. Buradaki güç, küçük parçaları görüp bütünü daha yaşanabilir hale getirmendedir.",
      "Kendini fazla eleştirdiğinde işe yarayan soru şudur: Bu düzeltme hayatı kolaylaştırıyor mu, yoksa beni daraltıyor mu? Başak enerjisi bilinçli çalıştığında hizmet etmeyi kendini tüketmeye dönüştürmez. Becerini sürdürülebilir kılmak için molayı da sistemin parçası sayman gerekir.",
      "Başak için özgün metafor, iyi ayarlanmış bir atölyedir. Her aletin yeri vardır ama atölye yalnızca düzenli görünsün diye değil, üretim kolaylaşsın diye düzenlenir. Gündelik hayatında da aynı ilke çalışır: sistem, canlılığı destekliyorsa faydalıdır; canlılığı boğuyorsa yeniden tasarlanabilir.",
      "İlişkilerde yardım etme isteğin sevgi diline dönüşebilir. Fakat her öneri doğru zamanda gelmez. Bazen çözüm sunmadan önce 'şu an dinlememi mi istersin, birlikte düşünmemi mi?' diye sormak yakınlığı korur. Böylece pratik zekan eleştiri gibi değil destek gibi duyulur.",
      "Kariyerde Başak'ın farkı, görünmeyen hataları erken sezmesidir. Bir süreçteki küçük aksaklığı bulmak, raporu temizlemek veya dağınık bilgiyi kullanılabilir hale getirmek ciddi emek ister. Bu emeğin değerini küçümsememek, iş hayatında sınırlarını daha sağlıklı kurmana yardım eder.",
      "Bakım tarafında sadeleşme anahtar olabilir. Bir günün içine daha fazla görev koymak yerine üç görevi gerçekten bitirmek zihnini rahatlatır. Başak enerjisi için verim, doluluk değil berraklık demektir; boşluk bırakmak da planın parçasıdır.",
      "Ay sonu değerlendirmesinde Başak, 'hangi küçük düzen hayatımı kolaylaştırdı?' sorusunu kullanabilir. Bir klasörü isimlendirmek, randevuyu not etmek, mutfak tezgahını boş bırakmak veya bir konuşmayı netleştirmek büyük görünmeyebilir. Fakat senin haritanda iyileşme çoğu zaman bu küçük açıklıkların birikmesiyle hissedilir.",
      "Başak taslağında ton, kullanıcıyı kusursuzluk baskısına değil sadeleşmeye çağırmalıdır. Bir virgülü düzeltmek, bir dosyayı ayırmak veya fazla görevi silmek burada karakter yargısı değil, zihne nefes açan bakım davranışı olarak anlatılır.",
      "Başak bölümünde ayrıca bedensel ritim vurgusu korunmalıdır. Sindirmek, ayıklamak, sınıflandırmak ve hafifletmek aynı sembolik ailenin parçalarıdır. Bu yüzden metin yalnızca iş verimi değil, günün sonunda daha sakin nefes alma becerisi hakkında da konuşur.",
    ],
    libra: [
      "Terazi için özgün gözlem, karar anlarında kimin gözünden baktığını fark etmektir. Bir kıyafet seçerken, bir toplantıda fikir söylerken veya iki kişi arasında köprü kurarken içindeki denge arayışı çalışır. Estetik senin için yüzey değil; uyumsuz parçaların birlikte nefes alabileceği bir düzen kurma yeteneğidir.",
      "Gelişim alanı, nazik kalırken netleşmektir. Herkes rahat etsin diye kendi ihtiyacını ertelediğinde ilişki dengesi dışarıdan sakin görünse de içeride bozulabilir. Küçük bir 'ben böyle istiyorum' cümlesi, çatışma çıkarmaktan çok gerçek uyumu başlatabilir.",
      "Terazi için özgün metafor, iki pencere arasında dolaşan ışıktır. Bir tarafı kapatmadan diğerini görmek, kararlarına incelik katar. Fakat ışık sürekli başkasının odasına düşerse kendi alanın loş kalabilir. Bu yüzden adalet arayışına kendi ihtiyacını da dahil etmek gerekir.",
      "Aşkta Terazi enerjisi güzel konuşma, ortak zevk ve karşılıklı zarafetle beslenebilir. Yine de yalnızca pürüzsüz anlar ilişkiyi gerçek yapmaz. Küçük bir anlaşmazlığı saygıyla konuşabilmek, romantik uyum kadar değerlidir. Bazen gerçek denge, geçici rahatsızlığa izin verince kurulur.",
      "Kariyerde Terazi'nin katkısı farklı tarafları aynı masada tutabilmesidir. Tasarımda renkleri, ekipte beklentileri, danışmanlıkta ihtiyaçları dengelemek sezgisel bir beceri olabilir. Bu beceri daha görünür olsun diye karar gerekçelerini yazmak ve emeğini isimlendirmek destekleyicidir.",
      "Gündelik bakımda estetik düzen seni hızlıca toparlayabilir. Çalışma masasında tek bir çiçek, kıyafette uyumlu bir renk veya odada açılan boşluk iç dünyana da yansır. Terazi için güzellik, kaçış değil, sinir sistemini yumuşatan bir düzenleme dili olabilir.",
      "Ay sonu değerlendirmesinde Terazi, 'hangi eveti huzur için verdim, hangi hayırı saygıyla söyleyebilirdim?' sorusunu deneyebilir. Bu çalışma ilişkileri bozmak için değil, ilişkilerin içinde kendini kaybetmeden durabilmek içindir. Gerçek uyum, senin sesin de duyulduğunda daha kalıcı hale gelir.",
      "Terazi taslağında estetik, yalnızca güzel görünüm olarak değil etik bir yerleştirme duygusu olarak korunmalıdır. Bir odanın ışığı, iki kişinin konuşma mesafesi ve seçilen kelimenin tonu aynı denge arayışının farklı yüzleri gibi ele alınır.",
      "Terazi bölümünde aynalar ve eşikler kullanılabilir: aynada kendini başkasının bakışıyla görmek, eşikte ise kendi seçimini fark etmek. Bu imgeler metni ilişki klişesinden çıkarır ve kullanıcının gündelik kararlarını daha bilinçli tartmasına yardım eder.",
    ],
    scorpio: [
      "Akrep için özgün çalışma, yoğunluğu saklamak yerine ona güvenli bir kap vermektir. Bir konuda derine inmek, yüzeydeki açıklamayla yetinmemek veya krizde soğukkanlı bir odak bulmak senin sembolik alanındadır. Bu güç, kontrol arzusuna değil hakikati taşıyabilme kapasitesine bağlandığında daha şifalı hissedilir.",
      "Güven konusu bu burçta hızlı açılmaz; fakat her mesafe de tehlike anlamına gelmez. Bir ilişkide soru sormadan önce varsayımı ayırmak, sezgiyi daha temiz kullanmana yardım eder. Akrep enerjisi dönüşümü sever; eski bir tepkiyi fark edip yeni bir cevap seçtiğinde bu dönüşüm gündelik hayatta başlar.",
      "Akrep için özgün metafor, karanlık bir odada yavaşça netleşen fotoğraftır. İlk bakışta yalnızca gölge görünür; sabırla beklendiğinde ayrıntı belirir. Sen de çoğu konuda ilk açıklamayla yetinmeyip alt katmana inmeye eğilimli olabilirsin. Bu derinlik, doğru sınırla birleştiğinde güçlü bir sezgiye dönüşür.",
      "İlişkilerde Akrep enerjisi için güven yalnızca sözle değil tutarlılıkla anlaşılır. Birinin zor anda nasıl davrandığı, gizliliğe nasıl saygı gösterdiği ve kırılganlık karşısında ne kadar sakin kaldığı önem kazanabilir. Yakınlık, senin için yüzeysel sıcaklıktan çok karşılıklı dürüstlük taşır.",
      "Kariyerde araştırma, kriz çözümü ve strateji gerektiren işler seni canlı tutabilir. Bir karmaşanın içindeki asıl düğümü sezmek, başkalarının bakmaya çekindiği veriye bakmak veya dönüşüm sürecinde soğukkanlı kalmak güçlü tarafındır. Bu yoğunluğu düzenli boşaltmak gerekir.",
      "Bakım açısından Akrep için güvenli paylaşım çok değerlidir. Her şeyi herkese anlatmak zorunda değilsin; ama hiçbir şeyi kimseyle paylaşmamak da yükü ağırlaştırabilir. Seçtiğin bir defter, terapötik yazı, derin nefes veya güvendiğin biriyle kısa konuşma iç basıncı azaltabilir.",
      "Ay sonu değerlendirmesinde Akrep, 'hangi gerçeği sezdim, hangisini varsaydım?' ayrımına bakabilir. Sezgi güçlüdür, fakat güvensizlikle karıştığında gereksiz alarm üretebilir. Kanıt, beden hissi ve açık konuşma yan yana geldiğinde içindeki dedektif daha adil, daha sakin ve daha dönüştürücü çalışır.",
      "Akrep taslağında karanlık imgeler korkutucu değil, derinlik ve dönüşüm taşıyan bir atmosfer olarak kullanılmalıdır. Kullanıcıya tehdit hissi vermeden, saklı motivasyonları fark etmenin ilişkiyi ve kararları nasıl olgunlaştırabileceği anlatılır.",
    ],
    sagittarius: [
      "Yay için özgün pratik, ufkunu genişletirken ayrıntıya saygı duymaktır. Bir rota planlamak, yeni bir dilde kelime öğrenmek veya uzun bir yürüyüşte anlam sorusu taşımak seni besleyebilir. Özgürlük yalnızca uzaklaşmak değildir; içindeki inancı daha dürüst ve daha sorumlu bir şekilde yaşatabilmektir.",
      "Bazen doğruyu söyleme isteğin, karşındakinin hazır oluşunu görmeden hızlanabilir. Gelişim, açıklığını kaybetmeden tonu ayarlamaktır. Büyük resim sende güçlüdür; küçük adımları ihmal etmediğinde vizyon gerçek hayata daha kolay iner.",
      "Yay için özgün metafor, sınır çizgisine varınca haritayı katlamak değil, yeni soruyu açmaktır. Bilmediğin yerler seni korkutmaktan çok canlandırabilir. Fakat her yolculuk dışarıya yapılmaz; bazen kendi inançlarını sorgulamak da uzak bir ülkeye gitmek kadar dönüştürücü olabilir.",
      "İlişkilerde Yay enerjisi geniş alan ve dürüstlük ister. Birlikte öğrenmek, yeni yer görmek, felsefi bir konuşmaya dalmak veya sıradan günü küçük maceraya çevirmek yakınlığı artırabilir. Yine de özgürlük ihtiyacı, bağ kurma sorumluluğunu tamamen ortadan kaldırmaz.",
      "Kariyerde öğretmek, yayınlamak, rehberlik etmek veya vizyon kurmak sana uygun temalar olabilir. Bir fikri büyütürken onu anlaşılır aşamalara bölmek önemlidir. İnsanlar senden ilham alabilir; bu ilhamın kalıcı olması için örnek, yöntem ve takip de gerekir.",
      "Bakım tarafında açık hava, esneyen beden ve anlamlı soru iyi çalışır. Sıkıştığında yalnızca uzaklaşmak yerine 'burada hangi anlam eksildi?' diye sorabilirsin. Yay enerjisi, kaçış yerine bilinçli keşfe döndüğünde içindeki umut daha sağlam kalır.",
      "Ay sonu değerlendirmesinde Yay, 'hangi deneyim ufkumu açtı, hangi konuda ayrıntıyı atladım?' sorusuyla ilerleyebilir. Büyük resmi görmek hediyendir; fakat küçük ayrıntı bazen o resmin yere basmasını sağlar. Öğrendiğin şeyi paylaşmadan önce bir örnekle somutlaştırmak sözünü daha etkili kılar.",
      "Yay taslağında yol, pasaporttan daha geniş bir metafordur. Bir fikirle karşılaşmak, eski inancı sorgulamak, yeni bir alana öğrenci gibi girmek veya mizahla daralmış havayı açmak da yolculuk sayılır. Bu çeşitlilik metni seyahat klişesine sıkıştırmaz.",
      "Yay bölümünde kamp ateşi imgesi de kullanılabilir: farklı hikayeler aynı ateşin çevresinde buluşur, herkes kendi yolundan bir anlam getirir. Bu burç için bilgelik tek bir doğruyu dayatmak değil, deneyimi geniş bir ufka yerleştirmektir. Bu nedenle metin mizah, öğrenme, etik ve özgür alanı birlikte taşır.",
      "Yay için pratik bir aylık çalışma, merak haritası çizmektir. Bir sayfanın ortasına bu ay seni çağıran soruyu yaz; çevresine kitap, yürüyüş, sohbet, eğitim ve beden deneyimi gibi yollar ekle. Sonra hangi yolun gerçekten içini genişlettiğini işaretle. Böylece macera rastgele kaçış yerine bilinçli öğrenmeye döner.",
    ],
    capricorn: [
      "Oğlak için özgün gözlem, yük ile amaç arasındaki farkı ayırmaktır. Bir plan, bütçe veya uzun vadeli hedef seni toparlayabilir; fakat yalnızca dayanıklı görünmek için taşıdığın sorumluluklar zamanla içini sertleştirebilir. Bu burcun bilgeliği, zamana güvenmek kadar zamanı nasıl kullandığını da sorgulamaktır.",
      "Başarı senin için somut bir dil olabilir, ama değerinin tek ölçüsü değildir. Dinlenmeyi takvime yazmak, yardım istemeyi beceri saymak ve küçük ilerlemeyi görünür kılmak Oğlak enerjisini yumuşatır. Dağ patikasında olduğu gibi, bazen zirveye varmak için tempo düşürmek gerekir.",
      "Oğlak için özgün metafor, taş basamaklı eski bir merdivendir. Her basamak tek başına gösterişli değildir, ama düzenli çıkıldığında yüksek bir bakış açısı verir. Sen de çoğu zaman hızlı ödülden çok emekle kazanılan sağlamlığı önemseyebilirsin. Bu sağlamlık, esneklikle birleştiğinde daha insani hale gelir.",
      "İlişkilerde Oğlak enerjisi güveni sözden çok davranışta arayabilir. Zor zamanda kalmak, plan yapmak, emeği paylaşmak ve sorumluluğu ciddiye almak sevgi dili gibi çalışır. Fakat duyguyu sürekli ertelemek yakınlığı kuru bırakabilir; bazen planın yanında sıcak bir cümle de gerekir.",
      "Kariyerde yapı kurma, finansal düzen, yönetim ve strateji becerilerin öne çıkabilir. Büyük hedefleri küçük takvimlere bölmek senin doğal yeteneğindir. Yine de kendi emeğini görünmez saymamak önemlidir; başarıya yürürken sürecin bedelini de fark etmek gerekir.",
      "Bakım açısından Oğlak için yumuşama pratiği güçlüdür. Sıcak bir duş, omuzları gevşeten hareket, iş bitmeden verilen kısa mola veya birinden destek istemek dayanıklılığını azaltmaz. Aksine uzun yol için bedenini ve duygunu yanında tutar.",
      "Ay sonu değerlendirmesinde Oğlak, 'hangi sorumluluk değerime hizmet etti, hangisi yalnızca alışkanlıkla taşındı?' sorusunu kullanabilir. Her yük kutsal değildir. Bazıları olgunluk getirir, bazıları yalnızca seni erken yaşlandırır. Bu ayrım, hedeflerine sadık kalırken kendine daha adil davranmanı sağlar.",
      "Oğlak taslağında başarı dili kuru bir kariyer anlatısına dönüşmemelidir. Taş, merdiven, takvim ve ustalık imgeleri kullanılırken dinlenme, mizah ve destek isteme de aynı olgunluk çerçevesine dahil edilir.",
      "Oğlak bölümünde eski saat imgesi kullanılabilir: zaman yalnızca baskı kuran bir sayaç değil, emeğin olgunlaşmasını gösteren sessiz bir dosttur. Bu bakış, hedefleri insan dışı bir performans yarışından çıkarıp sabırlı ve sürdürülebilir bir yapıya dönüştürür.",
    ],
    aquarius: [
      "Kova için özgün çalışma, fikirlerinin insan temasına nasıl döndüğünü izlemektir. Bir sistem tasarlamak, ekip içinde farklı bir çözüm önermek veya arkadaşlıkta özgür alan bırakmak sana doğal gelebilir. Bu burçta zeka yalnızca aykırı düşünmek değil, geleceği bugünün ilişkilerine faydalı kılmaktır.",
      "Duygusal mesafe bazen tarafsızlık gibi görünür; fakat kalp tümüyle devreden çıktığında bağ kopuklaşabilir. Bedene dönmek, birine basitçe nasıl olduğunu sormak veya ortak idealin yanında kişisel duyguyu da duymak Kova enerjisini daha insani hale getirir.",
      "Kova için özgün metafor, şehir planının altında çalışan görünmez ağdır. İnsanlar tek tek hareket ederken sen bağlantı sistemini, akışı ve gelecekte nasıl değişebileceğini düşünebilirsin. Bu bakış açısı ekiplerde çok değerlidir; çünkü yalnızca bugünün sorununu değil, yarının ihtimalini de hesaba katar.",
      "İlişkilerde arkadaşlık zemini Kova için özel bir yer tutabilir. Partnerinle fikir konuşmak, birbirinizin bireysel alanına saygı duymak ve ortak bir ideale emek vermek yakınlığı güçlendirebilir. Fakat duyguları sadece kavramlarla açıklamak yetmeyebilir; bazen sade bir temas daha çok şey anlatır.",
      "Kariyerde teknoloji, sosyal fayda, bilim, ekip sistemleri ve yenilikçi projeler seni besleyebilir. Farklı düşünmen başta tuhaf karşılanabilir; bu yüzden fikrini uygulanabilir adımlarla anlatmak önemlidir. Vizyon, başkalarının katılabileceği bir köprü kurduğunda güçlenir.",
      "Bakım tarafında Kova için bedene dönüş çok değerlidir. Zihin geleceğe koşarken ayakların bugünü unutabilir. Kısa yürüyüş, esneme, ritimli nefes veya yüz yüze samimi bir sohbet zihinsel mesafeyi yumuşatır ve seni tekrar insan ölçeğine getirir.",
      "Ay sonu değerlendirmesinde Kova, 'hangi fikrim bir insana gerçekten temas etti?' sorusuyla çalışabilir. Teori değerli olabilir, fakat birinin hayatında küçük bir kolaylık yaratıyorsa daha da anlam kazanır. Fikrini paylaşırken duygusal bağlamı da anlatmak, seni yalnızca akıllı değil anlaşılır kılar.",
      "Kova taslağında gelecek vurgusu teknolojik soğuklukla sınırlı kalmamalıdır. Mahalle, ekip, arkadaşlık ve ortak kaynak gibi insani ağlar da yenilik alanıdır. Böylece metin yalnızca aykırılığı değil, faydalı farklılığı anlatır.",
      "Kova bölümünde yıldız haritası yerine devre panosu, forum masası veya ortak bahçe gibi imgeler kullanılabilir. Her biri farklı parçaların bağımsız kalırken birlikte çalışabileceğini anlatır. Bu dil, Kova'nın özgürlük ihtiyacını toplumsal temasla dengeler.",
    ],
    pisces: [
      "Balık için özgün pratik, sezgiyi sınırla birlikte taşımaktır. Müzik, su kenarı, rüya imgesi veya sessiz bir yaratıcı uğraş iç dünyanı açabilir. Başkasının duygusunu hissetmen güçlü bir yetenektir; ancak o duyguyu tamamen üstlenmeden yanında kalmayı öğrenmek bu burcun olgunlaşma alanıdır.",
      "Hayal gücü seni beslerken gerçeklik kontrolü de destek olabilir. Gün içinde bir duygu yükseldiğinde 'bu bana mı ait, yoksa ortamdan mı geçti?' diye sormak ferahlık getirir. Balık enerjisi bilinçli kullanıldığında kaçışa değil, merhametli ve yaratıcı bir varoluşa dönüşür.",
      "Balık için özgün metafor, kıyıya vuran ama biçim değiştiren sudur. Aynı duygu farklı günlerde başka bir renkle gelebilir; sen de bu geçişleri sezgisel olarak yakalayabilirsin. Yaratıcı üretim, dua, müzik veya sessiz gözlem iç dünyandaki imgeleri güvenli biçimde dışarı taşır.",
      "İlişkilerde Balık enerjisi şefkat ve ruhsal yakınlık arayabilir. Birinin yalnızca sözünü değil, tonunu ve sessizliğini de duyabilirsin. Bu hassasiyet değerli olsa da sınır cümleleri gerektirir. 'Şu an yanında kalabilirim ama bunu senin yerine taşıyamam' demek merhameti azaltmaz.",
      "Kariyerde sanat, yardım, danışmanlık, müzik, sembolik anlatı ve yaratıcı akış seni besleyebilir. Somut takvim ve net teslim tarihi bu akışı güçlendirir; çünkü ilhamın kaybolmadan biçim almasına yardım eder. Hayalin gerçek hayata değdiğinde daha görünür olur.",
      "Bakım tarafında Balık için suyla temas, yumuşak müzik ve kısa gerçeklik kontrolü faydalı olabilir. Bir duygu dalgası geldiğinde onu hemen kader gibi yorumlamak yerine geçmesine alan tanımak rahatlatır. Sezgi, sakin bir bedende daha berrak duyulur.",
      "Ay sonu değerlendirmesinde Balık, 'hangi duygu bana aitti, hangisini ortamdan aldım?' sorusunu deneyebilir. Bu ayrım şefkati azaltmaz; aksine onu daha sürdürülebilir yapar. Başkasına açık kalırken kendi kıyını da görmek, sezgini sisli bir yükten berrak bir rehberliğe dönüştürebilir.",
      "Balık taslağında su ve rüya imgeleri kaçışa değil geçirgenliği bilinçli taşımaya hizmet etmelidir. Bir melodi, bir defter sayfası veya kıyıda bekleyen sessizlik kullanıcının iç dünyasını somutlaştırır; sınır cümleleri de bu yumuşaklığı korur.",
      "Balık bölümünde akvaryum camı iyi bir imgedir: suyun içindeki hareket görünür olur ama sınır da vardır. Bu, şefkati kapatmadan kendini koruma fikrini sade anlatır. Metin, kullanıcının hassasiyetini yük gibi değil, doğru kapta taşınacak bir sezgi olarak ele alır.",
    ],
  };
  return byKey[key] ?? [];
}

await Bun.spawn(["mkdir", "-p", "doc/zodiac-content-2026-07"]).exited;

for (const draft of [...drafts, ...more]) {
  await Bun.write(`doc/zodiac-content-2026-07/${draft.key}.md`, renderDraft(draft));
}

function renderDraft(draft: Draft): string {
  return `---
sign: ${draft.key}
locale: tr
approved: null
status: draft
source: GoldMoodAstro Editorial Draft
title: ${JSON.stringify(`${draft.title} Burcu Rehberi`)}
dates: ${JSON.stringify(draft.dates)}
meta: ${JSON.stringify(draft.meta)}
image: ${JSON.stringify(draft.image)}
summary: ${JSON.stringify(draft.summary)}
---

# ${draft.title} Burcu Rehberi

${draft.main.join("\n\n")}

${(draft.supplement ?? []).join("\n\n")}

## personality

${draft.sections.personality.join("\n\n")}

## love

${draft.sections.love.join("\n\n")}

## career

${draft.sections.career.join("\n\n")}

## health

${draft.sections.health.join("\n\n")}
`;
}
