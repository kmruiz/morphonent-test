import '@babel/polyfill'
import { element } from 'morphonent'
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
})