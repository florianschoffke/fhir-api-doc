import main from '../src/main.js';
import utils from '../src/utils.js';
import gematikLabels from '../src/labels.js';

describe('resizeSVGs', () => {
    let container;
    let svgContainer;
    let svg;

    beforeEach(() => {
        container = document.createElement('div');
        svgContainer = document.createElement('div');
        svgContainer.classList.add('gem-ig-svg-container');
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    
        svg.setAttribute('viewBox', '0 0 100 50');
    
        Object.defineProperty(svgContainer, 'clientWidth', { 
            value: 200, 
            writable: true 
        });
    
        svgContainer.appendChild(svg);
        container.appendChild(svgContainer);
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('should resize SVG to match parent container width while maintaining aspect ratio', () => {
        svgContainer.clientWidth = '200';
    
        
        main.resizeSVGs();
        
        expect(svg.style.width).toBe('200px');
        expect(svg.style.height).toBe('100px'); // 200 / (100/50) 
    });

    it('should not resize SVG when parent container has zero width', () => {
        svgContainer.clientWidth = '0';
        
        main.resizeSVGs();
        
        // Check that the SVG styles remain unchanged
        expect(svg.style.width).toBe('');
        expect(svg.style.height).toBe('');
    });

    it('should handle multiple SVGs in different containers', () => {

        // Create a second SVG container with a different width
        const svgContainer2 = document.createElement('div');
        svgContainer2.classList.add('gem-ig-svg-container');
        const svg2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg2.setAttribute('viewBox', '0 0 200 100');

        Object.defineProperty(svgContainer2, 'clientWidth', { 
            value: 150, 
            writable: true 
        });
                
        svgContainer2.appendChild(svg2);
        container.appendChild(svgContainer2);
        
        main.resizeSVGs();
        
        expect(svg.style.width).toBe('200px');
        expect(svg.style.height).toBe('100px');
        
        expect(svg2.style.width).toBe('150px');
        expect(svg2.style.height).toBe('75px');
    });

    it('should handle SVGs with extreme aspect ratios', () => {
        svg.setAttribute('viewBox', '0 0 1000 10');
        svgContainer.clientWidth = '200';
        
        main.resizeSVGs();
        
        expect(svg.style.width).toBe('200px');
        expect(svg.style.height).toBe('2px'); // 200 / (1000/10)
        
        svg.setAttribute('viewBox', '0 0 10 1000');
        svgContainer.clientWidth = '100';
        
        main.resizeSVGs();
        
        expect(svg.style.width).toBe('100px');
        expect(svg.style.height).toBe('10000px'); // 100 / (10/1000)
    });
});

describe('downloadSVG', () => {
    let container;
    let originalFetch = window.fetch;
    let mockURL;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);

        mockURL = {
            createObjectURL: jest.fn().mockReturnValue('blob:mockurl')
        };
        global.URL = mockURL;

        global.XMLSerializer = jest.fn(() => ({
            serializeToString: jest.fn().mockReturnValue('<svg></svg>')
        }));
    });

    afterEach(() => {
        document.body.removeChild(container);

        delete global.URL;
        delete global.XMLSerializer;
    });

    it('should create download buttons for embedded SVGs', () => {
        // Create an SVG container with an embedded SVG
        const svgContainer = document.createElement('div');
        svgContainer.classList.add('gem-ig-svg-container');
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svgContainer.appendChild(svg);
        container.appendChild(svgContainer);

        main.downloadSVG();

        // Check that a download link was created
        const downloadLink = svgContainer.querySelector('.gem-ig-download-btn');
        expect(downloadLink).toBeTruthy();
        expect(downloadLink.innerText).toBe(gematikLabels.ig.Download_Button_SVG);
        expect(downloadLink.download).toBe('downloaded.svg');
        expect(downloadLink.href).toBe('blob:mockurl');
    });

    it('should create download buttons for SVG images', async () => {
        // Create an SVG image
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('gem-ig-svg-container');
        const img = document.createElement('img');
        img.src = 'test.svg';
        imgContainer.appendChild(img);
        container.appendChild(imgContainer);

        window.fetch = jest.fn().mockImplementation(() => 
            Promise.resolve({
                ok: true,
                text: () => Promise.resolve('<svg></svg>')
            })
        );

        main.downloadSVG();

        await new Promise(resolve => {
            setTimeout(() => {
                const downloadLink = imgContainer.querySelector('.gem-ig-download-btn');
                expect(downloadLink).toBeTruthy();
                expect(downloadLink.innerText).toBe(gematikLabels.ig.Download_Button_SVG);
                expect(downloadLink.download).toBe('downloaded.svg');
                expect(downloadLink.href).toBe('blob:mockurl');
                resolve();
            }, 10);
        });

        window.fetch = originalFetch;
    });

    it('should handle fetch errors for SVG images gracefully', async () => {
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('gem-ig-svg-container');
        const img = document.createElement('img');
        img.src = 'test.svg';
        imgContainer.appendChild(img);
        container.appendChild(imgContainer);

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Mock fetch to return an error
        window.fetch = jest.fn().mockImplementation(() => 
            Promise.resolve({
                ok: false,
                statusText: 'Not Found'
            })
        );

        main.downloadSVG();

        await new Promise(resolve => {
            setTimeout(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    'Error fetching SVG from <img>:', 
                    expect.any(Error)
                );
                
                const downloadLink = imgContainer.querySelector('.gem-ig-download-btn');
                expect(downloadLink).toBeFalsy();

                consoleErrorSpy.mockRestore();
                resolve();
            }, 10);
        });

        window.fetch = originalFetch;
    });

    it('should handle serialization errors for embedded SVGs', () => {
        const svgContainer = document.createElement('div');
        svgContainer.classList.add('gem-ig-svg-container');
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svgContainer.appendChild(svg);
        container.appendChild(svgContainer);

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Mock XMLSerializer to throw an error
        global.XMLSerializer = jest.fn(() => ({
            serializeToString: () => { throw new Error('Serialization failed'); }
        }));

        main.downloadSVG();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error processing embedded SVG:', 
            expect.any(Error)
        );

        const downloadLink = svgContainer.querySelector('.gem-ig-download-btn');
        expect(downloadLink).toBeFalsy();

        consoleErrorSpy.mockRestore();
    });
});

describe('downloadImages', () => {
    let container;
    let originalCreateElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);

        originalCreateElement = document.createElement;

        global.URL = {
            createObjectURL: jest.fn().mockReturnValue('blob:mockurl')
        };

        global.Image = jest.fn().mockImplementation(() => {
            const img = {
                src: '',
                onload: null,
                onerror: null,
                naturalWidth: 100,
                naturalHeight: 50
            };
            return img;
        });

        global.HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
            drawImage: jest.fn()
        });

        global.HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
            callback(new Blob());
        });
    });

    afterEach(() => {
        document.body.removeChild(container);
        
        document.createElement = originalCreateElement;
        delete global.URL;
        delete global.Image;
        delete global.HTMLCanvasElement.prototype.getContext;
        delete global.HTMLCanvasElement.prototype.toBlob;
    });

    it('should create download buttons for images in .gem-ig-img-container', async () => {
        // Create a test image container
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('gem-ig-img-container');
        const img = document.createElement('img');
        img.src = 'test-image.png';
        imgContainer.appendChild(img);
        container.appendChild(imgContainer);

        main.downloadImages();

        // Simulate image loading
        const imageInstance = global.Image.mock.results[0].value;
        imageInstance.src = 'test-image.png';
        
        // Simulate onload event
        if (imageInstance.onload) {
            imageInstance.onload();
        }

        const downloadLink = imgContainer.querySelector('.gem-ig-download-btn');
        expect(downloadLink).toBeTruthy();
        expect(downloadLink.innerText).toBe(gematikLabels.ig.Download_Button_Image);
        expect(downloadLink.download).toBe('test-image.png');
        expect(downloadLink.href).toBe('blob:mockurl');
    });

    it('should handle multiple images in different containers', async () => {
        // Create multiple image containers
        const createImageContainer = (src) => {
            const imgContainer = document.createElement('div');
            imgContainer.classList.add('gem-ig-img-container');
            const img = document.createElement('img');
            img.src = src;
            imgContainer.appendChild(img);
            container.appendChild(imgContainer);
            return img;
        };

        createImageContainer('image1.png');
        createImageContainer('image2.jpg');

        main.downloadImages();

        // Simulate image onloads
        const imageInstances = global.Image.mock.results.map(result => result.value);
        imageInstances.forEach((img, index) => {
            img.src = index === 0 ? 'image1.png' : 'image2.jpg';
            if (img.onload) {
                img.onload();
            }
        });

        const downloadLinks = container.querySelectorAll('.gem-ig-download-btn');
        expect(downloadLinks.length).toBe(2);
        
        expect(downloadLinks[0].innerText).toBe(gematikLabels.ig.Download_Button_Image);
        expect(downloadLinks[0].download).toBe('image1.png');
        
        expect(downloadLinks[1].innerText).toBe(gematikLabels.ig.Download_Button_Image);
        expect(downloadLinks[1].download).toBe('image2.jpg');
    });

    it('should handle errors during image processing', async () => {
        // Create a test image container
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('gem-ig-img-container');
        const img = document.createElement('img');
        img.src = 'test-image.png';
        imgContainer.appendChild(img);
        container.appendChild(imgContainer);

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Mock Image to simulate loading error
        global.Image = jest.fn(() => {
            const img = {
                src: 'test-image.png',
                onload: null,
                onerror: () => {
                    console.error('Error loading image:', new Error('Image load error'));
                }
            };
            return img;
        });

        main.downloadImages();

        // Simulate image error
        const imageInstance = global.Image.mock.results[0].value;
        if (imageInstance.onerror) {
            imageInstance.onerror();
        }

        // Verify error handling
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error loading image:', 
            expect.any(Error)
        );

        // No download link should be created
        const downloadLink = imgContainer.querySelector('.gem-ig-download-btn');
        expect(downloadLink).toBeFalsy();

        consoleErrorSpy.mockRestore();
    });

    it('should handle canvas drawing errors', async () => {
        // Create a test image container
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('gem-ig-img-container');
        const img = document.createElement('img');
        img.src = 'test-image.png';
        imgContainer.appendChild(img);
        container.appendChild(imgContainer);

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Mock canvas.toBlob to throw an error
        global.HTMLCanvasElement.prototype.toBlob = jest.fn(() => {
            throw new Error('Canvas blob creation failed');
        });

        main.downloadImages();

        // Simulate image onload
        const imageInstance = global.Image.mock.results[0].value;
        imageInstance.src = 'test-image.png';
        if (imageInstance.onload) {
            imageInstance.onload();
        }

        // Verify error handling
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error drawing image on canvas:', 
            expect.any(Error)
        );

        // No download link should be created
        const downloadLink = imgContainer.querySelector('.gem-ig-download-btn');
        expect(downloadLink).toBeFalsy();

        consoleErrorSpy.mockRestore();
    });

    it('should handle download link creation errors', async () => {
        // Create a test image container
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('gem-ig-img-container');
        const img = document.createElement('img');
        img.src = 'test-image.png';
        imgContainer.appendChild(img);
        container.appendChild(imgContainer);

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Mock download link creation to throw an error
        document.createElement = jest.fn(() => {
            console.error('Error creating download link for image:', new Error('Download link creation failed'));
            throw new Error('Download link creation failed');
        });

        main.downloadImages();

        // Simulate image onload
        const imageInstance = global.Image.mock.results[0].value;
        imageInstance.src = 'test-image.png';
        if (imageInstance.onload) {
            imageInstance.onload();
        }

        // Verify error handling
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error creating download link for image:', 
            expect.any(Error)
        );

        // No download link should be created
        const downloadLink = imgContainer.querySelector('.gem-ig-download-btn');
        expect(downloadLink).toBeFalsy();

        consoleErrorSpy.mockRestore();
    });
});

describe('enableExamples', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('should transform .gem-ig-example elements into toggleable wrappers', () => {
        // Create a test example element
        const exampleElement = document.createElement('div');
        exampleElement.classList.add('gem-ig-example');
        exampleElement.setAttribute('data-title', 'Test Example');
        exampleElement.innerHTML = '<p>Example content</p>';
        container.appendChild(exampleElement);

        main.enableExamples();

        // Check wrapper creation
        const wrapper = container.querySelector('.gem-ig-example-wrapper');
        expect(wrapper).toBeTruthy();

        // Check header
        const header = wrapper.querySelector('.gem-ig-example-header');
        expect(header).toBeTruthy();

        // Check toggle button
        const toggleButton = header.querySelector('.gem-ig-example-toggle');
        expect(toggleButton).toBeTruthy();
        expect(toggleButton.textContent).toBe('▼');

        // Check title
        const title = header.querySelector('.gem-ig-example-title');
        expect(title).toBeTruthy();
        expect(title.textContent).toBe('Test Example');

        // Check content wrapper
        const contentWrapper = wrapper.querySelector('.gem-ig-example-content');
        expect(contentWrapper).toBeTruthy();
        expect(contentWrapper.innerHTML).toBe('<p>Example content</p>');
        expect(contentWrapper.style.display).toBe('none');
    });

    it('should handle examples without a title attribute', () => {
        const exampleElement = document.createElement('div');
        exampleElement.classList.add('gem-ig-example');
        exampleElement.innerHTML = '<p>Example content</p>';
        container.appendChild(exampleElement);

        main.enableExamples();

        const title = container.querySelector('.gem-ig-example-title');
        expect(title).toBeTruthy();
        expect(title.textContent).toBe('');
    });

    it('should toggle content visibility when toggle button is clicked', () => {
        const exampleElement = document.createElement('div');
        exampleElement.classList.add('gem-ig-example');
        exampleElement.setAttribute('data-title', 'Test Example');
        exampleElement.innerHTML = '<p>Example content</p>';
        container.appendChild(exampleElement);

        main.enableExamples();

        const toggleButton = container.querySelector('.gem-ig-example-toggle');
        const contentWrapper = container.querySelector('.gem-ig-example-content');

        // Initial state
        expect(contentWrapper.style.display).toBe('none');
        expect(toggleButton.textContent).toBe('▼');

        // First click
        toggleButton.click();
        expect(contentWrapper.style.display).toBe('block');
        expect(toggleButton.textContent).toBe('►');

        // Second click
        toggleButton.click();
        expect(contentWrapper.style.display).toBe('none');
        expect(toggleButton.textContent).toBe('▼');
    });

    it('should toggle content visibility when title is clicked', () => {
        const exampleElement = document.createElement('div');
        exampleElement.classList.add('gem-ig-example');
        exampleElement.setAttribute('data-title', 'Test Example');
        exampleElement.innerHTML = '<p>Example content</p>';
        container.appendChild(exampleElement);

        main.enableExamples();

        const title = container.querySelector('.gem-ig-example-title');
        const contentWrapper = container.querySelector('.gem-ig-example-content');

        // Initial state
        expect(contentWrapper.style.display).toBe('none');

        // First click
        title.click();
        expect(contentWrapper.style.display).toBe('block');

        // Second click
        title.click();
        expect(contentWrapper.style.display).toBe('none');
    });

    it('should handle multiple example elements', () => {
        // Create multiple example elements
        const createExampleElement = (title, content) => {
            const exampleElement = document.createElement('div');
            exampleElement.classList.add('gem-ig-example');
            exampleElement.setAttribute('data-title', title);
            exampleElement.innerHTML = content;
            return exampleElement;
        };

        const example1 = createExampleElement('Example 1', '<p>Content 1</p>');
        const example2 = createExampleElement('Example 2', '<p>Content 2</p>');
        
        container.appendChild(example1);
        container.appendChild(example2);

        main.enableExamples();

        const wrapper1 = container.querySelectorAll('.gem-ig-example-wrapper')[0];
        expect(wrapper1.querySelector('.gem-ig-example-title').textContent).toBe('Example 1');
        expect(wrapper1.querySelector('.gem-ig-example-content').innerHTML).toBe('<p>Content 1</p>');

        const wrapper2 = container.querySelectorAll('.gem-ig-example-wrapper')[1];
        expect(wrapper2.querySelector('.gem-ig-example-title').textContent).toBe('Example 2');
        expect(wrapper2.querySelector('.gem-ig-example-content').innerHTML).toBe('<p>Content 2</p>');
    });

    it('should remove original example elements after transformation', () => {
        const exampleElement = document.createElement('div');
        exampleElement.classList.add('gem-ig-example');
        exampleElement.setAttribute('data-title', 'Test Example');
        exampleElement.innerHTML = '<p>Example content</p>';
        container.appendChild(exampleElement);

        main.enableExamples();

        const originalElement = container.querySelector('.gem-ig-example');
        expect(originalElement).toBeFalsy();
    });

    it('should handle empty example elements gracefully', () => {
        const exampleElement = document.createElement('div');
        exampleElement.classList.add('gem-ig-example');
        exampleElement.setAttribute('data-title', 'Empty Example');
        container.appendChild(exampleElement);

        main.enableExamples();

        const wrapper = container.querySelector('.gem-ig-example-wrapper');
        expect(wrapper).toBeTruthy();

        const contentWrapper = wrapper.querySelector('.gem-ig-example-content');
        expect(contentWrapper).toBeTruthy();
        expect(contentWrapper.innerHTML).toBe('');
    });
});

describe('convertBibliographyToLink', () => {
    let originalBody;

    beforeEach(() => {
        // Store original body to restore after each test
        originalBody = document.body.cloneNode(true);
    });

    afterEach(() => {
        // Restore the original body to clean up DOM modifications
        document.body.innerHTML = originalBody.innerHTML;
    });

    it('should convert single bibliography reference to a link', () => {
        const literatureData = [
            { 
                key: 'REF1', 
                link: 'https://example.com/ref1', 
                author: 'John Doe', 
                title: 'Sample Research' 
            }
        ];

        document.body.innerHTML = 'This is a test [REF1] reference.';

        main.convertBibliographyToLink(literatureData);

        const link = document.body.querySelector('a.literature-link');
        expect(link).toBeTruthy();
        expect(link.href).toBe('https://example.com/ref1');
        expect(link.textContent).toBe('[REF1]');
        expect(link.title).toBe('John Doe: Sample Research');
        expect(link.getAttribute('data-author')).toBe('John Doe');
        expect(link.getAttribute('data-title')).toBe('Sample Research');
        expect(link.target).toBe('_blank');
    });

    it('should handle multiple references in the same text node', () => {
        const literatureData = [
            { 
                key: 'REF1', 
                link: 'https://example.com/ref1', 
                author: 'John Doe', 
                title: 'First Research' 
            },
            { 
                key: 'REF2', 
                link: 'https://example.com/ref2', 
                author: 'Jane Smith', 
                title: 'Second Research' 
            }
        ];

        document.body.innerHTML = 'Multiple references [REF1] and [REF2] in one text.';

        main.convertBibliographyToLink(literatureData);

        const links = document.body.querySelectorAll('a.literature-link');
        expect(links.length).toBe(2);
        
        expect(links[0].href).toBe('https://example.com/ref1');
        expect(links[0].textContent).toBe('[REF1]');
        
        expect(links[1].href).toBe('https://example.com/ref2');
        expect(links[1].textContent).toBe('[REF2]');
    });

    it('should handle references in nested elements', () => {
        const literatureData = [
            { 
                key: 'REF1', 
                link: 'https://example.com/ref1', 
                author: 'John Doe', 
                title: 'Nested Research' 
            }
        ];

        document.body.innerHTML = `
            <div>
                <p>Nested reference [REF1] in paragraph.</p>
                <span>Another <strong>nested [REF1] reference</strong>.</span>
            </div>
        `;

        main.convertBibliographyToLink(literatureData);

        const links = document.body.querySelectorAll('a.literature-link');
        expect(links.length).toBe(2);
        
        links.forEach(link => {
            expect(link.href).toBe('https://example.com/ref1');
            expect(link.textContent).toBe('[REF1]');
        });
    });

    it('should not modify text when no matching references exist', () => {
        const literatureData = [
            { 
                key: 'REF1', 
                link: 'https://example.com/ref1', 
                author: 'John Doe', 
                title: 'Sample Research' 
            }
        ];

        document.body.innerHTML = 'No matching reference [UNKNOWN] here.';

        main.convertBibliographyToLink(literatureData);

        const link = document.body.querySelector('a.literature-link');
        expect(link).toBeFalsy();
        expect(document.body.textContent).toBe('No matching reference [UNKNOWN] here.');
    });

    it('should handle empty literature data', () => {
        document.body.innerHTML = 'Some text with [REF1] reference.';

        main.convertBibliographyToLink([]);

        const link = document.body.querySelector('a.literature-link');
        expect(link).toBeFalsy();
        expect(document.body.textContent).toBe('Some text with [REF1] reference.');
    });

    it('should be case-sensitive for reference keys', () => {
        const literatureData = [
            { 
                key: 'REF1', 
                link: 'https://example.com/ref1', 
                author: 'John Doe', 
                title: 'Sample Research' 
            }
        ];

        document.body.innerHTML = 'Case-sensitive [ref1] reference.';

        main.convertBibliographyToLink(literatureData);

        const link = document.body.querySelector('a.literature-link');
        expect(link).toBeFalsy();
        expect(document.body.textContent).toBe('Case-sensitive [ref1] reference.');
    });

    it('should handle references with special characters in keys', () => {
        const literatureData = [
            { 
                key: 'REF-1.2', 
                link: 'https://example.com/ref-special', 
                author: 'John Doe', 
                title: 'Special Chars Research' 
            }
        ];

        document.body.innerHTML = 'Special characters reference [REF-1.2].';

        main.convertBibliographyToLink(literatureData);

        const link = document.body.querySelector('a.literature-link');
        expect(link).toBeTruthy();
        expect(link.href).toBe('https://example.com/ref-special');
    });

    it('should not interfere with existing links', () => {
        const literatureData = [
            { 
                key: 'REF1', 
                link: 'https://example.com/ref1', 
                author: 'John Doe', 
                title: 'Sample Research' 
            }
        ];

        document.body.innerHTML = `
            <p>Existing link <a href="https://existing.com">with text</a> and [REF1] reference.</p>
        `;

        main.convertBibliographyToLink(literatureData);

        const existingLink = document.body.querySelector('a[href="https://existing.com"]');
        expect(existingLink).toBeTruthy();
        expect(existingLink.textContent).toBe('with text');

        const bibLink = document.body.querySelector('a.literature-link');
        expect(bibLink).toBeTruthy();
        expect(bibLink.textContent).toBe('[REF1]');
    });
});

describe('renderCodeBlocks', () => {
    let container;
    let mockCreateCopyButton;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);

        // Mock utils.createCopyButton to track calls and return a mock button
        mockCreateCopyButton = jest.spyOn(utils, 'createCopyButton');
        mockCreateCopyButton.mockImplementation((text) => {
            const button = document.createElement('button');
            button.classList.add('copy-button');
            button.textContent = 'Copy';
            button.setAttribute('data-copy-text', text);
            return button;
        });
    });

    afterEach(() => {
        document.body.removeChild(container);
        mockCreateCopyButton.mockRestore();
    });

    it('should add copy button to code blocks with language classes', () => {
        // Create a code block with a language class
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.classList.add('language-javascript');
        code.textContent = 'console.log("Hello, world!");';
        pre.appendChild(code);
        container.appendChild(pre);

        main.renderCodeBlocks();

        // Check that copy button was created and inserted
        const copyButton = pre.querySelector('.copy-button');
        expect(copyButton).toBeTruthy();
        expect(copyButton.getAttribute('data-copy-text')).toBe('console.log("Hello, world!");');
        expect(pre.children[0]).toBe(copyButton);
        expect(pre.children[1]).toBe(code);
    });

    it('should not add copy button to code blocks without language classes', () => {
        // Create a code block without a language class
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.textContent = 'Some plain text';
        pre.appendChild(code);
        container.appendChild(pre);

        main.renderCodeBlocks();

        // Check that no copy button was created
        const copyButton = pre.querySelector('.copy-button');
        expect(copyButton).toBeFalsy();
    });

    it('should not add copy button to code blocks with plaintext-like classes', () => {
        // Test multiple plaintext-like classes
        const plaintextClasses = ['language-plaintext', 'language-txt', 'language-text'];
        
        plaintextClasses.forEach(plaintextClass => {
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.classList.add(plaintextClass);
            code.textContent = 'Some plain text';
            pre.appendChild(code);
            container.appendChild(pre);
        });

        main.renderCodeBlocks();

        // Check that no copy buttons were created for any plaintext-like classes
        const copyButtons = container.querySelectorAll('.copy-button');
        expect(copyButtons.length).toBe(0);
    });

    it('should handle multiple code blocks with different language classes', () => {
        // Create multiple code blocks
        const createCodeBlock = (languageClass, text) => {
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.classList.add(languageClass);
            code.textContent = text;
            pre.appendChild(code);
            return pre;
        };

        const codeBlocks = [
            createCodeBlock('language-javascript', 'console.log("JS");'),
            createCodeBlock('language-python', 'print("Python")'),
            createCodeBlock('language-html', '<div>HTML</div>')
        ];

        codeBlocks.forEach(block => container.appendChild(block));

        main.renderCodeBlocks();

        // Check that copy buttons were added to language-specific blocks
        codeBlocks.forEach(pre => {
            const code = pre.querySelector('code');
            const copyButton = pre.querySelector('.copy-button');
            
            const plaintextClasses = ['language-plaintext', 'language-txt', 'language-text'];
            const isPlaintext = plaintextClasses.some(cls => code.classList.contains(cls));
            
            if (isPlaintext) {
                expect(copyButton).toBeFalsy();
            } else {
                expect(copyButton).toBeTruthy();
                expect(copyButton.getAttribute('data-copy-text')).toBe(code.textContent);
            }
        });
    });

    it('should handle code blocks with multiple classes', () => {
        // Create a code block with multiple classes
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.classList.add('language-javascript', 'hljs', 'custom-class');
        code.textContent = 'const x = 42;';
        pre.appendChild(code);
        container.appendChild(pre);

        main.renderCodeBlocks();

        // Check that copy button was created
        const copyButton = pre.querySelector('.copy-button');
        expect(copyButton).toBeTruthy();
        expect(copyButton.getAttribute('data-copy-text')).toBe('const x = 42;');
    });

    it('should handle empty code blocks', () => {
        // Create an empty code block with a language class
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.classList.add('language-javascript');
        code.textContent = '';
        pre.appendChild(code);
        container.appendChild(pre);

        main.renderCodeBlocks();

        // Check that copy button was created even for empty blocks
        const copyButton = pre.querySelector('.copy-button');
        expect(copyButton).toBeTruthy();
        expect(copyButton.getAttribute('data-copy-text')).toBe('');
    });

    it('should not modify code elements not inside pre tags', () => {
        // Create a code element not inside a pre tag
        const code = document.createElement('code');
        code.classList.add('language-javascript');
        code.textContent = 'console.log("Not in pre")';
        container.appendChild(code);

        main.renderCodeBlocks();

        // Check that no copy button was created
        const copyButton = container.querySelector('.copy-button');
        expect(copyButton).toBeFalsy();
    });
});
