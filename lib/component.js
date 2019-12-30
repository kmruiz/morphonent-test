/*
 * Copyright (c) 2019 Kevin Mas Ruiz
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

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
  constructor (component, operators) {
    this.component = component
    this.operators = operators
  }

  findWhere (condition) {
    return new TestComponent(this.component, [...this.operators,
      async root => {
        const r = await findWhereOrUndefined(condition, root)
        if (r === undefined) {
          throw new Error('Could not find component based on condition ' + condition + ' in component tree:\n' + JSON.stringify(root, null, 2))
        }

        return r
      }
    ])
  }

  findById (id) {
    return new TestComponent(this.component, [...this.operators,
      async root => {
        const r = await findWhereOrUndefined(e => e.props && e.props.get('id') === id, root)
        if (r === undefined) {
          throw new Error('Could not find component with id "' + id + '" in component tree:\n' + JSON.stringify(root, null, 2))
        }

        return r
      }
    ])
  }

  findByClass (className) {
    return new TestComponent(this.component, [...this.operators,
      async root => {
        const r = await findWhereOrUndefined(e => e.props && e.props.get('class') === className, root)
        if (r === undefined) {
          throw new Error('Could not find component with class "' + className + '" in component tree:\n' + JSON.stringify(await root, null, 2))
        }

        return r
      }
    ])
  }

  findFirst () {
    return new TestComponent(this.component, [...this.operators,
      async root => {
        const r = await findChildrenNth(0, root)
        if (r !== undefined) {
          return r
        }

        throw new Error('Could not find a component because the component tree is not an array, is a ' + typeof root + ':\n' + JSON.stringify(root, null, 2))
      }
    ])
  }

  findChildren () {
    return new TestComponent(this.component, [...this.operators,
      async root => {
        const r = await root
        if (Array.isArray(r)) {
          return r
        }

        return getChildren(r)
      }
    ])
  }

  findNth (n) {
    return new TestComponent(this.component, [...this.operators,
      async root => {
        const r = await findChildrenNth(n, root)
        if (r !== undefined) {
          return r
        }

        throw new Error('Could not find a component because the component tree is not an array, is a ' + typeof root + ':\n' + JSON.stringify(root, null, 2))
      }
    ])
  }

  unfinishedTransition () {
    return new TestComponent(this.component, [...this.operators,
      async root => {
        const r = await root
        if (r.from && r.to) {
          return r.from
        }

        throw new Error('Could not handle transition because the component tree is not a transition, is a ' + typeof root + ':\n' + JSON.stringify(root, null, 2))
      }
    ])
  }

  finishedTransition () {
    return new TestComponent(this.component, [...this.operators,
      async root => {
        const r = await root
        if (r.from && r.to) {
          return r.to
        }

        throw new Error('Could not handle transition because the component tree is not a transition, is a ' + typeof root + ':\n' + JSON.stringify(root, null, 2))
      }
    ])
  }

  trigger (event) {
    const { eventName } = event
    return new TestComponent(this.component, [...this.operators,
      async root => {
        const r = await root
        if (r.props.get(eventName)) {
          return r.props.get(eventName)(event)
        }

        throw new Error('Could not trigger the event ' + JSON.stringify(event) + ' because there is no event handler set up:\n' + JSON.stringify(root, null, 2))
      }
    ])
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
  return new TestComponent(el, [])
}
