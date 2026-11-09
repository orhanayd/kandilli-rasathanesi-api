# 🌍 Kandilli Rasathanesi / AFAD API

<div align="center">

[![API Status](https://img.shields.io/badge/API-Active-brightgreen)](https://api.orhanaydogdu.com.tr/deprem/status)
[![License](https://img.shields.io/badge/License-Custom-orange.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/Node.js-%3E%3D22-green)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.2%2B-green)](https://www.mongodb.com/)

**Türkiye'nin en güncel deprem verilerini sunan, ücretsiz ve açık kaynaklı API servisi**

[🔗 Swagger Dokümantasyonu](https://api.orhanaydogdu.com.tr/deprem/api-docs/) | [📊 API Durumu](https://api.orhanaydogdu.com.tr/deprem/status) | [💬 Whatsapp Topluluğu](https://chat.whatsapp.com/KOkShApC4lc9HlMtFFN3kQ)

</div>

---

## 📋 İçindekiler

- [Hakkında](#-hakkında)
- [Özellikler](#-özellikler)
- [Hızlı Başlangıç](#-hızlı-başlangıç---tüm-kaynaklar-kandilliafad)
- [API Endpoints](#-api-endpoints)
- [Hata Yanıtları](#-hata-yanıtları)
- [Kurulum](#-kurulum)
- [Rate Limiting](#-rate-limiting)
- [Lisans ve Uyarılar](#-lisans-ve-uyarılar)

## 📖 Hakkında

Kandilli Rasathanesi API, **Boğaziçi Üniversitesi Kandilli Rasathanesi** ve **AFAD (Afet ve Acil Durum Yönetimi Başkanlığı)** tarafından yayınlanan deprem verilerini işleyerek, zenginleştirilmiş ve kolayca kullanılabilir formatta sunan bir RESTful API servisidir.

### Neden Bu API?

- ✅ **Çift Kaynak**: Kandilli ve AFAD verilerini birleştirir
- ✅ **Gerçek Zamanlı**: Veriler her dakika güncellenir
- ✅ **Zenginleştirilmiş Veri**: Deprem noktasına en yakın şehirler ve havaalanları
- ✅ **GeoJSON Desteği**: Harita uygulamalarına kolay entegrasyon
- ✅ **Ücretsiz**: Ticari olmayan kullanımlar için tamamen ücretsiz
- ✅ **Güvenilir**: MongoDB ve bellek içi önbellek ile yüksek performans

## ✨ Özellikler

### Temel Özellikler
- 📊 Son 24 saatteki depremler (canlı veri)
- 📅 Tarih bazlı deprem arşivi
- 🗺️ GeoJSON formatında konum verileri
- 🏙️ Deprem merkezinin bulunduğu il ve en yakın 5 şehir
- ✈️ En yakın 3 havaalanı ve uzaklıkları
- 👥 Etkilenen bölge nüfus bilgileri

### Teknik Özellikler
- ⚡ Önbellekleme: canlı veriler 30 saniye, arşivler 10 dakika, tekil deprem 24 saat
- 🔍 Gelişmiş arama ve filtreleme (büyüklük, il, tarih, konum)
- 🔐 Rate limiting (dakikada 40 istek)
- 📖 Swagger/OpenAPI dokümantasyonu
- 🌍 Türkiye (81 il), KKTC, 21 ülke ve 8 deniz bölgesi için sınır verileri

## 🚀 Hızlı Başlangıç - Tüm Kaynaklar (Kandilli/AFAD)

```bash
curl https://api.orhanaydogdu.com.tr/deprem/
```

> Sondaki `/` önemlidir: `/deprem` adresi `/deprem/` adresine **301** ile yönlendirilir. `curl` yönlendirmeyi
> varsayılan olarak izlemez; ya `/deprem/` kullanın ya da `curl -L` ekleyin.

## 📊 Veri Kapsamı

| Kaynak | Aralık | Kayıt |
| --- | --- | --- |
| Kandilli (KOERI) | 2003-01 → bugün | ~446.000 |
| AFAD | 1990-01 → bugün | ~588.000 |
| **Toplam** | **1990-01 → bugün** | **~1.035.000** |

Kandilli kayıtları, Kandilli arşivinin başladığı 2003-01'den itibaren mevcuttur. AFAD kayıtları 1990-01'den
itibaren mevcuttur; 1997 yılı AFAD kaynağında boştur.

**Bilinen boşluk:** AFAD'ın eski veri servisi 2026-10-22'de kapandı. Yeni servis yalnızca son
~1000 olayı tuttuğu için **2026-10-22 17:31 – 2026-10-28 12:02** arasındaki AFAD kayıtları geri alınamadı.
Bu aralıkta Kandilli verisi eksiksizdir.

---

## ⚠️ Kırıcı Değişiklikler (Breaking Changes)

### Yanıt şeması

| Değişiklik | Öncesi | Sonrası |
| --- | --- | --- |
| `date` alanı kaldırıldı | `"date": "2024.01.08 11:45:23"` | — (`date_time` kullanın) |
| Ülke `cityCode` değerleri değişti | `7` (Rusya), `20` (Mısır), `30` (Yunanistan) | `1007`, `1020`, `1030` |

**`date` neden kaldırıldı:** Kayıtların yalnızca %78'inde vardı, güncel modeller hiç üretmiyordu ve
986 kayıtta formatı bozuktu (`"2011.03.01 05.27.59"` — saat ayracı nokta). Aynı bilgi `date_time`
alanında normalize edilmiş halde (`YYYY-MM-DD HH:mm:ss`) ve %100 dolu.

### `cityCode` şeması

Ülke kodları Türkiye plaka kodlarıyla çakışıyordu — `cityCode: 7` hem Antalya hem Rusya,
`20` hem Denizli hem Mısır, `30` hem Hakkari hem Yunanistan anlamına geliyordu. Yeni şema:

| Aralık | Anlam | Örnek |
| --- | --- | --- |
| `1` – `81` | Türkiye plaka kodu | `34` İstanbul |
| `82` | KKTC | `82` |
| `-1` | Deniz / açık sular | Ege Denizi, Marmara Denizi |
| `>= 1000` | Yurt dışı = `1000 + telefon kodu` | `1030` Yunanistan, `1963` Suriye |

Yabancı bir ülke olup olmadığını anlamak için `cityCode >= 1000` kontrolü yeterlidir. Deniz bölgelerinin
tamamı `-1` kodunu taşır, yani `-1` Türkiye'ye ait olmayan denizleri de kapsar (ör. Adriyatik Denizi,
Akdeniz Açıkları (Suriye)). Tam liste için `GET /deprem/statics/cities` ucuna bakın (aşağıda: Şehir Listesi).

---

## 📚 API Endpoints

### 📖 Swagger/OpenAPI Dokümantasyonu

Detaylı API dokümantasyonu ve interaktif test arayüzü için:

🔗 **[https://api.orhanaydogdu.com.tr/deprem/api-docs/](https://api.orhanaydogdu.com.tr/deprem/api-docs/)**

Ham OpenAPI JSON: [`/deprem/api-docs-download.json`](https://api.orhanaydogdu.com.tr/deprem/api-docs-download.json)

### Endpoint Listesi

| Method | Endpoint | Açıklama | Cache | Rate Limit |
|--------|----------|----------|-------|------------|
| `GET` | `/deprem/kandilli/live` | Kandilli - Son 24 saat | 30s | 40/dk |
| `GET` | `/deprem/kandilli/archive` | Kandilli - Tarih aralığı | 10dk | 40/dk |
| `GET` | `/deprem/afad/live` | AFAD - Son 24 saat | 30s | 40/dk |
| `GET` | `/deprem/afad/archive` | AFAD - Tarih aralığı | 10dk | 40/dk |
| `GET` | `/deprem/` | Tüm kaynaklar - Son 24 saat | 30s | 40/dk |
| `POST` | `/deprem/data/search` | Gelişmiş arama & filtreleme | - | 40/dk |
| `GET` | `/deprem/data/get` | Tekil deprem bilgisi | 24h | 40/dk |
| `GET` | `/deprem/statics/cities` | Şehir / bölge listesi | - | Yok* |
| `GET` | `/deprem/status` | API sağlık durumu | 30s | Yok* |

\* Bu uçlar dakikalık sayaca dahil değildir; ancak banlı bir IP'den gelen istekler burada da 403 alır.

**Ortak kurallar:**
- `limit` 1 ile 100 arasında olmalıdır (varsayılan 50). 100'den büyük değerler hata vermeden 100'e indirilir, 1'den küçük değerler 422 döner.
- `skip` 0 ile **10000** arasında olmalıdır, dışındaki değerler 422 döner. Daha fazla kayda ulaşmak için tarih aralığını bölün.
- Tüm liste uçları en yeni deprem önce olacak şekilde (`date_time` azalan) sıralıdır, bu yüzden `skip` ile sayfalama tutarlıdır.
- `metadata.count`, eşleşen toplam kayıt sayısı değil, **bu yanıtta dönen** kayıt sayısıdır.
- Tüm tarihler Türkiye saatindedir (`Europe/Istanbul`) ve `YYYY-MM-DD HH:mm:ss` formatındadır.

---

### 1️⃣ Kandilli - Canlı Veriler

**Endpoint:** `GET /deprem/kandilli/live`

**Açıklama:** Kandilli Rasathanesi'nden son 24 saatteki depremler, en yeni önce.

**Query Parametreleri:**
- `skip` (number, optional): Atlanacak kayıt sayısı (0-10000, default: 0)
- `limit` (number, optional): Maksimum kayıt sayısı (1-100, default: 50)

**Örnek İstek:**
```bash
curl "https://api.orhanaydogdu.com.tr/deprem/kandilli/live?skip=0&limit=10"
```

**Örnek Response** (gerçek yanıt; `closestCities` 5, `airports` 3 eleman döner, burada kısaltıldı):
```json
{
  "status": true,
  "httpStatus": 200,
  "desc": "",
  "serverloadms": 1,
  "metadata": {
    "date_starts": "2026-11-08 03:43:22",
    "date_ends": "2026-11-09 03:43:22",
    "count": 1
  },
  "result": [
    {
      "earthquake_id": "9YpwFOUfikFUq",
      "provider": "kandilli",
      "title": "CULHALAR-SIMAV (KUTAHYA)",
      "mag": 0.8,
      "depth": 16,
      "geojson": {
        "type": "Point",
        "coordinates": [28.9805, 39.4612]
      },
      "rev": null,
      "date_time": "2026-11-09 01:48:22",
      "created_at": 1794178102,
      "location_tz": "Europe/Istanbul",
      "location_properties": {
        "closestCity": { "name": "Bursa", "cityCode": 16, "distance": 68786, "population": 3194720 },
        "epiCenter": { "name": "Kütahya", "cityCode": 43, "population": 580701 },
        "closestCities": [
          { "name": "Bursa", "cityCode": 16, "distance": 68786, "population": 3194720 },
          { "name": "Uşak", "cityCode": 64, "distance": 107459, "population": 375454 }
        ],
        "airports": [
          {
            "distance": 85811,
            "name": "Bursa Havalimanı",
            "code": "BTZ",
            "coordinates": { "type": "Point", "coordinates": [29.0094, 40.2326] }
          }
        ]
      }
    }
  ]
}
```

**Alan notları:**
- `distance` değerleri metre cinsinden tam sayıdır.
- `epiCenter`, deprem noktasını içeren il, ülke ya da deniz bölgesidir. Nokta hiçbir sınırın içinde değilse `name` null olabilir.
- `rev`: Kandilli revize kayıtlarında revizyon bilgisi taşır, diğer kayıtlarda `null`'dır.
- `created_at`: depremin zamanının Unix zaman damgasıdır (saniye).

---

### 2️⃣ Kandilli - Arşiv

**Endpoint:** `GET /deprem/kandilli/archive`

**Açıklama:** Kandilli Rasathanesi'nden belirli tarih aralığındaki depremler, en yeni önce.

**Query Parametreleri:**
- `date` (string, optional): Başlangıç günü (`YYYY-MM-DD`, günün 00:00:00'ından itibaren; default: 24 saat önce)
- `date_end` (string, optional): Bitiş günü (`YYYY-MM-DD`, günün 23:59:59'una kadar; default: şimdi)
- `skip` (number, optional): Atlanacak kayıt sayısı (0-10000, default: 0)
- `limit` (number, optional): Maksimum kayıt sayısı (1-100, default: 50)

**Örnek İstek:**
```bash
curl "https://api.orhanaydogdu.com.tr/deprem/kandilli/archive?date=2024-01-15&date_end=2024-01-15&limit=1"
```

**Örnek Response** (gerçek yanıt; her kayıt canlı verideki tüm alanları içerir, burada kısaltıldı):
```json
{
  "status": true,
  "httpStatus": 200,
  "desc": "",
  "serverloadms": 3,
  "metadata": {
    "count": 1
  },
  "result": [
    {
      "earthquake_id": "wnZTDXJ7ksYN3",
      "provider": "kandilli",
      "title": "BABAKALE-AYVACIK (CANAKKALE)",
      "mag": 1.3,
      "depth": 12.3,
      "date_time": "2024-01-15 00:12:12"
    }
  ]
}
```

---

### 3️⃣ AFAD - Canlı Veriler

**Endpoint:** `GET /deprem/afad/live`

**Açıklama:** AFAD'dan son 24 saatteki depremler, en yeni önce.

**Query Parametreleri:**
- `skip` (number, optional): Atlanacak kayıt sayısı (0-10000, default: 0)
- `limit` (number, optional): Maksimum kayıt sayısı (1-100, default: 50)

**Örnek İstek:**
```bash
curl "https://api.orhanaydogdu.com.tr/deprem/afad/live?limit=20"
```

**Örnek Response** (gerçek yanıt; burada kısaltıldı):
```json
{
  "status": true,
  "httpStatus": 200,
  "desc": "",
  "serverloadms": 1,
  "metadata": {
    "date_starts": "2026-11-08 03:43:22",
    "date_ends": "2026-11-09 03:43:22",
    "count": 1
  },
  "result": [
    {
      "earthquake_id": "wsAifPQm4TJbj",
      "provider": "afad",
      "title": "Baykan (Siirt)",
      "mag": 1.4,
      "depth": 6.99,
      "date_time": "2026-11-09 03:08:36"
    }
  ]
}
```

> Başlık formatı kaynağa göre değişir: Kandilli büyük harf ve ASCII kullanır (`CULHALAR-SIMAV (KUTAHYA)`),
> AFAD ise Türkçe karakterli karışık harf kullanır (`Baykan (Siirt)`).

---

### 4️⃣ AFAD - Arşiv

**Endpoint:** `GET /deprem/afad/archive`

**Açıklama:** AFAD'dan belirli tarih aralığındaki depremler, en yeni önce.

**Query Parametreleri:**
- `date` (string, optional): Başlangıç günü (`YYYY-MM-DD`, günün 00:00:00'ından itibaren; default: 24 saat önce)
- `date_end` (string, optional): Bitiş günü (`YYYY-MM-DD`, günün 23:59:59'una kadar; default: şimdi)
- `skip` (number, optional): Atlanacak kayıt sayısı (0-10000, default: 0)
- `limit` (number, optional): Maksimum kayıt sayısı (1-100, default: 50)

**Örnek İstek:**
```bash
curl "https://api.orhanaydogdu.com.tr/deprem/afad/archive?date=2024-01-01&date_end=2024-01-10"
```

Yanıt formatı yukarıdaki Kandilli - Arşiv ile aynıdır.

---

### 5️⃣ Tüm Kaynaklar (Kombine)

**Endpoint:** `GET /deprem/`

**Açıklama:** Tüm veri kaynaklarından (Kandilli + AFAD) depremler, en yeni önce. Varsayılan aralık son 24 saattir.

**Query Parametreleri:**
- `date` (string, optional): Başlangıç günü (`YYYY-MM-DD`, günün 00:00:00'ından itibaren; default: 24 saat önce)
- `date_end` (string, optional): Bitiş günü (`YYYY-MM-DD`, günün 23:59:59'una kadar; default: şimdi)
- `skip` (number, optional): Atlanacak kayıt sayısı (0-10000, default: 0)
- `limit` (number, optional): Maksimum kayıt sayısı (1-100, default: 50)

**Örnek İstek:**
```bash
curl "https://api.orhanaydogdu.com.tr/deprem/?limit=30"
```

**Örnek Response** (gerçek yanıt; `metadata` alanı yoktur, burada kısaltıldı):
```json
{
  "status": true,
  "httpStatus": 200,
  "desc": "",
  "serverloadms": 2,
  "result": [
    {
      "earthquake_id": "wsAifPQm4TJbj",
      "provider": "afad",
      "title": "Baykan (Siirt)",
      "mag": 1.4,
      "depth": 6.99,
      "date_time": "2026-11-09 03:08:36"
    },
    {
      "earthquake_id": "CmkC3FwVDSgqY",
      "provider": "afad",
      "title": "Balık Gölü - [03.80 km] Doğubayazıt (Ağrı)",
      "mag": 1,
      "depth": 6.99,
      "date_time": "2026-11-09 03:07:44"
    }
  ]
}
```

---

### 6️⃣ Gelişmiş Arama

**Endpoint:** `POST /deprem/data/search`

**Açıklama:** Tüm depremler üzerinde gelişmiş filtreleme, konum bazlı arama ve sıralama.

**Request Body:**
```json
{
  "provider": "kandilli",  // optional: "kandilli" veya "afad" - kaynak filtresi
  "match": {
    "mag": 4.5,              // optional: Minimum büyüklük (>=, ondalıklı olabilir)
    "cityCode": 34,          // optional: Deprem merkezinin cityCode'u (bkz. cityCode şeması)
    "date_starts": "2024-01-01 00:00:00",  // optional: Başlangıç (date_ends ile birlikte)
    "date_ends": "2024-01-31 23:59:59"     // optional: Bitiş (date_starts ile birlikte)
  },
  "geoNear": {               // optional: gönderilirse üç alan da zorunlu
    "lon": 29.0,             // Boylam (-180 / 180)
    "lat": 41.0,             // Enlem (-90 / 90)
    "radiusMeter": 100000    // Yarıçap, metre (1 - 20.000.000)
  },
  "sort": "date_-1",         // optional: date_1, date_-1, mag_1, mag_-1 (default: date_-1)
  "skip": 0,                 // optional: Sayfalama offset (0-10000)
  "limit": 10                // optional: Max kayıt (1-100, default: 10; 100 üstü otomatik sınırlanır)
}
```

**Kurallar:**
- `skip`, `limit`, `mag` ve `cityCode` alanları JSON **number** olmalıdır. String gönderilirse yok sayılır.
- `geoNear` gönderilirse `lon`, `lat` ve `radiusMeter` zorunludur ve sayı olmalıdır (sayısal string de kabul edilir). Eksik ya da aralık dışı değer 422 döner.
- `date_starts` ve `date_ends` birlikte gönderilmelidir. Yalnızca biri gönderilirse ikisi de yok sayılır.
- `geoNear` bir alan filtresidir: sonuçları belirtilen dairenin içindekilerle sınırlar, uzaklığa göre **sıralamaz**. Sıralama `sort` ile belirlenir.
- Tanınmayan `sort` veya `provider` değerleri hata vermeden yok sayılır.

**Örnek 1 - Büyüklük Filtreleme:**
```bash
curl -X POST https://api.orhanaydogdu.com.tr/deprem/data/search \
  -H "Content-Type: application/json" \
  -d '{
    "match": {"mag": 4.5},
    "sort": "mag_-1",
    "limit": 10
  }'
```

**Örnek 2 - Konum Bazlı Arama (İstanbul çevresinde 200km):**
```bash
curl -X POST https://api.orhanaydogdu.com.tr/deprem/data/search \
  -H "Content-Type: application/json" \
  -d '{
    "geoNear": {
      "lon": 28.9784,
      "lat": 41.0082,
      "radiusMeter": 200000
    },
    "match": {"mag": 3},
    "sort": "mag_-1",
    "limit": 20
  }'
```

**Örnek 3 - Şehir ve Tarih Filtresi:**
```bash
curl -X POST https://api.orhanaydogdu.com.tr/deprem/data/search \
  -H "Content-Type: application/json" \
  -d '{
    "match": {
      "cityCode": 6,
      "mag": 3,
      "date_starts": "2024-01-01 00:00:00",
      "date_ends": "2024-01-31 23:59:59"
    },
    "sort": "date_-1"
  }'
```

**Örnek 4 - Kaynak Filtresi (Sadece AFAD):**
```bash
curl -X POST https://api.orhanaydogdu.com.tr/deprem/data/search \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "afad",
    "match": {"mag": 4},
    "limit": 30
  }'
```

**Örnek Response** (Örnek 2'nin gerçek yanıtı, `limit: 1`; burada kısaltıldı):
```json
{
  "status": true,
  "httpStatus": 200,
  "desc": "",
  "serverloadms": 741,
  "result": [
    {
      "earthquake_id": "gtBQZBlH75DR6",
      "provider": "afad",
      "title": "Başiskele (Kocaeli)",
      "mag": 7.4,
      "depth": 15.9,
      "geojson": {
        "type": "Point",
        "coordinates": [29.91, 40.7]
      },
      "rev": null,
      "date_time": "1999-08-17 03:01:39",
      "created_at": 934848099,
      "location_tz": "Europe/Istanbul",
      "location_properties": {
        "closestCity": { "name": "Sakarya", "cityCode": 54, "distance": 48499, "population": 1080080 },
        "epiCenter": { "name": "Kocaeli", "cityCode": 41, "population": 2079072 },
        "closestCities": [
          { "name": "Sakarya", "cityCode": 54, "distance": 48499, "population": 1080080 },
          { "name": "Yalova", "cityCode": 77, "distance": 68717, "population": 296333 }
        ],
        "airports": [
          {
            "distance": 15115,
            "name": "Cengiz Topel Havalimanı",
            "code": "KCO",
            "coordinates": { "type": "Point", "coordinates": [30.0833, 40.735] }
          }
        ]
      }
    }
  ]
}
```

---

### 7️⃣ Tekil Deprem Bilgisi

**Endpoint:** `GET /deprem/data/get`

**Açıklama:** Belirli bir `earthquake_id`'ye sahip depremin detaylı bilgisi.

**Query Parametreleri:**
- `earthquake_id` (string, required): Deprem ID'si (13 karakter). Gönderilmezse 406 döner. ID bulunamazsa `status: true` ile `result` alanı olmayan bir yanıt döner.

**Örnek İstek:**
```bash
curl "https://api.orhanaydogdu.com.tr/deprem/data/get?earthquake_id=EoIrMsfMSC19f"
```

**Örnek Response** (gerçek yanıt; burada kısaltıldı):
```json
{
  "status": true,
  "httpStatus": 200,
  "desc": "",
  "serverloadms": 1,
  "result": {
    "earthquake_id": "EoIrMsfMSC19f",
    "provider": "kandilli",
    "title": "YAZIDERE-AFSIN (KAHRAMANMARAS)",
    "mag": 2,
    "depth": 1.6,
    "geojson": {
      "type": "Point",
      "coordinates": [37.0058, 38.1365]
    },
    "location_properties": {
      "closestCity": { "name": "Kayseri", "cityCode": 38, "distance": 107796, "population": 1441523 },
      "epiCenter": { "name": "Kahramanmaraş", "cityCode": 46, "population": 1177436 },
      "closestCities": [
        { "name": "Kayseri", "cityCode": 38, "distance": 107796, "population": 1441523 },
        { "name": "Malatya", "cityCode": 44, "distance": 108161, "population": 812580 }
      ],
      "airports": [
        {
          "distance": 66815,
          "name": "Kahramanmaraş Havalimanı",
          "code": "KCM",
          "coordinates": { "type": "Point", "coordinates": [36.9473, 37.5374] }
        }
      ]
    },
    "rev": null,
    "date_time": "2023-03-08 02:54:44",
    "created_at": 1678233284,
    "location_tz": "Europe/Istanbul"
  }
}
```

> `closestCity` ile `epiCenter` farklı olabilir. `epiCenter` depremin sınırları içinde gerçekleştiği yerdir,
> `closestCity` ise merkezi depreme en yakın şehirdir. Yukarıdaki örnekte deprem Kahramanmaraş sınırları
> içindedir, ama şehir merkezi olarak en yakını Kayseri'dir.

---

### 8️⃣ Şehir Listesi

**Endpoint:** `GET /deprem/statics/cities`

**Açıklama:** Deprem merkezi olarak dönebilecek tüm bölgelerin listesi, ada göre sıralı: 81 il, KKTC, 21 ülke ve
8 deniz bölgesi (`city`, `cityCode`, `population`). Yurt dışı kayıtlarda `population` alanı yoktur, deniz
bölgelerinde `null`'dır.

**Örnek İstek:**
```bash
curl "https://api.orhanaydogdu.com.tr/deprem/statics/cities"
```

**Örnek Response** (gerçek yanıttan seçilmiş kayıtlar):
```json
{
  "status": true,
  "httpStatus": 200,
  "desc": "",
  "serverloadms": 0,
  "result": [
    { "city": "Adana", "cityCode": 1, "population": 2274106 },
    { "city": "Ankara", "cityCode": 6, "population": 5782285 },
    { "city": "Ege Denizi", "cityCode": -1, "population": null },
    { "city": "Kıbrıs", "cityCode": 82, "population": 888000 },
    { "city": "Yunanistan", "cityCode": 1030 },
    { "city": "İstanbul", "cityCode": 34, "population": 15907951 }
  ]
}
```

---

### 9️⃣ API Sağlık Durumu

**Endpoint:** `GET /deprem/status`

**Açıklama:** API durumu: son ~1-2 dakikadaki istek ve IP sayısı, aktif ban sayısı ve önbellek istatistikleri.

**Örnek İstek:**
```bash
curl "https://api.orhanaydogdu.com.tr/deprem/status"
```

**Örnek Response** (`nopeRedis` alanında daha fazla önbellek istatistiği döner, burada kısaltıldı):
```json
{
  "status": true,
  "httpStatus": 200,
  "desc": "kandilli son depremler api service",
  "stats": {
    "total_request_ip": 186,
    "total_request": 440,
    "total_banned_ip": 4
  },
  "nopeRedis": {
    "total": 42,
    "size": "1.2 MB"
  }
}
```

## ❗ Hata Yanıtları

Hatalar her zaman aynı formatta döner:

```json
{
  "status": false,
  "httpStatus": 406,
  "desc": "earthquake_id missing param !"
}
```

| Kod | Anlamı |
| --- | --- |
| `403` | IP banlı (bkz. [Rate Limiting](#-rate-limiting)) |
| `404` | Endpoint bulunamadı (`"No endpoint!"`) |
| `406` | Zorunlu parametre eksik |
| `408` | İstek 30 saniyede tamamlanamadı (zaman aşımı) |
| `422` | Parametre hatalı (ör. geçersiz tarih, `limit` < 1, `skip` 0-10000 dışında, eksik ya da aralık dışı `geoNear` alanı) |
| `429` | Rate limit aşıldı. Bu istekle birlikte IP 3 gün banlanır |
| `500` | Sunucu hatası |

## 💻 Kurulum

### Gereksinimler
- Node.js >= 22
- MongoDB >= 4.2
- PM2 (zorunlu: hem geliştirme hem production script'leri PM2 ile çalışır) — `npm install -g pm2`

### Mimari

Proje iki ayrı servisten oluşur:

| Servis | Dosya | Port | Görev |
| --- | --- | --- | --- |
| Public API | `index.js` | 7979 | Yukarıdaki tüm uçlar |
| Internal | `index-internal.js` | 7980 | Kandilli ve AFAD'dan veri çekip veritabanına yazar |

Internal servis veriyi kendiliğinden çekmez; bir **cron** tarafından tetiklenir. Yalnızca public API'yi
çalıştırırsanız veritabanına hiç veri girmez.

### Adımlar

1. **Projeyi klonlayın**
```bash
git clone https://github.com/orhanayd/kandilli-rasathanesi-api.git
cd kandilli-rasathanesi-api
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Environment değişkenlerini ayarlayın**
```bash
cp .env.example .env
# .env dosyasını düzenleyin — her değişkenin açıklaması dosyanın içinde
```

> `BYPASS_IPS` tanımlı olmalıdır (muaf IP yoksa boş bırakın: `BYPASS_IPS=`). Tanımsızsa servis açılmaz.

4. **Geliştirme ortamında iki servisi başlatın**
```bash
npm run dev:all
```

5. **Veri çekimini cron ile tetikleyin** (`CRON_KEY` değeri `.env` ile aynı olmalı)
```bash
# her dakika: Kandilli + AFAD verisini çek
* * * * * curl -s -o /dev/null -H "Authorization: <CRON_KEY>" http://localhost:7980/deprem/int/earthquakes
# 5 dakikada bir: süresi dolan banları temizle, Cloudflare listesini eşitle
*/5 * * * * curl -s -o /dev/null -H "Authorization: <CRON_KEY>" http://localhost:7980/deprem/int/ban-cleanup
```

Internal servisin sağlık kontrolü: `GET http://localhost:7980/health`

> **MongoDB index'leri** `src/constants/indexes.js` dosyasında tanımlıdır ve servisler her açılışta bunları otomatik
> eşitler: eksik index oluşturulur, tanımı değişen güncellenir, **listede olmayan index silinir**. Yeni bir index gerekiyorsa
> bu dosyaya ekleyin. Ne yapılacağını değişiklik yapmadan görmek için: `npm run indexes -- --dry-run`

6. **Production için**
```bash
npm run start:all
```

> `NODE_ENV=DEV` ile başlatıldığında veritabanı adlarına `dev_` öneki eklenir. Böylece geliştirme ve
> production verisi ayrı tutulur. npm script'leri `NODE_ENV=...` sözdizimini kullandığı için POSIX bir kabuk
> (macOS, Linux, WSL) gerektirir.


## 🔒 Rate Limiting

API'nin sürdürülebilirliği için rate limiting uygulanmaktadır:

- **Limit**: Dakikada maksimum 40 istek
- **Kapsam**: IP başına. Sayaca dahil uçlar: Kandilli/AFAD canlı ve arşiv, `/deprem/`, `data/search`, `data/get`
- **Bypass**: `BYPASS_IPS` environment değişkeni ile belirli IP'ler muaf tutulabilir
- **Hata Kodu**: 429 (Too Many Requests)

> **Dikkat: IP Engelleme Politikasi**
>
> API'nin tum kullanicilar icin adil ve kesintisiz bir sekilde hizmet verebilmesi amaciyla, dakikada 40 istek limitini asan IP adresleri icin asagidaki yaptirimlari uygulamaktayiz:
>
> 1. **Otomatik IP Ban**: Dakikada 40 istek limitini asan IP adresleri **otomatik olarak 3 gun (72 saat) sureyle** engellenir. Bu sure zarfinda API'ye yapilan tum istekler **403 (Forbidden)** hatasi ile reddedilir. Engelleme suresi dolduğunda ban otomatik olarak kalkar.
>
> 2. **Kalici Engelleme**: Limiti tekrar tekrar asan veya sistematik olarak ihlal eden IP adresleri **kalici olarak** engellenir. Kalici engelleme durumunda API'ye erisim tamamen kapatilir.
>
> Lutfen uygulamalarinizi rate limit sinirlarina uygun sekilde tasarlayin. Istek araliklarinizi duzenleyerek ve onbellekleme mekanizmalari kullanarak bu sinirin altinda kalmaniz mumkundur. Engellenme durumunda veya ozel ihtiyaclariniz icin **info@orhanaydogdu.com.tr** adresi uzerinden bizimle iletisime gecebilirsiniz.

## 📜 Lisans ve Uyarılar

### 🔒 Lisans Koşulları

Bu proje **özel lisans** altında lisanslanmıştır:

- ✅ **Ücretsiz Kullanım**: Eğitim, araştırma ve kişisel amaçlar için
- ❌ **Ticari Kullanım**: Yazılı izin gerektirir
- 📄 **Atribusyon**: Projenizde şu ifade yer almalıdır: *"Deprem verileri Kandilli Rasathanesi API tarafından sağlanmaktadır."*
- 🚫 **Veri Ticareti**: Deprem verilerinin satışı yasaktır

### ⚠️ Ticari Kullanım Uyarısı

> **ÖNEMLİ UYARI**:
> 1. Söz konusu bilgi, veri ve haritalar Boğaziçi Üniversitesi Rektörlüğü'nün yazılı izni olmadan ticari amaçlı kullanılamaz.
> 2. API'nin ticari kullanımı için info@orhanaydogdu.com.tr adresinden detaylı bilgi ve izin alınmalıdır.
> 3. İzinsiz ticari kullanım yasal işleme tabi olabilir.

### 📝 Lisans Detayları

Tam lisans metni için [LICENSE](LICENSE) dosyasına bakınız.

### İletişim
- 📧 Email: info@orhanaydogdu.com.tr
- 💬 [Whatsapp Topluluğu](https://chat.whatsapp.com/KOkShApC4lc9HlMtFFN3kQ)
- 🐛 [GitHub Issues](https://github.com/orhanayd/kandilli-rasathanesi-api/issues)

## 🙏 Teşekkürler

- Boğaziçi Üniversitesi Kandilli Rasathanesi ve Deprem Araştırma Enstitüsü'ne veri sağladıkları için teşekkürler.
- AFAD (Afet ve Acil Durum Yönetimi Başkanlığı)'a veri sağladıkları için teşekkürler.
- Bu API'yi kullanan ve geri bildirim sağlayan tüm geliştiricilere teşekkürler.

---

<div align="center">

**Made with ❤️ by [Orhan Aydoğdu](https://github.com/orhanayd)**

</div>
