/**
 * Kandilli XML encoding düzeltmesi.
 *
 * Kaynak `<?xml version="1.0" encoding="ISO-8859-1" ?>` bildiriyor ama içerik aslında
 * ISO-8859-9 (latin5 / Türkçe). axios content-type'da charset olmadığı için UTF-8 varsayıyor,
 * bu da Türkçe karakterleri U+FFFD'ye çeviriyordu (ör. "GÜNEY KIBRIS" -> "G<FFFD>NEY KIBRIS").
 *
 * ISO-8859-9, ISO-8859-1'den yalnızca 6 kod noktasında ayrılır; bu yüzden latin1 olarak
 * decode edip bu 6 karakteri map'lemek iconv bağımlılığı olmadan doğru sonucu verir.
 */
const LATIN1_TO_LATIN5 = {
	Ð: 'Ğ',
	Ý: 'İ',
	Þ: 'Ş',
	ð: 'ğ',
	ý: 'ı',
	þ: 'ş',
};

/**
 * ISO-8859-9 kodlanmış buffer'ı UTF-8 string'e çevirir.
 *
 * @param {Buffer} buffer
 * @returns {String}
 */
module.exports.decodeLatin5 = (buffer) => {
	return Buffer.from(buffer)
		.toString('latin1')
		.replace(/[ÐÝÞðýþ]/g, (char) => LATIN1_TO_LATIN5[char]);
};
