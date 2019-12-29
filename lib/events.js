export function event (name, props) {
  return { eventName: name, ...props }
}

export function click () {
  return event('onclick', {})
}

export function keypress (keyCode) {
  return event('onkeypress', { keyCode })
}

export function keydown (keyCode) {
  return event('onkeydown', { keyCode })
}

export function keyup (keyCode) {
  return event('onkeyup', { keyCode })
}
