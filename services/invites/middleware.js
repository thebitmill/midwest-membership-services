'use strict'

const url = require('url')
const _ = require('lodash')
const nodemailer = require('nodemailer')

const Invite = require('./model')

const config = require('../../config')

const smtpTransport = nodemailer.createTransport(config.smtp)

const mw = {
  formatQuery: require('warepot/format-query'),
  paginate: require('warepot/paginate')
}

const template = require('./email.marko')

function create(req, res, next) {
  req.body.inviter = {
    _id: req.user._id,
    email: req.user.email
  }

  Invite.create(req.body, function (err, invite) {
    if (err) return next(err)

    const link = url.resolve(config.site.url, config.membership.paths.register) + '?email=' + invite.email + '&code=' + invite._id

    template.render({ site: config.site, invite, link }, function (err, html) {
      if (err) return next(err)

      smtpTransport.sendMail({
        from: config.membership.invite.from,
        to: req.body.email,
        subject: config.membership.invite.subject,
        html
      }, function (err) {
        if (err) return next(err)
        res.status(201).locals.invite = invite

        return next()
      })
    })
  })
}

function find(req, res, next) {
  const page = Math.max(0, req.query.page) || 0
  const perPage = Math.max(0, req.query.limit) || res.locals.perPage

  const query = Invite.find(_.omit(req.query, 'limit', 'sort', 'page'),
    null,
    { sort: req.query.sort || '-dateCreated', lean: true })

  if (perPage)
    query.limit(perPage).skip(perPage * page)

  query.exec((err, invites) => {
    res.locals.invites = invites
    next(err)
  })
}

function findById(req, res, next) {
  if (req.params.id === 'new') return next()

  Invite.findById(req.params.id, function (err, invite) {
    if (err) return next(err)

    res.status(200).locals.invite = invite
    next()
  })
}


function getAll(req, res, next) {
  Invite.find({}, function (err, invites) {
    if (err) return next(err)
    res.locals.invites = invites
    next()
  })
}

function getActive(req, res, next) {
  Invite.find({ active: true }, function (err, invites) {
    if (err) return next(err)
    res.locals.invites = invites
    next()
  })
}


function remove(req, res, next) {
  Invite.remove({ _id: req.params.id }, function (err) {
    if (err) return next(err)

    res.locals.ok = true

    return next()
  })
}

module.exports = {
  create,
  find,
  findById,
  formatQuery: mw.formatQuery([ 'limit', 'sort', 'page' ]),
  getActive,
  getAll,
  paginate: mw.paginate(Invite, 20),
  remove
}
