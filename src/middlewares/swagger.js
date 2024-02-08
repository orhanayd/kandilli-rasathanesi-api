/* eslint-disable indent */
module.exports = {
    openapi: '3.0.0',
    info: {
        version: '1.0.0',
        title: 'Kandilli Rasathanesi Swagger document',
        description: 'Kandilli Rasathanesi\'nin yayınladığı son depremler listesi için API. (last minute earthquakes in turkey parsing from Kandilli Observatory XML)\nTicari amaçlı kullanmak isteyenlere: "Söz konusu bilgi, veri ve haritalar Boğaziçi Üniversitesi Rektörlüğü’nün yazılı izni ve onayı olmadan herhangi bir şekilde ticari amaçlı kullanılamaz." - İsteklerinizi veya sorularınızı info@orhanaydogdu.com.tr den iletebilirsiniz.',
    },
    security: {
        HeaderAuthCron: {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization'
        },
        HeaderAuthStats: {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization'
        }
    },
    baseDir: __dirname,
    filesPattern: '../routes/**/*.js',
    notRequiredAsNullable: false,
    exposeApiDocs: true,
    exposeSwaggerUI: true,
    swaggerUIPath: '/deprem/api-docs',
    apiDocsPath: '/deprem/api-docs-download.json',
    swaggerUiOptions: {
        swaggerOptions: {
            persistAuthorization: true
        },
    },
};