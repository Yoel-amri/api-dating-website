function newSqlError(message, name) {
  if (message.includes('Duplicate')) {
    let duplicateColumn = message.split(' ')[6];
    throw new SqlDuplicateColumnError(message, duplicateColumn);
  }
  else
    throw new SqlError(message);
}

class SqlError extends Error {
    constructor(message) {
      super(message);
      this.name = this.constructor.name;
      Error.captureStackTrace(this, this.constructor);
    }
}

class SqlDuplicateColumnError extends SqlError {
  constructor(message, duplicateColumn) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
    this.duplicateColumn = duplicateColumn;
  }
}

class OrmError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}


module.exports = {
    SqlError,
    newSqlError,
    SqlDuplicateColumnError,
    OrmError,
}