import apiDoc from '../src/api.doc.js';
import utils from '../src/utils.js';
import gematikLabels from '../src/labels.js'


jest.mock('../css/ig.apidoc.gematik.css', () => ({}));

describe('parseExampleDivs', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('should return null for null container', () => {
        expect(apiDoc.parseExampleDivs(null)).toBeNull();
    });

    it('should return empty array for empty container', () => {
        expect(apiDoc.parseExampleDivs(container)).toEqual([]);
    });

    it('should parse div with data attributes and innerHTML', () => {
        const div = document.createElement('div');
        div.setAttribute('data-name', 'test');
        div.setAttribute('data-type', 'json');
        div.innerHTML = '{"key": "value"}';
        container.appendChild(div);

        const result = apiDoc.parseExampleDivs(container);
        expect(result).toEqual([{
            name: 'test',
            type: 'json',
            render: null,
            data: '{"key": "value"}'
        }]);
    });

    it('should parse div with data-url instead of innerHTML', () => {
        const div = document.createElement('div');
        div.setAttribute('data-name', 'test');
        div.setAttribute('data-type', 'xml');
        div.setAttribute('data-url', 'http://example.com/data.xml');
        container.appendChild(div);

        const result = apiDoc.parseExampleDivs(container);
        expect(result).toEqual([{
            name: 'test',
            type: 'xml',
            render: null,
            url: 'http://example.com/data.xml'
        }]);
    });

    it('should parse div with data-render attribute', () => {
        const div = document.createElement('div');
        div.setAttribute('data-name', 'test');
        div.setAttribute('data-type', 'html');
        div.setAttribute('data-render', 'true');
        div.innerHTML = '<div>test</div>';
        container.appendChild(div);

        const result = apiDoc.parseExampleDivs(container);
        expect(result).toEqual([{
            name: 'test',
            type: 'html',
            render: 'true',
            data: '<div>test</div>'
        }]);
    });

    it('should handle multiple example divs', () => {
        const div1 = document.createElement('div');
        div1.setAttribute('data-name', 'test1');
        div1.setAttribute('data-type', 'json');
        div1.innerHTML = '{"key": "value"}';

        const div2 = document.createElement('div');
        div2.setAttribute('data-name', 'test2');
        div2.setAttribute('data-type', 'xml');
        div2.setAttribute('data-url', 'http://example.com/data.xml');

        container.append(div1, div2);

        const result = apiDoc.parseExampleDivs(container);
        expect(result).toEqual([
            {
                name: 'test1',
                type: 'json',
                render: null,
                data: '{"key": "value"}'
            },
            {
                name: 'test2',
                type: 'xml',
                render: null,
                url: 'http://example.com/data.xml'
            }
        ]);
    });

    it('should trim innerHTML whitespace', () => {
        const div = document.createElement('div');
        div.setAttribute('data-name', 'test');
        div.setAttribute('data-type', 'json');
        div.innerHTML = '  {"key": "value"}  ';
        container.appendChild(div);

        const result = apiDoc.parseExampleDivs(container);
        expect(result).toEqual([{
            name: 'test',
            type: 'json',
            render: null,
            data: '{"key": "value"}'
        }]);
    });

    it('should handle empty innerHTML as empty string', () => {
        const div = document.createElement('div');
        div.setAttribute('data-name', 'test');
        div.setAttribute('data-type', 'json');
        div.innerHTML = '';
        container.appendChild(div);

        const result = apiDoc.parseExampleDivs(container);
        expect(result).toEqual([{
            name: 'test',
            type: 'json',
            render: null,
            data: ''
        }]);
    });

    it('should skip divs missing required attributes', () => {
        const div1 = document.createElement('div');
        div1.setAttribute('data-name', 'test1');
        div1.innerHTML = 'content'; // missing data-type

        const div2 = document.createElement('div');
        div2.setAttribute('data-type', 'json');
        div2.innerHTML = 'content'; // missing data-name

        container.append(div1, div2);

        const result = apiDoc.parseExampleDivs(container);
        expect(result).toEqual([]);
    });
});

describe('parseValueDivs', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('should return null for null container', () => {
        expect(apiDoc.parseValueDivs(null)).toBeNull();
    });

    it('should return empty array for empty container', () => {
        expect(apiDoc.parseValueDivs(container)).toEqual([]);
    });

    it('should return empty array for container with no matching divs', () => {
        const div = document.createElement('div');
        div.setAttribute('data-other', 'value');
        container.appendChild(div);
        expect(apiDoc.parseValueDivs(container)).toEqual([]);
    });

    it('should parse single div with data-value', () => {
        const div = document.createElement('div');
        div.setAttribute('data-value', 'test-value');
        container.appendChild(div);
        expect(apiDoc.parseValueDivs(container)).toEqual(['test-value']);
    });

    it('should parse multiple divs with data-value', () => {
        const div1 = document.createElement('div');
        div1.setAttribute('data-value', 'value1');
        const div2 = document.createElement('div');
        div2.setAttribute('data-value', 'value2');
        container.append(div1, div2);
        expect(apiDoc.parseValueDivs(container)).toEqual(['value1', 'value2']);
    });

    it('should handle empty data-value as empty string', () => {
        const div = document.createElement('div');
        div.setAttribute('data-value', '');
        container.appendChild(div);
        expect(apiDoc.parseValueDivs(container)).toEqual(['']);
    });

    it('should handle special characters in data-value', () => {
        const div = document.createElement('div');
        div.setAttribute('data-value', 'special&chars<>"\'');
        container.appendChild(div);
        expect(apiDoc.parseValueDivs(container)).toEqual(['special&chars<>"\'']);
    });

    it('should consider nested divs with data-value', () => {
        const outerDiv = document.createElement('div');
        outerDiv.setAttribute('data-value', 'outer');
        const innerDiv = document.createElement('div');
        innerDiv.setAttribute('data-value', 'inner');
        outerDiv.appendChild(innerDiv);
        container.appendChild(outerDiv);
        expect(apiDoc.parseValueDivs(container)).toEqual(['outer', 'inner']);
    });
});

describe('parseParams', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('should return empty array for null container', () => {
        expect(apiDoc.parseParams(null)).toEqual([]);
    });

    it('should return empty array for empty container', () => {
        expect(apiDoc.parseParams(container)).toEqual([]);
    });

    it('should parse div with data-name and data-type attributes', () => {
        const div = document.createElement('div');
        div.setAttribute('data-name', 'param1');
        div.setAttribute('data-type', 'string');
        div.innerHTML = 'Parameter description';
        container.appendChild(div);

        const result = apiDoc.parseParams(container);
        expect(result).toEqual([{
            name: 'param1',
            type: 'string',
            documentation: 'Parameter description',
            description: 'Parameter description',
            expectation: ''
        }]);
    });

    it('should handle multiple parameter divs', () => {
        const div1 = document.createElement('div');
        div1.setAttribute('data-name', 'param1');
        div1.setAttribute('data-type', 'string');
        div1.innerHTML = 'First param';

        const div2 = document.createElement('div');
        div2.setAttribute('data-name', 'param2');
        div2.setAttribute('data-type', 'number');
        div2.innerHTML = 'Second param';

        container.append(div1, div2);

        const result = apiDoc.parseParams(container);
        expect(result).toEqual([
            {
                name: 'param1',
                type: 'string',
                documentation: 'First param',
                description: 'First param',
                expectation: ''
            },
            {
                name: 'param2',
                type: 'number',
                documentation: 'Second param',
                description: 'Second param',
                expectation: ''
            }
        ]);
    });

    it('should handle empty innerHTML as empty string', () => {
        const div = document.createElement('div');
        div.setAttribute('data-name', 'param1');
        div.setAttribute('data-type', 'string');
        div.innerHTML = '';
        container.appendChild(div);

        const result = apiDoc.parseParams(container);
        expect(result).toEqual([{
            name: 'param1',
            type: 'string',
            documentation: '',
            description: '',
            expectation: ''
        }]);
    });

    it('should trim innerHTML whitespace', () => {
        const div = document.createElement('div');
        div.setAttribute('data-name', 'param1');
        div.setAttribute('data-type', 'string');
        div.innerHTML = '  Parameter description  ';
        container.appendChild(div);

        const result = apiDoc.parseParams(container);
        expect(result).toEqual([{
            name: 'param1',
            type: 'string',
            documentation: 'Parameter description',
            description: 'Parameter description',
            expectation: ''
        }]);
    });

    it('should handle special characters in innerHTML', () => {
        const div = document.createElement('div');
        div.setAttribute('data-name', 'param1');
        div.setAttribute('data-type', 'string');
        div.innerHTML = 'Description with <tags> & entities';
        container.appendChild(div);

        const result = apiDoc.parseParams(container);
        expect(result).toEqual([{
            name: 'param1',
            type: 'string',
            documentation: 'Description with <tags> &amp; entities</tags>',
            description: 'Description with <tags> &amp; entities</tags>',
            expectation: ''
        }]);
    });
});

describe('parseResponseInfos', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('should return empty array for null container', () => {
        expect(apiDoc.parseResponseInfos(null)).toEqual([]);
    });

    it('should return empty array for empty container', () => {
        expect(apiDoc.parseResponseInfos(container)).toEqual([]);
    });

    it('should parse div with all response info attributes', () => {
        const div = document.createElement('div');
        div.setAttribute('data-code', '200');
        div.setAttribute('data-error-code', 'OK');
        div.setAttribute('data-response-type', 'application/json');
        div.innerHTML = 'Successful response';
        container.appendChild(div);

        const result = apiDoc.parseResponseInfos(container);
        expect(result).toEqual([{
            statusCode: '200',
            errorCode: 'OK',
            description: 'Successful response',
            responseType: 'application/json'
        }]);
    });

    it('should handle missing optional attributes', () => {
        const div = document.createElement('div');
        div.setAttribute('data-code', '404');
        div.innerHTML = 'Not found';
        container.appendChild(div);

        const result = apiDoc.parseResponseInfos(container);
        expect(result).toEqual([{
            statusCode: '404',
            errorCode: null,
            description: 'Not found',
            responseType: null
        }]);
    });

    it('should handle multiple response info divs', () => {
        const div1 = document.createElement('div');
        div1.setAttribute('data-code', '200');
        div1.setAttribute('data-error-code', 'OK');
        div1.innerHTML = 'Success';

        const div2 = document.createElement('div');
        div2.setAttribute('data-code', '400');
        div2.setAttribute('data-response-type', 'application/json');
        div2.innerHTML = 'Bad request';

        container.append(div1, div2);

        const result = apiDoc.parseResponseInfos(container);
        expect(result).toEqual([
            {
                statusCode: '200',
                errorCode: 'OK',
                description: 'Success',
                responseType: null
            },
            {
                statusCode: '400',
                errorCode: null,
                description: 'Bad request',
                responseType: 'application/json'
            }
        ]);
    });

    it('should trim description whitespace', () => {
        const div = document.createElement('div');
        div.setAttribute('data-code', '200');
        div.innerHTML = '  Success  ';
        container.appendChild(div);

        const result = apiDoc.parseResponseInfos(container);
        expect(result).toEqual([{
            statusCode: '200',
            errorCode: null,
            description: 'Success',
            responseType: null
        }]);
    });

    it('should handle empty description as empty string', () => {
        const div = document.createElement('div');
        div.setAttribute('data-code', '204');
        div.innerHTML = '';
        container.appendChild(div);

        const result = apiDoc.parseResponseInfos(container);
        expect(result).toEqual([{
            statusCode: '204',
            errorCode: null,
            description: '',
            responseType: null
        }]);
    });

    it('should handle special characters in description', () => {
        const div = document.createElement('div');
        div.setAttribute('data-code', '200');
        div.innerHTML = 'Response with <tags> & entities';
        container.appendChild(div);

        const result = apiDoc.parseResponseInfos(container);
        expect(result).toEqual([{
            statusCode: '200',
            errorCode: null,
            description: 'Response with <tags> &amp; entities</tags>',
            responseType: null
        }]);
    });

    it('should handle numeric status codes', () => {
        const div = document.createElement('div');
        div.setAttribute('data-code', '500');
        div.innerHTML = 'Server error';
        container.appendChild(div);

        const result = apiDoc.parseResponseInfos(container);
        expect(result).toEqual([{
            statusCode: '500',
            errorCode: null,
            description: 'Server error',
            responseType: null
        }]);
    });

    it('should handle non-numeric status codes', () => {
        const div = document.createElement('div');
        div.setAttribute('data-code', '4XX');
        div.innerHTML = 'Client error';
        container.appendChild(div);

        const result = apiDoc.parseResponseInfos(container);
        expect(result).toEqual([{
            statusCode: '4XX',
            errorCode: null,
            description: 'Client error',
            responseType: null
        }]);
    });
});

describe('extractApiConfig', () => {
    test('should extract all attributes when present', () => {
        const div = document.createElement('div');
        div.setAttribute('data-api-type', 'FHIR');
        div.setAttribute('data-api-fhir-resource-type', 'Patient');
        div.setAttribute('data-api-fhir-interaction', 'read');
        div.setAttribute('data-api-operation-id', 'op123');
        div.setAttribute('data-api-url-path', '/api/v1/patients');
        div.setAttribute('data-api-fhir-invoke-level', 'instance');
        div.setAttribute('data-api-method', 'GET');

        const result = apiDoc.extractApiConfig(div);

        expect(result).toEqual({
            apiType: 'FHIR',
            resourceType: 'Patient',
            interaction: 'read',
            operationId: 'op123',
            urlPath: '/api/v1/patients',
            invokeLevel: 'instance',
            httpMethod: 'GET',
        });
    });

    test('should use default ApiType.CUSTOM when data-api-type is missing', () => {
        const div = document.createElement('div');

        const result = apiDoc.extractApiConfig(div);

        expect(result.apiType).toBe(apiDoc.ApiType.CUSTOM);
    });

    test('should return null for missing attributes except apiType', () => {
        const div = document.createElement('div');

        const result = apiDoc.extractApiConfig(div);

        expect(result.resourceType).toBeNull();
        expect(result.interaction).toBeNull();
        expect(result.operationId).toBeNull();
        expect(result.urlPath).toBeNull();
        expect(result.invokeLevel).toBeNull();
        expect(result.httpMethod).toBeNull();
    });

    test('should handle mix of present and missing attributes', () => {
        const div = document.createElement('div');
        div.setAttribute('data-api-url-path', '/api/test');
        div.setAttribute('data-api-method', 'POST');

        const result = apiDoc.extractApiConfig(div);

        expect(result.apiType).toBe(apiDoc.ApiType.CUSTOM);
        expect(result.urlPath).toBe('/api/test');
        expect(result.httpMethod).toBe('POST');
        expect(result.resourceType).toBeNull();
    });
});

describe('extractCapabilityStatement', () => {
    let div;

    beforeEach(() => {
        div = document.createElement('div');
        jest.spyOn(utils, 'isJson');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('returns null data and url when container is not found', () => {
        const result = apiDoc.extractCapabilityStatement(div);
    
        expect(result).toEqual({ data: null, url: null });
    });

    test('extracts data and url from #CapabilityStatement', () => {
        const container = document.createElement('div');
        container.id = 'CapabilityStatement';
        container.setAttribute('data-url', 'https://example.com/api');
        container.textContent = '{"resourceType": "CapabilityStatement"}';
        div.appendChild(container);

        utils.isJson.mockReturnValue(true);

        const result = apiDoc.extractCapabilityStatement(div);
    
        expect(result.data).toBe('{"resourceType": "CapabilityStatement"}');
        expect(result.url).toBe('https://example.com/api');
    });

    test('handles #Capability-Statement id variant', () => {
        const container = document.createElement('div');
        container.id = 'Capability-Statement';
        container.setAttribute('data-url', 'https://example.com/api');
        container.textContent = '{"test": true}';
        div.appendChild(container);

        utils.isJson.mockReturnValue(true);

        const result = apiDoc.extractCapabilityStatement(div);
    
        expect(result.data).toBe('{"test": true}');
        expect(result.url).toBe('https://example.com/api');
    });

    test('handles #capability-statement id variant', () => {
        const container = document.createElement('div');
        container.id = 'capability-statement';
        container.setAttribute('data-url', 'https://example.com/api');
        container.textContent = '{}';
        div.appendChild(container);

        utils.isJson.mockReturnValue(true);

        const result = apiDoc.extractCapabilityStatement(div);
    
        expect(result.data).toBe('{}');
    });

    test('returns null data when content is not valid JSON', () => {
        const container = document.createElement('div');
        container.id = 'CapabilityStatement';
        container.setAttribute('data-url', 'https://example.com/api');
        container.textContent = 'not json';
        div.appendChild(container);

        utils.isJson.mockReturnValue(false);

        const result = apiDoc.extractCapabilityStatement(div);
    
        expect(result.data).toBeNull();
        expect(result.url).toBe('https://example.com/api');
    });

    test('handles missing data-url attribute', () => {
        const container = document.createElement('div');
        container.id = 'CapabilityStatement';
        container.textContent = '{"test": true}';
        div.appendChild(container);

        utils.isJson.mockReturnValue(true);

        const result = apiDoc.extractCapabilityStatement(div);
    
        expect(result.data).toBe('{"test": true}');
        expect(result.url).toBeNull();
    });

    test('handles empty textContent', () => {
        const container = document.createElement('div');
        container.id = 'CapabilityStatement';
        container.setAttribute('data-url', 'https://example.com/api');
        container.textContent = '';
        div.appendChild(container);

        utils.isJson.mockReturnValue(false);

        const result = apiDoc.extractCapabilityStatement(div);
    
        expect(result.data).toBeNull();
        expect(result.url).toBe('https://example.com/api');
    });
});

describe('extractOperationDefinition', () => {
    let div;

    beforeEach(() => {
        div = document.createElement('div');
        jest.spyOn(utils, 'isJson');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('returns null data and url when container is not found', () => {
        const result = apiDoc.extractOperationDefinition(div);
    
        expect(result).toEqual({ data: null, url: null });
    });

    test('extracts data and url from #OperationDefinition', () => {
        const container = document.createElement('div');
        container.id = 'OperationDefinition';
        container.setAttribute('data-url', 'https://example.com/api');
        container.textContent = '{"resourceType": "OperationDefinition"}';
        div.appendChild(container);

        utils.isJson.mockReturnValue(true);

        const result = apiDoc.extractOperationDefinition(div);
    
        expect(result.data).toBe('{"resourceType": "OperationDefinition"}');
        expect(result.url).toBe('https://example.com/api');
    });

    test('handles #Operation-Definition id variant', () => {
        const container = document.createElement('div');
        container.id = 'Operation-Definition';
        container.setAttribute('data-url', 'https://example.com/api');
        container.textContent = '{"test": true}';
        div.appendChild(container);

        utils.isJson.mockReturnValue(true);

        const result = apiDoc.extractOperationDefinition(div);
    
        expect(result.data).toBe('{"test": true}');
        expect(result.url).toBe('https://example.com/api');
    });

    test('handles #operation-definition id variant', () => {
        const container = document.createElement('div');
        container.id = 'operation-definition';
        container.setAttribute('data-url', 'https://example.com/api');
        container.textContent = '{}';
        div.appendChild(container);

        utils.isJson.mockReturnValue(true);

        const result = apiDoc.extractOperationDefinition(div);
    
        expect(result.data).toBe('{}');
    });

    test('returns null data when content is not valid JSON', () => {
        const container = document.createElement('div');
        container.id = 'OperationDefinition';
        container.setAttribute('data-url', 'https://example.com/api');
        container.textContent = 'not json';
        div.appendChild(container);

        utils.isJson.mockReturnValue(false);

        const result = apiDoc.extractOperationDefinition(div);
    
        expect(result.data).toBeNull();
        expect(result.url).toBe('https://example.com/api');
    });

    test('handles missing data-url attribute', () => {
        const container = document.createElement('div');
        container.id = 'OperationDefinition';
        container.textContent = '{"test": true}';
        div.appendChild(container);

        utils.isJson.mockReturnValue(true);

        const result = apiDoc.extractOperationDefinition(div);
    
        expect(result.data).toBe('{"test": true}');
        expect(result.url).toBeNull();
    });

    test('handles empty textContent', () => {
        const container = document.createElement('div');
        container.id = 'OperationDefinition';
        container.setAttribute('data-url', 'https://example.com/api');
        container.textContent = '';
        div.appendChild(container);

        utils.isJson.mockReturnValue(false);

        const result = apiDoc.extractOperationDefinition(div);
    
        expect(result.data).toBeNull();
        expect(result.url).toBe('https://example.com/api');
    });
});

describe('extractApiContent', () => {
    test('should extract all content when all sections are present', () => {
        const div = document.createElement('div');
        div.innerHTML = `
            <div id="description">Test description <b>with HTML</b></div>
            <div id="CapabilityStatement" data-url="https://example.com/cap.json">{"resourceType": "CapabilityStatement"}</div>
            <div id="OperationDefinition" data-url="https://example.com/op.json">{"resourceType": "OperationDefinition"}</div>
            <div id="formats">
                <div data-value="application/json"></div>
                <div data-value="application/xml"></div>
            </div>
            <div id="response-examples">
                <div data-name="Example 1" data-type="json" data-url="https://example.com/response.json"></div>
            </div>
            <div id="request-examples">
                <div data-name="Request 1" data-type="xml">Some XML</div>
            </div>
            <div id="header-parameters">
                <div data-name="Authorization" data-type="string">Auth header</div>
            </div>
            <div id="search-parameters">
                <div data-name="status" data-type="token">Status param</div>
            </div>
            <div id="responses">
                <div data-code="200" data-error-code="" data-response-type="Success">OK response</div>
            </div>
        `;

        const result = apiDoc.extractApiContent(div);

        expect(result.description).toBe('Test description <b>with HTML</b>');
        expect(result.capabilityStatement.url).toBe('https://example.com/cap.json');
        expect(result.capabilityStatement.data).toBe('{"resourceType": "CapabilityStatement"}');
        expect(result.operationDefinition.url).toBe('https://example.com/op.json');
        expect(result.operationDefinition.data).toBe('{"resourceType": "OperationDefinition"}');
        expect(result.formats).toEqual(['application/json', 'application/xml']);
        expect(result.responseExamples).toHaveLength(1);
        expect(result.requestExamples).toHaveLength(1);
        expect(result.headerParams).toHaveLength(1);
        expect(result.searchParams).toHaveLength(1);
        expect(result.responseInfos).toHaveLength(1);
    });

    test('should return empty string for missing description', () => {
        const div = document.createElement('div');
        const result = apiDoc.extractApiContent(div);
        expect(result.description).toBe('');
    });

    test('should handle description with various ID casings', () => {
        const testCases = ['description', 'Description'];
        
        testCases.forEach(id => {
            const div = document.createElement('div');
            div.innerHTML = `<div id="${id}">Test content</div>`;
            const result = apiDoc.extractApiContent(div);
            expect(result.description).toBe('Test content');
        });
    });

    test('should handle CapabilityStatement with various ID casings', () => {
        const testCases = ['CapabilityStatement', 'Capability-Statement', 'capability-statement'];
        
        testCases.forEach(id => {
            const div = document.createElement('div');
            div.innerHTML = `<div id="${id}" data-url="test.json">{"test": true}</div>`;
            const result = apiDoc.extractApiContent(div);
            expect(result.capabilityStatement.data).toBe('{"test": true}');
            expect(result.capabilityStatement.url).toBe('test.json');
        });
    });

    test('should handle OperationDefinition with various ID casings', () => {
        const testCases = ['OperationDefinition', 'Operation-Definition', 'operation-definition'];
        
        testCases.forEach(id => {
            const div = document.createElement('div');
            div.innerHTML = `<div id="${id}" data-url="op.json">{"operation": true}</div>`;
            const result = apiDoc.extractApiContent(div);
            expect(result.operationDefinition.data).toBe('{"operation": true}');
            expect(result.operationDefinition.url).toBe('op.json');
        });
    });

    test('should handle formats with various ID casings', () => {
        const testCases = ['formats', 'Formats'];
        
        testCases.forEach(id => {
            const div = document.createElement('div');
            div.innerHTML = `
                <div id="${id}">
                    <div data-value="json"></div>
                    <div data-value="xml"></div>
                </div>
            `;
            const result = apiDoc.extractApiContent(div);
            expect(result.formats).toEqual(['json', 'xml']);
        });
    });

    test('should handle response-examples with various ID casings', () => {
        const testCases = ['response-examples', 'Response-Examples', 'ResponseExamples'];
        
        testCases.forEach(id => {
            const div = document.createElement('div');
            div.innerHTML = `
                <div id="${id}">
                    <div data-name="Ex1" data-type="json">data</div>
                </div>
            `;
            const result = apiDoc.extractApiContent(div);
            expect(result.responseExamples).toHaveLength(1);
        });
    });

    test('should handle request-examples with various ID casings', () => {
        const testCases = ['request-examples', 'Request-Examples', 'RequestExamples'];
        
        testCases.forEach(id => {
            const div = document.createElement('div');
            div.innerHTML = `
                <div id="${id}">
                    <div data-name="Ex1" data-type="json">data</div>
                </div>
            `;
            const result = apiDoc.extractApiContent(div);
            expect(result.requestExamples).toHaveLength(1);
        });
    });

    test('should handle header-parameters with various ID casings', () => {
        const testCases = ['header-parameters', 'Header-Parameters', 'HeaderParameters'];
        
        testCases.forEach(id => {
            const div = document.createElement('div');
            div.innerHTML = `
                <div id="${id}">
                    <div data-name="Auth" data-type="string">desc</div>
                </div>
            `;
            const result = apiDoc.extractApiContent(div);
            expect(result.headerParams).toHaveLength(1);
        });
    });

    test('should handle search-parameters with various ID casings', () => {
        const testCases = ['search-parameters', 'Search-Parameters', 'SearchParameters'];
        
        testCases.forEach(id => {
            const div = document.createElement('div');
            div.innerHTML = `
                <div id="${id}">
                    <div data-name="status" data-type="token">desc</div>
                </div>
            `;
            const result = apiDoc.extractApiContent(div);
            expect(result.searchParams).toHaveLength(1);
        });
    });

    test('should handle responses with various ID casings', () => {
        const testCases = ['responses', 'Responses'];
        
        testCases.forEach(id => {
            const div = document.createElement('div');
            div.innerHTML = `
                <div id="${id}">
                    <div data-code="200">OK</div>
                </div>
            `;
            const result = apiDoc.extractApiContent(div);
            expect(result.responseInfos).toHaveLength(1);
        });
    });

    test('should return null for missing formats', () => {
        const div = document.createElement('div');
        const result = apiDoc.extractApiContent(div);
        expect(result.formats).toBeNull();
    });

    test('should return null for missing examples', () => {
        const div = document.createElement('div');
        const result = apiDoc.extractApiContent(div);
        expect(result.responseExamples).toBeNull();
        expect(result.requestExamples).toBeNull();
    });

    test('should return empty array for missing parameters', () => {
        const div = document.createElement('div');
        const result = apiDoc.extractApiContent(div);
        expect(result.headerParams).toEqual([]);
        expect(result.searchParams).toEqual([]);
    });

    test('should return empty array for missing responses', () => {
        const div = document.createElement('div');
        const result = apiDoc.extractApiContent(div);
        expect(result.responseInfos).toEqual([]);
    });

    test('should handle CapabilityStatement with non-JSON content', () => {
        const div = document.createElement('div');
        div.innerHTML = `<div id="CapabilityStatement">Not JSON content</div>`;
        const result = apiDoc.extractApiContent(div);
        expect(result.capabilityStatement.data).toBeNull();
        expect(result.capabilityStatement.url).toBeNull();
    });

    test('should handle OperationDefinition with non-JSON content', () => {
        const div = document.createElement('div');
        div.innerHTML = `<div id="OperationDefinition">Not JSON content</div>`;
        const result = apiDoc.extractApiContent(div);
        expect(result.operationDefinition.data).toBeNull();
        expect(result.operationDefinition.url).toBeNull();
    });

    test('should handle CapabilityStatement with only URL', () => {
        const div = document.createElement('div');
        div.innerHTML = `<div id="CapabilityStatement" data-url="https://example.com/cap.json"></div>`;
        const result = apiDoc.extractApiContent(div);
        expect(result.capabilityStatement.data).toBeNull();
        expect(result.capabilityStatement.url).toBe('https://example.com/cap.json');
    });

    test('should handle OperationDefinition with only URL', () => {
        const div = document.createElement('div');
        div.innerHTML = `<div id="OperationDefinition" data-url="https://example.com/op.json"></div>`;
        const result = apiDoc.extractApiContent(div);
        expect(result.operationDefinition.data).toBeNull();
        expect(result.operationDefinition.url).toBe('https://example.com/op.json');
    });

    test('should trim whitespace from description', () => {
        const div = document.createElement('div');
        div.innerHTML = `<div id="description">  
            Test description with whitespace  
        </div>`;
        const result = apiDoc.extractApiContent(div);
        expect(result.description).toBe('Test description with whitespace');
    });

    test('should handle empty description div', () => {
        const div = document.createElement('div');
        div.innerHTML = `<div id="description"></div>`;
        const result = apiDoc.extractApiContent(div);
        expect(result.description).toBe('');
    });

    test('should handle description with only whitespace', () => {
        const div = document.createElement('div');
        div.innerHTML = `<div id="description">   </div>`;
        const result = apiDoc.extractApiContent(div);
        expect(result.description).toBe('');
    });

    test('should handle empty formats container', () => {
        const div = document.createElement('div');
        div.innerHTML = `<div id="formats"></div>`;
        const result = apiDoc.extractApiContent(div);
        expect(result.formats).toEqual([]);
    });

    test('should handle empty examples containers', () => {
        const div = document.createElement('div');
        div.innerHTML = `
            <div id="response-examples"></div>
            <div id="request-examples"></div>
        `;
        const result = apiDoc.extractApiContent(div);
        expect(result.responseExamples).toEqual([]);
        expect(result.requestExamples).toEqual([]);
    });

    test('should handle empty parameters containers', () => {
        const div = document.createElement('div');
        div.innerHTML = `
            <div id="header-parameters"></div>
            <div id="search-parameters"></div>
        `;
        const result = apiDoc.extractApiContent(div);
        expect(result.headerParams).toEqual([]);
        expect(result.searchParams).toEqual([]);
    });

    test('should handle empty responses container', () => {
        const div = document.createElement('div');
        div.innerHTML = `<div id="responses"></div>`;
        const result = apiDoc.extractApiContent(div);
        expect(result.responseInfos).toEqual([]);
    });

    test('should handle malformed JSON in CapabilityStatement', () => {
        const div = document.createElement('div');
        div.innerHTML = `<div id="CapabilityStatement">{invalid json}</div>`;
        const result = apiDoc.extractApiContent(div);
        expect(result.capabilityStatement.data).toBeNull();
    });

    test('should preserve HTML entities in description', () => {
        const div = document.createElement('div');
        div.innerHTML = `<div id="description">&lt;b&gt;Bold&lt;/b&gt; &amp; special</div>`;
        const result = apiDoc.extractApiContent(div);
        expect(result.description).toContain('&lt;');
        expect(result.description).toContain('&amp;');
    });

    test('should handle nested HTML in description', () => {
        const div = document.createElement('div');
        div.innerHTML = `
            <div id="description">
                <p>Paragraph 1</p>
                <ul>
                    <li>Item 1</li>
                    <li>Item 2</li>
                </ul>
            </div>
        `;
        const result = apiDoc.extractApiContent(div);
        expect(result.description).toContain('<p>');
        expect(result.description).toContain('<ul>');
        expect(result.description).toContain('<li>');
    });

    test('should return default structure when div is empty', () => {
        const div = document.createElement('div');
        const result = apiDoc.extractApiContent(div);
        
        expect(result).toEqual({
            description: '',
            capabilityStatement: { data: null, url: null },
            operationDefinition: { data: null, url: null },
            formats: null,
            responseExamples: null,
            requestExamples: null,
            headerParams: [],
            searchParams: [],
            responseInfos: []
        });
    });
});

describe('parseBaseUrl', () => {
    test('should parse a valid HTTPS URL with path', () => {
        const result = apiDoc.parseBaseUrl('https://example.com/fhir/r4');
        expect(result).toEqual(['https://example.com', 'fhir/r4/']);
    });

    test('should parse a valid HTTP URL with path', () => {
        const result = apiDoc.parseBaseUrl('http://example.com/api');
        expect(result).toEqual(['http://example.com', 'api/']);
    });

    test('should parse URL with trailing slash', () => {
        const result = apiDoc.parseBaseUrl('https://example.com/fhir/');
        expect(result).toEqual(['https://example.com', 'fhir/']);
    });

    test('should parse URL without path', () => {
        const result = apiDoc.parseBaseUrl('https://example.com');
        expect(result).toEqual(['https://example.com', '/']);
    });

    test('should parse URL with only root path', () => {
        const result = apiDoc.parseBaseUrl('https://example.com/');
        expect(result).toEqual(['https://example.com', '/']);
    });

    test('should parse URL with port number', () => {
        const result = apiDoc.parseBaseUrl('https://example.com:8080/fhir');
        expect(result).toEqual(['https://example.com:8080', 'fhir/']);
    });

    test('should parse URL with deep path', () => {
        const result = apiDoc.parseBaseUrl('https://example.com/api/v1/fhir/r4');
        expect(result).toEqual(['https://example.com', 'api/v1/fhir/r4/']);
    });

    test('should parse URL with query parameters', () => {
        const result = apiDoc.parseBaseUrl('https://example.com/fhir?version=r4');
        expect(result).toEqual(['https://example.com', 'fhir/']);
    });

    test('should parse URL with hash fragment', () => {
        const result = apiDoc.parseBaseUrl('https://example.com/fhir#section');
        expect(result).toEqual(['https://example.com', 'fhir/']);
    });

    test('should handle localhost', () => {
        const result = apiDoc.parseBaseUrl('http://localhost:3000/api');
        expect(result).toEqual(['http://localhost:3000', 'api/']);
    });

    test('should handle IP address', () => {
        const result = apiDoc.parseBaseUrl('http://192.168.1.1:8080/fhir');
        expect(result).toEqual(['http://192.168.1.1:8080', 'fhir/']);
    });

    test('should handle null input', () => {
        const result = apiDoc.parseBaseUrl(null);
        expect(result).toEqual([null, '']);
    });

    test('should handle undefined input', () => {
        const result = apiDoc.parseBaseUrl(undefined);
        expect(result).toEqual([null, '']);
    });

    test('should handle empty string', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
        const result = apiDoc.parseBaseUrl('');
        expect(result).toEqual([null, '']);
        expect(warnSpy).toHaveBeenCalledWith('Wrong URL:', '');
        warnSpy.mockRestore();
    });

    test('should handle URL with special characters in path', () => {
        const result = apiDoc.parseBaseUrl('https://example.com/fhir/r4%20test');
        expect(result).toEqual(['https://example.com', 'fhir/r4%20test/']);
    });

    test('should handle URL with subdomain', () => {
        const result = apiDoc.parseBaseUrl('https://api.sub.example.com/fhir');
        expect(result).toEqual(['https://api.sub.example.com', 'fhir/']);
    });

    test('should parse URL with multiple consecutive slashes in path', () => {
        const result = apiDoc.parseBaseUrl('https://example.com/fhir//r4');
        expect(result).toEqual(['https://example.com', 'fhir//r4/']);
    });

    test('should handle file protocol', () => {
        const result = apiDoc.parseBaseUrl('file:///path/to/file');
        expect(result).toEqual(['file://', 'path/to/file/']);
    });
});

describe('removeLeadingTabs', () => {
    test('removes leading tabs from single line', () => {
        expect(apiDoc.removeLeadingTabs('\t\tHello')).toBe('Hello');
    });

    test('removes leading spaces from single line', () => {
        expect(apiDoc.removeLeadingTabs('    Hello')).toBe('Hello');
    });

    test('removes leading tabs and spaces from single line', () => {
        expect(apiDoc.removeLeadingTabs('\t  Hello')).toBe('Hello');
    });

    test('removes leading whitespace from multiple lines', () => {
        const input = '\t\tLine 1\n    Line 2\n\t Line 3';
        const expected = 'Line 1\nLine 2\nLine 3';
        expect(apiDoc.removeLeadingTabs(input)).toBe(expected);
    });

    test('preserves text without leading whitespace', () => {
        expect(apiDoc.removeLeadingTabs('Hello')).toBe('Hello');
    });

    test('preserves trailing whitespace', () => {
        expect(apiDoc.removeLeadingTabs('Hello\t\t')).toBe('Hello\t\t');
    });

    test('preserves mid-line whitespace', () => {
        expect(apiDoc.removeLeadingTabs('Hello\t\tWorld')).toBe('Hello\t\tWorld');
    });

    test('handles empty string', () => {
        expect(apiDoc.removeLeadingTabs('')).toBe('');
    });

    test('handles string with only whitespace', () => {
        expect(apiDoc.removeLeadingTabs('\t\t  ')).toBe('');
    });

    test('handles lines with varying indentation', () => {
        const input = '\tLine 1\n\t\t\tLine 2\n  Line 3';
        const expected = 'Line 1\nLine 2\nLine 3';
        expect(apiDoc.removeLeadingTabs(input)).toBe(expected);
    });

    test('preserves empty lines', () => {
        const input = '\tLine 1\n\n\tLine 2';
        const expected = 'Line 1\n\nLine 2';
        expect(apiDoc.removeLeadingTabs(input)).toBe(expected);
    });

    test('handles lines with only indentation', () => {
        const input = '\tLine 1\n\t\t\n\tLine 2';
        const expected = 'Line 1\n\nLine 2';
        expect(apiDoc.removeLeadingTabs(input)).toBe(expected);
    });
});

describe('createCopyButton', () => {
    let mockClipboard;

    beforeEach(() => {
        mockClipboard = {
            writeText: jest.fn()
        };
        Object.assign(navigator, {
            clipboard: mockClipboard
        });
        
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('should create a wrapper div with correct classes', () => {
        const result = apiDoc.createCopyButton('test data');
        
        expect(result.tagName).toBe('DIV');
        expect(result.classList.contains('gem-ig-copy-container')).toBe(true);
    });

    it('should create language label when language is provided', () => {
        const result = apiDoc.createCopyButton('test data', 'json');
        const langElement = result.querySelector('.gem-id-code-lang');
        
        expect(langElement).not.toBeNull();
        expect(langElement.innerText).toBe('json');
    });

    it('should create empty language label when language is not provided', () => {
        const result = apiDoc.createCopyButton('test data');
        const langElement = result.querySelector('.gem-id-code-lang');
        
        expect(langElement).not.toBeNull();
        expect(langElement.innerText).toBe("");
    });

    it('should copy data to clipboard when button is clicked', async () => {
        const testData = 'test content to copy';
        mockClipboard.writeText.mockResolvedValue();
        
        const result = apiDoc.createCopyButton(testData);
        const button = result.querySelector('button');
        
        button.click();
        
        expect(mockClipboard.writeText).toHaveBeenCalledWith(testData);
    });

    it('should change button text on successful copy', async () => {
        mockClipboard.writeText.mockResolvedValue();
        
        const result = apiDoc.createCopyButton('test data');
        const button = result.querySelector('button');
        const originalText = button.textContent;
        
        button.click();
        
        await Promise.resolve(); // Wait for promise to resolve
        
        expect(button.innerText).not.toBe(originalText);
    });

    it('should restore button text after timeout', async () => {
        mockClipboard.writeText.mockResolvedValue();
        
        const result = apiDoc.createCopyButton('test data');
        const button = result.querySelector('button');
        const originalText = button.textContent;
        
        button.click();
        await Promise.resolve();
        
        jest.advanceTimersByTime(2000);
        
        expect(button.innerText).toBe(originalText);
    });

    it('should handle clipboard write failure gracefully', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        mockClipboard.writeText.mockRejectedValue(new Error('Clipboard error'));

        const result = apiDoc.createCopyButton('test data');
        const button = result.querySelector('button');

        button.click();

        await jest.runAllTimersAsync();

        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });

    it('should handle empty string data', () => {
        const result = apiDoc.createCopyButton('');
        const button = result.querySelector('button');
        
        expect(button).not.toBeNull();
        
        mockClipboard.writeText.mockResolvedValue();
        button.click();
        
        expect(mockClipboard.writeText).toHaveBeenCalledWith('');
    });

    it('should handle null or undefined data', () => {
        mockClipboard.writeText.mockResolvedValue();
        
        const resultNull = apiDoc.createCopyButton(null);
        const buttonNull = resultNull.querySelector('button');
        buttonNull.click();
        expect(mockClipboard.writeText).toHaveBeenCalledWith(null);
        
        const resultUndefined = apiDoc.createCopyButton(undefined);
        const buttonUndefined = resultUndefined.querySelector('button');
        buttonUndefined.click();
        expect(mockClipboard.writeText).toHaveBeenCalledWith(undefined);
    });

    it('should normalize language to lowercase', () => {
        const testCases = ['XML', 'Json', 'YAML', 'PlainText'];
        
        testCases.forEach(lang => {
            const result = apiDoc.createCopyButton('data', lang);
            const langElement = result.querySelector('.gem-id-code-lang');
            expect(langElement.innerText).toBe(lang.toLowerCase());
        });
    });
});

describe('renderApiExample', () => {
    let parent, buttonParent, exampleList, buttonList;

    beforeEach(() => {
        parent = document.createElement('div');
        buttonParent = document.createElement('div');
        exampleList = [];
        buttonList = [];
        
        // Mock navigator.clipboard
        Object.assign(navigator, {
            clipboard: {
                writeText: jest.fn(() => Promise.resolve())
            }
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should render a JSON example', () => {
        const example = {
            name: 'Example JSON',
            type: 'json',
            render: 'json'
        };
        const data = '{"key": "value"}';

        apiDoc.renderApiExample(parent, buttonParent, example, data, exampleList, buttonList);

        expect(exampleList).toHaveLength(1);
        expect(buttonList).toHaveLength(1);
        expect(parent.children).toHaveLength(1);
        expect(buttonParent.children).toHaveLength(1);
        
        const preElement = parent.querySelector('pre');
        expect(preElement).toBeTruthy();
        expect(preElement.style.display).toBe('none');
        
        const codeElement = preElement.querySelector('code');
        expect(codeElement).toBeTruthy();
    });

    it('should render an XML example', () => {
        const example = {
            name: 'Example XML',
            type: 'xml',
            render: 'xml'
        };
        const data = '<root><child>value</child></root>';

        apiDoc.renderApiExample(parent, buttonParent, example, data, exampleList, buttonList);

        expect(exampleList).toHaveLength(1);
        expect(buttonList).toHaveLength(1);
        
        const preElement = parent.querySelector('pre');
        expect(preElement).toBeTruthy();
        const codeElement = preElement.querySelector('code');
        expect(codeElement).toBeTruthy();
    });

    it('should render HTML example without syntax highlighting', () => {
        const example = {
            name: 'HTML Example',
            type: 'html',
            render: 'HTML'
        };
        const data = '<div>Hello World</div>';

        apiDoc.renderApiExample(parent, buttonParent, example, data, exampleList, buttonList);

        const htmlExample = parent.querySelector('.html-example');
        expect(htmlExample).toBeTruthy();
        expect(htmlExample.innerHTML).toBe(data);
    });

    it('should render IG-FRAGMENT by extracting innerText', () => {
        const example = {
            name: 'Fragment Example',
            type: 'json',
            render: 'IG-FRAGMENT'
        };
        const data = '<div>{ key: "Some value" }</div>';

        apiDoc.renderApiExample(parent, buttonParent, example, data, exampleList, buttonList);

        expect(exampleList).toHaveLength(1);
        const preElement = parent.querySelector('pre');
        expect(preElement).toBeTruthy();
        const codeElement = preElement.querySelector('code');
        expect(codeElement.textContent).toBe('{ key: "Some value" }')
    });

    it('should use type as render type when render attribute is missing', () => {
        const example = {
            name: 'No Render Attribute',
            type: 'json'
        };
        const data = '{"test": true}';

        apiDoc.renderApiExample(parent, buttonParent, example, data, exampleList, buttonList);

        expect(exampleList).toHaveLength(1);
        expect(buttonList).toHaveLength(1);
        const preElement = parent.querySelector('pre');
        expect(preElement).toBeTruthy();
        expect(preElement.querySelector('code')).toBeTruthy();
    });

    it('should create a button with correct labels', () => {
        const example = {
            name: 'Button Test',
            type: 'JSON',
            render: 'json'
        };
        const data = '{}';

        apiDoc.renderApiExample(parent, buttonParent, example, data, exampleList, buttonList);

        const button = buttonParent.querySelector('button.example');
        expect(button).toBeTruthy();
        expect(button.querySelector('.label').textContent).toBe('JSON');
        expect(button.textContent).toContain('Button Test');
    });

    it('should toggle example visibility when button is clicked', () => {
        const example = {
            name: 'Toggle Test',
            type: 'json'
        };
        const data = '{}';

        apiDoc.renderApiExample(parent, buttonParent, example, data, exampleList, buttonList);

        const button = buttonParent.querySelector('button');
        const preElement = parent.querySelector('pre');

        expect(preElement.style.display).toBe('none');

        button.click();
        expect(preElement.style.display).toBe('block');
        expect(button.classList.contains('active-button')).toBe(true);

        button.click();
        expect(preElement.style.display).toBe('none');
        expect(button.classList.contains('active-button')).toBe(false);
    });

    it('should hide other examples when one is shown', () => {
        const example1 = { name: 'Example 1', type: 'json' };
        const example2 = { name: 'Example 2', type: 'xml' };
        const data = '{}';

        apiDoc.renderApiExample(parent, buttonParent, example1, data, exampleList, buttonList);
        apiDoc.renderApiExample(parent, buttonParent, example2, data, exampleList, buttonList);

        const buttons = buttonParent.querySelectorAll('button');
        const examples = parent.querySelectorAll('pre');

        buttons[0].click();
        expect(examples[0].style.display).toBe('block');
        expect(examples[1].style.display).toBe('none');
        expect(buttons[0].classList.contains('active-button')).toBe(true);
        expect(buttons[1].classList.contains('active-button')).toBe(false);

        buttons[1].click();
        expect(examples[0].style.display).toBe('none');
        expect(examples[1].style.display).toBe('block');
        expect(buttons[0].classList.contains('active-button')).toBe(false);
        expect(buttons[1].classList.contains('active-button')).toBe(true);
    });

    it('should include a copy button with correct functionality', async () => {
        const example = {
            name: 'Copy Test',
            type: 'json'
        };
        const data = '{"copy": "me"}';

        apiDoc.renderApiExample(parent, buttonParent, example, data, exampleList, buttonList);

        const copyButton = parent.querySelector('.gem-ig-copy-button-wrapper button');
        expect(copyButton).toBeTruthy();

        await copyButton.click();
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(data);
    });

    it('should handle case-insensitive render types', () => {
        const examples = [
            { name: 'Lower', type: 'json', render: 'html' },
            { name: 'Upper', type: 'json', render: 'HTML' },
            { name: 'Mixed', type: 'json', render: 'HtMl' }
        ];
        const data = '<div>Test</div>';

        examples.forEach(example => {
            const localParent = document.createElement('div');
            const localButtonParent = document.createElement('div');
            const localList = [];
            const localButtonList = [];

            apiDoc.renderApiExample(localParent, localButtonParent, example, data, localList, localButtonList);

            const htmlExample = localParent.querySelector('.html-example');
            expect(htmlExample).toBeTruthy();
        });
    });

    it('should handle empty data string', () => {
        const example = {
            name: 'Empty',
            type: 'json'
        };
        const data = '';

        apiDoc.renderApiExample(parent, buttonParent, example, data, exampleList, buttonList);

        expect(exampleList).toHaveLength(1);
        expect(buttonList).toHaveLength(1);
        
        const preElement = parent.querySelector('pre');
        expect(preElement).toBeTruthy();
    });

    it('should handle special characters in data', () => {
        const example = {
            name: 'Special Chars',
            type: 'json'
        };
        const data = '{"special": "<>&\\"\'"}';

        apiDoc.renderApiExample(parent, buttonParent, example, data, exampleList, buttonList);

        expect(exampleList).toHaveLength(1);
        const codeElement = parent.querySelector('code');
        expect(codeElement).toBeTruthy();
    });

    it('should convert type to uppercase in button label', () => {
        const example = {
            name: 'Lowercase Type',
            type: 'json'
        };
        const data = '{}';

        apiDoc.renderApiExample(parent, buttonParent, example, data, exampleList, buttonList);

        const label = buttonParent.querySelector('.label');
        expect(label.textContent).toBe('JSON');
    });

    it('should handle IG-FRAGMENT with complex HTML structure', () => {
        const example = {
            name: 'Complex Fragment',
            type: 'json',
            render: 'ig-fragment'
        };
        const data = '<div><span>Nested</span><p>Content</p></div>';

        apiDoc.renderApiExample(parent, buttonParent, example, data, exampleList, buttonList);

        expect(exampleList).toHaveLength(1);
        const preElement = parent.querySelector('pre');
        expect(preElement).toBeTruthy();
    });

    it('should handle missing type property gracefully', () => {
        const example = {
            name: 'No Type'
        };
        const data = '{}';

        expect(() => {
            apiDoc.renderApiExample(parent, buttonParent, example, data, exampleList, buttonList);
        }).not.toThrow();
        
        expect(exampleList).toHaveLength(1);
    });

    it('should handle null render property', () => {
        const example = {
            name: 'Null Render',
            type: 'json',
            render: null
        };
        const data = '{}';

        apiDoc.renderApiExample(parent, buttonParent, example, data, exampleList, buttonList);

        expect(exampleList).toHaveLength(1);
    });

    it('should handle undefined render property', () => {
        const example = {
            name: 'Undefined Render',
            type: 'json',
            render: undefined
        };
        const data = '{}';

        apiDoc.renderApiExample(parent, buttonParent, example, data, exampleList, buttonList);

        expect(exampleList).toHaveLength(1);
    });

    it('should add language label to copy container', () => {
        const example = {
            name: 'Language Label',
            type: 'JSON'
        };
        const data = '{}';

        apiDoc.renderApiExample(parent, buttonParent, example, data, exampleList, buttonList);

        const languageLabel = parent.querySelector('.gem-id-code-lang');
        expect(languageLabel).toBeTruthy();
        expect(languageLabel.innerText).toBe('json');
    });

    it('should store example and button in provided arrays', () => {
        const example = {
            name: 'Array Test',
            type: 'json'
        };
        const data = '{}';

        apiDoc.renderApiExample(parent, buttonParent, example, data, exampleList, buttonList);

        expect(exampleList).toHaveLength(1);
        expect(buttonList).toHaveLength(1);
        expect(exampleList[0]).toBeTruthy();
        expect(buttonList[0]).toBeTruthy();
    });

    it('should handle whitespace-only data', () => {
        const example = {
            name: 'Whitespace',
            type: 'json'
        };
        const data = '   \n\t  ';

        apiDoc.renderApiExample(parent, buttonParent, example, data, exampleList, buttonList);

        expect(exampleList).toHaveLength(1);
        const preElement = parent.querySelector('pre');
        expect(preElement).toBeTruthy();
    });

    it('should handle multiple examples added sequentially', () => {
        const examples = [
            { name: 'First', type: 'json' },
            { name: 'Second', type: 'xml' },
            { name: 'Third', type: 'json' }
        ];
        const data = '{}';

        examples.forEach(example => {
            apiDoc.renderApiExample(parent, buttonParent, example, data, exampleList, buttonList);
        });

        expect(exampleList).toHaveLength(3);
        expect(buttonList).toHaveLength(3);
        expect(parent.children).toHaveLength(3);
        expect(buttonParent.children).toHaveLength(3);
    });
});

describe('apiDoc.appendInfoBox', () => {
    let parent;

    beforeEach(() => {
        parent = document.createElement('div');
    });

    it('should append nothing when all parameters are null or empty', () => {
        apiDoc.appendInfoBox(parent, null, [], null);
        expect(parent.children.length).toBe(0);
    });

    it('should append operationId when provided', () => {
        apiDoc.appendInfoBox(parent, 'test-operation-id', [], null);
    
        expect(parent.children.length).toBe(1);
        const operationDiv = parent.children[0];
        expect(operationDiv.classList.contains('operation-block-description')).toBe(true);
        expect(operationDiv.innerHTML).toContain('<b>test-operation-id</b>');
    });

    it('should append formats when provided as array', () => {
        apiDoc.appendInfoBox(parent, null, ['application/json', 'application/xml'], null);
    
        expect(parent.children.length).toBe(1);
        const formatsDiv = parent.children[0];
        expect(formatsDiv.classList.contains('operation-block-description')).toBe(true);
        expect(formatsDiv.innerHTML).toContain('<b>application/json</b>');
        expect(formatsDiv.innerHTML).toContain('<b>application/xml</b>');
    });

    it('should append description when provided', () => {
        const description = 'This is a test description';
        apiDoc.appendInfoBox(parent, null, [], description);
    
        expect(parent.children.length).toBe(1);
        const descDiv = parent.children[0];
        expect(descDiv.classList.contains('operation-block-description')).toBe(true);
        expect(descDiv.innerHTML).toBe(description);
    });

    it('should add low-padding class to formats when operationId is also present', () => {
        apiDoc.appendInfoBox(parent, 'test-op', ['application/json'], null);
    
        expect(parent.children.length).toBe(2);
        const formatsDiv = parent.children[1];
        expect(formatsDiv.classList.contains('low-padding')).toBe(true);
    });

    it('should not add low-padding class to formats when operationId is not present', () => {
        apiDoc.appendInfoBox(parent, null, ['application/json'], null);
    
        expect(parent.children.length).toBe(1);
        const formatsDiv = parent.children[0];
        expect(formatsDiv.classList.contains('low-padding')).toBe(false);
    });

    it('should append all three elements when all parameters are provided', () => {
        apiDoc.appendInfoBox(parent, 'my-operation', ['application/fhir+json'], 'Description text');
    
        expect(parent.children.length).toBe(3);
    
        const opDiv = parent.children[0];
        expect(opDiv.innerHTML).toContain('my-operation');
    
        const formatsDiv = parent.children[1];
        expect(formatsDiv.innerHTML).toContain('application/fhir+json');
        expect(formatsDiv.classList.contains('low-padding')).toBe(true);
    
        const descDiv = parent.children[2];
        expect(descDiv.innerHTML).toContain('Description text');
    });

    it('should handle empty string operationId', () => {
        apiDoc.appendInfoBox(parent, '', [], null);
        expect(parent.children.length).toBe(0);
    });

    it('should handle empty array for formats', () => {
        apiDoc.appendInfoBox(parent, null, [], null);
        expect(parent.children.length).toBe(0);
    });

    it('should handle undefined formats', () => {
        apiDoc.appendInfoBox(parent, null, undefined, null);
        expect(parent.children.length).toBe(0);
    });

    it('should handle null formats', () => {
        apiDoc.appendInfoBox(parent, null, null, null);
        expect(parent.children.length).toBe(0);
    });

    it('should handle empty string description', () => {
        apiDoc.appendInfoBox(parent, null, [], '');
        expect(parent.children.length).toBe(0);
    });

    it('should remove leading tabs from description', () => {
        const description = '\t\tIndented text\n\t\tMore indented';
        apiDoc.appendInfoBox(parent, null, [], description);
    
        expect(parent.children.length).toBe(1);
        const descDiv = parent.children[0];
        expect(descDiv.innerHTML).toBe('Indented text\nMore indented');
    });

    it('should handle description with HTML markup', () => {
        const description = '<strong>Bold text</strong> and <em>italic</em>';
        apiDoc.appendInfoBox(parent, null, [], description);
    
        expect(parent.children.length).toBe(1);
        const descDiv = parent.children[0];
        expect(descDiv.innerHTML).toContain('<strong>Bold text</strong>');
        expect(descDiv.innerHTML).toContain('<em>italic</em>');
    });

    it('should handle single format in array', () => {
        apiDoc.appendInfoBox(parent, null, ['text/plain'], null);
    
        expect(parent.children.length).toBe(1);
        const formatsDiv = parent.children[0];
        expect(formatsDiv.innerHTML).toContain('<b>text/plain</b>');
    });

    it('should join multiple formats with comma and space', () => {
        apiDoc.appendInfoBox(parent, null, ['application/json', 'application/xml', 'text/html'], null);
    
        expect(parent.children.length).toBe(1);
        const formatsDiv = parent.children[0];
        expect(formatsDiv.innerHTML).toContain('<b>application/json</b>, <b>application/xml</b>, <b>text/html</b>');
    });

    it('should handle special characters in operationId', () => {
        apiDoc.appendInfoBox(parent, 'operation-with-special_chars$123', [], null);
    
        expect(parent.children.length).toBe(1);
        const opDiv = parent.children[0];
        expect(opDiv.innerHTML).toContain('operation-with-special_chars$123');
    });

    it('should preserve order: operationId, formats, description', () => {
        apiDoc.appendInfoBox(parent, 'op1', ['fmt1'], 'desc1');
    
        expect(parent.children[0].innerHTML).toContain('op1');
        expect(parent.children[1].innerHTML).toContain('fmt1');
        expect(parent.children[2].innerHTML).toContain('desc1');
    });

    it('should handle formats array with empty strings', () => {
        apiDoc.appendInfoBox(parent, null, ['', 'application/json', ''], null);
    
        expect(parent.children.length).toBe(1);
        const formatsDiv = parent.children[0];
        // Empty strings will create empty <b></b> tags
        expect(formatsDiv.innerHTML).not.toContain('<b></b>');
        expect(formatsDiv.innerHTML).toContain('<b>application/json</b>');
    });
});

describe('appendHeaderInfo', () => {
    let parent;

    beforeEach(() => {
        parent = document.createElement('div');
    });

    it('should handle null headerParams', () => {
        apiDoc.appendHeaderInfo(parent, null, ['application/json']);
        
        expect(parent.children.length).toBe(2);
        
        const table = parent.querySelector('.params-table');
        expect(table.rows.length).toBe(2); // Header + Accept row
        expect(table.rows[1].cells[0].textContent).toBe('Accept');
    });

    it('should handle undefined headerParams', () => {
        apiDoc.appendHeaderInfo(parent, undefined, ['application/json']);
        
        expect(parent.children.length).toBe(2);
        const table = parent.querySelector('.params-table');
        expect(table.rows.length).toBe(2);
    });

    it('should add default Accept header with single format', () => {
        apiDoc.appendHeaderInfo(parent, [], ['application/json']);
        
        const table = parent.querySelector('.params-table');
        expect(table.rows[1].cells[0].textContent).toBe('Accept');
        expect(table.rows[1].cells[2].textContent).toContain('Formats: */*');
    });

    it('should merge provided headerParams with default Accept header', () => {
        const headerParams = [
            { name: 'Authorization', type: 'string', description: 'Bearer token' }
        ];
        apiDoc.appendHeaderInfo(parent, headerParams, ['application/json']);
        
        const table = parent.querySelector('.params-table');
        expect(table.rows.length).toBe(3); // Header + Accept + Authorization
        expect(table.rows[1].cells[0].textContent).toBe('Accept');
        expect(table.rows[2].cells[0].textContent).toBe('Authorization');
    });

    it('should render all header parameter fields correctly', () => {
        const headerParams = [
            { 
                name: 'X-Custom-Header', 
                type: 'string', 
                description: 'Custom description',
            }
        ];
        apiDoc.appendHeaderInfo(parent, headerParams, ['application/json']);

        expect(parent.querySelector('.operation-block-section-header').textContent)
            .toBe(gematikLabels.apiDoc.HeaderParams_Header);

        const table = parent.querySelector('.params-table');
        expect(table.rows[0].cells.length).toBe(3);
        expect(table.rows[0].cells[0].textContent).toBe(gematikLabels.apiDoc.Parameter_Label);
        expect(table.rows[0].cells[1].textContent).toBe(gematikLabels.apiDoc.Type_Label);
        expect(table.rows[0].cells[2].textContent).toBe(gematikLabels.apiDoc.Description_Label);
        expect(table.rows[1].cells[0].textContent).toBe('Accept');
        expect(table.rows[1].cells[1].innerHTML).toBe('<code>string</code>');
        expect(table.rows[1].cells[2].textContent).toContain('*/*');
        const customRow = table.rows[2];
        expect(customRow.cells[0].textContent).toBe('X-Custom-Header');
        expect(customRow.cells[1].innerHTML).toContain('string');
        expect(customRow.cells[2].textContent).toBe('Custom description');
    });

    it('should handle empty formats array', () => {
        apiDoc.appendHeaderInfo(parent, [], []);
        
        const table = parent.querySelector('.params-table');
        expect(table.rows[1].cells[0].textContent).toBe('Accept');
        expect(table.rows[1].cells[1].innerHTML).toBe('<code>string</code>');
        expect(table.rows[1].cells[2].textContent).toContain('*/*');    });

    it('should handle null formats', () => {
        apiDoc.appendHeaderInfo(parent, [], null);
        
        const table = parent.querySelector('.params-table');
        expect(table.rows[1].cells[0].textContent).toBe('Accept');
        expect(table.rows[1].cells[1].innerHTML).toBe('<code>string</code>');
        expect(table.rows[1].cells[2].textContent).toContain('*/*');
    });

    it('should handle special characters in header names and descriptions', () => {
        const headerParams = [
            { name: 'X-Special-&<>', type: 'string', description: 'Special &<> chars' }
        ];
        apiDoc.appendHeaderInfo(parent, headerParams, ['application/json']);
        
        const table = parent.querySelector('.params-table');
        const specialRow = table.rows[2];
        expect(specialRow.cells[0].textContent).toBe('X-Special-&<>');
        expect(specialRow.cells[2].textContent).toBe('Special &<> chars');
    });
});

describe('appendExamples', () => {
    let parent;

    beforeEach(() => {
        parent = document.createElement('div');
    });

    it('should do nothing when both request and response examples are empty', () => {
        apiDoc.appendExamples(parent, [], []);
        
        expect(parent.children.length).toBe(0);
    });

    it('should add request examples section header when request examples exist', () => {
        const requestExamples = [
            { name: 'Request1', type: 'json', data: '{"key": "value"}' }
        ];

        apiDoc.appendExamples(parent, requestExamples, []);
        
        const sectionHeader = parent.querySelector('.operation-block-section-header');
        expect(sectionHeader).toBeTruthy();
        expect(sectionHeader.textContent).toBe(gematikLabels.apiDoc.RequestExample_Header);
    });

    it('should add response examples section header when response examples exist', () => {
        const responseExamples = [
            { name: 'Response1', type: 'json', data: '{"status": "ok"}' }
        ];

        apiDoc.appendExamples(parent, [], responseExamples);
        
        const sectionHeader = parent.querySelector('.operation-block-section-header');
        expect(sectionHeader).toBeTruthy();
        expect(sectionHeader.textContent).toBe(gematikLabels.apiDoc.ResponseExample_Header);
    });

    it('should add both request and response example section headers when both exist', () => {
        const requestExamples = [
            { name: 'Request1', type: 'json', data: '{"key": "value"}' }
        ];
        const responseExamples = [
            { name: 'Response1', type: 'json', data: '{"status": "ok"}' }
        ];

        apiDoc.appendExamples(parent, requestExamples, responseExamples);
        
        const sectionHeaders = parent.querySelectorAll('.operation-block-section-header');
        expect(sectionHeaders.length).toBe(2);
        expect(sectionHeaders[0].textContent).toBe(gematikLabels.apiDoc.RequestExample_Header);
        expect(sectionHeaders[1].textContent).toBe(gematikLabels.apiDoc.ResponseExample_Header);
    });

    it('should handle multiple request examples', () => {
        const requestExamples = [
            { name: 'Request1', type: 'json', data: '{"key1": "value1"}' },
            { name: 'Request2', type: 'xml', data: '<request>data</request>' }
        ];

        apiDoc.appendExamples(parent, requestExamples, []);
        
        const sectionHeader = parent.querySelector('.operation-block-section-header');
        expect(sectionHeader.textContent).toBe(gematikLabels.apiDoc.RequestExample_Header);
        
        const exampleButtonContainer = parent.querySelector('.operation-block-description');
        expect(exampleButtonContainer.children.length).toBe(requestExamples.length);
    });

    it('should handle multiple response examples', () => {
        const responseExamples = [
            { name: 'Response1', type: 'json', data: '{"status1": "ok"}' },
            { name: 'Response2', type: 'xml', data: '<response>data</response>' }
        ];

        apiDoc.appendExamples(parent, [], responseExamples);
        
        const sectionHeader = parent.querySelector('.operation-block-section-header');
        expect(sectionHeader.textContent).toBe(gematikLabels.apiDoc.ResponseExample_Header);
        
        const exampleButtonContainer = parent.querySelector('.operation-block-description');
        expect(exampleButtonContainer.children.length).toBe(responseExamples.length);
    });

    it('should handle empty data in examples', () => {
        const requestExamples = [
            { name: 'Request1', type: 'json', data: '' }
        ];

        apiDoc.appendExamples(parent, requestExamples, []);
        
        const sectionHeader = parent.querySelector('.operation-block-section-header');
        expect(sectionHeader.textContent).toBe(gematikLabels.apiDoc.RequestExample_Header);
    });

    it('should handle null or undefined examples', () => {
        apiDoc.appendExamples(parent, null, undefined);
        
        expect(parent.children.length).toBe(0);
    });

    it('should handle special characters in example names', () => {
        const requestExamples = [
            { name: 'Request-with_special&chars', type: 'json', data: '{"key": "value"}' }
        ];

        apiDoc.appendExamples(parent, requestExamples, []);
        
        const buttons = parent.querySelectorAll('button.example');
        expect(buttons[0].textContent).toContain('Request-with_special&chars');
    });

    it('should preserve order of examples', () => {
        const requestExamples = [
            { name: 'First', type: 'json', data: '{"first": true}' },
            { name: 'Second', type: 'xml', data: '<second>data</second>' }
        ];

        const responseExamples = [
            { name: 'Response1', type: 'json', data: '{"status1": "ok"}' },
            { name: 'Response2', type: 'xml', data: '<response>data</response>' }
        ];

        apiDoc.appendExamples(parent, requestExamples, responseExamples);
        
        const buttons = parent.querySelectorAll('button.example .label');
        expect(buttons[0].textContent).toBe('JSON');
        expect(buttons[1].textContent).toBe('XML');
        expect(buttons[2].textContent).toBe('JSON');
        expect(buttons[3].textContent).toBe('XML');
    });
});

describe('appendResponseInfo', () => {
    let parent;

    beforeEach(() => {
        parent = document.createElement('div');
    });

    it('should append nothing when responseInfos is null', () => {
        apiDoc.appendResponseInfo(parent, null);
        expect(parent.children.length).toBe(0);
    });

    it('should append nothing when responseInfos is undefined', () => {
        apiDoc.appendResponseInfo(parent, undefined);
        expect(parent.children.length).toBe(0);
    });

    it('should append nothing when responseInfos is empty array', () => {
        apiDoc.appendResponseInfo(parent, []);
        expect(parent.children.length).toBe(0);
    });

    it('should append header and table for single response info', () => {
        const responseInfos = [{
            statusCode: '200',
            description: 'Success',
            errorCode: 'N/A',
            responseType: 'application/json'
        }];

        apiDoc.appendResponseInfo(parent, responseInfos);

        expect(parent.children.length).toBe(2);
        expect(parent.children[0].classList.contains('operation-block-section-header')).toBe(true);
        expect(parent.children[0].innerHTML).toBe(gematikLabels.apiDoc.Response_Header);
        expect(parent.children[1].classList.contains('operation-block-description')).toBe(true);
        expect(parent.children[1].classList.contains('with-table')).toBe(true);
    });

    it('should sort response infos by status code numerically', () => {
        const responseInfos = [
            { statusCode: '500', description: 'Server Error', errorCode: 'ERR500', responseType: 'text/plain' },
            { statusCode: '200', description: 'Success', errorCode: 'N/A', responseType: 'application/json' },
            { statusCode: '404', description: 'Not Found', errorCode: 'ERR404', responseType: 'text/html' }
        ];

        apiDoc.appendResponseInfo(parent, responseInfos);

        const tbody = parent.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        
        expect(rows.length).toBe(3);
        expect(rows[0].querySelector('td').innerHTML).toBe('<code>200</code>');
        expect(rows[1].querySelector('td').innerHTML).toBe('<code>404</code>');
        expect(rows[2].querySelector('td').innerHTML).toBe('<code>500</code>');
    });

    it('should use empty string for missing description', () => {
        const responseInfos = [{
            statusCode: '200',
            errorCode: 'N/A',
            responseType: 'application/json'
        }];

        apiDoc.appendResponseInfo(parent, responseInfos);

        const tbody = parent.querySelector('tbody');
        const cells = tbody.querySelector('tr').querySelectorAll('td');
        
        expect(cells[1].innerHTML).toBe('');
    });

    it('should create table with correct headers', () => {
        const responseInfos = [{
            statusCode: '200',
            description: 'Success',
            errorCode: 'N/A',
            responseType: 'application/json'
        }];

        apiDoc.appendResponseInfo(parent, responseInfos);

        const thead = parent.querySelector('thead');
        const headers = thead.querySelectorAll('th');
        
        expect(headers.length).toBe(4);
        expect(headers[0].innerHTML).toBe(gematikLabels.apiDoc.StatusCode_Label);
        expect(headers[1].innerHTML).toBe(gematikLabels.apiDoc.Description_Label);
        expect(headers[2].innerHTML).toBe(gematikLabels.apiDoc.ErrorCode_Label);
        expect(headers[3].innerHTML).toBe(gematikLabels.apiDoc.Response_Type);
    });

    it('should wrap status code in code tags', () => {
        const responseInfos = [{
            statusCode: '201',
            description: 'Created',
            errorCode: 'N/A',
            responseType: 'application/json'
        }];

        apiDoc.appendResponseInfo(parent, responseInfos);

        const tbody = parent.querySelector('tbody');
        const firstCell = tbody.querySelector('td');
        
        expect(firstCell.innerHTML).toBe('<code>201</code>');
    });

    it('should not mutate original responseInfos array', () => {
        const responseInfos = [
            { statusCode: '500', description: 'Server Error', errorCode: 'ERR500', responseType: 'text/plain' },
            { statusCode: '200', description: 'Success', errorCode: 'N/A', responseType: 'application/json' }
        ];
        const originalOrder = [...responseInfos];

        apiDoc.appendResponseInfo(parent, responseInfos);

        expect(responseInfos).toEqual(originalOrder);
    });

    it('should not escape HTML special characters in description', () => {
        const responseInfos = [{
            statusCode: '400',
            description: '<div>Some nested text</div>',
            errorCode: 'ERR400',
            responseType: 'text/html'
        }];

        apiDoc.appendResponseInfo(parent, responseInfos);

        const tbody = parent.querySelector('tbody');
        const cells = tbody.querySelector('tr').querySelectorAll('td');
        
        expect(cells[1].innerHTML).toBe('<div>Some nested text</div>');
    });

    it('should handle multiple responses with same status code', () => {
        const responseInfos = [
            { statusCode: '200', description: 'Success 1', errorCode: 'N/A', responseType: 'application/json' },
            { statusCode: '200', description: 'Success 2', errorCode: 'N/A', responseType: 'application/xml' }
        ];

        apiDoc.appendResponseInfo(parent, responseInfos);

        const tbody = parent.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        
        expect(rows.length).toBe(2);
    });
});

describe('appendSearchParameters', () => {
    let parent;

    beforeEach(() => {
        parent = document.createElement('div');
    });

    it('should do nothing when params is null', () => {
        apiDoc.appendSearchParameters(parent, null, 'GET');
        expect(parent.children.length).toBe(0);
    });

    it('should do nothing when params is an empty array', () => {
        apiDoc.appendSearchParameters(parent, [], 'GET');
        expect(parent.children.length).toBe(0);
    });

    it('should filter out parameters named "resource"', () => {
        const params = [
            { name: 'resource', type: 'Resource', documentation: 'Resource parameter' },
            { name: 'status', type: 'token', documentation: 'Status parameter' }
        ];

        apiDoc.appendSearchParameters(parent, params, 'GET');

        const table = parent.querySelector('.params-table');
        expect(table.rows.length).toBe(2); // Header + status row
        expect(table.rows[1].cells[0].textContent).toBe('status');
    });

    it('should add _format parameter when multiple formats exist', () => {
        const params = [
            { name: 'status', type: 'token', documentation: 'Status parameter' }
        ];
        const formats = ['application/json', 'application/xml'];

        apiDoc.appendSearchParameters(parent, params, 'GET', formats);

        const table = parent.querySelector('.params-table');
        const formatRow = table.rows[1];
        expect(formatRow.cells[0].textContent).toBe('_format');
        expect(formatRow.cells[1].innerHTML).toBe('<code>string</code>');
        expect(formatRow.cells[2].textContent).toContain('application/json, application/xml');
    });

    it('should not add _format parameter when only one format exists', () => {
        const params = [
            { name: 'status', type: 'token', documentation: 'Status parameter' }
        ];
        const formats = ['application/json'];

        apiDoc.appendSearchParameters(parent, params, 'GET', formats);

        const table = parent.querySelector('.params-table');
        expect(table.rows.length).toBe(2); // Header + status row
        expect(table.rows[1].cells[0].textContent).toBe('status');
    });

    it('should not add _format parameter when _format already exists', () => {
        const params = [
            { name: '_format', type: 'string', documentation: 'Existing format parameter' },
            { name: 'status', type: 'token', documentation: 'Status parameter' }
        ];
        const formats = ['application/json', 'application/xml'];

        apiDoc.appendSearchParameters(parent, params, 'GET', formats);

        const table = parent.querySelector('.params-table');
        const formatRow = table.rows[1];
        expect(formatRow.cells[0].textContent).toBe('_format');
        expect(formatRow.cells[2].textContent).toBe('Existing format parameter');
    });

    it('should create table with correct headers', () => {
        const params = [
            { name: 'status', type: 'token', documentation: 'Status parameter' }
        ];

        apiDoc.appendSearchParameters(parent, params, 'GET');

        const table = parent.querySelector('.params-table');
        const headers = table.querySelectorAll('thead th');
        expect(headers[0].textContent).toBe(gematikLabels.apiDoc.Parameter_Label);
        expect(headers[1].textContent).toBe(gematikLabels.apiDoc.Type_Label);
        expect(headers[2].textContent).toBe(gematikLabels.apiDoc.Documentation_Label);
    });

    it('should handle parameters with empty documentation', () => {
        const params = [
            { name: 'status', type: 'token', documentation: '' }
        ];

        apiDoc.appendSearchParameters(parent, params, 'GET');

        const table = parent.querySelector('.params-table');
        const paramRow = table.rows[1];
        expect(paramRow.cells[2].textContent).toBe('');
    });

    it('should handle null formats', () => {
        const params = [
            { name: 'status', type: 'token', documentation: 'Status parameter' }
        ];

        apiDoc.appendSearchParameters(parent, params, 'GET', null);

        const table = parent.querySelector('.params-table');
        expect(table.rows.length).toBe(2); // Header + status row
    });

    it('should handle empty formats array', () => {
        const params = [
            { name: 'status', type: 'token', documentation: 'Status parameter' }
        ];

        apiDoc.appendSearchParameters(parent, params, 'GET', []);

        const table = parent.querySelector('.params-table');
        expect(table.rows.length).toBe(2); // Header + status row
    });

    it('should add section header for search parameters', () => {
        const params = [
            { name: 'status', type: 'token', documentation: 'Status parameter' }
        ];

        apiDoc.appendSearchParameters(parent, params, 'GET');

        const sectionHeader = parent.querySelector('.operation-block-section-header');
        expect(sectionHeader.textContent).toBe(gematikLabels.apiDoc.SearchParams_Header);
    });
});
