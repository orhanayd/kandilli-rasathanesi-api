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
##### https://api.orhanaydogdu.com.tr/deprem/kandilli/archive
##### https://api.orhanaydogdu.com.tr/deprem/data/search
##### https://api.orhanaydogdu.com.tr/deprem/statics/cities
Endpoint kullanım detayları için Dökümanı ziyaret etmeyi unutmayın :)

##### https://api.orhanaydogdu.com.tr/deprem/kandilli/live
##### Örnek cevap:

```json
{
	"earthquake_id": "EoIrMsfMSC19f", -> benzersiz deprem id
	"provider": "kandilli", -> deprem bilgi sağlayıcı
	"title": "CALIS-ELBISTAN (KAHRAMANMARAS)", -> sağlayıcı tarafından belirlenen başlık
	"date": "2023.03.08 02:54:44", -> deprem zaman bilgisi
	"mag": 2, -> deprem büyüklüğü
	"depth": 5, -> deprem derinliği
	"geojson": { -> depremin konum noktası
		"type": "Point",
		"coordinates": [37.0132, 38.1355] (long, lat)
	},
	"location_properties": { -> deprem konum noktası detayları
		"closestCity": { -> depreme en yakın sınırı bulunan şehir
			"name": "Malatya", -> şehir adı
			"cityCode": 44, -> şehir plaka kodu
			"distance": 107595.23337847003, -> deprem noktasına uzaklığı km
			"population": 812580 -> ilgili şehrin nüfusu
		},
		"epiCenter": { -> depremin yaşandığı bölge
			"name": "Kahramanmaraş", -> depremin yaşandığı şehir / null gelebilir
			"cityCode": 46, -> şehirin plaka kodu
			"population": 1177436 -> şehirin nufüsü
		},
		"closestCities": [{ -> deprem noktasına yakın diğer şehirler
			"name": "Malatya",
			"cityCode": 44,
			"distance": 107595.23337847003,
			"population": 812580
		}, {
			"name": "Kayseri",
			"cityCode": 38,
			"distance": 108413.76040441653,
			"population": 1441523
		}, {
			"name": "Osmaniye",
			"cityCode": 80,
			"distance": 112348.6815543367,
			"population": 559405
		}, {
			"name": "Gaziantep",
			"cityCode": 27,
			"distance": 116916.3602226536,
			"population": 2154051
		}, {
			"name": "Adıyaman",
			"cityCode": 2,
			"distance": 120785.66951649316,
			"population": 635169
		}],
		"airports": [{ -> depreme yakıun havalimanları
			"distance": 66757.09191032092, -> depremin yaşandığı noktaya uzaklığı
			"name": "Kahramanmaraş Havalimanı",
			"code": "KCM",
			"coordinates": {
				"type": "Point",
				"coordinates": [36.9473, 37.5374] (long, lat)
			}
		}, {
			"distance": 99806.23459651197,
			"name": "Erhaç Havalimanı",
			"code": "MLX",
			"coordinates": {
				"type": "Point",
				"coordinates": [38.091, 38.4354]
			}
		}, {
			"distance": 135359.60289478218,
			"name": "Adıyaman Havalimanı",
			"code": "ADF",
			"coordinates": {
				"type": "Point",
				"coordinates": [38.4691, 37.7314]
			}
		}]
	},
	"rev": null, -> null değilse revize edilmiş bir deprem bilgisi
	"date_time": "2023-03-08 02:54:44", -> date time YYYY-MM-DD HH:mm:ss
	"created_at": 1678240484, -> unix timestamp
	"location_tz": "Europe/Istanbul" -1 statik bilgi
}
```

## Not
Ticari amaçlı kullanmak isteyenlere: "Söz konusu bilgi, veri ve haritalar Boğaziçi Üniversitesi Rektörlüğü’nün yazılı izni ve onayı olmadan herhangi bir şekilde ticari amaçlı kullanılamaz." - İsteklerinizi veya sorularınızı info@orhanaydogdu.com.tr den iletebilirsiniz.
