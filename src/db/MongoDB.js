/**
 * Created from @orhanayd
 * For MongoDB easy use!
 */

const { MongoClient, ObjectId } = require('mongodb');
const { customAlphabet } = require('nope-id');
const constants = require('../constants');

/*
 * @class
 * @alias module:Bar
 * @param {connection} MongoClient
 */
let connection;
let retry = 0;
const maxRetry = 3;

module.exports.connector = async (connectionString = null) => {
	if (retry < maxRetry) {
		try {
			retry++;
			const uri = connectionString
				? connectionString
				: `mongodb://${process.env.MONGODB_USER}:${encodeURIComponent(process.env.MONGODB_PASS)}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/admin`;
			const mongoClient = new MongoClient(uri, {
				minPoolSize: 1,
				maxPoolSize: 10,
				connectTimeoutMS: 5 * 1000,
			});
			connection = await mongoClient.connect();
			console.log('MongoDB -> Connected');
			return connection;
		} catch (error) {
			console.error(error);
		}
	}
	if (maxRetry >= retry) {
		console.error('MongoDB -> NOT CONNECT');
	}
	connection = false;
};

/**
 * MongoDB CRUD Operation class
 */
class CRUD {
	/**
	 * constructor for mongodb
	 *
	 * @param {String} db
	 * @param {String} collection
	 */
	constructor(db, collection) {
		if (!connection) {
			throw new constants.errors.ServerError('db.connector', 'db connection error !');
		}
		this.db = db;
		this.collection = collection;
		if (process.env.NODE_ENV === constants.STAGES.DEV) {
			this.db = `dev_${this.db}`;
		}
	}

	/**
	 *
	 * Find operator for mongodb
	 *
	 * @param {Object} query
	 * @param {Array} limit
	 * @param {Object} project
	 * @param {Object} sort
	 * @param {Object} options
	 * @returns {Promise<Array>}
	 */
	async find(query = {}, limit = [0, 10], project = {}, sort = {}, collation = {}) {
		return await connection
			.db(this.db)
			.collection(this.collection)
			.find(query)
			.sort(sort)
			.collation(collation)
			.skip(limit[0])
			.limit(limit[1])
			.project(project)
			.toArray();
	}

	/**
	 * Count data with query
	 *
	 * @param {Object} query
	 * @returns
	 */
	async count(query = {}) {
		return await connection.db(this.db).collection(this.collection).countDocuments(query);
	}

	/**
	 * Estimated document count from collection metadata (O(1), no collection scan)
	 *
	 * @returns
	 */
	async estimatedCount() {
		return await connection.db(this.db).collection(this.collection).estimatedDocumentCount();
	}

	/**
	 * mongodb insert operator for object
	 *
	 * @param {Object} data
	 * @returns
	 */
	async insert(data) {
		await connection.db(this.db).collection(this.collection).insertOne(data);
		return true;
	}

	/**
	 * mongodb insert operator for array
	 *
	 * @param {Array} data
	 * @returns
	 */
	async insertMany(data, options = {}) {
		if (Array.isArray(data) === false) {
			return false;
		}
		await connection.db(this.db).collection(this.collection).insertMany(data, options);
		return true;
	}

	/**
	 * mongodb update operator for multiple or single
	 *
	 * @param {Object} query
	 * @param {Object} update
	 * @param {Boolean} multiple
	 * @returns
	 */
	async update(query = null, update = null, multiple = false, options = {}) {
		if (multiple) {
			await connection.db(this.db).collection(this.collection).updateMany(query, update, options);
		} else {
			await connection.db(this.db).collection(this.collection).updateOne(query, update, options);
		}
		return true;
	}

	/**
	 * mongodb delete operation for delete multiple document
	 *
	 * @param {Object} query
	 * @returns
	 */
	async delete(query) {
		await connection.db(this.db).collection(this.collection).deleteMany(query);
		return true;
	}

	/**
	 * bir alanın benzersiz değerleri
	 *
	 * @param {String} field
	 * @param {Object} query
	 * @returns {Promise<Array>}
	 */
	async distinct(field, query = {}) {
		return await connection.db(this.db).collection(this.collection).distinct(field, query);
	}

	/**
	 * toplu yazma — migration'larda tek tek updateOne yerine kullanılır
	 *
	 * @param {Array} operations bulkWrite işlem listesi
	 * @param {Object} options
	 * @returns {Promise<Object>} bulkWrite sonucu
	 */
	async bulkWrite(operations, options = { ordered: false }) {
		if (Array.isArray(operations) === false || operations.length < 1) {
			return { matchedCount: 0, modifiedCount: 0, insertedCount: 0, deletedCount: 0 };
		}
		return await connection.db(this.db).collection(this.collection).bulkWrite(operations, options);
	}

	/**
	 * akış halinde okuma — find() tüm sonucu belleğe alır, büyük migration'larda cursor gerekir
	 *
	 * @param {Object} query
	 * @param {Object} project
	 * @param {Object} options sort / batchSize
	 * @returns {FindCursor}
	 */
	cursor(query = {}, project = {}, options = {}) {
		const { sort = {}, batchSize = 1000 } = options;
		return connection.db(this.db).collection(this.collection).find(query).sort(sort).project(project).batchSize(batchSize);
	}

	/**
	 * index düşürme — hatayı fırlatır (ör. IndexNotFound); yorumlama ve loglama helpers/indexChecker'da
	 *
	 * @param {String} name
	 */
	async dropIndex(name) {
		return await connection.db(this.db).collection(this.collection).dropIndex(name);
	}

	/**
	 * mevcut index'ler (listIndexes); koleksiyon henüz yoksa boş liste
	 *
	 * @returns {Promise<Array>}
	 */
	async indexList() {
		try {
			return await connection.db(this.db).collection(this.collection).indexes();
		} catch (err) {
			if (err.codeName === 'NamespaceNotFound') {
				return [];
			}
			throw err;
		}
	}

	/**
	 * index seçeneğini yerinde değiştirir (collMod): unique'e çevirme, TTL süresi
	 *
	 * @param {Object} index ör. { name: 'earthquake_id_1', unique: true }
	 */
	async collModIndex(index) {
		return await connection.db(this.db).command({ collMod: this.collection, index });
	}

	/**
	 * index kullanım istatistikleri ($indexStats)
	 *
	 * @returns {Promise<Array>}
	 */
	async indexStats() {
		return await connection
			.db(this.db)
			.collection(this.collection)
			.aggregate([{ $indexStats: {} }])
			.toArray();
	}

	/**
	 * mongodb aggregation pipelines
	 *
	 * @param {Object} pipeline aggregation pipeline stages
	 */
	async aggregate(pipeline) {
		return await connection.db(this.db).collection(this.collection).aggregate(pipeline, { allowDiskUse: true }).toArray();
	}

	/**
	 * mongodb get collection list
	 *
	 * @param {Object} pipeline aggregation pipeline stages
	 */
	async listCollection() {
		return await connection.db(this.db).listCollections().toArray();
	}

	async createIndex(data, options = {}) {
		return await connection.db(this.db).collection(this.collection).createIndex(data, options);
	}
}

module.exports.id = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz', 13);
module.exports.CRUD = CRUD;
module.exports.ObjectId = ObjectId;
