function paramsAdder(thiss, params) {
	if (params.length === 0) {
		return thiss;
	}
	for (const key in params[0]) {
		thiss[key] = params[0][key];
	}
	return thiss;
}

class ServerError extends Error {
	constructor(operation = '', message = '', ...params) {
		super(...params);
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, ServerError);
		}
		this.name = 'ServerError';
		this.operation = `${operation}`;
		this.errorCode = 1;
		this.httpStatus = 500;
		this.message = `${message}`;
		this.date = new Date();
		paramsAdder(this, params);
	}
}

class MissingField extends Error {
	constructor(operation = '', message = '', ...params) {
		super(...params);
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, MissingField);
		}
		this.name = 'MissingField';
		this.operation = `${operation}`;
		this.httpStatus = 406;
		this.errorCode = 2;
		this.message = `${message}`;
		this.date = new Date();
		paramsAdder(this, params);
	}
}

class UnAuth extends Error {
	constructor(operation = '', message = '', ...params) {
		super(...params);
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, UnAuth);
		}
		this.name = 'UnAuth';
		this.operation = `${operation}`;
		this.errorCode = 3;
		this.message = `${message}`;
		this.httpStatus = 401;
		this.date = new Date();
		paramsAdder(this, params);
	}
}

class Forbidden extends Error {
	constructor(operation = '', message = '', ...params) {
		super(...params);
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, Forbidden);
		}
		this.name = 'Forbidden';
		this.operation = `${operation}`;
		this.errorCode = 4;
		this.httpStatus = 403;
		this.message = `${message}`;
		this.date = new Date();
		paramsAdder(this, params);
	}
}

class WrongParam extends Error {
	constructor(operation = '', message = '', ...params) {
		super(...params);
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, WrongParam);
		}
		this.name = 'WrongParam';
		this.operation = `${operation}`;
		this.errorCode = 5;
		this.httpStatus = 422;
		this.message = `${message}`;
		this.date = new Date();
		paramsAdder(this, params);
	}
}

class TooManyRequest extends Error {
	constructor(operation = '', message = '', ...params) {
		super(...params);
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, TooManyRequest);
		}
		this.name = 'TooManyRequest';
		this.operation = `${operation}`;
		this.errorCode = 7;
		this.httpStatus = 429;
		this.message = `${message}`;
		this.date = new Date();
		paramsAdder(this, params);
	}
}

class NotFound extends Error {
	constructor(operation = '', message = '', ...params) {
		super(...params);
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, NotFound);
		}
		this.name = 'NotFound';
		this.operation = `${operation}`;
		this.errorCode = 8;
		this.httpStatus = 404;
		this.message = `${message}`;
		this.date = new Date();
		paramsAdder(this, params);
	}
}
module.exports = {
	ServerError,
	MissingField,
	UnAuth,
	Forbidden,
	WrongParam,
	TooManyRequest,
	NotFound,
};
