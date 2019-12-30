/*
 * Copyright (c) 2019 Kevin Mas Ruiz
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import '@babel/polyfill'
import { element, transition } from 'morphonent'
import { testing, click } from '../lib/index'
import faker from 'faker'

describe('test suite', () => {
  it('should find an element with a custom condition', async () => {
    const randomProp = faker.internet.userName()
    const text = faker.internet.userName()

    let component = () => element('div', {}, element('div', { randomProp }, text))
    const result = await testing(component).findWhere(r => r.props.get('randomProp') === randomProp).textContent()

    expect(result).toBe(text)
  })

  it('should find an element by id', async () => {
    const id = faker.internet.userName()
    const text = faker.internet.userName()

    let component = () => element('div', {}, element('div', { id }, text))
    const result = await testing(component).findById(id).textContent()

    expect(result).toBe(text)
  })

  it('should find an element by class', async () => {
    const className = faker.internet.userName()
    const text = faker.internet.userName()

    let component = () => element('div', {}, element('div', { class: className }, text))
    const result = await testing(component).findByClass(className).textContent()

    expect(result).toBe(text)
  })

  it('should find an element by class on deep conditions', async () => {
    const className = faker.internet.userName()
    const text = faker.internet.userName()

    let component = () => element('div', {}, [ element('span', {}, 'Blah'), element('div', { class: className }, text) ])
    const result = await testing(component).findByClass(className).textContent()

    expect(result).toBe(text)
  })

  it('should find the first element in an array', async () => {
    const className = faker.internet.userName()
    const text = faker.internet.userName()

    let component = () => element('div', {}, element('div', { class: className }, [text, 3]))
    const result = await testing(component).findByClass(className).findChildren().findFirst().textContent()

    expect(result).toBe(text)
  })

  it('should find an element in an array', async () => {
    const className = faker.internet.userName()
    const text = faker.internet.userName()

    let component = () => element('div', {}, element('div', { class: className }, [1, text, 3]))
    const result = await testing(component).findByClass(className).findChildren().findNth(1).textContent()

    expect(result).toBe(text)
  })

  it('should get an attribute from an element', async () => {
    const id = faker.internet.userName()
    const alt = faker.internet.userName()

    let component = () => element('div', {}, element('img', { id, alt }))
    const result = await testing(component).findById(id).attribute('alt')

    expect(result).toBe(alt)
  })

  it('should handle component mutations', async () => {
    const firstId = faker.internet.userName()
    const secondId = faker.internet.userName()

    const text = faker.internet.userName()

    let secondComponent = () => element('div', { id: secondId }, text)
    let firstComponent = () => element('button', { id: firstId, onclick: secondComponent })

    const result = await testing(firstComponent).findById(firstId).trigger(click()).findById(secondId).textContent()

    expect(result).toBe(text)
  })

  it('should handle async component composition', async () => {
    const id = faker.internet.userName()
    const text = faker.internet.userName()

    let helloWorld = async () => element('h1', { id }, text)
    let component = () => element('div', { }, helloWorld())

    const result = await testing(component).findById(id).textContent()

    expect(result).toBe(text)
  })

  it('should find children of a root component', async () => {
    const blueGreen = testing(() => element('div', {}, 'Blue', 'Green'))

    const all = await blueGreen.findChildren().textContent()
    expect(all).toStrictEqual(['Blue', 'Green'])
  })

  it('should be able to check the first step of a transition', async () => {
    const firstStep = () => 'Hello'
    const secondStep = async () => 'Bye'

    const all = testing(() => transition(firstStep, secondStep))
    const result = await all.unfinishedTransition().textContent()

    expect(result).toBe('Hello')
  })

  it('should be able to check the second step of a transition', async () => {
    const firstStep = () => 'Hello'
    const secondStep = async () => 'Bye'

    const all = testing(() => transition(firstStep, secondStep))
    const result = await all.finishedTransition().textContent()

    expect(result).toBe('Bye')
  })
})
