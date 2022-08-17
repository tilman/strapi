'use strict';

/** @typedef {import('knex').Knex} Knex */
/** @typedef {import('./join').Join} Join */
/** @typedef {import('./join').ExecutableJoin} ExecutableJoin */

const DEFAULT_JOIN = 'leftJoin';

const createPivotJoin = ({ joinTable, alias, tragetMeta, on, type }, ctx) => {
  const { qb } = ctx;

  const joins = [];

  const joinAlias = qb.getAlias();
  joins.push({
    alias: joinAlias,
    referencedTable: joinTable.name,
    referencedColumn: joinTable.joinColumn.name,
    rootColumn: joinTable.joinColumn.referencedColumn,
    rootTable: qb.alias,
    on: joinTable.on,
    orderBy: joinTable.orderBy,
  });

  const referenceAlias = alias || qb.getAlias();
  joins.push({
    alias: referenceAlias,
    referencedTable: tragetMeta.tableName,
    referencedColumn: joinTable.inverseJoinColumn.referencedColumn,
    rootColumn: joinTable.inverseJoinColumn.name,
    rootTable: joinAlias,
    on,
    type,
  });

  return joins;
};

/**
 * @returns {Array<ExecutableJoin>} executable joins
 */
const createJoin = ({ alias, target, on, type = DEFAULT_JOIN }, ctx) => {
  const { db, uid, qb } = ctx;

  // This isn't always valid if in sub join. we need to allow passing another uid or alias
  const attribute = db.metadata.get(uid).attributes[target];

  if (attribute.type !== 'relation') {
    throw new Error(`Cannot join on non relational field ${target}`);
  }

  const tragetMeta = db.metadata.get(attribute.target);

  const { joinColumn, joinTable } = attribute;

  if (joinColumn) {
    return [
      {
        alias,
        referencedTable: tragetMeta.tableName,
        referencedColumn: joinColumn.referencedColumn,
        rootColumn: joinColumn.name,
        rootTable: qb.alias,
        on,
        type,
      },
    ];
  }

  if (joinTable) {
    return createPivotJoin({ joinTable, alias, tragetMeta, on, type }, ctx);
  }

  throw new Error('Unknown join error');
};

/**
 * Transform declarative joins to executable joins
 * @param {Array<Join>} joins list of registered joins
 * @param {QueryCtx} ctx  query context
 * @retuns {Array<ExecutableJoin>} joins to execute
 */
const processJoins = (joins, ctx) => {
  const { qb } = ctx;

  const executableJoins = [];

  joins.forEach((join) => {
    const { target, alias = qb.getAlias(), on, type = DEFAULT_JOIN } = join;

    if (typeof target === 'object') {
      return executableJoins.push(target);
    }

    const joins = createJoin({ target, on, type, alias }, ctx);
    return executableJoins.push(...joins);
  });

  return executableJoins;
};

// TODO: toColumnName for orderBy & on
/**
 * Apply executable join to a knex query
 * @param {Knex} knexQb
 * @param {ExecutableJoin} join
 */
const applyJoin = (knexQb, join) => {
  const {
    type = DEFAULT_JOIN,
    alias,
    referencedTable,
    referencedColumn,
    rootColumn,
    rootTable,
    on,
    orderBy,
  } = join;

  knexQb[type](`${referencedTable} as ${alias}`, (inner) => {
    inner.on(`${rootTable}.${rootColumn}`, `${alias}.${referencedColumn}`);

    if (on) {
      Object.keys(on).forEach((key) => {
        inner.onVal(`${alias}.${key}`, on[key]);
      });
    }
  });

  if (orderBy) {
    Object.keys(orderBy).forEach((column) => {
      const direction = orderBy[column];
      knexQb.orderBy(`${alias}.${column}`, direction);
    });
  }
};

/**
 * Apply executable joins to a knex query
 * @param {Knex} knexQb
 * @param {Array<ExecutableJoin>} joins
 */
const applyJoins = (knexQb, joins) => {
  joins.forEach((join) => applyJoin(knexQb, join));
};

module.exports = {
  createJoin,
  createPivotJoin,
  processJoins,
  applyJoins,
  applyJoin,
};
