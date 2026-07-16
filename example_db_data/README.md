# example_db_data

Canlı MongoDB'den (`earthquake` ve `dev_earthquake` veritabanları) alınmış örnek dokümanlar. Her koleksiyondan en yeni 5 kayıt, `_id` alanı hariç (`projection: { _id: false }`) export edilmiştir.

| Dosya | Kaynak | İçerik |
| --- | --- | --- |
| `earthquake.data_v2.json` | `earthquake.data_v2` | Deprem dokümanları (Kandilli + AFAD birleşik şema) |
| `earthquake.data_v2_days.json` | `earthquake.data_v2_days` | Aylık arşiv işleme durum kayıtları (`date`, `status`) |
| `earthquake.bans.json` | `earthquake.bans` | Rate limit kaynaklı IP ban kayıtları (TTL: `expires_at`) |
| `earthquake.requests.json` | `earthquake.requests` | Rate limit istek sayacı kayıtları |
| `dev_earthquake.data_v2.json` | `dev_earthquake.data_v2` | DEV ortamı deprem dokümanları |
| `dev_earthquake.requests.json` | `dev_earthquake.requests` | DEV ortamı istek kayıtları (localhost) |

> **Not:** `bans` ve `requests` dosyalarındaki gerçek kullanıcı IP adresleri, kişisel veri sızdırmamak için dokümantasyon amaçlı rezerve IP aralıklarıyla (RFC 5737: `198.51.100.x`, `203.0.113.x`; RFC 3849: `2001:db8::/32`) maskelenmiştir. Diğer tüm alanlar orijinal verilerdir.
