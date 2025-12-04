import { renderOpenApi, initOpenApi } from '../src/openapi.js';
import SwaggerUI from 'swagger-ui-dist/swagger-ui-bundle.js';

jest.mock('swagger-ui-dist/swagger-ui-bundle.js', () => jest.fn());
jest.mock('swagger-ui-dist/swagger-ui.css', () => ({}));

describe('renderOpenApi', () => {
    let consoleWarnSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        document.body.innerHTML = '';
        SwaggerUI.mockClear();
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    test('should render SwaggerUI for elements with valid data-openapi-url', () => {
        document.body.innerHTML = `
            <div class="ig-openapi" data-openapi-url="https://api.example.com/openapi.json"></div>
        `;

        const node = document.querySelector('.ig-openapi');
        const count = renderOpenApi();

        expect(count).toBe(1);
        expect(SwaggerUI).toHaveBeenCalledTimes(1);
        expect(SwaggerUI).toHaveBeenCalledWith({
            url: 'https://api.example.com/openapi.json',
            domNode: node
        });
    });

    test('should render multiple SwaggerUI instances with correct parameters', () => {
        document.body.innerHTML = `
            <div class="ig-openapi" data-openapi-url="https://api1.example.com/openapi.json"></div>
            <div class="ig-openapi" data-openapi-url="https://api2.example.com/openapi.json"></div>
            <div class="ig-openapi" data-openapi-url="https://api3.example.com/openapi.json"></div>
        `;

        const nodes = document.querySelectorAll('.ig-openapi');
        const count = renderOpenApi();

        expect(count).toBe(3);
        expect(SwaggerUI).toHaveBeenCalledTimes(3);
        
        expect(SwaggerUI).toHaveBeenNthCalledWith(1, {
            url: 'https://api1.example.com/openapi.json',
            domNode: nodes[0]
        });
        expect(SwaggerUI).toHaveBeenNthCalledWith(2, {
            url: 'https://api2.example.com/openapi.json',
            domNode: nodes[1]
        });
        expect(SwaggerUI).toHaveBeenNthCalledWith(3, {
            url: 'https://api3.example.com/openapi.json',
            domNode: nodes[2]
        });
    });

    test('should not render SwaggerUI when no elements exist', () => {
        document.body.innerHTML = '<div></div>';

        const count = renderOpenApi();

        expect(count).toBe(0);
        expect(SwaggerUI).not.toHaveBeenCalled();
    });

    test('should warn and skip elements without data-openapi-url attribute', () => {
        document.body.innerHTML = `
            <div class="ig-openapi"></div>
            <div class="ig-openapi" data-openapi-url=""></div>
        `;

        const count = renderOpenApi();

        expect(count).toBe(2);
        expect(SwaggerUI).not.toHaveBeenCalled();
        expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    });

    test('should handle mixed valid and invalid elements correctly', () => {
        document.body.innerHTML = `
            <div class="ig-openapi" data-openapi-url="https://valid1.com/api.json"></div>
            <div class="ig-openapi"></div>
            <div class="ig-openapi" data-openapi-url="https://valid2.com/api.json"></div>
            <div class="ig-openapi" data-openapi-url=""></div>
        `;

        const nodes = document.querySelectorAll('.ig-openapi');
        const count = renderOpenApi();

        expect(count).toBe(4);
        expect(SwaggerUI).toHaveBeenCalledTimes(2);
        expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
        
        expect(SwaggerUI).toHaveBeenNthCalledWith(1, {
            url: 'https://valid1.com/api.json',
            domNode: nodes[0]
        });
        expect(SwaggerUI).toHaveBeenNthCalledWith(2, {
            url: 'https://valid2.com/api.json',
            domNode: nodes[2]
        });
    });

    test('should handle SwaggerUI errors gracefully', () => {
        SwaggerUI.mockImplementationOnce(() => {
            throw new Error('SwaggerUI initialization failed');
        });

        document.body.innerHTML = `
            <div class="ig-openapi" data-openapi-url="https://api.example.com/openapi.json"></div>
        `;

        const node = document.querySelector('.ig-openapi');
        const count = renderOpenApi();

        expect(count).toBe(1);
        expect(SwaggerUI).toHaveBeenCalledTimes(1);
        expect(SwaggerUI).toHaveBeenCalledWith({
            url: 'https://api.example.com/openapi.json',
            domNode: node
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Failed to render SwaggerUI',
            expect.any(Error)
        );
    });

    test('should continue rendering other instances after one fails', () => {
        SwaggerUI
            .mockImplementationOnce(() => {
                throw new Error('First instance failed');
            })
            .mockImplementationOnce(() => {
                // Second succeeds
            });

        document.body.innerHTML = `
            <div class="ig-openapi" data-openapi-url="https://api1.example.com/openapi.json"></div>
            <div class="ig-openapi" data-openapi-url="https://api2.example.com/openapi.json"></div>
        `;

        const nodes = document.querySelectorAll('.ig-openapi');
        const count = renderOpenApi();

        expect(count).toBe(2);
        expect(SwaggerUI).toHaveBeenCalledTimes(2);
        
        expect(SwaggerUI).toHaveBeenNthCalledWith(1, {
            url: 'https://api1.example.com/openapi.json',
            domNode: nodes[0]
        });
        expect(SwaggerUI).toHaveBeenNthCalledWith(2, {
            url: 'https://api2.example.com/openapi.json',
            domNode: nodes[1]
        });
        
        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    test('should handle URLs with special characters', () => {
        const specialUrl = 'https://api.example.com/openapi.json?version=v2&format=json';
        document.body.innerHTML = `
            <div class="ig-openapi" data-openapi-url="${specialUrl}"></div>
        `;

        const node = document.querySelector('.ig-openapi');
        renderOpenApi();

        expect(SwaggerUI).toHaveBeenCalledWith({
            url: specialUrl,
            domNode: node
        });
    });
});

describe('initOpenApi', () => {
    let addEventListenerSpy;
    let originalReadyState;

    beforeAll(() => {
        originalReadyState = Object.getOwnPropertyDescriptor(Document.prototype, 'readyState');
    });

    beforeEach(() => {
        document.body.innerHTML = '';
        SwaggerUI.mockClear();
        addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    });

    afterEach(() => {
        addEventListenerSpy.mockRestore();
    });

    afterAll(() => {
        if (originalReadyState) {
            Object.defineProperty(Document.prototype, 'readyState', originalReadyState);
        }
        jest.restoreAllMocks();
    });

    test('should add event listener when document is loading', () => {
        Object.defineProperty(document, 'readyState', {
            writable: true,
            configurable: true,
            value: 'loading'
        });

        initOpenApi();

        expect(addEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', renderOpenApi);
        expect(SwaggerUI).not.toHaveBeenCalled();
    });

    test('should call renderOpenApi immediately when document is interactive', () => {
        Object.defineProperty(document, 'readyState', {
            writable: true,
            configurable: true,
            value: 'interactive'
        });

        document.body.innerHTML = `
            <div class="ig-openapi" data-openapi-url="https://api.example.com/openapi.json"></div>
        `;

        const node = document.querySelector('.ig-openapi');
        initOpenApi();

        expect(SwaggerUI).toHaveBeenCalledTimes(1);
        expect(SwaggerUI).toHaveBeenCalledWith({
            url: 'https://api.example.com/openapi.json',
            domNode: node
        });
        expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    test('should call renderOpenApi immediately when document is complete', () => {
        Object.defineProperty(document, 'readyState', {
            writable: true,
            configurable: true,
            value: 'complete'
        });

        document.body.innerHTML = `
            <div class="ig-openapi" data-openapi-url="https://api.example.com/openapi.json"></div>
        `;

        const node = document.querySelector('.ig-openapi');
        initOpenApi();

        expect(SwaggerUI).toHaveBeenCalledTimes(1);
        expect(SwaggerUI).toHaveBeenCalledWith({
            url: 'https://api.example.com/openapi.json',
            domNode: node
        });
        expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    test('should handle multiple elements when document is ready', () => {
        Object.defineProperty(document, 'readyState', {
            writable: true,
            configurable: true,
            value: 'complete'
        });

        document.body.innerHTML = `
            <div class="ig-openapi" data-openapi-url="https://api1.example.com/openapi.json"></div>
            <div class="ig-openapi" data-openapi-url="https://api2.example.com/openapi.json"></div>
        `;

        const nodes = document.querySelectorAll('.ig-openapi');
        initOpenApi();

        expect(SwaggerUI).toHaveBeenCalledTimes(2);
        expect(SwaggerUI).toHaveBeenNthCalledWith(1, {
            url: 'https://api1.example.com/openapi.json',
            domNode: nodes[0]
        });
        expect(SwaggerUI).toHaveBeenNthCalledWith(2, {
            url: 'https://api2.example.com/openapi.json',
            domNode: nodes[1]
        });
    });
});
