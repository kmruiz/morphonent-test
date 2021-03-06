# morphonent-test
[![Build Status](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Fkmruiz%2Fmorphonent-test%2Fbadge&style=flat)](https://actions-badge.atrox.dev/kmruiz/morphonent-test/goto)
![Coveralls github](https://img.shields.io/coveralls/github/kmruiz/morphonent-test)
![npm](https://img.shields.io/npm/v/morphonent-test.svg) 
![npm bundle size](https://img.shields.io/bundlephobia/min/morphonent-test.svg) 
![npm](https://img.shields.io/npm/dm/morphonent-test.svg)
![npm](https://img.shields.io/npm/l/morphonent-test.svg)
![GitHub issues](https://img.shields.io/github/issues/kmruiz/morphonent-test.svg)
![GitHub pull requests](https://img.shields.io/github/issues-pr/kmruiz/morphonent-test.svg)

morphonent-test is a testing library for verifying components written with [morphonent](https://github.com/kmruiz/morphonent).

* **Easy**. Bundled with sensible defaults.
* **Fast**. Runs entirely without mounting components in the DOM, for fast and easy checking.
* **Async by default**. Designed to work with asynchronous components as easy as with synchronous components.

## Installation

morphonent-test is a simple npm package that you can install with yarn:

`$> yarn add -D morphonent-test`

or npm:

`$> npm install --save-dev morphonent-test`

## Getting Started

morphonent-test exposes a component wrapper entirely made for introspecting and interacting with real components with a fluent API.
We've also designed the library to be TDD friendly, so it's easy to change and mold to your needs.

Let's see an example test, using jest as the test runner.

```js
import { testing, click } from 'morphonent-test';

describe('Counter component', () => {
  describe('counting upwards', () => {
    it('should count +1 when the button is clicked', async () => {
      const counter = (count) => element('button', { id: 'add-1', onclick: () => counter(count + 1) }, count);
      const driver = testing(counter(0));

      const currentCount = await driver.findById('add-1').trigger(click()).textContent();
      expect(currentCount).toBe('1');
    });
  })
})
```

You can also mock more concrete behaviour if you extract your event handlers.

```js
import { testing, click } from 'morphonent-test';

describe('Counter component', () => {
  describe('counting upwards', () => {
     it('should count +1 when the button is clicked', async () => {
      const counter = (count, next) => element('button', { id: 'add-1', onclick: () => next(count + 1, next) }, count);
      const fakeCounter = jest.fn(count => count)
      const driver = testing(counter(0, fakeCounter));

      const currentCount = await driver.findById('add-1').trigger(click()).textContent();
      expect(fakeCounter.mock.calls[0][0]).toBe(1);
      expect(currentCount).toBe(1);
    });
  })
})
```

## API

### testing

Builds a test component based on a root component. This is the main entrypoint to the testing library.

### TestComponent.findWhere

Allows you to find a component given a condition. This is a low-level function and should be used only when strictly needed. Finding a component based on arbitrary conditions can be a hot-spot of bugs and expensive tests.

```js
const blueGreen = testing(() => element('div', {}, element('div', { class: 'blue' }, 'Blue'), element('div', { class: 'green' }, 'Green')))

const green = blueGreen.findWhere(el => el.props && el.props.get('class') === 'green')
expect(await green.textContent()).toBe('Green')
```

### TestComponent.findById

Allows you to find a component given it's ID.

```js
const blueGreen = testing(() => element('div', {}, element('div', { id: 'blue' }, 'Blue'), element('div', { id: 'green' }, 'Green')))

const green = blueGreen.findById('green')
expect(await green.textContent()).toBe('Green')
```

### TestComponent.findByClass

Allows you to find a component given it's class name.

```js
const blueGreen = testing(() => element('div', {}, element('div', { class: 'blue' }, 'Blue'), element('div', { class: 'green' }, 'Green')))

const green = blueGreen.findByClass('green')
expect(await green.textContent()).toBe('Green')
```

### TestComponent.findChildren

Allows you to find the children elements of a component, if any.

```js
const blueGreen = testing(() => element('div', {}, 'Blue', 'Green'))

const all = await blueGreen.findChildren().textContent()
expect(all).toStrictEqual(['Blue', 'Green'])
```

### TestComponent.findFirst

Allows you to find the first element of a children tree.

```js
const blueGreen = testing(() => element('div', {}, 'Blue', 'Green'))

const blue = await blueGreen.findChildren().findFirst().textContent()
expect(blue).toBe('Blue')
```

### TestComponent.findNth

Allows you to find the Nth element of a children tree, starting from 0.

```js
const blueGreen = testing(() => element('div', {}, 'Blue', 'Green'))

const green = await blueGreen.findChildren().findNth(1).textContent()
expect(green).toBe('Green')
```

### TestComponent.unfinishedTransition

Allows you to navigate through the first step of a transition.

```js
const firstStep = () => 'Hello'
const secondStep = async () => 'Bye'

const all = testing(() => transition(firstStep, secondStep))
const result = await all.unfinishedTransition().textContent()

expect(result).toBe('Hello')
```

### TestComponent.finishedTransition

Allows you to navigate through the second step of a transition.

```js
const firstStep = () => 'Hello'
const secondStep = async () => 'Bye'

const all = testing(() => transition(firstStep, secondStep))
const result = await all.finishedTransition().textContent()

expect(result).toBe('Bye')
```

### TestComponent.write

Simulates a set of events for writing text using the keyboard on the current selected component. By default, it triggers the `onkeypress` event, but you can define any event that might suit your test.

```js
const text = faker.internet.userName()
const input = (value) => element('input', { type: 'text', onkeypress: (ev) => input(ev.currentTarget.value.toUpperCase()), value })

const result = await testing(input('')).write(text).textContent()
expect(result).toBe(text.toUpperCase())
```

Changing the type of event to be triggered:

```js
import { keyup } from 'morphonent-test'

const text = faker.internet.userName()
const input = (value) => element('input', { type: 'text', onkeyup: (ev) => input(ev.currentTarget.value.toUpperCase()), value })

const result = await testing(input('')).write(text, keyup).textContent()
expect(result).toBe(text.toUpperCase())
```

### TestComponent.trigger

Simulates an event on the current selected component and switches the pointer to the root component that returns the event handler. Right now, there are four default event types:

* click()
* keypress(keyCode)
* keydown(keyCode)
* keyup(keyCode)

But you can trigger other events using the event(name, props) function. For example, the keypress event is implemented as:

```js
export function keypress (keyCode) {
  return event('onkeypress', { keyCode })
}
```

An example test that clicks on a button that shows a message would be:

```js
const hello = (clicked) => element('div', {},
  element('button', { id: 'button', onclick: () => hello(true) }, 'Click me!'),
  element('span', { id: 'log' }, clicked ? 'Yes!' : 'No!')
)

const test = testing(hello(false))
const clickedTest = test.findById('button').trigger(click())
const content = await clickedTest.findById('log').textContent()
expect(content).toBe('Yes!')
```

### TestComponent.attribute

Returns a promise with the value of the specified attribute on an element.

```js
const myComponent = element('div', { awesome: 'yes' })
const awesome = await testing(myComponent).attribute('awesome')

expect(awesome).toBe('yes')
```

### TestComponent.textContent

Returns a promise with the text content of an element. If the component has a `value` attribute, it will return it's value instead (for inputs, for example).

```js
const myComponent = element('div', { awesome: 'yes' }, 'Hello World!')
const awesome = await testing(myComponent).textContent()

expect(awesome).toBe('Hello World!')
```

### TestComponent.count

Returns the number of elements matched.

```js
const list = () => element('p', {}, 1, 2, 3)

const result = await testing(list).findChildren().count()
expect(result).toBe(3)
```
