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
				minPoolSize: 5,
				maxPoolSize: 20,
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
	async insertMany(data) {
		if (Array.isArray(data) === false) {
			return false;
		}
		await connection.db(this.db).collection(this.collection).insertMany(data);
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
