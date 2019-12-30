async function findWhereOrUndefined (where, root) {
  root = await root
  if (where(root)) {
    return root
  }

  if (root.children) {
    for (let c of root.children) {
      c = await c
      const r = await findWhereOrUndefined(where, c)
      if (r !== undefined) {
        return r
      }
    }
  }

  return undefined
}

async function findChildrenNth (nth, root) {
  root = await root
  if (Array.isArray(root)) {
    if (root.length > nth) {
      return root[nth]
    }

    throw new Error('Could not find a component because the array is empty.')
  }

  return undefined
}

async function getChildren (root) {
  root = await root
  if (root.children) {
    const all = root.children.map(unwrap)
    root.children = await Promise.all(all)
    return root.children
  }

  return undefined
}

async function unwrap (component) {
  const c = await component
  if (typeof c === 'function') {
    return unwrap(c())
  } else {
    return c
  }
}

async function resolving (component, operator) {
  return operator(await unwrap(component))
}

async function resolveComponent (component, operators) {
  return unwrap(operators.reduce(resolving, await component))
}

class TestComponent {
  constructor (component) {
    this.component = component
    this.operators = []
  }

  findWhere (condition) {
    this.operators.push(async root => {
      const r = await findWhereOrUndefined(condition, root)
      if (r === undefined) {
        throw new Error('Could not find component based on condition ' + condition + ' in component tree:\n' + JSON.stringify(root, null, 2))
      }

      return r
    })

    return this
  }

  findById (id) {
    this.operators.push(async root => {
      const r = await findWhereOrUndefined(e => e.props && e.props.get('id') === id, root)
      if (r === undefined) {
        throw new Error('Could not find component with id "' + id + '" in component tree:\n' + JSON.stringify(root, null, 2))
      }

      return r
    })

    return this
  }

  findByClass (className) {
    this.operators.push(async root => {
      const r = await findWhereOrUndefined(e => e.props && e.props.get('class') === className, root)
      if (r === undefined) {
        throw new Error('Could not find component with class "' + className + '" in component tree:\n' + JSON.stringify(await root, null, 2))
      }

      return r
    })

    return this
  }

  findFirst () {
    this.operators.push(async root => {
      const r = await findChildrenNth(0, root)
      if (r !== undefined) {
        return r
      }

      throw new Error('Could not find a component because the component tree is not an array, is a ' + typeof root + ':\n' + JSON.stringify(root, null, 2))
    })

    return this
  }

  findChildren () {
    this.operators.push(async root => {
      const r = await root
      if (Array.isArray(r)) {
        return r
      }

      return getChildren(r)
    })

    return this
  }

  findNth (n) {
    this.operators.push(async root => {
      const r = await findChildrenNth(n, root)
      if (r !== undefined) {
        return r
      }

      throw new Error('Could not find a component because the component tree is not an array, is a ' + typeof root + ':\n' + JSON.stringify(root, null, 2))
    })

    return this
  }

  unfinishedTransition () {
    this.operators.push(async root => {
      const r = await root
      if (r.from && r.to) {
        return r.from
      }

      throw new Error('Could not handle transition because the component tree is not a transition, is a ' + typeof root + ':\n' + JSON.stringify(root, null, 2))
    })

    return this
  }

  finishedTransition () {
    this.operators.push(async root => {
      const r = await root
      if (r.from && r.to) {
        return r.to
      }

      throw new Error('Could not handle transition because the component tree is not a transition, is a ' + typeof root + ':\n' + JSON.stringify(root, null, 2))
    })

    return this
  }

  trigger (event) {
    const { eventName } = event
    this.operators.push(async root => {
      const r = await root
      if (r.props.get(eventName)) {
        return r.props.get(eventName)(event)
      }

      throw new Error('Could not trigger the event ' + JSON.stringify(event) + ' because there is no event handler set up:\n' + JSON.stringify(root, null, 2))
    })

    return this
  }

  async attribute (name) {
    const r = await resolveComponent(this.component, this.operators)
    return (r && r.props && r.props.get(name))
  }

  async textContent () {
    const r = await resolveComponent(this.component, this.operators)
    return (r && r.props && r.props.get('value')) || (r.children && r.children.join(' ')) || r
  }
}

export function testing (el) {
  return new TestComponent(el)
}
