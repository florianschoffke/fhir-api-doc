import utils from '../src/utils.js';

describe('createElement', () => {
    test('should create a basic element with just a tag', () => {
        const element = utils.createElement('div');
        
        expect(element.tagName).toBe('DIV');
        expect(element.classList.length).toBe(0);
        expect(element.innerHTML).toBe('');
    });

    test('should add single class to element', () => {
        const element = utils.createElement('div', { classes: ['container'] });
        
        expect(element.classList.contains('container')).toBe(true);
        expect(element.classList.length).toBe(1);
    });

    test('should add multiple classes to element', () => {
        const element = utils.createElement('div', { classes: ['container', 'active', 'flex'] });
        
        expect(element.classList.contains('container')).toBe(true);
        expect(element.classList.contains('active')).toBe(true);
        expect(element.classList.contains('flex')).toBe(true);
        expect(element.classList.length).toBe(3);
    });

    test('should set single attribute', () => {
        const element = utils.createElement('input', { attributes: { type: 'text' } });
        
        expect(element.getAttribute('type')).toBe('text');
    });

    test('should set multiple attributes', () => {
        const element = utils.createElement('input', { 
            attributes: { 
                type: 'email', 
                placeholder: 'Enter email',
                required: 'true'
            } 
        });
        
        expect(element.getAttribute('type')).toBe('email');
        expect(element.getAttribute('placeholder')).toBe('Enter email');
        expect(element.getAttribute('required')).toBe('true');
    });

    test('should set innerHTML', () => {
        const element = utils.createElement('div', { innerHTML: '<span>Gematik</span>' });
        
        expect(element.innerHTML).toBe('<span>Gematik</span>');
        expect(element.querySelector('span')).toBeTruthy();
    });

    test('should append single child element', () => {
        const child = document.createElement('span');
        const element = utils.createElement('div', { children: [child] });
        
        expect(element.children.length).toBe(1);
        expect(element.children[0]).toBe(child);
    });

    test('should append multiple child elements', () => {
        const child1 = document.createElement('span');
        const child2 = document.createElement('p');
        const child3 = document.createElement('button');
        const element = utils.createElement('div', { children: [child1, child2, child3] });
        
        expect(element.children.length).toBe(3);
        expect(element.children[0]).toBe(child1);
        expect(element.children[1]).toBe(child2);
        expect(element.children[2]).toBe(child3);
    });

    test('should handle all options together', () => {
        const child = document.createElement('span');
        const element = utils.createElement('div', {
            classes: ['toss', 'a'],
            attributes: { coin: 'for', 'your': 'poor' },
            innerHTML: '<p>developer</p>',
            children: [child]
        });
        
        expect(element.classList.contains('toss')).toBe(true);
        expect(element.classList.contains('a')).toBe(true);
        expect(element.getAttribute('coin')).toBe('for');
        expect(element.getAttribute('your')).toBe('poor');
        expect(element.innerHTML).toContain('<p>developer</p>');
        expect(element.children.length).toBeGreaterThan(0);
    });

    test('should handle empty arrays as parameter values', () => {
        const element = utils.createElement('div', { 
            classes: [], 
            attributes: {}, 
            children: [] 
        });
        
        expect(element.classList.length).toBe(0);
        expect(element.children.length).toBe(0);
    });

    test('should create different element types', () => {
        const div = utils.createElement('div');
        const span = utils.createElement('span');
        const button = utils.createElement('button');
        const input = utils.createElement('input');
        
        expect(div.tagName).toBe('DIV');
        expect(span.tagName).toBe('SPAN');
        expect(button.tagName).toBe('BUTTON');
        expect(input.tagName).toBe('INPUT');
    });

    test('should handle empty innerHTML string', () => {
        const element = utils.createElement('div', { innerHTML: '' });
        
        expect(element.innerHTML).toBe('');
    });

    test('should work with complex nested children', () => {
        const grandchild = document.createElement('span');
        const child = utils.createElement('div', { children: [grandchild] });
        const parent = utils.createElement('section', { children: [child] });
        
        expect(parent.children.length).toBe(1);
        expect(parent.children[0].children.length).toBe(1);
        expect(parent.querySelector('span')).toBe(grandchild);
    });

    test('should return the created element', () => {
        const element = utils.createElement('div');
        
        expect(element).toBeInstanceOf(HTMLDivElement);
        expect(element.nodeType).toBe(Node.ELEMENT_NODE);
    });

    test('should handle null options parameter', () => {
        const element = utils.createElement('div', null);
        
        expect(element.tagName).toBe('DIV');
        expect(element.classList.length).toBe(0);
        expect(element.innerHTML).toBe('');
    });

    test('should handle undefined options parameter', () => {
        const element = utils.createElement('div', undefined);
        
        expect(element.tagName).toBe('DIV');
        expect(element.classList.length).toBe(0);
    });

    test('should filter out null in classes array', () => {
        const element = utils.createElement('div', { classes: ['valid', null, 'another'] });
        
        expect(element.classList.length).toBe(2);
        expect(element.classList.contains('valid')).toBe(true);
        expect(element.classList.contains('another')).toBe(true);
    });

    test('should filter out undefined in classes array', () => {
        const element = utils.createElement('div', { classes: ['valid', undefined, 'another'] });
        
        expect(element.classList.length).toBe(2);
        expect(element.classList.contains('valid')).toBe(true);
        expect(element.classList.contains('another')).toBe(true);
    });

    test('should filter out empty string in classes array', () => {
        const element = utils.createElement('div', { classes: ['valid', '', 'another'] });
        
        expect(element.classList.length).toBe(2);
        expect(element.classList.contains('valid')).toBe(true);
        expect(element.classList.contains('another')).toBe(true);
    });

    test('should filter out null value in attributes', () => {
        const element = utils.createElement('div', { 
            attributes: { 
                'data-valid': 'value',
                'data-null': null,
                'data-another': 'another'
            } 
        });
        
        expect(element.getAttribute('data-valid')).toBe('value');
        expect(element.getAttribute('data-null')).toBeNull();
        expect(element.getAttribute('data-another')).toBe('another');
    });

    test('should filter out undefined value in attributes', () => {
        const element = utils.createElement('div', { 
            attributes: { 
                'data-valid': 'value',
                'data-undefined': undefined
            } 
        });
        
        expect(element.getAttribute('data-valid')).toBe('value');
        expect(element.getAttribute('data-undefined')).toBeNull();
    });

    test('should handle null innerHTML', () => {
        const element = utils.createElement('div', { innerHTML: null });
        
        expect(element.innerHTML).toBe('');
    });

    test('should handle undefined innerHTML', () => {
        const element = utils.createElement('div', { innerHTML: undefined });
        
        expect(element.innerHTML).toBe('');
    });

    test('should handle null in children array', () => {
        expect(() => {
            utils.createElement('div', { children: [null] });
        }).toThrow();
    });

    test('should handle undefined in children array', () => {
        expect(() => {
            utils.createElement('div', { children: [undefined] });
        }).toThrow();
    });

    test('should throw for non-element in children array', () => {
        expect(() => {
            utils.createElement('div', { children: ['string'] });
        }).toThrow();
    });

    test('should handle non-object in children array', () => {
        expect(() => {
            utils.createElement('div', { children: [123] });
        }).toThrow();
    });

    test('should handle text node in children array', () => {
        const textNode = document.createTextNode('Hello');
        const element = utils.createElement('div', { children: [textNode] });
        
        expect(element.childNodes.length).toBe(1);
        expect(element.textContent).toBe('Hello');
    });

    test('should handle invalid tag name', () => {
        expect(() => {
            utils.createElement('');
        }).toThrow();
    });

    test('should throw for numeric tag name', () => {
        expect(() => {
            utils.createElement(123);
        }).toThrow();
    });

    test('should handle null tag name like native DOM', () => {
        const element = utils.createElement(null);
        expect(element.tagName).toBe('NULL');
    });

    test('should handle undefined tag name like native DOM', () => {
        const element = utils.createElement(undefined);
        expect(element.tagName).toBe('UNDEFINED');
    });

    test('should handle invalid HTML tag names gracefully', () => {
        const element = utils.createElement('invalid-custom-tag');
        
        expect(element).toBeTruthy();
        expect(element.tagName).toBe('INVALID-CUSTOM-TAG');
    });

    test('should handle special characters in class names', () => {
        const element = utils.createElement('div', { 
            classes: ['my-class', 'another_class', 'class123'] 
        });
        
        expect(element.classList.contains('my-class')).toBe(true);
        expect(element.classList.contains('another_class')).toBe(true);
        expect(element.classList.contains('class123')).toBe(true);
    });

    test('should filter out mixed null and valid classes', () => {
        const element = utils.createElement('div', { 
            classes: ['valid', null, undefined, '', 'another', false, 0] 
        });
        
        expect(element.classList.length).toBe(2);
        expect(element.classList.contains('valid')).toBe(true);
        expect(element.classList.contains('another')).toBe(true);
    });

    test('should handle empty object for attributes', () => {
        const element = utils.createElement('div', { attributes: {} });
        
        expect(element.attributes.length).toBe(0);
    });

    test('should handle very long class names', () => {
        const longClassName = 'a'.repeat(1000);
        const element = utils.createElement('div', { classes: [longClassName] });
        
        expect(element.classList.contains(longClassName)).toBe(true);
    });

    test('should handle very long innerHTML', () => {
        const longHTML = '<span>long, boring, and repetitive.</span>'.repeat(100);
        const element = utils.createElement('div', { innerHTML: longHTML });
        
        expect(element.innerHTML).toBe(longHTML);
    });

    test('should allow valid falsy attribute values', () => {
        const element = utils.createElement('div', { 
            attributes: { 
                'data-zero': 0,
                'data-false': false,
                'data-empty': ''
            } 
        });
        
        expect(element.getAttribute('data-zero')).toBe('0');
        expect(element.getAttribute('data-false')).toBe('false');
        expect(element.getAttribute('data-empty')).toBe('');
    });

    test('should handle children that are already appended elsewhere', () => {
        const child = document.createElement('span');
        const parent1 = utils.createElement('div', { children: [child] });
        const parent2 = utils.createElement('div', { children: [child] });
        
        // Child should be moved to parent2
        expect(parent1.children.length).toBe(0);
        expect(parent2.children.length).toBe(1);
        expect(parent2.children[0]).toBe(child);
    });

    test('should handle setting innerHTML after children', () => {
        const child = document.createElement('span');
        const element = utils.createElement('div', {
            innerHTML: '<p>Initial</p>',
            children: [child]
        });
        
        // innerHTML is set first, then children are appended
        expect(element.innerHTML).toContain('<p>Initial</p>');
        expect(element.children.length).toBeGreaterThan(1);
    });
});

describe('createTable', () => {
    test('should create a table with correctly ordered headers and rows', () => {
        const table = utils.createTable(['Name', 'Age'], [['Fred', 30], ['Rik', 25]]);
        expect(table.tagName).toBe('TABLE');

        const headerCells = table.querySelectorAll('thead th');
        expect(headerCells).toHaveLength(2);
        expect(headerCells[0].textContent).toBe('Name');
        expect(headerCells[1].textContent).toBe('Age');

        const rows = table.querySelectorAll('tbody tr');
        expect(rows).toHaveLength(2);
        expect(rows[0].children).toHaveLength(2)
        expect(rows[1].children).toHaveLength(2)
        expect(rows[0].children[0].textContent).toBe('Fred');
        expect(rows[0].children[1].textContent).toBe('30');
        expect(rows[1].children[0].textContent).toBe('Rik');
        expect(rows[1].children[1].textContent).toBe('25');
    });

    test('should create a table without headers when includeHeader is false', () => {
        const table = utils.createTable(['Name', 'Age'], [['Fred', 30], ['Rik', 25]], false);
        expect(table.tagName).toBe('TABLE');
        expect(table.querySelector('thead')).toBeNull();
        expect(table.querySelector('tbody')).toBeTruthy();
        expect(table.querySelector('tbody tr').children.length).toBe(2);
    });

    test('should create a table with empty headers array', () => {
        const table = utils.createTable([], [['Fred', 30], ['Rik', 25]]);
        expect(table.tagName).toBe('TABLE');
        expect(table.querySelector('thead')).toBeTruthy();
        expect(table.querySelector('thead tr').children.length).toBe(0);
        expect(table.querySelector('tbody tr').children.length).toBe(2);
    });

    test('should create a table with empty rows array', () => {
        const table = utils.createTable(['Name', 'Age'], []);
        expect(table.tagName).toBe('TABLE');
        expect(table.querySelector('thead')).toBeTruthy();
        expect(table.querySelector('thead tr').children.length).toBe(2);
        expect(table.querySelector('tbody')).toBeTruthy();
        expect(table.querySelector('tbody').children.length).toBe(0);
    });

    test('should create a table with rows having fewer columns than headers', () => {
        const table = utils.createTable(['Name', 'Age', 'Country'], [['Fred', 30], ['Rik']]);
        expect(table.tagName).toBe('TABLE');
        expect(table.querySelector('thead')).toBeTruthy();
        expect(table.querySelector('thead tr').children.length).toBe(3);
        const firstRow = table.querySelector('tbody tr');
        expect(firstRow.children.length).toBe(2);
    });

    test('should create a table with rows having more columns than headers', () => {
        const table = utils.createTable(['Name', 'Age'], [['Fred', 30, 'Germany'], ['Rik', 25, 'Rohan']]);
        expect(table.tagName).toBe('TABLE');
        expect(table.querySelector('thead')).toBeTruthy();
        expect(table.querySelector('thead tr').children.length).toBe(2);
        const firstRow = table.querySelector('tbody tr');
        expect(firstRow.children.length).toBe(3);
    });

    test('should add classes to the table', () => {
        const table = utils.createTable(['Name'], [['Fred']], true, ['my-table', 'striped']);
        expect(table.classList.contains('my-table')).toBe(true);
        expect(table.classList.contains('striped')).toBe(true);
    });

    test('should not escape HTML in headers and rows', () => {
        const table = utils.createTable(['<b>Name</b>'], [['<em>Fred</em>']]);
        const headerCell = table.querySelector('th');
        const rowCell = table.querySelector('td');
        expect(headerCell.innerHTML).toBe('<b>Name</b>');
        expect(headerCell.querySelector('b')).toBeTruthy();
        expect(rowCell.innerHTML).toBe('<em>Fred</em>');
        expect(rowCell.querySelector('em')).toBeTruthy();
    });

    test('should handle null and undefined in headers and rows', () => {
        const table = utils.createTable([null, undefined], [[null, undefined]]);
        const headerCells = table.querySelectorAll('th');
        const rowCells = table.querySelectorAll('td');
        expect(headerCells[0].innerHTML).toBe('');
        expect(headerCells[1].innerHTML).toBe('');
        expect(rowCells[0].innerHTML).toBe('');
        expect(rowCells[1].innerHTML).toBe('');
    });

    test('should throw for non-array headers', () => {
        expect(() => utils.createTable('not an array', [])).toThrow();
    });

    test('should throw for non-array rows', () => {
        expect(() => utils.createTable([], 'not an array')).toThrow();
    });
});

describe('createCopyButton', () => {
    // Mock navigator.clipboard
    beforeEach(() => {

        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: jest.fn(() => Promise.resolve())
            },
            writable: true,
            configurable: true
        });
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        delete navigator.clipboard;
    });

    test('should create a copy button wrapper with correct structure', () => {
        const button = utils.createCopyButton('test data');
        
        expect(button.tagName).toBe('DIV');
        expect(button.classList.contains('gem-ig-copy-container')).toBe(true);
    });

    test('should contain language element and button wrapper', () => {
        const button = utils.createCopyButton('test data');
        
        const languageElement = button.querySelector('.gem-id-code-lang');
        const buttonWrapper = button.querySelector('.gem-ig-copy-button-wrapper');
        
        expect(languageElement).toBeTruthy();
        expect(buttonWrapper).toBeTruthy();
    });

    test('should create button with correct initial label', () => {
        const button = utils.createCopyButton('test data');
        const copyButton = button.querySelector('button');
        
        expect(copyButton).toBeTruthy();
        expect(copyButton.innerHTML).toBe('Code kopieren');
    });

    test('should set language text when language is provided', () => {
        const button = utils.createCopyButton('test data', 'JavaScript');
        const languageElement = button.querySelector('.gem-id-code-lang');
        
        expect(languageElement.innerText).toBe('javascript');
    });

    test('should convert language to lowercase', () => {
        const button = utils.createCopyButton('test data', 'JSON');
        const languageElement = button.querySelector('.gem-id-code-lang');
        
        expect(languageElement.innerText).toBe('json');
    });

    test('should handle mixed case language names', () => {
        const button = utils.createCopyButton('test data', 'TypeScript');
        const languageElement = button.querySelector('.gem-id-code-lang');
        
        expect(languageElement.innerText).toBe('typescript');
    });

    test('should leave language element empty when language is null', () => {
        const button = utils.createCopyButton('test data', null);
        const languageElement = button.querySelector('.gem-id-code-lang');
        
        expect(languageElement.textContent).toBe('');
    });

    test('should leave language element empty when language is not provided', () => {
        const button = utils.createCopyButton('test data');
        const languageElement = button.querySelector('.gem-id-code-lang');
        
        expect(languageElement.textContent).toBe('');
    });

    test('should handle empty string as language', () => {
        const button = utils.createCopyButton('test data', '');
        const languageElement = button.querySelector('.gem-id-code-lang');
        
        expect(languageElement.textContent).toBe('');
    });

    test('should copy data to clipboard when button is clicked', async () => {
        const testData = 'test data to copy';
        const button = utils.createCopyButton(testData);
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testData);
    });

    test('should copy empty string data', async () => {
        const button = utils.createCopyButton('');
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('');
    });

    test('should copy multiline data', async () => {
        const multilineData = 'line1\nline2\nline3';
        const button = utils.createCopyButton(multilineData);
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(multilineData);
    });

    test('should copy JSON data', async () => {
        const jsonData = '{"key": "value", "number": 123}';
        const button = utils.createCopyButton(jsonData);
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(jsonData);
    });

    test('should copy XML data', async () => {
        const xmlData = '<root><child>value</child></root>';
        const button = utils.createCopyButton(xmlData);
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(xmlData);
    });

    test('should copy data with special characters', async () => {
        const specialData = 'data with <>&"\' special chars';
        const button = utils.createCopyButton(specialData);
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(specialData);
    });

    test('should copy very long data', async () => {
        const longData = 'a'.repeat(10000);
        const button = utils.createCopyButton(longData);
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(longData);
    });

    test('should change button text to "Custom copied button label" after successful copy', async () => {
        const button = utils.createCopyButton('test data');
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        await Promise.resolve(); // Wait for promise to resolve
        
        expect(copyButton.innerText).toBe('Custom copied button label');
    });

    test('should revert button text back to "Copy" after 2 seconds', async () => {
        const button = utils.createCopyButton('test data');
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        await Promise.resolve();
        
        expect(copyButton.innerText).toBe('Custom copied button label');
        
        jest.advanceTimersByTime(2000);
        
        expect(copyButton.innerText).toBe('Code kopieren');
    });

    test('should not revert button text before 2 seconds', async () => {
        const button = utils.createCopyButton('test data');
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        await Promise.resolve();
        
        jest.advanceTimersByTime(1999);
        
        expect(copyButton.innerText).toBe('Custom copied button label');
    });

    test('should handle clipboard write failure gracefully', async () => {
        jest.useRealTimers(); // Use real timers for this test
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        const error = new Error('Clipboard write failed');
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: jest.fn(() => Promise.reject(error))
            },
            writable: true,
            configurable: true
        });
        
        const button = utils.createCopyButton('test data');
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        
        // Wait for the promise rejection to be handled
        await new Promise(resolve => setTimeout(resolve, 10));
        
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy text: ', error);
        
        consoleErrorSpy.mockRestore();
        jest.useFakeTimers(); // Restore fake timers
    });

    test('should not change button text on clipboard failure', async () => {
        jest.useRealTimers(); // Use real timers for this test
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: jest.fn(() => Promise.reject(new Error('Failed')))
            },
            writable: true,
            configurable: true
        });
        
        const button = utils.createCopyButton('test data');
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        
        // Wait for the promise rejection to be handled
        await new Promise(resolve => setTimeout(resolve, 10));
        
        expect(copyButton.textContent).toBe('Code kopieren');
        
        consoleErrorSpy.mockRestore();
        jest.useFakeTimers(); // Restore fake timers
    });

    test('should handle multiple clicks correctly', async () => {
        const button = utils.createCopyButton('test data');
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        await Promise.resolve();
        expect(copyButton.innerText).toBe('Custom copied button label');
        
        copyButton.click();
        await Promise.resolve();
        expect(copyButton.innerText).toBe('Custom copied button label');
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2);
    });

    test('should handle rapid successive clicks', async () => {
        const button = utils.createCopyButton('test data');
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        copyButton.click();
        copyButton.click();
        await Promise.resolve();
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(3);
    });

    test('should reset timer on subsequent clicks', async () => {
        const button = utils.createCopyButton('test data');
        const copyButton = button.querySelector('button');
        
        // First click
        copyButton.click();
        await Promise.resolve();
        expect(copyButton.innerText).toBe('Custom copied button label');
        
        // Advance time but not enough to reset
        jest.advanceTimersByTime(1500);
        expect(copyButton.innerText).toBe('Custom copied button label');
        
        // Second click should reset the timer
        copyButton.click();
        await Promise.resolve();
        expect(copyButton.innerText).toBe('Custom copied button label');
        
        // Now advance full 2 seconds from second click
        jest.advanceTimersByTime(2000);
        expect(copyButton.innerText).toBe('Code kopieren');
    });

    test('should handle numeric data by converting to string', async () => {
        const button = utils.createCopyButton(12345);
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(12345);
    });

    test('should handle boolean data', async () => {
        const button = utils.createCopyButton(true);
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(true);
    });

    test('should handle null data', async () => {
        const button = utils.createCopyButton(null);
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(null);
    });

    test('should handle undefined data', async () => {
        const button = utils.createCopyButton(undefined);
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(undefined);
    });

    test('should return a DOM element', () => {
        const button = utils.createCopyButton('test data');
        
        expect(button).toBeInstanceOf(HTMLDivElement);
        expect(button.nodeType).toBe(Node.ELEMENT_NODE);
    });

    test('should have correct DOM hierarchy', () => {
        const button = utils.createCopyButton('test data', 'js');
        
        expect(button.children.length).toBe(2);
        expect(button.children[0].classList.contains('gem-id-code-lang')).toBe(true);
        expect(button.children[1].classList.contains('gem-ig-copy-button-wrapper')).toBe(true);
        expect(button.children[1].children.length).toBe(1);
        expect(button.children[1].children[0].tagName).toBe('BUTTON');
    });

    test('should handle language with numbers', () => {
        const button = utils.createCopyButton('test data', 'C++11');
        const languageElement = button.querySelector('.gem-id-code-lang');
        
        expect(languageElement.innerText).toBe('c++11');
    });

    test('should handle language with special characters', () => {
        const button = utils.createCopyButton('test data', 'C#');
        const languageElement = button.querySelector('.gem-id-code-lang');
        
        expect(languageElement.innerText).toBe('c#');
    });

    test('should handle whitespace in data', async () => {
        const dataWithWhitespace = '  \n\t  test  \n  ';
        const button = utils.createCopyButton(dataWithWhitespace);
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(dataWithWhitespace);
    });

    test('should handle Unicode characters in data', async () => {
        const unicodeData = '你好世界 🌍 Привет мир';
        const button = utils.createCopyButton(unicodeData);
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(unicodeData);
    });

    test('should handle Unicode characters in language', () => {
        const button = utils.createCopyButton('test data', '日本語');
        const languageElement = button.querySelector('.gem-id-code-lang');
        
        expect(languageElement.innerText).toBe('日本語');
    });

    test('should create independent button instances', () => {
        const button1 = utils.createCopyButton('data1', 'js');
        const button2 = utils.createCopyButton('data2', 'python');
        
        expect(button1).not.toBe(button2);
        expect(button1.querySelector('.gem-id-code-lang').innerText).toBe('js');
        expect(button2.querySelector('.gem-id-code-lang').innerText).toBe('python');
    });

    test('should maintain separate click handlers for multiple instances', async () => {
        const button1 = utils.createCopyButton('data1');
        utils.createCopyButton('data2');
        
        const copyButton1 = button1.querySelector('button');
        
        copyButton1.click();
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('data1');
        expect(navigator.clipboard.writeText).not.toHaveBeenCalledWith('data2');
    });

    test('should handle data with tabs and newlines', async () => {
        const formattedCode = 'function test() {\n\treturn true;\n}';
        const button = utils.createCopyButton(formattedCode);
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(formattedCode);
    });

    test('should preserve exact data format including trailing whitespace', async () => {
        const dataWithTrailing = 'test data   \n';
        const button = utils.createCopyButton(dataWithTrailing);
        const copyButton = button.querySelector('button');
        
        copyButton.click();
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(dataWithTrailing);
    });
});

describe('translateExpectation', () => {

    test('should translate default conformance values correctly', () => {
        expect(utils.translateExpectation('SHOULD')).toBe('SOLL');
        expect(utils.translateExpectation('MAY')).toBe('KANN');
        expect(utils.translateExpectation('SHOULD NOT')).toBe('SOLL NICHT');
    });

    test('should translate custom conformance values correctly', () => {
        expect(utils.translateExpectation('SHALL')).toBe('Custom SHALL label');
        expect(utils.translateExpectation('SHALL NOT')).toBe('Custom SHALL NOT label');
    });

    test('should return original value for non-matching conformance values', () => {
        expect(utils.translateExpectation('CHOCOLATE')).toBe('CHOCOLATE');
        expect(utils.translateExpectation('chocolate')).toBe('chocolate');
        expect(utils.translateExpectation('Chocolate')).toBe('Chocolate');
    });

    test('should handle null and undefined values', () => {
        expect(utils.translateExpectation(null)).toBe(null);
        expect(utils.translateExpectation(undefined)).toBe(undefined);
    });
});

describe('isJson', () => {
    test('should return true for valid JSON object string', () => {
        expect(utils.isJson('{"key": "value", "number": 123}')).toBe(true);
    });

    test('should return true for valid JSON array string', () => {
        expect(utils.isJson('[1, 2, 3, "test"]')).toBe(true);
    });

    test('should return true for valid nested JSON object', () => {
        expect(utils.isJson('{"nested": {"key": "value"}, "array": [1, 2, 3]}')).toBe(true);
    });

    test('should handle deeply nested JSON', () => {
        const nestedJson = '{"level1": {"level2": {"level3": {"level4": {"level5": "value"}}}}}';
        expect(utils.isJson(nestedJson)).toBe(true);
    });

    test('should return true for empty JSON object', () => {
        expect(utils.isJson('{}')).toBe(true);
    });

    test('should return true for empty JSON array', () => {
        expect(utils.isJson('[]')).toBe(true);
    });

    test('should return true for JSON with valid number formats', () => {
        expect(utils.isJson('{"zero": 0}')).toBe(true);
        expect(utils.isJson('{"decimal": 123.456}')).toBe(true);
        expect(utils.isJson('{"negative": -123.456}')).toBe(true);
        expect(utils.isJson('{"exponent": 1.23e-10}')).toBe(true);
    });

    test('should return true for JSON with duplicate keys', () => {
        expect(utils.isJson('{"key": "first", "key": "second"}')).toBe(true);
    });

    test('should handle very long keys and values', () => {
        const longKey = 'a'.repeat(1000);
        const longValue = 'b'.repeat(1000);
        const json = `{"${longKey}": "${longValue}"}`;
        expect(utils.isJson(json)).toBe(true);
    });

    test('should return true for JSON with mixed types in arrays', () => {
        expect(utils.isJson('[1, "string", true, null, {"object": "value"}]')).toBe(true);
    });

    test('should return true for JSON with complex nested arrays', () => {
        expect(utils.isJson('[[1, 2], [3, 4], [{"nested": "object"}]]')).toBe(true);
    });

    test('should return true for JSON with all valid JSON types', () => {
        const completeJson = '{"object": {}, "array": [], "string": "value", "number": 123, "boolean": true, "null": null, "date": "2023-01-01T00:00:00Z"}';
        expect(utils.isJson(completeJson)).toBe(true);
    });

    test('should return true for valid JSON with trailing whitespace', () => {
        expect(utils.isJson('{"key": "value"}   ')).toBe(true);
        expect(utils.isJson('   {"key": "value"}')).toBe(true);
    });

    test('should handle very large JSON strings', () => {
        const largeJson = JSON.stringify({ data: 'x'.repeat(10000) });
        expect(utils.isJson(largeJson)).toBe(true);
    });

    test('should return false for non-string input', () => {
        expect(utils.isJson({ key: 'value' })).toBe(false);
        expect(utils.isJson(123)).toBe(false);
        expect(utils.isJson(true)).toBe(false);
        expect(utils.isJson(null)).toBe(false);
        expect(utils.isJson(undefined)).toBe(false);
        expect(utils.isJson([])).toBe(false);
    });

    test('should return false for string that is not JSON', () => {
        expect(utils.isJson('plain text string')).toBe(false);
        expect(utils.isJson('')).toBe(false);
        expect(utils.isJson('   ')).toBe(false);
    });

    test('should return false for JSON string that parses to non-object', () => {
        expect(utils.isJson('"just a string"')).toBe(false);
        expect(utils.isJson('123')).toBe(false);
        expect(utils.isJson('true')).toBe(false);
        expect(utils.isJson('false')).toBe(false);
        expect(utils.isJson('null')).toBe(false);
    });

    test('should return true for JSON with special characters', () => {
        expect(utils.isJson('{"special": "value with \\"quotes\\" and \\\\backslashes\\\\"}')).toBe(true);
        expect(utils.isJson('{"escaped": "line1\\nline2\\ttab"}')).toBe(true);
    });

    test('should return true for JSON with Unicode characters', () => {
        expect(utils.isJson('{"unicode": "你好世界 🌍"}')).toBe(true);
    });

    test('should return true for JSON with whitespace formatting', () => {
        expect(utils.isJson('{\n  "key": "value",\n\t  "number": 123\n}')).toBe(true);
    });

    test('should return false for strings that look like JSON but are invalid', () => {
        expect(utils.isJson('{key: "value"}')).toBe(false); // missing quotes around key
        expect(utils.isJson('{"key": "value" extra}')).toBe(false); // extra content
        expect(utils.isJson('{"key": "value"')).toBe(false); // missing closing brace
        expect(utils.isJson('"key": "value"}')).toBe(false); // missing opening brace
    });

    test('should return false for strings with trailing commas', () => {
        expect(utils.isJson('{"key": "value",}')).toBe(false);
        expect(utils.isJson('[1, 2, 3,]')).toBe(false);
    });

    test('should return false for strings with unescaped control characters', () => {
        expect(utils.isJson('{"control": "\u0000"}')).toBe(false);
    });

    test('should return false for strings that are valid YAML but not JSON', () => {
        expect(utils.isJson('key: value')).toBe(false);
        expect(utils.isJson('- item1\n- item2')).toBe(false);
    });

    test('should return false for strings with invalid escape sequences', () => {
        expect(utils.isJson('{"invalid": "\\x"}')).toBe(false);
    });

    test('should return false for strings that are XML', () => {
        expect(utils.isJson('<root><key>value</key></root>')).toBe(false);
    });

    test('should return false for strings that are CSV', () => {
        expect(utils.isJson('key,value\n1,2')).toBe(false);
    });

    test('should return false for strings with comments (not valid JSON)', () => {
        expect(utils.isJson('{"key": "value"} // comment')).toBe(false);
        expect(utils.isJson('/* comment */ {"key": "value"}')).toBe(false);
    });

    test('should return false for strings with invalid number formats', () => {
        expect(utils.isJson('{"number": 0123}')).toBe(false); // leading zero
        expect(utils.isJson('{"number": 1.2.3}')).toBe(false); // multiple decimal points
    });
});

describe('toJson', () => {
    test('should return object when input is already an object', () => {
        const input = { key: 'value' };
        const result = utils.toJson(input);
        expect(result).toBe(input);
    });

    test('should return array when input is already an array', () => {
        const input = [1, 2, 3];
        const result = utils.toJson(input);
        expect(result).toBe(input);
    });

    test('should parse valid JSON object string', () => {
        const input = '{"key": "value"}';
        const result = utils.toJson(input);
        expect(result).toEqual({ key: 'value' });
    });

    test('should parse valid JSON array string', () => {
        const input = '[1, 2, 3]';
        const result = utils.toJson(input);
        expect(result).toEqual([1, 2, 3]);
    });

    test('should handle nested JSON objects', () => {
        const input = '{"nested": {"key": "value"}}';
        const result = utils.toJson(input);
        expect(result).toEqual({ nested: { key: 'value' } });
    });

    test('should handle empty object', () => {
        const input = '{}';
        const result = utils.toJson(input);
        expect(result).toEqual({});
    });

    test('should handle empty array', () => {
        const input = '[]';
        const result = utils.toJson(input);
        expect(result).toEqual([]);
    });

    test('should return null for invalid JSON string', () => {
        const input = 'not json';
        const result = utils.toJson(input);
        expect(result).toBeNull();
    });

    test('should return null for malformed JSON', () => {
        const input = '{"key": "value"';
        const result = utils.toJson(input);
        expect(result).toBeNull();
    });

    test('should return null for number input', () => {
        const input = 123;
        const result = utils.toJson(input);
        expect(result).toBeNull();
    });

    test('should return null for boolean input', () => {
        const input = true;
        const result = utils.toJson(input);
        expect(result).toBeNull();
    });

    test('should return null for null input', () => {
        const input = null;
        const result = utils.toJson(input);
        expect(result).toBeNull();
    });

    test('should return null for undefined input', () => {
        const input = undefined;
        const result = utils.toJson(input);
        expect(result).toBeNull();
    });

    test('should return null for function input', () => {
        const input = () => {};
        const result = utils.toJson(input);
        expect(result).toBeNull();
    });

    test('should handle strings with whitespace', () => {
        const input = '  {"key": "value"}  ';
        const result = utils.toJson(input);
        expect(result).toEqual({ key: 'value' });
    });

    test('should handle strings with newlines', () => {
        const input = '{\n"key": "value"\n}';
        const result = utils.toJson(input);
        expect(result).toEqual({ key: 'value' });
    });

    test('should return null for non-object JSON values', () => {
        expect(utils.toJson('"string"')).toBeNull();
        expect(utils.toJson('123')).toBeNull();
        expect(utils.toJson('true')).toBeNull();
    });

    test('should handle special characters in JSON', () => {
        const input = '{"special": "\\"quotes\\" and \\\\slashes\\\\"}';
        const result = utils.toJson(input);
        expect(result).toEqual({ special: '"quotes" and \\slashes\\' });
    });

    test('should handle Unicode characters in JSON', () => {
        const input = '{"unicode": "你好世界"}';
        const result = utils.toJson(input);
        expect(result).toEqual({ unicode: '你好世界' });
    });
});

describe('utils.removeLeadingSlash', () => {
    test('should remove leading slash from string', () => {
        expect(utils.removeLeadingSlash('/path/to/file')).toBe('path/to/file');
    });

    test('should return string unchanged if no leading slash', () => {
        expect(utils.removeLeadingSlash('path/to/file')).toBe('path/to/file');
    });

    test('should handle string with only a slash', () => {
        expect(utils.removeLeadingSlash('/')).toBe('');
    });

    test('should handle empty string', () => {
        expect(utils.removeLeadingSlash('')).toBe('');
    });

    test('should only remove first slash, not multiple leading slashes', () => {
        expect(utils.removeLeadingSlash('//path/to/file')).toBe('/path/to/file');
    });

    test('should not remove middle and trailing slash', () => {
        expect(utils.removeLeadingSlash('/path/to/file/')).toBe('path/to/file/');
    });

    test('should handle string starting with special characters other than slash', () => {
        expect(utils.removeLeadingSlash('#path')).toBe('#path');
        expect(utils.removeLeadingSlash('?query')).toBe('?query');
    });

    test('should handle string with only non-slash characters', () => {
        expect(utils.removeLeadingSlash('abc123')).toBe('abc123');
    });

    test('should handle whitespace before slash', () => {
        expect(utils.removeLeadingSlash(' /path')).toBe(' /path');
    });
});
