/**
 * Created from @orhanayd
 * For MongoDB easy use!
 */

const { MongoClient, ObjectId } = require('mongodb');
const { customAlphabet } = require('nanoid');
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
		try {
			if (connection) {
				const result = await connection
					.db(this.db)
					.collection(this.collection)
					.find(query)
					.sort(sort)
					.collation(collation)
					.skip(limit[0])
					.limit(limit[1])
					.project(project)
					.toArray();
				return result;
			}
			return false;
		} catch (error) {
			console.error(error);
			return false;
		}
	}

	/**
	 * Count data with query
	 *
	 * @param {Object} query
	 * @returns
	 */
	async count(query = {}) {
		try {
			if (connection) {
				const result = await connection.db(this.db).collection(this.collection).countDocuments(query);
				return result;
			}
			return false;
		} catch (error) {
			console.error(error);
			return false;
		}
	}

	/**
	 * mongodb insert operator for object
	 *
	 * @param {Object} data
	 * @returns
	 */
	async insert(data) {
		try {
			if (connection) {
				const result = await connection.db(this.db).collection(this.collection).insertOne(data);
				// biome-ignore lint/complexity/useOptionalChain: <explanation>
				if (result && result.insertedId) {
					return [result.insertedId];
				}
				return false;
			}
			return false;
		} catch (error) {
			console.error(error);
			return false;
		}
	}

	/**
	 * mongodb insert operator for array
	 *
	 * @param {Array} data
	 * @returns
	 */
	async insertMany(data, objector = true) {
		try {
			if (connection) {
				if (data === false) {
					return false;
				}
				const result = await connection.db(this.db).collection(this.collection).insertMany(data);
				// biome-ignore lint/complexity/useOptionalChain: <explanation>
				if (result && result.insertedCount && result.insertedCount > 0) {
					return result.insertedIds;
				}
				return false;
			}
			return false;
		} catch (error) {
			console.error(error);
			return false;
		}
	}

	/**
	 * mongodb update operator for multiple or single
	 *
	 * @param {Object} query
	 * @param {Object} update
	 * @param {Boolean} multiple
	 * @returns
	 */
	async update(query = null, update = null, multiple = false) {
		if (query === null || update === null) {
			return false;
		}
		try {
			if (connection) {
				let result;
				if (multiple) {
					result = await connection.db(this.db).collection(this.collection).updateMany(query, update);
				} else {
					result = await connection.db(this.db).collection(this.collection).updateOne(query, update);
				}
				if (result) {
					return { modifiedCount: result.modifiedCount, matchedCount: result.matchedCount };
				}
				return false;
			}
			return false;
		} catch (error) {
			console.error(error);
			return false;
		}
	}

	/**
	 * mongodb delete operation for delete multiple document
	 *
	 * @param {Object} query
	 * @returns
	 */
	async delete(query, objector = true) {
		try {
			if (connection) {
				const result = await connection.db(this.db).collection(this.collection).deleteMany(query);
				if (result) {
					return { result: result.deletedCount };
				}
				return false;
			}
			return false;
		} catch (error) {
			console.error(error);
			return false;
		}
	}

	/**
	 * mongodb aggregation pipelines
	 *
	 * @param {Object} pipeline aggregation pipeline stages
	 */
	async aggregate(pipeline) {
		try {
			if (connection) {
				const result = await connection.db(this.db).collection(this.collection).aggregate(pipeline, { allowDiskUse: true }).toArray();
				if (result) {
					return result;
				}
				return false;
			}
			return false;
		} catch (error) {
			console.error(error);
			return false;
		}
	}

	/**
	 * mongodb get collection list
	 *
	 * @param {Object} pipeline aggregation pipeline stages
	 */
	async listCollection() {
		try {
			if (connection) {
				const result = await connection.db(this.db).listCollections().toArray();
				if (result) {
					return result;
				}
				return false;
			}
			return false;
		} catch (error) {
			console.error(error);
			return false;
		}
	}

	async createIndex(data) {
		try {
			if (connection) {
				const result = await connection.db(this.db).collection(this.collection).createIndex(data);
				if (result) {
					return result;
				}
				return false;
			}
			return false;
		} catch (error) {
			console.error(error);
			return false;
		}
	}
}

module.exports.id = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz', 13);
module.exports.CRUD = CRUD;
module.exports.ObjectId = ObjectId;
