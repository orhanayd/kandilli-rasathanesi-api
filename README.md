### Kandilli Rasathanesi API
Kandilli Rasathanesi'nin yayınladığı son depremler listesi için API. (last minute earthquakes in turkey parsing from Kandilli Observatory XML)

### API DOC:
https://api.orhanaydogdu.com.tr/deprem/api-docs/

### Özellikleri:
- **GeoJson** ile haritaya kolay aktırabilir,
- Depremin **nerede** olduğunu,
- Deprem noktasına **en yakın il sınırı bilgisi**,
- Deprem noktasına yakın **Havalimanları** ve **Uzaklıkları**
- Depremin zaman bilgileri ve depreme özel ID.
- **Tarih bazlı** deprem listesi

##### https://api.orhanaydogdu.com.tr/deprem/kandilli/live
##### Örnek cevap:

```json
{
	"earthquake_id": "pYD0NoKuMtIhv", -> deprem uniq id
	"title": "YENIKOY ACIKLARI-TEKIRDAG (MARMARA DENIZI)", -> kandilli deprem başlığı
	"date": "2023.02.13 06:33:53", -> kandilli deprem zaman damgası
	"lokasyon": "YENIKOY ACIKLARI-TEKIRDAG (MARMARA DENIZI)", -> !DEPRECATED!
	"lat": 40.77, ->  !DEPRECATED!
	"lng": 27.4988, !DEPRECATED!
	"mag": 3, -> Deprem büyüklüğü
	"depth": 14.8, -> Depremin kaç km yerin derinliğinde olduğu
	"coordinates": [27.4988, 40.77], !DEPRECATED!
	"geojson": { -> GeoJson Datası
		"type": "Point",
		"coordinates": [27.4988, 40.77]
	},
	"location_properties": {
		"closestCity": { 
			"name": "Tekirdağ" -> En yakın il sınırı
		},
		"epiCenter": {
			"name": "?" -> Depremin epicenterı
		},
		"airports": [{ -> En yakın havalimanları ve uzaklıkları
			"distance": 54244.23451722934,
			"name": "Tekirdağ Çorlu Havalimanı",
			"code": "TEQ", -> havalimanı kodu
			"coordinates": { -> havalimanın geojson bilgisi
				"type": "Point",
				"coordinates": [27.921, 41.1392]
			}
		}, {
			"distance": 64525.62026682466,
			"name": "Bandırma Havalimanı",
			"code": "BDM",
			"coordinates": {
				"type": "Point",
				"coordinates": [27.9777, 40.318]
			}
		}, {
			"distance": 113420.6301975318,
			"name": "Atatürk Havalimanı",
			"code": "IST",
			"coordinates": {
				"type": "Point",
				"coordinates": [28.819198608398438, 40.9788613095528]
			}
		}]
	},
	"rev": null,
	"date_stamp": "2023-02-13",
	"date_day": "2023-02-13",
	"date_hour": "06:33:53",
	"timestamp": "1676266433",
	"location_tz": "Europe/Istanbul"
}
```

## Not
Ticari amaçlı kullanmak isteyenlere: "Söz konusu bilgi, veri ve haritalar Boğaziçi Üniversitesi Rektörlüğü’nün yazılı izni ve onayı olmadan herhangi bir şekilde ticari amaçlı kullanılamaz." - İsteklerinizi veya sorularınızı info@orhanaydogdu.com.tr den iletebilirsiniz.
