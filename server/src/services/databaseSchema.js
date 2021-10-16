const db = require('./dbConnection');
const { SqlError, newSqlError, OrmError } = require('./dbErrors');

function addUpObjectKeys(select)
{
    if (select == {})
        return '*';
    const selectClauseKeys = Object.keys(select);
    var fieldsSql = '';

    for (var i = 0; i < selectClauseKeys.length; i++)
    {
        fieldsSql = fieldsSql + selectClauseKeys[i];
        if (i !== selectClauseKeys.length - 1)
        fieldsSql += ','
    }
    return fieldsSql;
}

function addUpObjectValues(object) {
    let values = [];
    for (const [key, value] of Object.entries(object)) {
        values = [...values, value];
    }
    return values;
}

function addUpObjectKeysWithComma(object) {
    const keys = Object.keys(object);
    var sql = '';

    for (var i = 0; i < keys.length; i++)
    {
        sql = sql + keys[i] +'=?';
        if (i !== keys.length - 1)
            sql += ','
    }
    return sql;
}

function questionMarks(number) {
    let valuesSql = '';
        for (var i = 0; i < number; i++)
        {
            valuesSql = valuesSql + '?';
            if (i < number - 1)
                valuesSql += ','
        }
    return valuesSql;
}

function sequelizeWhereObj(obj, operator = 'AND', comparison = '=') {
    const sqlObj = {
        keys: '',
        values: ''
    }
    const objKeys = Object.keys(obj);
    for (var i = 0; i < objKeys.length; i++) {
        if(obj[objKeys[i]] instanceof Object) {
            if (objKeys[i] === 'OR' || objKeys[i] === 'AND')
            {
                var tmpObj = sequelizeWhereObj(obj[objKeys[i]], ` ${objKeys[i]} `, comparison);
                sqlObj.keys += tmpObj.keys;
                sqlObj.values = [...sqlObj.values, ...tmpObj.values]
            }
            else if (objKeys[i] === 'gt' || objKeys[i] == 'ls') {
                var tmpObj = sequelizeWhereObj(obj[objKeys[i]], operator, objKeys[i] === 'gt' ? '>' : '<');
                sqlObj.keys += tmpObj.keys;
                sqlObj.values = [...sqlObj.values, ...tmpObj.values]
            }
            else if (objKeys[i] === 'in') {
                var tmpObj = sequelizeWhereObj(obj[objKeys[i]], operator, ' IN ');
                sqlObj.keys += tmpObj.keys;
                sqlObj.values = [...sqlObj.values, ...tmpObj.values]
            }
            else {
                if (i === 0)
                    sqlObj.keys += '('
                if (i < objKeys.length - 1)
                {
                    var tmpObj = sequelizeWhereObj(obj[objKeys[i]], operator, comparison) ;
                    sqlObj.keys += tmpObj.keys + ` ${operator} `;
                    sqlObj.values = [...sqlObj.values, ...tmpObj.values]
                }
                else {
                    var tmpObj = sequelizeWhereObj(obj[objKeys[i]], operator, comparison);
                    sqlObj.keys += tmpObj.keys + ')';
                    sqlObj.values = [...sqlObj.values, ...tmpObj.values]
                }
            }
        }
        else if (objKeys[i] === 'pureSql') {
            sqlObj.keys += obj[objKeys[i]];
        }
        else {
            if (i === 0)
                sqlObj.keys = sqlObj.keys + '(';
            if (i < objKeys.length - 1) {
                sqlObj.keys = sqlObj.keys + `${objKeys[i]}${comparison}?` + ` AND `;
                sqlObj.values = [...sqlObj.values, obj[objKeys[i]]]
            }
            else {
                sqlObj.keys = sqlObj.keys + `${objKeys[i]}${comparison}?` + ')';
                sqlObj.values = [...sqlObj.values, obj[objKeys[i]]]
            }
        };
    }
    return sqlObj;
};

function analyseQuery(query) {
    let queryAnalysed = {
        whereClauseKeys: '',
        whereClauseValues: [],
        selectFields: '*',
        dataValues: [],
        dataKeys: '',
        dataKeysWithComma: '',
        offset: '',
        limit: '',
        orderBy: ''
    };
    for (const [key, value] of Object.entries(query)) {
        if (key === 'select') {
            queryAnalysed.selectFields = addUpObjectKeys(value);
            if (queryAnalysed.selectFields === '')
                queryAnalysed.selectFields = '*'
        }
        else if (key === 'where') {
            const analysedWhere = sequelizeWhereObj(value);
            queryAnalysed.whereClauseKeys = analysedWhere.keys;
            queryAnalysed.whereClauseValues = analysedWhere.values
        }
        else if (key === 'data') {
            queryAnalysed.dataKeys = addUpObjectKeys(value);
            queryAnalysed.dataValues = addUpObjectValues(value);
            queryAnalysed.dataKeysWithComma = addUpObjectKeysWithComma(value);
        }
        else if (key === 'from') {
            queryAnalysed.from = value
        }
        else if (key === 'offset') {
            queryAnalysed.offset = value
        }
        else if (key === 'limit') {
            queryAnalysed.limit = value
        }
        else if (key === 'orderBy') {
            queryAnalysed.orderBy  =  value;
        }
    }
    // console.log(queryAnalysed);
    return (queryAnalysed)
}

class databaseModel {
    constructor (columnNames, tableName) {
        this.columnNames = columnNames
        this.tableName = tableName
    }

    async findMany(query) {
        const queryAnalysed = analyseQuery(query);
        let findManySql = 'SELECT ' + queryAnalysed.selectFields + ' FROM ' + `${queryAnalysed.from ? queryAnalysed.from: this.tableName}` + ' WHERE ' + queryAnalysed.whereClauseKeys
        if (queryAnalysed.orderBy) {
            findManySql += ` order by ${queryAnalysed.orderBy} `;
        }
        if (queryAnalysed.limit) {
            findManySql += ` limit ${queryAnalysed.limit}`
        }
        if (queryAnalysed.offset) {
            findManySql += ` offset ${queryAnalysed.offset} `
        }
        console.log("SQL===>", findManySql)
        try {
            const rows = await db.query(findManySql, [...queryAnalysed.whereClauseValues]);
            return rows;
        }
        catch (e) {
            console.log(e.fields);
            throw newSqlError(e.message, e.name);
        }
    }

    async update(query) {
        const queryAnalysed = analyseQuery(query);
        console.log(queryAnalysed);
        const updateSql = 'UPDATE ' + this.tableName + ' SET ' + queryAnalysed.dataKeysWithComma + ' WHERE ' + queryAnalysed.whereClauseKeys;
        try {
            const rows = await db.query(updateSql, [...queryAnalysed.dataValues, ...queryAnalysed.whereClauseValues]);
            return rows;
        }
        catch (e) {
            throw new SqlError("SQL ERROR", e.name);
        }
    }

    async createOne(query) {
        const queryAnalysed = analyseQuery(query);
        if (query.data) {
            const dataKeys = Object.keys(query.data);
            let valuesSql = questionMarks(dataKeys.length);
            // console.log("Adding values to database ===>\n",valuesSql);
            const insertSql = 'INSERT INTO ' + this.tableName +'('+queryAnalysed.dataKeys+')'+ ' value(' + valuesSql + ')';
            // console.log("Generate sql for insert is ===>", insertSql);
            try {
                const rows = await db.query(insertSql, queryAnalysed.dataValues);
                return(rows);
            }
            catch (e) {
                newSqlError(e.message, e.name);
            }
        }
        else
            throw new OrmError('INPUT DATA NOT FOUND');
    }

    async delete(query) {
        const queryAnalysed = analyseQuery(query);
        const deleteSql = `DELETE FROM ${this.tableName} WHERE ` + queryAnalysed.whereClauseKeys
        try {
            const rows = await db.query(deleteSql, queryAnalysed.whereClauseValues);
            return rows;
        } catch (e) {
            newSqlError(e.message);
        }
    }
}

module.exports = {
    databaseModel,
}

    // const where = {
    //     OR: [
    //         {
    //             id: 1,
    //             id2: 2
    //         },
    //         {
    //             id: 2
    //         },
    //         {
    //             OR : [
    //                 {
    //                     AND : [ 
    //                         {
    //                             test: 23,
    //                         },
    //                         {
    //                             testa: 23,
    //                         }
    //                     ]
    //                 },
    //                 {
    //                     OR: [
    //                         {
    //                             test3: 32
    //                         },
    //                         {
    //                             test3: 32
    //                         }
    //                     ]
    //                 }
    //             ]
    //         },
    //     ]
    // };

    // const newuser = new user();
    // try {
    //     newuser.update({
    //         where: where,
    //         data: {
    //             firstname: 'youness',
    //             lastname: 'nadi canadi'
    //         }
    //     })
    // }
    // catch (e) {
    //     console.error("test")
    // }
    