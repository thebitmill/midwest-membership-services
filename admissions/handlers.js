'use strict'

const _ = require('lodash')
const factory = require('midwest/factories/rest-handlers')

const columns = ['id', 'regex', 'createdAt', 'createdById', 'modifiedAt']
const resolveCache = require('../resolve-cache')

// modules > project
module.exports = _.memoize((state) => {
  const handlers = factory({
    db: state.db,
    emitter: state.emitter,
    table: 'admissions',
    columns,
  })

  function findMatches (email) {
    return handlers.getAll().then((admissions) => {
      if (admissions) {
        admissions = admissions.filter((admission) => {
          const regex = new RegExp(admission.regex)

          return regex.test(email)
        })

        if (!admissions.length) admissions = undefined
      }

      return admissions
    })
  }

  return Object.assign(handlers, {
    findMatches,
  })
}, resolveCache)
