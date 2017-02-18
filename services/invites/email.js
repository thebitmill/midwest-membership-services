'use strict';

const { h } = require('jsx-node');

module.exports = (props = {}) => h(
  'table',
  { align: 'center', width: '600' },
  h(
    'tr',
    null,
    h(
      'td',
      { style: 'text-align: center; font-family: Arial, sans-serif;', valign: 'top' },
      h(
        'h1',
        null,
        'Hello! You have been invited to ',
        props.site.title,
        ' by ',
        props.inviter
      ),
      h(
        'p',
        null,
        'Follow the link below to redeem your new account!'
      ),
      h(
        'p',
        null,
        h(
          'a',
          { href: props.link },
          props.link
        )
      ),
      h(
        'p',
        null,
        'This link will only be active for 48 hours.'
      ),
      h(
        'p',
        null,
        h(
          'strong',
          null,
          'This email is autogenerated and cannot be replied to.'
        )
      )
    )
  )
);